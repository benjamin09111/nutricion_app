type WorkflowDraft = Record<string, any>;

export const buildWorkflowContextPreview = (draft: WorkflowDraft | null) => {
  const patient = draft?.patientMeta || {};

  return {
    schemaVersion: "1.0",
    creation: {
      type: "WORKFLOW",
      mode: patient?.id ? "CLINICAL" : "GENERAL",
      title: "Flujo clínico acumulado",
    },
    patient: {
      source: patient?.id ? "imported" : "general",
      demographics: {
        ...(patient?.gender ? { sex: patient.gender } : {}),
        ...(patient?.ageYears !== undefined ? { ageYears: patient.ageYears } : {}),
      },
      biometrics: {
        ...(patient?.weight !== undefined ? { weightKg: patient.weight } : {}),
        ...(patient?.height !== undefined ? { heightCm: patient.height } : {}),
      },
      lifestyle: {
        ...(patient?.activityLevel ? { activityLevel: patient.activityLevel } : {}),
        habits: Array.isArray(patient?.habits) ? patient.habits : [],
      },
      clinical: {
        conditions: patient?.primaryCondition ? [patient.primaryCondition] : [],
        restrictions: Array.isArray(patient?.restrictions) ? patient.restrictions : [],
        allergies: Array.isArray(patient?.allergies) ? patient.allergies : [],
        medications: Array.isArray(patient?.medications) ? patient.medications : [],
        ...(patient?.clinicalSummary ? { clinicalSummary: patient.clinicalSummary } : {}),
      },
      preferences: {
        likes: patient?.likes ? [patient.likes] : [],
        dislikedFoods: Array.isArray(patient?.dislikedFoods) ? patient.dislikedFoods : [],
      },
      goals: {
        ...(patient?.nutritionalFocus ? { primary: patient.nutritionalFocus } : {}),
        fitnessGoals: patient?.fitnessGoals ? [patient.fitnessGoals] : [],
      },
    },
    plan: {
      diet: draft?.diet || null,
      recipes: draft?.recipes || null,
      cart: draft?.cart || null,
      deliverable: draft?.deliverable || null,
    },
  };
};
