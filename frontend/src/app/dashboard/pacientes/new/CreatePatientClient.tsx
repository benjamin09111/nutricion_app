"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Save,
  RotateCcw,
  AlertCircle,
  Plus,
  Info,
  ChevronRight,
  ClipboardList,
  Flame,
  Dumbbell,
  HeartPulse,
  Activity,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TagInput } from "@/components/ui/TagInput";
import { MetricTagInput } from "@/components/ui/metric-tag-input";
import { Patient } from "@/features/patients";
import { usePatientDraft } from "@/features/patients/hooks/usePatientDraft";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { validateRut, formatRut } from "@/lib/rut-utils";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { fetchApi, getApiUrl } from "@/lib/api-base";

export default function CreatePatientClient() {
  const router = useRouter();
  const { draft, updateDraft, clearDraft, isLoaded } = usePatientDraft();
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const selectedMetrics = (draft.customVariables || []).filter(m => m.key !== "activityLevel");

  // Ensure weight is always in customVariables for new/existing patients in this form
  useEffect(() => {
    if (isLoaded) {
      const vars = draft.customVariables || [];
      const hasWeight = vars.some((v: any) => v.key === "weight");
      if (!hasWeight) {
        updateDraft({
          customVariables: [
            { key: "weight", label: "Peso", unit: "kg", value: draft.weight || "" },
            ...vars
          ]
        });
      }
    }
  }, [isLoaded]);

  if (!isLoaded) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+")) val = "+" + val.replace(/\+/g, "");
    const cleanVal = "+" + val.substring(1).replace(/\D/g, "");
    updateDraft({ phone: cleanVal });
  };

  const handleSaveClick = () => {
    if (!draft.fullName || !draft.email) {
      toast.error("Por favor completa los campos obligatorios (Nombre y Email).");
      return;
    }
    if (draft.documentId && !validateRut(draft.documentId)) {
      toast.error("El RUT ingresado no es vÃ¡lido.");
      return;
    }
    setShowSaveConfirm(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    setShowSaveConfirm(false);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const method = draft.id ? "PATCH" : "POST";
      const url = draft.id ? `/patients/${draft.id}` : "/patients";

      const payload: any = {
        fullName: draft.fullName,
        email: draft.email || undefined,
        phone: draft.phone || undefined,
        documentId: draft.documentId || undefined,
        birthDate: draft.birthDate ? new Date(draft.birthDate).toISOString() : undefined,
        gender: draft.gender || undefined,
        height: draft.height ? Number(draft.height.toString().replace(",", ".")) : undefined,
        weight: draft.weight ? Number(draft.weight.toString().replace(",", ".")) : undefined,
        dietRestrictions: draft.dietRestrictions || [],
        clinicalSummary: draft.clinicalSummary || undefined,
        nutritionalFocus: draft.nutritionalFocus || undefined,
        fitnessGoals: draft.fitnessGoals || undefined,
        likes: draft.likes || undefined,
        customVariables: draft.customVariables || [],
        activityLevel: draft.activityLevel || "sedentario",
      };

      const response = await fetchApi(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedPatient = await response.json();
        toast.success(draft.id ? "Expediente actualizado." : "Paciente registrado con Ã©xito.");
        clearDraft();
        router.push(`/dashboard/pacientes/${savedPatient.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Error al guardar el paciente");
      }
    } catch (error) {
      console.error("Save Patient Error:", error);
      toast.error("Error de conexiÃ³n con el servidor");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto pb-24 animate-in fade-in duration-700 px-2 sm:px-4">
      {/* Sidebar Actions Menu (Sticky Right) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col gap-4">
        <div className="bg-white/80 backdrop-blur-xl p-3 rounded-3xl border border-slate-200 shadow-2xl flex flex-col gap-3">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-all flex items-center justify-center group relative"
            title="Reiniciar Formulario"
          >
            <RotateCcw className="w-6 h-6 group-hover:rotate-[-45deg] transition-transform duration-300" />
            <span className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-black uppercase px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap tracking-wider">
              Reiniciar
            </span>
          </button>

          <div className="h-px bg-slate-100 mx-2" />

          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className={cn(
              "w-14 h-14 rounded-2xl transition-all flex items-center justify-center group relative shadow-lg shadow-emerald-200/50",
              isSaving ? "bg-slate-100" : "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
            title={draft.id ? "Actualizar Ficha" : "Registrar Paciente"}
          >
            {isSaving ? (
              <span className="w-6 h-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
            ) : (
              <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
            )}
            <span className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-black uppercase px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap tracking-wider">
              {draft.id ? "Guardar" : "Registrar"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Bottom Actions */}
      <div className="xl:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
        <div className="bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700/50">
          <Button
            variant="ghost"
            onClick={() => setShowResetConfirm(true)}
            className="flex-1 h-12 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reiniciar
          </Button>
          <Button
            onClick={handleSaveClick}
            disabled={isSaving}
            className="flex-[2] h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-emerald-500/20"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {draft.id ? "Guardar Cambios" : "Registrar"}
          </Button>
        </div>
      </div>

      <div className="space-y-6 lg:space-y-8">
        {/* Header with Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="group flex items-center gap-2 hover:bg-slate-100/50 rounded-xl px-4 py-2 transition-all w-fit">
            <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            <span className="text-sm font-medium text-slate-500 group-hover:text-slate-800 transition-colors">Volver</span>
          </Button>

          {/* Header Buttons kept for visibility, but side menu is primary */}
          <div className="hidden xl:flex items-center gap-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Acceso RÃ¡pido Lateral Activo
            </div>
          </div>
        </div>

        {/* Main Branding Banner */}
        <div className="bg-slate-900 rounded-3xl p-6 lg:p-10 relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/5 blur-[80px] translate-y-1/2 -translate-x-1/2 rounded-full" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 lg:gap-8">
              <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-2xl bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg border border-emerald-300/30">
                <User className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight mb-2">
                  {draft.id ? "Editando Expediente" : "Nueva Ficha ClÃ­nica"}
                </h1>
                <p className="text-emerald-100/60 text-sm lg:text-base max-w-xl font-medium">
                  Completa la informaciÃ³n necesaria para personalizar el seguimiento nutricional y optimizar los resultados del paciente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column Layout for Primary Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {/* Column 1: Identity & Contact */}
          <div className="flex flex-col">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex-1 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Identidad</h2>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Nombre Completo *</label>
                  <Input
                    placeholder="Valentina Morales Lagos"
                    className="h-12 rounded-2xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                    value={draft.fullName}
                    onChange={(e) => updateDraft({ fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="valen@email.com"
                      className="h-12 pl-11 rounded-2xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                      value={draft.email}
                      onChange={(e) => updateDraft({ email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">TelÃ©fono</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="+56 9 1234 5678"
                      className="h-12 pl-11 rounded-2xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                      value={draft.phone}
                      onChange={handlePhoneChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">RUT (Opcional)</label>
                  <Input
                    placeholder="12.345.678-9"
                    className="h-12 rounded-2xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                    value={draft.documentId || ""}
                    onChange={(e) => updateDraft({ documentId: formatRut(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-wider">Sexo biolÃ³gico</label>
                  <select
                    value={draft.gender || ""}
                    onChange={(e) => updateDraft({ gender: e.target.value })}
                    className="w-full h-12 rounded-2xl bg-slate-50 border-transparent px-4 text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all cursor-pointer appearance-none"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Nutrition & Body */}
          <div className="space-y-6 flex flex-col">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-4">Antropometría</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Peso (kg)</label>
                  <Input type="number" step="any" className="h-12 rounded-2xl bg-slate-50 border-transparent text-center font-bold text-lg" value={draft.weight ?? ""} onChange={(e) => updateDraft({ weight: e.target.value ? parseFloat(e.target.value) : undefined })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Altura (cm)</label>
                  <Input type="number" step="any" className="h-12 rounded-2xl bg-slate-50 border-transparent text-center font-bold text-lg" value={draft.height ?? ""} onChange={(e) => updateDraft({ height: e.target.value ? parseFloat(e.target.value) : undefined })} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex-1 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <h2 className="text-lg font-bold text-slate-800">Metas nutricionales</h2>
                <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg uppercase tracking-widest">Opcional</span>
              </div>
              <MetricTagInput
                value={selectedMetrics}
                mandatoryKeys={["weight"]}
                onChange={(metrics) => updateDraft({
                  customVariables: metrics
                    .filter((m) => typeof m.key === "string" && m.key.trim().length > 0 && m.key !== "activityLevel")
                    .map((m) => ({ key: String(m.key), label: m.label, unit: m.unit, value: m.value })),
                })}
                placeholder="Grasa %, Pliegues..."
                className="bg-white"
              />

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-5">
                <p className="text-xs font-medium text-slate-500">
                  Objetivos por día
                </p>
                {(() => {
                  const vars = Array.isArray(draft.customVariables) ? draft.customVariables as any[] : [];
                  const getCV = (key: string) => vars.find(v => v.key === key)?.value || "";
                  const updateCV = (key: string, label: string, value: string, unit: string) => {
                    const prev = Array.isArray(draft.customVariables) ? [...draft.customVariables as any[]] : [];
                    const idx = prev.findIndex(v => v.key === key);
                    if (idx >= 0) prev[idx] = { key, label, value, unit };
                    else prev.push({ key, label, value, unit });
                    updateDraft({ customVariables: prev });
                  };
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: "Calories", label: "Calorías", unit: "kcal", color: "text-orange-600" },
                        { id: "Protein", label: "Proteína", unit: "g", color: "text-rose-600" },
                        { id: "Carbs", label: "Carbs", unit: "g", color: "text-blue-600" },
                        { id: "Fats", label: "Grasas", unit: "g", color: "text-purple-600" }
                      ].map((f) => (
                        <div key={f.id} className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{f.label}</label>
                          <Input type="number" value={getCV(`target${f.id}`)} onChange={e => updateCV(`target${f.id}`, `${f.label} Meta`, e.target.value, f.unit)} className={cn("h-10 font-bold bg-white rounded-xl text-sm border-transparent", f.color)} placeholder="0" />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Column 3: Lifestyle & Constraints */}
          <div className="space-y-6 flex flex-col">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-5">
                <div className="p-2 bg-rose-50 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Restricciones</h2>
              </div>
              <TagInput value={draft.dietRestrictions || []} onChange={(tags) => updateDraft({ dietRestrictions: tags })} fetchSuggestionsUrl={`${getApiUrl()}/tags`} placeholder="Diabetes, Celiaco, Alergias..." className="mt-2" />
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex-1 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-4">Foco & Fitness</h2>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Foco Nutricional</label>
                  <Input placeholder="Ej. Pérdida de grasa corporal" className="h-12 rounded-2xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white transition-all" value={draft.nutritionalFocus || ""} onChange={(e) => updateDraft({ nutritionalFocus: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Metas Fitness</label>
                  <Input placeholder="Ej. Maratón en 3 meses" className="h-12 rounded-2xl bg-slate-50 border-transparent text-sm font-semibold focus:bg-white transition-all" value={draft.fitnessGoals || ""} onChange={(e) => updateDraft({ fitnessGoals: e.target.value })} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 ml-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <label className="text-[10px] font-black uppercase text-slate-400">Nivel de actividad habitual</label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "sedentario", icon: Flame, label: "Sedentario" },
                      { key: "deportista", icon: Dumbbell, label: "Deportista" }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          const cleanCustomVars = (draft.customVariables || []).filter(v => v.key !== "activityLevel");
                          updateDraft({
                            activityLevel: item.key as any,
                            customVariables: cleanCustomVars
                          });
                        }}
                        className={cn(
                          "h-14 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all",
                          draft.activityLevel === item.key
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200"
                            : "bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100"
                        )}
                      >
                        <item.icon className={cn("w-4 h-4", draft.activityLevel === item.key ? "text-white" : "text-slate-400")} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Gallery-style Extra Info */}
        <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Información Extra</h2>
              <p className="text-sm text-slate-500 font-medium">Detalles sobre el comportamiento, gustos y observaciones clÃ­nicas del paciente.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Gustos y Preferencias</label>
              </div>
              <textarea
                className="w-full h-40 rounded-3xl bg-slate-50 border border-slate-200 p-6 text-sm font-semibold text-slate-700 resize-none focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-300"
                placeholder="Ej: Prefiere comidas calientes, le encanta el chocolate amargo, no tolera el sabor de la stevia..."
                value={draft.likes || ""}
                onChange={(e) => updateDraft({ likes: e.target.value })}
              />
            </div>

            <div className="group space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Observaciones ClÃ­nicas (Persona)</label>
              </div>
              <textarea
                className="w-full h-40 rounded-3xl bg-slate-50 border border-slate-200 p-6 text-sm font-semibold text-slate-700 resize-none focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-slate-300"
                placeholder="Ej: Es ansiosa con los dulces por la tarde, estÃ¡ muy motivada con el cambio, tiene poco apoyo familiar..."
                value={draft.clinicalSummary || ""}
                onChange={(e) => updateDraft({ clinicalSummary: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleConfirmSave}
        title={draft.id ? "Â¿Actualizar Expediente?" : "Â¿Crear Ficha ClÃ­nica?"}
        description={draft.id ? `Se guardarÃ¡n los cambios permanentes en el expediente de ${draft.fullName}.` : `EstÃ¡s a punto de registrar a ${draft.fullName}. Esto habilitarÃ¡ la creaciÃ³n de planes nutricionales.`}
        confirmText="Confirmar"
        variant="primary"
      />

      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => { clearDraft(); toast.info("Formulario reiniciado."); setShowResetConfirm(false); }}
        title="Â¿Reiniciar Formulario?"
        description="Toda la informaciÃ³n ingresada en este borrador se eliminarÃ¡ permanentemente. Â¿Deseas continuar?"
        confirmText="Vaciar Todo"
        variant="destructive"
      />
    </div>
  );
}




