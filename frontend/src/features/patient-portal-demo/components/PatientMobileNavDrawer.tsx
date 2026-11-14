"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  LayoutDashboard,
  Target,
  Utensils,
  BookOpen,
  FolderOpen,
  HelpCircle,
  Compass,
  Stethoscope,
  LogOut,
  Star,
  Flame,
  Trophy,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PatientProfileState } from "../types";

export type PatientNavTabId = "resumen" | "objetivos" | "comidas" | "diario" | "archivos" | "preguntas" | "recursos";

interface PatientMobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: PatientNavTabId;
  onSelectTab: (tab: PatientNavTabId) => void;
  profile: PatientProfileState;
  completedMealsCount: number;
  totalMealsCount: number;
  filesCount: number;
}

export function PatientMobileNavDrawer({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  profile,
  completedMealsCount,
  totalMealsCount,
  filesCount,
}: PatientMobileNavDrawerProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwitchToNutri = () => {
    try {
      localStorage.setItem("nutrinet_guest_session", "true");
      sessionStorage.setItem("guest_mode", "nutritionist");
    } catch {
      // safe fallback
    }
    onClose();
    router.push("/dashboard");
  };

  const handleExitDemo = () => {
    try {
      localStorage.removeItem("nutrinet_patient_guest_session");
      sessionStorage.removeItem("guest_mode");
    } catch {
      // safe fallback
    }
    onClose();
    router.push("/");
  };

  const navItems: {
    id: PatientNavTabId;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    {
      id: "resumen",
      label: "Resumen",
      icon: LayoutDashboard,
    },
    {
      id: "objetivos",
      label: "Objetivos y metas",
      icon: Target,
    },
    {
      id: "comidas",
      label: "Horario & Comidas",
      icon: Utensils,
      badge: `${completedMealsCount}/${totalMealsCount}`,
    },
    {
      id: "diario",
      label: "Diario de Vida",
      icon: BookOpen,
    },
    {
      id: "archivos",
      label: "Pautas & Archivos",
      icon: FolderOpen,
      badge: `${filesCount}`,
    },
    {
      id: "preguntas",
      label: "Consultas al Nutri",
      icon: HelpCircle,
    },
    {
      id: "recursos",
      label: "Educación & Guías",
      icon: Compass,
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer de Navegación Lateral: Se abre de IZQUIERDA a DERECHA con animación suave */}
      <div className="relative w-[85vw] max-w-xs h-full bg-white shadow-2xl flex flex-col justify-between z-10 animate-drawer-left overflow-hidden">
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
          {/* Header del Drawer */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <button
              type="button"
              onClick={() => {
                onSelectTab("resumen");
                onClose();
              }}
              className="flex items-center cursor-pointer group active:scale-95 transition-transform"
              title="Ir a Resumen"
            >
              <Image
                src="/logo_2_cropped.webp"
                alt="NutriNet"
                width={140}
                height={44}
                className="h-8 w-auto object-contain cursor-pointer"
                priority
              />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 active:scale-90 transition-all cursor-pointer"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tarjeta del Paciente en el Menú con badge DEMO */}
          <div className="p-4 border-b border-slate-100 bg-[#F0F5DF]/35 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200/80 shadow-xs relative bg-slate-100 flex items-center justify-center shrink-0">
                <Image
                  src="/demo-avatar.svg"
                  alt="Perfil invitado"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-[#20212B] truncate">{profile.fullName}</p>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-[#E4ECC8] text-[#5A781E] border border-[#DDE7B8]">
                    DEMO
                  </span>
                </div>
                <p className="text-[11px] text-[#626573] truncate">{profile.nutriName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] font-bold text-slate-600">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60">
                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                <span>{profile.totalStars} pts</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-50 text-orange-800 border border-orange-200/60">
                <Flame className="w-3 h-3 fill-orange-500 text-orange-600" />
                <span>{profile.currentStreakDays} días</span>
              </span>
            </div>
          </div>

          {/* Lista de Módulos */}
          <div className="p-3 space-y-1 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 block">
              Módulos Clínicos
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer group active:scale-[0.98]",
                    isActive
                      ? "bg-[#86A83C] text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#20212B]"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={cn(
                        "w-5 h-5 shrink-0 transition-colors",
                        isActive
                          ? "text-white"
                          : "text-slate-500 group-hover:text-[#5A781E]"
                      )}
                    />
                    <span className="text-sm font-semibold truncate leading-none">
                      {item.label}
                    </span>
                  </div>

                  {item.badge ? (
                    <span
                      className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2",
                        isActive
                          ? "bg-white text-[#5A781E]"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                        isActive ? "text-white/70" : "text-slate-300"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Acciones de Cuenta / Footer del Drawer */}
          <div className="p-3 border-t border-slate-100 space-y-1 bg-slate-50/50 pb-safe">
            <button
              type="button"
              onClick={handleSwitchToNutri}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-[#F0F5DF] hover:text-[#5A781E] active:scale-95 transition-all cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-[#86A83C]" />
              <span>Ir a Vista Nutricionista</span>
            </button>
            <button
              type="button"
              onClick={handleExitDemo}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir de la DEMO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
