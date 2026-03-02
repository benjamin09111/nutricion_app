import DeliverableClient from "./DeliverableClient";

export const metadata = {
  title: "Entregable Final & Branding | NutriSaaS",
  description:
    "Personaliza y exporta el plan nutricional profesional con tu propia marca.",
};

export default function DeliverablePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <DeliverableClient />
    </div>
  );
}
