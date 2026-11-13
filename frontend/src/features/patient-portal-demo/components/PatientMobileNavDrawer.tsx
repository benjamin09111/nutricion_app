"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  LayoutDashboard,
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

export type PatientNavTabId = "resumen" | "comidas" | "diario" | "archivos" | "preguntas" | "recursos";

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
    description: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    {
      id: "resumen",
      label: "Resumen General",
      description: "Constancia, hidratación y peso",
      icon: LayoutDashboard,
    },
    {
      id: "comidas",
      label: "Horario & Comidas",
      description: "Pauta diaria y alimentos sugeridos",
      icon: Utensils,
      badge: `${completedMealsCount}/${totalMealsCount}`,
    },
    {
      id: "diario",
      label: "Diario de Hábitos",
      description: "Reflexiones, sensaciones y energía",
      icon: BookOpen,
    },
    {
      id: "archivos",
      label: "Pautas & Archivos",
      description: "PDFs y material descargable",
      icon: FolderOpen,
      badge: `${filesCount}`,
    },
    {
      id: "preguntas",
      label: "Consultas al Nutri",
      description: "Dudas resueltas y nuevo mensaje",
      icon: HelpCircle,
    },
    {
      id: "recursos",
      label: "Educación & Guías",
      description: "Lecturas y sellos nutricionales",
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

      {/* Slide Drawer Content */}
      <div className="relative w-[85vw] max-w-xs h-full bg-white shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-250">
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
          {/* Header del Drawer */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <button
              type="button"
              onClick={() => {
                onSelectTab("resumen");
                onClose();
              }}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-[#F0F5DF] border border-[#DDE7B8] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Image
                  src="/nutria.webp"
                  alt="NutriNet"
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-[#20212B]">
                  Nutri<span className="text-[#668E20]">Net</span>
                </span>
                <span className="text-[10px] font-bold text-[#5A781E]">
                  Portal del Paciente
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tarjeta del Paciente en el Menú */}
          <div className="p-4 border-b border-slate-100 bg-[#F0F5DF]/30 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#86A83C] to-[#668E20] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                CG
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#20212B] truncate">{profile.fullName}</p>
                <p className="text-[10px] text-slate-500 truncate">{profile.nutriName}</p>
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
                    "w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer group",
                    isActive
                      ? "bg-[#86A83C] text-white shadow-xs shadow-[#86A83C]/20"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#20212B]"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-[#F0F5DF] group-hover:text-[#5A781E]"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight truncate">{item.label}</p>
                      <p
                        className={cn(
                          "text-[10px] truncate mt-0.5",
                          isActive ? "text-white/80" : "text-slate-400"
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {item.badge ? (
                    <span
                      className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ml-2",
                        isActive ? "bg-white text-[#5A781E]" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                        isActive ? "text-white" : "text-slate-300"
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
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-[#F0F5DF] hover:text-[#5A781E] transition-colors cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-[#86A83C]" />
              <span>Ir a Vista Nutricionista</span>
            </button>
            <button
              type="button"
              onClick={handleExitDemo}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
