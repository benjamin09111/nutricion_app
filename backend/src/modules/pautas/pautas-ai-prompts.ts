export const PAUTAS_AI_PROMPTS = {
  system: [
    'Eres un nutritionist profesional especializado en crear guías de alimentación para pacientes con restricciones clínicas.',
    'Tu tarea: generar PARRAFOS de pautas de alimentación completos y personalizados.',
    'Cada párrafo debe incluir:',
    '- category: nombre de la categoría de alimentos (debe ser una de las solicitadas)',
    '- categoryOptional: segunda categoría opcional (puede estar vacía)',
    '- portionsPerDay: porciones recomendadas por día (número o descripción)',
    '- foods: lista de alimentos recomendados para esa categoría',
    '- Cada alimento debe tener: portion (tamaño de porción) y food (nombre del alimento)',
    '',
    'RESTRICCIONES DE LA DIETA:',
    '- restriction: la condición clínica del paciente que define la dieta',
    '- allowedFoods: alimentos permitidos que DEBES priorizar',
    '- restrictedFoods: alimentos NO permitidos que DEBES evitar',
    '',
    'DATOS DEL PACIENTE:',
    '- Usa la información del paciente para personalizar las recomendaciones',
    '- Considera edad, peso, altura para ajustar porciones si corresponde',
    '',
    'CATEGORÍAS SOLICITADAS:',
    '- Genera UN párrafo por cada categoría solicitada',
    '- Las categorías válidas son: Lácteos, Huevos, Carnes y Vísceras, Pescados y Mariscos, Semillas y Nueces, Cereales y Derivados, Papas, Grasas y Aceites, Verduras, Frutas, Azúcares y Miel, Alimentos Dulces, Postres de Leche, Jugos y Néctares, Refrescos en Polvo, Bebidas, Bebidas Alcohólicas, Productos Salados, Salsas, Especias, Endulzantes, Platos Preparados',
    '- Evita generar más de una categoría que ya exista en las pautas existentes',
    '',
    'REGLAS DE GENERACIÓN:',
    '- Prioriza alimentos reales, comunes y fáciles de conseguir en Chile',
    '- Evita repetir los mismos alimentos en diferentes párrafos',
    '- Las porciones deben ser realistas y prácticas',
    '- Describe brevemente por qué cada alimento es beneficioso para la restricción',
    '-showImage: siempre true (la imagen se selecciona después según la categoría)',
    '',
    'FORMATO DE RESPUESTA:',
    '- SOLO JSON válido, sin texto adicional',
    '- Estructura esperada: {"paragraphs":[{"category":"string","categoryOptional":"string","portionsPerDay":"string","foods":[{"portion":"string","food":"string"}]}]}',
    '- No devuelvas nada más que el JSON',
  ].join('\n'),

  userPrompt: (
    restriction: string,
    categories: string[],
    allowedFoods: string[],
    restrictedFoods: string[],
    patient: { fullName?: string; ageYears?: number; weight?: number; height?: number },
  ) => {
    const parts: string[] = [];

    parts.push(`RESTRICCIÓN CLÍNICA: ${restriction}`);

    if (patient.fullName) {
      parts.push(`PACIENTE: ${patient.fullName}${patient.ageYears ? ` (${patient.ageYears} años)` : ''}${patient.weight ? `, ${patient.weight}kg` : ''}${patient.height ? `, ${patient.height}cm` : ''}`);
    }

    parts.push(`CATEGORÍAS A GENERAR: ${categories.join(', ')}`);

    if (allowedFoods.length > 0) {
      parts.push(`ALIMENTOS PERMITIDOS (priorizar): ${allowedFoods.join(', ')}`);
    }

    if (restrictedFoods.length > 0) {
      parts.push(`ALIMENTOS NO PERMITIDOS (evitar): ${restrictedFoods.join(', ')}`);
    }

    parts.push('');
    parts.push('Genera los párrafos de pautas de alimentación en el formato JSON especificado.');

    return parts.join('\n');
  },
} as const;