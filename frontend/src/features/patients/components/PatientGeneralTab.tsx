import React from "react";
import {
  User,
  Mail,
  Phone,
  Ruler,
  Activity,
  Target,
  Flame,
  Heart,
  Dumbbell,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Patient, ActivityLevel } from "@/features/patients";
import { formatRut } from "@/lib/rut-utils";
import {
  cn,
  toDateOnly,
  formatDateOnlyForLocale,
} from "../utils/patient-helpers";

export const ACTIVITY_LEVEL_OPTIONS: {
  key: ActivityLevel;
  label: string;
  description: string;
  icon: any;
}[] = [
  {
    key: "sedentario",
    label: "Sedentario",
    description: "Poco o ningún ejercicio",
    icon: Flame,
  },
  {
    key: "ligero",
    label: "Ligero",
    description: "Ejercicio 1-3 días/semana",
    icon: Activity,
  },
  {
    key: "moderado",
    label: "Moderado",
    description: "Ejercicio 3-5 días/semana",
    icon: Heart,
  },
  {
    key: "activo",
    label: "Activo",
    description: "Ejercicio 6-7 días/semana",
    icon: Dumbbell,
  },
  {
    key: "muy_activo",
    label: "Muy activo",
    description: "Atleta o trabajo físico pesado",
    icon: Zap,
  },
];

interface PatientGeneralTabProps {
  patient: Patient;
  isEditing: boolean;
  editForm: Partial<Patient>;
  updateField: (field: keyof Patient, value: any) => void;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getCurrentActivityLevel: () => ActivityLevel;
  updateActivityLevel: (value: ActivityLevel) => void;
  toggleStatus: () => void;
}

export function PatientGeneralTab({
  patient,
  isEditing,
  editForm,
  updateField,
  handlePhoneChange,
  getCurrentActivityLevel,
  updateActivityLevel,
  toggleStatus,
}: PatientGeneralTabProps) {
  return (
    <div
      className="space-y-4 animate-in fade-in duration-500"
      data-tutorial-id="patient-overview-section"
    >
      {/* 3-Column Layout for Primary Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {/* Column 1: Identity & Contact */}
        <div className="flex flex-col">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex-1 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-slate-800">
                Identidad
              </h2>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  {isEditing ? (
                    <Input
                      placeholder="valen@email.com"
                      className="h-10 pl-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white focus:border-emerald-500/20 transition-all"
                      value={editForm.email || ""}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  ) : (
                    <div className="h-10 pl-10 flex items-center bg-slate-50/50 rounded-xl text-sm font-bold text-slate-700 break-all px-3">
                      {patient.email || "Sin email"}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  {isEditing ? (
                    <Input
                      placeholder="+56 9 1234 5678"
                      className="h-10 pl-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white focus:border-emerald-500/20 transition-all"
                      value={editForm.phone || ""}
                      onChange={handlePhoneChange}
                    />
                  ) : (
                    <div className="h-10 pl-10 flex items-center bg-slate-50/50 rounded-xl text-sm font-bold text-slate-700 px-3">
                      {patient.phone || "No registrado"}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                  RUT
                </label>
                {isEditing ? (
                  <Input
                    placeholder="12.345.678-9"
                    className="h-10 rounded-xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white focus:border-emerald-500/20 transition-all"
                    value={editForm.documentId || ""}
                    onChange={(e) =>
                      updateField("documentId", formatRut(e.target.value))
                    }
                  />
                ) : (
                  <div className="h-10 flex items-center bg-slate-50/50 rounded-xl text-sm font-bold text-slate-700 px-3">
                    {patient.documentId || "Sin identificador"}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                    Sexo
                  </label>
                  {isEditing ? (
                    <select
                      value={editForm.gender || ""}
                      onChange={(e) =>
                        updateField("gender", e.target.value)
                      }
                      className="w-full h-10 rounded-xl bg-slate-50 border-transparent px-3 text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500/20 transition-all cursor-pointer appearance-none animate-in duration-300"
                    >
                      <option value="">—</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  ) : (
                    <div className="h-10 flex items-center bg-slate-50/50 rounded-xl text-sm font-bold text-slate-700 px-3">
                      {patient.gender || "No def."}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">
                    Nacimiento
                  </label>
                  {isEditing ? (
                    <Input
                      type="date"
                      className="h-10 rounded-xl bg-slate-50 border-transparent text-xs font-semibold focus:bg-white transition-all px-3"
                      value={toDateOnly(editForm.birthDate)}
                      onChange={(e) =>
                        updateField("birthDate", e.target.value)
                      }
                    />
                  ) : (
                    <div className="h-10 flex items-center bg-slate-50/50 rounded-xl text-sm font-bold text-slate-700 px-3">
                      {patient.birthDate
                        ? formatDateOnlyForLocale(patient.birthDate, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "---"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Antropometría & Metas nutricionales */}
        <div className="space-y-4 flex flex-col">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <Ruler className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="text-base font-bold text-slate-800">
                Antropometría
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                  Peso (kg)
                </label>
                <div className="h-10 flex items-center justify-center bg-slate-50 rounded-xl text-sm font-black text-indigo-700 px-3 border border-indigo-100">
                  {patient.weight ?? "---"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                  Altura (cm)
                </label>
                <div className="h-10 flex items-center justify-center bg-slate-50 rounded-xl text-sm font-black text-emerald-600 px-3 border border-emerald-100">
                  {patient.height ?? "---"}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Actividad
                </label>
              </div>
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {ACTIVITY_LEVEL_OPTIONS.map((item) => {
                    const Icon = item.icon;
                    const isSelected =
                      getCurrentActivityLevel() === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => updateActivityLevel(item.key)}
                        className={cn(
                          "min-h-10 rounded-xl border px-2 py-1.5 text-left transition-all cursor-pointer",
                          isSelected
                            ? "border-emerald-500 bg-emerald-600 text-white"
                            : "border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100",
                        )}
                      >
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                          <Icon className="h-3.5 w-3.5" />
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                  {(() => {
                    const current =
                      ACTIVITY_LEVEL_OPTIONS.find(
                        (item) => item.key === getCurrentActivityLevel(),
                      ) || ACTIVITY_LEVEL_OPTIONS[0];
                    const Icon = current.icon;
                    return (
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-white text-emerald-600 flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">
                          {current.label}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex-1 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h2 className="text-base font-bold text-slate-800">
                Metas nutricionales
              </h2>
              <Target className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-3">
              {(() => {
                const dataSource = isEditing
                  ? editForm.customVariables
                  : patient.customVariables;
                const vars = Array.isArray(dataSource)
                  ? (dataSource as any[])
                  : [];
                const getCV = (key: string) =>
                  vars.find((v) => v.key === key)?.value || "";
                const updateCV = (
                  key: string,
                  label: string,
                  value: string,
                  unit: string,
                ) => {
                  if (!isEditing) return;
                  const prev = Array.isArray(editForm.customVariables)
                    ? [...(editForm.customVariables as any[])]
                    : [];
                  const idx = prev.findIndex((v) => v.key === key);
                  if (idx >= 0) prev[idx] = { key, label, value, unit };
                  else prev.push({ key, label, value, unit });
                  updateField("customVariables", prev);
                };

                return (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        id: "Calories",
                        label: "Calorías",
                        unit: "kcal",
                        color: "text-indigo-600",
                        bg: "bg-indigo-50",
                      },
                      {
                        id: "Protein",
                        label: "Proteína",
                        unit: "g",
                        color: "text-emerald-600",
                        bg: "bg-emerald-50",
                      },
                    ].map((f) => (
                      <div key={f.id} className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">
                          {f.label}
                        </label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={getCV(`target${f.id}`)}
                            onChange={(e) =>
                              updateCV(
                                `target${f.id}`,
                                `${f.label} Meta`,
                                e.target.value,
                                f.unit,
                              )
                            }
                            className={cn(
                              "h-9 font-bold bg-white rounded-lg text-xs border-transparent focus:ring-2 focus:ring-slate-200 transition-all",
                              f.color,
                            )}
                            placeholder="0"
                          />
                        ) : (
                          <div
                            className={cn(
                              "h-9 flex items-center justify-center rounded-lg font-bold text-xs border border-transparent",
                              f.bg,
                              f.color,
                            )}
                          >
                            {getCV(`target${f.id}`) || "---"}
                            <span className="text-[8px] ml-1 opacity-60">
                              {f.unit}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Column 3: Estado del Paciente */}
        <div className="flex flex-col">
          <div
            className={cn(
              "bg-white rounded-2xl p-4 border transition-all duration-500 hover:shadow-md",
              patient.status === "Inactive"
                ? "border-slate-200 bg-slate-50/50"
                : "border-slate-100",
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  "p-1.5 rounded-lg",
                  patient.status === "Inactive"
                    ? "bg-slate-200 text-slate-500"
                    : "bg-emerald-100 text-emerald-600",
                )}
              >
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">
                  Estado
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  {patient.status === "Active"
                    ? "En tratamiento"
                    : "Pausado"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                {patient.status === "Active"
                  ? "Paciente activo. Puedes pausar su seguimiento si terminó tratamiento."
                  : "Paciente inactivo. Su historial clínico se mantiene intacto."}
              </p>
              <Button
                onClick={toggleStatus}
                variant="outline"
                className={cn(
                  "w-full h-9 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
                  patient.status === "Active"
                    ? "border-slate-200 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                    : "border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white",
                )}
              >
                {patient.status === "Active"
                  ? "Marcar Inactivo"
                  : "Reactivar"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
