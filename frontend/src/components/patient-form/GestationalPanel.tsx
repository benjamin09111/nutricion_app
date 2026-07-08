import React from "react";
import { Baby, Scale, TrendingUp, AlertCircle, AlertTriangle, Calculator, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface GestationalPanelProps {
  currentBMI: number;
  gestationalWeek: number;
  classification: string;
  preGestationalWeight?: number;
  currentWeight: number;
  gainedKg?: number;
  preGestationalIMC?: number;
  preGestationalStatus?: string;
  recommendedTotalMin?: number;
  recommendedTotalMax?: number;
  weeklyGainMin?: number;
  weeklyGainMax?: number;
  weeklyGainNote?: string;
  trimesterLabel: string;
  extraKcalMin: number;
  extraKcalMax: number;
  getBaseKcal: number;
  finalCalories: number;
  macros: { label: string; value: number; unit: string; color: string }[];
  pregnancyType?: string;
  proteinPerKg?: number;
  className?: string;
}

function MetricItem({ label, value, unit, sub }: { label: string; value: string | number; unit?: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-emerald-100 last:border-0">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <div className="text-right">
        <span className="text-sm font-black text-slate-900">
          {value}
          {unit && <span className="text-[10px] font-medium text-slate-400 ml-0.5">{unit}</span>}
        </span>
        {sub && <p className="text-[9px] text-slate-400 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

function classificationBadgeStyle(classification?: string) {
  if (!classification) return "text-slate-500 bg-slate-50 border border-slate-200";
  if (classification.includes("Obesidad")) return "text-rose-700 bg-rose-50 border border-rose-200";
  if (classification.includes("Sobrepeso")) return "text-amber-700 bg-amber-50 border border-amber-200";
  if (classification === "Normal" || classification === "Normopeso") return "text-emerald-700 bg-emerald-50 border border-emerald-200";
  return "text-sky-700 bg-sky-50 border border-sky-200";
}

export function GestationalPanel({
  currentBMI,
  gestationalWeek,
  classification,
  preGestationalWeight,
  currentWeight,
  gainedKg,
  preGestationalIMC,
  preGestationalStatus,
  recommendedTotalMin,
  recommendedTotalMax,
  weeklyGainMin,
  weeklyGainMax,
  weeklyGainNote,
  trimesterLabel,
  extraKcalMin,
  extraKcalMax,
  getBaseKcal,
  finalCalories,
  macros,
  pregnancyType,
  proteinPerKg,
  className,
}: GestationalPanelProps) {
  const isMultiple = pregnancyType === "multiple";
  const hasPregnancyWeightData =
    preGestationalWeight !== undefined &&
    gainedKg !== undefined &&
    preGestationalIMC !== undefined &&
    preGestationalStatus !== undefined;

  // Calculos adicionales si hay datos pregestacionales
  const minGainRemaining =
    hasPregnancyWeightData && recommendedTotalMin !== undefined
      ? Math.max(0, recommendedTotalMin - (gainedKg || 0))
      : undefined;
  const maxGainRemaining =
    hasPregnancyWeightData && recommendedTotalMax !== undefined
      ? Math.max(0, recommendedTotalMax - (gainedKg || 0))
      : undefined;

  // Alertas gestacionales
  const alerts: string[] = [];
  if (isMultiple) {
    alerts.push(
      "Embarazo múltiple: Los rangos de ganancia estándar (Atalah/MINSAL) no aplican directamente. Se requiere monitoreo especializado de ganancia ponderal.",
    );
  }
  if (gestationalWeek < 4) {
    alerts.push("Verificar edad gestacional ingresada (menos de 4 semanas).");
  } else if (gestationalWeek > 40 && gestationalWeek <= 42) {
    alerts.push("Embarazo a término o post-término, validar de inmediato con un profesional.");
  } else if (gestationalWeek > 42) {
    alerts.push("Alerta: Edad gestacional superior a 42 semanas. Revisar datos.");
  }

  if (hasPregnancyWeightData && gainedKg !== undefined) {
    if (gestationalWeek > 12 && gainedKg < 0) {
      alerts.push("Pérdida de peso detectada en el 2.º/3.er trimestre. Requiere supervisión clínica.");
    } else if (
      !isMultiple &&
      gestationalWeek > 14 &&
      weeklyGainMin !== undefined &&
      gainedKg < (gestationalWeek - 12) * weeklyGainMin
    ) {
      alerts.push("Ganancia de peso aparentemente baja para la semana gestacional actual.");
    } else if (!isMultiple && gestationalWeek > 14 && recommendedTotalMax !== undefined && gainedKg > recommendedTotalMax) {
      alerts.push("Ganancia de peso supera la recomendación total para término.");
    }
  }

  // Mínimos clínicos de macros gestacionales
  // Proteína: al menos 71g en 2do y 3er trimestre
  const isSecondOrThirdTrimester = trimesterLabel.includes("Segundo") || trimesterLabel.includes("Tercer");
  
  // Mapeamos macros formateando los valores clínicos mínimos
  const adjustedMacros = macros.map((m) => {
    if (m.label === "Proteína" && isSecondOrThirdTrimester) {
      return { ...m, value: Math.max(m.value, 71), note: m.value < 71 ? "Aumentado a mín. gestacional (71g)" : undefined };
    }
    if (m.label === "Carbohidratos") {
      return { ...m, value: Math.max(m.value, 175), note: m.value < 175 ? "Aumentado a mín. gestacional (175g)" : undefined };
    }
    return m;
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-1">
        <Baby className="w-5 h-5 text-emerald-600 animate-pulse" />
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Modo Gestante {hasPregnancyWeightData ? "Completo" : "Incompleto"}
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Evaluacion Gestacional */}
        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex flex-col justify-between">
          <div>
            <p className="text-xs text-emerald-700 font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Baby className="w-3.5 h-3.5" /> Evaluación Gestacional
            </p>
            <div className="space-y-1">
              <MetricItem label="IMC actual" value={currentBMI.toFixed(1)} unit="kg/m²" />
              <MetricItem label="Semana gestacional" value={`${gestationalWeek} semanas`} />
              <MetricItem label="Trimestre" value={trimesterLabel} />
              <div className="flex items-center justify-between py-1.5 border-b border-emerald-100/50 last:border-0">
                <span className="text-xs font-semibold text-slate-600">Clasificación gestacional</span>
                <span className={cn("text-xs font-black px-2.5 py-0.5 rounded-full", classificationBadgeStyle(classification))}>
                  {classification}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Estado Inicial Pregestacional */}
        <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex flex-col justify-between">
          <div>
            <p className="text-xs text-emerald-700 font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5" /> Estado Inicial Pregestacional
            </p>
            <div className="space-y-1">
              {hasPregnancyWeightData ? (
                <>
                  <MetricItem label="Peso pregestacional" value={preGestationalWeight!.toFixed(1)} unit="kg" />
                  <MetricItem label="IMC pregestacional" value={preGestationalIMC!.toFixed(1)} unit="kg/m²" />
                  <div className="flex items-center justify-between py-1.5 border-b border-emerald-100/50 last:border-0">
                    <span className="text-xs font-semibold text-slate-600">Clasificación inicial</span>
                    <span className={cn("text-xs font-black px-2.5 py-0.5 rounded-full", classificationBadgeStyle(preGestationalStatus))}>
                      {preGestationalStatus}
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-400 font-semibold">Peso pregestacional no registrado</p>
                  <p className="text-[10px] text-slate-400 mt-1">Registra este dato en el paso 1 para evaluar ganancia de peso.</p>
                </div>
              )}
              {pregnancyType && (
                <MetricItem label="Tipo de embarazo" value={isMultiple ? "Múltiple" : "Único"} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Ganancia de Peso */}
      <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
        <p className="text-xs text-emerald-700 font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wider">
          <Scale className="w-3.5 h-3.5" /> Monitoreo de Ganancia de Peso
        </p>
        {hasPregnancyWeightData ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              <div className="bg-white/80 rounded-lg p-2.5 text-center border border-emerald-100/50">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Ganancia Actual</p>
                <p className="text-lg font-black text-slate-900">
                  {gainedKg! >= 0 ? `+${gainedKg!.toFixed(1)}` : gainedKg!.toFixed(1)}
                  <span className="text-[10px] text-slate-400 ml-0.5">kg</span>
                </p>
              </div>
              <div className="bg-white/80 rounded-lg p-2.5 text-center border border-emerald-100/50">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Recomendado Total</p>
                <p className="text-lg font-black text-slate-900">
                  {isMultiple ? "N/A" : `${recommendedTotalMin}–${recommendedTotalMax}`}
                  <span className="text-[10px] text-slate-400 ml-0.5">kg</span>
                </p>
              </div>
              <div className="bg-white/80 rounded-lg p-2.5 text-center border border-emerald-100/50">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Ganancia Restante Estd.</p>
                <p className="text-lg font-black text-slate-900 text-indigo-700">
                  {isMultiple ? "N/A" : `${minGainRemaining!.toFixed(1)}–${maxGainRemaining!.toFixed(1)}`}
                  <span className="text-[10px] text-slate-400 ml-0.5">kg</span>
                </p>
              </div>
            </div>
            {!isMultiple && (
              <div className="text-[10px] text-slate-500 font-medium leading-relaxed bg-white/40 p-2.5 rounded-lg border border-emerald-100/30 space-y-1">
                <p>
                  <TrendingUp className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                  <strong>Ritmo recomendado:</strong> {weeklyGainNote}.
                </p>
                <p className="text-slate-400">
                  <strong>Referencia:</strong> MINSAL/Atalah Chile
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="py-4 text-center bg-white/40 rounded-lg border border-emerald-100/30">
            <p className="text-xs text-slate-500 font-bold">Falta peso pregestacional</p>
            <p className="text-[10px] text-slate-400">No es posible calcular curvas ni recomendaciones de ganancia de peso.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 4: GET con Ajuste Gestacional */}
        <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex flex-col justify-between">
          <div>
            <p className="text-xs text-indigo-700 font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5" /> Requerimiento Energético Gestacional
            </p>
            <div className="space-y-2 text-xs font-medium text-slate-600">
              <div className="flex justify-between py-1 border-b border-indigo-100/50">
                <span>GET Base (sin embarazo)</span>
                <span className="font-bold text-slate-900">{getBaseKcal} kcal/día</span>
              </div>
              <div className="flex justify-between py-1 border-b border-indigo-100/50">
                <span>Incremento ({trimesterLabel})</span>
                <span className="font-bold text-emerald-600">
                  {extraKcalMin === 0 ? "+0 kcal/día" : `+${extraKcalMin} a +${extraKcalMax} kcal/día`}
                </span>
              </div>
              <div className="flex justify-between py-1.5 bg-indigo-100/40 p-2 rounded-lg mt-2 text-indigo-900 font-bold">
                <span>Requerimiento Final Estimado</span>
                <span className="text-sm font-black">
                  {getBaseKcal + extraKcalMin}
                  {extraKcalMax > 0 ? `–${getBaseKcal + extraKcalMax}` : ""} kcal/día
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Macronutrientes */}
        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200">
          <p className="text-xs text-slate-600 font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5" /> Distribución de Macronutrientes
          </p>
          <div className="grid grid-cols-2 gap-2">
            {adjustedMacros.map((m) => {
              const isProtein = m.label === "Proteína";
              // @ts-ignore
              const hasNote = !!m.note;
              return (
                <div key={m.label} className="bg-white rounded-lg p-2 border border-slate-100 text-center flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{m.label}</p>
                    <p className="text-xs font-black text-slate-900">
                      {m.value}
                      <span className="text-[8px] text-slate-400 ml-0.5">{m.unit}</span>
                    </p>
                  </div>
                  {isProtein && proteinPerKg && (
                    <p className="text-[8px] text-emerald-600 font-bold mt-1">
                      {proteinPerKg.toFixed(1)} g/kg peso
                    </p>
                  )}
                  {hasNote && (
                    // @ts-ignore
                    <p className="text-[7px] text-indigo-500 font-bold leading-tight mt-0.5">{m.note}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card 6: Alertas gestacionales */}
      {alerts.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-2">
          <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" /> Alertas Clínicas Gestacionales
          </p>
          <ul className="list-disc pl-5 text-xs text-rose-800 space-y-1 font-medium">
            {alerts.map((alert, i) => (
              <li key={i}>{alert}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1 py-1">
        <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
        Cálculo orientativo. Debe ser validado por nutricionista, matrona o médico tratante.
      </p>
    </div>
  );
}
