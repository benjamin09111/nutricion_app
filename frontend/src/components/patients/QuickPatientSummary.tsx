import type { ReactNode } from "react";

type QuickPatientSummaryProps = {
  fullName: string;
  ageYears?: number | null;
  gender?: string | null;
  weight?: number | null;
  height?: number | null;
  activityLevel?: string | null;
  restrictions?: string[];
  likes?: string | null;
  nutritionalFocus?: string | null;
  fitnessGoals?: string | null;
  clinicalSummary?: string | null;
  metrics?: ReactNode;
};

export function QuickPatientSummary({
  fullName,
  ageYears,
  gender,
  weight,
  height,
  activityLevel = "moderado",
  restrictions = [],
  likes,
  nutritionalFocus,
  fitnessGoals,
  clinicalSummary,
  metrics,
}: QuickPatientSummaryProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase text-slate-400">Nombre</p>
          <p className="text-sm font-semibold text-slate-800">{fullName}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase text-slate-400">Edad</p>
          <p className="text-sm font-semibold text-slate-800">{ageYears ? `${ageYears} años` : "—"}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase text-slate-400">Sexo</p>
          <p className="text-sm font-semibold text-slate-800">{gender || "—"}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase text-slate-400">Peso</p>
          <p className="text-sm font-semibold text-slate-800">{weight ? `${weight} kg` : "—"}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase text-slate-400">Altura</p>
          <p className="text-sm font-semibold text-slate-800">{height ? `${height} cm` : "—"}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase text-slate-400">Actividad</p>
          <p className="text-sm font-semibold text-slate-800">{activityLevel}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase text-slate-400">Restricciones dietéticas o de salud</p>
          <p className="text-sm font-semibold text-slate-800">{restrictions.length > 0 ? restrictions.join(", ") : "Sin registro"}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
          <p className="text-[10px] font-black uppercase text-slate-400">Gustos</p>
          <p className="text-sm font-semibold text-slate-800">{likes || "Sin registro"}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 md:col-span-2">
          <p className="text-[10px] font-black uppercase text-slate-400">Objetivo</p>
          <p className="text-sm font-semibold text-slate-800">{nutritionalFocus || fitnessGoals || "Sin registro"}</p>
        </div>
        {clinicalSummary ? (
          <div className="rounded-lg border border-slate-100 bg-white px-3 py-2 md:col-span-2">
            <p className="text-[10px] font-black uppercase text-slate-400">Resumen clínico</p>
            <p className="text-sm font-semibold text-slate-800">{clinicalSummary}</p>
          </div>
        ) : null}
      </div>

      {metrics ? <div className="mt-4">{metrics}</div> : null}
    </div>
  );
}
