"use client";

import { INITIAL_DEMO_DATA } from "@/app/demo/demo-data";
import { MOCK_PATIENTS } from "@/features/patients/mocks";
import {
  OFFICIAL_INGREDIENTS,
  searchLocalIngredients,
} from "@/features/foods/local-catalog";

const STORAGE_KEYS = {
  PATIENTS: "nutrinet_demo_patients_v3",
  CONSULTATIONS: "nutrinet_demo_consultations_v3",
  CREATIONS: "nutrinet_demo_creations_v3",
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
    patientId: "1",
    patientName: "Ana Silva",
    title: "Control de déficit calórico y alimentación vegetariana",
    date: "2026-11-05T11:00:00.000Z",
    patient: { id: "1", fullName: "Ana Silva" },
    description: "Excelente energía y digestión. Logró -1.8 kg en 4 semanas. Se refuerza suplementación de Vitamina B12 y combinación de legumbres con cereales integrales para perfil de aminoácidos completo.",
    notes: "Excelente energía y digestión. Logró -1.8 kg en 4 semanas. Se refuerza suplementación de Vitamina B12 y combinación de legumbres con cereales integrales para perfil de aminoácidos completo.",
    metrics: [
      { key: "weight", label: "Peso", value: 65.5, unit: "kg" },
      { key: "body_fat", label: "% Grasa", value: 24.1, unit: "%" },
      { key: "muscle_mass", label: "Masa Muscular", value: 25.3, unit: "kg" },
      { key: "waist", label: "Cintura", value: 72.0, unit: "cm" },
    ],
  },
  {
    id: "con-5",
    patientId: "2",
    patientName: "Carlos Ruiz",
    title: "Seguimiento nutricional celiaquía & fase de volumen",
    date: "2026-11-03T16:00:00.000Z",
    patient: { id: "2", fullName: "Carlos Ruiz" },
    description: "Sin episodios de contaminación cruzada. Peso subió 1.2 kg manteniendo porcentaje graso. Tolera adecuadamente avena certificada libre de gluten y harinas de legumbres.",
    notes: "Sin episodios de contaminación cruzada. Peso subió 1.2 kg manteniendo porcentaje graso. Tolera adecuadamente avena certificada libre de gluten y harinas de legumbres.",
    metrics: [
      { key: "weight", label: "Peso", value: 85.0, unit: "kg" },
      { key: "body_fat", label: "% Grasa", value: 16.8, unit: "%" },
      { key: "muscle_mass", label: "Masa Muscular", value: 41.2, unit: "kg" },
      { key: "waist", label: "Cintura", value: 82.5, unit: "cm" },
    ],
  },
  {
    id: "con-6",
    patientId: "3",
    patientName: "Maria Gonzalez",
    title: "Estrategia de hidratación y carbohidratos para media maratón",
    date: "2026-10-28T09:30:00.000Z",
    patient: { id: "3", fullName: "Maria Gonzalez" },
    description: "Plan de carga de carbohidratos 48h pre-carrera (7g CHO/kg). Pauta de geles isotónicos cada 45 minutos durante fondo largo de 18k sin molestias gastrointestinales.",
    notes: "Plan de carga de carbohidratos 48h pre-carrera (7g CHO/kg). Pauta de geles isotónicos cada 45 minutos durante fondo largo de 18k sin molestias gastrointestinales.",
    metrics: [
      { key: "weight", label: "Peso", value: 58.2, unit: "kg" },
      { key: "body_fat", label: "% Grasa", value: 18.5, unit: "%" },
      { key: "muscle_mass", label: "Masa Muscular", value: 28.0, unit: "kg" },
      { key: "waist", label: "Cintura", value: 66.0, unit: "cm" },
    ],
  },
  {
    id: "con-7",
    patientId: "pat-1",
    patientName: "Valentina Miranda",
    title: "Consulta inicial de anamnesis alimentaria y curva HOMA",
    date: "2026-10-12T11:00:00.000Z",
    patient: { id: "pat-1", fullName: "Valentina Miranda" },
    description: "Anamnesis completa. Exámenes de laboratorio revelan HOMA-IR 3.4. Se establece meta inicial de 1.750 kcal con distribución baja en azúcares libres y alta en fibra soluble.",
    notes: "Anamnesis completa. Exámenes de laboratorio revelan HOMA-IR 3.4. Se establece meta inicial de 1.750 kcal con distribución baja en azúcares libres y alta en fibra soluble.",
    metrics: [
      { key: "weight", label: "Peso", value: 84.4, unit: "kg" },
      { key: "body_fat", label: "% Grasa", value: 35.6, unit: "%" },
      { key: "muscle_mass", label: "Masa Muscular", value: 26.2, unit: "kg" },
      { key: "visceral_fat", label: "Grasa Visceral", value: 8, unit: "lvl" },
      { key: "waist", label: "Cintura", value: 88.0, unit: "cm" },
    ],
  },
  {
    id: "con-8",
    patientId: "pat-3",
    patientName: "Martín Silva",
    title: "Control de rendimiento y prueba de suplementación con creatina",
    date: "2026-10-05T17:00:00.000Z",
    patient: { id: "pat-3", fullName: "Martín Silva" },
    description: "Inicia protocolo de carga de monohidrato de creatina (5g diarios constantes). Reporta mejora en fuerza máxima y reducción de fatiga entre series pesadas.",
    notes: "Inicia protocolo de carga de monohidrato de creatina (5g diarios constantes). Reporta mejora en fuerza máxima y reducción de fatiga entre series pesadas.",
    metrics: [
      { key: "weight", label: "Peso", value: 73.7, unit: "kg" },
      { key: "body_fat", label: "% Grasa", value: 14.8, unit: "%" },
      { key: "muscle_mass", label: "Masa Muscular", value: 37.7, unit: "kg" },
      { key: "visceral_fat", label: "Grasa Visceral", value: 3, unit: "lvl" },
      { key: "waist", label: "Cintura", value: 78.5, unit: "cm" },
    ],
  },
];

const INITIAL_CREATIONS = [
  {
    id: "cr-1",
    name: "Pauta Semanal INTA - 1.750 kcal",
    type: "Pauta Alimentaria",
    createdAt: "2026-11-10T12:00:00.000Z",
    patientName: "Valentina Miranda",
    patientId: "pat-1",
    metadata: { patientName: "Valentina Miranda" },
  },
  {
    id: "cr-2",
    name: "Minuta Mediterránea Sin Lácteos",
    type: "Dieta",
    createdAt: "2026-11-08T12:00:00.000Z",
    patientName: "Don Luis Mansilla",
    patientId: "pat-2",
    metadata: { patientName: "Don Luis Mansilla" },
  },
  {
    id: "cr-3",
    name: "Recetario Alto en Proteína & Fibra",
    type: "Recetario",
    createdAt: "2026-11-06T12:00:00.000Z",
    patientName: "Martín Silva",
    patientId: "pat-3",
    metadata: { patientName: "Martín Silva" },
  },
  {
    id: "cr-4",
    name: "Pauta Déficit Calórico Vegetariana (1.500 kcal)",
    type: "Pauta Alimentaria",
    createdAt: "2026-11-05T14:00:00.000Z",
    patientName: "Ana Silva",
    patientId: "1",
    metadata: { patientName: "Ana Silva" },
  },
  {
    id: "cr-5",
    name: "Plan de Hipertrofia Libre de Gluten (2.400 kcal)",
    type: "Pauta Alimentaria",
    createdAt: "2026-11-03T18:00:00.000Z",
    patientName: "Carlos Ruiz",
    patientId: "2",
    metadata: { patientName: "Carlos Ruiz" },
  },
  {
    id: "cr-6",
    name: "Guía de Hidratación y Carga de Carbohidratos 21K",
    type: "Dieta",
    createdAt: "2026-10-28T11:00:00.000Z",
    patientName: "Maria Gonzalez",
    patientId: "3",
    metadata: { patientName: "Maria Gonzalez" },
  },
  {
    id: "cr-7",
    name: "Lista de Compras Inteligente - Supermercado Líder",
    type: "Lista de Compras",
    createdAt: "2026-10-25T16:00:00.000Z",
    patientName: "Valentina Miranda",
    patientId: "pat-1",
    metadata: { patientName: "Valentina Miranda" },
  },
  {
    id: "cr-8",
    name: "Test de Adherencia y Hábitos Alimentarios (SNAQ)",
    type: "Screening Test",
    createdAt: "2026-10-20T10:00:00.000Z",
    patientName: "Don Luis Mansilla",
    patientId: "pat-2",
    metadata: { patientName: "Don Luis Mansilla" },
  },
];

function getInitialPatients() {
  const demoPatients = INITIAL_DEMO_DATA.patients.map((p) => ({
    id: p.id,
    nutritionistId: "nutri-demo",
    fullName: p.fullName,
    email: p.email,
    phone: p.phone,
    age: p.age,
    gender: p.gender,
    height: p.height,
    weight: p.currentWeight,
    dietRestrictions: p.dietaryRestrictions || [],
    nutritionalFocus: p.goal,
    clinicalSummary: p.clinicalDiagnosis,
    status: (p.desertionRisk === "alto" ? "Inactive" : "Active") as "Active" | "Inactive",
    tags: [p.region, p.activityLevel],
    createdAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-11-10T12:00:00.000Z",
    lastVisit: "2026-11-08",
  }));

  return [...demoPatients, ...MOCK_PATIENTS];
}

// ==========================================
// LocalStorage Persistence Helpers
// ==========================================

export function getLocalPatients(): any[] {
  if (typeof window === "undefined") return getInitialPatients();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    if (!raw) {
      const initial = getInitialPatients();
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialPatients();
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

export function getLocalConsultations(): any[] {
  if (typeof window === "undefined") return INITIAL_CONSULTATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONSULTATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(INITIAL_CONSULTATIONS));
      return INITIAL_CONSULTATIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < INITIAL_CONSULTATIONS.length || !parsed[0]?.patientName) {
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
    if (!Array.isArray(parsed) || parsed.length < INITIAL_CREATIONS.length) {
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

/**
 * Intercepta llamadas de fetchApi y responde directamente con localStorage
 * cuando se navega en modo demo sin iniciar sesión.
 */
export function handleDemoApi(path: string, init?: RequestInit): Response | null {
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
    const patients = getLocalPatients();
    const patient = patients.find((p) => p.id === patientId) || patients[0];
    return makeMockResponse({
      anamnesis: patient.clinicalSummary || "Paciente en control y evolución nutricional.",
      diagnosis: patient.clinicalDiagnosis || "Control nutricional y hábitos saludables.",
      allergies: patient.dietRestrictions || [],
      medicalHistory: "Sin antecedentes mórbidos de relevancia.",
      familyHistory: "Resistencia a la insulina en línea materna.",
      treatments: "Suplementación con omega 3 y probióticos.",
      notes: "Buena adherencia y tolerancia digestiva.",
    });
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
      { key: "weight", label: "Peso Corporal", unit: "kg" },
      { key: "body_fat", label: "% Grasa Corporal", unit: "%" },
      { key: "muscle_mass", label: "Masa Muscular", unit: "kg" },
      { key: "visceral_fat", label: "Grasa Visceral", unit: "lvl" },
      { key: "waist", label: "Circunferencia Cintura", unit: "cm" },
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

  if (cleanPath.startsWith("/memberships")) {
    return makeMockResponse({
      plan: "pro",
      planName: "Plan Pro Clínico",
      status: "active",
      entitlements: DEMO_USER.currentPlan.entitlements,
      currentPlan: DEMO_USER.currentPlan,
    });
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

  return null;
}


