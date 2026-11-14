"use client";

import React from "react";
import Image from "next/image";
import { Menu, Quote, Bell } from "lucide-react";

interface PatientHeaderProps {
  onOpenMobileNav: () => void;
  onLogoClick?: () => void;
  onOpenNutriAdvice?: () => void;
  hasUnreadAdvice?: boolean;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export function PatientHeader({
  onOpenMobileNav,
  onLogoClick,
  onOpenNutriAdvice,
  hasUnreadAdvice = true,
  onOpenNotifications,
  unreadNotificationsCount = 0,
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

        {/* Derecha: Consejo Nutri + Notificaciones + Menú hamburger */}
        <div className="flex items-center gap-1 sm:gap-2">
          {onOpenNutriAdvice && (
            <button
              type="button"
              onClick={onOpenNutriAdvice}
              className="relative p-2 rounded-xl text-[#5A781E] hover:bg-[#F0F5DF] active:scale-90 transition-all cursor-pointer"
              title="Consejo de tu Nutri"
              aria-label="Ver consejo de tu Nutri"
            >
              <Quote className="w-5 h-5 fill-[#86A83C]/20" />
              {hasUnreadAdvice && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white shadow-xs" />
                </span>
              )}
            </button>
          )}

          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-700 hover:text-[#20212B] hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
              title="Notificaciones"
              aria-label="Abrir notificaciones"
            >
              <Bell className="w-5 h-5 stroke-[2]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs ring-2 ring-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenMobileNav}
            className="p-2 -mr-1 rounded-xl text-slate-800 hover:text-slate-950 hover:bg-slate-100 active:scale-90 active:rotate-6 transition-all duration-150 cursor-pointer"
            aria-label="Abrir menú de módulos y opciones"
          >
            <Menu className="w-6 h-6 stroke-[2.2]" />
          </button>
        </div>
      </div>
    </header>
  );
}
