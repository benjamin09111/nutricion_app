"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleHelp } from "lucide-react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  buildTutorialLaunchState,
  getTutorialForPath,
  TUTORIAL_STATE_STORAGE_KEY,
} from "@/lib/tutorials";

export function TutorialTrigger() {
  const pathname = usePathname();
  const tutorial = useMemo(
    () => getTutorialForPath(pathname || "/"),
    [pathname],
  );
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const storedState = sessionStorage.getItem(TUTORIAL_STATE_STORAGE_KEY);
    if (!storedState || !tutorial) {
      setIsActive(false);
      return;
    }

    try {
      const parsedState = JSON.parse(storedState);
      setIsActive(
        parsedState.active === true && parsedState.tutorialId === tutorial.id,
      );
    } catch (_) {
      setIsActive(false);
    }
  }, [tutorial, pathname]);

  const handleToggle = () => {
    if (!tutorial) {
      toast.info("Esta vista todavía no tiene tutorial configurado.");
      return;
    }

    const nextActive = !isActive;
    const nextState = buildTutorialLaunchState(
      pathname || "/",
      tutorial,
      nextActive,
    );

    sessionStorage.setItem(
      TUTORIAL_STATE_STORAGE_KEY,
      JSON.stringify(nextState),
    );
    window.dispatchEvent(
      new CustomEvent("nutri:tutorial:toggle", { detail: nextState }),
    );
    setIsActive(nextActive);

    toast.info(
      nextActive
        ? `Tutorial base activado para ${tutorial.label}.`
        : `Tutorial base desactivado para ${tutorial.label}.`,
    );
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={
        tutorial
          ? `Activar tutorial de ${tutorial.label}`
          : "Tutorial no disponible en esta vista"
      }
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border p-2 transition-all outline-none",
        tutorial
          ? "border-emerald-100 bg-emerald-50 text-emerald-600 hover:border-emerald-200 hover:bg-emerald-100"
          : "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100",
        isActive && "border-emerald-300 bg-emerald-100 text-emerald-700",
      )}
      aria-pressed={isActive}
      aria-label={
        tutorial
          ? `Activar tutorial de ${tutorial.label}`
          : "Tutorial no disponible"
      }
    >
      <CircleHelp className="h-5 w-5" />
      {tutorial && (
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
            isActive ? "bg-emerald-500" : "bg-slate-300",
          )}
        />
      )}
    </button>
  );
}
