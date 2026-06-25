import PautasAlimentacionClient from "./PautasAlimentacionClient";

export const metadata = {
  title: "Pautas de Alimentación | NutriNet",
  description: "Crea pautas de alimentación para restricciones específicas.",
};

export default function PautasAlimentacionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PautasAlimentacionClient />
    </div>
  );
}