import React from "react";
import { Utensils, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DietTemplateImportSectionProps {
  dietName: string;
  dietTags: string[];
  totalFoodsCount: number;
  totalGroupsCount: number;
  onImportDiet: () => void;
  onCreateDiet: () => void;
}

export const DietTemplateImportSection: React.FC<DietTemplateImportSectionProps> = ({
  dietName,
  dietTags,
  totalFoodsCount,
  totalGroupsCount,
  onImportDiet,
  onCreateDiet,
}) => {
  const hasImportedDiet = totalFoodsCount > 0;

  if (!hasImportedDiet) {
    return (
      <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-6">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="max-w-2xl">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <Utensils className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-indigo-950">Dieta Base o Plantilla</h3>
            </div>
            <p className="text-xs leading-5 text-slate-600">
              Importa una estructura alimenticia guardada anteriormente o crea una nueva plantilla en el módulo de dietas. Puedes ir a diseñar una dieta y regresar cuando desees; <strong>tu avance, paciente y datos en este entregable se guardarán automáticamente como borrador</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onImportDiet}
              className="h-10 w-full sm:w-auto min-w-0 sm:min-w-44 justify-center rounded-xl border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 shadow-xs"
            >
              <Filter className="mr-2 h-4 w-4 text-indigo-600" />
              Importar dieta
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onCreateDiet}
              className="h-10 w-full sm:w-auto min-w-0 sm:min-w-44 justify-center rounded-xl border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
            >
              <Plus className="mr-2 h-4 w-4 text-slate-600" />
              Crear una dieta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <details className="group rounded-2xl border border-indigo-200/80 bg-white" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 select-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <Utensils className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-600 block uppercase tracking-wider">Dieta Cargada</span>
            <span className="text-sm font-bold text-slate-900">{dietName || "Dieta Base"}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onImportDiet();
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            Cambiar dieta
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onCreateDiet();
            }}
            className="text-xs font-bold text-slate-600 hover:text-slate-800"
          >
            Crear una dieta
          </button>
        </div>
      </summary>
      <div className="grid gap-3 border-t border-slate-100 px-4 pb-4 pt-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
          <p className="text-[10px] font-black uppercase text-slate-400">Resumen Nutricional</p>
          <p className="text-sm font-semibold text-slate-800">
            {totalFoodsCount} alimentos · {totalGroupsCount} grupos
          </p>
        </div>
        {dietTags && dietTags.length > 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
            <p className="text-[10px] font-black uppercase text-slate-400">Etiquetas</p>
            <p className="text-sm font-semibold text-slate-800">{dietTags.join(", ")}</p>
          </div>
        ) : null}
      </div>
    </details>
  );
};
