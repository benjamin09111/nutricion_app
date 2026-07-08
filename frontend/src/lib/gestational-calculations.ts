/**
 * Cálculos nutricionales para pacientes gestantes según referencias chilenas
 * (MINSAL/DIPRECE, Atalah et al. 1997, IOM 2009)
 */

export interface GestationalBMIResult {
  imc: number;
  week: number;
  classification: "Bajo peso" | "Normal" | "Sobrepeso" | "Obesidad";
  p10: number;
  p90: number;
}

export interface GestationalWeightGain {
  preGestationalIMC: number;
  preGestationalStatus: "Bajo peso" | "Normal" | "Sobrepeso" | "Obesidad";
  currentWeight: number;
  preGestationalWeight: number;
  gainedKg: number;
  recommendedTotalMin: number;
  recommendedTotalMax: number;
  weeklyGainMin: number;
  weeklyGainMax: number;
  weeklyGainNote: string;
}

export interface TrimesterInfo {
  trimester: 1 | 2 | 3;
  label: string;
  extraKcalMin: number;
  extraKcalMax: number;
}

export interface GestationalData {
  bmi: GestationalBMIResult;
  weightGain: GestationalWeightGain;
  trimester: TrimesterInfo;
}

const ATALAH_TABLE: { week: number; p10: number; p90: number }[] = [
  { week: 10, p10: 20.8, p90: 27.0 },
  { week: 12, p10: 19.1, p90: 25.4 },
  { week: 14, p10: 19.6, p90: 26.1 },
  { week: 16, p10: 20.1, p90: 26.7 },
  { week: 18, p10: 20.7, p90: 27.5 },
  { week: 20, p10: 21.2, p90: 28.3 },
  { week: 22, p10: 21.8, p90: 28.9 },
  { week: 24, p10: 22.3, p90: 29.5 },
  { week: 26, p10: 22.9, p90: 30.1 },
  { week: 28, p10: 23.4, p90: 30.6 },
  { week: 30, p10: 23.9, p90: 31.1 },
  { week: 32, p10: 24.4, p90: 31.5 },
  { week: 34, p10: 24.9, p90: 31.9 },
  { week: 36, p10: 25.3, p90: 32.2 },
  { week: 38, p10: 25.7, p90: 32.5 },
  { week: 40, p10: 26.0, p90: 32.8 },
  { week: 42, p10: 26.2, p90: 33.0 },
];

function lerp(x0: number, y0: number, x1: number, y1: number, x: number): number {
  if (x <= x0) return y0;
  if (x >= x1) return y1;
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

function getAtalahLimits(week: number): { p10: number; p90: number } {
  const clamped = Math.max(10, Math.min(42, week));
  for (let i = 0; i < ATALAH_TABLE.length - 1; i++) {
    const a = ATALAH_TABLE[i];
    const b = ATALAH_TABLE[i + 1];
    if (clamped >= a.week && clamped <= b.week) {
      return {
        p10: lerp(a.week, a.p10, b.week, b.p10, clamped),
        p90: lerp(a.week, a.p90, b.week, b.p90, clamped),
      };
    }
  }
  return { p10: ATALAH_TABLE[0].p10, p90: ATALAH_TABLE[ATALAH_TABLE.length - 1].p90 };
}

export function classifyGestationalBMI(week: number, bmi: number): GestationalBMIResult {
  const { p10, p90 } = getAtalahLimits(week);
  const p95 = p90 + (p90 - p10) * 0.3;

  let classification: GestationalBMIResult["classification"];
  if (bmi < p10) classification = "Bajo peso";
  else if (bmi < p90) classification = "Normal";
  else if (bmi < p95) classification = "Sobrepeso";
  else classification = "Obesidad";

  return { imc: bmi, week, classification, p10, p90 };
}

export function getTrimester(week: number): TrimesterInfo {
  if (week <= 13) {
    return { trimester: 1, label: "1.er trimestre", extraKcalMin: 0, extraKcalMax: 0 };
  }
  if (week <= 26) {
    return { trimester: 2, label: "2.o trimestre", extraKcalMin: 300, extraKcalMax: 350 };
  }
  return { trimester: 3, label: "3.er trimestre", extraKcalMin: 350, extraKcalMax: 450 };
}

export const GESTATIONAL_WEIGHT_GAIN_RANGES = {
  minsal_atalah: {
    "Bajo peso": { totalMin: 12.0, totalMax: 16.0, weeklyMin: 0.40, weeklyMax: 0.50, weeklyGainNote: "Aproximadamente 400-500 g/semana" },
    Normal: { totalMin: 11.5, totalMax: 14.0, weeklyMin: 0.35, weeklyMax: 0.45, weeklyGainNote: "Aproximadamente 350-455 g/semana" },
    Sobrepeso: { totalMin: 7.0, totalMax: 11.5, weeklyMin: 0.23, weeklyMax: 0.33, weeklyGainNote: "Aproximadamente 230-330 g/semana" },
    Obesidad: { totalMin: 5.0, totalMax: 9.0, weeklyMin: 0.17, weeklyMax: 0.27, weeklyGainNote: "Aproximadamente 170-270 g/semana" },
  },
  iom: {
    "Bajo peso": { totalMin: 12.5, totalMax: 18.0, weeklyMin: 0.44, weeklyMax: 0.58, weeklyGainNote: "Aproximadamente 440-580 g/semana" },
    Normal: { totalMin: 11.5, totalMax: 16.0, weeklyMin: 0.35, weeklyMax: 0.50, weeklyGainNote: "Aproximadamente 350-500 g/semana" },
    Sobrepeso: { totalMin: 7.0, totalMax: 11.5, weeklyMin: 0.23, weeklyMax: 0.33, weeklyGainNote: "Aproximadamente 230-330 g/semana" },
    Obesidad: { totalMin: 5.0, totalMax: 9.0, weeklyMin: 0.17, weeklyMax: 0.27, weeklyGainNote: "Aproximadamente 170-270 g/semana" },
  },
};

function classifyPreGestationalIMC(imc: number): GestationalWeightGain["preGestationalStatus"] {
  if (imc < 18.5) return "Bajo peso";
  if (imc < 25) return "Normal";
  if (imc < 30) return "Sobrepeso";
  return "Obesidad";
}

export function calculateGestationalWeightGain(
  preGestationalWeight: number,
  currentWeight: number,
  heightCm: number,
  week: number,
  reference: "minsal_atalah" | "iom" = "minsal_atalah",
): GestationalWeightGain {
  const heightM = heightCm / 100;
  const preGestationalIMC = preGestationalWeight / (heightM * heightM);
  const preGestationalStatus = classifyPreGestationalIMC(preGestationalIMC);
  const gainedKg = currentWeight - preGestationalWeight;

  const refData = GESTATIONAL_WEIGHT_GAIN_RANGES[reference];
  const rec = refData[preGestationalStatus] || refData.Normal;

  const isFirstTrimester = week <= 13;
  const weeklyGainNote = isFirstTrimester
    ? "La ganancia semanal se aplica desde el 2.o trimestre"
    : rec.weeklyGainNote;

  return {
    preGestationalIMC,
    preGestationalStatus,
    currentWeight,
    preGestationalWeight,
    gainedKg,
    recommendedTotalMin: rec.totalMin,
    recommendedTotalMax: rec.totalMax,
    weeklyGainMin: rec.weeklyMin,
    weeklyGainMax: rec.weeklyMax,
    weeklyGainNote,
  };
}

export function calculateGestationalData(
  week: number,
  currentWeight: number,
  heightCm: number,
  preGestationalWeight: number,
  reference: "minsal_atalah" | "iom" = "minsal_atalah",
): GestationalData {
  const bmi = currentWeight / ((heightCm / 100) ** 2);
  return {
    bmi: classifyGestationalBMI(week, bmi),
    weightGain: calculateGestationalWeightGain(preGestationalWeight, currentWeight, heightCm, week, reference),
    trimester: getTrimester(week),
  };
}
