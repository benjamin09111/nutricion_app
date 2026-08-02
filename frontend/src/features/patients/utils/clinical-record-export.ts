import type { Patient } from "@/features/patients";
import type { ClinicalRecordDraft } from "@/features/patients/clinical-record";

export function buildClinicalRecordPdfData(
  patient: Patient,
  clinicalRecordDraft: ClinicalRecordDraft,
) {
  const weight = patient.weight;
  const height = patient.height;
  const bmi = weight && height ? weight / ((height / 100) * (height / 100)) : null;
  const bmiClassification = bmi
    ? bmi < 18.5
      ? "Bajo peso"
      : bmi < 25
        ? "Normopeso"
        : bmi < 30
          ? "Sobrepeso"
          : "Obesidad"
    : undefined;
  const activityLabels: Record<string, string> = {
    sedentario: "Sedentario",
    ligero: "Ligero",
    moderado: "Moderado",
    activo: "Activo",
    muy_activo: "Muy activo",
  };
  const cr = clinicalRecordDraft;

  return {
    patientName: patient.fullName || "Sin Nombre",
    patientEmail: patient.email,
    patientPhone: patient.phone,
    patientRut: patient.documentId,
    patientGender: patient.gender,
    patientAge: patient.age,
    patientBirthDate: patient.birthDate
      ? new Date(patient.birthDate).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : undefined,
    weight,
    height,
    bmi: bmi ? Math.round(bmi * 10) / 10 : undefined,
    bmiClassification,
    get: undefined,
    weightHabitual: cr.anthropometry?.pesoHabitual,
    weightTarget: cr.vitalHistory?.pesoObjetivoProf,
    manualCaloriesAdjustment: cr.vitalHistory?.manualCaloriesAdjustment,
    activityLevel: activityLabels[patient.activityLevel || ""] || patient.activityLevel,
    tricipital: cr.anthropometry?.skinfolds?.tricipital,
    bicipital: cr.anthropometry?.skinfolds?.bicipital,
    subescapular: cr.anthropometry?.skinfolds?.subescapular,
    suprailiac: cr.anthropometry?.skinfolds?.suprailiac,
    kneeHeight: cr.anthropometry?.circumferences?.kneeHeight,
    calfCircumference: cr.anthropometry?.circumferences?.calfCircumference,
    armCircumference: cr.anthropometry?.circumferences?.armCircumference,
    waistCircumference: cr.anthropometry?.circumferences?.waistCircumference,
    hipCircumference: cr.anthropometry?.circumferences?.hipCircumference,
    occupation: cr.vitalHistory?.occupation,
    workSchedule: cr.vitalHistory?.workSchedule,
    medications: cr.vitalHistory?.medications,
    supplementsOrDrugs: cr.vitalHistory?.supplementsOrDrugs,
    diagnosedPathologies: cr.vitalHistory?.diagnosedPathologies,
    primaryCondition: patient.primaryCondition,
    familyHistory: cr.vitalHistory?.familyHistory,
    sleepQuality: cr.vitalHistory?.sleepQuality,
    perceivedStress: cr.vitalHistory?.perceivedStress,
    weeklyExercise: cr.vitalHistory?.weeklyExercise,
    motivoConsulta: cr.vitalHistory?.motivoConsulta,
    dietRestrictions: patient.dietRestrictions,
    eatingPreferences: cr.nutritionalAnamnesis?.eatingPreferences || patient.likes,
    rejectedFoods: cr.nutritionalAnamnesis?.rejectedFoods,
    clinicalObservations: cr.nutritionalAnamnesis?.clinicalObservations || patient.clinicalSummary,
    diagnosticoNutricional: cr.nutritionalAnamnesis?.diagnosticoNutricional,
    isPregnant: cr.gynecoObstetric?.isPregnant,
    pregnancyWeeks: cr.gynecoObstetric?.pregnancyWeeks,
    pregestationalWeight: cr.gynecoObstetric?.pregestationalWeight,
    pregnancyType: cr.gynecoObstetric?.pregnancyType,
    nutritionalFocus: patient.nutritionalFocus,
    fitnessGoals: patient.fitnessGoals,
    generatedAt: new Date().toISOString(),
  };
}
