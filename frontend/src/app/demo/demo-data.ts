export interface DemoPatientProgress {
  date: string;
  weight: number;
  fatPercent: number;
  musclePercent: number;
  notes?: string;
}

export interface DemoPatient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  gender: "F" | "M";
  height: number; // cm
  currentWeight: number; // kg
  targetWeight: number; // kg
  goal: string;
  activityLevel: "sedentario" | "ligero" | "moderado" | "intenso";
  clinicalDiagnosis: string;
  dietaryRestrictions: string[];
  region: "Antofagasta" | "Santiago" | "Chiloé";
  preferences?: string[];
  history: DemoPatientProgress[];
  adherenceScore: number; // %
  desertionRisk: "bajo" | "medio" | "alto";
  daysInactive: number;
  lastContact: string;
  appliedTests?: {
    testId: string;
    testTitle: string;
    date: string;
    score: number;
    maxScore: number;
    resultSummary: string;
  }[];
  officialAdvice?: string[];
  faqAnswers?: { q: string; a: string }[];
}

export interface DemoGroceryItem {
  id: string;
  category: "Verdulería & Frutas" | "Carnes & Proteínas" | "Lácteos & Huevos" | "Despensa & Granos" | "Aceites & Semillas";
  name: string;
  amount: string;
  checked: boolean;
}

export interface INTAExchangeGroup {
  id: string;
  name: string;
  color: string;
  kcal: number;
  cho: number;
  protein: number;
  fat: number;
  portions: number;
  unitExample: string;
}

export interface DemoTask {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  dueDate: string;
  completed: boolean;
  type: "control" | "pauta" | "laboratorio";
  priority: "alta" | "media" | "baja";
}

export interface DemoRecipe {
  id: string;
  title: string;
  category: "Desayuno" | "Almuerzo" | "Cena" | "Snack";
  timeMinutes: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  preparation: string;
}

export interface DemoFood {
  id: string;
  name: string;
  category: "Proteínas" | "Carbohidratos" | "Grasas" | "Lácteos" | "Frutas/Verduras";
  portion: number;
  unit: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DemoDietMeal {
  name: string;
  time: string;
  items: { food: string; amount: string; kcal: number; p: number; c: number; f: number }[];
}

export interface DemoCreation {
  id: string;
  title: string;
  type: "Minuta Semanal" | "Distribución Macros" | "Plantilla Deportiva";
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  targetGoal: string;
}

export interface DemoTest {
  id: string;
  title: string;
  description: string;
  questions: string[];
}

export interface DemoState {
  nutritionist: {
    fullName: string;
    title: string;
    registryId: string;
    email: string;
  };
  patients: DemoPatient[];
  tasks: DemoTask[];
  recipes: DemoRecipe[];
  dietMeals: DemoDietMeal[];
  foods: DemoFood[];
  creations: DemoCreation[];
  tests: DemoTest[];
  groceries: DemoGroceryItem[];
  intaExchanges: INTAExchangeGroup[];
}

export const INITIAL_DEMO_DATA: DemoState = {
  nutritionist: {
    fullName: "NutriNet Demo",
    title: "Nutricionista Clínico & Deportivo",
    registryId: "RN-84920",
    email: "demo@nutrinet.cl",
  },
  patients: [
    {
      id: "pat-1",
      fullName: "Valentina Miranda",
      email: "valentina.miranda@empresa.cl",
      phone: "+56 9 8472 9182",
      age: 34,
      gender: "F" as const,
      height: 163,
      currentWeight: 82.0,
      targetWeight: 68.0,
      goal: "Pérdida de peso y control de resistencia a la insulina",
      activityLevel: "sedentario" as const,
      clinicalDiagnosis: "Obesidad Grado I (IMC 30.9), Resistencia a la Insulina (HOMA 3.6). Indicación de pauta baja en carga glicémica, sin lácteos y de preparación rápida.",
      dietaryRestrictions: ["Intolerancia a la lactosa", "Sin lácteos", "Cocina poco"],
      region: "Antofagasta" as const,
      preferences: ["Cocina poco", "Preparaciones de menos de 15 minutos", "Sin lácteos"],
      adherenceScore: 92,
      desertionRisk: "bajo" as const,
      daysInactive: 2,
      lastContact: "Hace 2 días",
      appliedTests: [
        {
          testId: "medas",
          testTitle: "Cuestionario MEDAS (Dieta Mediterránea)",
          date: "15 Oct 2026",
          score: 11,
          maxScore: 14,
          resultSummary: "Adherencia Alta a patrón cardioprotector",
        },
      ],
      officialAdvice: [
        "Consumir frutas enteras en su estado natural, nunca en jugos ni batidos.",
        "Priorizar carbohidratos complejos de absorción lenta (avena, legumbres, quinoa) combinados con proteína y grasa saludable.",
        "Sustituir lácteos tradicionales por bebidas vegetales sin azúcar o preparaciones sin lactosa.",
      ],
      faqAnswers: [
        {
          q: "¿Por qué no puedo tomar jugos de fruta naturales?",
          a: "Al licuar la fruta se rompe la matriz de fibra, generando una absorción acelerada de fructosa que eleva drásticamente la insulina.",
        },
        {
          q: "¿Qué hago si llego cansada y no quiero cocinar en la noche?",
          a: "Utiliza la opción de 'Cena sin cocción': atún al agua con tomate chileno, palta hass y galletas de arroz o marraqueta integral.",
        },
      ],
      history: [
        { date: "15 Oct 2026", weight: 84.5, fatPercent: 35.2, musclePercent: 26.0, notes: "Evaluación inicial Antofagasta" },
        { date: "24 Oct 2026", weight: 83.2, fatPercent: 34.5, musclePercent: 26.4, notes: "Excelente reducción de ansiedad nocturna" },
        { date: "02 Nov 2026", weight: 82.0, fatPercent: 33.8, musclePercent: 26.9, notes: "Buena adherencia a pauta INTA" },
      ],
    },
    {
      id: "pat-2",
      fullName: "Don Luis Mansilla",
      email: "luis.mansilla@chiloe.cl",
      phone: "+56 9 9123 4567",
      age: 62,
      gender: "M" as const,
      height: 168,
      currentWeight: 79.0,
      targetWeight: 72.0,
      goal: "Control metabólico de Diabetes Tipo 2 e Hipertensión",
      activityLevel: "ligero" as const,
      clinicalDiagnosis: "Diabetes Mellitus Tipo 2 compensada, Hipertensión Arterial esencial. Requiere restricción estricta de sodio (<1500mg) y control de índice glucémico con alimentos típicos del sur.",
      dietaryRestrictions: ["Sin azúcares añadidos", "Bajo en sodio (<1500mg)", "Sin frituras"],
      region: "Chiloé" as const,
      preferences: ["Papas nativas chilotas al vapor", "Pescados locales", "Comida casera tradicional"],
      adherenceScore: 84,
      desertionRisk: "medio" as const,
      daysInactive: 9,
      lastContact: "Hace 9 días",
      appliedTests: [
        {
          testId: "habitos",
          testTitle: "Escala Breve de Conducta Alimentaria",
          date: "01 Oct 2026",
          score: 8,
          maxScore: 10,
          resultSummary: "Adecuada detección de saciedad física",
        },
      ],
      officialAdvice: [
        "Reemplazar la sal de mesa por hierbas locales: ajo chilote, orégano y cilantro.",
        "Cocinar las papas nativas con piel al vapor para preservar su fibra soluble.",
        "Priorizar pescados como salmón y merluza al horno o caldillo sin embutidos.",
      ],
      faqAnswers: [
        {
          q: "¿Puedo seguir comiendo papas chilotas siendo diabético?",
          a: "Sí, respetando la porción de intercambio calculada (1 papa mediana al vapor) y acompañándola siempre de ensaladas y proteína.",
        },
      ],
      history: [
        { date: "01 Oct 2026", weight: 81.5, fatPercent: 29.2, musclePercent: 33.0, notes: "Inicio control metabólico" },
        { date: "18 Oct 2026", weight: 80.2, fatPercent: 28.5, musclePercent: 33.3, notes: "Glicemias en ayuno <115 mg/dL" },
        { date: "01 Nov 2026", weight: 79.0, fatPercent: 27.8, musclePercent: 33.6, notes: "Presión arterial estable 125/80" },
      ],
    },
    {
      id: "pat-3",
      fullName: "Martín Silva",
      email: "martin.silva.deporte@gmail.com",
      phone: "+56 9 7654 3210",
      age: 19,
      gender: "M" as const,
      height: 182,
      currentWeight: 74.0,
      targetWeight: 80.0,
      goal: "Aumento de masa muscular y rendimiento atlético",
      activityLevel: "intenso" as const,
      clinicalDiagnosis: "Eutrófico activo, estudiante universitario y deportista de sobrecarga. Requiere superávit calórico controlado (+350 kcal) y 1.9 g/kg de proteína con alimentos económicos.",
      dietaryRestrictions: ["Ninguna"],
      region: "Santiago" as const,
      preferences: ["Presupuesto estudiante", "Fácil de llevar a la universidad", "Alto aporte proteico"],
      adherenceScore: 71,
      desertionRisk: "alto" as const,
      daysInactive: 18,
      lastContact: "Hace 18 días (Alerta de Deserción)",
      appliedTests: [
        {
          testId: "medas",
          testTitle: "Cuestionario MEDAS",
          date: "10 Oct 2026",
          score: 6,
          maxScore: 14,
          resultSummary: "Adherencia Baja - Aumentar consumo de legumbres, frutos secos y aceite de oliva",
        },
      ],
      officialAdvice: [
        "Distribuir la ingesta proteica en 4 tomas de al menos 30g de proteína.",
        "Consumir una colación rica en carbohidratos 60 minutos antes del entrenamiento.",
      ],
      faqAnswers: [
        {
          q: "¿Cómo llego a mi meta de proteínas con presupuesto de estudiante?",
          a: "Huevos enteros, atún en conserva, legumbres y leche descremada ofrecen la mayor cantidad de proteína por peso invertido.",
        },
      ],
      history: [
        { date: "10 Oct 2026", weight: 72.8, fatPercent: 12.0, musclePercent: 44.5, notes: "Evaluación antropométrica deportiva" },
        { date: "28 Oct 2026", weight: 74.0, fatPercent: 12.2, musclePercent: 45.3, notes: "Aumento de fuerza en sentadilla y press" },
      ],
    },
  ],
  tasks: [
    {
      id: "task-1",
      patientId: "pat-1",
      patientName: "Valentina Miranda",
      title: "Revisar pauta semanal sin lácteos y curva de peso",
      dueDate: "Hoy",
      completed: false,
      type: "control" as const,
      priority: "alta" as const,
    },
    {
      id: "task-2",
      patientId: "pat-3",
      patientName: "Martín Silva",
      title: "Alerta de abandono: Contactar por WhatsApp tras 18 días sin registro",
      dueDate: "Urgente",
      completed: false,
      type: "pauta" as const,
      priority: "alta" as const,
    },
    {
      id: "task-3",
      patientId: "pat-2",
      patientName: "Don Luis Mansilla",
      title: "Revisar registro de presión arterial y control glucémico",
      dueDate: "Viernes",
      completed: false,
      type: "laboratorio" as const,
      priority: "media" as const,
    },
    {
      id: "task-4",
      patientId: "pat-1",
      patientName: "Valentina Miranda",
      title: "Confirmar asistencia a control presencial en Antofagasta",
      dueDate: "Completado",
      completed: true,
      type: "control" as const,
      priority: "baja" as const,
    },
  ],
  recipes: [
    {
      id: "rec-1",
      title: "Bowl Proteico de Avena y Berries",
      category: "Desayuno" as const,
      timeMinutes: 10,
      kcal: 380,
      protein: 28,
      carbs: 48,
      fat: 8,
      ingredients: ["50g Avena integral", "30g Proteína whey o vegetal", "100g Frutos rojos", "150ml Bebida de almendras", "10g Semillas de chía"],
      preparation: "Cocinar la avena con la bebida vegetal a fuego lento por 3 minutos. Retirar del fuego, mezclar la proteína hasta homogeneizar y servir con berries y chía por encima.",
    },
    {
      id: "rec-2",
      title: "Pechuga al Curry con Arroz y Verduras",
      category: "Almuerzo" as const,
      timeMinutes: 20,
      kcal: 520,
      protein: 44,
      carbs: 58,
      fat: 12,
      ingredients: ["150g Pechuga de pollo en cubos", "120g Arroz basmati cocido", "100g Brócoli al vapor", "50g Zanahoria en tiras", "Curry en polvo y aceite de oliva"],
      preparation: "Saltear el pollo con una cucharadita de aceite de oliva y curry. Agregar el brócoli y zanahoria, tapar 4 minutos. Servir junto al arroz basmati caliente.",
    },
    {
      id: "rec-3",
      title: "Omelette Mediterráneo con Palta",
      category: "Cena" as const,
      timeMinutes: 12,
      kcal: 340,
      protein: 22,
      carbs: 8,
      fat: 24,
      ingredients: ["2 Huevos enteros + 1 clara", "50g Espinacas frescas", "40g Palta en láminas", "30g Queso fresco o quesillo", "Pizca de orégano"],
      preparation: "Batir los huevos con sal y orégano. Verter en sartén caliente con rocío vegetal, agregar espinacas y quesillo picado. Doblar y servir con palta en rodajas.",
    },
  ],
  dietMeals: [
    {
      name: "Desayuno Energético",
      time: "08:00 hrs",
      items: [
        { food: "Avena integral con proteína whey", amount: "50g + 1 scoop", kcal: 360, p: 28, c: 46, f: 6 },
        { food: "Frutos rojos frescos", amount: "1 taza", kcal: 55, p: 1, c: 13, f: 0 },
      ],
    },
    {
      name: "Almuerzo Equilibrado",
      time: "13:30 hrs",
      items: [
        { food: "Pechuga de pollo a la plancha", amount: "160g", kcal: 240, p: 46, c: 0, f: 5 },
        { food: "Quinoa o arroz integral", amount: "1 taza cocida (150g)", kcal: 180, p: 6, c: 34, f: 2 },
        { food: "Ensalada verde mixta con palta", amount: "Plato hondo + 40g palta", kcal: 120, p: 2, c: 6, f: 10 },
      ],
    },
    {
      name: "Once / Colación",
      time: "17:30 hrs",
      items: [
        { food: "Yogur protein o griego natural", amount: "1 pote (150g)", kcal: 110, p: 14, c: 7, f: 2 },
        { food: "Nueces o almendras tostadas", amount: "15g (8 unidades)", kcal: 95, p: 3, c: 3, f: 8 },
      ],
    },
    {
      name: "Cena Ligera",
      time: "20:30 hrs",
      items: [
        { food: "Filete de salmón o reineta al horno", amount: "150g", kcal: 260, p: 32, c: 0, f: 14 },
        { food: "Verduras salteadas (zapallito, pimiento, champiñones)", amount: "200g", kcal: 70, p: 4, c: 10, f: 2 },
      ],
    },
  ],
  foods: [
    { id: "f-1", name: "Pechuga de pollo (cruda)", category: "Proteínas" as const, portion: 100, unit: "g", kcal: 120, protein: 26, carbs: 0, fat: 2 },
    { id: "f-2", name: "Huevo entero", category: "Proteínas" as const, portion: 1, unit: "unidad (50g)", kcal: 75, protein: 6.5, carbs: 0.6, fat: 5.2 },
    { id: "f-3", name: "Atún al agua en conserva", category: "Proteínas" as const, portion: 100, unit: "g", kcal: 110, protein: 24, carbs: 0, fat: 1 },
    { id: "f-4", name: "Avena tradicional", category: "Carbohidratos" as const, portion: 40, unit: "g (1/2 taza)", kcal: 150, protein: 5.5, carbs: 26, fat: 2.8 },
    { id: "f-5", name: "Arroz basmati / blanco", category: "Carbohidratos" as const, portion: 100, unit: "g cocido", kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    { id: "f-6", name: "Quinoa cocida", category: "Carbohidratos" as const, portion: 100, unit: "g cocido", kcal: 120, protein: 4.4, carbs: 21, fat: 1.9 },
    { id: "f-7", name: "Palta hass", category: "Grasas" as const, portion: 50, unit: "g (1/4 unidad)", kcal: 85, protein: 1, carbs: 4, fat: 8 },
    { id: "f-8", name: "Aceite de oliva extra virgen", category: "Grasas" as const, portion: 10, unit: "ml (1 cda)", kcal: 88, protein: 0, carbs: 0, fat: 10 },
    { id: "f-9", name: "Yogur natural descremado", category: "Lácteos" as const, portion: 150, unit: "g", kcal: 75, protein: 7, carbs: 9, fat: 0.5 },
    { id: "f-10", name: "Plátano maduro", category: "Frutas/Verduras" as const, portion: 1, unit: "unidad media", kcal: 90, protein: 1.1, carbs: 23, fat: 0.3 },
    { id: "f-11", name: "Espinaca cruda", category: "Frutas/Verduras" as const, portion: 100, unit: "g", kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  ],
  creations: [
    {
      id: "cr-1",
      title: "Plan Definición 1.700 kcal (40P / 35C / 25G)",
      type: "Minuta Semanal" as const,
      kcal: 1720,
      protein: 145,
      carbs: 140,
      fat: 52,
      targetGoal: "Déficit calórico mujer activa",
    },
    {
      id: "cr-2",
      title: "Plan Hipertrofia 2.600 kcal (Alto en Carbohidratos)",
      type: "Plantilla Deportiva" as const,
      kcal: 2620,
      protein: 180,
      carbs: 320,
      fat: 65,
      targetGoal: "Volumen limpio hombre 75-85kg",
    },
    {
      id: "cr-3",
      title: "Pauta Antiinflamatoria & Salud Digestiva",
      type: "Distribución Macros" as const,
      kcal: 1850,
      protein: 120,
      carbs: 180,
      fat: 60,
      targetGoal: "Control de distensión y colon irritable",
    },
  ],
  tests: [
    {
      id: "medas",
      title: "Cuestionario de Adherencia a Dieta Mediterránea (MEDAS)",
      description: "14 ítems para evaluar el patrón alimentario cardioprotector.",
      questions: [
        "¿Usa el aceite de oliva como principal grasa para cocinar?",
        "¿Consume 2 o más cucharadas de aceite de oliva al día?",
        "¿Consume 2 o más raciones de verdura al día?",
        "¿Consume 3 o más piezas de fruta al día?",
        "¿Consume menos de 1 ración de carnes rojas o embutidos al día?",
        "¿Consume menos de 1 ración de manteca, margarina o mantequilla al día?",
        "¿Consume menos de 1 bebida azucarada al día?",
      ],
    },
    {
      id: "habitos",
      title: "Escala Breve de Conducta Alimentaria & Saciedad",
      description: "Evaluación de señales de hambre fisiológica vs hambre emocional.",
      questions: [
        "¿Suele comer en respuesta a estrés o ansiedad en vez de apetito físico?",
        "¿Realiza pausas conscientes al comer sin pantallas ni distracciones?",
        "¿Bebe al menos 1.5 litros de agua pura al día?",
        "¿Experimenta caídas bruscas de energía a media tarde?",
      ],
    },
  ],
  groceries: [
    { id: "g-1", category: "Verdulería & Frutas" as const, name: "Plátanos maduros", amount: "1 kg", checked: true },
    { id: "g-2", category: "Verdulería & Frutas" as const, name: "Manzanas Fuji o Gala", amount: "1 kg (5-6 un)", checked: false },
    { id: "g-3", category: "Verdulería & Frutas" as const, name: "Espinaca baby fresca", amount: "1 bolsa (250g)", checked: true },
    { id: "g-4", category: "Verdulería & Frutas" as const, name: "Berries congelados surtidos", amount: "1 bolsa (500g)", checked: false },
    { id: "g-5", category: "Verdulería & Frutas" as const, name: "Zapallo italiano", amount: "2 unidades", checked: false },
    { id: "g-6", category: "Carnes & Proteínas" as const, name: "Pechuga de pollo fileteada", amount: "1.2 kg", checked: true },
    { id: "g-7", category: "Carnes & Proteínas" as const, name: "Huevos de gallina libre", amount: "Bandeja 12 un", checked: true },
    { id: "g-8", category: "Carnes & Proteínas" as const, name: "Filete de reineta o merluza", amount: "600 g", checked: false },
    { id: "g-9", category: "Carnes & Proteínas" as const, name: "Atún al agua en lomos", amount: "2 latas", checked: false },
    { id: "g-10", category: "Lácteos & Huevos" as const, name: "Leche descremada sin lactosa", amount: "2 Litros", checked: true },
    { id: "g-11", category: "Lácteos & Huevos" as const, name: "Yogur natural proteico s/azúcar", amount: "4 potes", checked: false },
    { id: "g-12", category: "Lácteos & Huevos" as const, name: "Quesillo light pasteurizado", amount: "1 pieza (300g)", checked: false },
    { id: "g-13", category: "Despensa & Granos" as const, name: "Avena integral en hojuelas", amount: "1 bolsa (800g)", checked: true },
    { id: "g-14", category: "Despensa & Granos" as const, name: "Arroz integral o basmati", amount: "1 kg", checked: false },
    { id: "g-15", category: "Despensa & Granos" as const, name: "Lentejas o garbanzos cocidos", amount: "2 cajas (380g c/u)", checked: false },
    { id: "g-16", category: "Aceites & Semillas" as const, name: "Aceite de oliva extra virgen", amount: "500 ml", checked: false },
    { id: "g-17", category: "Aceites & Semillas" as const, name: "Palta Hass chilena", amount: "1 kg", checked: true },
    { id: "g-18", category: "Aceites & Semillas" as const, name: "Nueces peladas naturales", amount: "200 g", checked: false },
  ],
  intaExchanges: [
    { id: "cereales", name: "Cereales y Tubérculos", color: "bg-amber-50 text-amber-900 border-amber-200", kcal: 140, cho: 30, protein: 3, fat: 1, portions: 4, unitExample: "3/4 taza arroz/fideos cocidos o 1/2 marraqueta" },
    { id: "carnes_bajas", name: "Carnes Bajas en Grasa", color: "bg-rose-50 text-rose-900 border-rose-200", kcal: 65, cho: 0, protein: 11, fat: 2, portions: 3, unitExample: "1 palma pechuga pollo, posta o pescado" },
    { id: "carnes_altas", name: "Carnes Altas en Grasa / Huevo", color: "bg-orange-50 text-orange-900 border-orange-200", kcal: 120, cho: 0, protein: 11, fat: 8, portions: 1, unitExample: "1 huevo entero o corte vacuno graso" },
    { id: "lacteos_desc", name: "Lácteos Descremados", color: "bg-sky-50 text-sky-900 border-sky-200", kcal: 70, cho: 10, protein: 7, fat: 0, portions: 2, unitExample: "1 taza leche descremada o 1 yogur light" },
    { id: "frutas", name: "Frutas", color: "bg-emerald-50 text-emerald-900 border-emerald-200", kcal: 65, cho: 15, protein: 1, fat: 0, portions: 3, unitExample: "1 manzana mediana o 1 taza de berries" },
    { id: "verduras_gen", name: "Verduras General", color: "bg-green-50 text-green-900 border-green-200", kcal: 30, cho: 5, protein: 2, fat: 0, portions: 2, unitExample: "1 taza zanahoria, betarraga o zapallo it." },
    { id: "verduras_libre", name: "Verduras Libre Consumo", color: "bg-teal-50 text-teal-900 border-teal-200", kcal: 10, cho: 2.5, protein: 0, fat: 0, portions: 3, unitExample: "Lechuga, espinaca, apio, pepino a gusto" },
    { id: "aceites", name: "Aceites y Grasas", color: "bg-yellow-50 text-yellow-900 border-yellow-200", kcal: 180, cho: 0, protein: 0, fat: 20, portions: 2, unitExample: "4 cditas aceite oliva o 2 cdas palta" },
  ],
};

