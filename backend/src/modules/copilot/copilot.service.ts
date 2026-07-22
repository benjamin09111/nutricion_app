import { Injectable, Logger } from '@nestjs/common';
import { ToolLoopAgent, tool, isStepCount } from 'ai';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../common/services/ai.service';
import { PlanUsageService } from '../permissions/plan-usage.service';

const AGENT_INSTRUCTIONS = `# Copiloto Clinico de NutriNet

## Identidad
Soy el **Copiloto Clinico de NutriNet**, un asistente especializado para nutricionistas que ejercen en Chile. Mi proposito es agilizar el trabajo clinico diario: generar recetas, validar restricciones, calcular macros, crear pautas alimentarias y responder dudas nutricionales.

## Conocimiento del Dominio

### Sistema Chileno de Porciones de Intercambio
- Los alimentos se agrupan en categorias con porciones estandar
- Cada porcion tiene un aporte nutricional definido (calorias, proteinas, carbohidratos, lipidos)
- Las porciones se ajustan segun edad, peso, altura, nivel de actividad y objetivo del paciente

### Alimentos Chilenos Comunes
- **Desayuno/Once**: pan (hallulla, marraqueta, molde), palta, huevo, queso fresco, jamon, mermelada, te, cafe, leche
- **Almuerzo/Cena**: pollo, pavo, vacuno, cerdo, pescado (reineta, salmon, merluza, jurel), legumbres (lentejas, porotos, garbanzos), arroz, fideos, papas, verduras de estacion, ensaladas chilenas (tomate, lechuga, cebolla)
- **Supermercados**: Lider, Jumbo, Santa Isabel, Unimarc, Tottus

### Reglas Clinicas
1. Verificar restricciones SIEMPRE antes de sugerir cualquier alimento
2. NUNCA inventar datos clinicos — si no sabes, dilo claramente
3. Respetar alergias e intolerancias — son restricciones absolutas
4. Alimentos reales y accesibles en Chile
5. Porciones realistas basadas en sistema chileno
6. Preferir recetas simples, caseras, pocos ingredientes

### Restricciones Clinicas Comunes
- Diabetes: evitar azucares refinados, preferir carbohidratos complejos
- Hipertension: evitar sodio, embutidos, procesados
- Celiaquia: evitar trigo, cebada, centeno; usar arroz, quinoa, maiz
- Intolerancia a lactosa: evitar leche, quesos frescos; usar deslactosados
- Vegetariano: evitar carnes; incluir legumbres, huevos, lacteos
- Vegano: evitar todo producto animal; asegurar B12, hierro, calcio
- Renal: controlar potasio, fosforo, sodio, proteinas segun etapa
- Higado graso: evitar alcohol, azucares refinados, grasas saturadas, frituras

## Herramientas Disponibles
Usa las herramientas a tu disposicion. Si necesitas datos de la base de datos del nutricionista, usa buscarAlimentos u obtenerPaciente. Si necesitas validar restricciones, usa verificarRestricciones. Si necesitas estimar macros, usa calcularMacros. Si necesitas crear una receta, usa generarReceta.`;

@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name);
  private readonly memory = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly planUsageService: PlanUsageService,
  ) {}

  private buildAgent(accountId?: string) {
    const modelConfig = this.aiService.resolvePreferredModelConfig();
    if (!modelConfig) {
      throw new Error('No AI provider configured for CopilotService');
    }

    return new ToolLoopAgent({
      model: modelConfig.model,
      instructions: AGENT_INSTRUCTIONS,
      temperature: 0.2,
      stopWhen: [
        // max 10 steps, each step is a tool call or text response
        isStepCount(10),
      ],
      tools: {
        buscarAlimentos: tool({
          description:
            'Buscar alimentos en el catalogo del nutricionista. Filtra por nombre, categoria o keywords.',
          inputSchema: z.object({
            query: z
              .string()
              .describe(
                'Texto de busqueda (nombre parcial, categoria, tipo de alimento)',
              ),
            limite: z
              .number()
              .optional()
              .describe('Maximo de resultados (default 10)'),
          }),
          execute: async ({ query, limite }) => {
            const ingredients = await this.prisma.ingredient.findMany({
              where: {
                isPublic: true,
                name: { contains: query, mode: 'insensitive' },
              },
              select: {
                id: true,
                name: true,
                calories: true,
                proteins: true,
                carbs: true,
                lipids: true,
                fiber: true,
                categoryId: true,
                unit: true,
                amount: true,
              },
              take: limite || 10,
            });
            return {
              encontrados: ingredients.length,
              alimentos: ingredients.map((i) => ({
                id: i.id,
                nombre: i.name,
                calorias: Number(i.calories ?? 0),
                proteinas: Number(i.proteins ?? 0),
                carbohidratos: Number(i.carbs ?? 0),
                grasas: Number(i.lipids ?? 0),
                fibra: Number(i.fiber ?? 0),
                porcion: `${i.amount ?? 100}${i.unit ?? 'g'}`,
              })),
            };
          },
        }),

        obtenerPaciente: tool({
          description:
            'Obtener perfil clinico de un paciente incluyendo restricciones, objetivos y datos antropometricos.',
          inputSchema: z.object({
            pacienteId: z.string().describe('ID del paciente (UUID)'),
          }),
          execute: async ({ pacienteId }) => {
            const patient = await this.prisma.patient.findUnique({
              where: { id: pacienteId },
              select: {
                id: true,
                fullName: true,
                age: true,
                gender: true,
                weight: true,
                height: true,
                nutritionalFocus: true,
                fitnessGoals: true,
                activityLevel: true,
                dietRestrictions: true,
                likes: true,
                clinicalSummary: true,
              },
            });
            if (!patient) return { error: 'Paciente no encontrado' };

            const context = this.aiService.formatPatientContext({
              ageYears: patient.age,
              gender: patient.gender,
              weightKg: patient.weight,
              heightCm: patient.height,
              nutritionalFocus: patient.nutritionalFocus,
              fitnessGoals: patient.fitnessGoals,
              likes: patient.likes,
              dietRestrictions: patient.dietRestrictions,
              clinicalSummary: patient.clinicalSummary,
            });

            return {
              nombre: patient.fullName,
              edad: patient.age,
              genero: patient.gender,
              peso: patient.weight ? `${patient.weight}kg` : null,
              altura: patient.height ? `${patient.height}cm` : null,
              objetivoNutricional: patient.nutritionalFocus,
              objetivoFitness: patient.fitnessGoals,
              nivelActividad: patient.activityLevel,
              restricciones: patient.dietRestrictions,
              gustos: patient.likes,
              resumenClinico: patient.clinicalSummary,
              contextoCompacto: context,
            };
          },
        }),

        verificarRestricciones: tool({
          description:
            'Verificar si alimentos entran en conflicto con las restricciones clinicas de un paciente.',
          inputSchema: z.object({
            alimentos: z
              .array(z.string())
              .describe('Nombres de alimentos a verificar'),
            restricciones: z
              .array(z.string())
              .describe('Restricciones clinicas del paciente'),
          }),
          execute: async ({ alimentos, restricciones }) => {
            const conflicts: Array<{
              alimento: string;
              restriccion: string;
              razon: string;
              severidad: string;
            }> = [];

            const rules: Record<string, { forbids: RegExp[]; reason: string }> =
              {
                diabetes: {
                  forbids: [
                    /az[uú]car/i,
                    /dulce/i,
                    /miel/i,
                    /jarabe/i,
                    /gaseosa/i,
                    /bebida/i,
                    /chocolate/i,
                    /pastel/i,
                    /queque/i,
                    /gallet[ií]a/i,
                  ],
                  reason: 'Alto indice glicemico, incompatible con diabetes',
                },
                hipertension: {
                  forbids: [
                    /embutido/i,
                    /salchicha/i,
                    /jamon/i,
                    /cecina/i,
                    /sopaipilla/i,
                    /papas fritas/i,
                    /snack/i,
                    /salsa de soya/i,
                  ],
                  reason:
                    'Alto contenido de sodio, incompatible con hipertension',
                },
                celiaquia: {
                  forbids: [
                    /trigo/i,
                    /cebada/i,
                    /centeno/i,
                    /pan(?!\s+sin\s+gluten)/i,
                    /pasta(?!\s+sin\s+gluten)/i,
                    /gallet[ií]a(?!\s+sin\s+gluten)/i,
                    /fideos(?!\s+de\s+arroz)/i,
                  ],
                  reason: 'Contiene gluten, incompatible con celiaquia',
                },
                'intolerancia a la lactosa': {
                  forbids: [
                    /leche(?!\s+deslactosada|\s+vegetal)/i,
                    /queso\s+fresco/i,
                    /yogurt(?!\s+sin\s+lactosa)/i,
                    /manjar/i,
                    /crema/i,
                  ],
                  reason:
                    'Contiene lactosa, incompatible con intolerancia a la lactosa',
                },
                vegetariano: {
                  forbids: [
                    /pollo/i,
                    /vacuno/i,
                    /cerdo/i,
                    /pescado/i,
                    /marisco/i,
                    /jamon/i,
                    /salmon/i,
                    /reineta/i,
                    /carne/i,
                  ],
                  reason:
                    'Producto de origen animal, incompatible con dieta vegetariana',
                },
              };

            for (const restriction of restricciones) {
              const key = Object.keys(rules).find((k) =>
                restriction.toLowerCase().includes(k),
              );
              if (!key) continue;
              const rule = rules[key];

              for (const alimento of alimentos) {
                for (const pattern of rule.forbids) {
                  if (pattern.test(alimento)) {
                    conflicts.push({
                      alimento,
                      restriccion: restriction,
                      razon: rule.reason,
                      severidad: 'alta',
                    });
                    break;
                  }
                }
              }
            }

            return {
              totalConflictos: conflicts.length,
              conflictos: conflicts,
              seguro: conflicts.length === 0,
            };
          },
        }),

        calcularMacros: tool({
          description:
            'Estimar aporte nutricional (calorias, proteinas, carbohidratos, grasas) de una lista de ingredientes.',
          inputSchema: z.object({
            ingredientes: z
              .array(
                z.object({
                  nombre: z.string(),
                  cantidad: z.string().optional(),
                }),
              )
              .describe('Lista de ingredientes con sus cantidades'),
          }),
          execute: async ({ ingredientes }) => {
            const names = ingredientes.map(
              (i) => `${i.nombre}${i.cantidad ? ` (${i.cantidad})` : ''}`,
            );
            try {
              if (accountId) {
                await this.planUsageService.consumeQuota(
                  accountId,
                  'ai.calls.limit',
                );
              }
              const result = await this.aiService.callJson(
                'Eres un nutricionista. Estima valores nutricionales por porcion. Responde solo JSON valido.',
                `Estima los macros para:\n${names.join('\n')}\n\nResponde: {"calorias": numero, "proteinas": numero, "carbohidratos": numero, "grasas": numero}`,
              );
              const parsed = JSON.parse(result);
              return {
                calorias: Math.round(parsed.calorias || parsed.calories || 0),
                proteinas: Math.round(parsed.proteinas || parsed.proteins || 0),
                carbohidratos: Math.round(
                  parsed.carbohidratos || parsed.carbs || 0,
                ),
                grasas: Math.round(
                  parsed.grasas || parsed.fats || parsed.lipids || 0,
                ),
              };
            } catch {
              return {
                calorias: 0,
                proteinas: 0,
                carbohidratos: 0,
                grasas: 0,
                error: 'No se pudo estimar',
              };
            }
          },
        }),

        generarReceta: tool({
          description:
            'Generar una receta personalizada para un tipo de comida, considerando restricciones y preferencias.',
          inputSchema: z.object({
            tipoComida: z.enum([
              'desayuno',
              'almuerzo',
              'once',
              'cena',
              'merienda',
            ]),
            restricciones: z.array(z.string()).optional(),
            preferencias: z.string().optional(),
            maxIngredientes: z.number().optional().default(6),
          }),
          execute: async ({
            tipoComida,
            restricciones,
            preferencias,
            maxIngredientes,
          }) => {
            const restriccionesStr = restricciones?.length
              ? `Restricciones: ${restricciones.join(', ')}. `
              : '';
            const preferenciasStr = preferencias
              ? `Preferencias: ${preferencias}. `
              : '';
            try {
              if (accountId) {
                await this.planUsageService.consumeQuota(
                  accountId,
                  'ai.calls.limit',
                );
              }
              const result = await this.aiService.callJson(
                'Eres un nutricionista chileno experto en crear recetas. Responde solo JSON valido.',
                `Genera una receta para ${tipoComida}. ${restriccionesStr}${preferenciasStr}Max ${maxIngredientes} ingredientes principales. Plato simple, casero, chileno.\n\nResponde: {"titulo":"string","descripcion":"string","preparacion":"string","porcionRecomendada":"string","calorias":0,"proteinas":0,"carbohidratos":0,"grasas":0,"ingredientes":[{"nombre":"string","cantidad":"string"}]}`,
              );
              return JSON.parse(result);
            } catch {
              return { error: 'No se pudo generar la receta' };
            }
          },
        }),

        recordar: tool({
          description:
            'Guardar informacion importante en la memoria del agente para sesiones futuras.',
          inputSchema: z.object({
            clave: z
              .string()
              .describe('Clave unica para recuperar esta informacion'),
            valor: z.string().describe('Valor a guardar'),
          }),
          execute: ({ clave, valor }) => {
            this.memory.set(clave, valor);
            this.logger.log(`[Memory] Stored: ${clave}`);
            return { ok: true, clave };
          },
        }),

        evocar: tool({
          description:
            'Recuperar informacion guardada previamente en la memoria del agente.',
          inputSchema: z.object({
            clave: z.string().describe('Clave de la informacion a recuperar'),
          }),
          execute: ({ clave }) => {
            const value = this.memory.get(clave);
            return value
              ? { encontrado: true, clave, valor: value }
              : { encontrado: false, clave };
          },
        }),
      },
    });
  }

  async chat(prompt: string, accountId?: string) {
    return this.buildAgent(accountId).stream({ prompt });
  }

  getAgent(accountId?: string) {
    return this.buildAgent(accountId);
  }
}
