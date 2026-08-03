"use client";

import { useEffect, useState } from "react";

interface RotatingWordProps {
  words: string[];
  className?: string;
  style?: React.CSSProperties;
}

export function RotatingWord({
  words,
  className = "",
  style = {},
}: RotatingWordProps) {
  const [index, setIndex] = useState(0);
  // Stages: "writing" | "holding" | "erasing" | "reset"
  const [stage, setStage] = useState<"writing" | "holding" | "erasing" | "reset">("writing");

  useEffect(() => {
    if (!words || words.length <= 1) return;

    let timer: NodeJS.Timeout;

    if (stage === "writing") {
      // Left-to-right writing stroke takes 1200ms
      timer = setTimeout(() => {
        setStage("holding");
      }, 1250);
    } else if (stage === "holding") {
      // Keep word visible for 1800ms
      timer = setTimeout(() => {
        setStage("erasing");
      }, 1800);
    } else if (stage === "erasing") {
      // Fade out over 350ms
      timer = setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setStage("reset");
      }, 350);
    } else if (stage === "reset") {
      // Brief reset before writing next word
      timer = setTimeout(() => {
        setStage("writing");
      }, 50);
    }

    return () => clearTimeout(timer);
  }, [stage, words]);

  if (!words || words.length === 0) return null;

  const currentWord = words[index];

  return (
    <span className="relative inline-flex items-center justify-center py-2 px-1 select-none overflow-visible max-w-full">
      {/* Invisible max-width sizer to hold container dimensions */}
      <span className="opacity-0 pointer-events-none italic px-3 whitespace-nowrap">
        MODERNIZA
      </span>

      {/* Animated handwriting word */}
      <span
        className={`absolute inset-0 flex items-center justify-center italic tracking-normal transition-all whitespace-nowrap px-1 ${
          stage === "erasing"
            ? "opacity-0 scale-95 blur-[1px]"
            : stage === "reset"
            ? "opacity-0 transition-none"
            : "opacity-100"
        } ${className}`}
        style={{
          ...style,
          // Negative inset bounds (-20px) ensure text strokes and slants are never clipped vertically
          clipPath:
            stage === "writing" || stage === "holding" || stage === "erasing"
              ? "inset(-25px 0% -25px 0)"
              : "inset(-25px 100% -25px 0)",
          transitionProperty: stage === "writing" ? "clip-path" : "opacity, transform, filter",
          transitionDuration: stage === "writing" ? "1200ms" : stage === "erasing" ? "350ms" : "0ms",
          transitionTimingFunction: "cubic-bezier(0.35, 0, 0.25, 1)",
        }}
        aria-live="polite"
      >
        {currentWord}
      </span>
    </span>
  );
}
