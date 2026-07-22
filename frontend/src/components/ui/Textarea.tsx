 "use client";

import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    const { isDarkMode } = useTheme();
    return (
      <textarea
        className={cn(
           "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50",
          isDarkMode
            ? "border-emerald-400/12 bg-slate-950/65 text-emerald-50 ring-offset-slate-950"
            : "border-slate-300 bg-white text-slate-900 ring-offset-white",
           error &&
             "border-red-500 focus-visible:ring-red-500",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
