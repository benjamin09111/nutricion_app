import { Suspense } from "react";
import { ResourceEditor } from "../ResourceEditor";

export const metadata = {
  title: "Nuevo Recurso | NutriNet",
  description: "Crea un nuevo recurso educativo para tus pacientes.",
};

export default function NuevoRecursoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-medium text-slate-400">Cargando editor...</div>}>
      <ResourceEditor />
    </Suspense>
  );
}
