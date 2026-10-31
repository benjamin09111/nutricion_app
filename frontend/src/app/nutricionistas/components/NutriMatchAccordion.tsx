"use client";

import { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Check,
  Target,
  Zap,
  Heart,
  Activity,
  Leaf,
  Baby,
  Monitor,
  MapPin,
  Clock,
  ShieldCheck,
  Bot,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import {
  matchPublicNutritionists,
  type MatchNutritionistsResponse,
} from "@/lib/public-nutritionists";

interface NutriMatchAccordionProps {
  isOpen: boolean;
  onToggle: () => void;
  onMatchComplete: (response: MatchNutritionistsResponse) => void;
}

const GOALS = [
  {
    id: "peso",
    title: "Pérdida de Grasa & Peso",
    desc: "Déficit calórico saludable, recomposición corporal y hábitos sostenibles.",
    icon: Target,
    badge: "Popular",
    color: "from-rose-500/10 to-orange-500/10 text-rose-600 border-rose-200",
  },
  {
    id: "deporte",
    title: "Nutrición Deportiva & Músculo",
    desc: "Rendimiento físico, aumento de masa muscular y suplementación.",
    icon: Zap,
    badge: "Rendimiento",
    color: "from-amber-500/10 to-yellow-500/10 text-amber-600 border-amber-200",
  },
  {
    id: "digestivo",
    title: "Salud Digestiva & Colon",
    desc: "Colon irritable, protocolo FODMAP, SIBO, reflujo e hinchazón.",
    icon: Heart,
    badge: "Clínico",
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200",
  },
  {
    id: "clinico",
    title: "Manejo de Patologías",
    desc: "Diabetes, resistencia a la insulina, hipertensión y salud tiroidea.",
    icon: Activity,
    badge: "Especializado",
    color: "from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-200",
  },
  {
    id: "vegetariano",
    title: "Alimentación Vegetal / Vegana",
    desc: "Transición nutricional segura, balance de micronutrientes y B12.",
    icon: Leaf,
    badge: "Plant-based",
    color: "from-green-500/10 to-emerald-500/10 text-green-600 border-green-200",
  },
  {
    id: "maternidad",
    title: "Maternidad & Infantil",
    desc: "Embarazo, lactancia materna, BLW y nutrición en niños.",
    icon: Baby,
    badge: "Familiar",
    color: "from-purple-500/10 to-pink-500/10 text-purple-600 border-purple-200",
  },
];

const MODES = [
  {
    id: "online",
    title: "100% Online",
    desc: "Atención por videollamada desde cualquier lugar.",
    icon: Monitor,
  },
  {
    id: "presencial",
    title: "Presencial en Consulta",
    desc: "Mediciones corporales y evaluación presencial en box clínico.",
    icon: MapPin,
  },
  {
    id: "indifferent",
    title: "Me da igual / Ambas",
    desc: "El profesional que mejor se ajuste a mi meta.",
    icon: Sparkles,
  },
];

const TIME_PREFERENCES = [
  {
    id: "morning",
    title: "Mañanas",
    desc: "08:00 a 13:00 hrs",
    emoji: "☀️",
  },
  {
    id: "afternoon",
    title: "Tardes",
    desc: "13:00 a 20:00 hrs",
    emoji: "🌆",
  },
  {
    id: "weekend",
    title: "Fines de Semana",
    desc: "Sábados o Domingos",
    emoji: "📅",
  },
  {
    id: "flexible",
    title: "Cualquier Horario",
    desc: "Tengo flexibilidad",
    emoji: "✨",
  },
];

const INSURANCES = [
  { id: "isapre", label: "Isapre (Reembolso)" },
  { id: "fonasa", label: "Fonasa" },
  { id: "particular", label: "Particular" },
];

export default function NutriMatchAccordion({
  isOpen,
  onToggle,
  onMatchComplete,
}: NutriMatchAccordionProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    goal: "",
    mode: "",
    location: "",
    timePreference: "",
    insurance: "",
    smartSearch: false,
    smartNotes: "",
  });

  const [isSearching, setIsSearching] = useState(false);
  const [agentPhase, setAgentPhase] = useState("");

  const handleNext = (skipCurrent = false) => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    } else {
      executeMatch();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const executeMatch = async () => {
    setIsSearching(true);

    if (formData.smartSearch) {
      setAgentPhase("Iniciando Agente NutriNet...");
      await new Promise((r) => setTimeout(r, 600));
      setAgentPhase("Analizando especialidades y enfoque clínico...");
      await new Promise((r) => setTimeout(r, 700));
      setAgentPhase("Cruzando disponibilidad de horarios...");
      await new Promise((r) => setTimeout(r, 500));
      setAgentPhase("¡Seleccionando tus 3 mejores perfiles!");
      await new Promise((r) => setTimeout(r, 400));
    }

    try {
      const result = await matchPublicNutritionists({
        goal: formData.goal || undefined,
        mode: formData.mode || undefined,
        location: formData.location.trim() || undefined,
        timePreference: formData.timePreference || undefined,
        insurance: formData.insurance || undefined,
        smartSearch: formData.smartSearch,
        smartNotes: formData.smartNotes.trim() || undefined,
      });

      onMatchComplete(result);
    } catch (err) {
      toast.error("Ocurrió un error al buscar tu match. Inténtalo nuevamente.");
    } finally {
      setIsSearching(false);
      setAgentPhase("");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border-2 border-[#a88aed]/30 bg-white shadow-lg shadow-[#a88aed]/5 overflow-hidden transition-all duration-300">
      {/* Accordion Trigger Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-violet-50/90 via-purple-50/50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-start sm:items-center gap-3.5 text-left cursor-pointer flex-1 group"
        >
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#a88aed] to-[#8f70d8] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#a88aed]/30 group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5 text-yellow-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#a88aed]/20 text-[#7f5fd6]">
                Asistente Opcional
              </span>
              {isOpen && (
                <span className="text-[11px] font-bold text-slate-500">
                  Paso {step} de {totalSteps}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight group-hover:text-[#a88aed] transition-colors">
              Encontrar mi nutricionista con NutriMatch
            </h3>
            <p className="text-xs text-slate-500">
              Responde 3 preguntas guiadas si prefieres que te recomendemos los 3 mejores perfiles.
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button
            type="button"
            onClick={onToggle}
            className={`rounded-xl px-4 h-9 font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 ${
              isOpen
                ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                : "bg-gradient-to-r from-[#a88aed] to-[#8f70d8] hover:from-[#9c78ea] hover:to-[#7f5fd6] text-white shadow-[#a88aed]/20"
            }`}
          >
            {isOpen ? (
              <>
                <X className="h-3.5 w-3.5" />
                <span>Cerrar asistente</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Abrir asistente</span>
              </>
            )}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {/* Accordion Content Panel (Inline) */}
      {isOpen && (
        <div className="border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-300">
          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-1.5">
            <div
              className="bg-gradient-to-r from-[#a88aed] to-[#7f5fd6] h-1.5 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          {/* Smart Search IA Switch Bar */}
          <div className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-violet-50/80 to-indigo-50/40 border-b border-indigo-100/60 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-lg bg-[#a88aed]/20 text-[#8f70d8] flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  Búsqueda Inteligente (Agente IA)
                  <span className="text-[10px] bg-[#a88aed] text-white px-1.5 py-0.2 rounded-full font-bold">
                    BETA
                  </span>
                </span>
                <p className="text-[11px] text-slate-500">
                  Se demora un poco más, pero un agente buscará según tus especificaciones.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.smartSearch}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      smartSearch: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#a88aed]"></div>
              </label>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNext(true)}
                className="rounded-xl text-xs font-bold text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-100 h-8 px-3 cursor-pointer"
              >
                Omitir paso
              </Button>
            </div>
          </div>

          {/* Smart Notes input if Smart Search is active */}
          {formData.smartSearch && (
            <div className="px-5 sm:px-6 py-3 bg-violet-50/50 border-b border-violet-100 animate-in fade-in duration-200 space-y-1">
              <label className="text-xs font-bold text-violet-900 block">
                Indicaciones adicionales para el Agente (opcional):
              </label>
              <Input
                placeholder="Ej. 'Busco especialista empático con experiencia en vegetarianismo y crossfit'..."
                value={formData.smartNotes}
                onChange={(e) =>
                  setFormData({ ...formData, smartNotes: e.target.value })
                }
                className="h-10 text-xs rounded-xl border-violet-200 bg-white"
              />
            </div>
          )}

          {/* Wizard Steps */}
          <div className="p-5 sm:p-7">
            {isSearching ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-[#a88aed]/15 flex items-center justify-center text-[#a88aed] animate-pulse">
                    <Bot className="h-8 w-8" />
                  </div>
                  <Loader2 className="h-6 w-6 text-[#a88aed] animate-spin absolute -bottom-1 -right-1" />
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  {agentPhase || "Buscando tus mejores matches..."}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Procesando perfiles en base de datos para entregarte las 3 mejores opciones.
                </p>
              </div>
            ) : (
              <>
                {/* STEP 1 */}
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                        1. ¿Cuál es tu meta principal de salud o nutrición?
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Selecciona tu objetivo para priorizar especialistas con experiencia en tu caso.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      {GOALS.map((goal) => {
                        const isSelected = formData.goal === goal.id;
                        const Icon = goal.icon;
                        return (
                          <button
                            key={goal.id}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, goal: goal.id })
                            }
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                              isSelected
                                ? "bg-[#a88aed]/10 border-[#8f70d8] shadow-sm ring-2 ring-[#a88aed]/30"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span
                                className={`p-2 rounded-xl border ${goal.color}`}
                              >
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {goal.badge}
                              </span>
                            </div>
                            <div>
                              <h5 className="font-extrabold text-xs sm:text-sm text-slate-900">
                                {goal.title}
                              </h5>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                {goal.desc}
                              </p>
                            </div>
                            {isSelected && (
                              <span className="absolute top-2.5 right-2.5 h-5 w-5 bg-[#a88aed] text-white rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                        2. ¿Cómo prefieres atenderte?
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Elige la modalidad que más te acomode.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {MODES.map((mode) => {
                        const isSelected = formData.mode === mode.id;
                        const Icon = mode.icon;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, mode: mode.id })
                            }
                            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? "bg-[#a88aed]/10 border-[#8f70d8] shadow-sm ring-2 ring-[#a88aed]/30"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#8f70d8]">
                                <Icon className="h-5 w-5" />
                              </span>
                              {isSelected && (
                                <span className="h-5 w-5 bg-[#a88aed] text-white rounded-full flex items-center justify-center">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            <div>
                              <h5 className="font-extrabold text-xs sm:text-sm text-slate-900">
                                {mode.title}
                              </h5>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {mode.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {formData.mode === "presencial" && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-[#a88aed]" />
                          ¿En qué comuna o ciudad buscas consulta?
                        </label>
                        <Input
                          placeholder="Ej. Providencia, Santiago, Las Condes, Viña del Mar..."
                          value={formData.location}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location: e.target.value,
                            })
                          }
                          className="bg-white rounded-xl text-xs h-10"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                        3. ¿En qué horario te acomoda más?
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Priorizaremos a los nutricionistas con disponibilidad en tu franja preferida.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {TIME_PREFERENCES.map((time) => {
                        const isSelected = formData.timePreference === time.id;
                        return (
                          <button
                            key={time.id}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                timePreference: time.id,
                              })
                            }
                            className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                              isSelected
                                ? "bg-[#a88aed]/10 border-[#8f70d8] shadow-sm ring-2 ring-[#a88aed]/30"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-2xl mb-1.5">{time.emoji}</span>
                            <h5 className="font-extrabold text-xs text-slate-900">
                              {time.title}
                            </h5>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {time.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 4 */}
                {step === 4 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                        4. Previsión o modalidad de pago (opcional)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Si buscas profesionales con boleta para reembolso en Isapre o Fonasa:
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-1">
                      {INSURANCES.map((ins) => {
                        const isSelected = formData.insurance === ins.id;
                        return (
                          <button
                            key={ins.id}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                insurance: isSelected ? "" : ins.id,
                              })
                            }
                            className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#a88aed] text-white border-[#8f70d8] font-bold shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <p className="text-xs font-bold">{ins.label}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
                      <span>
                        Objetivo:{" "}
                        <strong className="text-slate-900">
                          {GOALS.find((g) => g.id === formData.goal)?.title ||
                            "Cualquiera"}
                        </strong>
                      </span>
                      <span>
                        Modalidad:{" "}
                        <strong className="text-slate-900">
                          {MODES.find((m) => m.id === formData.mode)?.title ||
                            "Indiferente"}
                        </strong>
                      </span>
                      <span>
                        Horario:{" "}
                        <strong className="text-slate-900">
                          {TIME_PREFERENCES.find(
                            (t) => t.id === formData.timePreference,
                          )?.title || "Flexible"}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          {!isSearching && (
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
              <div>
                {step > 1 ? (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="rounded-xl text-xs font-bold text-slate-600 border-slate-200 h-9 px-3 cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    Atrás
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleNext(true)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    Omitir todo y buscar
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => handleNext(true)}
                  className="rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 h-9 px-3 cursor-pointer"
                >
                  Omitir paso
                </Button>

                <Button
                  onClick={() => handleNext(false)}
                  className="rounded-xl px-5 h-9 bg-gradient-to-r from-[#a88aed] to-[#8f70d8] hover:from-[#9c78ea] hover:to-[#7f5fd6] text-white font-extrabold text-xs shadow-md shadow-[#a88aed]/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>
                    {step === totalSteps ? "Hacer Match Ahora" : "Continuar"}
                  </span>
                  {step === totalSteps ? (
                    <Sparkles className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
