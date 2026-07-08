import { Patient, ClinicalRecord } from "./types";

export type ClinicalRecordSource = "patient" | "nutritionist" | "calculated";

export interface ClinicalRecordDraft {
  vitalHistory: {
    occupation: string;
    workSchedule: string;
    medications: string;
    supplementsOrDrugs: string;
    diagnosedPathologies: string;
    familyHistory: string;
    sleepQuality: string;
    perceivedStress: string;
    weeklyExercise: string;
    motivoConsulta: string;
    manualCaloriesAdjustment: string;
    pesoObjetivoProf: string;
  };
  gynecoObstetric: {
    isPregnant: boolean;
    pregnancyWeeks: string;
    pregestationalWeight: string;
    pregnancyType: string;
  };
  nutritionalAnamnesis: {
    eatingPreferences: string;
    rejectedFoods: string;
    clinicalObservations: string;
    gestationalSymptoms: string[];
    gestationalSupplementation: string[];
    diagnosticoNutricional: string;
  };
  anthropometry: {
    skinfolds: {
      tricipital: string;
      bicipital: string;
      subescapular: string;
      suprailiac: string;
    };
    circumferences: {
      kneeHeight: string;
      calfCircumference: string;
      armCircumference: string;
      waistCircumference: string;
      hipCircumference: string;
    };
    pesoHabitual: string;
  };
  dataSources: Record<string, ClinicalRecordSource>;
}

const EMPTY_DRAFT: ClinicalRecordDraft = {
  vitalHistory: {
    occupation: "",
    workSchedule: "",
    medications: "",
    supplementsOrDrugs: "",
    diagnosedPathologies: "",
    familyHistory: "",
    sleepQuality: "",
    perceivedStress: "",
    weeklyExercise: "",
    motivoConsulta: "",
    manualCaloriesAdjustment: "",
    pesoObjetivoProf: "",
  },
  gynecoObstetric: {
    isPregnant: false,
    pregnancyWeeks: "",
    pregestationalWeight: "",
    pregnancyType: "",
  },
  nutritionalAnamnesis: {
    eatingPreferences: "",
    rejectedFoods: "",
    clinicalObservations: "",
    gestationalSymptoms: [],
    gestationalSupplementation: [],
    diagnosticoNutricional: "",
  },
  anthropometry: {
    skinfolds: {
      tricipital: "",
      bicipital: "",
      subescapular: "",
      suprailiac: "",
    },
    circumferences: {
      kneeHeight: "",
      calfCircumference: "",
      armCircumference: "",
      waistCircumference: "",
      hipCircumference: "",
    },
    pesoHabitual: "",
  },
  dataSources: {},
};

const CUSTOM_KEY_TO_SOURCE_FIELD: Record<string, string> = {
  occupation: "vitalHistory.occupation",
  workSchedule: "vitalHistory.workSchedule",
  medications: "vitalHistory.medications",
  drugsSupplements: "vitalHistory.supplementsOrDrugs",
  diagnosedPathologies: "vitalHistory.diagnosedPathologies",
  familyHistory: "vitalHistory.familyHistory",
  sleepQuality: "vitalHistory.sleepQuality",
  perceivedStress: "vitalHistory.perceivedStress",
  weeklyExercise: "vitalHistory.weeklyExercise",
  motivoConsulta: "vitalHistory.motivoConsulta",
  manualCaloriesAdjustment: "vitalHistory.manualCaloriesAdjustment",
  pesoObjetivoProf: "vitalHistory.pesoObjetivoProf",
  pregnant: "gynecoObstetric.isPregnant",
  pregnancyWeeks: "gynecoObstetric.pregnancyWeeks",
  pregestationalWeight: "gynecoObstetric.pregestationalWeight",
  pregnancyType: "gynecoObstetric.pregnancyType",
  foodFrequency: "nutritionalAnamnesis.foodFrequency",
  recall24h: "nutritionalAnamnesis.recall24h",
  mealSchedules: "nutritionalAnamnesis.mealSchedules",
  mealsPerDay: "nutritionalAnamnesis.mealsPerDay",
  waterIntake: "nutritionalAnamnesis.waterIntake",
  alcoholIntake: "nutritionalAnamnesis.alcoholIntake",
  sugaryDrinksIntake: "nutritionalAnamnesis.sugaryDrinksIntake",
  rejectedFoods: "nutritionalAnamnesis.rejectedFoods",
  foodBudget: "nutritionalAnamnesis.foodBudget",
  whoCooks: "nutritionalAnamnesis.whoCooks",
  eatingLocation: "nutritionalAnamnesis.eatingLocation",
  gestationalSymptoms: "nutritionalAnamnesis.gestationalSymptoms",
  gestationalSupplementation: "nutritionalAnamnesis.gestationalSupplementation",
  diagnosticoNutricional: "nutritionalAnamnesis.diagnosticoNutricional",
  pliegueTricipital: "anthropometry.skinfolds.tricipital",
  pliegueBicipital: "anthropometry.skinfolds.bicipital",
  pliegueSubescapular: "anthropometry.skinfolds.subescapular",
  pliegueSuprailiaco: "anthropometry.skinfolds.suprailiac",
  alturaRodilla: "anthropometry.circumferences.kneeHeight",
  circunferenciaPantorrilla: "anthropometry.circumferences.calfCircumference",
  circunferenciaBraquial: "anthropometry.circumferences.armCircumference",
  circunferenciaCintura: "anthropometry.circumferences.waistCircumference",
  circunferenciaCadera: "anthropometry.circumferences.hipCircumference",
  pesoHabitual: "anthropometry.pesoHabitual",
};

function getCustomValue(patient: Patient | null | undefined, key: string) {
  const list = Array.isArray(patient?.customVariables) ? patient?.customVariables : [];
  return list?.find((item) => item.key === key)?.value;
}

function toText(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function toNumberText(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : "";
}

function toBoolean(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function valueToSourceKey(path: string) {
  const entry = Object.entries(CUSTOM_KEY_TO_SOURCE_FIELD).find(([, mapped]) => mapped === path);
  return entry?.[0] ?? path;
}

export function createEmptyClinicalRecordDraft(): ClinicalRecordDraft {
  return {
    vitalHistory: { ...EMPTY_DRAFT.vitalHistory },
    gynecoObstetric: { ...EMPTY_DRAFT.gynecoObstetric },
    nutritionalAnamnesis: { ...EMPTY_DRAFT.nutritionalAnamnesis },
    anthropometry: {
      skinfolds: { ...EMPTY_DRAFT.anthropometry.skinfolds },
      circumferences: { ...EMPTY_DRAFT.anthropometry.circumferences },
      pesoHabitual: EMPTY_DRAFT.anthropometry.pesoHabitual,
    },
    dataSources: {},
  };
}

export function buildClinicalRecordDraft(
  patient: Patient | null | undefined,
  clinicalRecord?: ClinicalRecord | null,
): ClinicalRecordDraft {
  const draft = createEmptyClinicalRecordDraft();

  if (clinicalRecord?.vitalHistory) {
    draft.vitalHistory = {
      ...draft.vitalHistory,
      ...clinicalRecord.vitalHistory,
      manualCaloriesAdjustment: toNumberText(clinicalRecord.vitalHistory.manualCaloriesAdjustment),
      pesoObjetivoProf: toNumberText(clinicalRecord.vitalHistory.pesoObjetivoProf),
    };
  }

  if (clinicalRecord?.gynecoObstetric) {
    draft.gynecoObstetric = {
      ...draft.gynecoObstetric,
      isPregnant: Boolean(clinicalRecord.gynecoObstetric.isPregnant),
      pregnancyWeeks: toNumberText(clinicalRecord.gynecoObstetric.pregnancyWeeks),
      pregestationalWeight: toNumberText(clinicalRecord.gynecoObstetric.pregestationalWeight),
      pregnancyType: toText(clinicalRecord.gynecoObstetric.pregnancyType),
    };
  }

  if (clinicalRecord?.nutritionalAnamnesis) {
    draft.nutritionalAnamnesis = {
      ...draft.nutritionalAnamnesis,
      ...clinicalRecord.nutritionalAnamnesis,
    };
  }

  if (clinicalRecord?.anthropometry) {
    draft.anthropometry = {
      skinfolds: {
        ...draft.anthropometry.skinfolds,
        tricipital: toNumberText(clinicalRecord.anthropometry.skinfolds?.tricipital),
        bicipital: toNumberText(clinicalRecord.anthropometry.skinfolds?.bicipital),
        subescapular: toNumberText(clinicalRecord.anthropometry.skinfolds?.subescapular),
        suprailiac: toNumberText(clinicalRecord.anthropometry.skinfolds?.suprailiac),
      },
      circumferences: {
        ...draft.anthropometry.circumferences,
        kneeHeight: toNumberText(clinicalRecord.anthropometry.circumferences?.kneeHeight),
        calfCircumference: toNumberText(clinicalRecord.anthropometry.circumferences?.calfCircumference),
        armCircumference: toNumberText(clinicalRecord.anthropometry.circumferences?.armCircumference),
        waistCircumference: toNumberText(clinicalRecord.anthropometry.circumferences?.waistCircumference),
        hipCircumference: toNumberText(clinicalRecord.anthropometry.circumferences?.hipCircumference),
      },
      pesoHabitual: toNumberText(clinicalRecord.anthropometry.pesoHabitual),
    };
  }

  const patientFallbacks: Record<string, unknown> = {
    occupation: getCustomValue(patient, "occupation"),
    workSchedule: getCustomValue(patient, "workSchedule"),
    medications: getCustomValue(patient, "medications"),
    supplementsOrDrugs: getCustomValue(patient, "drugsSupplements"),
    diagnosedPathologies: getCustomValue(patient, "diagnosedPathologies"),
    familyHistory: getCustomValue(patient, "familyHistory"),
    sleepQuality: getCustomValue(patient, "sleepQuality"),
    perceivedStress: getCustomValue(patient, "perceivedStress"),
    weeklyExercise: getCustomValue(patient, "weeklyExercise"),
    motivoConsulta: getCustomValue(patient, "motivoConsulta"),
    manualCaloriesAdjustment: getCustomValue(patient, "manualCaloriesAdjustment"),
    pesoObjetivoProf: getCustomValue(patient, "pesoObjetivoProf"),
    isPregnant: getCustomValue(patient, "pregnant"),
    pregnancyWeeks: getCustomValue(patient, "pregnancyWeeks"),
    pregestationalWeight: getCustomValue(patient, "pregestationalWeight"),
    pregnancyType: getCustomValue(patient, "pregnancyType"),
    foodFrequency: getCustomValue(patient, "foodFrequency"),
    recall24h: getCustomValue(patient, "recall24h"),
    eatingPreferences: patient?.likes,
    clinicalObservations: patient?.clinicalSummary,
    mealSchedules: getCustomValue(patient, "mealSchedules"),
    mealsPerDay: getCustomValue(patient, "mealsPerDay"),
    waterIntake: getCustomValue(patient, "waterIntake"),
    alcoholIntake: getCustomValue(patient, "alcoholIntake"),
    sugaryDrinksIntake: getCustomValue(patient, "sugaryDrinksIntake"),
    rejectedFoods: getCustomValue(patient, "rejectedFoods"),
    foodBudget: getCustomValue(patient, "foodBudget"),
    whoCooks: getCustomValue(patient, "whoCooks"),
    eatingLocation: getCustomValue(patient, "eatingLocation"),
    gestationalSymptoms: getCustomValue(patient, "gestationalSymptoms"),
    gestationalSupplementation: getCustomValue(patient, "gestationalSupplementation"),
    diagnosticoNutricional: getCustomValue(patient, "diagnosticoNutricional"),

    tricipital: getCustomValue(patient, "pliegueTricipital"),
    bicipital: getCustomValue(patient, "pliegueBicipital"),
    subescapular: getCustomValue(patient, "pliegueSubescapular"),
    suprailiac: getCustomValue(patient, "pliegueSuprailiaco"),
    kneeHeight: getCustomValue(patient, "alturaRodilla"),
    calfCircumference: getCustomValue(patient, "circunferenciaPantorrilla"),
    armCircumference: getCustomValue(patient, "circunferenciaBraquial"),
    waistCircumference: getCustomValue(patient, "circunferenciaCintura"),
    hipCircumference: getCustomValue(patient, "circunferenciaCadera"),
    pesoHabitual: getCustomValue(patient, "pesoHabitual"),
  };

  const toList = (val: unknown): string[] => (Array.isArray(val) ? val : []);

  draft.vitalHistory = {
    occupation: draft.vitalHistory.occupation || toText(patientFallbacks.occupation),
    workSchedule: draft.vitalHistory.workSchedule || toText(patientFallbacks.workSchedule),
    medications: draft.vitalHistory.medications || toText(patientFallbacks.medications),
    supplementsOrDrugs:
      draft.vitalHistory.supplementsOrDrugs || toText(patientFallbacks.supplementsOrDrugs),
    diagnosedPathologies:
      draft.vitalHistory.diagnosedPathologies || toText(patientFallbacks.diagnosedPathologies),
    familyHistory: draft.vitalHistory.familyHistory || toText(patientFallbacks.familyHistory),
    sleepQuality: draft.vitalHistory.sleepQuality || toText(patientFallbacks.sleepQuality),
    perceivedStress: draft.vitalHistory.perceivedStress || toText(patientFallbacks.perceivedStress),
    weeklyExercise: draft.vitalHistory.weeklyExercise || toText(patientFallbacks.weeklyExercise),
    motivoConsulta: draft.vitalHistory.motivoConsulta || toText(patientFallbacks.motivoConsulta),
    manualCaloriesAdjustment:
      draft.vitalHistory.manualCaloriesAdjustment || toNumberText(patientFallbacks.manualCaloriesAdjustment),
    pesoObjetivoProf:
      draft.vitalHistory.pesoObjetivoProf || toNumberText(patientFallbacks.pesoObjetivoProf),
  };

  draft.gynecoObstetric = {
    isPregnant: draft.gynecoObstetric.isPregnant || toBoolean(patientFallbacks.isPregnant),
    pregnancyWeeks: draft.gynecoObstetric.pregnancyWeeks || toNumberText(patientFallbacks.pregnancyWeeks),
    pregestationalWeight:
      draft.gynecoObstetric.pregestationalWeight || toNumberText(patientFallbacks.pregestationalWeight),
    pregnancyType: draft.gynecoObstetric.pregnancyType || toText(patientFallbacks.pregnancyType),
  };

  draft.nutritionalAnamnesis = {
    eatingPreferences:
      draft.nutritionalAnamnesis.eatingPreferences || toText(patientFallbacks.eatingPreferences),
    clinicalObservations:
      draft.nutritionalAnamnesis.clinicalObservations || toText(patientFallbacks.clinicalObservations),
    rejectedFoods: draft.nutritionalAnamnesis.rejectedFoods || toText(patientFallbacks.rejectedFoods),
    gestationalSymptoms: toList(draft.nutritionalAnamnesis.gestationalSymptoms).length > 0
      ? toList(draft.nutritionalAnamnesis.gestationalSymptoms)
      : toList(patientFallbacks.gestationalSymptoms),
    gestationalSupplementation: toList(draft.nutritionalAnamnesis.gestationalSupplementation).length > 0
      ? toList(draft.nutritionalAnamnesis.gestationalSupplementation)
      : toList(patientFallbacks.gestationalSupplementation),
    diagnosticoNutricional:
      draft.nutritionalAnamnesis.diagnosticoNutricional || toText(patientFallbacks.diagnosticoNutricional),
  };

  draft.anthropometry = {
    skinfolds: {
      tricipital: draft.anthropometry.skinfolds.tricipital || toNumberText(patientFallbacks.tricipital),
      bicipital: draft.anthropometry.skinfolds.bicipital || toNumberText(patientFallbacks.bicipital),
      subescapular:
        draft.anthropometry.skinfolds.subescapular || toNumberText(patientFallbacks.subescapular),
      suprailiac: draft.anthropometry.skinfolds.suprailiac || toNumberText(patientFallbacks.suprailiac),
    },
    circumferences: {
      kneeHeight: draft.anthropometry.circumferences.kneeHeight || toNumberText(patientFallbacks.kneeHeight),
      calfCircumference:
        draft.anthropometry.circumferences.calfCircumference ||
        toNumberText(patientFallbacks.calfCircumference),
      armCircumference:
        draft.anthropometry.circumferences.armCircumference || toNumberText(patientFallbacks.armCircumference),
      waistCircumference:
        draft.anthropometry.circumferences.waistCircumference || toNumberText(patientFallbacks.waistCircumference),
      hipCircumference:
        draft.anthropometry.circumferences.hipCircumference || toNumberText(patientFallbacks.hipCircumference),
    },
    pesoHabitual: draft.anthropometry.pesoHabitual || toNumberText(patientFallbacks.pesoHabitual),
  };

  draft.dataSources = {
    ...(clinicalRecord?.dataSources as Record<string, ClinicalRecordSource> | undefined),
    ...(draft.vitalHistory.occupation ? { [valueToSourceKey("vitalHistory.occupation")]: "patient" } : {}),
  };

  return draft;
}

function cleanText(value: string) {
  const next = value.trim();
  return next.length > 0 ? next : undefined;
}

function cleanNumber(value: string) {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
}

export function serializeClinicalRecordDraft(draft: ClinicalRecordDraft) {
  return {
    vitalHistory: {
      occupation: cleanText(draft.vitalHistory.occupation),
      workSchedule: cleanText(draft.vitalHistory.workSchedule),
      medications: cleanText(draft.vitalHistory.medications),
      supplementsOrDrugs: cleanText(draft.vitalHistory.supplementsOrDrugs),
      diagnosedPathologies: cleanText(draft.vitalHistory.diagnosedPathologies),
      familyHistory: cleanText(draft.vitalHistory.familyHistory),
      sleepQuality: cleanText(draft.vitalHistory.sleepQuality),
      perceivedStress: cleanText(draft.vitalHistory.perceivedStress),
      weeklyExercise: cleanText(draft.vitalHistory.weeklyExercise),
      motivoConsulta: cleanText(draft.vitalHistory.motivoConsulta),
      manualCaloriesAdjustment: cleanNumber(draft.vitalHistory.manualCaloriesAdjustment),
      pesoObjetivoProf: cleanNumber(draft.vitalHistory.pesoObjetivoProf),
    },
    gynecoObstetric: {
      isPregnant: draft.gynecoObstetric.isPregnant,
      pregnancyWeeks: cleanNumber(draft.gynecoObstetric.pregnancyWeeks),
      pregestationalWeight: cleanNumber(draft.gynecoObstetric.pregestationalWeight),
      pregnancyType: cleanText(draft.gynecoObstetric.pregnancyType),
    },
    nutritionalAnamnesis: {
      eatingPreferences: cleanText(draft.nutritionalAnamnesis.eatingPreferences),
      clinicalObservations: cleanText(draft.nutritionalAnamnesis.clinicalObservations),
      rejectedFoods: cleanText(draft.nutritionalAnamnesis.rejectedFoods),
      gestationalSymptoms: draft.nutritionalAnamnesis.gestationalSymptoms,
      gestationalSupplementation: draft.nutritionalAnamnesis.gestationalSupplementation,
      diagnosticoNutricional: cleanText(draft.nutritionalAnamnesis.diagnosticoNutricional),
    },
    anthropometry: {
      skinfolds: {
        tricipital: cleanNumber(draft.anthropometry.skinfolds.tricipital),
        bicipital: cleanNumber(draft.anthropometry.skinfolds.bicipital),
        subescapular: cleanNumber(draft.anthropometry.skinfolds.subescapular),
        suprailiac: cleanNumber(draft.anthropometry.skinfolds.suprailiac),
      },
      circumferences: {
        kneeHeight: cleanNumber(draft.anthropometry.circumferences.kneeHeight),
        calfCircumference: cleanNumber(draft.anthropometry.circumferences.calfCircumference),
        armCircumference: cleanNumber(draft.anthropometry.circumferences.armCircumference),
        waistCircumference: cleanNumber(draft.anthropometry.circumferences.waistCircumference),
        hipCircumference: cleanNumber(draft.anthropometry.circumferences.hipCircumference),
      },
      pesoHabitual: cleanNumber(draft.anthropometry.pesoHabitual),
    },
  };
}

export function buildClinicalRecordFromPatientDraft(patient: Partial<Patient>) {
  const variables = Array.isArray(patient.customVariables) ? patient.customVariables : [];
  const getVar = (key: string) => variables.find((item) => item.key === key)?.value;
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const num = (value: unknown) => {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  const list = (value: unknown) => (Array.isArray(value) ? value : []);

  return {
    vitalHistory: {
      occupation: text(getVar("occupation")),
      workSchedule: text(getVar("workSchedule")),
      medications: text(getVar("medications")),
      supplementsOrDrugs: text(getVar("drugsSupplements")),
      diagnosedPathologies: text(getVar("diagnosedPathologies")),
      familyHistory: text(getVar("familyHistory")),
      sleepQuality: text(getVar("sleepQuality")),
      perceivedStress: text(getVar("perceivedStress")),
      weeklyExercise: text(getVar("weeklyExercise")),
      motivoConsulta: text(getVar("motivoConsulta")),
      manualCaloriesAdjustment: num(getVar("manualCaloriesAdjustment")),
      pesoObjetivoProf: num(getVar("pesoObjetivoProf")),
    },
    gynecoObstetric: {
      isPregnant: Boolean(getVar("pregnant")),
      pregnancyWeeks: num(getVar("pregnancyWeeks")),
      pregestationalWeight: num(getVar("pregestationalWeight")),
      pregnancyType: text(getVar("pregnancyType")),
    },
    nutritionalAnamnesis: {
      eatingPreferences: text(patient.likes),
      clinicalObservations: text(patient.clinicalSummary),
      rejectedFoods: text(getVar("rejectedFoods")),
      gestationalSymptoms: list(getVar("gestationalSymptoms")),
      gestationalSupplementation: list(getVar("gestationalSupplementation")),
      diagnosticoNutricional: text(getVar("diagnosticoNutricional")),
    },
    anthropometry: {
      skinfolds: {
        tricipital: num(getVar("pliegueTricipital")),
        bicipital: num(getVar("pliegueBicipital")),
        subescapular: num(getVar("pliegueSubescapular")),
        suprailiac: num(getVar("pliegueSuprailiaco")),
      },
      circumferences: {
        kneeHeight: num(getVar("alturaRodilla")),
        calfCircumference: num(getVar("circunferenciaPantorrilla")),
        armCircumference: num(getVar("circunferenciaBraquial")),
        waistCircumference: num(getVar("circunferenciaCintura")),
        hipCircumference: num(getVar("circunferenciaCadera")),
      },
      pesoHabitual: num(getVar("pesoHabitual")),
    },
    dataSources: {
      vitalHistory: "nutritionist",
      gynecoObstetric: "nutritionist",
      nutritionalAnamnesis: "nutritionist",
      anthropometry: "nutritionist",
    },
  };
}
