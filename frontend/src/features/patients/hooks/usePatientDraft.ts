import { useState, useEffect } from "react";
import { Patient } from "../types";

const STORAGE_KEY = "nutrisaas_patient_creation_draft";

const INITIAL_STATE: Partial<Patient> = {
  fullName: "",
  email: "",
  phone: "",
  birthDate: "",
  gender: "Masculino",
  height: 170,
  weight: 70,
  dietRestrictions: [],
};

export function usePatientDraft() {
  const [draft, setDraft] = useState<Partial<Patient>>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDraft({ ...INITIAL_STATE, ...parsed });
      } catch (_) {
        console.error("Failed to parse patient draft");
        setDraft(INITIAL_STATE);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  }, [draft, isLoaded]);

  const updateDraft = (updates: Partial<Patient>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const clearDraft = () => {
    setDraft(INITIAL_STATE);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    draft,
    updateDraft,
    clearDraft,
    isLoaded,
  };
}
