import QuickDeliverableClient from "./QuickDeliverableClient";

export const metadata = {
  title: "Rápido | NutriSaaS",
  description:
    "Crea un entregable express de una sola hoja para consultas rápidas.",
};

export default function QuickDeliverablePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <QuickDeliverableClient />
    </div>
  );
}
