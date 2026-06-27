import React from "react";
import { CheckCircle2, AlertCircle, User } from "lucide-react";
import { cn } from "../utils/recipe-helpers";

interface RecipeBaseSectionProps {
  hasSourceData: boolean;
  assignedSourceSummary: string;
  selectedPatient: any;
  sourceFoods: string[];
  handleUnlinkPatient: () => void;
  baseSectionRef: React.RefObject<HTMLDivElement | null>;
}

export const RecipeBaseSection: React.FC<RecipeBaseSectionProps> = ({
  hasSourceData,
  assignedSourceSummary,
  selectedPatient,
  sourceFoods,
  handleUnlinkPatient,
  baseSectionRef,
}) => {
  return (
    <>
      <div
        ref={baseSectionRef}
        className="mb-6 animate-in slide-in-from-top duration-300 mx-auto w-full"
      >
        <div
          className={cn(
            "rounded-[2.5rem] border p-6 shadow-sm",
            hasSourceData
              ? "border-emerald-100 bg-emerald-50"
              : "border-amber-100 bg-amber-50",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl border",
                  hasSourceData
                    ? "border-emerald-200 bg-emerald-100"
                    : "border-amber-200 bg-amber-100",
                )}
              >
                {hasSourceData ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                )}
              </div>
              <div>
                <p
                  className={cn(
                    "mb-1 text-[10px] font-black uppercase tracking-widest leading-none",
                    hasSourceData ? "text-emerald-600" : "text-amber-600",
                  )}
                >
                  Estado de base alimentaria
                </p>
                <h3 className="text-xl font-black text-slate-900 leading-none flex items-center gap-3">
                  {assignedSourceSummary}
                  {selectedPatient && (
                    <span className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200">
                      <User className="h-3.5 w-3.5 text-emerald-400" />
                      {selectedPatient.fullName || selectedPatient.name}
                    </span>
                  )}
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  {hasSourceData
                    ? `Esta etapa ya está conectada con ${assignedSourceSummary.toLowerCase()}. Puedes seguir construyendo sobre esa base o importar otra creación.`
                    : "Aún no tienes una dieta o carrito asignado en esta etapa. Si quieres continuar con progreso previo, importa una creación antes de seguir."}
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-500">
                  {selectedPatient
                    ? `Paciente asignado desde dieta: ${selectedPatient.fullName || selectedPatient.name}`
                    : "Paciente asignado desde dieta: no"}
                </p>
              </div>
            </div>
            <div className="shrink-0 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Alimentos disponibles
              </p>
              <p className="mt-1 text-lg font-black text-slate-900">
                {sourceFoods.length}
              </p>
            </div>
          </div>
        </div>
      </div>
      {selectedPatient && (
        <div className="mb-6 animate-in slide-in-from-top duration-300 mx-auto w-full">
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center border border-emerald-200">
                <User className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">
                  Paciente Vinculado
                </p>
                <h3 className="text-xl font-black text-slate-900 italic leading-none">
                  {selectedPatient.fullName || selectedPatient.name}
                </h3>
              </div>
            </div>
            <button
              onClick={handleUnlinkPatient}
              className="bg-white/50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200/50 hover:border-rose-200 transition-all cursor-pointer"
            >
              Cambiar o Desvincular
            </button>
          </div>
        </div>
      )}
    </>
  );
};
