"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, SkipForward } from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  type TutorialDefinition,
  type TutorialStepDefinition,
  type TutorialStepPlacement,
} from "@/lib/tutorials";

interface TutorialLayerProps {
  tutorial: TutorialDefinition | null;
  step: TutorialStepDefinition | null;
  stepIndex: number;
  isOpen: boolean;
  onNext: () => void;
  onSkip: () => void;
}

type RectData = {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

const DEFAULT_MAX_WIDTH = 360;
const GAP = 16;

const getTargetElement = (targetId?: string) => {
  if (!targetId || typeof document === "undefined") {
    return null;
  }

  const escapedTargetId =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(targetId)
      : targetId.replace(/"/g, '\\"');
  const selector = `[data-tutorial-id="${escapedTargetId}"]`;
  return document.querySelector(selector) as HTMLElement | null;
};

const createRect = (element: HTMLElement | null): RectData | null => {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return rect;
};

const isRectInViewport = (rect: RectData) => {
  const margin = 24;
  return (
    rect.top >= margin &&
    rect.left >= margin &&
    rect.bottom <= window.innerHeight - margin &&
    rect.right <= window.innerWidth - margin
  );
};

const resolvePlacement = (
  placement: TutorialStepPlacement | undefined,
  rect: RectData | null,
) => {
  if (!rect) return "center";
  if (placement && placement !== "center") return placement;

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;

  if (spaceBelow >= 220) return "bottom";
  if (spaceAbove >= 220) return "top";

  return "bottom";
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function TutorialPopover({
  tutorial,
  step,
  stepIndex,
  onNext,
  onSkip,
  rect,
  placement,
}: {
  tutorial: TutorialDefinition;
  step: TutorialStepDefinition;
  stepIndex: number;
  rect: RectData | null;
  placement: TutorialStepPlacement;
  onNext: () => void;
  onSkip: () => void;
}) {
  const maxWidth = step.maxWidth ?? DEFAULT_MAX_WIDTH;
  const totalSteps = tutorial.steps.length;
  const currentNumber = stepIndex + 1;
  const commonClasses =
    "fixed z-[10001] w-[calc(100vw-1.5rem)] rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20";

  const style: React.CSSProperties = {
    maxWidth,
  };

  if (placement === "center" || !rect) {
    style.left = "50%";
    style.top = "50%";
    style.transform = "translate(-50%, -50%)";
  } else if (placement === "top") {
    style.left = clamp(rect.left + rect.width / 2, 12, window.innerWidth - 12);
    style.bottom = window.innerHeight - rect.top + GAP;
    style.transform = "translateX(-50%)";
  } else if (placement === "bottom") {
    style.left = clamp(rect.left + rect.width / 2, 12, window.innerWidth - 12);
    style.top = rect.bottom + GAP;
    style.transform = "translateX(-50%)";
  } else if (placement === "left") {
    style.right = window.innerWidth - rect.left + GAP;
    style.top = clamp(
      rect.top + rect.height / 2,
      88,
      window.innerHeight - 88,
    );
    style.transform = "translateY(-50%)";
  } else {
    style.left = rect.right + GAP;
    style.top = clamp(
      rect.top + rect.height / 2,
      88,
      window.innerHeight - 88,
    );
    style.transform = "translateY(-50%)";
  }

  return (
    <div className={commonClasses} style={style}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">
              {tutorial.label}
            </p>
            <h3 className="mt-1 text-base sm:text-lg font-black text-slate-900">
              {step.title}
            </h3>
          </div>

          <div className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
            Paso {currentNumber}/{totalSteps}
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-600">{step.body}</p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
          <SkipForward className="h-4 w-4" />
          Omitir
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          Continuar {currentNumber}/{totalSteps}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function TutorialLayer({
  tutorial,
  step,
  stepIndex,
  isOpen,
  onNext,
  onSkip,
}: TutorialLayerProps) {
  useScrollLock(isOpen);
  const [mounted, setMounted] = useState(false);
  const [targetRect, setTargetRect] = useState<RectData | null>(null);
  const activeTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !step) {
      setTargetRect(null);
      activeTargetRef.current = null;
      return;
    }

    const updateTarget = () => {
      const element = getTargetElement(step.targetId);
      activeTargetRef.current = element;
      setTargetRect(createRect(element));
    };

    updateTarget();

    const observer = new MutationObserver(updateTarget);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    const handleResize = () => updateTarget();
    const handleScroll = () => updateTarget();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, step]);

  useEffect(() => {
    if (!step || step.highlight !== "spotlight") {
      return;
    }

    const element = activeTargetRef.current;
    if (!element) {
      return;
    }

    const rect = createRect(element);
    if (rect && !isRectInViewport(rect)) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [step, stepIndex]);

  const placement = useMemo(
    () => resolvePlacement(step?.placement, targetRect),
    [step?.placement, targetRect],
  );

  if (!mounted || !isOpen || !tutorial || !step) {
    return null;
  }

  const renderBackdrop = step.highlight !== "none";

  const portalContent = (
    <div className="fixed inset-0 z-[10000]">
      {renderBackdrop && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
      )}

      {renderBackdrop && targetRect && (
        <div
          className="fixed pointer-events-none rounded-3xl border border-white/35"
          style={{
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.72)",
          }}
        />
      )}

      {!renderBackdrop && (
        <div className="fixed inset-0 bg-transparent" />
      )}

      <TutorialPopover
        tutorial={tutorial}
        step={step}
        stepIndex={stepIndex}
        rect={targetRect}
        placement={placement}
        onNext={onNext}
        onSkip={onSkip}
      />
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(portalContent, document.body);
}
