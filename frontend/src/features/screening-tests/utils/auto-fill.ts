import type {
  ScreeningTestDefinition,
  ScreeningTestAnswers,
  PatientAutoFillData,
  ScreeningTestType,
} from '../types';

/**
 * Auto-fill test answers based on patient data.
 * Returns a partial answers map with only the fields that could be auto-filled,
 * and a list of field IDs that were auto-filled.
 */
export function autoFillAnswers(
  definition: ScreeningTestDefinition,
  patient: PatientAutoFillData,
): { answers: Partial<ScreeningTestAnswers>; filledFields: string[] } {
  const answers: Partial<ScreeningTestAnswers> = {};
  const filledFields: string[] = [];

  const bmi = patient.bmi ?? calculateBMI(patient.weight, patient.height);

  for (const section of definition.sections) {
    for (const question of section.questions) {
      if (!question.autoFillKey) continue;

      const filled = resolveAutoFill(question.autoFillKey, question, bmi, patient);
      if (filled !== null) {
        answers[question.id] = filled;
        filledFields.push(question.id);
      }
    }
  }

  return { answers, filledFields };
}

function calculateBMI(weight?: number | null, height?: number | null): number | null {
  if (!weight || !height || weight <= 0 || height <= 0) return null;
  const hM = height / 100;
  return weight / (hM * hM);
}

function resolveAutoFill(
  key: string,
  question: { options: { value: number }[] },
  bmi: number | null,
  patient: PatientAutoFillData,
): number | null {
  switch (key) {
    // MNA question F: IMC or calf circumference
    case 'bmi_or_calf': {
      if (bmi !== null) {
        if (bmi < 19) return 0;
        if (bmi < 21) return 1;
        if (bmi < 23) return 2;
        return 3;
      }
      if (patient.calfCircumference != null) {
        return patient.calfCircumference < 31 ? 0 : 3;
      }
      return null;
    }

    // MNA question Q: arm circumference
    case 'armCircumference': {
      const ac = patient.armCircumference;
      if (ac == null) return null;
      if (ac < 21) return 0;
      if (ac <= 22) return 0.5;
      return 1;
    }

    // MNA question R: calf circumference
    case 'calfCircumference': {
      const cc = patient.calfCircumference;
      if (cc == null) return null;
      return cc < 31 ? 0 : 1;
    }

    // NRS-2002: BMI-based nutritional status
    case 'bmi_nrs': {
      if (bmi === null) return null;
      if (bmi >= 20.5) return 0;
      if (bmi >= 18.5) return 2;
      return 3;
    }

    // NRS-2002: Age factor
    case 'age_nrs': {
      if (patient.age == null) return null;
      return patient.age >= 70 ? 1 : 0;
    }

    // MUST: BMI step
    case 'bmi_must': {
      if (bmi === null) return null;
      if (bmi > 20) return 0;
      if (bmi >= 18.5) return 1;
      return 2;
    }

    // Atalah: BMI
    case 'bmi_atalah': {
      if (bmi === null) return null;
      // Return closest option value
      if (bmi < 20) return 18;
      if (bmi < 25) return 22;
      if (bmi < 30) return 27;
      return 32;
    }

    // Atalah: pregnancy week
    case 'pregnancyWeek': {
      if (patient.pregnancyWeek == null) return null;
      return Math.max(6, Math.min(40, patient.pregnancyWeek));
    }

    default:
      return null;
  }
}

/**
 * Suggest the best test type based on patient demographics.
 */
export function suggestTestType(patient: PatientAutoFillData): ScreeningTestType | null {
  if (patient.isPregnant) return 'ATALAH';
  if (patient.age == null) return null;
  if (patient.age < 18) return 'STRONGKIDS';
  if (patient.age >= 65) return 'MNA';
  return 'NRS_2002'; // Default for adults 18-64
}
