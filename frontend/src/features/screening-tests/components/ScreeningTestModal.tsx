"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Save, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { useSubscription } from "@/context/SubscriptionContext";

import { getTestDefinition } from "../definitions";
import { calculateTestResult, buildDefaultAnswers } from "../utils/scoring";
import { autoFillAnswers } from "../utils/auto-fill";
import type {
  ScreeningTestType,
  ScreeningTestAnswers,
  ScreeningTestResult,
  PatientAutoFillData,
  ScreeningTestCreationContent,
} from "../types";

interface ScreeningTestModalProps {
  isOpen: boolean;
  testType: ScreeningTestType;
  onClose: () => void;
  /** Patient data for auto-fill. Null = anonymous test from Calculator */
  patientData?: PatientAutoFillData | null;
  /** Called after successful save */
  onSaved?: () => void;
}

export function ScreeningTestModal({
  isOpen,
  testType,
  onClose,
  patientData,
  onSaved,
}: ScreeningTestModalProps) {
  const definition = getTestDefinition(testType);

  const [answers, setAnswers] = useState<ScreeningTestAnswers>({});
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [patientName, setPatientName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [savedTestsCount, setSavedTestsCount] = useState<number | null>(null);
  const { limit, plan, isLoading: isSubscriptionLoading } = useSubscription();
  const configuredTestLimit = limit("screening_tests.saved.limit");
  const testLimit = plan === "free" && configuredTestLimit === 0 ? 2 : configuredTestLimit;
  const isTestLimitReached =
    Number.isFinite(testLimit) &&
    savedTestsCount !== null &&
    savedTestsCount >= testLimit;

  // Initialize answers when modal opens or test type changes
  useEffect(() => {
    if (!isOpen || !definition) return;

    const defaults = buildDefaultAnswers(definition);

    if (patientData) {
      const { answers: filled, filledFields } = autoFillAnswers(definition, patientData);
      setAnswers({ ...defaults, ...(filled as ScreeningTestAnswers) });
      setAutoFilledFields(filledFields);
      setPatientName(patientData.fullName || "");
    } else {
      setAnswers(defaults);
      setAutoFilledFields([]);
      setPatientName("");
    }
    setShowSaveForm(false);
  }, [isOpen, testType, definition, patientData]);

  useEffect(() => {
    if (!isOpen || isSubscriptionLoading || !Number.isFinite(testLimit)) return;

    let isCancelled = false;
    const fetchSavedTestsCount = async () => {
      try {
        const response = await fetchApi("/creations?type=SCREENING_TEST");
        if (!response.ok || isCancelled) return;

        const tests = await response.json();
        if (!isCancelled) setSavedTestsCount(Array.isArray(tests) ? tests.length : 0);
      } catch {
        if (!isCancelled) setSavedTestsCount(null);
      }
    };

    fetchSavedTestsCount();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, isSubscriptionLoading, testLimit]);

  // Calculate result in real-time
  const result: ScreeningTestResult | null = useMemo(() => {
    if (!definition || Object.keys(answers).length === 0) return null;
    return calculateTestResult(definition, answers);
  }, [definition, answers]);

  if (!isOpen || !definition || !result) return null;

  const updateAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSave = async () => {
    if (!definition || !result) return;

    if (isTestLimitReached) {
      toast.error(`Alcanzaste el límite de ${testLimit} tests guardados de tu plan.`);
      window.dispatchEvent(
        new CustomEvent("show-freemium-upgrade", {
          detail: { feature: "Tests de tamizaje nutricional" },
        }),
      );
      return;
    }

    setIsSaving(true);
    try {
      const content: ScreeningTestCreationContent = {
        testType: definition.type,
        version: "1.0",
        patientId: patientData?.id || null,
        patientName: patientName.trim() || "Sin nombre",
        answers,
        scores: result.scores,
        result: {
          total: result.total,
          category: result.category,
          color: result.color,
          isAlert: result.isAlert,
          recommendation: result.recommendation,
        },
        autoFilledFields,
        appliedAt: new Date().toISOString(),
      };

      const response = await fetchApi("/creations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${definition.shortName} — ${patientName.trim() || "Sin nombre"}`,
          type: "SCREENING_TEST",
          content,
          metadata: {
            patientName: patientName.trim() || "Sin nombre",
            patientId: patientData?.id || null,
            testType: definition.type,
            testShortName: definition.shortName,
            totalScore: result.total,
            category: result.category,
            color: result.color,
          },
          tags: ["tamizaje", definition.shortName.toLowerCase()],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error((err as any)?.message || "Error al guardar el test");
      }

      const data = await response.json();
      if (data.wasCreated === false) {
        toast.info("Este test ya fue guardado anteriormente con los mismos resultados.");
      } else {
        toast.success(`Test ${definition.shortName} guardado correctamente`);
      }

      onSaved?.();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Error al guardar el test");
    } finally {
      setIsSaving(false);
    }
  };

  const isAtalah = definition.type === "ATALAH";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900">{definition.name}</h2>
            <p className="text-xs text-slate-500 mt-1">{definition.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Result Summary Card */}
          <div
            className="p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
            style={{
              backgroundColor: `${result.color}10`,
              borderColor: `${result.color}40`,
            }}
          >
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                {isAtalah ? "Clasificación Nutricional" : "Puntaje Total Calculado"}
              </span>
              <div className="flex items-center gap-3">
                {!isAtalah && (
                  <span className="text-3xl font-black text-slate-900">
                    {result.total}{" "}
                    <span className="text-sm font-normal text-slate-400">
                      / {definition.maxScore} pts
                    </span>
                  </span>
                )}
                <span
                  className="px-3 py-1 rounded-full text-xs font-black uppercase text-white shadow-sm"
                  style={{ backgroundColor: result.color }}
                >
                  {result.category}
                </span>
              </div>
              {!isAtalah && (
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  {Object.entries(result.scores).map(([name, score]) => (
                    <span key={name}>
                      {name}: <strong>{score} pts</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {result.isAlert && (
              <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase">Alerta clínica</span>
              </div>
            )}
          </div>

          {/* Auto-fill notice */}
          {autoFilledFields.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-[11px] text-indigo-700">
                <strong>{autoFilledFields.length} campo{autoFilledFields.length > 1 ? "s" : ""}</strong>{" "}
                pre-rellenado{autoFilledFields.length > 1 ? "s" : ""} con datos del paciente. Puedes modificarlos si es necesario.
              </span>
            </div>
          )}

          {/* Sections with questions */}
          {definition.sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 border-b border-indigo-100 pb-1">
                {section.title} (Máx. {section.maxPoints} puntos)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.questions.map((question) => {
                  const isAutoFilled = autoFilledFields.includes(question.id);
                  const currentValue = answers[question.id] ?? question.defaultValue;

                  // For Atalah GEST_WEEK, render a number input instead of select
                  if (definition.type === "ATALAH" && question.id === "GEST_WEEK") {
                    return (
                      <div
                        key={question.id}
                        className={cn(
                          "p-3.5 rounded-xl border space-y-1.5",
                          isAutoFilled
                            ? "bg-indigo-50/50 border-indigo-200"
                            : "bg-slate-50/70 border-slate-150",
                        )}
                      >
                        <label className="font-bold text-slate-800 flex items-center gap-1.5">
                          {question.id}. {question.label}
                          {isAutoFilled && (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                        </label>
                        <Input
                          type="number"
                          min={6}
                          max={40}
                          value={currentValue}
                          onChange={(e) =>
                            updateAnswer(question.id, Number(e.target.value))
                          }
                          className="h-8 rounded-lg text-xs font-medium"
                        />
                      </div>
                    );
                  }

                  // For Atalah GEST_BMI, render a number input
                  if (definition.type === "ATALAH" && question.id === "GEST_BMI") {
                    return (
                      <div
                        key={question.id}
                        className={cn(
                          "p-3.5 rounded-xl border space-y-1.5",
                          isAutoFilled
                            ? "bg-indigo-50/50 border-indigo-200"
                            : "bg-slate-50/70 border-slate-150",
                        )}
                      >
                        <label className="font-bold text-slate-800 flex items-center gap-1.5">
                          {question.id}. {question.label}
                          {isAutoFilled && (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                        </label>
                        <Input
                          type="number"
                          min={12}
                          max={50}
                          step={0.1}
                          value={currentValue}
                          onChange={(e) =>
                            updateAnswer(question.id, Number(e.target.value))
                          }
                          className="h-8 rounded-lg text-xs font-medium"
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={question.id}
                      className={cn(
                        "p-3.5 rounded-xl border space-y-1.5",
                        isAutoFilled
                          ? "bg-indigo-50/50 border-indigo-200"
                          : "bg-slate-50/70 border-slate-150",
                      )}
                    >
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        {question.id}. {question.label}
                        {isAutoFilled && (
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        )}
                      </label>
                      <select
                        value={currentValue}
                        onChange={(e) =>
                          updateAnswer(question.id, Number(e.target.value))
                        }
                        className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                      >
                        {question.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Recommendation */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Recomendación Clínica
            </span>
            <p className="text-xs text-slate-700">{result.recommendation}</p>
          </div>

          {/* Save Form (expandable) */}
          {showSaveForm && (
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-bold text-slate-700">
                Nombre del paciente para el registro
              </label>
              <Input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Sin nombre"
                className="h-9 rounded-xl text-xs"
              />
              <p className="text-[10px] text-slate-500">
                Si dejas el campo vacío, se guardará como &quot;Sin nombre&quot;.
              </p>
            </div>
          )}
          {isTestLimitReached && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-medium text-amber-800">
              Alcanzaste el límite de {testLimit} tests guardados de tu plan. Mejora tu plan para guardar uno nuevo.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
            Cancelar
          </Button>
          <div className="flex items-center gap-2">
            {!showSaveForm ? (
              <Button
                onClick={() => setShowSaveForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Guardar
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isSaving || isTestLimitReached}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Confirmar Guardado
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
