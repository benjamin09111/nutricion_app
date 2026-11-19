"use client";

import { useRouter } from "next/navigation";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import CreateIngredientForm from "../CreateIngredientForm";

export default function CrearAlimentoPage() {
  const router = useRouter();

  return (
    <ModuleLayout
      title="Nuevo Alimento"
      description="Crea un nuevo alimento para tus pautas y compártelo con la comunidad de nutricionistas."
      className="max-w-4xl"
    >
      <CreateIngredientForm
        onCancel={() => router.push("/dashboard/alimentos")}
        onSuccess={() => {
          router.push("/dashboard/alimentos");
        }}
      />
    </ModuleLayout>
  );
}
