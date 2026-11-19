import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal del Paciente (DEMO) | NutriNet",
  description: "Demostración interactiva del portal y seguimiento de hábitos para pacientes en NutriNet.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PacienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFB]">
      {children}
    </div>
  );
}

