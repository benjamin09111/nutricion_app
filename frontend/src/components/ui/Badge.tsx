import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        {
          "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80":
            variant === "default",
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80":
            variant === "secondary",
          "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80":
            variant === "destructive",
          "border-slate-200 text-slate-950": variant === "outline",
          "border-transparent bg-emerald-100 text-emerald-700":
            variant === "success",
          "border-transparent bg-amber-100 text-amber-700":
            variant === "warning",
        },
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
