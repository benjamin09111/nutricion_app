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
    <div className="flex w-full overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onTabChange(section.id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all",
            activeTab === section.id
              ? cn("bg-white", activeColor)
              : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
          )}
        >
          <section.icon className="h-4 w-4" />
          {section.label}
        </button>
      ))}
    </div>
  );
}
