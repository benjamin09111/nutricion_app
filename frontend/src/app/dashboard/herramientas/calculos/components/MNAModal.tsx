"use client";

import { useState } from "react";
import { X, CheckCircle2, AlertTriangle, ShieldAlert, Award, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { MNAData } from "../types";

interface MNAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMNA: (data: MNAData) => void;
}

export function MNAModal({ isOpen, onClose, onApplyMNA }: MNAModalProps) {
  // State for all 18 questions
  const [qA, setQA] = useState<number>(2); // Apetito
  const [qB, setQB] = useState<number>(3); // Pérdida peso
  const [qC, setQC] = useState<number>(2); // Movilidad
  const [qD, setQD] = useState<number>(2); // Estrés agudo
  const [qE, setQE] = useState<number>(2); // Neuropsicológico
  const [qF, setQF] = useState<number>(3); // IMC/CP

  // Global evaluation questions
  const [qG, setQG] = useState<number>(1); // Independiente
  const [qH, setQH] = useState<number>(1); // Polifarmacia
  const [qI, setQI] = useState<number>(1); // Úlceras
  const [qJ, setQJ] = useState<number>(2); // Comidas/día
  const [qK, setQK] = useState<number>(1); // Consumo proteína
  const [qL, setQL] = useState<number>(1); // Frutas/verduras
  const [qM, setQM] = useState<number>(1); // Líquidos
  const [qN, setQN] = useState<number>(2); // Autonomía comer
  const [qO, setQO] = useState<number>(2); // Autopercepción nutrición
  const [qP, setQP] = useState<number>(2); // Autopercepción salud
  const [qQ, setQQ] = useState<number>(1); // Circunferencia braquial
  const [qR, setQR] = useState<number>(1); // Circunferencia pantorrilla

  if (!isOpen) return null;

  // Screening subtotal (max 14)
  const screeningScore = qA + qB + qC + qD + qE + qF;

  // Global evaluation subtotal (max 16)
  const globalScore = qG + qH + qI + qJ + qK + qL + qM + qN + qO + qP + qQ + qR;

  // Total score (max 30)
  const totalScore = screeningScore + globalScore;

  let category = "Estado Nutricional Normal";
  let color = "#22c55e";
  let isAlert = false;

  if (totalScore < 17) {
    category = "Desnutrición Confirmada";
    color = "#ef4444";
    isAlert = true;
  } else if (totalScore <= 23.5) {
    category = "Riesgo de Desnutrición";
    color = "#f59e0b";
  }

  const handleSave = () => {
    onApplyMNA({
      score: totalScore,
      category,
      color,
      isAlert,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Cuestionario MNA® (Mini Nutritional Assessment)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Herramienta validada de cribado y evaluación nutricional para adultos mayores (&ge;65 años).
            </p>
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
          {/* Summary Card */}
          <div
            className="p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
            style={{ backgroundColor: `${color}10`, borderColor: `${color}40` }}
          >
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Puntaje Total Calculado
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-slate-900">
                  {totalScore} <span className="text-sm font-normal text-slate-400">/ 30 pts</span>
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-black uppercase text-white shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  {category}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Screening: <strong>{screeningScore}/14 pts</strong> | Evaluación Global: <strong>{globalScore}/16 pts</strong>
              </p>
            </div>

            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">
              Aplicar Resultado a la Consulta
            </Button>
          </div>

          {/* Bloque 1: Screening Rápido (6 preguntas) */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 border-b border-indigo-100 pb-1">
              Bloque 1 · Cribado Rápido (Máx. 14 puntos)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">A. ¿Ha ingerido menos alimentos en los últimos 3 meses?</label>
                <select
                  value={qA}
                  onChange={(e) => setQA(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = Disminución grave del apetito</option>
                  <option value={1}>1 = Disminución moderada</option>
                  <option value={2}>2 = Sin disminución del apetito</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">B. Pérdida reciente de peso (&lt;3 meses)</label>
                <select
                  value={qB}
                  onChange={(e) => setQB(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = Pérdida de peso &gt; 3 kg</option>
                  <option value={1}>1 = No sabe</option>
                  <option value={2}>2 = Pérdida entre 1 y 3 kg</option>
                  <option value={3}>3 = Sin pérdida de peso</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">C. Movilidad habitual</label>
                <select
                  value={qC}
                  onChange={(e) => setQC(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = De la cama al sillón</option>
                  <option value={1}>1 = Autonomía en el interior</option>
                  <option value={2}>2 = Sale del domicilio</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">D. ¿Ha tenido enfermedad aguda o estrés psicológico en 3 meses?</label>
                <select
                  value={qD}
                  onChange={(e) => setQD(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = Sí</option>
                  <option value={2}>2 = No</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">E. Problemas neuropsicológicos</label>
                <select
                  value={qE}
                  onChange={(e) => setQE(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = Demencia o depresión grave</option>
                  <option value={1}>1 = Demencia moderada</option>
                  <option value={2}>2 = Sin problemas psicológicos</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">F. IMC o Circunferencia Pantorrilla (CP)</label>
                <select
                  value={qF}
                  onChange={(e) => setQF(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = IMC &lt; 19 o CP &lt; 31 cm</option>
                  <option value={1}>1 = IMC 19 - 21</option>
                  <option value={2}>2 = IMC 21 - 23</option>
                  <option value={3}>3 = IMC &ge; 23 o CP &ge; 31 cm</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bloque 2: Evaluación Global (12 preguntas) */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-700 border-b border-indigo-100 pb-1">
              Bloque 2 · Evaluación Global y Dietética (Máx. 16 puntos)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">G. ¿El paciente vive independiente en su domicilio?</label>
                <select
                  value={qG}
                  onChange={(e) => setQG(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = No</option>
                  <option value={1}>1 = Sí</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">H. ¿Toma más de 3 medicamentos al día?</label>
                <select
                  value={qH}
                  onChange={(e) => setQH(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = Sí</option>
                  <option value={1}>1 = No</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">I. ¿Presenta úlceras o lesiones cutáneas?</label>
                <select
                  value={qI}
                  onChange={(e) => setQI(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = Sí</option>
                  <option value={1}>1 = No</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">J. N° de comidas completas al día</label>
                <select
                  value={qJ}
                  onChange={(e) => setQJ(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = 1 comida</option>
                  <option value={1}>1 = 2 comidas</option>
                  <option value={2}>2 = 3 comidas</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">K. Consumo de alimentos proteicos</label>
                <select
                  value={qK}
                  onChange={(e) => setQK(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = 0 a 1 grupo proteico</option>
                  <option value={0.5}>0.5 = 2 grupos proteicos</option>
                  <option value={1}>1 = 3 grupos proteicos (lácteos, huevos/legumbres, carne/pescado)</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">L. ¿Consume 2 o más porciones de frutas/verduras al día?</label>
                <select
                  value={qL}
                  onChange={(e) => setQL(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = No</option>
                  <option value={1}>1 = Sí</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">M. Consumo de líquidos al día</label>
                <select
                  value={qM}
                  onChange={(e) => setQM(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = Menos de 3 vasos</option>
                  <option value={0.5}>0.5 = De 3 a 5 vasos</option>
                  <option value={1}>1 = Más de 5 vasos</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">N. Forma de alimentarse</label>
                <select
                  value={qN}
                  onChange={(e) => setQN(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = Necesita asistencia</option>
                  <option value={1}>1 = Se alimenta solo con dificultad</option>
                  <option value={2}>2 = Se alimenta solo sin dificultad</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">O. Autopercepción del estado nutricional</label>
                <select
                  value={qO}
                  onChange={(e) => setQO(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = Se considera desnutrido</option>
                  <option value={1}>1 = No sabe</option>
                  <option value={2}>2 = Sin problemas de nutrición</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">P. Autopercepción de salud vs pares de su edad</label>
                <select
                  value={qP}
                  onChange={(e) => setQP(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = Peor</option>
                  <option value={0.5}>0.5 = No sabe</option>
                  <option value={1}>1 = Igual</option>
                  <option value={2}>2 = Mejor</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">Q. Circunferencia Braquial (CB)</label>
                <select
                  value={qQ}
                  onChange={(e) => setQQ(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = CB &lt; 21 cm</option>
                  <option value={0.5}>0.5 = CB 21 - 22 cm</option>
                  <option value={1}>1 = CB &ge; 22 cm</option>
                </select>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                <label className="font-bold text-slate-800">R. Circunferencia de Pantorrilla (CP)</label>
                <select
                  value={qR}
                  onChange={(e) => setQR(Number(e.target.value))}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700"
                >
                  <option value={0}>0 = CP &lt; 31 cm</option>
                  <option value={1}>1 = CP &ge; 31 cm</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">
            Guardar Evaluación MNA ({totalScore}/30 pts)
          </Button>
        </div>
      </div>
    </div>
  );
}
