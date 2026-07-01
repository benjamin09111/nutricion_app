import React from "react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  label: string;
}

interface SidebarQuickNavProps {
  sections: Section[];
  activeSection: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function SidebarQuickNav({
  sections,
  activeSection,
  onSelect,
  className,
}: SidebarQuickNavProps) {
  return (
    <nav
      className={cn(
        "w-56 shrink-0 border-r border-slate-100 pr-4 hidden lg:block",
        className
      )}
    >
      <p className="text-xs font-medium text-slate-400 uppercase mb-2">
        Acceso rápido
      </p>
      <ul className="space-y-1">
        {sections.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => onSelect(s.id)}
              type="button"
              className={cn(
                "w-full text-left text-sm rounded-lg px-3 py-2 transition-colors",
                activeSection === s.id
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
