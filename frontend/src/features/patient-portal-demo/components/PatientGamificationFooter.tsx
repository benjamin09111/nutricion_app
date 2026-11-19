"use client";

import React from "react";
import { Star, Flame, Trophy, Award, Sparkles } from "lucide-react";
import { PatientProfileState } from "../types";
import { cn } from "@/lib/utils";

interface PatientGamificationFooterProps {
  profile: PatientProfileState;
}

export function PatientGamificationFooter({ profile }: PatientGamificationFooterProps) {
  const currentLevelMinStars = (profile.level - 1) * 100;
  const progressInLevel = profile.totalStars - currentLevelMinStars;
  const starsNeededForNextLevel = profile.nextLevelStars - profile.totalStars;
  const progressPercent = Math.min(100, Math.max(0, Math.round((progressInLevel / 100) * 100)));

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 w-full bg-white/95 backdrop-blur-md border-t border-[#E9E5E7] shadow-lg shadow-slate-900/5 pb-safe">
      {/* Barra de progreso sutil a lo largo del borde superior */}
      <div className="w-full h-1 bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#86A83C] to-[#668E20] transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-2">
        {/* Badges de Gamificación en Fila Compacta */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Estrellas */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
            <span className="text-xs font-black">{profile.totalStars}</span>
            <span className="text-[10px] font-bold text-amber-700 uppercase hidden xs:inline">
              Estrellas
            </span>
          </div>

          {/* Racha */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-900">
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-600 shrink-0" />
            <span className="text-xs font-black">{profile.currentStreakDays}d</span>
            <span className="text-[10px] font-bold text-orange-700 uppercase hidden xs:inline">
              Racha
            </span>
          </div>

          {/* Nivel */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F0F5DF] border border-[#DDE7B8] text-[#5A781E]">
            <Trophy className="w-3.5 h-3.5 text-[#86A83C] shrink-0" />
            <span className="text-xs font-black">Nv. {profile.level}</span>
            <span className="text-[10px] font-bold text-[#668E20] uppercase hidden sm:inline">
              {profile.levelName}
            </span>
          </div>
        </div>

        {/* Info adicional para desktop */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Faltan {starsNeededForNextLevel} pts para Nivel {profile.level + 1}</span>
        </div>
      </div>
    </footer>
  );
}
