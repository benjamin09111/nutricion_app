import { INITIAL_DEMO_DATA, type DemoState } from "./demo-data";

const DEMO_STORAGE_KEY = "nutrinet_demo_jump_chile_v2";

export type { DemoState };

export function getDemoState(): DemoState {
  if (typeof window === "undefined") {
    return INITIAL_DEMO_DATA;
  }
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_DATA));
      return INITIAL_DEMO_DATA;
    }
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    return {
      ...INITIAL_DEMO_DATA,
      ...parsed,
      groceries: parsed.groceries && parsed.groceries.length > 0 ? parsed.groceries : INITIAL_DEMO_DATA.groceries,
      intaExchanges: parsed.intaExchanges && parsed.intaExchanges.length > 0 ? parsed.intaExchanges : INITIAL_DEMO_DATA.intaExchanges,
      patients: (parsed.patients && parsed.patients.length > 0)
        ? parsed.patients.map((p, i) => ({
            ...(INITIAL_DEMO_DATA.patients[i] || INITIAL_DEMO_DATA.patients[0]),
            ...p,
          }))
        : INITIAL_DEMO_DATA.patients,
    };
  } catch (err) {
    console.error("Error reading demo data from localStorage", err);
    return INITIAL_DEMO_DATA;
  }
}

export function saveDemoState(state: DemoState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Error saving demo data to localStorage", err);
  }
}

export function resetDemoState(): DemoState {
  if (typeof window !== "undefined") {
    localStorage.removeItem(DEMO_STORAGE_KEY);
  }
  return INITIAL_DEMO_DATA;
}

