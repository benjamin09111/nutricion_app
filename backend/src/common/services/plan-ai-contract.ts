export type PlanAiPatientContext = {
  sexo?: string;
  pesoKg?: number;
  tallaCm?: number;
  imc?: number;
  getKcal?: number;
  restriccionClinica?: string[];
  restriccionesAlimentarias?: string[];
  gustos?: string[];
  alimentosNoConsume?: string[];
  resumenClinico?: string;
  objetivo?: string;
};

export type PlanAiRequest = {
  contexto: {
    paciente?: PlanAiPatientContext;
    alimentosDisponibles?: string[];
  };
  pedido: {
    objetivo: string;
    instruccion: string;
    permitirAlimentosFueraDeLista: boolean;
    reglas: string[];
    herramientas?: Record<string, unknown>;
  };
  output: {
    soloJson: true;
    schema: Record<string, unknown>;
  };
};

const cleanString = (value: unknown, maxLength = 240) => {
  if (typeof value !== 'string') return undefined;
  const result = value.trim();
  if (!result) return undefined;
  return result.slice(0, maxLength);
};

const cleanList = (value: unknown, maxItems = 20) => {
  if (!Array.isArray(value)) return undefined;
  const result = value
    .map((item) => cleanString(item, 120))
    .filter((item): item is string => Boolean(item));
  return result.length > 0 ? result.slice(0, maxItems) : undefined;
};

export function compactPlanPatientContext(
  input: any,
): PlanAiPatientContext | undefined {
  if (!input) return undefined;

  const nested = input.demographics || input.anthropometry || input.nutrition;
  const patient = nested
    ? {
        sexo: input.demographics?.sex,
        pesoKg: input.anthropometry?.weightKg,
        tallaCm: input.anthropometry?.heightCm,
        imc: input.anthropometry?.bmi,
        getKcal:
          input.calculatedNutrition?.get ?? input.calculatedNutrition?.GET,
        restriccionClinica: input.goals?.primaryCondition,
        restriccionesAlimentarias: input.nutrition?.dietRestrictions,
        gustos: input.nutrition?.likes,
        alimentosNoConsume: input.nutrition?.dislikedFoods,
        resumenClinico: input.clinical?.clinicalSummary,
        objetivo: [input.goals?.nutritionalFocus, input.goals?.fitnessGoals]
          .filter(Boolean)
          .join(' / '),
      }
    : {
        sexo: input.gender,
        pesoKg: input.weight,
        tallaCm: input.height,
        imc: input.bmi,
        getKcal: input.getKcal ?? input.get,
        restriccionClinica: input.primaryCondition || input.clinicalRestriction,
        restriccionesAlimentarias: input.restrictions || input.dietRestrictions,
        gustos: input.likes,
        alimentosNoConsume: input.dislikedFoods,
        resumenClinico: input.clinicalSummary,
        objetivo: [input.nutritionalFocus, input.fitnessGoals, input.objective]
          .filter(Boolean)
          .join(' / '),
      };

  const weightKg = Number(patient.pesoKg);
  const tallaCm = Number(patient.tallaCm);
  const calculatedBmi =
    Number.isFinite(weightKg) &&
    weightKg > 0 &&
    Number.isFinite(tallaCm) &&
    tallaCm > 0
      ? Math.round((weightKg / (tallaCm / 100) ** 2) * 10) / 10
      : undefined;
  const result = {
    sexo: cleanString(patient.sexo, 40),
    pesoKg: Number.isFinite(Number(patient.pesoKg))
      ? Number(patient.pesoKg)
      : undefined,
    tallaCm: Number.isFinite(Number(patient.tallaCm))
      ? Number(patient.tallaCm)
      : undefined,
    imc: Number.isFinite(Number(patient.imc))
      ? Number(patient.imc)
      : calculatedBmi,
    getKcal: Number.isFinite(Number(patient.getKcal))
      ? Number(patient.getKcal)
      : undefined,
    restriccionClinica: cleanList(
      Array.isArray(patient.restriccionClinica)
        ? patient.restriccionClinica
        : [patient.restriccionClinica],
    ),
    restriccionesAlimentarias: cleanList(patient.restriccionesAlimentarias),
    gustos: cleanList(
      Array.isArray(patient.gustos)
        ? patient.gustos
        : String(patient.gustos || '').split(','),
    ),
    alimentosNoConsume: cleanList(patient.alimentosNoConsume),
    resumenClinico: cleanString(patient.resumenClinico, 300),
    objetivo: cleanString(patient.objetivo, 160),
  };

  return Object.fromEntries(
    Object.entries(result).filter(([, value]) => value !== undefined),
  ) as PlanAiPatientContext;
}

export function buildPlanAiRequest(input: {
  patient?: any;
  availableFoods?: string[];
  objective: string;
  instruction: string;
  allowExternalFoods?: boolean;
  rules?: string[];
  tools?: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}): PlanAiRequest {
  const allowExternalFoods = input.allowExternalFoods === true;
  const rules = [
    allowExternalFoods || !input.availableFoods?.length
      ? 'Puede agregar alimentos externos compatibles cuando sean necesarios.'
      : 'Usa exclusivamente los alimentos de alimentosDisponibles.',
    'Los condimentos básicos pueden agregarse solo como ingredientes opcionales con optional=true.',
    'Respeta todas las restricciones clínicas y alimentarias.',
    'No uses alimentos listados en paciente.alimentosNoConsume.',
    'No respondas con texto fuera del JSON.',
    ...(input.rules || []),
  ];

  return {
    contexto: {
      paciente: compactPlanPatientContext(input.patient),
      alimentosDisponibles: cleanList(input.availableFoods, 60),
    },
    pedido: {
      objetivo:
        cleanString(input.objective, 240) ||
        'Generar una respuesta nutricional útil y segura.',
      instruccion: cleanString(input.instruction, 800) || '',
      permitirAlimentosFueraDeLista: allowExternalFoods,
      reglas: rules,
      herramientas: input.tools,
    },
    output: {
      soloJson: true,
      schema: input.outputSchema,
    },
  };
}

export function stringifyPlanAiRequest(request: PlanAiRequest) {
  return [
    'Responde únicamente con el JSON indicado en output.schema.',
    JSON.stringify(request),
  ].join('\n');
}
