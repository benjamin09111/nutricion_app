import React from "react";
import { Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DietPatient } from "../utils/diet-helpers";

interface DietPatientSectionProps {
  selectedPatient: DietPatient | null;
  handleUnlinkPatient: () => void;
  onImportPatient: () => void;
  isLoadingPatients: boolean;
}

export const DietPatientSection: React.FC<DietPatientSectionProps> = ({
  selectedPatient,
  handleUnlinkPatient,
  onImportPatient,
  isLoadingPatients,
}) => {
  if (!selectedPatient) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-6">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="max-w-2xl">
            <p className="text-sm font-bold leading-6 text-amber-900">
              Puedes crear tu estrategia sin paciente o importar uno para personalizar mejor la dieta.
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Si importas un paciente, podrás considerar sus restricciones, objetivos y contexto clínico.
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
              *Si no seleccionas un paciente, puedes crear planes generales para reutilizarlos después.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onImportPatient}
            disabled={isLoadingPatients}
            className="h-10 min-w-48 justify-center rounded-xl border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
          >
            {isLoadingPatients ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
            {isLoadingPatients ? "Cargando..." : "Importar paciente"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <details className="group rounded-2xl border border-slate-200 bg-white" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 select-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-bold text-slate-900">{selectedPatient.fullName}</span>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            handleUnlinkPatient();
          }}
          className="text-xs font-bold text-rose-600 hover:text-rose-700"
        >
          Cambiar o quitar
        </button>
      </summary>
      <div className="grid gap-3 border-t border-slate-100 px-4 pb-4 pt-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
          <p className="text-[10px] font-black uppercase text-slate-400">Objetivo</p>
          <p className="text-sm font-semibold text-slate-800">{selectedPatient.nutritionalFocus || selectedPatient.fitnessGoals || "Sin registro"}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
          <p className="text-[10px] font-black uppercase text-slate-400">Peso / altura</p>
          <p className="text-sm font-semibold text-slate-800">{selectedPatient.weight ? `${selectedPatient.weight} kg` : "—"} · {selectedPatient.height ? `${selectedPatient.height} cm` : "—"}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
          <p className="text-[10px] font-black uppercase text-slate-400">Restricciones</p>
          <p className="text-sm font-semibold text-slate-800">{(selectedPatient.dietRestrictions || selectedPatient.tags || []).join(", ") || "Sin registro"}</p>
        </div>
        {selectedPatient.clinicalSummary ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 md:col-span-2 xl:col-span-3">
            <p className="text-[10px] font-black uppercase text-slate-400">Contexto clínico</p>
            <p className="text-sm font-semibold text-slate-800">{selectedPatient.clinicalSummary}</p>
          </div>
        ) : null}
      </div>
    </details>
  );
};
