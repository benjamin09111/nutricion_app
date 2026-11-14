"use client";

import React from "react";
import Image from "next/image";
import { Menu } from "lucide-react";

interface PatientHeaderProps {
  onOpenMobileNav: () => void;
  onLogoClick?: () => void;
}

export function PatientHeader({
  onOpenMobileNav,
  onLogoClick,
}: PatientHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E9E5E7] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Izquierda: Solo Logo NutriNet legible y nítido */}
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center cursor-pointer transition-opacity hover:opacity-90 active:scale-98 select-none py-1"
          title="Ir al inicio de la demo"
          aria-label="Ir al inicio de la demo de paciente"
        >
          <Image
            src="/logo_2_cropped.webp"
            alt="NutriNet"
            width={300}
            height={70}
            className="h-8 sm:h-9.5 md:h-10 w-auto object-contain"
            priority
          />
        </button>

        {/* Derecha: Solo el icono de menú hamburger */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="p-2 -mr-1.5 rounded-xl text-slate-800 hover:text-slate-950 hover:bg-slate-100 active:scale-90 active:rotate-6 transition-all duration-150 cursor-pointer"
          aria-label="Abrir menú de módulos y opciones"
        >
          <Menu className="w-6 h-6 stroke-[2.2]" />
        </button>
      </div>
    </header>
  );
}
