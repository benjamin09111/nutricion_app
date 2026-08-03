"use client";

import { useRouter } from "next/navigation";
import CreateIngredientForm from "../CreateIngredientForm";

export default function CrearAlimentoPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6 px-3 sm:px-6">
      <CreateIngredientForm
        onCancel={() => router.push("/dashboard/alimentos")}
        onSuccess={() => {
          router.push("/dashboard/alimentos");
        }}
      />
    </div>
  );
}
