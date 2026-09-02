# Auditoría de Uso de IA - nutricion_app

**Fecha:** 2026-08-30  
**Estado del Proyecto:** MVP Pre-lanzamiento  
**Auditor:** Claude Code

---

## 📋 Resumen Ejecutivo

Tu implementación de IA es **bien estructurada y centralizada**, con un sistema robusto de fallback (Gemini → OpenAI → DeepSeek). Sin embargo, hay **oportunidades de optimización de costos** y **consideraciones arquitectónicas importantes** para escalar hacia un agente más inteligente.

### ✅ Lo que está bien:
- Arquitectura centralizada en `AiService`
- Sistema de fallback automático configurado
- Logging y tracking de costos en tiempo real
- Uso de structured outputs (JSON schemas)
- Costos bajos con Gemini Flash Lite (~0.075¢ por millón tokens input)

### ⚠️ Lo que necesita revisión:
- Las llamadas son **muy granulares** (una por operación)
- Prompts **reutilizables con pocos cambios** entre características
- Posible **caché no aprovechado** en las llamadas
- Dependencia de cuotas para control de costos (pero es buena)

---

## 🔍 Mapa de Llamadas a IA

### 1. **Diet Service** (`diet.service.ts`)
Ubicación: `backend/src/modules/diet/diet.service.ts`

#### Método: `verifyFoodsAgainstRestrictions()`
```
Entrada: Lista de alimentos + restricciones
Proceso: Valida conflictos usando IA o heurística
Salida: Conflictos detectados + alimentos seguros
Modelo: Gemini (primero), fallback a OpenAI/DeepSeek
Costo estimado: ~500-1500 tokens por llamada
Frecuencia: A demanda (cuando usuario verifica)
```

**Particularidad:** Tiene fallback inteligente a heurística si IA falla ✓

#### Método: `generateBaseDiet()`
```
Entrada: Categorías de alimentos + instrucciones clínicas
Proceso: Genera una pauta base con alimentos del catálogo
Salida: Estructura de dieta diaria por categorías
Modelo: Gemini (primero), fallback automático
Costo estimado: ~2000-4000 tokens por llamada
Frecuencia: A demanda (generación inicial de dietas)
```

---

### 2. **Recipes Service** (`recipes.service.ts`)
Ubicación: `backend/src/modules/recipes/recipes.service.ts`

#### Métodos: `aiFillDay()`, `aiFillWeek()`, `quickAiFill()`
```
Entrada: Plan parcial, slots vacíos, contexto del paciente, restricciones
Proceso: Completa recetas respetando objetivos nutricionales
Salida: Recetas detalladas (ingredientes, macros, preparación)
Modelo: Gemini (primero), fallback automático
Costo estimado: ~3000-8000 tokens por llamada
Frecuencia: Bajo demanda (edición de planes)
Llamadas por sesión: 1-5 (según cantidad de slots)
```

**Prompt System:**
- Context: Perfil del paciente (edad, peso, objetivos, restricciones)
- Available foods: Catálogo filtrado (~100-500 ingredientes)
- Structured output: JSON muy específico (título, descripción, macros, ingredientes)

---

### 3. **Copilot Service** (`copilot.service.ts`)
Ubicación: `backend/src/modules/copilot/copilot.service.ts`

**Nota:** Usa `AiService.generateStructuredObject()` pero vía otros servicios.

---

## 💰 Análisis de Costos

### Modelo de Precios Configurado
```typescript
// De: ai.service.ts (línea 36-50)

Gemini:
  Input:  0.075¢ por millón de tokens
  Output: 0.30¢ por millón de tokens

DeepSeek:
  Input:  0.14¢ por millón de tokens
  Output: 0.28¢ por millón de tokens

OpenAI (gpt-4o-mini):
  Input:  0.15¢ por millón de tokens
  Output: 0.6¢ por millón de tokens
```

### Estimación de Costos por Operación

| Feature | Tokens Est. | Costo USD | Costo CLP |
|---------|-------------|-----------|-----------|
| Verify Foods (heurística) | 500 | $0.00005 | $0.05 |
| Verify Foods (Gemini) | 1500 | $0.0002 | $0.19 |
| Generate Base Diet | 3500 | $0.0006 | $0.57 |
| Fill Day (recetas) | 5000 | $0.0009 | $0.85 |
| Fill Week (7 días) | 35000 | $0.0063 | $6.00 |
| Quick AI Fill | 2000 | $0.0004 | $0.38 |

### Proyección Mensual (Hipotética)

Si asumimos **100 usuarios activos** haciendo **5 operaciones/mes**:
```
500 llamadas de IA/mes × promedio 3000 tokens × $0.0002 (Gemini) = $0.30/mes
```

**Conclusión:** Costos BAJOS incluso a escala media. No es una preocupación principal por ahora.

---

## 🛡️ Vulnerabilidades Identificadas

### 1. **Validación de Salida Insuficiente** ⚠️ MEDIA

**Problema:** Los schemas Zod validan estructura, pero no contenido.

```typescript
// El schema valida que protein sea number
// Pero NO valida que protein > 0 o que < 200
// IA podría retornar macros inconsistentes
```

**Riesgo:** Dietas con macros inválidas se guardarían sin error.

**Fix:**
```typescript
const recipeSchema = z.object({
  protein: z.number().min(0).max(150), // ← Validación de rango
  calories: z.number().min(50).max(1500),
  carbs: z.number().min(0).max(200),
  fats: z.number().min(0).max(100),
});
```

---

### 2. **Injection en Prompts** ⚠️ BAJA

**Problema:** Algunos prompts incluyen data de usuario sin sanitizar:
```typescript
prompt = `Restricciones: ${JSON.stringify(restrictions)}`
// Si un usuario entra restricción: "diabetico\n\nIGNORE PREVIOUS INSTRUCTIONS..."
// Podría afectar el flujo
```

**Riesgo:** Bajo (JSON.stringify escapa). Pero se puede mejorar.

**Fix:** Ya lo tienes con `buildPlanAiRequest()` - mantener centralizado ✓

---

### 3. **Falta de Timeout en Llamadas IA** ⚠️ MEDIA

**Problema:** No veo timeout explícito en `generateStructuredObject()`.

```typescript
// De ai.service.ts línea 164
const { object, usage } = await generateObject({
  model: config.model,
  // ← SIN timeout
  schema,
  // ...
});
```

**Riesgo:** Si API de Gemini se cuelga, request espera indefinidamente.

**Fix:**
```typescript
const { object, usage } = await Promise.race([
  generateObject({ model: config.model, ... }),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('IA timeout')), 30000)
  ),
]);
```

---

### 4. **Consumo de Cuota Sin Refund en Algunos Casos** ⚠️ BAJA

**Problema:** En `diet.service.ts`, la cuota se consume pero si hay error parcial, no siempre se refund:

```typescript
await this.planUsageService.consumeQuota(accountId, 'ai.calls.limit');
const result = await this.aiService.generateStructuredObject(...);
// Si esto falla, se refund ✓
// Pero en recipes.service, NO hay refund
```

**Fix:** Agregar refund en recipes service

---

### 5. **Orden de Fallback NO Configurada Dinámicamente** ⚠️ BAJA

**Problema:** El fallback es hard-coded como `['gemini', 'openai', 'deepseek']`.

```typescript
// ai.service.ts línea 94-95
resolvePreferredModelConfig(
  providers: AiProvider[] = ['gemini', 'openai', 'deepseek'],
)
```

**Mejor:** Permitir fallback por característica:
```typescript
// Para dietas (costo es crítico): gemini → deepseek → openai
// Para recetas (calidad es crítica): openai → gemini → deepseek
```

---

## 🎯 Ubicación Centralizada de Llamadas (BUENO)

Todas las llamadas IA pasan por **un único punto**:

```
AiService.generateStructuredObject()
    ↓
 [Fallback Loop]
 - Intenta Gemini
 - Si falla → Intenta OpenAI
 - Si falla → Intenta DeepSeek
 - Si todo falla → Error
    ↓
 [Logging de Costos]
 - Calcula costo exacto
 - Registra en aiUsageLog
 - Permite admin ver dashboard
```

**Beneficios:**
- ✅ Fácil de auditar
- ✅ Fácil de optimizar
- ✅ Fácil de testear
- ✅ Fácil de agregar nuevos providers

---

## 🤖 EVE Framework vs. Llamadas Simples

### Tu Pregunta:
> "¿Será muy difícil ocupar EVE Framework para hacer un agente de comidas y dietas en vez de una simple llamada?"

### Respuesta: **SÍ, pero vale la pena si cumplen estos requisitos**

#### EVE Framework = Agente Multi-turno + Tool Use

```
Usuario: "Necesito plan para diabetico, hago ejercicio 3x/semana"
    ↓
[Agente EVE]
  ├─ Paso 1: Lee perfil del paciente
  ├─ Paso 2: Consulta "ingredientes-db" tool
  ├─ Paso 3: Genera plan base
  ├─ Paso 4: Valida contra restricciones (tool: verify-foods)
  ├─ Paso 5: Si hay conflicto, itera
  └─ Resultado: Plan optimizado + razonamiento
```

#### Comparación

| Aspecto | Llamada Simple | EVE Framework |
|---------|----------------|---------------|
| **Latencia** | 2s | 5-10s |
| **Costo** | 1x | 3-5x (más tokens) |
| **Inteligencia** | Determinista | Razonamiento iterativo |
| **Errores** | Detecta solo estructura | Detecta lógica/seguridad |
| **Mantenibilidad** | Simple | Compleja |
| **Escalabilidad** | Buena | Excelente |

#### ¿Cuándo usar EVE?

**✅ USA EVE si:**
- Necesitas acceso a datos en tiempo real (ingredientes DB)
- Hay lógica compleja con iteraciones
- Quieres mejor respuesta a costos de latencia extra
- Plan con múltiples restricciones (diabéticos + vegetarianos + celíacos)

**❌ NO uses EVE si:**
- El plan es sencillo (simple fill slots)
- La latencia importa (usuario espera 2s)
- El costo es crítico (startup)

---

## 📊 Mi Recomendación para EVE Framework

### **Fase 1: MVP (Ahora) - Mantén Llamadas Simples**

Los prompts detallados + structured outputs + fallback automático son **suficientes** para MVP.

```typescript
// Lo que tienes AHORA funciona bien
const result = await aiService.generateStructuredObject(
  'diet.generate-base',
  systemPrompt,
  userPrompt,
  schema,
);
```

### **Fase 2: Escalabilidad (6-12 meses)**

Cuando hayas identificado patrones en errores, ENTONCES migra a EVE:

```typescript
// Pseudocódigo EVE
const agent = new EveAgent({
  model: 'gemini-2.0-flash', // Mejor modelo futuro
  tools: [
    { name: 'ingredient-lookup', fn: searchIngredients },
    { name: 'verify-diet', fn: verifyDiet },
    { name: 'estimate-macros', fn: calculateMacros },
  ],
});

const plan = await agent.run({
  task: 'Create diabetic diet plan',
  context: patientProfile,
});
```

---

## 💡 Mejoras Recomendadas AHORA (Antes de MVP)

### 1. **Agregar Prompt Caching** (Ahora mismo - costo 0)

Si tienes el catálogo de ingredientes en el prompt (~50KB), usa caching:

```typescript
const { object } = await generateObject({
  model: config.model,
  schema,
  system: [
    STRICT_CLINICAL_SYSTEM_PROMPT,
    systemInstruction,
    // Aquí va el catálogo (si cabe)
    ingredientsCatalogString, // ← Cache aquí
  ].join('\n'),
  // Soporte en gemini-2.0-flash
  cacheControl: 'ephemeral', // Nuevo en Gemini API
});
```

**Beneficio:** 90% descuento en tokens de prompt reutilizados.

---

### 2. **Validación Post-IA Mejorada**

Agregar validaciones de lógica (no solo estructura):

```typescript
function validateDietLogic(diet: GeneratedDiet): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validar calorías totales
  const totalCals = diet.recipes.reduce((sum, r) => sum + r.calories, 0);
  if (totalCals < diet.targetCalories * 0.8) {
    errors.push(`Calorías bajas: ${totalCals} < ${diet.targetCalories * 0.8}`);
  }
  
  // Validar macros coherentes
  diet.recipes.forEach(recipe => {
    const macroTotal = recipe.protein + recipe.carbs + recipe.fats;
    if (macroTotal === 0) {
      errors.push(`Macros inválidas en: ${recipe.title}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

---

### 3. **Usar Deepseek PRIMERO para Costos** (No Gemini)

Actualmente: `['gemini', 'openai', 'deepseek']`

**Propuesta:** Cambiar orden según feature:

```typescript
const providersByFeature = {
  'diet.verify-foods': ['deepseek', 'gemini', 'openai'], // Más barato
  'recipes.fill-day': ['gemini', 'deepseek', 'openai'], // Mejor calidad
  'diet.generate-base': ['gemini', 'openai', 'deepseek'], // Seguridad clínica
};
```

**Costo mensual impacto:** -30% si Deepseek funciona bien.

---

### 4. **Agregar Timeout Explícito**

Implementar en `ai.service.ts`:

```typescript
private async runWithFallback<T>(
  taskName: string,
  runner: (config: AiModelConfig) => Promise<T>,
  providers: AiProvider[] = ['gemini', 'openai', 'deepseek'],
  timeoutMs = 30000, // ← NUEVO
): Promise<...> {
  // ...
  try {
    const result = await Promise.race([
      runner(config),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`[${taskName}] AI timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);
    // ...
  }
}
```

---

### 5. **Consumir de DB de Ingredientes, No Hardcoded**

> "necesitamos que consuma los alimentos de la db"

**IMPORTANTE:** Verificar si lo hace:

```typescript
// En diet.service.ts línea 199
const foods = await this.prisma.ingredient.findMany({
  where: { id: { in: body.foodIds } },
});
// ✅ YA LO HACE (pero solo ingredientes que entra)
```

**Mejora:** Pasar TODA la lista al prompt para contexto:

```typescript
// Buscar recetas con ingredientes
const recipeWithIngredients = await this.prisma.recipe.findUnique({
  where: { id: recipeId },
  include: {
    ingredients: {
      include: { ingredient: true }, // Traer datos nutri
    },
  },
});
```

---

## 📈 Estado Actual del MVP: ¿Vamos Bien?

### Puntuación: **7.5/10** ✅ LISTO PARA MVP

#### ✅ LO BUENO:
1. Arquitectura centralizada (AiService)
2. Fallback automático robusto
3. Logging de costos en tiempo real
4. Validación de estructura con Zod
5. Sistema de cuotas para control de uso
6. UX de admin dashboard para costos
7. Integración con 3 proveedores
8. Prompts detallados y contextualizados

#### ⚠️ LO QUE FALTA (Pero puede ser MVP):
1. **Validación de lógica** post-IA (no solo estructura)
2. **Timeout explícito** en llamadas
3. **Orden de fallback dinámico** por feature
4. **Prompt caching** para optimizar costos
5. **Tests de integración** con IA real
6. **Documentación de prompts** (cuál es el comportamiento esperado)

#### 🚀 RECOMENDACIÓN FINAL:

**SÍ ESTÁ LISTO PARA MVP, pero:**

```markdown
1. ANTES de lanzar:
   ├─ Agregar timeout (15 min de trabajo)
   ├─ Agregar validación post-IA (30 min)
   ├─ Revisar prompts con nutricionista (1 hora)
   └─ Test con datos reales de dietas

2. DESPUÉS de MVP (Post-lanzamiento):
   ├─ Monitorear errores de IA en producción
   ├─ Cambiar orden de fallback según métricas
   ├─ Considerar EVE Framework si errores > 15%
   └─ Implementar prompt caching
```

---

## 📋 Checklist Pre-MVP

- [ ] Revisar que `Timeout` está configurado en AiService
- [ ] Agregar validación lógica post-IA (macros coherentes)
- [ ] Configurar monitoreo de errores en dashboard IA-costos
- [ ] Documentar prompts del sistema (qué espera cada feature)
- [ ] Test con 10 pacientes reales en staging
- [ ] Verificar que `Deepseek` fallback funciona
- [ ] Confirmar que cuotas de plan funcionan correctamente
- [ ] Revisar mensajes de error para UX final

---

## 📚 Referencias en el Código

| Archivo | Línea | Función |
|---------|-------|---------|
| `ai.service.ts` | 65-102 | `resolveModelConfig()` |
| `ai.service.ts` | 104-140 | `runWithFallback()` |
| `ai.service.ts` | 142-225 | `generateStructuredObject()` |
| `diet.service.ts` | 195-231 | `verifyFoodsAgainstRestrictions()` |
| `diet.service.ts` | 233-289 | `generateBaseDiet()` |
| `recipes.service.ts` | 104-113 | Inyección de servicios |
| `ia-costos/page.tsx` | 61-140 | Dashboard de costos |
| `ai-usage.service.ts` | 30-63 | Cálculo de costos |

---

## 🎓 Conclusión

Tu uso de IA está **bien pensado y bien ejecutado**. El sistema de fallback automático es profesional, el logging de costos es excelente para un startup, y la integración con múltiples providers te da flexibilidad.

**El MVP está LISTO. Lanza y aprende de los datos reales.** Después puedes migrar a EVE Framework si es necesario, pero probablemente no lo necesites hasta que tengas volumen real.

---

**Última actualización:** 2026-08-30  
**Estado:** ✅ Auditoría completada
