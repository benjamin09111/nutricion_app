"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
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

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const spaceRight = window.innerWidth - rect.right;
  const spaceLeft = rect.left;

  if (placement && placement !== "center") {
    if (placement === "bottom" && spaceBelow >= 220) return "bottom";
    if (placement === "top" && spaceAbove >= 220) return "top";
    if (placement === "right" && spaceRight >= 320) return "right";
    if (placement === "left" && spaceLeft >= 320) return "left";

    if (spaceBelow >= 220) return "bottom";
    if (spaceAbove >= 220) return "top";
    if (spaceRight >= 320) return "right";
    if (spaceLeft >= 320) return "left";
    return "center";
  }

  if (spaceBelow >= 220) return "bottom";
  if (spaceAbove >= 220) return "top";
  if (spaceRight >= 320) return "right";
  if (spaceLeft >= 320) return "left";

  return "center";
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const renderInlineRichText = (text: string) => {
  const normalizedText = text.replace(/\\n/g, "\n");
  const segments = normalizedText.split(/(\*\*.*?\*\*)/g);

  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return (
        <strong key={`${segment}-${index}`} className="font-black text-slate-900">
          {segment.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
};

const renderStructuredText = (text: string) => {
  const normalizedText = text.replace(/\\n/g, "\n");
  const paragraphs = normalizedText.split("\n\n");

  return paragraphs.map((paragraph, index) => {
    if (paragraph.includes("\n- ")) {
      const [intro, ...bullets] = paragraph.split("\n- ");
      return (
        <div key={`${paragraph}-${index}`} className="space-y-3">
          {intro ? <p>{renderInlineRichText(intro)}</p> : null}
          <ul className="space-y-2 pl-5">
            {bullets.map((bullet) => (
              <li key={bullet} className="list-disc marker:text-emerald-500">
                {renderInlineRichText(bullet)}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    return <p key={`${paragraph}-${index}`}>{renderInlineRichText(paragraph)}</p>;
  });
};

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
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">
              {tutorial.label}
            </p>
            <h3 className="mt-1 text-base sm:text-lg font-black text-slate-900">
              {step.title}
            </h3>
          </div>

          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Paso {currentNumber}/{totalSteps}
            </div>
            <div className="relative hidden h-16 w-16 shrink-0 sm:block">
              <Image
                src="/nutria.webp"
                alt="Nutria guia"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 pr-0 text-sm leading-6 text-slate-600 sm:pr-8">
          {renderStructuredText(step.body)}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          {step.nextLabel || `Continuar ${currentNumber}/${totalSteps}`}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function IntroBetaTutorial({
  tutorial,
  step,
  stepIndex,
  onNext,
}: {
  tutorial: TutorialDefinition;
  step: TutorialStepDefinition;
  stepIndex: number;
  onNext: () => void;
}) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setAccepted(false);
  }, [step.id]);

  const totalSteps = tutorial.steps.length;
  const isBlocked = step.requireCheckbox && !accepted;

  return (
    <div className="fixed inset-0 z-[10000] overflow-auto bg-[#fcfdf8]">
      <div className="pointer-events-none absolute inset-0">
        <div className="leaf leaf-one" />
        <div className="leaf leaf-two" />
        <div className="leaf leaf-three" />
        <div className="leaf leaf-four" />
        <div className="leaf leaf-five" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(circle_at_bottom,rgba(134,239,172,0.14),transparent_65%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:flex-row lg:gap-8 lg:px-12">
        <div className="relative w-full max-w-2xl">
          <div className="pointer-events-none absolute -right-14 bottom-24 hidden lg:block">
            <div className="relative h-20 w-24">
              <div className="absolute right-8 top-2 h-8 w-8 rotate-12 rounded-[0.9rem] border border-slate-200 bg-white shadow-[0_14px_28px_-22px_rgba(15,23,42,0.3)]" />
              <div className="absolute right-1 bottom-0 h-12 w-12 rotate-[28deg] rounded-[1rem] border border-slate-200 bg-white shadow-[0_14px_28px_-22px_rgba(15,23,42,0.3)]" />
            </div>
          </div>
          <div className="relative rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.28)] sm:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-600">
                  NutriNet Beta
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                  {step.title}
                </h2>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-500 shrink-0">
                Paso {stepIndex + 1}/{totalSteps}
              </div>
            </div>

            <div className="space-y-4 text-base leading-7 text-slate-600 sm:leading-8">
              {renderStructuredText(step.body)}
            </div>

            {step.requireCheckbox && step.checkboxLabel ? (
              <label className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600"
                />
                <span>{renderInlineRichText(step.checkboxLabel)}</span>
              </label>
            ) : null}

            <div className="mt-8 flex w-full justify-end">
              <button
                type="button"
                onClick={onNext}
                disabled={isBlocked}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              >
                {step.nextLabel || "Continuar"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-md items-end justify-end lg:hidden">
          <div className="relative h-[320px] w-full sm:h-[400px]">
            <div className="absolute inset-x-10 bottom-6 h-16 rounded-full bg-emerald-100/60 blur-2xl" />
            <Image
              src="/nutria.webp"
              alt="Nutria guía de NutriNet"
              fill
              className="object-contain object-right drop-shadow-[0_24px_30px_rgba(15,23,42,0.18)]"
              priority
            />
          </div>
        </div>

        <div className="hidden w-full max-w-md items-end justify-end lg:flex">
          <div className="relative h-[590px] w-full">
            <div className="absolute inset-x-10 bottom-6 h-16 rounded-full bg-emerald-100/60 blur-2xl" />
            <Image
              src="/nutria.webp"
              alt="Nutria guía de NutriNet"
              fill
              className="object-contain object-right drop-shadow-[0_24px_30px_rgba(15,23,42,0.18)]"
              priority
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .leaf {
          position: absolute;
          border-radius: 6% 94% 7% 93% / 69% 31% 69% 31%;
          opacity: 0.16;
          background: linear-gradient(180deg, #86efac 0%, #34d399 100%);
          animation: floatLeaf 14s ease-in-out infinite;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
        }

        .leaf::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 10%;
          width: 2px;
          height: 78%;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.08);
          transform: translateX(-50%);
        }

        .leaf::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 46%;
          width: 55%;
          height: 1px;
          background: rgba(15, 23, 42, 0.05);
          transform: translateX(-50%) rotate(-28deg);
          transform-origin: left center;
        }

        .leaf-one {
          left: 6%;
          top: 12%;
          width: 108px;
          height: 168px;
          --leaf-rotation: -24deg;
        }

        .leaf-two {
          left: 18%;
          bottom: 10%;
          width: 86px;
          height: 130px;
          --leaf-rotation: 20deg;
          animation-delay: -5s;
        }

        .leaf-three {
          right: 14%;
          top: 10%;
          width: 116px;
          height: 178px;
          --leaf-rotation: 24deg;
          animation-delay: -8s;
        }

        .leaf-four {
          right: 5%;
          bottom: 18%;
          width: 92px;
          height: 138px;
          --leaf-rotation: -18deg;
          animation-delay: -2s;
        }

        .leaf-five {
          left: 48%;
          top: 7%;
          width: 62px;
          height: 96px;
          --leaf-rotation: 10deg;
          animation-delay: -11s;
        }

        @keyframes floatLeaf {
          0%,
          100% {
            transform: translateY(0px) rotate(var(--leaf-rotation));
          }
          50% {
            transform: translateY(-16px) rotate(calc(var(--leaf-rotation) + 4deg));
          }
        }
      `}</style>
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

  if (tutorial.id === "introBeta") {
    return createPortal(
      <IntroBetaTutorial
        tutorial={tutorial}
        step={step}
        stepIndex={stepIndex}
        onNext={onNext}
      />,
      document.body,
    );
  }

  const renderBackdrop = step.highlight !== "none";

  const portalContent = (
    <div className="fixed inset-0 z-[10000]">
      {renderBackdrop && !targetRect && (
        <div className="fixed inset-0 bg-slate-950/72" />
      )}

      {renderBackdrop && targetRect && (
        <>
          <div
            className="fixed bg-slate-950/72"
            style={{
              left: 0,
              top: 0,
              width: "100vw",
              height: Math.max(targetRect.top - 8, 0),
            }}
          />
          <div
            className="fixed bg-slate-950/72"
            style={{
              left: 0,
              top: Math.max(targetRect.top - 8, 0),
              width: Math.max(targetRect.left - 8, 0),
              height: targetRect.height + 16,
            }}
          />
          <div
            className="fixed bg-slate-950/72"
            style={{
              left: targetRect.right + 8,
              top: Math.max(targetRect.top - 8, 0),
              width: Math.max(window.innerWidth - targetRect.right - 8, 0),
              height: targetRect.height + 16,
            }}
          />
          <div
            className="fixed bg-slate-950/72"
            style={{
              left: 0,
              top: targetRect.bottom + 8,
              width: "100vw",
              height: Math.max(window.innerHeight - targetRect.bottom - 8, 0),
            }}
          />
          <div
            className="fixed pointer-events-none rounded-3xl border border-white/35"
            style={{
              left: targetRect.left - 8,
              top: targetRect.top - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        </>
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
