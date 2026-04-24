"use client";

import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTutorials } from "@/context/TutorialContext";

export function TutorialTrigger() {
  const {
    currentTutorial,
    isTutorialAvailable,
    isTutorialOpen,
    openCurrentTutorial,
  } = useTutorials();

  const isDisabled = !currentTutorial || !isTutorialAvailable;

  return (
    <button
      type="button"
      onClick={openCurrentTutorial}
      title={
        currentTutorial
          ? `Abrir tutorial de ${currentTutorial.label}`
          : "Tutorial no disponible en esta vista"
      }
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border p-2 transition-all outline-none",
        isDisabled
          ? "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100"
          : "border-emerald-100 bg-emerald-50 text-emerald-600 hover:border-emerald-200 hover:bg-emerald-100",
      )}
      aria-pressed={isTutorialOpen}
      aria-label={
        currentTutorial
          ? `Abrir tutorial de ${currentTutorial.label}`
          : "Tutorial no disponible"
      }
      data-tutorial-id="tutorial-trigger"
    >
      <CircleHelp className="h-5 w-5" />
      {!isDisabled && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </button>
  );
}
