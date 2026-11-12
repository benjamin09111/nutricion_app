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
    title: "Control mensual de resistencia a la insulina",
    date: "2026-11-10T12:00:00.000Z",
    patient: { id: "pat-1", fullName: "Valentina Miranda" },
    metrics: { weight: 82.0, body_fat: 33.8, muscle_mass: 26.9 },
    notes: "Buena adherencia a la distribución de porciones INTA sin lácteos.",
  },
  {
    id: "con-2",
    patientId: "pat-2",
    title: "Revisión de plan hipocalórico y curva glicémica",
    date: "2026-11-08T12:00:00.000Z",
    patient: { id: "pat-2", fullName: "Don Luis Mansilla" },
    metrics: { weight: 79.0, body_fat: 27.5, muscle_mass: 31.0 },
    notes: "Presión arterial controlada (125/80). Cumple restricción de sodio.",
  },
  {
    id: "con-3",
    patientId: "pat-3",
    title: "Evaluación antropométrica y aumento masa muscular",
    date: "2026-11-07T12:00:00.000Z",
    patient: { id: "pat-3", fullName: "Martín Silva" },
    metrics: { weight: 74.5, body_fat: 14.2, muscle_mass: 38.5 },
    notes: "Aumento de 800g de masa muscular magra. Aumentar porción de proteína en merienda.",
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
    return JSON.parse(raw);
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
    return JSON.parse(raw);
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
      return makeMockResponse(consultations);
    }
    if (method === "POST" && init?.body) {
      try {
        const body = JSON.parse(init.body as string);
        const newConsultation = {
          id: `con-${Date.now()}`,
          date: new Date().toISOString(),
          ...body,
        };
        saveLocalConsultations([newConsultation, ...consultations]);
        return makeMockResponse(newConsultation, 201);
      } catch {
        return makeMockResponse({ error: "Invalid consultation" }, 400);
      }
    }
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


