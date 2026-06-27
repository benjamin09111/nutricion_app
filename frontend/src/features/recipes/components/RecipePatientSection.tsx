import React from "react";
import { useRouter } from "next/navigation";
import { Pencil, UserPlus, Library, ChevronLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { buildProjectAwarePath } from "@/lib/workflow";
import { cn, createEmptyPatientContext } from "../utils/recipe-helpers";

interface RecipePatientSectionProps {
  selectedPatient: any;
  setSelectedPatient: (patient: any) => void;
  updateSelectedPatientContext: (updater: (current: any) => any) => void;
  handlePatientLoad: () => void;
  parseDelimitedList: (value: string) => string[];
  hasSourceData: boolean;
  setIsImportCreationModalOpen: (open: boolean) => void;
  currentProjectId: string | null;
  patientSectionRef: React.RefObject<HTMLDivElement | null>;
}

export const RecipePatientSection: React.FC<RecipePatientSectionProps> = ({
  selectedPatient,
  setSelectedPatient,
  updateSelectedPatientContext,
  handlePatientLoad,
  parseDelimitedList,
  hasSourceData,
  setIsImportCreationModalOpen,
  currentProjectId,
  patientSectionRef,
}) => {
  const router = useRouter();

  return (
    <>
      <div
        id="patient-context-section"
        ref={patientSectionRef}
        className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              Contexto del paciente
            </p>
            <h3 className="text-lg font-black text-slate-900">
              Completa datos manuales o importa un paciente
            </h3>
            <p className="max-w-3xl text-sm font-medium text-slate-500">
              La IA de recetas usará este contexto para ajustar platos, porciones, metas, gustos y restricciones.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedPatient(createEmptyPatientContext())}
              className="rounded-2xl border-slate-200 bg-white font-bold"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Completar manualmente
            </Button>
            <Button
              variant="outline"
              onClick={handlePatientLoad}
              className="rounded-2xl border-emerald-200 bg-emerald-50 font-bold text-emerald-800"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Importar paciente
            </Button>
          </div>
        </div>

        {selectedPatient ? (
          <div className="mt-5 grid gap-4">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {selectedPatient.source === "imported" ? "Paciente importado" : "Datos manuales"}
              </span>
              {selectedPatient.importedPatientId ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  Reutilizable
                </span>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Nombre del paciente *
                </p>
                <Input
                  id="patient-name-input"
                  value={selectedPatient.fullName || ""}
                  onChange={(e) =>
                    updateSelectedPatientContext((current) => ({
                      ...current,
                      fullName: e.target.value,
                    }))
                  }
                  placeholder="Nombre y apellido"
                  className={cn(
                    "h-10 rounded-xl border-slate-200",
                    !selectedPatient.fullName && "border-rose-200 focus:border-rose-400 bg-rose-50/10",
                  )}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Edad *
                </p>
                <Input
                  id="patient-age-input"
                  type="number"
                  min={0}
                  value={selectedPatient.ageYears ?? ""}
                  onChange={(e) =>
                    updateSelectedPatientContext((current) => ({
                      ...current,
                      ageYears:
                        e.target.value === ""
                          ? null
                          : Math.max(0, Math.round(Number(e.target.value) || 0)),
                    }))
                  }
                  placeholder="Ej: 34"
                  className={cn(
                    "h-10 rounded-xl border-slate-200",
                    (selectedPatient.ageYears === null || selectedPatient.ageYears === undefined) && "border-rose-200 focus:border-rose-400 bg-rose-50/10",
                  )}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Sexo *
                </p>
                <select
                  id="patient-gender-input"
                  value={selectedPatient.gender || ""}
                  onChange={(e) =>
                    updateSelectedPatientContext((current) => ({
                      ...current,
                      gender: e.target.value,
                    }))
                  }
                  className={cn(
                    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:outline-none",
                    !selectedPatient.gender && "border-rose-200 focus:border-rose-400 bg-rose-50/10",
                  )}
                >
                  <option value="">Seleccionar</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Metas
                </p>
                <Textarea
                  value={selectedPatient.fitnessGoals || ""}
                  onChange={(e) =>
                    updateSelectedPatientContext((current) => ({
                      ...current,
                      fitnessGoals: e.target.value,
                    }))
                  }
                  placeholder="Bajar grasa, ganar masa muscular, mejorar saciedad..."
                  className="min-h-[96px]"
                />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Gustos
                </p>
                <Textarea
                  value={selectedPatient.likes || ""}
                  onChange={(e) =>
                    updateSelectedPatientContext((current) => ({
                      ...current,
                      likes: e.target.value,
                    }))
                  }
                  placeholder="Ej: huevo, yogur, preparaciones saladas, comidas caseras..."
                  className="min-h-[96px]"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Restricciones alimenticias *
                </p>
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedPatient.noDietaryRestrictions)}
                    onChange={(e) =>
                      updateSelectedPatientContext((current) => ({
                        ...current,
                        noDietaryRestrictions: e.target.checked,
                        restrictions: e.target.checked ? ["Ninguna"] : [],
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Ninguna
                </label>
              </div>
              <Textarea
                id="patient-restrictions-input"
                value={
                  selectedPatient.noDietaryRestrictions
                    ? ""
                    : (selectedPatient.restrictions || []).join(", ")
                }
                disabled={Boolean(selectedPatient.noDietaryRestrictions)}
                onChange={(e) =>
                  updateSelectedPatientContext((current) => ({
                    ...current,
                    restrictions: parseDelimitedList(e.target.value),
                  }))
                }
                placeholder="Ej: sin lactosa, sin gluten, evitar mariscos..."
                className={cn(
                  "min-h-[84px]",
                  !selectedPatient.noDietaryRestrictions &&
                    (!selectedPatient.restrictions || selectedPatient.restrictions.length === 0) &&
                    "border-rose-200 focus:border-rose-400 bg-rose-50/10",
                )}
              />
              <p className="text-[11px] font-medium text-slate-500">
                Separa varias restricciones con comas. Si no tiene, marca “Ninguna”.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-500">
            Aún no hay contexto del paciente. Para generar recetas con IA debes importar un paciente o completar los datos manuales.
          </div>
        )}
      </div>

      {!hasSourceData ? (
        <div className="mb-6 rounded-[2rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-700">
                Dieta requerida
              </p>
              <p className="text-sm font-medium text-amber-900">
                Recetas y porciones necesita una dieta importada con alimentos para habilitar la IA y la planificación.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsImportCreationModalOpen(true)}
                className="rounded-2xl border-amber-200 bg-white font-bold text-amber-900"
              >
                <Library className="mr-2 h-4 w-4" />
                Importar dieta
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    buildProjectAwarePath("/dashboard/dieta", currentProjectId),
                  )
                }
                className="rounded-2xl border-amber-200 bg-white font-bold text-amber-900"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Ir a Dieta
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
