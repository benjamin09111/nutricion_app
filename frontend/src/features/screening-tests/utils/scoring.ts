import type {
  ScreeningTestDefinition,
  ScreeningTestAnswers,
  ScreeningTestResult,
} from '../types';
import { ATALAH_TABLE } from '../definitions/atalah';

/**
 * Calculate the total score and classification for a standard additive test.
 */
export function calculateTestResult(
  definition: ScreeningTestDefinition,
  answers: ScreeningTestAnswers,
): ScreeningTestResult {
  // Special handling for Atalah (classification-based, not additive)
  if (definition.type === 'ATALAH') {
    return calculateAtalahResult(definition, answers);
  }

  const scores: Record<string, number> = {};
  let total = 0;

  for (const section of definition.sections) {
    let sectionTotal = 0;
    for (const question of section.questions) {
      const value = answers[question.id] ?? question.defaultValue;
      sectionTotal += value;
    }
    scores[section.title] = sectionTotal;
    total += sectionTotal;
  }

  // Find matching threshold (ordered ascending by maxScore)
  const threshold = definition.thresholds.find((t) => total < t.maxScore)
    ?? definition.thresholds[definition.thresholds.length - 1];

  return {
    scores,
    total,
    category: threshold.category,
    color: threshold.color,
    isAlert: threshold.isAlert,
    recommendation: threshold.recommendation,
  };
}

/**
 * Atalah-specific scoring: classify using gestational week + BMI lookup table.
 */
function calculateAtalahResult(
  definition: ScreeningTestDefinition,
  answers: ScreeningTestAnswers,
): ScreeningTestResult {
  const week = Math.round(answers['GEST_WEEK'] ?? 20);
  const bmi = answers['GEST_BMI'] ?? 25;

  // Clamp week to table range
  const clampedWeek = Math.max(6, Math.min(40, week));
  const thresholds = ATALAH_TABLE[clampedWeek] ?? ATALAH_TABLE[20];
  const [bajoPesoMax, normalMax, sobrepesoMax] = thresholds;

  let category: string;
  let color: string;
  let isAlert: boolean;
  let recommendation: string;

  if (bmi < bajoPesoMax) {
    const t = definition.thresholds[0]; // Bajo Peso
    category = t.category;
    color = t.color;
    isAlert = t.isAlert;
    recommendation = t.recommendation;
  } else if (bmi < normalMax) {
    const t = definition.thresholds[1]; // Normal
    category = t.category;
    color = t.color;
    isAlert = t.isAlert;
    recommendation = t.recommendation;
  } else if (bmi < sobrepesoMax) {
    const t = definition.thresholds[2]; // Sobrepeso
    category = t.category;
    color = t.color;
    isAlert = t.isAlert;
    recommendation = t.recommendation;
  } else {
    const t = definition.thresholds[3]; // Obesidad
    category = t.category;
    color = t.color;
    isAlert = t.isAlert;
    recommendation = t.recommendation;
  }

  return {
    scores: {
      'Semana Gestacional': week,
      'IMC': bmi,
    },
    total: bmi, // For Atalah, "total" is the BMI for display
    category,
    color,
    isAlert,
    recommendation,
  };
}

/**
 * Build default answers map from a test definition.
 */
export function buildDefaultAnswers(definition: ScreeningTestDefinition): ScreeningTestAnswers {
  const answers: ScreeningTestAnswers = {};
  for (const section of definition.sections) {
    for (const question of section.questions) {
      answers[question.id] = question.defaultValue;
    }
  }
  return answers;
}
