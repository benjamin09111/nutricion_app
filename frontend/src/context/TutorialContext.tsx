"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  getTutorialForPath,
  getTutorialProgress,
  getLastTutorialContextPath,
  hasSeenTutorialCoachmark,
  hasTutorialSteps,
  markTutorialCoachmarkSeen,
  setLastTutorialContextPath,
  setTutorialCompleted,
  setTutorialInProgress,
  setTutorialSkipped,
  setTutorialStore,
  type TutorialDefinition,
  type TutorialPersistedProgress,
  type TutorialRuntimeState,
} from "@/lib/tutorials";
import { tutorialContentById } from "@/content/tutorials";
import { TutorialLayer } from "@/components/tutorials/TutorialLayer";
import { useAdmin } from "./AdminContext";
import {
  loadTutorialStoreFromServer,
  saveTutorialProgressToServer,
} from "@/lib/tutorial-progress-api";

type TutorialContextValue = {
  currentTutorial: TutorialDefinition | null;
  launchableTutorial: TutorialDefinition | null;
  isTutorialAvailable: boolean;
  isTutorialOpen: boolean;
  isIntroTutorialActive: boolean;
  currentStepIndex: number;
  stepCount: number;
  currentStep: TutorialDefinition["steps"][number] | null;
  openCurrentTutorial: () => void;
  openLaunchableTutorial: () => void;
  nextStep: () => void;
  skipTutorial: () => void;
  closeTutorial: () => void;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

const INTRO_BETA_TUTORIAL: TutorialDefinition = {
  id: "introBeta",
  moduleKey: "introBeta",
  label: "Introducción Beta",
  routePatterns: ["/dashboard/*"],
  status: "ready",
  version: tutorialContentById.introBeta.version,
  steps: tutorialContentById.introBeta.steps,
};

const TUTORIAL_TRIGGER_COACHMARK: TutorialDefinition = {
  id: "__tutorial_trigger_coachmark__",
  moduleKey: "__tutorial_trigger_coachmark__",
  label: "Tutoriales",
  routePatterns: ["/dashboard/*"],
  status: "ready",
  version: 1,
  steps: [
    {
      id: "tutorial-trigger-coachmark-step",
      targetId: "tutorial-trigger",
      title: "Volver a abrir tutoriales",
      body:
        "Desde este botón puedes reactivar el tutorial del módulo actual cuando quieras.",
      placement: "bottom",
      highlight: "spotlight",
      allowInteraction: false,
      offset: 14,
      maxWidth: 320,
    },
  ],
};

function isRuntimeState(
  value: TutorialRuntimeState | null,
): value is TutorialRuntimeState {
  return Boolean(value && value.tutorialId);
}

export function TutorialProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const pathname = usePathname();
  const [runtimeState, setRuntimeState] = useState<TutorialRuntimeState | null>(
    null,
  );
  const [showCoachmark, setShowCoachmark] = useState(false);
  const [isTutorialStoreHydrated, setIsTutorialStoreHydrated] = useState(false);
  const [coachmarkSeen, setCoachmarkSeen] = useState(
    () => hasSeenTutorialCoachmark(),
  );

  const currentTutorial = useMemo(
    () => getTutorialForPath(pathname || "/"),
    [pathname],
  );

  const currentProgress = currentTutorial
    ? getTutorialProgress(currentTutorial)
    : {
        status: "new",
        version: 1,
        lastStepIndex: 0,
        updatedAt: new Date().toISOString(),
      };

  const isTutorialAvailable = hasTutorialSteps(currentTutorial);
  const launchableTutorial = useMemo(() => {
    if (isTutorialAvailable && currentTutorial) {
      return currentTutorial;
    }

    const lastContextPath = getLastTutorialContextPath();
    if (!lastContextPath) {
      return null;
    }

    const contextualTutorial = getTutorialForPath(lastContextPath);
    return hasTutorialSteps(contextualTutorial) ? contextualTutorial : null;
  }, [currentTutorial, isTutorialAvailable]);
  const introProgress = getTutorialProgress(INTRO_BETA_TUTORIAL);

  const persistTutorialProgress = useCallback(
    (
      tutorial: TutorialDefinition,
      progress: TutorialPersistedProgress,
      hasSeenCoachmark?: boolean,
    ) => {
      void saveTutorialProgressToServer({
        tutorialId: tutorial.id,
        progress,
        hasSeenTutorialCoachmark: hasSeenCoachmark,
      })
        .then((serverStore) => {
          if (!serverStore) {
            return;
          }

          setTutorialStore(serverStore);
          setCoachmarkSeen(serverStore.hasSeenTutorialCoachmark);
        })
        .catch(() => {
          // Keep the local cache as the fallback.
        });
    },
    [],
  );

  const markTutorialInProgress = useCallback(
    (tutorial: TutorialDefinition, stepIndex: number) => {
      const progress = {
        status: "in_progress" as const,
        version: tutorial.version,
        lastStepIndex: Math.max(
          0,
          Math.min(stepIndex, Math.max(0, tutorial.steps.length - 1)),
        ),
        updatedAt: new Date().toISOString(),
      };

      setTutorialInProgress(tutorial, stepIndex);
      persistTutorialProgress(tutorial, progress);
    },
    [persistTutorialProgress],
  );

  const markTutorialAsCompleted = useCallback((tutorial: TutorialDefinition) => {
    const progress = {
      status: "completed" as const,
      version: tutorial.version,
      lastStepIndex: Math.max(0, tutorial.steps.length - 1),
      updatedAt: new Date().toISOString(),
    };

    setTutorialCompleted(tutorial);
    persistTutorialProgress(tutorial, progress);
  }, [persistTutorialProgress]);

  const markTutorialAsSkipped = useCallback((tutorial: TutorialDefinition) => {
    const progress = {
      status: "skipped" as const,
      version: tutorial.version,
      lastStepIndex: Math.max(0, tutorial.steps.length - 1),
      updatedAt: new Date().toISOString(),
    };

    setTutorialSkipped(tutorial);
    persistTutorialProgress(tutorial, progress, true);
  }, [persistTutorialProgress]);

  useEffect(() => {
    let cancelled = false;

    const hydrateTutorialStore = async () => {
      if (isAdminLoading) {
        return;
      }

      if (isAdmin) {
        setIsTutorialStoreHydrated(true);
        return;
      }

      const serverStore = await loadTutorialStoreFromServer();

      if (cancelled) {
        return;
      }

      if (serverStore) {
        setTutorialStore(serverStore);
        setCoachmarkSeen(serverStore.hasSeenTutorialCoachmark);
      }

      setIsTutorialStoreHydrated(true);
    };

    void hydrateTutorialStore();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, isAdminLoading]);

  useEffect(() => {
    if (
      !isTutorialStoreHydrated ||
      !pathname ||
      !currentTutorial ||
      !hasTutorialSteps(currentTutorial) ||
      currentTutorial.id === INTRO_BETA_TUTORIAL.id
    ) {
      return;
    }

    setLastTutorialContextPath(pathname);
  }, [currentTutorial, isTutorialStoreHydrated, pathname]);

  useEffect(() => {
    if (
      !isTutorialStoreHydrated ||
      !pathname?.startsWith("/dashboard") ||
      isAdminLoading ||
      isAdmin
    ) {
      return;
    }

    if (
      introProgress.status === "new" ||
      introProgress.status === "in_progress"
    ) {
      setRuntimeState((currentRuntime) => {
        if (currentRuntime?.tutorialId === INTRO_BETA_TUTORIAL.id) {
          return {
            tutorialId: INTRO_BETA_TUTORIAL.id,
            stepIndex: introProgress.lastStepIndex,
            source: "auto",
          };
        }

        if (introProgress.status !== "in_progress") {
          markTutorialInProgress(INTRO_BETA_TUTORIAL, 0);
        }

        return {
          tutorialId: INTRO_BETA_TUTORIAL.id,
          stepIndex: introProgress.lastStepIndex,
          source: "auto",
        };
      });
      return;
    }
  }, [
    introProgress.lastStepIndex,
    introProgress.status,
    pathname,
    isAdmin,
    isAdminLoading,
    isTutorialStoreHydrated,
    markTutorialInProgress,
  ]);

  useEffect(() => {
    if (
      !isTutorialStoreHydrated ||
      !currentTutorial ||
      isAdminLoading ||
      isAdmin
    ) {
      return;
    }

    if (!isTutorialAvailable) {
      return;
    }

    setRuntimeState((currentRuntime) => {
      if (currentRuntime?.tutorialId === INTRO_BETA_TUTORIAL.id) {
        return currentRuntime;
      }

      if (!isRuntimeState(currentRuntime)) {
        if (
          currentProgress.status === "new" ||
          currentProgress.status === "in_progress"
        ) {
          if (currentProgress.status !== "in_progress") {
            markTutorialInProgress(currentTutorial, 0);
          }
          return {
            tutorialId: currentTutorial.id,
            stepIndex: currentProgress.lastStepIndex,
            source: "auto",
          };
        }
        return null;
      }

      if (currentRuntime.tutorialId !== currentTutorial.id) {
        return null;
      }

      return currentRuntime;
    });
  }, [
    currentProgress.lastStepIndex,
    currentProgress.status,
    currentTutorial,
    isTutorialAvailable,
    runtimeState?.tutorialId,
    isAdmin,
    isAdminLoading,
    isTutorialStoreHydrated,
    markTutorialInProgress,
  ]);

  const closeTutorial = () => {
    if (runtimeState?.tutorialId === INTRO_BETA_TUTORIAL.id) {
      return;
    }
    setRuntimeState(null);
    setShowCoachmark(false);
  };

  const openCurrentTutorial = () => {
    if (!launchableTutorial) {
      toast.info("Todavía no hay un tutorial configurado para esta vista.");
      return;
    }

    setShowCoachmark(false);
    const progress = getTutorialProgress(launchableTutorial);
    const nextStepIndex =
      progress.status === "in_progress" ? progress.lastStepIndex : 0;

    setRuntimeState({
      tutorialId: launchableTutorial.id,
      stepIndex: nextStepIndex,
      source: "manual",
    });
  };

  const nextStep = () => {
    if (!isRuntimeState(runtimeState)) {
      return;
    }

    const activeBaseTutorial =
      runtimeState.tutorialId === INTRO_BETA_TUTORIAL.id
        ? INTRO_BETA_TUTORIAL
        : currentTutorial;

    if (!activeBaseTutorial) return;

    const currentStepIndex = runtimeState.stepIndex;
    const nextIndex = currentStepIndex + 1;
    const lastIndex = activeBaseTutorial.steps.length - 1;

    if (nextIndex > lastIndex) {
      markTutorialAsCompleted(activeBaseTutorial);
      setRuntimeState(null);
      return;
    }

    markTutorialInProgress(activeBaseTutorial, nextIndex);
    setRuntimeState({
      tutorialId: activeBaseTutorial.id,
      stepIndex: nextIndex,
      source: runtimeState.source,
    });
  };

  const skipTutorial = () => {
    if (runtimeState?.tutorialId === INTRO_BETA_TUTORIAL.id) {
      return;
    }

    if (!currentTutorial || !isRuntimeState(runtimeState)) {
      return;
    }

    markTutorialAsSkipped(currentTutorial);
    setRuntimeState(null);

    if (!coachmarkSeen) {
      markTutorialCoachmarkSeen();
      setCoachmarkSeen(true);
      setShowCoachmark(true);
    }
  };

  const activeTutorial = useMemo(() => {
    if (showCoachmark) {
      return TUTORIAL_TRIGGER_COACHMARK;
    }

    if (runtimeState?.tutorialId === INTRO_BETA_TUTORIAL.id) {
      return INTRO_BETA_TUTORIAL;
    }

    if (!currentTutorial || !isRuntimeState(runtimeState)) {
      return null;
    }

    if (runtimeState.tutorialId !== currentTutorial.id) {
      return null;
    }

    return currentTutorial;
  }, [currentTutorial, runtimeState, showCoachmark]);

  const activeStep = useMemo(() => {
    if (!activeTutorial) {
      return null;
    }

    if (showCoachmark) {
      return activeTutorial.steps[0] ?? null;
    }

    return activeTutorial.steps[runtimeState?.stepIndex ?? 0] ?? null;
  }, [activeTutorial, runtimeState?.stepIndex, showCoachmark]);

  const contextValue: TutorialContextValue = {
    currentTutorial,
    launchableTutorial,
    isTutorialAvailable,
    isTutorialOpen: Boolean(activeTutorial && activeStep),
    isIntroTutorialActive: activeTutorial?.id === INTRO_BETA_TUTORIAL.id,
    currentStepIndex: showCoachmark ? 0 : runtimeState?.stepIndex ?? 0,
    stepCount: activeTutorial?.steps.length ?? 0,
    currentStep: activeStep,
    openCurrentTutorial,
    openLaunchableTutorial: openCurrentTutorial,
    nextStep: showCoachmark
      ? () => {
          setShowCoachmark(false);
        }
      : nextStep,
    skipTutorial: showCoachmark
      ? () => {
          setShowCoachmark(false);
        }
      : skipTutorial,
    closeTutorial,
  };

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
      <TutorialLayer
        tutorial={activeTutorial}
        step={activeStep}
        stepIndex={showCoachmark ? 0 : runtimeState?.stepIndex ?? 0}
        isOpen={Boolean(activeTutorial && activeStep)}
        onNext={
          showCoachmark
            ? () => {
                setShowCoachmark(false);
              }
            : nextStep
        }
        onSkip={
          showCoachmark
            ? () => {
                setShowCoachmark(false);
              }
            : skipTutorial
        }
      />
    </TutorialContext.Provider>
  );
}

export function useTutorials() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorials must be used within a TutorialProvider");
  }
  return context;
}
