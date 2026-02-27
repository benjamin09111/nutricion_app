import { Patient } from "../types";

const STORAGE_KEY = "nutrisaas_patients_db";

export const PatientStorage = {
  getAll: (): Patient[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  save: (patient: Patient): void => {
    const patients = PatientStorage.getAll();
    const index = patients.findIndex((p) => p.id === patient.id);

    if (index >= 0) {
      // Update
      patients[index] = { ...patients[index], ...patient };
    } else {
      // Create
      patients.unshift(patient);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  },

  getById: (id: string): Patient | undefined => {
    const patients = PatientStorage.getAll();
    return patients.find((p) => p.id === id);
  },

  // Helper to initialize with mocks if empty
  initialize: (mocks: Patient[]) => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mocks));
    }
  },
};
