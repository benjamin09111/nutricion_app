import {
  PatientMeal,
  PatientDiaryEntry,
  PatientDeliverableFile,
  PatientQnAItem,
  PatientResourceItem,
  PatientNotification,
  PatientProfileState,
} from "./types";

export const INITIAL_PATIENT_PROFILE: PatientProfileState = {
  fullName: "Camila González Miranda",
  nutriName: "Nutri. Valentina Soto",
  nutriSpecialty: "Especialista en Nutrición Clínica & Deportiva",
  targetObjective: "Recomposición corporal y digestión saludable",
  currentStreakDays: 6,
  totalStars: 240,
  level: 3,
  levelName: "Hábito de Oro",
  nextLevelStars: 300,
  currentWeightKg: 66.1,
  startingWeightKg: 68.5,
  goalWeightKg: 63.0,
  waterIntakeMl: 1500,
  waterGoalMl: 2000,
};

export const INITIAL_PATIENT_MEALS: PatientMeal[] = [
  {
    id: "meal-1",
    time: "08:30",
    name: "Desayuno Energético",
    subtitle: "Proteína de alto valor biológico + fibra saciante",
    foods: [
      "2 huevos revueltos con espinacas baby y sal rosada",
      "1 rebanada de pan de masa madre integral tostado",
      "1/2 taza de arándanos o frutillas frescas",
      "Café negro, té verde o infusión sin azúcar añadida",
    ],
    portions: [
      { label: "Proteína", count: 2 },
      { label: "Carbohidrato", count: 1 },
      { label: "Fruta", count: 1 },
      { label: "Grasa", count: 1 },
    ],
    nutriNote: "Tomar 1 vaso grande de agua al levantarte antes del desayuno.",
    isConsumed: true,
    caloriesApprox: 380,
  },
  {
    id: "meal-2",
    time: "11:00",
    name: "Colación Media Mañana",
    subtitle: "Snack de concentración y energía limpia",
    foods: [
      "1 puñado pequeño de almendras tostadas sin sal (aprox. 20g)",
      "1 manzana verde o pera de agua en láminas",
    ],
    portions: [
      { label: "Grasa Saludable", count: 1 },
      { label: "Fruta", count: 1 },
    ],
    nutriNote: "Ideal para mantener tu energía mientras trabajas o estudias.",
    isConsumed: true,
    caloriesApprox: 180,
  },
  {
    id: "meal-3",
    time: "13:30",
    name: "Almuerzo Completo & Balanceado",
    subtitle: "Próxima comida recomendada",
    foods: [
      "150g de pechuga de pollo a la plancha (o tofu marinado)",
      "3/4 taza de quinoa tricolor cocida con cilantro",
      "Plato hondo de ensalada verde: rúcula, lechuga, pepino y tomates cherry",
      "1 cucharada sopera de aceite de oliva extra virgen y limón",
    ],
    portions: [
      { label: "Proteína", count: 2 },
      { label: "Carbohidrato", count: 2 },
      { label: "Verduras", count: 2 },
      { label: "Grasa", count: 1 },
    ],
    nutriNote: "Tómate al menos 20 minutos para almorzar sin pantallas para mejorar la saciedad.",
    isConsumed: false,
    caloriesApprox: 520,
  },
  {
    id: "meal-4",
    time: "17:30",
    name: "Once Proteica de Tarde",
    subtitle: "Recuperación muscular y control de apetito nocturno",
    foods: [
      "1 pote (150g) de yogurt griego natural sin azúcar",
      "2 cucharadas soperas de avena integral en hojuelas",
      "1 cucharadita de semillas de chía o linaza molida",
      "Canela en polvo al gusto",
    ],
    portions: [
      { label: "Lácteo / Proteína", count: 1 },
      { label: "Carbohidrato", count: 1 },
      { label: "Grasa", count: 1 },
    ],
    nutriNote: "Perfecto para consumir 45 minutos antes de tu entrenamiento o caminata.",
    isConsumed: false,
    caloriesApprox: 240,
  },
  {
    id: "meal-5",
    time: "20:30",
    name: "Cena Ligera Reparadora",
    subtitle: "Digestión fácil para un sueño profundo",
    foods: [
      "1 filete de reineta o merluza al horno con finas hierbas",
      "Salteado tibio de zapallito italiano, pimientos y champiñones al wok",
      "1/4 de palta en láminas con semillas de sésamo",
    ],
    portions: [
      { label: "Proteína", count: 2 },
      { label: "Verduras", count: 2 },
      { label: "Grasa", count: 1 },
    ],
    nutriNote: "Cenar al menos 2 horas antes de dormir para optimizar tu descanso celular.",
    isConsumed: false,
    caloriesApprox: 340,
  },
];

export const INITIAL_DIARY_ENTRIES: PatientDiaryEntry[] = [
  {
    id: "diary-1",
    date: "Ayer, 12 de Noviembre",
    time: "21:15",
    mood: "energia",
    moodLabel: "Con energía y satisfecha",
    content:
      "Excelente día. Cumplí los 2 litros de agua y no sentí ansiedad por dulces por la tarde. La merienda de yogurt griego me dejó saciada hasta la cena.",
    waterGlasses: 8,
  },
  {
    id: "diary-2",
    date: "10 de Noviembre",
    time: "19:40",
    mood: "tranquila",
    moodLabel: "Tranquila y en ritmo",
    content:
      "Día con muchas reuniones en el trabajo, pero me llevé mi snack de almendras y manzana que me sugirió Vale. Me sentí ligera y con buena concentración.",
    waterGlasses: 7,
  },
];

export const INITIAL_FILES: PatientDeliverableFile[] = [
  {
    id: "file-1",
    title: "Pauta Nutricional Personalizada",
    category: "Pauta",
    updatedAt: "Hace 2 días",
    pageCount: 3,
    description: "Distribución horaria, intercambios de alimentos y metas calóricas para este mes.",
    fileSize: "1.4 MB",
  },
  {
    id: "file-2",
    title: "Recetario Express en 15 Minutos",
    category: "Recetario",
    updatedAt: "Hace 1 semana",
    pageCount: 8,
    description: "12 recetas fáciles con ingredientes simples de supermercado y medidas caseras.",
    fileSize: "3.2 MB",
  },
  {
    id: "file-3",
    title: "Guía de Porciones y Equivalencias",
    category: "Guía",
    updatedAt: "Hace 2 semanas",
    pageCount: 4,
    description: "Aprende a medir con tu mano, tazas y cucharas sin necesidad de pesar todo.",
    fileSize: "2.1 MB",
  },
  {
    id: "file-4",
    title: "Lista Inteligente de Supermercado",
    category: "Lista de compras",
    updatedAt: "Hace 3 días",
    pageCount: 2,
    description: "Ingredientes organizados por pasillo (frutas, carnes, despensa) para ahorrar tiempo.",
    fileSize: "850 KB",
  },
];

export const INITIAL_QNA: PatientQnAItem[] = [
  {
    id: "qna-1",
    question: "¿Puedo reemplazar la quinoa del almuerzo por papas cocidas o arroz?",
    answer:
      "Hola Cami. Sí, totalmente. 3/4 taza de quinoa equivale a 1 papa mediana cocida o a 3/4 taza de arroz integral o basmati. Ambos cumplen la misma función energética.",
    askedAt: "11 de Nov",
    answeredAt: "11 de Nov (respondido por Nutri. Valentina)",
    isResolved: true,
  },
  {
    id: "qna-2",
    question: "¿Qué puedo hacer si tengo un cumpleaños este fin de semana?",
    answer:
      "No te aísles ni sientas culpa. Disfruta la celebración. Mi consejo es que meriendes bien antes de salir (con proteína y agua), elijas lo que más te guste conscientemente y el domingo retomes tu pauta normal sin compensar ni restringirte.",
    askedAt: "08 de Nov",
    answeredAt: "08 de Nov (respondido por Nutri. Valentina)",
    isResolved: true,
  },
  {
    id: "qna-3",
    question: "¿El café con leche cuenta dentro de los 2 litros de agua diaria?",
    answer:
      "Es mejor contar el agua pura, infusiones de hierbas o agua con rodajas de limón o pepino. El café es diurético suave, así que mantenlo como bebida de disfrute aparte de tus 8 vasos de agua.",
    askedAt: "05 de Nov",
    answeredAt: "05 de Nov (respondido por Nutri. Valentina)",
    isResolved: true,
  },
];

export const INITIAL_RESOURCES: PatientResourceItem[] = [
  {
    id: "res-1",
    title: "Cómo entender los sellos negros sin obsesionarse",
    category: "Educación Nutricional",
    readTimeMinutes: 3,
    summary:
      "Aprende cuándo un alimento con sello es una buena opción (por ejemplo frutos secos o quesos maduros) y cuándo conviene evitarlo.",
    keyTakeaways: [
      "Los sellos evalúan por 100g, no por la porción que realmente consumes.",
      "Un alimento con grasas naturales saludables (como nueces) puede tener sello pero ser muy nutritivo.",
      "Prioriza ingredientes simples y cortos en la lista de ingredientes.",
    ],
    tags: ["Sellos INTA", "Etiquetado", "Compras conscientes"],
  },
  {
    id: "res-2",
    title: "El orden en que comes tus alimentos importa",
    category: "Bioquímica Simple",
    readTimeMinutes: 4,
    summary:
      "Estudios demuestran que comenzar tu comida con vegetales y fibra reduce hasta un 70% los picos de glucosa e insulina posteriores.",
    keyTakeaways: [
      "1° Paso: Ensaladas y verduras crudas (la fibra forma una malla protectora en tu intestino).",
      "2° Paso: Proteínas y grasas saludables (promueven saciedad prolongada).",
      "3° Paso: Carbohidratos (quinoa, arroz, papas) al final.",
    ],
    tags: ["Glucosa", "Energía", "Digestión"],
  },
  {
    id: "res-3",
    title: "Top 8 Snacks Saludables para llevar a la oficina",
    category: "Guías Prácticas",
    readTimeMinutes: 2,
    summary:
      "Opciones portátiles, ricas y que no requieren refrigeración constante para evitar caer en las máquinas expendedoras.",
    keyTakeaways: [
      "Huevos duros con una pizca de sal y merkén.",
      "Lupines o garbanzos tostados crujientes.",
      "Mix de nueces, almendras y semillas de calabaza.",
      "Bastones de zanahoria y apio con hummus.",
    ],
    tags: ["Snacks", "Trabajo", "Anti-antojos"],
  },
];

export const INITIAL_NOTIFICATIONS: PatientNotification[] = [
  {
    id: "notif-1",
    title: "Nueva pauta actualizada",
    message: "Nutri. Valentina Soto ajustó tus porciones para la fase de tonificación.",
    timeAgo: "Hace 2 horas",
    type: "plan",
    isRead: false,
  },
  {
    id: "notif-2",
    title: "Racha de 6 días completada",
    message: "Estás a solo 1 día de completar tu meta semanal. Mantén la constancia.",
    timeAgo: "Hace 5 horas",
    type: "streak",
    isRead: false,
  },
  {
    id: "notif-3",
    title: "Recordatorio de hidratación",
    message: "Llevas 1.5L hoy. Toma un vaso de agua para alcanzar tu meta de 2.0L.",
    timeAgo: "Hace 10 minutos",
    type: "water",
    isRead: true,
  },
];

const STORAGE_KEYS = {
  PROFILE: "nutrinet_patient_demo_profile",
  MEALS: "nutrinet_patient_demo_meals",
  DIARY: "nutrinet_patient_demo_diary",
  QNA: "nutrinet_patient_demo_qna",
  NOTIFS: "nutrinet_patient_demo_notifs",
};

export function loadPatientDemoState() {
  if (typeof window === "undefined") {
    return {
      profile: INITIAL_PATIENT_PROFILE,
      meals: INITIAL_PATIENT_MEALS,
      diary: INITIAL_DIARY_ENTRIES,
      qna: INITIAL_QNA,
      notifications: INITIAL_NOTIFICATIONS,
    };
  }

  try {
    const p = localStorage.getItem(STORAGE_KEYS.PROFILE);
    const m = localStorage.getItem(STORAGE_KEYS.MEALS);
    const d = localStorage.getItem(STORAGE_KEYS.DIARY);
    const q = localStorage.getItem(STORAGE_KEYS.QNA);
    const n = localStorage.getItem(STORAGE_KEYS.NOTIFS);

    return {
      profile: p ? JSON.parse(p) : INITIAL_PATIENT_PROFILE,
      meals: m ? JSON.parse(m) : INITIAL_PATIENT_MEALS,
      diary: d ? JSON.parse(d) : INITIAL_DIARY_ENTRIES,
      qna: q ? JSON.parse(q) : INITIAL_QNA,
      notifications: n ? JSON.parse(n) : INITIAL_NOTIFICATIONS,
    };
  } catch {
    return {
      profile: INITIAL_PATIENT_PROFILE,
      meals: INITIAL_PATIENT_MEALS,
      diary: INITIAL_DIARY_ENTRIES,
      qna: INITIAL_QNA,
      notifications: INITIAL_NOTIFICATIONS,
    };
  }
}

export function savePatientDemoState(data: {
  profile?: PatientProfileState;
  meals?: PatientMeal[];
  diary?: PatientDiaryEntry[];
  qna?: PatientQnAItem[];
  notifications?: PatientNotification[];
}) {
  if (typeof window === "undefined") return;
  try {
    if (data.profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile));
    if (data.meals) localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(data.meals));
    if (data.diary) localStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(data.diary));
    if (data.qna) localStorage.setItem(STORAGE_KEYS.QNA, JSON.stringify(data.qna));
    if (data.notifications) localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(data.notifications));
  } catch {
    // ignore quota errors
  }
}
