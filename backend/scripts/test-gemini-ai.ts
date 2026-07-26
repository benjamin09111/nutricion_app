import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const IngredienteSchema = z.object({
  nombre: z.string().describe('Nombre del ingrediente permitido'),
  cantidad: z
    .string()
    .describe('Cantidad exacta con unidad de medida (ej. 150g, 2 unidades)'),
});

const RecetaSchema = z.object({
  nombre_plato: z.string().describe('Nombre de la receta'),
  ingredientes: z
    .array(IngredienteSchema)
    .describe('Lista de ingredientes obligatorios'),
  instrucciones: z
    .array(z.string())
    .describe('Pasos cronológicos para la preparación'),
});

const MenuDiaSchema = z.object({
  desayuno: RecetaSchema,
  almuerzo: RecetaSchema,
  cena: RecetaSchema,
  calorias_totales_estimadas: z
    .number()
    .describe('Suma aproximada de calorías del día'),
});

async function runGeminiTest() {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const modelId = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  console.log('=== TEST DE INTEGRACIÓN GEMINI AI ===');
  console.log(`Clave API detectada: ${apiKey ? 'SI (oculta)' : 'NO'}`);
  console.log(`Modelo a utilizar: ${modelId}`);

  if (!apiKey) {
    console.error('ERROR: No se encontró GEMINI_API_KEY en el archivo .env');
    process.exit(1);
  }

  const google = createGoogleGenerativeAI({ apiKey });

  const systemInstruction =
    'Eres un software automatizado de nutrición clínica. Genera menús diarios estructurados basándote ESTRICTAMENTE en el perfil del paciente.';

  const userPrompt = `
  CONTEXTO DEL PACIENTE:
  - Diagnóstico: Diabético Tipo 2, Hipertenso.
  - Objetivo calórico: 1800 kcal diarias.

  ALIMENTOS PERMITIDOS (RESTRICCIÓN ESTRICTA):
  - Proteínas: Pollo, pavo, claras de huevo, merluza.
  - Carbohidratos: Quinoa, avena integral, arroz integral.
  - Grasas saludables: Aceite de oliva, aguacate (palta).
  - Verduras: Espinacas, brócoli, pepino, calabacín.

  Genera el menú completo para 1 día utilizando únicamente los elementos anteriores.
  `;

  try {
    console.log('Enviando solicitud a Gemini API (Structured Outputs)...');
    const start = Date.now();

    const { object } = await generateObject({
      model: google(modelId),
      schema: MenuDiaSchema,
      system: systemInstruction,
      prompt: userPrompt,
      temperature: 0.1,
      providerOptions: {
        google: {
          structuredOutputs: true,
        },
      },
    });

    const elapsed = Date.now() - start;
    console.log(`\n¡ÉXITO! Respuesta estructurada recibida en ${elapsed}ms:\n`);
    console.log(JSON.stringify(object, null, 2));
    console.log('\n======================================');
  } catch (error) {
    console.error('\nERROR durante la generación con Gemini:', error);
    process.exit(1);
  }
}

runGeminiTest();
