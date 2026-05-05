import { SubstitutesClient } from "./SubstitutesClient";

export const metadata = {
  title: "Sustitutos Comunes | NutriNet",
  description:
    "Gestiona los sustitutos frecuentes para tus pacientes y entrena a tu asistente IA.",
};

export default function SustitutosPage() {
  return <SubstitutesClient />;
}
