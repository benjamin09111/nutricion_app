import type { Metadata } from "next";
import { PatientDashboardClient } from "./PatientDashboardClient";

export const metadata: Metadata = {
  title: "Dashboard del Paciente (DEMO) | NutriNet",
  description: "Portal interactivo para pacientes: tabla de comidas, diario de vida, logros y chat con Naty.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PacienteDashboardPage() {
  return <PatientDashboardClient />;
}

