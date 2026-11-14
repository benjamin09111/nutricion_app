"use client";

import React, { useEffect } from "react";
import {
  Trophy,
  Star,
  Flame,
  X,
  Award,
  Sparkles,
  Droplets,
  BookOpen,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { PatientProfileState } from "../types";
import { cn } from "@/lib/utils";

interface PatientLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PatientProfileState;
}

export function PatientLevelModal({
  isOpen,
  onClose,
  profile,
}: PatientLevelModalProps) {
  // Prevent background scroll
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

  const currentLevelMinStars = (profile.level - 1) * 100;
  const progressInLevel = profile.totalStars - currentLevelMinStars;
  const starsNeededForNextLevel = profile.nextLevelStars - profile.totalStars;
  const progressPercent = Math.min(100, Math.max(0, Math.round((progressInLevel / 100) * 100)));

  const trophies = [
    {
      id: "t1",
      title: "Constancia Semanal",
      description: "6 días cumplidos con tu pauta alimentaria",
      icon: Flame,
      color: "text-orange-500 bg-orange-50 border-orange-200",
      unlocked: true,
    },
    {
      id: "t2",
      title: "Maestría en Hidratación",
      description: "Alcanzaste tu meta diaria de 2.0L de agua",
      icon: Droplets,
      color: "text-sky-500 bg-sky-50 border-sky-200",
      unlocked: true,
    },
    {
      id: "t3",
      title: "Diario de Hábitos",
      description: "Registraste cómo te sentiste en el día",
      icon: BookOpen,
      color: "text-emerald-500 bg-emerald-50 border-emerald-200",
      unlocked: true,
    },
    {
      id: "t4",
      title: "Comidas Invictas",
      description: "5 comidas del día marcadas y respetadas",
      icon: CheckCircle2,
      color: "text-[#5A781E] bg-[#F0F5DF] border-[#DDE7B8]",
      unlocked: true,
    },
    {
      id: "t5",
      title: "Hábito de Platino",
      description: "Alcanza 300 estrellas y Nivel 4",
      icon: Lock,
      color: "text-slate-400 bg-slate-100 border-slate-200",
      unlocked: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog (Bottom sheet on mobile, rounded-3xl on desktop) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-modal-title"
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-6 overflow-hidden z-10 max-h-[90dvh] flex flex-col animate-sheet-up pb-safe"
      >
        {/* Drag handle / barra táctil para sensación de bottom sheet nativo */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300/80 mx-auto -mt-1 mb-3 shrink-0 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Trophy className="w-5 h-5 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <h2
                id="level-modal-title"
                className="text-base font-extrabold text-[#20212B] tracking-tight"
              >
                Mi Nivel & Trofeos
              </h2>
              <p className="text-[11px] text-slate-500">
                Tus logros por cumplir tus comidas y hábitos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto no-scrollbar py-4 space-y-4 flex-1">
          {/* Card Hero de Nivel Actual */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#F0F5DF] via-[#F7FAF0] to-white border border-[#DDE7B8] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A781E]">
                  Nivel de Compromiso
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#20212B]">
                  Nivel {profile.level}: {profile.levelName}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300 flex items-center justify-center text-amber-600 shadow-xs shrink-0">
                <Award className="w-7 h-7 text-amber-600" />
              </div>
            </div>

            {/* Barra de Progreso */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600">
                  {profile.totalStars} de {profile.nextLevelStars} estrellas
                </span>
                <span className="text-[#5A781E] font-black">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200/80 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#86A83C] to-[#668E20] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Te faltan {starsNeededForNextLevel} estrellas para subir a Nivel 4 (Platino)</span>
              </p>
            </div>
          </div>

          {/* Mini Strip de Métricas Gamificadas */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <span className="text-lg font-black text-[#20212B] leading-none block">
                  {profile.totalStars}
                </span>
                <span className="text-[11px] font-semibold text-amber-800">
                  Estrellas ganadas
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-orange-50/70 border border-orange-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <Flame className="w-5 h-5 fill-orange-500 text-orange-600" />
              </div>
              <div>
                <span className="text-lg font-black text-[#20212B] leading-none block">
                  {profile.currentStreakDays} días
                </span>
                <span className="text-[11px] font-semibold text-orange-800">
                  Racha activa
                </span>
              </div>
            </div>
          </div>

          {/* Trofeos y Logros */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">
              Trofeos & Logros Desbloqueados
            </h4>
            <div className="space-y-2">
              {trophies.map((trophy) => {
                const Icon = trophy.icon;
                return (
                  <div
                    key={trophy.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border transition-all",
                      trophy.unlocked
                        ? "bg-white border-slate-200 shadow-2xs"
                        : "bg-slate-50/70 border-slate-200/60 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center border shrink-0",
                          trophy.color
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#20212B] truncate">
                          {trophy.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {trophy.description}
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ml-2",
                        trophy.unlocked
                          ? "bg-[#F0F5DF] text-[#5A781E]"
                          : "bg-slate-200 text-slate-500"
                      )}
                    >
                      {trophy.unlocked ? "Logrado" : "Bloqueado"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="pt-3 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] active:scale-[0.98] text-white text-xs font-bold transition-all cursor-pointer shadow-sm shadow-[#86A83C]/30"
          >
            ¡Entendido, a seguir sumando!
          </button>
        </div>
      </div>
    </div>
  );
}
