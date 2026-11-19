import type { PlanContext } from "../types/plan-context.types";

export const QUICK_PLAN_DRAFT_KEY = "nutri_quick_deliverable_draft";
export const LEGACY_QUICK_PLAN_DRAFT_KEY = "nutri_pauta_alimentacion_draft";

export type QuickPlanDraft = Record<string, any> & {
  planContext?: PlanContext;
};

const readJson = <T>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const readQuickPlanDraft = (): QuickPlanDraft | null =>
  readJson<QuickPlanDraft>(QUICK_PLAN_DRAFT_KEY) ||
  readJson<QuickPlanDraft>(LEGACY_QUICK_PLAN_DRAFT_KEY);

export const writeQuickPlanDraft = (draft: QuickPlanDraft) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(QUICK_PLAN_DRAFT_KEY, JSON.stringify(draft));
};

export const clearQuickPlanDraft = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(QUICK_PLAN_DRAFT_KEY);
  window.localStorage.removeItem(LEGACY_QUICK_PLAN_DRAFT_KEY);
};
