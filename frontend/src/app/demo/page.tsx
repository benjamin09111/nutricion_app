"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import { DashboardShell } from "@/app/dashboard/DashboardShell";
import DashboardHomeClient, {
  type DashboardStats,
  type RecentCreation,
} from "@/app/dashboard/DashboardHomeClient";

const DEMO_USER = {
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
  },
};

const DEMO_DASHBOARD_STATS: DashboardStats = {
  patients: { total: 86, active: 78, inactive: 8 },
  consultations: { total: 142 },
  pdfs: { rapido: 24, pautas: 18, dietas: 12, recetas: 8 },
  planUsage: {
    planKey: "pro",
    isFree: false,
    percent: 68,
    limits: { patients: 100, consultations: 200, pdfs: 100 },
    usage: { patients: 86, consultations: 142, pdfs: 62 },
  },
  recentPatients: [
    {
      id: "pat-1",
      fullName: "Valentina Miranda",
      updatedAt: new Date().toISOString(),
      email: "valentina.miranda@email.cl",
    },
    {
      id: "pat-2",
      fullName: "Don Luis Mansilla",
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      email: "luis.mansilla@email.cl",
    },
    {
      id: "pat-3",
      fullName: "Martín Silva",
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      email: "martin.silva@email.cl",
    },
    {
      id: "pat-4",
      fullName: "Camila Soto",
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      email: "camila.soto@email.cl",
    },
  ],
  recentConsultations: [
    {
      id: "con-1",
      title: "Control mensual de resistencia a la insulina",
      date: new Date().toISOString(),
      patient: { id: "pat-1", fullName: "Valentina Miranda" },
    },
    {
      id: "con-2",
      title: "Revisión de plan hipocalórico y curva glicémica",
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      patient: { id: "pat-2", fullName: "Don Luis Mansilla" },
    },
    {
      id: "con-3",
      title: "Evaluación antropométrica y aumento masa muscular",
      date: new Date(Date.now() - 3 * 86400000).toISOString(),
      patient: { id: "pat-3", fullName: "Martín Silva" },
    },
  ],
};

const DEMO_RECENT_CREATIONS: RecentCreation[] = [
  {
    id: "cr-1",
    name: "Pauta Semanal INTA - 1.750 kcal",
    type: "Pauta Alimentaria",
    createdAt: new Date().toISOString(),
    patientName: "Valentina Miranda",
  },
  {
    id: "cr-2",
    name: "Minuta Mediterránea Sin Lácteos",
    type: "Dieta",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    patientName: "Don Luis Mansilla",
  },
  {
    id: "cr-3",
    name: "Recetario Alto en Proteína & Fibra",
    type: "Recetario",
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    patientName: "Martín Silva",
  },
];

export default function DemoPage() {
  useEffect(() => {
    // Setea el usuario demo por defecto en cookies si no existe sesión activa
    const existing = Cookies.get("user");
    if (!existing) {
      Cookies.set("user", JSON.stringify(DEMO_USER), { expires: 1 });
    }
  }, []);

  return (
    <DashboardShell isDemo>
      <DashboardHomeClient
        initialStats={DEMO_DASHBOARD_STATS}
        initialCreations={DEMO_RECENT_CREATIONS}
        isDemo
      />
    </DashboardShell>
  );
}
