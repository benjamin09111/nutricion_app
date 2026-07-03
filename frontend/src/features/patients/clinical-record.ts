import { Patient, ClinicalRecord } from "./types";

export type ClinicalRecordSource = "patient" | "nutritionist" | "calculated";

export interface ClinicalRecordDraft {
  vitalHistory: {
    occupation: string;
    workSchedule: string;
    medications: string;
    supplementsOrDrugs: string;
    diagnosedPathologies: string;
  };
  gynecoObstetric: {
    isPregnant: boolean;
    pregnancyWeeks: string;
    pregestationalWeight: string;
  };
  nutritionalAnamnesis: {
    foodFrequency: string;
    recall24h: string;
    eatingPreferences: string;
    clinicalObservations: string;
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
  },
  gynecoObstetric: {
    isPregnant: false,
    pregnancyWeeks: "",
    pregestationalWeight: "",
  },
  nutritionalAnamnesis: {
    foodFrequency: "",
    recall24h: "",
    eatingPreferences: "",
    clinicalObservations: "",
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
  },
  dataSources: {},
};

const CUSTOM_KEY_TO_SOURCE_FIELD: Record<string, string> = {
  occupation: "vitalHistory.occupation",
  workSchedule: "vitalHistory.workSchedule",
  medications: "vitalHistory.medications",
  drugsSupplements: "vitalHistory.supplementsOrDrugs",
  diagnosedPathologies: "vitalHistory.diagnosedPathologies",
  pregnant: "gynecoObstetric.isPregnant",
  pregnancyWeeks: "gynecoObstetric.pregnancyWeeks",
  pregestationalWeight: "gynecoObstetric.pregestationalWeight",
  foodFrequency: "nutritionalAnamnesis.foodFrequency",
  recall24h: "nutritionalAnamnesis.recall24h",
  pliegueTricipital: "anthropometry.skinfolds.tricipital",
  pliegueBicipital: "anthropometry.skinfolds.bicipital",
  pliegueSubescapular: "anthropometry.skinfolds.subescapular",
  pliegueSuprailiaco: "anthropometry.skinfolds.suprailiac",
  alturaRodilla: "anthropometry.circumferences.kneeHeight",
  circunferenciaPantorrilla: "anthropometry.circumferences.calfCircumference",
  circunferenciaBraquial: "anthropometry.circumferences.armCircumference",
  circunferenciaCintura: "anthropometry.circumferences.waistCircumference",
  circunferenciaCadera: "anthropometry.circumferences.hipCircumference",
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
    };
  }

  if (clinicalRecord?.gynecoObstetric) {
    draft.gynecoObstetric = {
      ...draft.gynecoObstetric,
      isPregnant: Boolean(clinicalRecord.gynecoObstetric.isPregnant),
      pregnancyWeeks: toNumberText(clinicalRecord.gynecoObstetric.pregnancyWeeks),
      pregestationalWeight: toNumberText(clinicalRecord.gynecoObstetric.pregestationalWeight),
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
    };
  }

  const patientFallbacks: Record<string, unknown> = {
    occupation: getCustomValue(patient, "occupation"),
    workSchedule: getCustomValue(patient, "workSchedule"),
    medications: getCustomValue(patient, "medications"),
    supplementsOrDrugs: getCustomValue(patient, "drugsSupplements"),
    diagnosedPathologies: getCustomValue(patient, "diagnosedPathologies"),
    isPregnant: getCustomValue(patient, "pregnant"),
    pregnancyWeeks: getCustomValue(patient, "pregnancyWeeks"),
    pregestationalWeight: getCustomValue(patient, "pregestationalWeight"),
    foodFrequency: getCustomValue(patient, "foodFrequency"),
    recall24h: getCustomValue(patient, "recall24h"),
    eatingPreferences: patient?.likes,
    clinicalObservations: patient?.clinicalSummary,
    tricipital: getCustomValue(patient, "pliegueTricipital"),
    bicipital: getCustomValue(patient, "pliegueBicipital"),
    subescapular: getCustomValue(patient, "pliegueSubescapular"),
    suprailiac: getCustomValue(patient, "pliegueSuprailiaco"),
    kneeHeight: getCustomValue(patient, "alturaRodilla"),
    calfCircumference: getCustomValue(patient, "circunferenciaPantorrilla"),
    armCircumference: getCustomValue(patient, "circunferenciaBraquial"),
    waistCircumference: getCustomValue(patient, "circunferenciaCintura"),
    hipCircumference: getCustomValue(patient, "circunferenciaCadera"),
  };

  draft.vitalHistory = {
    occupation: draft.vitalHistory.occupation || toText(patientFallbacks.occupation),
    workSchedule: draft.vitalHistory.workSchedule || toText(patientFallbacks.workSchedule),
    medications: draft.vitalHistory.medications || toText(patientFallbacks.medications),
    supplementsOrDrugs:
      draft.vitalHistory.supplementsOrDrugs || toText(patientFallbacks.supplementsOrDrugs),
    diagnosedPathologies:
      draft.vitalHistory.diagnosedPathologies || toText(patientFallbacks.diagnosedPathologies),
  };

  draft.gynecoObstetric = {
    isPregnant: draft.gynecoObstetric.isPregnant || toBoolean(patientFallbacks.isPregnant),
    pregnancyWeeks: draft.gynecoObstetric.pregnancyWeeks || toNumberText(patientFallbacks.pregnancyWeeks),
    pregestationalWeight:
      draft.gynecoObstetric.pregestationalWeight || toNumberText(patientFallbacks.pregestationalWeight),
  };

  draft.nutritionalAnamnesis = {
    foodFrequency: draft.nutritionalAnamnesis.foodFrequency || toText(patientFallbacks.foodFrequency),
    recall24h: draft.nutritionalAnamnesis.recall24h || toText(patientFallbacks.recall24h),
    eatingPreferences:
      draft.nutritionalAnamnesis.eatingPreferences || toText(patientFallbacks.eatingPreferences),
    clinicalObservations:
      draft.nutritionalAnamnesis.clinicalObservations || toText(patientFallbacks.clinicalObservations),
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
    },
    gynecoObstetric: {
      isPregnant: draft.gynecoObstetric.isPregnant,
      pregnancyWeeks: cleanNumber(draft.gynecoObstetric.pregnancyWeeks),
      pregestationalWeight: cleanNumber(draft.gynecoObstetric.pregestationalWeight),
    },
    nutritionalAnamnesis: {
      foodFrequency: cleanText(draft.nutritionalAnamnesis.foodFrequency),
      recall24h: cleanText(draft.nutritionalAnamnesis.recall24h),
      eatingPreferences: cleanText(draft.nutritionalAnamnesis.eatingPreferences),
      clinicalObservations: cleanText(draft.nutritionalAnamnesis.clinicalObservations),
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

  return {
    vitalHistory: {
      occupation: text(getVar("occupation")),
      workSchedule: text(getVar("workSchedule")),
      medications: text(getVar("medications")),
      supplementsOrDrugs: text(getVar("drugsSupplements")),
      diagnosedPathologies: text(getVar("diagnosedPathologies")),
    },
    gynecoObstetric: {
      isPregnant: Boolean(getVar("pregnant")),
      pregnancyWeeks: num(getVar("pregnancyWeeks")),
      pregestationalWeight: num(getVar("pregestationalWeight")),
    },
    nutritionalAnamnesis: {
      foodFrequency: text(getVar("foodFrequency")),
      recall24h: text(getVar("recall24h")),
      eatingPreferences: text(patient.likes),
      clinicalObservations: text(patient.clinicalSummary),
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
    },
    dataSources: {
      vitalHistory: "nutritionist",
      gynecoObstetric: "nutritionist",
      nutritionalAnamnesis: "nutritionist",
      anthropometry: "nutritionist",
    },
  };
}
