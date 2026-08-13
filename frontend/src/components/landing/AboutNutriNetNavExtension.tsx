"use client";

import Link from "next/link";
import {
  Target,
  Users,
  HelpCircle,
  ShieldCheck,
  HeartPulse,
} from "lucide-react";
import { type AboutSectionTab } from "./AboutNutriNetModal";

interface AboutNutriNetNavExtensionProps {
  isOpen: boolean;
  onClose?: () => void;
  onSelectTab?: (tab: AboutSectionTab) => void;
}

const TABS: Array<{
  id: AboutSectionTab;
  title: string;
  icon: any;
}> = [
  {
    id: "objetivos",
    title: "Objetivos y dirección",
    icon: Target,
  },
  {
    id: "equipo",
    title: "Equipo detrás de nutrinet",
    icon: Users,
  },
  {
    id: "faq",
    title: "Preguntas frecuentes",
    icon: HelpCircle,
  },
  {
    id: "seguridad",
    title: "Seguridad de los datos",
    icon: ShieldCheck,
  },
  {
    id: "salud",
    title: "Salud y cuidado",
    icon: HeartPulse,
  },
];

export function AboutNutriNetNavExtension({
  isOpen,
  onClose,
}: AboutNutriNetNavExtensionProps) {
  if (!isOpen) return null;

  return (
    <div className="w-full border-t border-indigo-100 bg-white/98 backdrop-blur-md shadow-lg animate-in slide-in-from-top-1 fade-in duration-200 py-2.5 px-4">
      <div className="mx-auto max-w-7xl flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={`/sobre-nutrinet?tab=${tab.id}`}
              onClick={() => onClose?.()}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shrink-0 border border-[#a88aed]/30 bg-[#a88aed]/10 text-[#a88aed] hover:bg-[#a88aed] hover:text-white hover:shadow-md cursor-pointer active:scale-95"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{tab.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
