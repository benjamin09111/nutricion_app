import React from "react";
import { Baby, ChefHat, Ruler, Save, ShieldAlert, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Patient } from "@/features/patients";
import { ClinicalRecordDraft, ClinicalRecordSource } from "../clinical-record";

interface PatientClinicalRecordTabProps {
  patient: Patient;
  draft: ClinicalRecordDraft;
  setDraft: React.Dispatch<React.SetStateAction<ClinicalRecordDraft>>;
  isLoading: boolean;
  isSaving: boolean;
  onSave: () => Promise<void>;
}

const sourceOptions: Array<{ value: ClinicalRecordSource; label: string }> = [
  { value: "patient", label: "Paciente" },
  { value: "nutritionist", label: "Nutricionista" },
  { value: "calculated", label: "Calculado" },
];

function updateSection<T extends keyof ClinicalRecordDraft>(
  setDraft: React.Dispatch<React.SetStateAction<ClinicalRecordDraft>>,
  section: T,
  value: ClinicalRecordDraft[T],
) {
  setDraft((prev) => ({
    ...prev,
    [section]: value,
  }));
}

export function PatientClinicalRecordTab({
  patient,
  draft,
  setDraft,
  isLoading,
  isSaving,
  onSave,
}: PatientClinicalRecordTabProps) {
  const isFemale = patient.gender === "Femenino";

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-sm font-medium text-slate-500 shadow-sm">
        Cargando ficha clínica...
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Ficha clínica</h3>
          <p className="text-xs font-medium text-slate-500">
            Secciones livianas, editables y pensadas para guardar rápido.
          </p>
        </div>
        <Button
          onClick={onSave}
          isLoading={isSaving}
          className="rounded-xl bg-emerald-600 px-5 text-white hover:bg-emerald-700"
        >
          <Save className="mr-2 h-4 w-4" />
          Guardar ficha
        </Button>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Antecedentes vitales" icon={UserRound}>
          <SectionSource
            value={draft.dataSources.vitalHistory}
            onChange={(value) =>
              updateSection(setDraft, "dataSources", {
                ...draft.dataSources,
                vitalHistory: value,
              })
            }
          />
          <div className="space-y-3">
            <Field
              label="Ocupación"
              value={draft.vitalHistory.occupation}
              onChange={(value) =>
                updateSection(setDraft, "vitalHistory", {
                  ...draft.vitalHistory,
                  occupation: value,
                })
              }
            />
            <Field
              label="Horario laboral"
              value={draft.vitalHistory.workSchedule}
              onChange={(value) =>
                updateSection(setDraft, "vitalHistory", {
                  ...draft.vitalHistory,
                  workSchedule: value,
                })
              }
            />
            <Field
              label="Fármacos / medicamentos"
              value={draft.vitalHistory.medications}
              onChange={(value) =>
                updateSection(setDraft, "vitalHistory", {
                  ...draft.vitalHistory,
                  medications: value,
                })
              }
              multiline
            />
            <Field
              label="Suplementos / drogas"
              value={draft.vitalHistory.supplementsOrDrugs}
              onChange={(value) =>
                updateSection(setDraft, "vitalHistory", {
                  ...draft.vitalHistory,
                  supplementsOrDrugs: value,
                })
              }
              multiline
            />
            <Field
              label="Patologías diagnosticadas"
              value={draft.vitalHistory.diagnosedPathologies}
              onChange={(value) =>
                updateSection(setDraft, "vitalHistory", {
                  ...draft.vitalHistory,
                  diagnosedPathologies: value,
                })
              }
              multiline
            />
          </div>
        </Card>

        {isFemale ? (
          <Card title="Gineco-obstétrico" icon={Baby}>
            <SectionSource
              value={draft.dataSources.gynecoObstetric}
              onChange={(value) =>
                updateSection(setDraft, "dataSources", {
                  ...draft.dataSources,
                  gynecoObstetric: value,
                })
              }
            />
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.gynecoObstetric.isPregnant}
                  onChange={(e) =>
                    updateSection(setDraft, "gynecoObstetric", {
                      ...draft.gynecoObstetric,
                      isPregnant: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                ¿Está embarazada?
              </label>
              <Field
                label="Semanas de gestación"
                value={draft.gynecoObstetric.pregnancyWeeks}
                onChange={(value) =>
                  updateSection(setDraft, "gynecoObstetric", {
                    ...draft.gynecoObstetric,
                    pregnancyWeeks: value,
                  })
                }
                type="number"
              />
              <Field
                label="Peso pre-gestacional"
                value={draft.gynecoObstetric.pregestationalWeight}
                onChange={(value) =>
                  updateSection(setDraft, "gynecoObstetric", {
                    ...draft.gynecoObstetric,
                    pregestationalWeight: value,
                  })
                }
                type="number"
                suffix="kg"
              />
            </div>
          </Card>
        ) : (
          <Card title="Gineco-obstétrico" icon={Baby} muted>
            <p className="text-sm text-slate-500">
              Se muestra solo para pacientes de sexo femenino.
            </p>
          </Card>
        )}

        <Card title="Anamnesis nutricional" icon={ChefHat}>
          <SectionSource
            value={draft.dataSources.nutritionalAnamnesis}
            onChange={(value) =>
              updateSection(setDraft, "dataSources", {
                ...draft.dataSources,
                nutritionalAnamnesis: value,
              })
            }
          />
          <div className="space-y-3">
            <Field
              label="Preferencias alimentarias"
              value={draft.nutritionalAnamnesis.eatingPreferences}
              onChange={(value) =>
                updateSection(setDraft, "nutritionalAnamnesis", {
                  ...draft.nutritionalAnamnesis,
                  eatingPreferences: value,
                })
              }
              multiline
            />
            <Field
              label="Observaciones clínicas"
              value={draft.nutritionalAnamnesis.clinicalObservations}
              onChange={(value) =>
                updateSection(setDraft, "nutritionalAnamnesis", {
                  ...draft.nutritionalAnamnesis,
                  clinicalObservations: value,
                })
              }
              multiline
            />
          </div>
        </Card>

        <Card title="Antropometría ampliada" icon={Ruler}>
          <SectionSource
            value={draft.dataSources.anthropometry}
            onChange={(value) =>
              updateSection(setDraft, "dataSources", {
                ...draft.dataSources,
                anthropometry: value,
              })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            {[
              ["tricipital", "Tricipital"],
              ["bicipital", "Bicipital"],
              ["subescapular", "Subescapular"],
              ["suprailiac", "Suprailiaco"],
            ].map(([key, label]) => (
              <Field
                key={key}
                label={`${label} (mm)`}
                value={draft.anthropometry.skinfolds[key as keyof ClinicalRecordDraft["anthropometry"]["skinfolds"]]}
                onChange={(value) =>
                  updateSection(setDraft, "anthropometry", {
                    ...draft.anthropometry,
                    skinfolds: {
                      ...draft.anthropometry.skinfolds,
                      [key]: value,
                    },
                  })
                }
                type="number"
              />
            ))}

            {[
              ["kneeHeight", "Altura rodilla", "cm"],
              ["calfCircumference", "Pantorrilla", "cm"],
              ["armCircumference", "Braquial", "cm"],
              ["waistCircumference", "Cintura", "cm"],
              ["hipCircumference", "Cadera", "cm"],
            ].map(([key, label, suffix]) => (
              <Field
                key={key}
                label={`${label} (${suffix})`}
                value={draft.anthropometry.circumferences[key as keyof ClinicalRecordDraft["anthropometry"]["circumferences"]]}
                onChange={(value) =>
                  updateSection(setDraft, "anthropometry", {
                    ...draft.anthropometry,
                    circumferences: {
                      ...draft.anthropometry.circumferences,
                      [key]: value,
                    },
                  })
                }
                type="number"
              />
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
  muted = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <article
      className={[
        "rounded-2xl border p-4 shadow-sm",
        muted ? "border-dashed border-slate-200 bg-slate-50" : "border-slate-100 bg-white",
      ].join(" ")}
    >
      <div className="mb-4 flex items-center gap-2 border-b border-slate-50 pb-3">
        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
          <Icon className="h-4 w-4" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      </div>
      {children}
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  suffix,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  suffix?: string;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </label>
      <div className="relative">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-emerald-400 focus:bg-white"
          />
        ) : (
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-xl bg-slate-50 text-sm font-medium"
          />
        )}
        {suffix && value ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-slate-400">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function SectionSource({
  value,
  onChange,
}: {
  value?: ClinicalRecordSource;
  onChange: (value: ClinicalRecordSource) => void;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
      <ShieldAlert className="h-3.5 w-3.5 text-emerald-500" />
      <span className="uppercase tracking-widest">Fuente</span>
      <select
        value={value || "nutritionist"}
        onChange={(e) => onChange(e.target.value as ClinicalRecordSource)}
        className="ml-auto rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer"
      >
        {sourceOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
