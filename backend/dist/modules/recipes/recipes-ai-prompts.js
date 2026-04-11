"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RECIPES_AI_PROMPTS = void 0;
exports.RECIPES_AI_PROMPTS = {
    base: [
        'Tu tarea: completar bloques de comida faltantes.',
        'Usa solo alimentos de DIETA para desayuno, almuerzo, once y cena.',
        'Para bloques variables como merienda o extra puedes usar opciones simples fuera de DIETA si la regla lo permite.',
        'No cuentes sal, condimentos ni básicos de cocción.',
        'Respeta restricciones alimentarias y alimentos a evitar.',
        'Prefiere platos comunes, caseros, realistas, simples y con pocos ingredientes.',
        'Evita repetir platos ya usados o muy parecidos.',
        'Devuelve solo JSON válido. Sin explicación.',
        'Cada receta debe incluir: slotId, mealSection, title, description, preparation, complexity, protein, calories, carbs, fats, ingredients, mainIngredients.',
        'description: 1 frase.',
        'preparation: breve, clara, 2 a 4 pasos.',
        'complexity: simple o elaborada.',
        'Agrega también meta.note y meta.replacementGuide.',
    ].join('\n'),
    day: [
        'Completa solo los bloques vacíos del día indicado.',
        'No modifiques bloques ya completos.',
        'Devuelve JSON con forma {"recipes":[...],"meta":{"note":"string","replacementGuide":[{"mealSection":"string","suggestions":["string"]}]}}',
    ].join('\n'),
    week: [
        'Completa solo los bloques vacíos de la semana.',
        'No modifiques bloques ya completos.',
        'Mantén variedad durante la semana.',
        'Evita repetir el mismo plato en días consecutivos.',
        'Devuelve JSON con forma {"days":[{"day":"string","recipes":[...]}],"meta":{"note":"string","replacementGuide":[{"mealSection":"string","suggestions":["string"]}]}}',
    ].join('\n'),
};
//# sourceMappingURL=recipes-ai-prompts.js.map