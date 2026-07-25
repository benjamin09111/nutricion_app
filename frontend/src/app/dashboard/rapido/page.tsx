import { redirect } from "next/navigation";
import QuickDeliverableClient from "./QuickDeliverableClient";

export const metadata = {
  title: "Rápido | NutriNet",
  description:
    "Crea un entregable express de una sola hoja para consultas rápidas.",
};

type QuickDeliverablePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function QuickDeliverablePage({ searchParams }: QuickDeliverablePageProps) {
  const params = await searchParams;
  const hasHistoricalContext = Boolean(params.creationId || params.project);

  if (!hasHistoricalContext) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === "string") query.set(key, value);
      if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    });
    query.set("mode", "quick");
    redirect(`/dashboard/dieta?${query.toString()}`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <QuickDeliverableClient />
    </div>
  );
}
