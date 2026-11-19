"use client";

import React from "react";
import { Target, TrendingDown, Droplets, CheckCircle2, Heart, Award, Sparkles } from "lucide-react";
import { PatientProfileState } from "../types";

interface PatientGoalsTabProps {
  profile: PatientProfileState;
}

export function PatientGoalsTab({ profile }: PatientGoalsTabProps) {
  const weightLost = (profile.startingWeightKg - profile.currentWeightKg).toFixed(1);
  const totalWeightGoal = (profile.startingWeightKg - profile.goalWeightKg).toFixed(1);
  const weightProgressPercent = Math.min(
    100,
    Math.round(
      ((profile.startingWeightKg - profile.currentWeightKg) /
        (profile.startingWeightKg - profile.goalWeightKg)) *
        100
    )
  );

  return (
    <div className="space-y-4">
      {/* 1. Tarjeta de Objetivo Principal Clínico */}
      <div className="bg-white rounded-2xl border border-[#E9E5E7] p-4 sm:p-5 shadow-2xs space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#F0F5DF] text-[#5A781E] flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#20212B]">Objetivo Principal</h2>
            <p className="text-[13px] font-normal text-[#626573]">
              Acordado con {profile.nutriName}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F8FAF2] border border-[#E2EBC8] text-[13px] font-medium text-[#455A1A] leading-relaxed">
          &ldquo;{profile.targetObjective}&rdquo;
        </div>
      </div>

      {/* 2. Grid de Metas Específicas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Meta 1: Peso Corporal */}
        <div className="bg-white rounded-2xl border border-[#E9E5E7] p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-[#86A83C]" />
              <h3 className="text-base font-semibold text-[#20212B]">Evolución de Peso</h3>
            </div>
            <span className="text-xs font-bold text-[#5A781E] bg-[#F0F5DF] px-2.5 py-0.5 rounded-full">
              {weightProgressPercent}% completado
            </span>
          </div>

          <div className="flex items-baseline justify-between text-xs pt-1">
            <span className="text-[28px] font-bold text-[#20212B] tabular-nums whitespace-nowrap">
              -{weightLost} kg
            </span>
            <span className="text-[13px] font-normal text-[#626573] whitespace-nowrap">
              Meta: -{totalWeightGoal} kg ({profile.goalWeightKg} kg)
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#86A83C] transition-all duration-500 ease-out"
              style={{ width: `${weightProgressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#626573] pt-1 border-t border-[#F0ECEE]">
            <span>Inicio: {profile.startingWeightKg} kg</span>
            <span>Actual: {profile.currentWeightKg} kg</span>
            <span className="font-semibold text-[#5A781E]">Objetivo: {profile.goalWeightKg} kg</span>
          </div>
        </div>

        {/* Meta 2: Hidratación Diaria */}
        <div className="bg-white rounded-2xl border border-[#E9E5E7] p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-sky-500" />
              <h3 className="text-base font-semibold text-[#20212B]">Hidratación Diaria</h3>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full">
              2.0 L diarios
            </span>
          </div>

          <div className="flex items-baseline justify-between text-xs pt-1">
            <span className="text-[28px] font-bold text-[#20212B] tabular-nums whitespace-nowrap">
              {(profile.waterIntakeMl / 1000).toFixed(1)} L
            </span>
            <span className="text-[13px] font-normal text-[#626573] whitespace-nowrap">
              8 vasos al día (250 ml c/u)
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, Math.round((profile.waterIntakeMl / profile.waterGoalMl) * 100))}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#626573] pt-1 border-t border-[#F0ECEE]">
            <span>Constancia: 6 de 7 días logrados esta semana</span>
          </div>
        </div>

        {/* Meta 3: Hábitos y Horario de Comidas */}
        <div className="bg-white rounded-2xl border border-[#E9E5E7] p-4 sm:p-5 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#86A83C]" />
            <h3 className="text-base font-semibold text-[#20212B]">Pauta Alimentaria</h3>
          </div>
          <p className="text-[13px] font-normal text-[#626573] leading-relaxed">
            Completar las 5 comidas planificadas diarias respetando las porciones recomendadas sin saltarse el desayuno ni la colación de la tarde.
          </p>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5A781E] bg-[#F0F5DF] px-2.5 py-1 rounded-lg w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Racha actual: {profile.currentStreakDays} días consecutivos</span>
          </div>
        </div>

        {/* Meta 4: Actividad y Descanso */}
        <div className="bg-white rounded-2xl border border-[#E9E5E7] p-4 sm:p-5 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-semibold text-[#20212B]">Movimiento & Descanso</h3>
          </div>
          <p className="text-[13px] font-normal text-[#626573] leading-relaxed">
            Realizar al menos 3 caminatas o sesiones de fuerza semanales (30–45 min) y priorizar entre 7 y 8 horas de sueño reparador cada noche.
          </p>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg w-fit">
            <Award className="w-3.5 h-3.5" />
            <span>Compromiso activo con tu salud</span>
          </div>
        </div>
      </div>
    </div>
  );
}
