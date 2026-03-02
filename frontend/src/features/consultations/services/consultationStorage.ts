import { Consultation } from "../types";

const STORAGE_KEY = "nutrisaas_consultations_db";

export const ConsultationStorage = {
  getAll: (): Consultation[] => {
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

  save: (consultation: Consultation): void => {
    const consultations = ConsultationStorage.getAll();
    const index = consultations.findIndex((c) => c.id === consultation.id);

    if (index >= 0) {
      consultations[index] = { ...consultations[index], ...consultation };
    } else {
      consultations.unshift(consultation);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(consultations));
  },

  getByPatientId: (patientId: string): Consultation[] => {
    const consultations = ConsultationStorage.getAll();
    return consultations
      .filter((c) => c.patientId === patientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getDraft: (): Partial<Consultation> | null => {
    if (typeof window === "undefined") return null;
    const draft = localStorage.getItem(STORAGE_KEY + "_draft");
    return draft ? JSON.parse(draft) : null;
  },

  saveDraft: (draft: Partial<Consultation>): void => {
    localStorage.setItem(STORAGE_KEY + "_draft", JSON.stringify(draft));
  },

  clearDraft: (): void => {
    localStorage.removeItem(STORAGE_KEY + "_draft");
  },

  initialize: (mocks: Consultation[]) => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mocks));
    }
  },
};
