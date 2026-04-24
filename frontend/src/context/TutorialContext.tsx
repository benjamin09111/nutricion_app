"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  getTutorialForPath,
  getTutorialProgress,
  hasSeenTutorialCoachmark,
  hasTutorialSteps,
  markTutorialCoachmarkSeen,
  setTutorialCompleted,
  setTutorialInProgress,
  setTutorialSkipped,
  type TutorialDefinition,
  type TutorialRuntimeState,
} from "@/lib/tutorials";
import { TutorialLayer } from "@/components/tutorials/TutorialLayer";

type TutorialContextValue = {
  currentTutorial: TutorialDefinition | null;
  isTutorialAvailable: boolean;
  isTutorialOpen: boolean;
  currentStepIndex: number;
  stepCount: number;
  currentStep: TutorialDefinition["steps"][number] | null;
  openCurrentTutorial: () => void;
  nextStep: () => void;
  skipTutorial: () => void;
  closeTutorial: () => void;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

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
  const pathname = usePathname();
  const [runtimeState, setRuntimeState] = useState<TutorialRuntimeState | null>(
    null,
  );
  const [showCoachmark, setShowCoachmark] = useState(false);
  const [coachmarkSeen] = useState(() => hasSeenTutorialCoachmark());

  const currentTutorial = useMemo(
    () => getTutorialForPath(pathname || "/"),
    [pathname],
  );

  const currentProgress = useMemo(
    () =>
      currentTutorial
        ? getTutorialProgress(currentTutorial)
        : {
            status: "new",
            version: 1,
            lastStepIndex: 0,
            updatedAt: new Date().toISOString(),
          },
    [currentTutorial],
  );

  const isTutorialAvailable = hasTutorialSteps(currentTutorial);

  useEffect(() => {
    if (!currentTutorial) {
      setRuntimeState(null);
      return;
    }

    if (!isTutorialAvailable) {
      setRuntimeState(null);
      return;
    }

    setRuntimeState((currentRuntime) => {
      if (!isRuntimeState(currentRuntime)) {
        if (
          currentProgress.status === "new" ||
          currentProgress.status === "in_progress"
        ) {
          if (currentProgress.status !== "in_progress") {
            setTutorialInProgress(currentTutorial, 0);
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
  }, [currentProgress.lastStepIndex, currentProgress.status, currentTutorial, isTutorialAvailable]);

  const closeTutorial = () => {
    setRuntimeState(null);
    setShowCoachmark(false);
  };

  const openCurrentTutorial = () => {
    if (!currentTutorial || !isTutorialAvailable) {
      toast.info("Todavía no hay un tutorial configurado para esta vista.");
      return;
    }

    setShowCoachmark(false);
    const progress = getTutorialProgress(currentTutorial);
    const nextStepIndex =
      progress.status === "in_progress" ? progress.lastStepIndex : 0;

    setRuntimeState({
      tutorialId: currentTutorial.id,
      stepIndex: nextStepIndex,
      source: "manual",
    });
  };

  const nextStep = () => {
    if (!currentTutorial || !isRuntimeState(runtimeState)) {
      return;
    }

    const currentStepIndex = runtimeState.stepIndex;
    const nextIndex = currentStepIndex + 1;
    const lastIndex = currentTutorial.steps.length - 1;

    if (nextIndex > lastIndex) {
      setTutorialCompleted(currentTutorial);
      setRuntimeState(null);
      return;
    }

    setTutorialInProgress(currentTutorial, nextIndex);
    setRuntimeState({
      tutorialId: currentTutorial.id,
      stepIndex: nextIndex,
      source: runtimeState.source,
    });
  };

  const skipTutorial = () => {
    if (!currentTutorial || !isRuntimeState(runtimeState)) {
      return;
    }

    setTutorialSkipped(currentTutorial);
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
    isTutorialAvailable,
    isTutorialOpen: Boolean(activeTutorial && activeStep),
    currentStepIndex: showCoachmark ? 0 : runtimeState?.stepIndex ?? 0,
    stepCount: activeTutorial?.steps.length ?? 0,
    currentStep: activeStep,
    openCurrentTutorial,
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
