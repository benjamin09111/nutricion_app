"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface NavbarSection {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface Navbar_BProps {
  sections: NavbarSection[];
  activeTab: string;
  onTabChange: (id: string) => void;
  activeColor?: string;
}

export function Navbar_B({
  sections,
  activeTab,
  onTabChange,
  activeColor = "text-emerald-700",
}: Navbar_BProps) {
  return (
    <div className="grid grid-cols-2 sm:flex w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100/80 p-1 gap-1 shadow-sm">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onTabChange(section.id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-bold transition-all text-center",
            activeTab === section.id
              ? cn("bg-white shadow-sm ring-1 ring-slate-200/70", activeColor)
              : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
          )}
        >
          <section.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{section.label}</span>
        </button>
      ))}
    </div>
  );
}
