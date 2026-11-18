"use client";

import { INITIAL_DEMO_DATA } from "@/app/demo/demo-data";
import { MOCK_PATIENTS } from "@/features/patients/mocks";
import {
  OFFICIAL_INGREDIENTS,
  searchLocalIngredients,
} from "@/features/foods/local-catalog";

const STORAGE_KEYS = {
  PATIENTS: "nutrinet_demo_patients_v7",
  CONSULTATIONS: "nutrinet_demo_consultations_v7",
  CLINICAL_RECORDS: "nutrinet_demo_clinical_records_v4",
  CREATIONS: "nutrinet_demo_creations_v7",
  FOODS: "nutrinet_demo_foods_v3",
  RESOURCES: "nutrinet_demo_resources_v3",
  SUPPORT: "nutrinet_demo_support_v3",
};

export const DEMO_USER = {
  id: "demo-user-1",
  email: "dra.valenzuela@nutrinet.cl",
  role: "NUTRITIONIST",
  rut: "18.492.012-3",
  googleAvatarUrl: null,
  nutritionist: {
    id: "nutri-demo",
    fullName: "Dra. Daniela Valenzuela",
    settings: {},
  },
  plan: "pro",
  planName: "Plan Pro Clínico",
  currentPlan: {
    id: "plan-pro",
    name: "Plan Pro Clínico",
    slug: "pro",
    price: 29990,
    entitlements: {
      "patients.total.limit": 999,
      "patients.active.limit": 999,
      "consultations.monthly.limit": 999,
      "pdf.monthly.limit": 999,
      "ai.monthly.limit": 999,
      "branding.enabled": true,
      "clinical_record.enabled": true,
      "clinical_calculator.use.access": true,
      "screening_tests.access": true,
      "screening_tests.delete.access": true,
      "creations.edit.access": true,
      "creations.delete.access": true,
      "creations.import.access": true,
      "resources.create.access": true,
      "resources.edit.access": true,
      "ingredients.create.access": true,
      "consultations.delete.access": true,
      "ai.autofill.access": true,
    },
  },
};

const INITIAL_CONSULTATIONS = [
  {
    id: "con-1",
    patientId: "pat-1",
    patientName: "Valentina Miranda",
    title: "Control mensual de resistencia a la insulina",
    date: "2026-11-10T12:00:00.000Z",
    patient: { id: "pat-1", fullName: "Valentina Miranda" },
    description: "Buena adherencia a la distribución de porciones INTA sin lácteos. Glicemia en ayunas disminuyó de 108 a 94 mg/dL. Se ajustan colaciones previas a actividad física vespertina.",
    notes: "Buena adherencia a la distribución de porciones INTA sin lácteos. Glicemia en ayunas disminuyó de 108 a 94 mg/dL. Se ajustan colaciones previas a actividad física vespertina.",
    metrics: [
      { key: "weight", label: "Peso", value: 82.0, unit: "kg" },
      { key: "body_fat", label: "% Grasa", value: 33.8, unit: "%" },
      { key: "muscle_mass", label: "Masa Muscular", value: 26.9, unit: "kg" },
      { key: "visceral_fat", label: "Grasa Visceral", value: 7, unit: "lvl" },
      { key: "waist", label: "Cintura", value: 84.5, unit: "cm" },
    ],
  },
  {
    id: "con-2",
    patientId: "pat-2",
    patientName: "Don Luis Mansilla",
    title: "Revisión de plan hipocalórico y curva glicémica",
    date: "2026-11-08T15:30:00.000Z",
    patient: { id: "pat-2", fullName: "Don Luis Mansilla" },
    description: "Presión arterial controlada (125/80 mmHg). Cumple restricción de sodio y consumo de 2L diarios de agua. Se felicita por constancia en caminatas matutinas de 30 minutos.",
    notes: "Presión arterial controlada (125/80 mmHg). Cumple restricción de sodio y consumo de 2L diarios de agua. Se felicita por constancia en caminatas matutinas de 30 minutos.",
    metrics: [
      { key: "weight", label: "Peso", value: 79.0, unit: "kg" },
      { key: "body_fat", label: "% Grasa", value: 27.5, unit: "%" },
      { key: "muscle_mass", label: "Masa Muscular", value: 31.0, unit: "kg" },
      { key: "visceral_fat", label: "Grasa Visceral", value: 9, unit: "lvl" },
      { key: "waist", label: "Cintura", value: 96.0, unit: "cm" },
    ],
  },
  {
    id: "con-3",
    patientId: "pat-3",
    patientName: "Martín Silva",
    title: "Evaluación antropométrica y aumento masa muscular",
    date: "2026-11-07T10:00:00.000Z",
    patient: { id: "pat-3", fullName: "Martín Silva" },
    description: "Aumento de 800g de masa muscular magra respecto al mes anterior. Se optimiza el timing de ingesta proteica post-entrenamiento (30g de proteína de suero o claras de huevo).",
    notes: "Aumento de 800g de masa muscular magra respecto al mes anterior. Se optimiza el timing de ingesta proteica post-entrenamiento (30g de proteína de suero o claras de huevo).",
    metrics: [
      { key: "weight", label: "Peso", value: 74.5, unit: "kg" },
      { key: "body_fat", label: "% Grasa", value: 14.2, unit: "%" },
      { key: "muscle_mass", label: "Masa Muscular", value: 38.5, unit: "kg" },
      { key: "visceral_fat", label: "Grasa Visceral", value: 3, unit: "lvl" },
      { key: "waist", label: "Cintura", value: 78.0, unit: "cm" },
    ],
  },
  {
    id: "con-4",
    patientId: "pat-4",
    patientName: "Ana Silva",
    title: "Control de déficit calórico y alimentación vegetariana",
    date: "2026-11-05T11:00:00.000Z",
    patient: { id: "pat-4", fullName: "Ana Silva" },
    description: "Excelente energía y digestión. Logró -1.8 kg en 4 semanas. Se refuerza suplementación de Vitamina B12 y combinación de legumbres con cereales integrales para perfil de aminoácidos completo.",
    notes: "Excelente energía y digestión. Logró -1.8 kg en 4 semanas. Se refuerza suplementación de Vitamina B12 y combinación de legumbres con cereales integrales para perfil de aminoácidos completo.",
    metrics: [
      { key: "weight", label: "Peso", value: 65.5, unit: "kg" },
      { key: "height", label: "Estatura", value: 165, unit: "cm" },
      { key: "body_fat", label: "% Grasa", value: 24.1, unit: "%" },
      { key: "muscle_mass", label: "Masa Muscular", value: 25.3, unit: "kg" },
      { key: "visceral_fat", label: "Grasa Visceral", value: 4, unit: "lvl" },
      { key: "waist", label: "Cintura", value: 72.0, unit: "cm" },
    ],
  },
];

const INITIAL_CREATIONS = [
  {
    id: "cr-1",
    name: "Pauta Rápida — Déficit y Recomposición (1.800 kcal)",
    type: "FAST_DELIVERABLE",
    createdAt: "2026-11-15T10:30:00.000Z",
    patientName: "Valentina Miranda",
    patientId: "pat-1",
    tags: ["Rápido", "Déficit Calórico", "INTA", "1800 kcal"],
    description: "Pauta nutricional personalizada orientada a recomposición corporal y control de saciedad mediante porciones estructuradas y hábitos sostenibles.",
    content: {
      title: "Pauta Rápida — Déficit y Recomposición (1.800 kcal)",
      patientName: "Valentina Miranda",
      planObjective: "Recomposición corporal con déficit calórico moderado de 400 kcal, asegurando 1.6g/kg de proteína y óptima densidad nutricional.",
      showPlanObjectiveInPdf: true,
      clinicalRestriction: "Sensibilidad leve a lácteos enteros. Preferir opciones deslactosadas o vegetales.",
      tableMode: "options",
      meals: [
        {
          id: "m-1",
          section: "Desayuno",
          time: "07:30 - 08:30 hrs",
          mealText: "A: 1 taza de avena integral cocida con canela y bebida vegetal + 2 huevos revueltos con orégano + 1 porción de arándanos frescos\nB: 2 rebanadas de pan de masa madre con 1/4 palta Hass + 2 huevos pochados + infusión de té verde sin azúcar",
          portion: "1 porción"
        },
        {
          id: "m-2",
          section: "Almuerzo",
          time: "13:00 - 14:00 hrs",
          mealText: "A: 150g de pechuga de pollo a la plancha + 3/4 taza de quinoa cocida + ensalada abundante de hojas verdes con aceite de oliva extra virgen\nB: 160g de reineta al horno con finas hierbas + 1 papa mediana cocida con cáscara + ensalada de espinacas tiernas con tomate cherry",
          portion: "1 plato equilibrado"
        },
        {
          id: "m-3",
          section: "Once / Merienda",
          time: "17:00 - 18:00 hrs",
          mealText: "A: 1 pote de yogur griego natural descremado (sin azúcar) + 1 puñado de nueces tostadas (20g) + 1 manzana verde en gajos\nB: Batido con 1 taza de bebida de almendras sin azúcar + 1 scoop de proteína aislada + 1/2 plátano maduro",
          portion: "1 colación"
        },
        {
          id: "m-4",
          section: "Cena",
          time: "20:30 - 21:30 hrs",
          mealText: "A: Tortilla de verduras (2 claras + 1 huevo con zapallito italiano y espinaca) + crema tibia de zapallo camote natural\nB: Salpicón de atún al agua (1 lata) con lechuga, palmitos y pepino + 1 cdta de aceite de oliva",
          portion: "1 plato liviano"
        }
      ],
      avoidFoods: [
        "Bebidas azucaradas, jugos procesados y néctares comerciales",
        "Frituras y ultraprocesados con sellos negros",
        "Alcohol durante los días de semana",
        "Embutidos y fiambres con alto contenido de sodio",
        "Harinas y azúcares simples refinados"
      ],
      portionGuide: [
        { grupo: "Proteínas magras", porcion: "Palma de la mano (120-150g)", equivalencia: "Pollo, pescado blanco, huevos, tofu" },
        { grupo: "Carbohidratos complejos", porcion: "Puño cerrado (1/2 a 3/4 taza)", equivalencia: "Quinoa, arroz integral, avena" },
        { grupo: "Verduras libres", porcion: "Dos manos abiertas (libre consumo)", equivalencia: "Lechuga, espinaca, apio, pepino" },
        { grupo: "Grasas saludables", porcion: "Punta del pulgar (1 cdta)", equivalencia: "Aceite de oliva extra virgen, palta, nueces" }
      ],
      resources: [
        {
          resourceId: "hab-1",
          title: "Pilares del Déficit Sostenible",
          content: "Priorizar 2 a 2.5 litros de agua al día, mantener 7 a 8 horas de sueño reparador y masticar con calma para permitir una correcta señalización de saciedad."
        }
      ]
    },
    metadata: {
      patientName: "Valentina Miranda",
      description: "Pauta nutricional personalizada orientada a recomposición corporal y control de saciedad mediante porciones estructuradas y hábitos sostenibles.",
      foodCount: 15
    }
  },
  {
    id: "cr-2",
    name: "Recetario Deportivo — Alto Rendimiento y Masa Muscular",
    type: "RECIPE",
    createdAt: "2026-11-13T16:40:00.000Z",
    patientName: "Martín Silva",
    patientId: "pat-3",
    tags: ["Recetas", "Hipertrofia", "Alto Rendimiento", "Proteico"],
    description: "Recetario práctico de preparación rápida con alta biodisponibilidad proteica y carbohidratos complejos para días de entrenamiento intenso.",
    content: {
      title: "Recetario Deportivo — Alto Rendimiento y Masa Muscular",
      patientName: "Martín Silva",
      planObjective: "Aporte energético y síntesis proteica óptima para entrenamientos de fuerza 4 veces por semana.",
      showPlanObjectiveInPdf: true,
      nutritionistNotes: "Consumir las preparaciones de pre-entrenamiento 90 minutos antes de la sesión. Mantener hidratación continua de 3L de agua al día.",
      dishes: [
        {
          title: "Pancakes Proteicos de Avena y Plátano",
          mealSection: "Desayuno / Pre-entreno",
          description: "Rica fuente de carbohidratos de absorción gradual y proteína de alto valor biológico.",
          preparation: "Licuar la avena, claras de huevo, plátano maduro y canela hasta obtener una mezcla homogénea. Cocinar en sartén antiadherente a fuego medio 2 minutos por lado.",
          recommendedPortion: "3 pancakes medianos",
          portions: 1,
          calories: 420,
          protein: 32,
          carbs: 58,
          fats: 6,
          ingredients: [
            { name: "Harina de avena integral", quantity: "60g" },
            { name: "Claras de huevo pasteurizadas", quantity: "4 unidades (130ml)" },
            { name: "Plátano maduro mediano", quantity: "1 unidad (100g)" },
            { name: "Canela en polvo", quantity: "1 cdta" }
          ]
        },
        {
          title: "Bowl de Pollo Crispy en Airfryer con Quinoa y Palta",
          mealSection: "Almuerzo Post-entreno",
          description: "Comida completa de recuperación muscular y reposición de glucógeno.",
          preparation: "Cortar la pechuga en cubos, condimentar con pimentón dulce, cúrcuma y sal reducida. Cocinar en freidora de aire a 190°C por 14 minutos. Servir sobre base de quinoa tibia y acompañar con palta en cubos y ensalada mixta.",
          recommendedPortion: "1 bowl grande",
          portions: 1,
          calories: 580,
          protein: 48,
          carbs: 62,
          fats: 14,
          ingredients: [
            { name: "Pechuga de pollo deshuesada", quantity: "180g" },
            { name: "Quinoa cocida tricolor", quantity: "1 taza (160g)" },
            { name: "Palta Hass", quantity: "1/4 unidad (50g)" },
            { name: "Tomate cherry y hojas verdes", quantity: "1 plato hondo" }
          ]
        },
        {
          title: "Mousse Proteico Exprés de Frutos del Bosque",
          mealSection: "Snack / Colación Nocturna",
          description: "Postre ligero rico en caseína natural para nutrición nocturna sostenida.",
          preparation: "Mezclar el yogur griego con proteína aislada y frutos rojos semi-congelados. Batir vigorosamente con batidor de mano hasta lograr textura aireada y refrigerar 15 minutos.",
          recommendedPortion: "1 copa o frasco",
          portions: 1,
          calories: 210,
          protein: 26,
          carbs: 18,
          fats: 2,
          ingredients: [
            { name: "Yogur griego natural 0% grasa", quantity: "170g" },
            { name: "Mix de berries congeladas", quantity: "1/2 taza (75g)" },
            { name: "Semillas de chía hidratadas", quantity: "1 cdta" }
          ]
        }
      ]
    },
    metadata: {
      patientName: "Martín Silva",
      description: "Recetario práctico de preparación rápida con alta biodisponibilidad proteica y carbohidratos complejos para días de entrenamiento intenso.",
      dishCount: 3
    }
  },
  {
    id: "cr-3",
    name: "Plan Personalizado — Manejo Metabólico y Antiinflamatorio",
    type: "PAUTAS",
    createdAt: "2026-11-11T09:00:00.000Z",
    patientName: "Valentina Miranda",
    patientId: "pat-1",
    tags: ["Personalizado", "Metabólico", "Antiinflamatorio", "Sin Gluten"],
    description: "Pauta nutricional personalizada por tiempos de comida para regulación de glicemia e insulina, con enfoque antiinflamatorio y alta saciedad.",
    content: {
      title: "Plan Personalizado — Manejo Metabólico y Antiinflamatorio",
      patientName: "Valentina Miranda",
      planObjective: "Mejorar la sensibilidad periférica a la insulina y reducir marcadores inflamatorios mediante carbohidratos de bajo índice glucémico y grasas monoinsaturadas.",
      showPlanObjectiveInPdf: true,
      clinicalRestriction: "Sin gluten estricto. Sensibilidad a lácteos de vaca.",
      tableMode: "simple",
      meals: [
        {
          id: "p-1",
          section: "Desayuno",
          time: "08:30 hrs",
          mealText: "Pudín de semillas de chía hidratadas en leche de coco sin azúcar con arándanos frescos, semillas de zapallo tostadas y canela de Ceilán + infusión de jengibre y cúrcuma.",
          portion: "1 tazón generoso"
        },
        {
          id: "p-2",
          section: "Almuerzo",
          time: "13:30 hrs",
          mealText: "Filete de salmón salvaje o trucha a la plancha (160g) con aliño de limón y eneldo + 1/2 taza de arroz basmati integral + timbal de verduras asadas (espárragos, pimentón y zapallito italiano).",
          portion: "1 plato principal"
        },
        {
          id: "p-3",
          section: "Once / Colación",
          time: "17:00 hrs",
          mealText: "Bastoncitos de zanahoria, apio y pepino crujientes con 3 cdas soperas de hummus artesanal de garbanzo con sésamo tostado.",
          portion: "1 porción"
        },
        {
          id: "p-4",
          section: "Cena",
          time: "20:30 hrs",
          mealText: "Sopa tibia reconfortante de verduras de hoja verde y jengibre + pechuga de pavo desmenuzada (130g) con 1/4 palta Hass y semillas de cáñamo.",
          portion: "1 plato liviano"
        }
      ],
      avoidFoods: [
        "Harinas refinadas de trigo y productos ultraprocesados con gluten",
        "Azúcares simples, jarabes de alta fructosa y golosinas industriales",
        "Aceites vegetales de soya, maíz o maravilla recalentados",
        "Lácteos de vaca enteros o quesos procesados",
        "Bebidas alcohólicas y carbonatadas"
      ],
      portionGuide: [
        { grupo: "Proteínas limpias", porcion: "130-160g en almuerzo y cena", equivalencia: "Pescados grasos, pavo, huevos de campo, legumbres" },
        { grupo: "Grasas antiinflamatorias", porcion: "1-2 cdtas de aceite virgen o 1/4 palta", equivalencia: "Aceite de oliva extra virgen, palta Hass, chía, nueces" },
        { grupo: "Fibra y vegetales", porcion: "Mínimo 2 platos abundantes al día", equivalencia: "Hojas verdes, brócoli, espárragos, zapallito, pepino" }
      ],
      resources: [
        {
          resourceId: "res-met",
          title: "Pautas de Estilo de Vida Antiinflamatorio",
          content: "Caminar 10 a 15 minutos después de las comidas principales para aplanar picos glucémicos. Mantener una ventana de ayuno nocturno fisiológico de 12 horas."
        }
      ]
    },
    metadata: {
      patientName: "Valentina Miranda",
      description: "Pauta nutricional personalizada por tiempos de comida para regulación de glicemia e insulina, con enfoque antiinflamatorio y alta saciedad.",
      foodCount: 14
    }
  },
  {
    id: "cr-4",
    name: "Minuta Mediterránea Estructurada — Salud Cardiovascular",
    type: "DIET",
    createdAt: "2026-11-09T14:15:00.000Z",
    patientName: "Don Luis Mansilla",
    patientId: "pat-2",
    tags: ["Dietas", "Mediterránea", "Cardioprotectora", "Baja en Sodio"],
    description: "Pauta estructurada basada en patrón mediterráneo con énfasis en fibra soluble, ácidos grasos monoinsaturados y reducción estricta de sodio.",
    content: {
      dietName: "Minuta Mediterránea Estructurada — Salud Cardiovascular",
      patientName: "Don Luis Mansilla",
      planObjective: "Optimización del perfil lipídico (reducción de LDL y triglicéridos) y control de presión arterial sistólica.",
      showPlanObjectiveInPdf: true,
      activeConstraints: ["Bajo en sodio", "Sin grasas trans", "Alto en omega 3"],
      groups: {
        "Proteínas y Pescados": [
          { producto: "Salmón o jurel al horno con finas hierbas", grupo: "Proteínas y Pescados", unidad: "150g", calorias: 280, proteinas: 34, lipidos: 14, carbohidratos: 0 },
          { producto: "Lentejas guisadas con zapallo y verduras", grupo: "Proteínas y Pescados", unidad: "1 taza", calorias: 230, proteinas: 18, lipidos: 3, carbohidratos: 40 },
          { producto: "Pechuga de pavo asada", grupo: "Proteínas y Pescados", unidad: "140g", calorias: 180, proteinas: 32, lipidos: 4, carbohidratos: 0 }
        ],
        "Cereales Integrales y Legumbres": [
          { producto: "Avena integral machacada", grupo: "Cereales Integrales y Legumbres", unidad: "1/2 taza", calorias: 150, proteinas: 5, lipidos: 3, carbohidratos: 27 },
          { producto: "Arroz integral al vapor", grupo: "Cereales Integrales y Legumbres", unidad: "3/4 taza", calorias: 160, proteinas: 3, lipidos: 1, carbohidratos: 35 },
          { producto: "Pan integral de masa madre 100%", grupo: "Cereales Integrales y Legumbres", unidad: "1 rebanada (50g)", calorias: 120, proteinas: 4, lipidos: 1, carbohidratos: 24 }
        ],
        "Verduras y Hortalizas": [
          { producto: "Ensalada de espinacas tiernas con tomate cherry", grupo: "Verduras y Hortalizas", unidad: "1 plato hondo", calorias: 45, proteinas: 3, lipidos: 0, carbohidratos: 8 },
          { producto: "Brócoli al vapor con ajo y limón", grupo: "Verduras y Hortalizas", unidad: "1 taza", calorias: 55, proteinas: 4, lipidos: 0, carbohidratos: 11 },
          { producto: "Zapallo italiano salteado", grupo: "Verduras y Hortalizas", unidad: "1 taza", calorias: 35, proteinas: 2, lipidos: 0, carbohidratos: 7 }
        ],
        "Grasas Cardioprotectoras": [
          { producto: "Aceite de oliva extra virgen", grupo: "Grasas Cardioprotectoras", unidad: "1 cda sopera (10ml)", calorias: 90, proteinas: 0, lipidos: 10, carbohidratos: 0 },
          { producto: "Nueces chilenas seleccionadas", grupo: "Grasas Cardioprotectoras", unidad: "4 mitades (20g)", calorias: 130, proteinas: 3, lipidos: 13, carbohidratos: 2 },
          { producto: "Palta Hass en láminas", grupo: "Grasas Cardioprotectoras", unidad: "2 cdas (50g)", calorias: 80, proteinas: 1, lipidos: 8, carbohidratos: 2 }
        ]
      },
      meals: [
        { section: "Desayuno", mealText: "Pan de masa madre con palta Hass y tomate natural + té de tilo o café descafeinado", time: "08:00", portion: "1 porción" },
        { section: "Almuerzo", mealText: "Salmón o jurel al horno con arroz integral y generosa ensalada de hojas verdes con aceite de oliva", time: "13:30", portion: "1 porción completa" },
        { section: "Colación", mealText: "Nueces seleccionadas + 1 pera o manzana de agua con cáscara", time: "17:00", portion: "1 porción" },
        { section: "Cena", mealText: "Crema de verduras casera sin sal añadida + filete de pavo a la plancha con orégano", time: "20:00", portion: "1 porción" }
      ]
    },
    metadata: {
      patientName: "Don Luis Mansilla",
      foodCount: 12,
      description: "Pauta estructurada basada en patrón mediterráneo con énfasis en fibra soluble, ácidos grasos monoinsaturados y reducción estricta de sodio.",
      foodSummary: [
        { name: "Salmón o jurel al horno", group: "Proteínas y Pescados", unit: "150g", calories: 280, proteins: 34, lipids: 14, carbs: 0 },
        { name: "Lentejas guisadas con zapallo", group: "Proteínas y Pescados", unit: "1 taza", calories: 230, proteins: 18, lipids: 3, carbs: 40 },
        { name: "Pechuga de pavo asada", group: "Proteínas y Pescados", unit: "140g", calories: 180, proteins: 32, lipids: 4, carbs: 0 },
        { name: "Avena integral machacada", group: "Cereales Integrales", unit: "1/2 taza", calories: 150, proteins: 5, lipids: 3, carbs: 27 },
        { name: "Arroz integral al vapor", group: "Cereales Integrales", unit: "3/4 taza", calories: 160, proteins: 3, lipids: 1, carbs: 35 },
        { name: "Pan integral de masa madre", group: "Cereales Integrales", unit: "1 rebanada", calories: 120, proteins: 4, lipids: 1, carbs: 24 },
        { name: "Ensalada de espinacas tiernas", group: "Verduras y Hortalizas", unit: "1 plato", calories: 45, proteins: 3, lipids: 0, carbs: 8 },
        { name: "Brócoli al vapor", group: "Verduras y Hortalizas", unit: "1 taza", calories: 55, proteins: 4, lipids: 0, carbs: 11 },
        { name: "Aceite de oliva extra virgen", group: "Grasas Saludables", unit: "1 cda", calories: 90, proteins: 0, lipids: 10, carbs: 0 },
        { name: "Nueces chilenas", group: "Grasas Saludables", unit: "4 unidades", calories: 130, proteins: 3, lipids: 13, carbs: 2 },
        { name: "Palta Hass", group: "Grasas Saludables", unit: "2 cdas", calories: 80, proteins: 1, lipids: 8, carbs: 2 }
      ]
    }
  }
];

const INITIAL_PATIENTS = [
  {
    id: "pat-1",
    nutritionistId: "nutri-demo",
    fullName: "Valentina Miranda",
    email: "valentina.miranda@empresa.cl",
    phone: "+56 9 8472 9182",
    documentId: "18.492.381-4",
    age: 34,
    birthDate: "1992-04-18T00:00:00.000Z",
    gender: "Femenino",
    height: 163,
    weight: 82.0,
    dietRestrictions: ["Intolerancia a la lactosa", "Sin azúcar añadida"],
    clinicalSummary: "Paciente derivada por medicina interna. Resistencia a la insulina (HOMA 3.6), acantosis nigricans leve. Se instaura pauta hipocalórica normoproteica de baja carga glicémica.",
    fitnessGoals: "Pérdida de 14 kg de grasa corporal y control de curva de glucosa",
    nutritionalFocus: "Bajar de peso",
    status: "Active" as const,
    activityLevel: "sedentario",
    primaryCondition: "Resistencia a la Insulina y Obesidad Grado I",
    tags: ["Metabólico", "Resistencia Insulina", "Antofagasta", "Sin lácteos"],
    likes: "Guisos de verduras al vapor, frutos secos, palta hass, pescados magros al horno, frutas rojas",
    dislikedFoods: ["Brócoli hervido", "Cilantro crudo", "Lácteos enteros"],
    customVariables: [
      { key: "evaluationDate", label: "Fecha de evaluación", value: "2026-11-10" },
      { key: "motivoConsulta", label: "Motivo de consulta", value: "Control de peso, reducir fatiga vespertina y regular exámenes de insulina" },
      { key: "occupation", label: "Ocupación", value: "Ingeniera en Minas / Analista de Datos" },
      { key: "workSchedule", label: "Jornada", value: "Lunes a Viernes 08:30 - 18:00 (Trabajo de oficina)" },
      { key: "medications", label: "Fármacos", value: "Metformina 850mg (1 vez al día con la cena)" },
      { key: "drugsSupplements", label: "Suplementos", value: "Vitamina D3 2000 UI, Picolinato de Cromo 200mcg" },
      { key: "diagnosedPathologies", label: "Patologías", value: "Resistencia a la Insulina, Dislipidemia leve" },
      { key: "familyHistory", label: "Antecedentes familiares", value: "Madre con Diabetes Mellitus Tipo 2, Padre hipertenso" },
      { key: "sleepQuality", label: "Sueño", value: "6 horas diarias, sueño interrumpido" },
      { key: "perceivedStress", label: "Estrés", value: "Moderado - Alto por jornada laboral" },
      { key: "weeklyExercise", label: "Ejercicio", value: "Caminatas 20 min 3 veces por semana" },
      { key: "manualCaloriesAdjustment", label: "Ajuste calórico", value: "-400" },
      { key: "pesoObjetivoProf", label: "Peso objetivo", value: "68.0" },
      { key: "pesoHabitual", label: "Peso habitual", value: "76.0" },
      { key: "pliegueTricipital", label: "Pliegue Tricipital", value: "24.5" },
      { key: "pliegueBicipital", label: "Pliegue Bicipital", value: "16.2" },
      { key: "pliegueSubescapular", label: "Pliegue Subescapular", value: "22.0" },
      { key: "pliegueSuprailiaco", label: "Pliegue Suprailiaco", value: "26.8" },
      { key: "circunferenciaCintura", label: "Circ. Cintura", value: "84.5" },
      { key: "circunferenciaCadera", label: "Circ. Cadera", value: "106.0" },
      { key: "circunferenciaBraquial", label: "Circ. Braquial", value: "31.5" },
      { key: "circunferenciaPantorrilla", label: "Circ. Pantorrilla", value: "38.2" },
      { key: "alturaRodilla", label: "Altura Rodilla", value: "49.5" },
      { key: "diagnosticoNutricional", label: "Diagnóstico nutricional", value: "Obesidad Grado I (IMC 30.9) de origen exógeno asociada a insulino-resistencia severa. Foco en pauta hipocalórica normoproteica antiinflamatoria." },
      { key: "rejectedFoods", label: "Alimentos rechazados", value: "Lácteos enteros, frituras, brócoli hervido" },
    ],
    createdAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-11-10T12:00:00.000Z",
    lastVisit: "2026-11-10",
  },
  {
    id: "pat-2",
    nutritionistId: "nutri-demo",
    fullName: "Don Luis Mansilla",
    email: "luis.mansilla@chiloe.cl",
    phone: "+56 9 9123 4567",
    documentId: "7.834.120-K",
    age: 62,
    birthDate: "1964-06-12T00:00:00.000Z",
    gender: "Masculino",
    height: 168,
    weight: 79.0,
    dietRestrictions: ["Sin azúcares añadidos", "Bajo en sodio (<1500mg)", "Sin frituras"],
    clinicalSummary: "Diabetes Mellitus Tipo 2 compensada e Hipertensión Arterial esencial. Requiere restricción estricta de sodio (<1500mg) y carbohidratos complejos al vapor.",
    fitnessGoals: "Control de presión arterial <130/80 mmHg y glucemia en ayunas <110 mg/dL",
    nutritionalFocus: "Control metabólico",
    status: "Active" as const,
    activityLevel: "ligero",
    primaryCondition: "Diabetes Mellitus Tipo 2 e Hipertensión Arterial",
    tags: ["Cardioprotector", "Diabetes", "Hipertensión", "Chiloé"],
    likes: "Merluza austral, papas nativas con piel, caldillo de congrio sin grasa, ajo chilote, poleo",
    dislikedFoods: ["Comida chatarra", "Embutidos con sodio", "Ají picante"],
    customVariables: [
      { key: "evaluationDate", label: "Fecha de evaluación", value: "2026-11-08" },
      { key: "motivoConsulta", label: "Motivo de consulta", value: "Mantener HbA1c < 7.0% y control tensional reduciendo consumo de sodio" },
      { key: "occupation", label: "Ocupación", value: "Carpintero de ribera / Jubilado activo" },
      { key: "workSchedule", label: "Jornada", value: "Mañanas en taller independiente (08:00 - 13:00)" },
      { key: "medications", label: "Fármacos", value: "Losartán 50mg/12h, Empagliflozina 10mg/24h" },
      { key: "drugsSupplements", label: "Suplementos", value: "Calcio + Vitamina D3 500mg/400UI" },
      { key: "diagnosedPathologies", label: "Patologías", value: "Diabetes Mellitus Tipo 2 compensada, Hipertensión Arterial Primaria" },
      { key: "familyHistory", label: "Antecedentes familiares", value: "Hermano con cardiopatía coronaria, Madre con diabetes" },
      { key: "sleepQuality", label: "Sueño", value: "7 horas continuas, buen descanso reparador" },
      { key: "perceivedStress", label: "Estrés", value: "Bajo" },
      { key: "weeklyExercise", label: "Ejercicio", value: "Caminatas matutinas de 30 minutos todos los días" },
      { key: "manualCaloriesAdjustment", label: "Ajuste calórico", value: "-250" },
      { key: "pesoObjetivoProf", label: "Peso objetivo", value: "72.0" },
      { key: "pesoHabitual", label: "Peso habitual", value: "82.0" },
      { key: "pliegueTricipital", label: "Pliegue Tricipital", value: "18.0" },
      { key: "pliegueBicipital", label: "Pliegue Bicipital", value: "12.0" },
      { key: "pliegueSubescapular", label: "Pliegue Subescapular", value: "19.5" },
      { key: "pliegueSuprailiaco", label: "Pliegue Suprailiaco", value: "21.0" },
      { key: "circunferenciaCintura", label: "Circ. Cintura", value: "96.0" },
      { key: "circunferenciaCadera", label: "Circ. Cadera", value: "101.5" },
      { key: "circunferenciaBraquial", label: "Circ. Braquial", value: "30.0" },
      { key: "circunferenciaPantorrilla", label: "Circ. Pantorrilla", value: "36.5" },
      { key: "alturaRodilla", label: "Altura Rodilla", value: "51.0" },
      { key: "diagnosticoNutricional", label: "Diagnóstico nutricional", value: "Sobrepeso en adulto mayor (IMC 28.0) según MINSAL. Control glucídico estable y adherencia cardioprotectora." },
      { key: "rejectedFoods", label: "Alimentos rechazados", value: "Comida chatarra, embutidos con alto sodio, condimentos irritantes" },
    ],
    createdAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-11-08T15:30:00.000Z",
    lastVisit: "2026-11-08",
  },
  {
    id: "pat-3",
    nutritionistId: "nutri-demo",
    fullName: "Martín Silva",
    email: "martin.silva.deporte@gmail.com",
    phone: "+56 9 7654 3210",
    documentId: "21.049.812-7",
    age: 19,
    birthDate: "2007-01-20T00:00:00.000Z",
    gender: "Masculino",
    height: 182,
    weight: 74.5,
    dietRestrictions: ["Sin mariscos crudos"],
    clinicalSummary: "Eutrófico activo, estudiante y deportista de fuerza. Superávit calórico controlado (+350 kcal) y 1.9 g/kg de proteína de alto valor biológico.",
    fitnessGoals: "Ganancia limpia de 4.5 kg de masa muscular y aumento de fuerza",
    nutritionalFocus: "Subir de peso",
    status: "Active" as const,
    activityLevel: "intenso",
    primaryCondition: "Aumento de Masa Muscular y Rendimiento Atlético",
    tags: ["Deportivo", "Hipertrofia", "Fuerza", "Santiago"],
    likes: "Pechuga de pollo, huevos revueltos, arroz basmati, avena con canela, plátanos, mantequilla de maní",
    dislikedFoods: ["Berenjenas", "Cebolla cruda", "Ultraprocesados grasos"],
    customVariables: [
      { key: "evaluationDate", label: "Fecha de evaluación", value: "2026-11-07" },
      { key: "motivoConsulta", label: "Motivo de consulta", value: "Plan hipercalórico e hiperproteico (1.8g/kg) para ganancia de masa muscular limpia" },
      { key: "occupation", label: "Ocupación", value: "Estudiante de Educación Física" },
      { key: "workSchedule", label: "Jornada", value: "Clases universitarias de lunes a viernes (08:00 - 16:00)" },
      { key: "medications", label: "Fármacos", value: "Ninguno" },
      { key: "drugsSupplements", label: "Suplementos", value: "Creatina Monohidrato 5g/día, Proteína Whey Isolate 30g post-entreno" },
      { key: "diagnosedPathologies", label: "Patologías", value: "Sin patologías crónicas registradas" },
      { key: "familyHistory", label: "Antecedentes familiares", value: "Sin antecedentes de enfermedades crónicas no transmisibles" },
      { key: "sleepQuality", label: "Sueño", value: "8 horas de descanso profundo reparador" },
      { key: "perceivedStress", label: "Estrés", value: "Bajo" },
      { key: "weeklyExercise", label: "Ejercicio", value: "Entrenamiento de hipertrofia y sobrecarga 5 días x 75 min" },
      { key: "manualCaloriesAdjustment", label: "Ajuste calórico", value: "+350" },
      { key: "pesoObjetivoProf", label: "Peso objetivo", value: "79.0" },
      { key: "pesoHabitual", label: "Peso habitual", value: "73.0" },
      { key: "pliegueTricipital", label: "Pliegue Tricipital", value: "9.2" },
      { key: "pliegueBicipital", label: "Pliegue Bicipital", value: "5.0" },
      { key: "pliegueSubescapular", label: "Pliegue Subescapular", value: "10.4" },
      { key: "pliegueSuprailiaco", label: "Pliegue Suprailiaco", value: "11.8" },
      { key: "circunferenciaCintura", label: "Circ. Cintura", value: "78.0" },
      { key: "circunferenciaCadera", label: "Circ. Cadera", value: "95.0" },
      { key: "circunferenciaBraquial", label: "Circ. Braquial", value: "34.5" },
      { key: "circunferenciaPantorrilla", label: "Circ. Pantorrilla", value: "37.8" },
      { key: "alturaRodilla", label: "Altura Rodilla", value: "56.0" },
      { key: "diagnosticoNutricional", label: "Diagnóstico nutricional", value: "Eutrófico activo (IMC 22.5) con bajo porcentaje de masa grasa (14.2%). Indicación de superávit energético planificado." },
      { key: "rejectedFoods", label: "Alimentos rechazados", value: "Golosinas ultraprocesadas, frituras, bebidas alcohólicas" },
    ],
    createdAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-11-07T10:00:00.000Z",
    lastVisit: "2026-11-07",
  },
  {
    id: "pat-4",
    nutritionistId: "nutri-demo",
    fullName: "Ana Silva",
    email: "ana.silva@diseno.cl",
    phone: "+56 9 6543 2109",
    documentId: "17.291.845-2",
    age: 36,
    birthDate: "1990-05-15T00:00:00.000Z",
    gender: "Femenino",
    height: 165,
    weight: 65.5,
    dietRestrictions: ["Vegetariana", "Sin mariscos", "Intolerancia a la lactosa"],
    clinicalSummary: "Alimentación ovolactovegetariana balanceada. Exámenes recientes muestran perfil lipídico óptimo y ferritina normal tras suplementación con B12.",
    fitnessGoals: "Recomposición corporal, reducción de 2 kg de grasa y mejora de resistencia aeróbica",
    nutritionalFocus: "Mejorar composición corporal",
    status: "Active" as const,
    activityLevel: "moderado",
    primaryCondition: "Alimentación Vegetariana y Tonificación Muscular",
    tags: ["Vegetariano", "Plant-based", "Recomposición", "Santiago"],
    likes: "Hummus casero, tofu salteado, quinoa tricolor, batidos verdes, semillas de calabaza y chía",
    dislikedFoods: ["Carnes rojas", "Embutidos", "Pollo", "Pescados y mariscos"],
    customVariables: [
      { key: "evaluationDate", label: "Fecha de evaluación", value: "2026-11-05" },
      { key: "motivoConsulta", label: "Motivo de consulta", value: "Optimizar biodisponibilidad de hierro, densidad proteica vegetal y tonificación muscular" },
      { key: "occupation", label: "Ocupación", value: "Diseñadora UX / Docente" },
      { key: "workSchedule", label: "Jornada", value: "Teletrabajo híbrido (09:00 - 17:30)" },
      { key: "medications", label: "Fármacos", value: "Anticonceptivos orales combinados" },
      { key: "drugsSupplements", label: "Suplementos", value: "Cianocobalamina (B12) 2000 mcg semanal, Hierro bisglicinato 30mg con vitamina C" },
      { key: "diagnosedPathologies", label: "Patologías", value: "Antecedente de anemia ferropénica superada" },
      { key: "familyHistory", label: "Antecedentes familiares", value: "Madre con hipotiroidismo primario en tratamiento con levotiroxina" },
      { key: "sleepQuality", label: "Sueño", value: "7.5 horas continuas, despertar descansado" },
      { key: "perceivedStress", label: "Estrés", value: "Moderado" },
      { key: "weeklyExercise", label: "Ejercicio", value: "Yoga vinyasa y pilates reformer 4 veces por semana" },
      { key: "manualCaloriesAdjustment", label: "Ajuste calórico", value: "-200" },
      { key: "pesoObjetivoProf", label: "Peso objetivo", value: "62.0" },
      { key: "pesoHabitual", label: "Peso habitual", value: "66.0" },
      { key: "pliegueTricipital", label: "Pliegue Tricipital", value: "15.2" },
      { key: "pliegueBicipital", label: "Pliegue Bicipital", value: "9.8" },
      { key: "pliegueSubescapular", label: "Pliegue Subescapular", value: "14.0" },
      { key: "pliegueSuprailiaco", label: "Pliegue Suprailiaco", value: "16.5" },
      { key: "circunferenciaCintura", label: "Circ. Cintura", value: "72.0" },
      { key: "circunferenciaCadera", label: "Circ. Cadera", value: "98.0" },
      { key: "circunferenciaBraquial", label: "Circ. Braquial", value: "26.8" },
      { key: "circunferenciaPantorrilla", label: "Circ. Pantorrilla", value: "34.5" },
      { key: "alturaRodilla", label: "Altura Rodilla", value: "50.2" },
      { key: "diagnosticoNutricional", label: "Diagnóstico nutricional", value: "Eutrófica (IMC 24.1) con patrón alimentario vegetariano armónico. Mantención y apoyo en biodisponibilidad de micronutrientes." },
      { key: "rejectedFoods", label: "Alimentos rechazados", value: "Carnes de vacuno, cerdo, pollo, pescados y mariscos" },
    ],
    createdAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-11-05T11:00:00.000Z",
    lastVisit: "2026-11-05",
  },
];

export const DEMO_CLINICAL_RECORDS: Record<string, any> = {
  "pat-1": {
    id: "cr-1",
    patientId: "pat-1",
    vitalHistory: {
      occupation: "Ingeniera en Minas / Analista de Datos",
      workSchedule: "Lunes a Viernes 08:30 - 18:00 (Trabajo de oficina)",
      medications: "Metformina 850mg (1 vez al día con la cena)",
      supplementsOrDrugs: "Vitamina D3 2000 UI, Picolinato de Cromo 200mcg",
      diagnosedPathologies: "Resistencia a la Insulina, Dislipidemia leve",
      familyHistory: "Madre con Diabetes Mellitus Tipo 2, Padre hipertenso",
      sleepQuality: "6 horas diarias, sueño interrumpido",
      perceivedStress: "Moderado - Alto por jornada laboral",
      weeklyExercise: "Caminatas 20 min 3 veces por semana",
      motivoConsulta: "Control de peso, reducir fatiga vespertina y regular exámenes de insulina",
      manualCaloriesAdjustment: "-400",
      pesoObjetivoProf: "68.0",
    },
    anthropometry: {
      skinfolds: {
        tricipital: "24.5",
        bicipital: "16.2",
        subescapular: "22.0",
        suprailiac: "26.8",
      },
      circumferences: {
        kneeHeight: "49.5",
        calfCircumference: "38.2",
        armCircumference: "31.5",
        waistCircumference: "84.5",
        hipCircumference: "106.0",
      },
      pesoHabitual: "76.0",
    },
    nutritionalAnamnesis: {
      eatingPreferences: "Preparaciones rápidas de menos de 15 minutos, frutos secos, pescados al horno",
      rejectedFoods: "Lácteos enteros, frituras, brócoli hervido",
      clinicalObservations: "Buena adherencia al omitir refrescos azucarados; requiere apoyo en organización de compras semanales.",
      diagnosticoNutricional: "Obesidad Grado I (IMC 30.9) de origen exógeno asociada a insulino-resistencia severa. Foco en pauta hipocalórica normoproteica antiinflamatoria.",
      gestationalSymptoms: [],
      gestationalSupplementation: [],
    },
    gynecoObstetric: {
      isPregnant: false,
      pregnancyWeeks: "",
      pregestationalWeight: "",
      pregnancyType: "",
    },
    dataSources: {},
    createdAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-11-10T12:00:00.000Z",
  },
  "pat-2": {
    id: "cr-2",
    patientId: "pat-2",
    vitalHistory: {
      occupation: "Carpintero de ribera / Jubilado activo",
      workSchedule: "Mañanas en taller independiente (08:00 - 13:00)",
      medications: "Losartán 50mg/12h, Empagliflozina 10mg/24h",
      supplementsOrDrugs: "Calcio + Vitamina D3 500mg/400UI",
      diagnosedPathologies: "Diabetes Mellitus Tipo 2 compensada, Hipertensión Arterial Primaria",
      familyHistory: "Hermano con cardiopatía coronaria, Madre con diabetes",
      sleepQuality: "7 horas continuas, buen descanso reparador",
      perceivedStress: "Bajo",
      weeklyExercise: "Caminatas matutinas de 30 minutos todos los días",
      motivoConsulta: "Mantener HbA1c < 7.0% y control tensional reduciendo consumo de sodio",
      manualCaloriesAdjustment: "-250",
      pesoObjetivoProf: "72.0",
    },
    anthropometry: {
      skinfolds: {
        tricipital: "18.0",
        bicipital: "12.0",
        subescapular: "19.5",
        suprailiac: "21.0",
      },
      circumferences: {
        kneeHeight: "51.0",
        calfCircumference: "36.5",
        armCircumference: "30.0",
        waistCircumference: "96.0",
        hipCircumference: "101.5",
      },
      pesoHabitual: "82.0",
    },
    nutritionalAnamnesis: {
      eatingPreferences: "Comida tradicional del sur, merluza austral al vapor, papas nativas, ajo chilote y orégano",
      rejectedFoods: "Comida chatarra, embutidos con alto sodio, condimentos irritantes",
      clinicalObservations: "Excelente compromiso en la preparación al vapor sin sal de mesa añadida.",
      diagnosticoNutricional: "Sobrepeso en adulto mayor (IMC 28.0) según MINSAL. Control glucídico estable y adherencia cardioprotectora.",
      gestationalSymptoms: [],
      gestationalSupplementation: [],
    },
    gynecoObstetric: {
      isPregnant: false,
      pregnancyWeeks: "",
      pregestationalWeight: "",
      pregnancyType: "",
    },
    dataSources: {},
    createdAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-11-08T15:30:00.000Z",
  },
  "pat-3": {
    id: "cr-3",
    patientId: "pat-3",
    vitalHistory: {
      occupation: "Estudiante de Educación Física",
      workSchedule: "Clases universitarias de lunes a viernes (08:00 - 16:00)",
      medications: "Ninguno",
      supplementsOrDrugs: "Creatina Monohidrato 5g/día, Proteína Whey Isolate 30g post-entreno",
      diagnosedPathologies: "Sin patologías crónicas registradas",
      familyHistory: "Sin antecedentes de enfermedades crónicas no transmisibles",
      sleepQuality: "8 horas de descanso profundo reparador",
      perceivedStress: "Bajo",
      weeklyExercise: "Entrenamiento de hipertrofia y sobrecarga 5 días x 75 min",
      motivoConsulta: "Plan hipercalórico e hiperproteico (1.8g/kg) para ganancia de masa muscular limpia",
      manualCaloriesAdjustment: "+350",
      pesoObjetivoProf: "79.0",
    },
    anthropometry: {
      skinfolds: {
        tricipital: "9.2",
        bicipital: "5.0",
        subescapular: "10.4",
        suprailiac: "11.8",
      },
      circumferences: {
        kneeHeight: "56.0",
        calfCircumference: "37.8",
        armCircumference: "34.5",
        waistCircumference: "78.0",
        hipCircumference: "95.0",
      },
      pesoHabitual: "73.0",
    },
    nutritionalAnamnesis: {
      eatingPreferences: "Avena con leche descremada, huevos revueltos, arroz basmati, legumbres y pechuga de pollo",
      rejectedFoods: "Golosinas ultraprocesadas, frituras, bebidas alcohólicas",
      clinicalObservations: "Gran disciplina y constancia en pesaje de porciones e hidratación de 3L diarios.",
      diagnosticoNutricional: "Eutrófico activo (IMC 22.5) con bajo porcentaje de masa grasa (14.2%). Indicación de superávit energético planificado.",
      gestationalSymptoms: [],
      gestationalSupplementation: [],
    },
    gynecoObstetric: {
      isPregnant: false,
      pregnancyWeeks: "",
      pregestationalWeight: "",
      pregnancyType: "",
    },
    dataSources: {},
    createdAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-11-07T10:00:00.000Z",
  },
  "pat-4": {
    id: "cr-4",
    patientId: "pat-4",
    vitalHistory: {
      occupation: "Diseñadora UX / Docente",
      workSchedule: "Teletrabajo híbrido (09:00 - 17:30)",
      medications: "Anticonceptivos orales combinados",
      supplementsOrDrugs: "Cianocobalamina (B12) 2000 mcg semanal, Hierro bisglicinato 30mg con vitamina C",
      diagnosedPathologies: "Antecedente de anemia ferropénica superada",
      familyHistory: "Madre con hipotiroidismo primario en tratamiento con levotiroxina",
      sleepQuality: "7.5 horas continuas, despertar descansado",
      perceivedStress: "Moderado",
      weeklyExercise: "Yoga vinyasa y pilates reformer 4 veces por semana",
      motivoConsulta: "Optimizar biodisponibilidad de hierro, densidad proteica vegetal y tonificación muscular",
      manualCaloriesAdjustment: "-200",
      pesoObjetivoProf: "62.0",
    },
    anthropometry: {
      skinfolds: {
        tricipital: "15.2",
        bicipital: "9.8",
        subescapular: "14.0",
        suprailiac: "16.5",
      },
      circumferences: {
        kneeHeight: "50.2",
        calfCircumference: "34.5",
        armCircumference: "26.8",
        waistCircumference: "72.0",
        hipCircumference: "98.0",
      },
      pesoHabitual: "66.0",
    },
    nutritionalAnamnesis: {
      eatingPreferences: "Guisos de legumbres con pimientos rojos, hummus casero, quinoa tricolor, ensaladas abundantes",
      rejectedFoods: "Carnes de vacuno, cerdo, pollo, pescados y mariscos",
      clinicalObservations: "Excelente variedad de cereales integrales y legumbres; sin síntomas gastrointestinales.",
      diagnosticoNutricional: "Eutrófica (IMC 24.1) con patrón alimentario vegetariano armónico. Mantención y apoyo en biodisponibilidad de micronutrientes.",
      gestationalSymptoms: [],
      gestationalSupplementation: [],
    },
    gynecoObstetric: {
      isPregnant: false,
      pregnancyWeeks: "",
      pregestationalWeight: "",
      pregnancyType: "",
    },
    dataSources: {},
    createdAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-11-05T11:00:00.000Z",
  },
};

// ==========================================
// LocalStorage Persistence Helpers
// ==========================================

export function getLocalPatients(): any[] {
  if (typeof window === "undefined") return INITIAL_PATIENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
      return INITIAL_PATIENTS;
    }
    const parsed = JSON.parse(raw);
    if (
      !Array.isArray(parsed) ||
      parsed.length < INITIAL_PATIENTS.length ||
      !parsed[0]?.documentId ||
      parsed[0]?.dietRestrictions?.includes("Cocina poco")
    ) {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
      return INITIAL_PATIENTS;
    }
    return parsed;
  } catch {
    return INITIAL_PATIENTS;
  }
}

export function saveLocalPatients(patients: any[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  } catch (err) {
    console.error("Error saving patients to localStorage:", err);
  }
}

export function getLocalClinicalRecords(): Record<string, any> {
  if (typeof window === "undefined") return { ...DEMO_CLINICAL_RECORDS };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLINICAL_RECORDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CLINICAL_RECORDS, JSON.stringify(DEMO_CLINICAL_RECORDS));
      return { ...DEMO_CLINICAL_RECORDS };
    }
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed["pat-1"]?.anthropometry?.skinfolds?.tricipital ||
      !parsed["pat-4"]?.anthropometry?.skinfolds?.tricipital
    ) {
      localStorage.setItem(STORAGE_KEYS.CLINICAL_RECORDS, JSON.stringify(DEMO_CLINICAL_RECORDS));
      return { ...DEMO_CLINICAL_RECORDS };
    }
    return parsed;
  } catch {
    return { ...DEMO_CLINICAL_RECORDS };
  }
}

export function saveLocalClinicalRecords(records: Record<string, any>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.CLINICAL_RECORDS, JSON.stringify(records));
  } catch (err) {
    console.error("Error saving clinical records to localStorage:", err);
  }
}

export function getLocalConsultations(): any[] {
  if (typeof window === "undefined") return INITIAL_CONSULTATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONSULTATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(INITIAL_CONSULTATIONS));
      return INITIAL_CONSULTATIONS;
    }
    const parsed = JSON.parse(raw);
    if (
      !Array.isArray(parsed) ||
      parsed.length > 4 ||
      parsed.length < INITIAL_CONSULTATIONS.length ||
      !parsed[0]?.patientName
    ) {
      localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(INITIAL_CONSULTATIONS));
      return INITIAL_CONSULTATIONS;
    }
    return parsed;
  } catch {
    return INITIAL_CONSULTATIONS;
  }
}

export function saveLocalConsultations(consultations: any[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(consultations));
  } catch (err) {
    console.error("Error saving consultations to localStorage:", err);
  }
}

export function getLocalCreations(): any[] {
  if (typeof window === "undefined") return INITIAL_CREATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CREATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CREATIONS, JSON.stringify(INITIAL_CREATIONS));
      return INITIAL_CREATIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== INITIAL_CREATIONS.length) {
      localStorage.setItem(STORAGE_KEYS.CREATIONS, JSON.stringify(INITIAL_CREATIONS));
      return INITIAL_CREATIONS;
    }
    return parsed;
  } catch {
    return INITIAL_CREATIONS;
  }
}

export function saveLocalCreations(creations: any[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.CREATIONS, JSON.stringify(creations));
  } catch (err) {
    console.error("Error saving creations to localStorage:", err);
  }
}

export const INITIAL_COMMUNITY_FOODS = [
  {
    id: "custom-001",
    name: "Panqueques de Avena y Plátano Fit",
    brand: { id: "b-1", name: "Receta Nutri" },
    category: { id: "cat-cereales", name: "Cereales y Derivados" },
    price: 0,
    unit: "unidad",
    amount: 1,
    calories: 145,
    proteins: 7.2,
    carbs: 22.0,
    lipids: 3.1,
    sugars: 5.4,
    fiber: 3.2,
    sodium: 48,
    tags: [{ id: "t-1", name: "FIT" }, { id: "t-2", name: "ALTO EN FIBRA" }],
    isPublic: true,
    verified: true,
    isMine: false,
    author: "Dra. M. González (Comunidad)",
    createdAt: "2026-11-09T10:00:00.000Z",
  },
  {
    id: "custom-002",
    name: "Bowl de Yogur Griego con Chía y Frutos Rojos",
    brand: { id: "b-2", name: "Casero" },
    category: { id: "cat-lacteos", name: "Lácteos" },
    price: 0,
    unit: "porción",
    amount: 200,
    calories: 180,
    proteins: 16.5,
    carbs: 14.0,
    lipids: 4.8,
    sugars: 7.0,
    fiber: 4.5,
    sodium: 62,
    tags: [{ id: "t-3", name: "PROTEICO" }, { id: "t-4", name: "ANTIOXIDANTE" }],
    isPublic: true,
    verified: true,
    isMine: false,
    author: "Nut. C. Herrera (Comunidad)",
    createdAt: "2026-11-08T15:30:00.000Z",
  },
  {
    id: "custom-003",
    name: "Barra Proteica Casera de Maní y Semillas",
    brand: { id: "b-3", name: "Snack Saludable" },
    category: { id: "cat-semillas", name: "Semillas y Nueces" },
    price: 0,
    unit: "unidad",
    amount: 60,
    calories: 210,
    proteins: 12.0,
    carbs: 15.5,
    lipids: 11.2,
    sugars: 4.0,
    fiber: 5.0,
    sodium: 35,
    tags: [{ id: "t-5", name: "SIN AZÚCAR" }, { id: "t-6", name: "ENERGÉTICO" }],
    isPublic: true,
    verified: true,
    isMine: false,
    author: "Nut. F. Soto (Comunidad)",
    createdAt: "2026-11-07T18:00:00.000Z",
  },
];

export function getLocalCustomFoods(): any[] {
  if (typeof window === "undefined") return INITIAL_COMMUNITY_FOODS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOODS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(INITIAL_COMMUNITY_FOODS));
      return INITIAL_COMMUNITY_FOODS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_COMMUNITY_FOODS;
  } catch {
    return INITIAL_COMMUNITY_FOODS;
  }
}

export function saveLocalCustomFoods(foods: any[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.FOODS, JSON.stringify(foods));
  } catch (err) {
    console.error("Error saving foods to localStorage:", err);
  }
}


export function getLocalDashboardStats() {
  const patients = getLocalPatients();
  const consultations = getLocalConsultations();
  const creations = getLocalCreations();

  const activePatients = patients.filter((p) => p.status !== "Inactive").length;
  const inactivePatients = patients.length - activePatients;

  return {
    patients: {
      total: patients.length,
      active: activePatients,
      inactive: inactivePatients,
    },
    consultations: {
      total: consultations.length,
    },
    pdfs: {
      rapido: 24,
      pautas: 18,
      dietas: 12,
      recetas: 8,
    },
    planUsage: {
      planKey: "pro",
      isFree: false,
      percent: 45,
      limits: { patients: 999, consultations: 999, pdfs: 999 },
      usage: {
        patients: patients.length,
        consultations: consultations.length,
        pdfs: creations.length + 20,
      },
    },
    recentPatients: patients.slice(0, 4).map((p) => ({
      id: p.id,
      fullName: p.fullName,
      updatedAt: p.updatedAt || new Date().toISOString(),
      email: p.email || "",
    })),
    recentConsultations: consultations.slice(0, 3).map((c) => ({
      id: c.id,
      title: c.title,
      date: c.date,
      patient: c.patient || { id: c.patientId, fullName: "Paciente" },
    })),
  };
}

export function isGuestMode(): boolean {
  if (typeof window === "undefined") return false;

  try {
    if (localStorage.getItem("nutrinet_guest_session") === "true") return true;
    if (sessionStorage.getItem("guest_mode") === "nutritionist") return true;
  } catch {}

  const hasSession = document.cookie
    .split(";")
    .some((item) => item.trim().startsWith("auth_session_present="));

  // Si no hay sesión autenticada con JWT, la app opera en modo invitado por defecto
  return !hasSession;
}

export const isDemoMode = isGuestMode;

function makeMockResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function roundNum(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function calculateDemoClinical(inputs: any) {
  const gender = inputs.gender === "Masculino" || inputs.gender === "Femenino" ? inputs.gender : "Masculino";
  const resolvedAge = typeof inputs.ageYears === "number" ? inputs.ageYears : (typeof inputs.age === "number" ? inputs.age : 68);

  const kneeHeight = typeof inputs.kneeHeight === "number" ? inputs.kneeHeight : null;
  const armCircumference = typeof inputs.armCircumference === "number" ? inputs.armCircumference : null;
  const calfCircumference = typeof inputs.calfCircumference === "number" ? inputs.calfCircumference : null;
  const subescapular = typeof inputs.subescapularFold === "number" ? inputs.subescapularFold : null;
  const tricipital = typeof inputs.tricipitalFold === "number" ? inputs.tricipitalFold : null;

  // Stature & Weight Estimation (Chumlea)
  let estimatedHeight: number | null = null;
  if (kneeHeight && resolvedAge !== null) {
    if (gender === "Masculino") {
      estimatedHeight = roundNum(64.19 - 0.04 * resolvedAge + 2.02 * kneeHeight, 1);
    } else {
      estimatedHeight = roundNum(84.88 - 0.24 * resolvedAge + 1.83 * kneeHeight, 1);
    }
  }

  let estimatedWeight: number | null = null;
  if (kneeHeight && armCircumference && calfCircumference && subescapular) {
    if (gender === "Masculino") {
      estimatedWeight = roundNum(1.73 * armCircumference + 0.98 * calfCircumference + 0.37 * subescapular + 1.16 * kneeHeight - 81.69, 2);
    } else {
      estimatedWeight = roundNum(0.98 * armCircumference + 1.27 * calfCircumference + 0.4 * subescapular + 0.87 * kneeHeight - 62.35, 2);
    }
  }

  const rawWeight = typeof inputs.weight === "number" ? inputs.weight : (estimatedWeight || 68);
  const height = typeof inputs.height === "number" ? inputs.height : (estimatedHeight || 165);

  const edemaPercent = typeof inputs.edemaPercent === "number" ? inputs.edemaPercent : 0;
  const dryWeight = rawWeight && edemaPercent > 0 ? roundNum(rawWeight * (1 - edemaPercent / 100), 1) : null;
  const weight = dryWeight || rawWeight;

  const heightM = height / 100;
  const bmiVal = roundNum(weight / (heightM * heightM), 1);

  let bmiClassification = "Normopeso";
  let bmiColor = "#668E20";
  let bmiRef = "Criterio OMS";
  let bmiNote: string | undefined = undefined;

  if (resolvedAge >= 65) {
    bmiRef = "Criterio Lipschitz / OPS";
    bmiNote = "Umbrales ajustados para proteger al adulto mayor de sarcopenia.";
    if (bmiVal <= 23.0) {
      bmiClassification = "Bajo peso (Enflaquecido)";
      bmiColor = "#2563eb";
    } else if (bmiVal < 28.0) {
      bmiClassification = "Normopeso (Eutrófico)";
      bmiColor = "#668E20";
    } else if (bmiVal < 32.0) {
      bmiClassification = "Sobrepeso";
      bmiColor = "#d97706";
    } else {
      bmiClassification = "Obesidad";
      bmiColor = "#dc2626";
    }
  } else {
    if (bmiVal < 18.5) {
      bmiClassification = "Bajo peso";
      bmiColor = "#2563eb";
    } else if (bmiVal < 25) {
      bmiClassification = "Normopeso";
      bmiColor = "#668E20";
    } else if (bmiVal < 30) {
      bmiClassification = "Sobrepeso";
      bmiColor = "#d97706";
    } else if (bmiVal < 35) {
      bmiClassification = "Obesidad I";
      bmiColor = "#ea580c";
    } else {
      bmiClassification = "Obesidad II";
      bmiColor = "#dc2626";
    }
  }

  const bmi = {
    bmi: bmiVal,
    classification: bmiClassification,
    color: bmiColor,
    isPediatric: false,
    reference: bmiRef,
    note: bmiNote,
  };

  const targetBmi = inputs.targetBmi || (resolvedAge >= 65 ? 25.5 : 22.0);
  const targetIdealWeight = targetBmi * heightM * heightM;
  const adjustedWeight = roundNum(targetIdealWeight + 0.25 * (weight - targetIdealWeight), 1);

  const idealWeight = resolvedAge >= 65
    ? {
        min: roundNum(23.0 * heightM * heightM, 1),
        max: roundNum(28.0 * heightM * heightM, 1),
        reference: "IMC 23.0 - 28.0 (Lipschitz)",
        note: "Adulto mayor (objetivo central IMC 25.5).",
        supported: true,
      }
    : {
        min: roundNum(18.5 * heightM * heightM, 1),
        max: roundNum(24.9 * heightM * heightM, 1),
        reference: `Objetivo IMC ${targetBmi} (configurable)`,
        note: `Peso óptimo central estimado: ${roundNum(targetIdealWeight, 1)} kg.`,
        supported: true,
      };

  // Blackburn
  let weightLoss = null;
  if (typeof inputs.usualWeight === "number" && rawWeight) {
    const wUsual = inputs.usualWeight;
    const lossKg = roundNum(wUsual - rawWeight, 1);
    const percentLoss = roundNum(((wUsual - rawWeight) / wUsual) * 100, 1);
    const weeks = inputs.weightLossPeriodWeeks || 4;
    let periodLabel = "1 mes";
    let thresholdSignificant = 5;
    let thresholdSevere = 5.001;
    if (weeks <= 1.5) {
      periodLabel = "1 semana";
      thresholdSignificant = 1;
      thresholdSevere = 2.001;
    } else if (weeks <= 6) {
      periodLabel = "1 mes";
      thresholdSignificant = 5;
      thresholdSevere = 5.001;
    } else if (weeks <= 14) {
      periodLabel = "3 meses";
      thresholdSignificant = 7.5;
      thresholdSevere = 7.501;
    } else {
      periodLabel = "6 meses+";
      thresholdSignificant = 10;
      thresholdSevere = 10.001;
    }

    let severity: "normal" | "significativa" | "grave" = "normal";
    if (percentLoss >= thresholdSevere) severity = "grave";
    else if (percentLoss >= thresholdSignificant) severity = "significativa";

    weightLoss = {
      usualWeight: wUsual,
      currentWeight: rawWeight,
      periodWeeks: weeks,
      periodLabel,
      lossKg,
      percentLoss,
      severity,
      isAlert: severity === "grave",
    };
  }

  // Arm composition (Frisancho)
  let armComposition = null;
  if (armCircumference && tricipital) {
    const cb_mm = armCircumference * 10;
    const cmb_mm = cb_mm - Math.PI * tricipital;
    const atb_mm2 = Math.pow(cb_mm, 2) / (4 * Math.PI);
    const amb_mm2 = gender === "Masculino"
      ? Math.pow(cb_mm - Math.PI * tricipital, 2) / (4 * Math.PI) - 1000
      : Math.pow(cb_mm - Math.PI * tricipital, 2) / (4 * Math.PI) - 650;
    const agb_mm2 = atb_mm2 - amb_mm2;
    armComposition = {
      cmbMm: roundNum(cmb_mm, 1),
      atbMm2: roundNum(atb_mm2, 1),
      ambMm2: roundNum(amb_mm2, 1),
      agbMm2: roundNum(agb_mm2, 1),
      fatPercentage: roundNum((agb_mm2 / atb_mm2) * 100, 1),
    };
  }

  // Cardiovascular risk (ICC)
  let cardiovascularRisk = null;
  if (typeof inputs.waistCircumference === "number") {
    const cc = inputs.waistCircumference;
    const cca = typeof inputs.hipCircumference === "number" ? inputs.hipCircumference : null;
    let waistRiskNcep = "Bajo";
    let waistRiskIdf = "Bajo";
    if (gender === "Masculino") {
      if (cc >= 102) waistRiskNcep = "Aumentado";
      if (cc >= 90) waistRiskIdf = "Aumentado";
    } else {
      if (cc >= 88) waistRiskNcep = "Aumentado";
      if (cc >= 80) waistRiskIdf = "Aumentado";
    }
    let icc = null;
    let iccRisk = "No evaluable";
    if (cca !== null && cca > 0) {
      icc = roundNum(cc / cca, 2);
      iccRisk = gender === "Masculino" ? (icc > 0.95 ? "Elevado" : "Bajo") : (icc > 0.85 ? "Elevado" : "Bajo");
    }
    cardiovascularRisk = {
      waistCircumference: cc,
      hipCircumference: cca,
      icc,
      iccRisk,
      waistRiskNcep,
      waistRiskIdf,
    };
  }

  // Weight to use for energy requirements
  const isUsingUsual = inputs.useUsualWeightForRequirements === true || (weightLoss?.severity === "grave" && inputs.useUsualWeightForRequirements !== false);
  const reqWeight = isUsingUsual && typeof inputs.usualWeight === "number" ? inputs.usualWeight : weight;

  // TMB & GET
  const formula = inputs.tmbFormula || "mifflin-st-jeor";
  let tmb = gender === "Masculino"
    ? 10 * reqWeight + 6.25 * height - 5 * resolvedAge + 5
    : 10 * reqWeight + 6.25 * height - 5 * resolvedAge - 161;
  if (formula === "harris-benedict") {
    tmb = gender === "Masculino"
      ? 66.5 + 13.75 * reqWeight + 5.003 * height - 6.775 * resolvedAge
      : 655.1 + 9.563 * reqWeight + 1.85 * height - 4.676 * resolvedAge;
  }

  const baseFactors: Record<string, number> = {
    sedentario: 1.2,
    ligero: 1.375,
    moderado: 1.55,
    activo: 1.725,
    muy_activo: 1.9,
  };
  const factor = baseFactors[inputs.activityLevel || "sedentario"] || 1.2;
  const getVal = Math.round(tmb * factor);

  const carbPercent = inputs.carbPct ?? 55;
  const proteinPercent = inputs.proteinPct ?? 20;
  const fatPercent = inputs.fatPct ?? 25;

  const carbsGrams = Math.round((getVal * (carbPercent / 100)) / 4);
  const proteinGrams = Math.round((getVal * (proteinPercent / 100)) / 4);
  const fatsGrams = Math.round((getVal * (fatPercent / 100)) / 9);

  const energy = {
    tmb: Math.round(tmb),
    formula: formula === "harris-benedict" ? "Harris-Benedict (original, 1919)" : "Mifflin-St Jeor (1990)",
    get: getVal,
    activityFactor: factor,
    macros: {
      calories: getVal,
      protein: proteinGrams,
      carbs: carbsGrams,
      fats: fatsGrams,
      proteinPercent,
      carbsPercent: carbPercent,
      fatsPercent: fatPercent,
    },
  };

  // Protein requirements
  const proteinProfile = inputs.proteinProfile || (resolvedAge >= 65 ? "adulto_mayor" : "adulto_sano");
  const pProfiles: Record<string, { label: string; min: number; max: number }> = {
    adulto_sano: { label: "Adulto sano, mantención", min: 0.8, max: 1.0 },
    adulto_mayor: { label: "Adulto mayor (prevención sarcopenia)", min: 1.2, max: 1.5 },
    deportista: { label: "Deportista / hipertrofia", min: 1.6, max: 2.2 },
    renal_sin_dialisis: { label: "Enfermedad renal crónica sin diálisis", min: 0.6, max: 0.8 },
    renal_dialisis: { label: "Enfermedad renal en diálisis", min: 1.0, max: 1.2 },
    oncologico: { label: "Paciente oncológico / desnutrido", min: 1.2, max: 1.5 },
  };
  const selProf = pProfiles[proteinProfile] || pProfiles.adulto_sano;
  const minGrams = roundNum(reqWeight * selProf.min, 1);
  const maxGrams = roundNum(reqWeight * selProf.max, 1);
  const proteinRequirement = {
    profileKey: proteinProfile,
    profileLabel: selProf.label,
    minPerKg: selProf.min,
    maxPerKg: selProf.max,
    minGrams,
    maxGrams,
    minPercentGet: getVal > 0 ? roundNum(((minGrams * 4) / getVal) * 100, 1) : 0,
    maxPercentGet: getVal > 0 ? roundNum(((maxGrams * 4) / getVal) * 100, 1) : 0,
  };

  // Hydration
  const minMl = roundNum(reqWeight * 30, 0);
  const maxMl = roundNum(reqWeight * 35, 0);
  const hydration = {
    method: "Adulto (30-35 ml/kg/día)",
    minMl,
    maxMl,
    minL: roundNum(minMl / 1000, 2),
    maxL: roundNum(maxMl / 1000, 2),
    note: "Ajustar a la baja en patología renal o cardíaca; al alza con fiebre o pérdidas digestivas.",
  };

  // Exchange portions
  const exchangePortions = [
    { category: "Cereales, panes y tubérculos", amount: "1/2 taza cocida, 1 rebanada de pan o 1 papa pequeña", portions: 4, cho: 120, protein: 12, fat: 4, kcal: 560, profileId: "cereales_tuberculos" },
    { category: "Frutas", amount: "1 unidad mediana o 1 taza picada", portions: 3, cho: 45, protein: 0, fat: 0, kcal: 180, profileId: "frutas" },
    { category: "Verduras de bajo aporte", amount: "2 tazas crudas o 1 taza cocida", portions: 4, cho: 20, protein: 8, fat: 0, kcal: 100, profileId: "verduras_bajas" },
    { category: "Proteína magra", amount: "50 g cocidos o 1/2 pechuga pequeña", portions: 5, cho: 0, protein: 55, fat: 10, kcal: 325, profileId: "proteina_magra" },
    { category: "Lácteos descremados", amount: "1 taza de leche o yogurt descremado", portions: 2, cho: 24, protein: 16, fat: 0, kcal: 160, profileId: "lacteos_descremados" },
    { category: "Grasas y aceites", amount: "20 g de aceite o 1/4 de palta", portions: 3, cho: 0, protein: 0, fat: 60, kcal: 540, profileId: "grasas_saludables" },
  ];

  return {
    version: "2026-07-21-v3",
    calculatedAt: new Date().toISOString(),
    inputs: {
      gender,
      age: resolvedAge,
      weight: rawWeight,
      dryWeight,
      edemaPercent,
      height,
      targetBmi: inputs.targetBmi || (resolvedAge >= 65 ? 25.5 : 22.0),
      activityLevel: inputs.activityLevel || "sedentario",
      kneeHeight,
      calfCircumference,
      armCircumference,
      waistCircumference: inputs.waistCircumference || null,
      hipCircumference: inputs.hipCircumference || null,
      usualWeight: inputs.usualWeight || null,
      weightLossPeriodWeeks: inputs.weightLossPeriodWeeks || null,
      proteinProfile,
      useUsualWeightForRequirements: isUsingUsual,
      folds: {
        tricipital,
        subescapular,
        bicipital: null,
        suprailiaco: null,
      },
    },
    estimatedHeight,
    estimatedWeight,
    dryWeight,
    edemaPercent,
    bmi,
    idealWeight,
    adjustedWeight,
    weightLoss,
    armComposition,
    cardiovascularRisk,
    energy,
    proteinRequirement,
    hydration,
    exchangePortions,
  };
}

/**
 * Intercepta llamadas de fetchApi y responde directamente con localStorage
 * cuando se navega en modo demo sin iniciar sesión.
 */
export function handleDemoApi(path: string, init?: RequestInit): Response | Promise<Response> | null {
  if (!isDemoMode()) return null;

  const cleanPath = path.split("?")[0];
  const method = (init?.method || "GET").toUpperCase();

  // 1. Dashboard Stats
  if (cleanPath === "/dashboard/stats" || cleanPath.endsWith("/dashboard/stats")) {
    return makeMockResponse(getLocalDashboardStats());
  }

  // 2. Creaciones
  if (cleanPath === "/creations") {
    if (method === "GET") {
      return makeMockResponse(getLocalCreations());
    }
    if (method === "POST" && init?.body) {
      try {
        const body = JSON.parse(init.body as string);
        const creations = getLocalCreations();
        const newCreation = {
          id: `cr-${Date.now()}`,
          name: body.name || "Nueva Creación",
          type: body.type || "Pauta",
          createdAt: new Date().toISOString(),
          ...body,
        };
        saveLocalCreations([newCreation, ...creations]);
        return makeMockResponse(newCreation, 201);
      } catch {
        return makeMockResponse({ error: "Invalid body" }, 400);
      }
    }
  }

  if (cleanPath.startsWith("/creations/")) {
    const creationId = cleanPath.replace("/creations/", "").replace("/share", "");
    const creations = getLocalCreations();
    const found = creations.find((c: any) => c.id === creationId);

    if (cleanPath.endsWith("/share")) {
      return makeMockResponse({ message: "Creación compartida con el paciente (Demo)" }, 200);
    }
    if (method === "DELETE") {
      saveLocalCreations(creations.filter((c: any) => c.id !== creationId));
      return makeMockResponse({ success: true }, 200);
    }
    if (found) {
      return makeMockResponse(found);
    }
    return makeMockResponse({ error: "Creación no encontrada" }, 404);
  }

  // 3. Pacientes
  if (cleanPath === "/patients") {
    const patients = getLocalPatients();
    if (method === "GET") {
      const urlParams = new URLSearchParams(path.includes("?") ? path.split("?")[1] : "");
      const search = (urlParams.get("search") || "").toLowerCase().trim();
      const status = urlParams.get("status");

      let filtered = [...patients];
      if (search) {
        filtered = filtered.filter(
          (p) =>
            p.fullName.toLowerCase().includes(search) ||
            (p.email && p.email.toLowerCase().includes(search)),
        );
      }
      if (status === "Activos") {
        filtered = filtered.filter((p) => p.status !== "Inactive");
      } else if (status === "Inactivos") {
        filtered = filtered.filter((p) => p.status === "Inactive");
      }

      return makeMockResponse({
        data: filtered,
        meta: {
          total: filtered.length,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      });
    }

    if (method === "POST" && init?.body) {
      try {
        const body = JSON.parse(init.body as string);
        const newPatient = {
          id: `pat-${Date.now()}`,
          nutritionistId: "nutri-demo",
          status: "Active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...body,
        };
        const all = [newPatient, ...patients];
        saveLocalPatients(all);

        if (body.clinicalRecord) {
          const records = getLocalClinicalRecords();
          records[newPatient.id] = {
            id: `cr-${Date.now()}`,
            patientId: newPatient.id,
            ...body.clinicalRecord,
          };
          saveLocalClinicalRecords(records);
        }

        if (body.weight || body.height) {
          const consultations = getLocalConsultations();
          const baseConsultation = {
            id: `con-${Date.now()}`,
            patientId: newPatient.id,
            patientName: newPatient.fullName,
            patient: { id: newPatient.id, fullName: newPatient.fullName },
            title: "Evaluación antropométrica inicial (Ingreso)",
            date: newPatient.createdAt,
            description: "Registro inicial de ingreso del paciente.",
            notes: "Registro inicial de ingreso del paciente.",
            metrics: [
              ...(body.weight ? [{ key: "weight", label: "Peso", value: Number(body.weight), unit: "kg" }] : []),
              ...(body.height ? [{ key: "height", label: "Estatura", value: Number(body.height), unit: "cm" }] : []),
            ],
          };
          saveLocalConsultations([baseConsultation, ...consultations]);
        }

        return makeMockResponse(newPatient, 201);
      } catch {
        return makeMockResponse({ error: "Invalid patient body" }, 400);
      }
    }
  }

  // 4. Detalle / Mutación Paciente /patients/:id
  const patientIdMatch = cleanPath.match(/^\/patients\/([^/]+)$/);
  if (patientIdMatch) {
    const patientId = patientIdMatch[1];
    const patients = getLocalPatients();
    const existing = patients.find((p) => p.id === patientId);

    if (method === "GET") {
      return makeMockResponse(existing || patients[0]);
    }
    if (method === "PATCH" && init?.body) {
      try {
        const body = JSON.parse(init.body as string);
        const updated = patients.map((p) => (p.id === patientId ? { ...p, ...body, updatedAt: new Date().toISOString() } : p));
        saveLocalPatients(updated);
        return makeMockResponse({ ...existing, ...body });
      } catch {
        return makeMockResponse({ error: "Error updating patient" }, 400);
      }
    }
    if (method === "DELETE") {
      const remaining = patients.filter((p) => p.id !== patientId);
      saveLocalPatients(remaining);
      return makeMockResponse({ success: true });
    }
  }

  // 5. Consultas
  if (cleanPath === "/consultations") {
    const consultations = getLocalConsultations();
    if (method === "GET") {
      const urlParams = new URLSearchParams(path.includes("?") ? path.split("?")[1] : "");
      const patientId = urlParams.get("patientId");
      const search = (urlParams.get("search") || urlParams.get("q") || "").toLowerCase().trim();

      let filtered = [...consultations];
      if (patientId) {
        filtered = filtered.filter((c) => c.patientId === patientId);
      }
      if (search) {
        filtered = filtered.filter(
          (c) =>
            c.title?.toLowerCase().includes(search) ||
            c.patientName?.toLowerCase().includes(search) ||
            c.patient?.fullName?.toLowerCase().includes(search)
        );
      }

      return makeMockResponse({
        data: filtered,
        meta: {
          total: filtered.length,
          page: 1,
          lastPage: 1,
        },
      });
    }

    if (method === "POST" && init?.body) {
      try {
        const body = JSON.parse(init.body as string);
        const patients = getLocalPatients();
        const patient = patients.find((p) => p.id === body.patientId) || { fullName: "Paciente" };
        const newConsultation = {
          id: `con-${Date.now()}`,
          date: body.date || new Date().toISOString(),
          patientId: body.patientId || "pat-1",
          patientName: body.patientName || patient.fullName,
          patient: { id: body.patientId, fullName: patient.fullName },
          title: body.title || "Control de seguimiento nutricional",
          description: body.description || body.notes || "",
          notes: body.notes || body.description || "",
          metrics: Array.isArray(body.metrics)
            ? body.metrics
            : [
                { key: "weight", label: "Peso", value: body.weight || 70, unit: "kg" },
              ],
          ...body,
        };
        const updated = [newConsultation, ...consultations];
        saveLocalConsultations(updated);
        return makeMockResponse(newConsultation, 201);
      } catch {
        return makeMockResponse({ error: "Invalid consultation" }, 400);
      }
    }
  }

  // 5b. Detalle / Mutación Consulta /consultations/:id
  const consultationIdMatch = cleanPath.match(/^\/consultations\/([^/]+)$/);
  if (consultationIdMatch) {
    const consultationId = consultationIdMatch[1];
    const consultations = getLocalConsultations();
    const existing = consultations.find((c) => c.id === consultationId);

    if (method === "GET") {
      return makeMockResponse(existing || consultations[0]);
    }
    if (method === "PATCH" || method === "PUT") {
      try {
        const body = JSON.parse((init?.body as string) || "{}");
        const updated = consultations.map((c) =>
          c.id === consultationId ? { ...c, ...body } : c
        );
        saveLocalConsultations(updated);
        return makeMockResponse({ ...existing, ...body });
      } catch {
        return makeMockResponse({ error: "Error updating consultation" }, 400);
      }
    }
    if (method === "DELETE") {
      const remaining = consultations.filter((c) => c.id !== consultationId);
      saveLocalConsultations(remaining);
      return makeMockResponse({ success: true });
    }
  }

  // 5c. Consultas por Paciente /patients/:id/consultations
  const patientConsultationsMatch = cleanPath.match(/^\/patients\/([^/]+)\/consultations$/);
  if (patientConsultationsMatch) {
    const patientId = patientConsultationsMatch[1];
    const consultations = getLocalConsultations().filter((c) => c.patientId === patientId);
    return makeMockResponse({
      data: consultations,
      meta: { total: consultations.length, page: 1, lastPage: 1 },
    });
  }

  // 5d. Ficha Clínica /patients/:id/clinical-record
  const clinicalRecordMatch = cleanPath.match(/^\/patients\/([^/]+)\/clinical-record$/);
  if (clinicalRecordMatch) {
    const patientId = clinicalRecordMatch[1];
    const clinicalRecords = getLocalClinicalRecords();
    const record = clinicalRecords[patientId] || clinicalRecords["pat-1"];
    if (method === "GET") {
      return makeMockResponse(record);
    }
    if (method === "PATCH" || method === "PUT" || method === "POST") {
      try {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        const updatedRecord = { ...record, ...body, updatedAt: new Date().toISOString() };
        clinicalRecords[patientId] = updatedRecord;
        saveLocalClinicalRecords(clinicalRecords);
        return makeMockResponse(updatedRecord);
      } catch {
        return makeMockResponse(record);
      }
    }
  }

  // 5e. Contexto IA /patients/:id/ai-context
  const aiContextMatch = cleanPath.match(/^\/patients\/([^/]+)\/ai-context$/);
  if (aiContextMatch) {
    return makeMockResponse({
      context: "Paciente en seguimiento de recomposición corporal y adherencia a pauta INTA.",
    });
  }

  // 5f. Etiquetas /tags
  if (cleanPath === "/tags") {
    return makeMockResponse({
      data: [
        { id: "tag-1", name: "Resistencia Insulina", color: "#86A83C" },
        { id: "tag-2", name: "Vegetariano", color: "#10B981" },
        { id: "tag-3", name: "Celíaco", color: "#F59E0B" },
        { id: "tag-4", name: "Hipertrofia", color: "#6366F1" },
        { id: "tag-5", name: "Déficit Calórico", color: "#EC4899" },
        { id: "tag-6", name: "Hipertensión", color: "#EF4444" },
      ],
      meta: { total: 6, page: 1, limit: 50 },
    });
  }

  // 5g. Métricas Clínicas /metrics
  if (cleanPath === "/metrics") {
    return makeMockResponse([
      { key: "weight", name: "Peso Corporal", label: "Peso Corporal", unit: "kg" },
      { key: "body_fat", name: "% Grasa Corporal", label: "% Grasa Corporal", unit: "%" },
      { key: "muscle_mass", name: "Masa Muscular", label: "Masa Muscular", unit: "kg" },
      { key: "visceral_fat", name: "Grasa Visceral", label: "Grasa Visceral", unit: "lvl" },
      { key: "waist", name: "Circunferencia Cintura", label: "Circunferencia Cintura", unit: "cm" },
    ]);
  }

  // 6. Auth & Sesión
  if (cleanPath === "/auth/me" || cleanPath === "/auth/session-role") {
    return makeMockResponse({ user: DEMO_USER, role: "NUTRITIONIST" });
  }

  // 7. Permisos & Membresías
  if (cleanPath.startsWith("/permissions")) {
    return makeMockResponse({
      role: "NUTRITIONIST",
      entitlements: DEMO_USER.currentPlan.entitlements,
      plan: "pro",
    });
  }

  if (cleanPath.startsWith("/memberships") || cleanPath === "/payments/membership-status") {
    return makeMockResponse({
      requiresPlanSelection: false,
      accountPlan: "pro",
      hasPendingTransfer: false,
      entitlements: DEMO_USER.currentPlan.entitlements,
      usage: {
        patientsActive: 6,
        consultationsUsed: 6,
        followupsPrivateActive: 0,
        pdfUsed: 4,
        aiUsed: 2,
        calculatorUsed: 0,
      },
      currentPlan: DEMO_USER.currentPlan,
      subscription: {
        status: "active",
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2027-01-01T00:00:00.000Z",
        cancelAtPeriodEnd: false,
        canceledAt: null,
        daysRemaining: 365,
      },
    });
  }

  // 7.1. Calculadora Clínica Demo
  if (cleanPath === "/calculations/calculate") {
    try {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      return makeMockResponse(calculateDemoClinical(body));
    } catch {
      return makeMockResponse({ error: "Error en cálculo clínico demo" }, 400);
    }
  }

  // 7.2. Generación con IA para Pautas (/pautas/ai-generate) - Simulación Inteligente en Demo
  if (cleanPath === "/pautas/ai-generate") {
    const mockPauta = {
      meta: {
        isDemo: true,
        note: "Pauta generada con arquetipo clínico en Modo Demostración por el Copiloto Naty.",
      },
      paragraphs: [
        {
          category: "Lácteos y Bebidas Vegetales",
          categoryOptional: "Descremados / Sin azúcar añadida",
          portionsPerDay: "2 a 3 porciones al día",
          foods: [
            { portion: "1 taza (200 ml)", food: "Leche descremada o bebida de soya fortificada" },
            { portion: "1 unidad (125 g)", food: "Yogurt natural descremado sin endulzar" },
            { portion: "1 rebanada (30 g)", food: "Quesillo tradicional o queso fresco magro" },
          ],
        },
        {
          category: "Carnes, Huevos y Pescados",
          categoryOptional: "Proteínas magras de alto valor biológico",
          portionsPerDay: "2 porciones al día (almuerzo y cena)",
          foods: [
            { portion: "1 filete mediano (130 g)", food: "Pechuga de pollo o pavo a la plancha" },
            { portion: "1 trozo mediano (140 g)", food: "Pescado blanco o azul (merluza, reineta, salmón) al horno" },
            { portion: "2 unidades", food: "Huevos pochados, duros o revueltos con aceite de oliva" },
          ],
        },
        {
          category: "Verduras y Hortalizas",
          categoryOptional: "Libre consumo (alta densidad de fibra)",
          portionsPerDay: "Mínimo 3 platos o porciones al día",
          foods: [
            { portion: "1 plato hondo", food: "Mix de hojas verdes (lechuga, espinaca tierna, rúcula)" },
            { portion: "1 taza cocida", food: "Zapallo italiano, judías verdes o brócoli al vapor" },
            { portion: "1 taza picada", food: "Tomate, pepino de ensalada y zanahoria rallada con limón" },
          ],
        },
        {
          category: "Cereales y Tubérculos",
          categoryOptional: "Carbohidratos complejos integrales",
          portionsPerDay: "2 a 3 porciones al día",
          foods: [
            { portion: "3/4 taza cocida (120 g)", food: "Arroz integral o quinoa perlada" },
            { portion: "3/4 taza cocida (150 g)", food: "Papas cocidas con piel o camote al horno" },
            { portion: "1/2 taza en hojuelas (40 g)", food: "Avena integral machacada o salvado de avena" },
          ],
        },
        {
          category: "Frutas Frescas",
          categoryOptional: "Frutas de estación variadas con piel lavada",
          portionsPerDay: "2 a 3 porciones al día",
          foods: [
            { portion: "1 unidad regular", food: "Manzana verde, pera de agua o naranja" },
            { portion: "1 taza (150 g)", food: "Arándanos, frambuesas o frutillas frescas" },
            { portion: "2 unidades pequeñas", food: "Kiwis maduros o mandarinas" },
          ],
        },
        {
          category: "Grasas Saludables y Semillas",
          categoryOptional: "Ácidos grasos monoinsaturados y omega-3",
          portionsPerDay: "2 porciones al día",
          foods: [
            { portion: "1/4 unidad (50 g)", food: "Palta Hass madura" },
            { portion: "1 cucharadita (5 ml)", food: "Aceite de oliva extra virgen en crudo" },
            { portion: "1 cucharada (15 g)", food: "Semillas de chía, linaza o frutos secos (nueces, almendras)" },
          ],
        },
      ],
    };
    return new Promise<Response>((resolve) => {
      setTimeout(() => {
        resolve(makeMockResponse(mockPauta));
      }, 2400);
    });
  }

  // 7.3. Generación con IA para Recetas / Platos (/recipes/quick-ai-fill) - Motor de Agente Clínico Naty (Demo)
  if (cleanPath === "/recipes/quick-ai-fill") {
    try {
      const parsed = init?.body ? JSON.parse(init.body as string) : {};
      const payload = parsed?.payload || {};
      const patient = payload.patient || {};
      const patientId = payload.patientId || "";
      const rawTargets = payload.mealSectionTargets || [];
      const notes = (payload.notes || "").toLowerCase();
      const restrictions = Array.isArray(patient.restrictions)
        ? patient.restrictions.join(" ").toLowerCase()
        : "";
      const clinicalSummary = (patient.clinicalSummary || "").toLowerCase();
      const fitnessGoals = (patient.fitnessGoals || "").toLowerCase();

      // Detección de Arquetipo Clínico para Personalización Real del Agente
      const isInsulinResistance =
        patientId === "pat-1" ||
        restrictions.includes("insulina") ||
        clinicalSummary.includes("homa") ||
        restrictions.includes("lactosa") ||
        restrictions.includes("lácteos") ||
        notes.includes("insulina");

      const isHypertension =
        patientId === "pat-2" ||
        restrictions.includes("hipertensión") ||
        restrictions.includes("hipertension") ||
        restrictions.includes("sodio") ||
        clinicalSummary.includes("cardioprotector") ||
        clinicalSummary.includes("tensional");

      const isHypertrophy =
        patientId === "pat-3" ||
        notes.includes("hipertrofia") ||
        notes.includes("masa muscular") ||
        fitnessGoals.includes("muscular");

      const isVegetarian =
        patientId === "pat-4" ||
        restrictions.includes("vegetariano") ||
        restrictions.includes("vegano") ||
        notes.includes("vegetariano");

      // Catálogo gastronómico clínico chileno por sección y opción (0, 1, 2)
      const getClinicalDish = (sectionRaw: string, optionIndex: number) => {
        const sec = sectionRaw.toLowerCase().trim();
        const opt = Math.max(0, Math.min(2, optionIndex || 0));

        if (isInsulinResistance) {
          // Valentina Miranda: Resistencia a la Insulina + Sin Lácteos
          if (sec.includes("desayuno")) {
            const options = [
              {
                title: "Tostadas de masa madre con palta Hass y huevo pochado",
                description: "Sin lácteos. Baja carga glicémica con grasa monoinsaturada y proteína saciante.",
                prep: "Tostar el pan de masa madre, moler la palta con limón y coronar con huevo pochado.",
                portion: "1 rebanada con 1 huevo",
                cal: 310, prot: 14, carbs: 24, fats: 18,
                reason: "Bajo índice glicémico para evitar peak de insulina matutino; 100% libre de lácteos.",
                ing: [
                  { name: "Pan de masa madre", quantity: "1 rebanada (50g)", amount: 50, unit: "g" },
                  { name: "Palta Hass", quantity: "2 cdas (50g)", amount: 50, unit: "g" },
                  { name: "Huevo fresco", quantity: "1 unidad", amount: 60, unit: "g" },
                ],
              },
              {
                title: "Porridge de avena integral con leche vegetal, chía y canela",
                description: "Avena machacada con bebida de almendras y semillas ricas en omega-3.",
                prep: "Cocinar la avena con la bebida de almendras y canela en rama a fuego bajo por 5 min.",
                portion: "1 bowl mediano",
                cal: 280, prot: 10, carbs: 38, fats: 9,
                reason: "Fibra soluble (betaglucanos) para mejorar la sensibilidad a la insulina.",
                ing: [
                  { name: "Avena integral machacada", quantity: "1/2 taza (40g)", amount: 40, unit: "g" },
                  { name: "Bebida de almendras sin azúcar", quantity: "200 ml", amount: 200, unit: "ml" },
                  { name: "Semillas de chía", quantity: "1 cda (10g)", amount: 10, unit: "g" },
                ],
              },
              {
                title: "Omelette de claras y espinacas con champiñones al oliva",
                description: "Preparación normoproteica ligera sin lácteos añadidos.",
                prep: "Saltear las espinacas y champiñones con gotas de oliva, agregar los huevos batidos y dorar.",
                portion: "1 omelette individual",
                cal: 220, prot: 18, carbs: 6, fats: 14,
                reason: "Aporte de colina y polifenoles antiinflamatorios sin carga de carbohidratos.",
                ing: [
                  { name: "Huevos frescos", quantity: "2 unidades", amount: 120, unit: "g" },
                  { name: "Espinacas baby", quantity: "1 taza", amount: 60, unit: "g" },
                  { name: "Champiñones frescos", quantity: "1/2 taza", amount: 50, unit: "g" },
                  { name: "Aceite de oliva extra virgen", quantity: "1 cdta", amount: 5, unit: "ml" },
                ],
              },
            ];
            return options[opt];
          }

          if (sec.includes("almuerzo")) {
            const options = [
              {
                title: "Pechuga de pollo a la plancha con quinoa tricolor y zapallito italiano",
                description: "Plato metabólico balanceado con proteína magra y vegetales antiinflamatorios.",
                prep: "Grillar la pechuga a fuego medio con hierbas; servir con quinoa cocida y zapallitos salteados.",
                portion: "1 plato completo",
                cal: 440, prot: 38, carbs: 36, fats: 12,
                reason: "Control estricto de carga glicémica y saciedad prolongada para evitar fatiga postprandial.",
                ing: [
                  { name: "Pechuga de pollo deshuesada", quantity: "150g", amount: 150, unit: "g" },
                  { name: "Quinoa tricolor cocida", quantity: "3/4 taza (120g)", amount: 120, unit: "g" },
                  { name: "Zapallito italiano salteado", quantity: "1 taza", amount: 100, unit: "g" },
                  { name: "Aceite de oliva", quantity: "1 cdta", amount: 5, unit: "ml" },
                ],
              },
              {
                title: "Filete de reineta al vapor con puré rústico de coliflor y ensalada verde",
                description: "Pescado blanco magro con guarnición vegetal baja en carbohidratos.",
                prep: "Cocinar la reineta al vapor con limón y orégano; procesar la coliflor al vapor con gotas de oliva.",
                portion: "1 filete con 1 taza de puré",
                cal: 360, prot: 35, carbs: 18, fats: 11,
                reason: "Densidad de micronutrientes sin elevar glucosa; ácidos grasos protectores.",
                ing: [
                  { name: "Filete de reineta fresca", quantity: "160g", amount: 160, unit: "g" },
                  { name: "Coliflor cocida al vapor", quantity: "1.5 tazas", amount: 150, unit: "g" },
                  { name: "Mix de hojas verdes (lechuga, rúcula)", quantity: "1 plato", amount: 80, unit: "g" },
                ],
              },
              {
                title: "Salmón al horno con papas nativas al vapor y ensalada de espinacas",
                description: "Omega-3 marino con carbohidrato complejo de índice glicémico moderado.",
                prep: "Hornear el salmón a 180°C por 15 min; acompañar con papas nativas con piel y hojas verdes.",
                portion: "1 porción completa",
                cal: 460, prot: 34, carbs: 28, fats: 21,
                reason: "Ácidos grasos EPA/DHA para modular resistencia a la insulina y perfil lipídico.",
                ing: [
                  { name: "Salmón fresco", quantity: "140g", amount: 140, unit: "g" },
                  { name: "Papas nativas con piel", quantity: "1 papa mediana (100g)", amount: 100, unit: "g" },
                  { name: "Espinacas tiernas", quantity: "1 taza", amount: 60, unit: "g" },
                ],
              },
            ];
            return options[opt];
          }

          if (sec.includes("once")) {
            const options = [
              {
                title: "Pan pita integral con pasta de huevo duro y ciboulette",
                description: "Once tradicional chilena adaptada sin mayonesa ni lácteos.",
                prep: "Moler el huevo duro con mostaza natural y ciboulette picado; rellenar la pita integral tostada.",
                portion: "1 unidad",
                cal: 260, prot: 14, carbs: 26, fats: 9,
                reason: "Reemplazo saludable y saciante sin grasas saturadas inflamatorias.",
                ing: [
                  { name: "Pan pita integral", quantity: "1 unidad (50g)", amount: 50, unit: "g" },
                  { name: "Huevo duro", quantity: "1 unidad", amount: 60, unit: "g" },
                  { name: "Ciboulette fresco", quantity: "1 cda", amount: 5, unit: "g" },
                ],
              },
              {
                title: "Pudín de chía con leche de almendras y semillas de girasol",
                description: "Preparación refrescante alta en fibra mucilaginosa.",
                prep: "Hidratar la chía en leche vegetal fría con canela y esencia de vainilla por 30 min.",
                portion: "1 frasco mediano",
                cal: 230, prot: 8, carbs: 16, fats: 13,
                reason: "Fibra que retarda el vaciamiento gástrico y estabiliza la curva de glucosa.",
                ing: [
                  { name: "Semillas de chía", quantity: "2 cdas (20g)", amount: 20, unit: "g" },
                  { name: "Bebida de almendras", quantity: "180 ml", amount: 180, unit: "ml" },
                  { name: "Semillas de girasol", quantity: "1 cdta", amount: 5, unit: "g" },
                ],
              },
              {
                title: "Tostada de centeno con hummus casero y semillas de sésamo",
                description: "Snack saciante de proteína vegetal y fibra.",
                prep: "Tostar el pan de centeno y untar con 2 cucharadas de hummus casero.",
                portion: "1 tostada grande",
                cal: 240, prot: 9, carbs: 30, fats: 8,
                reason: "Carbohidratos complejos de absorción lenta y libres de alérgenos lácteos.",
                ing: [
                  { name: "Pan de centeno integral", quantity: "1 rebanada grande", amount: 50, unit: "g" },
                  { name: "Hummus de garbanzos", quantity: "2 cdas (40g)", amount: 40, unit: "g" },
                ],
              },
            ];
            return options[opt];
          }

          if (sec.includes("cena")) {
            const options = [
              {
                title: "Pechuga de pavo asada a las hierbas con salteado de verduras",
                description: "Cena liviana de digestión rápida para favorecer el descanso nocturno.",
                prep: "Sellar el pavo con ajo y orégano; saltear pimientos, zapallito y zanahoria al dente.",
                portion: "1 plato tendido",
                cal: 320, prot: 34, carbs: 14, fats: 10,
                reason: "Aporte proteico nocturno sin sobrecarga digestiva ni glicémica.",
                ing: [
                  { name: "Pechuga de pavo", quantity: "140g", amount: 140, unit: "g" },
                  { name: "Mix de verduras salteadas", quantity: "1.5 tazas", amount: 150, unit: "g" },
                  { name: "Aceite de oliva", quantity: "1 cdta", amount: 5, unit: "ml" },
                ],
              },
              {
                title: "Tortilla de acelga y zanahoria con ensalada fresca de pepino y palta",
                description: "Preparación casera chilena rica en magnesio y fibra.",
                prep: "Picar la acelga cocida, mezclar con huevos batidos y cuajar al sartén sin quemar.",
                portion: "1 porción individual",
                cal: 290, prot: 16, carbs: 12, fats: 18,
                reason: "Magnesio biodisponible para apoyar la vía de señalización del receptor de insulina.",
                ing: [
                  { name: "Acelgas frescas cocidas", quantity: "1 taza", amount: 100, unit: "g" },
                  { name: "Huevos frescos", quantity: "2 unidades", amount: 120, unit: "g" },
                  { name: "Palta Hass en cubos", quantity: "1/4 unidad", amount: 40, unit: "g" },
                ],
              },
              {
                title: "Filete de merluza al horno con ensalada tibia de porotos verdes",
                description: "Proteína marina magra con vegetales verdes ricos en folatos.",
                prep: "Hornear el filete con limón y perejil; blanquear los porotos verdes al dente.",
                portion: "1 filete con 1 taza de vegetales",
                cal: 280, prot: 32, carbs: 10, fats: 8,
                reason: "Bajo en calorías y nulo en azúcares para optimizar la oxidación lipídica nocturna.",
                ing: [
                  { name: "Merluza fresca", quantity: "150g", amount: 150, unit: "g" },
                  { name: "Porotos verdes", quantity: "1 taza (100g)", amount: 100, unit: "g" },
                ],
              },
            ];
            return options[opt];
          }
        }

        if (isHypertension) {
          // Don Luis Mansilla: Cardioprotector, Reducción de Sodio, DM2
          if (sec.includes("desayuno")) {
            const options = [
              {
                title: "Avena machacada con manzana rallada, canela y nueces chilenas",
                description: "Desayuno cardioprotector 100% libre de sodio añadido.",
                prep: "Hidratar la avena con agua tibia o leche descremada; añadir manzana rallada y nueces picadas.",
                portion: "1 bowl mediano",
                cal: 310, prot: 11, carbs: 42, fats: 10,
                reason: "Potasio y fibra soluble para control de presión arterial y absorción de glucosa.",
                ing: [
                  { name: "Avena integral machacada", quantity: "1/2 taza (40g)", amount: 40, unit: "g" },
                  { name: "Manzana verde rallada", quantity: "1/2 unidad", amount: 70, unit: "g" },
                  { name: "Nueces chilenas", quantity: "3 unidades", amount: 15, unit: "g" },
                ],
              },
              {
                title: "Pan de masa madre sin sal añadida con palta molida y orégano",
                description: "Grasas monoinsaturadas cardioprotectoras con hierbas aromáticas.",
                prep: "Tostar el pan, cubrir con palta molida y sazonar exclusivamente con orégano fresco.",
                portion: "1 rebanada con 50g palta",
                cal: 270, prot: 6, carbs: 28, fats: 15,
                reason: "Ácido oleico y fitoesteroles protectores del endotelio vascular.",
                ing: [
                  { name: "Pan de masa madre sin sal", quantity: "1 rebanada (50g)", amount: 50, unit: "g" },
                  { name: "Palta Hass", quantity: "2 cdas (50g)", amount: 50, unit: "g" },
                ],
              },
              {
                title: "Yogurt descremado sin azúcar con semillas de chía y arándanos",
                description: "Aporte de calcio y polifenoles sin sodio oculto.",
                prep: "Mezclar el yogurt con chía y arándanos frescos de estación.",
                portion: "1 pocillo individual",
                cal: 220, prot: 12, carbs: 24, fats: 6,
                reason: "Antocianinas vasoprotectoras y calcio para regulación tensional.",
                ing: [
                  { name: "Yogurt natural descremado", quantity: "1 pote (150g)", amount: 150, unit: "g" },
                  { name: "Arándanos frescos", quantity: "1/2 taza", amount: 50, unit: "g" },
                  { name: "Semillas de chía", quantity: "1 cdta", amount: 5, unit: "g" },
                ],
              },
            ];
            return options[opt];
          }

          if (sec.includes("almuerzo")) {
            const options = [
              {
                title: "Merluza austral al horno con papas nativas al vapor y orégano chilote",
                description: "Plato costero tradicional bajo en sodio con papas nativas ricas en potasio.",
                prep: "Hornear la merluza con gotas de oliva, ajo y orégano; servir con papas al vapor con piel.",
                portion: "1 porción completa",
                cal: 420, prot: 36, carbs: 38, fats: 10,
                reason: "Balance sodio/potasio ideal para optimizar la función endotelial y renal.",
                ing: [
                  { name: "Merluza austral", quantity: "160g", amount: 160, unit: "g" },
                  { name: "Papas nativas al vapor", quantity: "1 unidad mediana", amount: 120, unit: "g" },
                  { name: "Ensalada de espinacas y pepino", quantity: "1 plato", amount: 80, unit: "g" },
                ],
              },
              {
                title: "Lentejas guisadas con zapallo, arroz integral y ensalada de betarraga",
                description: "Plato de cuchara tradicional chileno alto en fibra y nitratos naturales.",
                prep: "Cocinar las lentejas con zapallo y verduras sin caldo concentrado; servir con betarraga cocida.",
                portion: "1 plato hondo",
                cal: 450, prot: 22, carbs: 64, fats: 8,
                reason: "Nitratos dietéticos de la betarraga que promueven vasodilatación saludable.",
                ing: [
                  { name: "Lentejas cocidas", quantity: "1 taza", amount: 160, unit: "g" },
                  { name: "Zapallo camote", quantity: "1/2 taza", amount: 80, unit: "g" },
                  { name: "Arroz integral", quantity: "1/2 taza", amount: 80, unit: "g" },
                ],
              },
              {
                title: "Pechuga de pavo asada al romero con puré rústico de papas y tomate",
                description: "Carne blanca magra condimentada con hierbas de huerto.",
                prep: "Dorar el pavo con romero fresco y aceite de oliva; acompañar con puré sin mantequilla.",
                portion: "1 plato individual",
                cal: 410, prot: 35, carbs: 36, fats: 11,
                reason: "Proteína magra sin conservantes ni salitre de embutidos comerciales.",
                ing: [
                  { name: "Pechuga de pavo", quantity: "150g", amount: 150, unit: "g" },
                  { name: "Papas cocidas con piel", quantity: "1 mediana", amount: 110, unit: "g" },
                  { name: "Tomate natural con orégano", quantity: "1 unidad", amount: 100, unit: "g" },
                ],
              },
            ];
            return options[opt];
          }

          if (sec.includes("once")) {
            const options = [
              {
                title: "Tostadas de centeno integral con tomate natural y orégano sin sal",
                description: "Colación tradicional con fibra y licopeno cardioprotector.",
                prep: "Tostar el pan, frotar un diente de ajo suavemente y disponer rodajas de tomate maduro.",
                portion: "1 tostada grande",
                cal: 210, prot: 6, carbs: 32, fats: 6,
                reason: "Cero sodio añadido y licopeno antioxidante para salud cardiovascular.",
                ing: [
                  { name: "Pan de centeno integral", quantity: "1 rebanada", amount: 50, unit: "g" },
                  { name: "Tomate maduro", quantity: "1/2 unidad", amount: 60, unit: "g" },
                ],
              },
              {
                title: "Avena cocida con leche descremada tibia y canela en rama",
                description: "Preparación cálida tradicional del sur de Chile.",
                prep: "Cocer la avena en leche descremada a fuego lento sin azúcar.",
                portion: "1 taza",
                cal: 230, prot: 10, carbs: 36, fats: 4,
                reason: "Suavidad gástrica y aporte de calcio con bajo índice glicémico.",
                ing: [
                  { name: "Avena", quantity: "1/3 taza", amount: 30, unit: "g" },
                  { name: "Leche descremada", quantity: "1 taza", amount: 200, unit: "ml" },
                ],
              },
              {
                title: "Pan de molde integral con queso fresco bajo en sodio y albahaca",
                description: "Alternativa equilibrada para la once sin embutidos.",
                prep: "Disponer el queso fresco bajo en sodio con hojas de albahaca fresca.",
                portion: "1 porción",
                cal: 220, prot: 11, carbs: 24, fats: 8,
                reason: "Aporte de proteína láctea de bajo tenor graso y sin exceso de cloruro de sodio.",
                ing: [
                  { name: "Pan integral de molde", quantity: "1 rebanada", amount: 40, unit: "g" },
                  { name: "Queso fresco bajo en sodio", quantity: "40g", amount: 40, unit: "g" },
                ],
              },
            ];
            return options[opt];
          }

          if (sec.includes("cena")) {
            const options = [
              {
                title: "Crema casera de zapallo y zanahoria con filete de pavo a las hierbas",
                description: "Cena suave, digestiva y reconfortante.",
                prep: "Procesar el zapallo y zanahoria cocidos con caldo de verduras casero; acompañar con pavo.",
                portion: "1 bowl de crema con 100g de pavo",
                cal: 310, prot: 28, carbs: 24, fats: 9,
                reason: "Carotenoides y agua vegetal para hidratación celular y descanso nocturno.",
                ing: [
                  { name: "Zapallo y zanahoria", quantity: "1.5 tazas", amount: 150, unit: "g" },
                  { name: "Pechuga de pavo", quantity: "110g", amount: 110, unit: "g" },
                ],
              },
              {
                title: "Jurel al vapor con verduras salteadas al oliva y limón",
                description: "Pescado azul chileno con alto contenido de ácidos grasos omega-3.",
                prep: "Cocinar el jurel con hojas de laurel al vapor; saltear zanahoria, zapallito y pimientos.",
                portion: "1 filete con 1 taza de verduras",
                cal: 340, prot: 32, carbs: 12, fats: 16,
                reason: "Cardioprotección profunda por su ratio EPA/DHA de origen pelágico.",
                ing: [
                  { name: "Jurel fresco", quantity: "140g", amount: 140, unit: "g" },
                  { name: "Verduras salteadas", quantity: "1 taza", amount: 100, unit: "g" },
                ],
              },
              {
                title: "Sopa casera de verduras con huevo pochado y crutones de centeno",
                description: "Caldo casero sin cubos concentrados, enriquecido con proteína de huevo.",
                prep: "Hervir apio, puerro y zanahoria; verter sobre plato hondo con 1 huevo pochado encima.",
                portion: "1 plato hondo",
                cal: 250, prot: 14, carbs: 22, fats: 11,
                reason: "Hidratación nocturna y aminoácidos esenciales sin hipertensión secundaria.",
                ing: [
                  { name: "Caldo de verduras naturales", quantity: "1 taza", amount: 250, unit: "ml" },
                  { name: "Huevo fresco", quantity: "1 unidad", amount: 60, unit: "g" },
                ],
              },
            ];
            return options[opt];
          }
        }

        // Caso General / Fallback Equilibrado
        const defaults: Record<string, any[]> = {
          desayuno: [
            {
              title: "Bowl de avena tibia con chía, canela y berries frescos",
              description: "Desayuno energético de carbohidratos complejos y antioxidantes.",
              prep: "Cocer la avena con agua o leche descremada por 3 min y decorar con frutos del bosque.",
              portion: "1 bowl mediano",
              cal: 320, prot: 12, carbs: 48, fats: 8,
              reason: "Energía sostenida y fibra prebiótica para salud digestiva.",
              ing: [{ name: "Avena integral", quantity: "1/2 taza", amount: 40, unit: "g" }],
            },
            {
              title: "Tostadas integrales con palta Hass y huevo revuelto",
              description: "Clásico desayuno chileno balanceado en macronutrientes.",
              prep: "Tostar el pan, montar la palta molida y acompañar con huevo preparado con gotas de aceite.",
              portion: "1 rebanada con 1 huevo",
              cal: 290, prot: 13, carbs: 24, fats: 16,
              reason: "Excelente ratio proteico-lipídico con alta saciedad matutina.",
              ing: [{ name: "Pan integral", quantity: "1 rebanada", amount: 45, unit: "g" }],
            },
            {
              title: "Yogurt natural con granola casera y frutas de la estación",
              description: "Opción fresca y crocante rica en probióticos y fibra.",
              prep: "Verter el yogurt en pocillo y mezclar con granola de avena y frutos secos.",
              portion: "1 pote con 2 cdas granola",
              cal: 280, prot: 14, carbs: 36, fats: 9,
              reason: "Probióticos activos para microbiota intestinal y densidad de calcio.",
              ing: [{ name: "Yogurt natural", quantity: "1 pote (150g)", amount: 150, unit: "g" }],
            },
          ],
          almuerzo: [
            {
              title: "Pechuga de pollo a la plancha con quinoa y mix de hojas verdes",
              description: "Plato principal magro de alto valor biológico.",
              prep: "Dorar la pechuga sazonada con hierbas y servir con quinoa cocida y ensalada fresca.",
              portion: "1 plato tendido",
              cal: 440, prot: 38, carbs: 36, fats: 12,
              reason: "Perfil de aminoácidos completo con carbohidratos de absorción gradual.",
              ing: [{ name: "Pechuga de pollo", quantity: "150g", amount: 150, unit: "g" }],
            },
            {
              title: "Filete de reineta al horno con papas cocidas y ensalada chilena",
              description: "Pescado blanco tradicional con vegetales frescos y papas con piel.",
              prep: "Hornear la reineta con limón y sal marina moderada; acompañar con papas y tomate.",
              portion: "1 filete con 1 papa mediana",
              cal: 410, prot: 35, carbs: 34, fats: 11,
              reason: "Bajo en grasas saturadas, alto en fósforo y de digestibilidad óptima.",
              ing: [{ name: "Reineta fresca", quantity: "160g", amount: 160, unit: "g" }],
            },
            {
              title: "Guiso de lentejas con zapallo camote y arroz integral",
              description: "Combinación de legumbre y cereal para proteína vegetal completa.",
              prep: "Cocinar las lentejas a fuego lento con zapallo y verduras; mezclar con arroz al dente.",
              portion: "1 plato hondo",
              cal: 460, prot: 24, carbs: 66, fats: 8,
              reason: "Fibra fermentable y minerales esenciales (hierro y magnesio).",
              ing: [{ name: "Lentejas", quantity: "1 taza cocida", amount: 150, unit: "g" }],
            },
          ],
          once: [
            {
              title: "Pan marraqueta tostada con palta y tomate fresco",
              description: "La once más clásica de Chile adaptada nutricionalmente.",
              prep: "Tostar 1/2 marraqueta sin miga y rellenar con palta molida y rodajas de tomate.",
              portion: "1/2 unidad (diente)",
              cal: 240, prot: 5, carbs: 32, fats: 10,
              reason: "Aporte energético vespertino con grasas cardioprotectoras naturales.",
              ing: [{ name: "Pan marraqueta", quantity: "1/2 unidad (50g)", amount: 50, unit: "g" }],
            },
            {
              title: "Yogurt batido con semillas de chía y frutillas laminadas",
              description: "Once ligera y saciante con antioxidantes naturales.",
              prep: "Mezclar el yogurt con chía y coronar con frutillas frescas lavadas.",
              portion: "1 pocillo",
              cal: 210, prot: 11, carbs: 26, fats: 6,
              reason: "Aporte de calcio y vitamina C sin saturar la digestión.",
              ing: [{ name: "Yogurt descremado", quantity: "150g", amount: 150, unit: "g" }],
            },
            {
              title: "Pan de molde integral con huevo duro molido y ciboulette",
              description: "Proteína magra para mantener la saciedad hasta la cena.",
              prep: "Tostar el pan y montar el huevo duro molido con gotas de limón y ciboulette.",
              portion: "1 rebanada",
              cal: 220, prot: 10, carbs: 22, fats: 9,
              reason: "Saciedad estable y prevención de picoteo nocturno.",
              ing: [{ name: "Huevo duro", quantity: "1 unidad", amount: 60, unit: "g" }],
            },
          ],
          cena: [
            {
              title: "Filete de reineta al vapor con ensalada tibia de zapallito y zanahoria",
              description: "Cena liviana y reconfortante.",
              prep: "Cocinar el pescado con hierbas aromáticas; saltear los zapallitos en tiras finas.",
              portion: "1 filete con 1.5 tazas de verdura",
              cal: 310, prot: 32, carbs: 14, fats: 11,
              reason: "Digestión rápida para asegurar calidad del sueño profundo.",
              ing: [{ name: "Reineta", quantity: "150g", amount: 150, unit: "g" }],
            },
            {
              title: "Pechuga de pavo grillada con ensalada fresca de espinacas y palta",
              description: "Proteína magra nocturna con grasas esenciales.",
              prep: "Grillar la pechuga a la plancha; mezclar hojas verdes con láminas de palta.",
              portion: "1 plato tendido",
              cal: 330, prot: 34, carbs: 8, fats: 16,
              reason: "Triptófano precursor de melatonina y nulo estímulo insulínico.",
              ing: [{ name: "Pechuga de pavo", quantity: "140g", amount: 140, unit: "g" }],
            },
            {
              title: "Tortilla de verduras con ensalada fresca de tomate y pepino",
              description: "Plato vegetariano tibio de preparación rápida.",
              prep: "Batir 2 huevos con acelgas y zanahoria rallada; cocinar al sartén antiadherente.",
              portion: "1 porción individual",
              cal: 270, prot: 15, carbs: 12, fats: 17,
              reason: "Aporte equilibrado de micronutrientes y proteína de fácil asimilación.",
              ing: [{ name: "Huevos", quantity: "2 unidades", amount: 120, unit: "g" }],
            },
          ],
        };

        const secKey = sec.includes("desayuno")
          ? "desayuno"
          : sec.includes("once")
          ? "once"
          : sec.includes("cena")
          ? "cena"
          : "almuerzo";
        const list = defaults[secKey] || defaults.almuerzo;
        return list[opt] || list[0];
      };

      const dishes = rawTargets.map((target: any, idx: number) => {
        const mealSection = target.mealSection || "Almuerzo";
        const optionIndex = Number.isInteger(target.optionIndex) ? target.optionIndex : 0;
        const slotId = target.slotId || `slot-${idx}`;
        const clinicalDish = getClinicalDish(mealSection, optionIndex);

        return {
          slotId,
          optionIndex,
          mealSection,
          title: clinicalDish.title,
          description: clinicalDish.description,
          preparation: clinicalDish.prep,
          recommendedPortion: clinicalDish.portion,
          portions: 1,
          calories: clinicalDish.cal,
          protein: clinicalDish.prot,
          carbs: clinicalDish.carbs,
          fats: clinicalDish.fats,
          clinicalReasoning: clinicalDish.reason,
          ingredients: clinicalDish.ing || [
            { name: "Alimento base", quantity: "1 porción", amount: 100, unit: "g" },
          ],
        };
      });

      const responsePayload = {
        dishes: dishes.length > 0 ? dishes : [
          {
            slotId: "slot-default",
            optionIndex: 0,
            mealSection: "Almuerzo",
            title: "Pechuga de pollo a la plancha con quinoa y ensalada verde",
            description: "Plato balanceado rico en proteínas magras y fibra.",
            preparation: "Grillar la pechuga y servir con quinoa cocida.",
            recommendedPortion: "1 plato",
            portions: 1,
            calories: 450,
            protein: 38,
            carbs: 42,
            fats: 11,
            clinicalReasoning: "Aporte balanceado normoproteico para el objetivo clínico.",
            ingredients: [
              { name: "Pechuga de pollo", quantity: "150g", amount: 150, unit: "g" },
              { name: "Quinoa", quantity: "1 taza", amount: 120, unit: "g" },
            ],
          },
        ],
        meta: {
          isDemo: true,
          note: "Generación asistida y auditada por Agente Clínico Naty (Modo Demo inteligente).",
          clinicalAudit: {
            passed: true,
            isDemo: true,
            verifiedRestrictions: Array.isArray(patient.restrictions) ? patient.restrictions : [],
            clinicalSummary: patient.clinicalSummary || "Perfil analizado y verificado por el agente clínico.",
          },
        },
      };

      return new Promise<Response>((resolve) => {
        setTimeout(() => {
          resolve(makeMockResponse(responsePayload));
        }, 2800);
      });
    } catch {
      return makeMockResponse({ dishes: [], meta: { isDemo: true, note: "Demo fallback" } });
    }
  }

  // 8. Ratings status (silenciar modales de calificación en demo)
  if (cleanPath === "/ratings/status") {
    return makeMockResponse({ hasRated: true, eligibleForAutoPrompt: false });
  }

  // 9. Support y Leads
  if (cleanPath === "/support" && method === "POST") {
    try {
      const body = JSON.parse((init?.body as string) || "{}");
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPORT) || "[]");
      localStorage.setItem(STORAGE_KEYS.SUPPORT, JSON.stringify([...existing, { ...body, date: new Date().toISOString() }]));
      return makeMockResponse({ success: true, id: `sup-${Date.now()}` });
    } catch {
      return makeMockResponse({ success: true });
    }
  }

  // 10. Catálogo y Búsqueda de Alimentos (/foods, /ingredients, /foods/search)
  if (cleanPath === "/foods" || cleanPath === "/foods/search" || cleanPath === "/ingredients") {
    const customFoods = getLocalCustomFoods();
    const urlParams = new URLSearchParams(path.includes("?") ? path.split("?")[1] : "");
    const search = urlParams.get("search") || urlParams.get("q") || "";
    const category = urlParams.get("category") || urlParams.get("group") || "";
    const tab = urlParams.get("tab") || "app";
    const limit = urlParams.get("limit") ? parseInt(urlParams.get("limit")!, 10) : 1000;

    if (method === "GET") {
      let baseList = [];
      if (tab === "mine" || tab === "created" || tab === "community") {
        baseList = customFoods;
      } else {
        baseList = [...customFoods, ...OFFICIAL_INGREDIENTS];
      }

      const filtered = searchLocalIngredients(baseList, search, category, limit);
      return makeMockResponse(filtered);
    }

    if (method === "POST" && init?.body) {
      try {
        const body = JSON.parse(init.body as string);
        const newFood = {
          id: `food-${Date.now()}`,
          name: body.name || "Nuevo Alimento",
          category:
            typeof body.category === "string"
              ? { id: `cat-${Date.now()}`, name: body.category }
              : body.category || { id: "cat-varios", name: "Varios" },
          price: Number(body.price) || 0,
          unit: body.unit || "g",
          amount: Number(body.amount) || 100,
          calories: Number(body.calories) || 0,
          proteins: Number(body.proteins) || 0,
          carbs: Number(body.carbs) || 0,
          lipids: Number(body.lipids) || 0,
          sugars: Number(body.sugars) || 0,
          fiber: Number(body.fiber) || 0,
          sodium: Number(body.sodium) || 0,
          tags: Array.isArray(body.tags) ? body.tags : [],
          isPublic: true,
          verified: false,
          isMine: true,
          isDraft: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...body,
        };
        saveLocalCustomFoods([newFood, ...customFoods]);
        return makeMockResponse(newFood, 201);
      } catch {
        return makeMockResponse({ error: "Invalid food payload" }, 400);
      }
    }
  }

  // 11. Detalle / Editar / Eliminar Alimento (/foods/:id, /ingredients/:id)
  const foodIdMatch = cleanPath.match(/^\/(?:foods|ingredients)\/([^/]+)$/);
  if (foodIdMatch) {
    const foodId = foodIdMatch[1];
    const customFoods = getLocalCustomFoods();
    const existingCustom = customFoods.find((f) => f.id === foodId);
    const existingOfficial = OFFICIAL_INGREDIENTS.find((f) => f.id === foodId);
    const existing = existingCustom || existingOfficial;

    if (method === "GET") {
      return makeMockResponse(existing || OFFICIAL_INGREDIENTS[0]);
    }

    if (method === "PATCH" && init?.body) {
      try {
        const body = JSON.parse(init.body as string);
        const updated = customFoods.map((f) =>
          f.id === foodId ? { ...f, ...body, updatedAt: new Date().toISOString() } : f,
        );
        saveLocalCustomFoods(updated);
        return makeMockResponse({ ...existing, ...body });
      } catch {
        return makeMockResponse({ error: "Invalid food update" }, 400);
      }
    }

    if (method === "DELETE") {
      const remaining = customFoods.filter((f) => f.id !== foodId);
      saveLocalCustomFoods(remaining);
      return makeMockResponse({ success: true });
    }
  }

  // 12. Preferencias de alimentos (/foods/:id/preferences)
  if (cleanPath.match(/^\/(?:foods|ingredients)\/[^/]+\/preferences$/)) {
    return makeMockResponse({ success: true });
  }

  // 13. Calificación de app (/ratings/status, /ratings)
  if (cleanPath === "/ratings/status" || cleanPath.endsWith("/ratings/status")) {
    return makeMockResponse({ hasRated: false, eligibleForAutoPrompt: false });
  }
  if (cleanPath === "/ratings" || cleanPath.endsWith("/ratings")) {
    return makeMockResponse({ success: true });
  }

  // 14. Notas personales (/personal-notes)
  if (cleanPath === "/personal-notes" || cleanPath.startsWith("/personal-notes/")) {
    const raw = typeof window !== "undefined" ? localStorage.getItem("nutrinet_personal_notes") : null;
    let notes = [];
    try {
      notes = raw ? JSON.parse(raw) : [
        {
          id: "demo-note-1",
          title: "Recordatorio caso Valentina Miranda",
          content: "Ajustar porciones de carbohidratos complejos en la cena y evaluar curva de peso.",
          pinned: true,
          category: "CLINICAL",
          color: "yellow",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
    } catch {
      notes = [];
    }
    return makeMockResponse(notes);
  }

  // 15. Citas / Agenda (/appointments)
  if (cleanPath === "/appointments" || cleanPath.startsWith("/appointments/")) {
    return makeMockResponse([]);
  }

  // 16. Portal Paciente (/patient-portals/*)
  if (cleanPath.startsWith("/patient-portals")) {
    if (cleanPath.includes("/preview")) {
      return makeMockResponse({
        patientName: "Valentina Miranda",
        patientEmail: "valentina@nutrinet.cl",
        nutritionistName: "Nutricionista Demo",
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      });
    }

    const demoPortalData = {
      accessToken: "demo-portal-token",
      patient: {
        id: "demo-patient-1",
        fullName: "Valentina Miranda",
        email: "valentina@nutrinet.cl",
        createdAt: new Date().toISOString(),
        nutritionist: {
          id: "demo-nutri-1",
          fullName: "Nutricionista Demo",
          settings: {
            isScheduleActive: false,
          },
        },
        projects: [],
      },
      portal: {
        activeInvitation: {
          id: "demo-invitation",
          expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
        },
        latestInvitation: null,
      },
      summary: {
        totalEntries: 0,
        questionsCount: 0,
        trackingCount: 0,
        repliesCount: 0,
        pendingQuestions: 0,
        latestEntryAt: null,
        daysSinceLastEntry: null,
        sectionCounts: { alimentacion: 0, suplementos: 0, actividadFisica: 0 },
        alerts: [],
      },
      entries: [],
      questions: [],
      tracking: [],
      replies: [],
      messages: [],
      notifications: [],
      sharedResources: [],
      sharedDeliverables: getLocalCreations().slice(0, 1).map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type || "Pauta",
        format: "PDF",
        content: c,
        tags: [],
        createdAt: c.createdAt,
        updatedAt: c.createdAt,
      })),
      appointments: [],
      status: "ACTIVE",
    };

    return makeMockResponse(demoPortalData);
  }

  // 17. Formulario Intake Paciente (/public/patient-intake/*)
  if (cleanPath.includes("/patient-intake")) {
    if (cleanPath.includes("/validate")) {
      return makeMockResponse({
        valid: true,
        nutritionistName: "Nutricionista Demo",
        clinicName: "Consulta Nutricional Demo",
        patientEmail: "valentina@nutrinet.cl",
        patientName: "Valentina Miranda",
      });
    }
    return makeMockResponse({ success: true, message: "Formulario demo recibido correctamente." });
  }

  // 18. Excepciones permitidas para conectar con el backend real desde modo invitado (registro / login)
  const isAuthRealAction =
    cleanPath.startsWith("/auth/login") ||
    cleanPath.startsWith("/auth/register") ||
    cleanPath.startsWith("/auth/forgot") ||
    cleanPath.startsWith("/auth/reset") ||
    cleanPath.startsWith("/auth/google") ||
    cleanPath.startsWith("/auth/verify");

  if (isAuthRealAction) {
    return null; // Deja que viaje al backend real
  }

  // 19. Sandbox Guard Universal: Para cualquier otra ruta en modo invitado, responder 200 OK seguro
  return makeMockResponse({
    success: true,
    data: [],
    items: [],
    total: 0,
    message: "Modo demo: respuesta simulada protegida",
  });
}


