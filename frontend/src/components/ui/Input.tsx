 "use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const { isDarkMode } = useTheme();
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevent spaces in number inputs
      if (type === "number" && e.key === " ") {
        e.preventDefault();
      }
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isDarkMode
            ? "border-emerald-400/12 bg-slate-950/65 text-emerald-50 ring-offset-slate-950"
            : "border-slate-300 bg-white text-slate-900 ring-offset-white",
          error &&
            "border-red-300 text-red-900 focus-visible:ring-red-500 bg-red-50 placeholder:text-red-300",
          className,
        )}
        ref={ref}
        {...props}
        onKeyDown={handleKeyDown}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
