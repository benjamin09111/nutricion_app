"use client";

import { useState } from "react";
import { ChevronDown, User, Activity, FileText } from "lucide-react";

export interface WorkflowPatientInfo {
  id?: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  documentId?: string | null;
  birthDate?: string | null;
  age?: number | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  dietRestrictions?: string[];
  clinicalSummary?: string | null;
  fitnessGoals?: string | null;
  nutritionalFocus?: string | null;
  activityLevel?: string | null;
  primaryCondition?: string | null;
  tags?: string[];
  [key: string]: any;
}

interface WorkflowContextBannerProps {
  projectName?: string | null;
  patientName?: string | null;
  patient?: WorkflowPatientInfo | null;
  mode?: string | null;
  moduleLabel: string;
  activeConstraints?: string[];
  patientRestrictions?: string[];
  defaultOpen?: boolean;
}

export function WorkflowContextBanner({
  projectName,
  patientName,
  patient,
  mode,
  moduleLabel,
  activeConstraints = [],
  patientRestrictions = [],
  defaultOpen = false,
}: WorkflowContextBannerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const displayPatientName = patientName || patient?.fullName || null;
  const allConstraints = Array.from(
    new Set([...activeConstraints, ...patientRestrictions].filter(Boolean))
  );

  if (!projectName && !displayPatientName && !mode && allConstraints.length === 0 && !patient) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5 shadow-2xs transition-all duration-200">
      {/* Header bar / Accordion trigger */}
      <div
        className="flex flex-wrap items-center justify-between gap-2.5 cursor-pointer select-none"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-wider">
          <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-white border border-emerald-700 uppercase font-black tracking-wider shadow-2xs">
            {moduleLabel}
          </span>

          {projectName ? (
            <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 border border-slate-200 uppercase shadow-2xs">
              Proyecto: {projectName}
            </span>
          ) : null}

          {displayPatientName ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-slate-800 border border-slate-200 uppercase shadow-2xs font-extrabold">
              <User className="h-3 w-3 text-emerald-600" />
              Paciente: {displayPatientName}
            </span>
          ) : (
            <span className="rounded-full bg-white px-2.5 py-1 text-slate-400 border border-slate-200 uppercase shadow-2xs italic">
              Sin paciente
            </span>
          )}

          {mode ? (
            <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 border border-slate-200 uppercase shadow-2xs">
              Modo: {mode === "CLINICAL" ? "Clínico" : "General"}
            </span>
          ) : null}

          {/* Restrictions badge or "No seleccionada" badge */}
          {allConstraints.length > 0 ? (
            allConstraints.map((constraint) => (
              <span
                key={constraint}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-rose-800 border border-rose-200 font-extrabold shadow-2xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Restricción: {constraint}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-amber-800 border border-amber-200/80 font-bold shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Restricción: No seleccionada
            </span>
          )}
        </div>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100/60 transition-colors shadow-2xs cursor-pointer"
        >
          <span>{isOpen ? "Ocultar detalle" : "Ver detalle paciente"}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-emerald-700" : "text-emerald-600"
            }`}
          />
        </button>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-emerald-200/70 text-xs space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Datos Personales */}
            <div className="rounded-xl border border-emerald-100 bg-white/90 p-3 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <User className="h-3.5 w-3.5 text-emerald-600" />
                <span>Datos Personales</span>
              </div>
              <div className="space-y-1 text-slate-700">
                <p>
                  <strong className="text-slate-900">Nombre:</strong>{" "}
                  {patient?.fullName || displayPatientName || "Sin registro"}
                </p>
                <p>
                  <strong className="text-slate-900">Documento / RUT:</strong>{" "}
                  {patient?.documentId || "No registrado"}
                </p>
                <p>
                  <strong className="text-slate-900">Email:</strong>{" "}
                  {patient?.email || "No registrado"}
                </p>
                <p>
                  <strong className="text-slate-900">Teléfono:</strong>{" "}
                  {patient?.phone || "No registrado"}
                </p>
                <p>
                  <strong className="text-slate-900">Fecha nac. / Edad:</strong>{" "}
                  {patient?.birthDate || (patient?.age ? `${patient.age} años` : "No registrada")}
                </p>
                <p>
                  <strong className="text-slate-900">Género:</strong>{" "}
                  {patient?.gender || "No registrado"}
                </p>
              </div>
            </div>

            {/* Card 2: Perfil Físico & Nutricional */}
            <div className="rounded-xl border border-emerald-100 bg-white/90 p-3 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <Activity className="h-3.5 w-3.5 text-emerald-600" />
                <span>Perfil Físico & Objetivos</span>
              </div>
              <div className="space-y-1 text-slate-700">
                <p>
                  <strong className="text-slate-900">Estatura / Peso:</strong>{" "}
                  {patient?.height ? `${patient.height} cm` : "—"} ·{" "}
                  {patient?.weight ? `${patient.weight} kg` : "—"}
                </p>
                <p>
                  <strong className="text-slate-900">Restricciones:</strong>{" "}
                  {allConstraints.length > 0 ? (
                    <span className="font-semibold text-rose-700">
                      {allConstraints.join(", ")}
                    </span>
                  ) : (
                    <span className="text-slate-500 font-normal">No seleccionada</span>
                  )}
                </p>
                <p>
                  <strong className="text-slate-900">Enfoque Nutricional:</strong>{" "}
                  {patient?.nutritionalFocus || "No registrado"}
                </p>
                <p>
                  <strong className="text-slate-900">Metas Fitness:</strong>{" "}
                  {patient?.fitnessGoals || "No registrado"}
                </p>
                {patient?.primaryCondition && (
                  <p>
                    <strong className="text-slate-900">Condición médica:</strong>{" "}
                    {patient.primaryCondition}
                  </p>
                )}
              </div>
            </div>

            {/* Card 3: Resumen Clínico */}
            <div className="rounded-xl border border-emerald-100 bg-white/90 p-3 shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <FileText className="h-3.5 w-3.5 text-emerald-600" />
                <span>Resumen Clínico / Notas</span>
              </div>
              <p className="text-slate-600 leading-relaxed italic">
                {patient?.clinicalSummary || "Sin resumen clínico o notas adicionales registradas para este paciente."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
