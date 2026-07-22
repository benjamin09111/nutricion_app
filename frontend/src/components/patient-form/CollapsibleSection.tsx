import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  optional?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  optional = true,
  defaultOpen = false,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("border border-slate-200 rounded-lg mt-4", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <span>
          {title}{" "}
          {optional && (
            <span className="text-slate-400 font-normal">(opcional)</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
