"use client";

import { useState } from "react";
import {
  Sparkles,
  X,
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
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import {
  matchPublicNutritionists,
  type MatchNutritionistsResponse,
} from "@/lib/public-nutritionists";

interface NutriMatchWizardProps {
  isOpen: boolean;
  onClose: () => void;
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
    badge: "Alto rendimiento",
    color: "from-amber-500/10 to-yellow-500/10 text-amber-600 border-amber-200",
  },
  {
    id: "digestivo",
    title: "Salud Digestiva & Colon",
    desc: "Colon irritable, protocolo FODMAP, SIBO, reflujo e inflamación.",
    icon: Heart,
    badge: "Clínico",
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200",
  },
  {
    id: "clinico",
    title: "Manejo de Patologías",
    desc: "Diabetes, resistencia a la insulina, hipertensión, tiroides y salud cardiovascular.",
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
    title: "Maternidad & Nutrición Infantil",
    desc: "Embarazo, lactancia materna, BLW y nutrición en niños y adolescentes.",
    icon: Baby,
    badge: "Familiar",
    color: "from-purple-500/10 to-pink-500/10 text-purple-600 border-purple-200",
  },
];

const MODES = [
  {
    id: "online",
    title: "100% Online",
    desc: "Atención por videollamada desde la comodidad de tu casa o trabajo.",
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
    title: "Me da igual / Ambas opciones",
    desc: "El profesional que mejor se ajuste a mi meta, online o presencial.",
    icon: Sparkles,
  },
];

const TIME_PREFERENCES = [
  {
    id: "morning",
    title: "Mañanas",
    desc: "Franja de 08:00 a 13:00 hrs",
    emoji: "☀️",
  },
  {
    id: "afternoon",
    title: "Tardes",
    desc: "Franja de 13:00 a 20:00 hrs",
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
    desc: "Tengo flexibilidad horaria",
    emoji: "✨",
  },
];

const INSURANCES = [
  { id: "isapre", label: "Isapre (Reembolso)" },
  { id: "fonasa", label: "Fonasa" },
  { id: "particular", label: "Particular" },
];

export default function NutriMatchWizard({
  isOpen,
  onClose,
  onMatchComplete,
}: NutriMatchWizardProps) {
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

  if (!isOpen) return null;

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

    // If smart search is on, simulate the AI Agent reasoning steps for rich UX
    if (formData.smartSearch) {
      setAgentPhase("Inicializando Agente NutriNet...");
      await new Promise((r) => setTimeout(r, 650));
      setAgentPhase("Analizando especialidades, enfoque clínico y reseñas...");
      await new Promise((r) => setTimeout(r, 750));
      setAgentPhase("Cruzando disponibilidad de agendas y horarios...");
      await new Promise((r) => setTimeout(r, 600));
      setAgentPhase("¡Seleccionando los 3 mejores perfiles para ti!");
      await new Promise((r) => setTimeout(r, 450));
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
      onClose();
    } catch (err) {
      toast.error("Ocurrió un error al buscar tu match. Inténtalo nuevamente.");
    } finally {
      setIsSearching(false);
      setAgentPhase("");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#a88aed] to-[#8f70d8] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                NutriMatch
              </h3>
              <p className="text-[11px] font-semibold text-slate-500">
                Paso {step} de {totalSteps}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* OMITIR BUTTON: ALWAYS VISIBLE AND PROMINENT */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNext(true)}
              className="rounded-full text-xs font-bold text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-100 cursor-pointer h-8 px-3"
            >
              Omitir paso
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-gradient-to-r from-[#a88aed] to-[#7f5fd6] h-1.5 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Smart Search Toggle Bar */}
        <div className="px-5 py-2.5 bg-gradient-to-r from-violet-50 to-indigo-50/60 border-b border-indigo-100/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-[#8f70d8]" />
            <div>
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                Búsqueda Inteligente (Agente IA)
                <span className="text-[10px] bg-[#a88aed] text-white px-1.5 py-0.2 rounded-full font-bold">
                  BETA
                </span>
              </span>
              <p className="text-[10px] text-slate-500">
                Se demora un poco más, pero un agente buscará según tus
                especificaciones.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.smartSearch}
              onChange={(e) =>
                setFormData({ ...formData, smartSearch: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#a88aed]"></div>
          </label>
        </div>

        {/* Custom notes for Smart Agent if enabled */}
        {formData.smartSearch && (
          <div className="px-5 py-3 bg-violet-50/40 border-b border-violet-100/80 animate-in fade-in duration-200">
            <label className="text-xs font-bold text-violet-900 block mb-1">
              Indicaciones especiales para el Agente (opcional):
            </label>
            <Input
              placeholder="Ej. 'Busco alguien empático con experiencia en vegetarianos y atletas de crossfit'..."
              value={formData.smartNotes}
              onChange={(e) =>
                setFormData({ ...formData, smartNotes: e.target.value })
              }
              className="h-10 text-xs rounded-xl border-violet-200 bg-white"
            />
          </div>
        )}

        {/* Wizard Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {isSearching ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-[#a88aed]/10 flex items-center justify-center text-[#a88aed] animate-pulse">
                  <Bot className="h-8 w-8" />
                </div>
                <Loader2 className="h-6 w-6 text-[#a88aed] animate-spin absolute -bottom-1 -right-1" />
              </div>
              <h4 className="text-lg font-black text-slate-900">
                {agentPhase || "Buscando tus mejores matches..."}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Estamos procesando perfiles verificados y disponibilidad real en
                la base de datos para entregarte las 3 mejores opciones.
              </p>
            </div>
          ) : (
            <>
              {/* STEP 1: OBJETIVO */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="text-center sm:text-left">
                    <h4 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      ¿Cuál es tu principal objetivo de salud o nutrición?
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Selecciona una meta para que el algoritmo priorice a los
                      especialistas con mayor experiencia en tu caso.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {GOALS.map((goal) => {
                      const isSelected = formData.goal === goal.id;
                      const Icon = goal.icon;
                      return (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, goal: goal.id });
                          }}
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
                            <h5 className="font-extrabold text-sm text-slate-900">
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

              {/* STEP 2: MODALIDAD */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="text-center sm:text-left">
                    <h4 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      ¿Cómo prefieres realizar tu consulta?
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Elige la modalidad que mejor se adapte a tu rutina.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-2">
                    {MODES.map((mode) => {
                      const isSelected = formData.mode === mode.id;
                      const Icon = mode.icon;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, mode: mode.id });
                          }}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-[#a88aed]/10 border-[#8f70d8] shadow-sm ring-2 ring-[#a88aed]/30"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <span className="h-11 w-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                              <Icon className="h-5 w-5 text-[#8f70d8]" />
                            </span>
                            <div>
                              <h5 className="font-extrabold text-sm text-slate-900">
                                {mode.title}
                              </h5>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {mode.desc}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="h-6 w-6 bg-[#a88aed] text-white rounded-full flex items-center justify-center shrink-0">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {formData.mode === "presencial" && (
                    <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in duration-200 space-y-2">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-[#a88aed]" />
                        ¿En qué comuna o ciudad buscas atención?
                      </label>
                      <Input
                        placeholder="Ej. Providencia, Santiago Centro, Las Condes, Viña del Mar..."
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="bg-white rounded-xl text-sm"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[
                          "Santiago",
                          "Providencia",
                          "Las Condes",
                          "Ñuñoa",
                          "Viña del Mar",
                          "Concepción",
                        ].map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, location: city })
                            }
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: HORARIOS */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="text-center sm:text-left">
                    <h4 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      ¿En qué horarios te acomoda más atenderte?
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Filtraremos a los profesionales con disponibilidad en tu
                      franja horaria preferida.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {TIME_PREFERENCES.map((time) => {
                      const isSelected = formData.timePreference === time.id;
                      return (
                        <button
                          key={time.id}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              timePreference: time.id,
                            });
                          }}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-[#a88aed]/10 border-[#8f70d8] shadow-sm ring-2 ring-[#a88aed]/30"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{time.emoji}</span>
                            <div>
                              <h5 className="font-extrabold text-sm text-slate-900">
                                {time.title}
                              </h5>
                              <p className="text-xs text-slate-500">
                                {time.desc}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="h-6 w-6 bg-[#a88aed] text-white rounded-full flex items-center justify-center shrink-0">
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: PREVISIÓN & RESUMEN */}
              {step === 4 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="text-center sm:text-left">
                    <h4 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      Previsión o modalidad de pago (opcional)
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Si buscas nutricionistas con opción de boleta para
                      reembolso en Isapre o Fonasa, indícalo aquí.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-1">
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

                  {/* Resumen del Match */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black uppercase text-[#8f70d8] tracking-wider">
                      Resumen de tu búsqueda
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          Objetivo:
                        </span>
                        <strong className="text-slate-800">
                          {GOALS.find((g) => g.id === formData.goal)?.title ||
                            "Cualquiera (Omitido)"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          Modalidad:
                        </span>
                        <strong className="text-slate-800">
                          {MODES.find((m) => m.id === formData.mode)?.title ||
                            "Indiferente (Omitido)"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          Horario:
                        </span>
                        <strong className="text-slate-800">
                          {TIME_PREFERENCES.find(
                            (t) => t.id === formData.timePreference,
                          )?.title || "Flexible (Omitido)"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          Búsqueda IA:
                        </span>
                        <strong className="text-slate-800">
                          {formData.smartSearch ? "Activada ✨" : "Estándar"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isSearching && (
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <div>
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="rounded-xl text-xs font-bold text-slate-600 border-slate-200 cursor-pointer h-10 px-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
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
                className="rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer h-10 px-3"
              >
                Omitir
              </Button>

              <Button
                onClick={() => handleNext(false)}
                className="rounded-xl px-6 h-10 bg-gradient-to-r from-[#a88aed] to-[#8f70d8] hover:from-[#9b78ea] hover:to-[#7f5fd6] text-white font-extrabold text-xs shadow-md shadow-[#a88aed]/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{step === totalSteps ? "Hacer Match Ahora" : "Continuar"}</span>
                {step === totalSteps ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

