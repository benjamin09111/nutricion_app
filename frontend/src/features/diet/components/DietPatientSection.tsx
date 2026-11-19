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
      <div className="rounded-2xl border border-dashed border-[#DDE7B8] bg-[#F0F5DF]/50 p-6 text-center">
        <div className="flex flex-col items-center gap-4 max-w-xl mx-auto">
          <div>
            <p className="text-xs font-semibold text-[#668E20]">
              Importa un paciente para continuar (requerido para pauta personalizada)
            </p>
            <p className="mt-1 text-xs text-[#626573]">
              El plan incorporará automáticamente sus datos clínicos, requerimientos y restricciones.
            </p>
          </div>
          <button
            type="button"
            onClick={onImportPatient}
            disabled={isLoadingPatients}
            className="h-10 px-5 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#86A83C]/20 disabled:opacity-50"
          >
            {isLoadingPatients ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
            <span>{isLoadingPatients ? "Cargando..." : "Importar paciente"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <details className="group rounded-2xl border border-[#E9E5E7] bg-white shadow-2xs" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 select-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[#86A83C]" />
          <span className="text-sm font-bold text-[#20212B]">{selectedPatient.fullName}</span>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            handleUnlinkPatient();
          }}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
        >
          Cambiar o quitar
        </button>
      </summary>
      <div className="grid gap-3 border-t border-[#F0ECEE] px-4 pb-4 pt-3.5 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-[#E9E5E7] bg-slate-50/60 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">Objetivo</p>
          <p className="text-xs font-semibold text-[#20212B] mt-0.5">{selectedPatient.nutritionalFocus || selectedPatient.fitnessGoals || "Sin registro"}</p>
        </div>
        <div className="rounded-xl border border-[#E9E5E7] bg-slate-50/60 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">Peso / altura</p>
          <p className="text-xs font-semibold text-[#20212B] mt-0.5">{selectedPatient.weight ? `${selectedPatient.weight} kg` : "—"} · {selectedPatient.height ? `${selectedPatient.height} cm` : "—"}</p>
        </div>
        <div className="rounded-xl border border-[#E9E5E7] bg-slate-50/60 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">Restricciones</p>
          <p className="text-xs font-semibold text-[#20212B] mt-0.5">{(selectedPatient.dietRestrictions || selectedPatient.tags || []).join(", ") || "Sin registro"}</p>
        </div>
        {selectedPatient.clinicalSummary ? (
          <div className="rounded-xl border border-[#E9E5E7] bg-slate-50/60 px-3 py-2 md:col-span-2 xl:col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">Contexto clínico</p>
            <p className="text-xs font-semibold text-[#20212B] mt-0.5">{selectedPatient.clinicalSummary}</p>
          </div>
        ) : null}
      </div>
    </details>
  );
};
