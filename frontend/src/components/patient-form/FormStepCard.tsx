import React from "react";
import { cn } from "@/lib/utils";

interface FormStepCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormStepCard({
  icon,
  title,
  description,
  children,
  className,
}: FormStepCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 w-full max-w-full",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="text-base font-medium text-slate-800">{title}</h3>
      </div>
      {description && (
        <p className="text-sm text-slate-500 mb-4">{description}</p>
      )}
      {children}
    </div>
  );
}
