"use client";

import { AlertTriangle, AlertCircle, Info, ShieldAlert } from "lucide-react";
import { CalculationResult, MNAData } from "../types";

interface ClinicalAlertsProps {
  result: CalculationResult;
  mnaResult?: MNAData | null;
}

export function ClinicalAlerts({ result, mnaResult }: ClinicalAlertsProps) {
  const alerts: {
    id: string;
    severity: "critical" | "warning" | "info";
    title: string;
    description: string;
  }[] = [];

  // 1. Severe Malnutrition by BMI
  if (result.bmi && result.bmi.bmi < 16 && !result.bmi.isPediatric) {
    alerts.push({
      id: "bmi-critical",
      severity: "critical",
      title: "Alerta Crítica: Desnutrición Severa (IMC < 16 kg/m²)",
      description:
        "El paciente presenta un IMC extremadamente bajo. Se recomienda priorizar soporte nutricional inmediato y evaluar derivación a equipo multidisciplinario.",
    });
  } else if (result.bmi && result.bmi.bmi < 18.5 && !result.bmi.isPediatric && (result.inputs.age ?? 0) < 65) {
    alerts.push({
      id: "bmi-warning",
      severity: "warning",
      title: "Advertencia: Bajo Peso (IMC < 18.5 kg/m²)",
      description:
        "Estado nutricional enflaquecido. Evaluar ingesta calórica y presencia de desnutrición clínica.",
    });
  }

  // 2. Blackburn Involuntary Weight Loss
  if (result.weightLoss && result.weightLoss.isAlert) {
    alerts.push({
      id: "weight-loss-severe",
      severity: "critical",
      title: `Alerta Crítica: Pérdida de Peso Grave (${result.weightLoss.percentLoss}% en ${result.weightLoss.periodLabel})`,
      description:
        "Criterio de Blackburn positivo para pérdida de peso involuntaria grave. Alto riesgo de desnutrición aguda y complicación metabólica.",
    });
  } else if (result.weightLoss && result.weightLoss.severity === "significativa") {
    alerts.push({
      id: "weight-loss-signif",
      severity: "warning",
      title: `Advertencia: Pérdida de Peso Significativa (${result.weightLoss.percentLoss}% en ${result.weightLoss.periodLabel})`,
      description:
        "Pérdida ponderal relevante. Monitorear ingesta nutricional en próximos controles.",
    });
  }

  // 3. MNA Assessment
  if (mnaResult && mnaResult.isAlert) {
    alerts.push({
      id: "mna-critical",
      severity: "critical",
      title: `Alerta Crítica MNA: ${mnaResult.category} (Puntaje: ${mnaResult.score}/30)`,
      description:
        "Evaluación MNA confirma estado de desnutrición en adulto mayor. Se sugiere intervención nutricional intensiva.",
    });
  } else if (mnaResult && mnaResult.score < 24 && mnaResult.score >= 17) {
    alerts.push({
      id: "mna-warning",
      severity: "warning",
      title: `Advertencia MNA: Riesgo de Desnutrición (${mnaResult.score}/30 pts)`,
      description:
        "El paciente presenta riesgo nutricional moderado. Realizar seguimiento continuo.",
    });
  }

  // 4. Cardiovascular Risk
  if (result.cardiovascularRisk && result.cardiovascularRisk.iccRisk === "Elevado") {
    alerts.push({
      id: "icc-warning",
      severity: "warning",
      title: "Advertencia Cardiovascular: Índice Cintura/Cadera Elevado",
      description:
        "Distribución de grasa androide (central). Mayor riesgo relativo de eventos cardiovasculares y síndrome metabólico.",
    });
  }

  // 5. Cross-reference Blackburn ↔ Edema
  if (result.weightLoss && result.weightLoss.severity !== "normal" && (result.inputs.edemaPercent ?? 0) > 0) {
    alerts.push({
      id: "edema-cross-reference",
      severity: "info",
      title: `Nota Asistencial: Coexistencia de Pérdida de Peso y Edema (${result.inputs.edemaPercent}%)`,
      description:
        `El paciente registra retención hídrica/edema del ${result.inputs.edemaPercent}%. Confirmar en la anamnesis si parte de la pérdida se debe a depleción de masa física o a resolución de edemas (tratamiento diurético / respuesta clínica).`,
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-4">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
            alert.severity === "critical"
              ? "bg-rose-50 border-rose-200 text-rose-900 shadow-sm"
              : alert.severity === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-900 shadow-sm"
              : "bg-sky-50 border-sky-200 text-sky-900 shadow-sm"
          }`}
        >
          {alert.severity === "critical" && (
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
          )}
          {alert.severity === "warning" && (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          {alert.severity === "info" && (
            <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          )}

          <div>
            <h4 className="text-xs font-black uppercase tracking-wide">
              {alert.title}
            </h4>
            <p className="text-xs mt-1 leading-relaxed opacity-90">
              {alert.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
