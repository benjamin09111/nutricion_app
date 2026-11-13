"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  Stethoscope,
  Sparkles,
  LogOut,
  ChevronDown,
  X,
  ArrowLeft,
  Star,
  Flame,
  Trophy,
  ShieldCheck,
  User,
} from "lucide-react";
import { PatientNotification } from "../types";
import { PatientNotificationsPopover } from "./PatientNotificationsPopover";
import { cn } from "@/lib/utils";

interface PatientHeaderProps {
  patientName: string;
  nutriName: string;
  notifications: PatientNotification[];
  onMarkAllNotificationsAsRead: () => void;
  onOpenMobileNav?: () => void;
  onLogoClick?: () => void;
}

export function PatientHeader({
  patientName,
  nutriName,
  notifications,
  onMarkAllNotificationsAsRead,
  onOpenMobileNav,
  onLogoClick,
}: PatientHeaderProps) {
  const router = useRouter();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Prevent background scroll on mobile full-screen modal
  useEffect(() => {
    if (isProfileMenuOpen && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        if (window.innerWidth >= 640) {
          setIsProfileMenuOpen(false);
        }
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleSwitchToNutritionist = () => {
    try {
      localStorage.setItem("nutrinet_guest_session", "true");
      sessionStorage.setItem("guest_mode", "nutritionist");
    } catch {
      // safe fallback
    }
    setIsProfileMenuOpen(false);
    router.push("/dashboard");
  };

  const handleExitDemo = () => {
    try {
      localStorage.removeItem("nutrinet_patient_guest_session");
      sessionStorage.removeItem("guest_mode");
    } catch {
      // safe fallback
    }
    setIsProfileMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E9E5E7] transition-all">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Hamburger Button (Mobile) + Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenMobileNav && (
            <button
              type="button"
              onClick={onOpenMobileNav}
              className="p-2 -ml-1 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Abrir menú de módulos"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
          )}

          {onLogoClick ? (
            <button
              type="button"
              onClick={onLogoClick}
              className="flex items-center gap-2 group cursor-pointer text-left"
              title="Ir al inicio de la demo"
            >
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl overflow-hidden bg-[#F0F5DF] border border-[#DDE7B8] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Image
                  src="/nutria.webp"
                  alt="NutriNet"
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#20212B]">
                  Nutri<span className="text-[#668E20]">Net</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-[#F0F5DF] text-[#5A781E] border border-[#DDE7B8]">
                  DEMO
                </span>
              </div>
            </button>
          ) : (
            <Link href="/paciente/dashboard" className="flex items-center gap-2 group" title="Ir al inicio de la demo">
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl overflow-hidden bg-[#F0F5DF] border border-[#DDE7B8] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Image
                  src="/nutria.webp"
                  alt="NutriNet"
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#20212B]">
                  Nutri<span className="text-[#668E20]">Net</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-[#F0F5DF] text-[#5A781E] border border-[#DDE7B8]">
                  DEMO
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Notifications Popover / Full-screen modal on mobile */}
          <PatientNotificationsPopover
            notifications={notifications}
            onMarkAllAsRead={onMarkAllNotificationsAsRead}
          />

          {/* Switch to Nutritionist (Desktop only) */}
          <button
            type="button"
            onClick={handleSwitchToNutritionist}
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 hover:border-[#86A83C] bg-white hover:bg-[#F0F5DF]/30 text-xs font-semibold text-slate-700 hover:text-[#5A781E] transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Cambiar a la vista del profesional"
          >
            <Stethoscope className="w-3.5 h-3.5 text-[#86A83C]" />
            <span>Vista Nutri</span>
          </button>

          {/* Profile Trigger Button */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Abrir perfil del paciente"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#86A83C] to-[#668E20] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                CG
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* 
              Modal de Perfil:
              - En móviles: Pantalla completa fija (fixed inset-0), cómoda y legible.
              - En desktop: Dropdown flotante (absolute right-0 w-72).
            */}
            {isProfileMenuOpen && (
              <>
                {/* Backdrop desktop */}
                <div
                  className="hidden sm:block fixed inset-0 z-[190]"
                  onClick={() => setIsProfileMenuOpen(false)}
                />

                <div
                  className={cn(
                    "z-[200] bg-white flex flex-col animate-in duration-200",
                    // Móvil: Pantalla completa
                    "fixed inset-0 sm:inset-auto sm:absolute sm:right-0 sm:mt-2 sm:w-72 sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-2xl sm:p-3 sm:space-y-1.5",
                    "slide-in-from-bottom sm:slide-in-from-top-2"
                  )}
                >
                  {/* Top Bar Móvil */}
                  <div className="flex sm:hidden items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="p-1.5 -ml-1 rounded-xl text-slate-600 hover:bg-slate-200/50 cursor-pointer"
                        aria-label="Volver"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm font-black text-[#20212B]">Mi Perfil</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Tarjeta de Información del Paciente */}
                  <div className="p-4 sm:p-3 sm:border-b sm:border-slate-100 space-y-3 sm:space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 sm:w-9 sm:h-9 rounded-2xl sm:rounded-xl bg-gradient-to-br from-[#86A83C] to-[#668E20] text-white flex items-center justify-center text-base sm:text-xs font-black shadow-sm shadow-[#86A83C]/20 shrink-0">
                        CG
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-xs font-extrabold text-[#20212B] truncate">{patientName}</p>
                        <p className="text-xs sm:text-[11px] text-slate-500 truncate">{nutriName}</p>
                      </div>
                    </div>

                    {/* Datos adicionales solo visibles cómodamente en móviles */}
                    <div className="sm:hidden rounded-2xl bg-[#F0F5DF]/50 border border-[#DDE7B8] p-3 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A781E]">
                        Objetivo nutricional activo:
                      </span>
                      <p className="text-xs font-semibold text-slate-700">
                        Recomposición corporal y digestión saludable
                      </p>
                    </div>

                    <div className="flex sm:hidden items-center gap-2 pt-1 text-xs font-bold text-slate-600">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>240 puntos</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-900 border border-orange-200">
                        <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-600" />
                        <span>6 días en racha</span>
                      </span>
                    </div>
                  </div>

                  {/* Acciones principales con botones grandes y cómodos en móvil */}
                  <div className="p-4 sm:p-0 space-y-2 sm:space-y-1 flex-1 sm:flex-none flex flex-col justify-end sm:justify-start pb-safe">
                    <button
                      type="button"
                      onClick={handleSwitchToNutritionist}
                      className="w-full h-12 sm:h-auto sm:py-2 px-4 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-[#F0F5DF] hover:text-[#5A781E] border sm:border-0 border-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Stethoscope className="w-4 h-4 text-[#86A83C] shrink-0" />
                      <span>Ir a Vista Nutricionista</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExitDemo}
                      className="w-full h-12 sm:h-auto sm:py-2 px-4 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 border sm:border-0 border-rose-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Salir de la DEMO</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
