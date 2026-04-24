import tutorialRegistryData from "@/content/tutorial-registry.json";
import { tutorialContentById } from "@/content/tutorials";

export type TutorialStatus = "planned" | "ready" | "disabled";
export type TutorialProgressStatus =
  | "new"
  | "in_progress"
  | "completed"
  | "skipped";
export type TutorialStepHighlight = "spotlight" | "none";
export type TutorialStepPlacement = "top" | "bottom" | "left" | "right" | "center";
export type TutorialLaunchSource = "auto" | "manual" | "coachmark";

export interface TutorialRegistryEntry {
  id: string;
  moduleKey: string;
  label: string;
  routePatterns: string[];
  status: TutorialStatus;
}

export interface TutorialStepDefinition {
  id: string;
  targetId?: string;
  title: string;
  body: string;
  placement?: TutorialStepPlacement;
  highlight?: TutorialStepHighlight;
  allowInteraction?: boolean;
  offset?: number;
  maxWidth?: number;
}

export interface TutorialContentDefinition {
  id: string;
  label: string;
  version: number;
  steps: TutorialStepDefinition[];
}

export interface TutorialDefinition extends TutorialRegistryEntry {
  version: number;
  steps: TutorialStepDefinition[];
}

export interface TutorialPersistedProgress {
  status: TutorialProgressStatus;
  version: number;
  lastStepIndex: number;
  updatedAt: string;
}

export interface TutorialStore {
  tutorials: Record<string, TutorialPersistedProgress>;
  hasSeenTutorialCoachmark: boolean;
}

export interface TutorialRuntimeState {
  tutorialId: string | null;
  stepIndex: number;
  source: TutorialLaunchSource | null;
}

export const TUTORIAL_STORE_KEY = "nutri_tutorial_store_v1";
export const TUTORIAL_TRIGGER_TARGET_ID = "tutorial-trigger";

export const tutorialRegistry =
  tutorialRegistryData as TutorialRegistryEntry[];

export const normalizePath = (pathname: string) => {
  if (!pathname) return "/";
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
};

export const matchesPattern = (pathname: string, pattern: string) => {
  const normalizedPath = normalizePath(pathname);
  const normalizedPattern = normalizePath(pattern);

  if (normalizedPattern.endsWith("/*")) {
    const prefix = normalizedPattern.slice(0, -2);
    return (
      normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
    );
  }

  return normalizedPath === normalizedPattern;
};

export const getTutorialRegistryEntryForPath = (pathname: string) =>
  tutorialRegistry.find((entry) =>
    entry.routePatterns.some((pattern) => matchesPattern(pathname, pattern)),
  );

export const getTutorialDefinitionById = (tutorialId: string) => {
  const registryEntry = tutorialRegistry.find((entry) => entry.id === tutorialId);
  const contentEntry = tutorialContentById[tutorialId];

  if (!registryEntry || !contentEntry) {
    return null;
  }

  return {
    ...registryEntry,
    version: contentEntry.version,
    steps: contentEntry.steps,
  } satisfies TutorialDefinition;
};

export const getTutorialForPath = (pathname: string) => {
  const registryEntry = getTutorialRegistryEntryForPath(pathname);

  if (!registryEntry) {
    return null;
  }

  return getTutorialDefinitionById(registryEntry.id);
};

export const hasTutorialSteps = (tutorial: TutorialDefinition | null) =>
  Boolean(tutorial && tutorial.steps.length > 0);

export const createDefaultProgress = (
  tutorial: TutorialDefinition,
): TutorialPersistedProgress => ({
  status: "new",
  version: tutorial.version,
  lastStepIndex: 0,
  updatedAt: new Date().toISOString(),
});

export const normalizeProgress = (
  tutorial: TutorialDefinition,
  progress?: TutorialPersistedProgress,
): TutorialPersistedProgress => {
  if (!progress || progress.version !== tutorial.version) {
    return createDefaultProgress(tutorial);
  }

  return progress;
};

const readStore = (): TutorialStore => {
  if (typeof window === "undefined") {
    return { tutorials: {}, hasSeenTutorialCoachmark: false };
  }

  const raw = window.localStorage.getItem(TUTORIAL_STORE_KEY);
  if (!raw) {
    return { tutorials: {}, hasSeenTutorialCoachmark: false };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TutorialStore>;
    return {
      tutorials: parsed.tutorials ?? {},
      hasSeenTutorialCoachmark:
        parsed.hasSeenTutorialCoachmark === true,
    };
  } catch {
    return { tutorials: {}, hasSeenTutorialCoachmark: false };
  }
};

const writeStore = (store: TutorialStore) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TUTORIAL_STORE_KEY, JSON.stringify(store));
};

export const getTutorialProgress = (
  tutorial: TutorialDefinition,
): TutorialPersistedProgress => {
  const store = readStore();
  return normalizeProgress(tutorial, store.tutorials[tutorial.id]);
};

export const setTutorialProgress = (
  tutorialId: string,
  progress: TutorialPersistedProgress,
) => {
  const store = readStore();
  store.tutorials = {
    ...store.tutorials,
    [tutorialId]: progress,
  };
  writeStore(store);
};

export const markTutorialCoachmarkSeen = () => {
  const store = readStore();
  if (store.hasSeenTutorialCoachmark) return;
  writeStore({
    ...store,
    hasSeenTutorialCoachmark: true,
  });
};

export const hasSeenTutorialCoachmark = () =>
  readStore().hasSeenTutorialCoachmark;

export const setTutorialSkipped = (tutorial: TutorialDefinition) => {
  setTutorialProgress(tutorial.id, {
    status: "skipped",
    version: tutorial.version,
    lastStepIndex: Math.max(0, tutorial.steps.length - 1),
    updatedAt: new Date().toISOString(),
  });
};

export const setTutorialCompleted = (tutorial: TutorialDefinition) => {
  setTutorialProgress(tutorial.id, {
    status: "completed",
    version: tutorial.version,
    lastStepIndex: Math.max(0, tutorial.steps.length - 1),
    updatedAt: new Date().toISOString(),
  });
};

export const setTutorialInProgress = (
  tutorial: TutorialDefinition,
  lastStepIndex: number,
) => {
  setTutorialProgress(tutorial.id, {
    status: "in_progress",
    version: tutorial.version,
    lastStepIndex: Math.max(
      0,
      Math.min(lastStepIndex, Math.max(0, tutorial.steps.length - 1)),
    ),
    updatedAt: new Date().toISOString(),
  });
};

