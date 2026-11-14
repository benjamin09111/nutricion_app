"use client";

import React from "react";
import Image from "next/image";
import { UtensilsCrossed, Trophy, MessageCircle } from "lucide-react";
import { PatientProfileState } from "../types";
import { cn } from "@/lib/utils";

interface PatientInstagramFooterProps {
  profile: PatientProfileState;
  consumedFoodsCount?: number;
  onOpenConsumedFoods: () => void;
  onOpenNatyChat: () => void;
  onOpenLevelModal: () => void;
}

export function PatientInstagramFooter({
  profile,
  consumedFoodsCount = 0,
  onOpenConsumedFoods,
  onOpenNatyChat,
  onOpenLevelModal,
}: PatientInstagramFooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg shadow-slate-900/5 pb-safe">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
        {/* 1. Botón Mi Nivel / Trofeo (Izquierda) */}
        <button
          type="button"
          onClick={onOpenLevelModal}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-[#20212B] active:scale-90 transition-all cursor-pointer group py-1"
          aria-label="Ver mi nivel y trofeos"
        >
          <Trophy className="w-5 h-5 text-amber-500 fill-amber-400 group-hover:scale-110 group-active:scale-95 transition-transform" />
          <span className="text-[11px] font-bold tracking-tight">Mi Nivel</span>
        </button>

        {/* 2. Botón Naty Asistente (Centro - Hero Destacado estilo Instagram) */}
        <button
          type="button"
          onClick={onOpenNatyChat}
          className="flex-1 flex flex-col items-center justify-center cursor-pointer group -mt-3.5 active:scale-90 transition-transform"
          aria-label="Chatear con Naty la nutria"
        >
          <div className="relative w-13 h-13 rounded-full p-[2.5px] bg-gradient-to-br from-[#86A83C] to-[#668E20] shadow-md shadow-[#86A83C]/35 hover:shadow-lg transition-transform group-hover:scale-105 active:scale-95 border-2 border-white">
            <div className="relative w-full h-full rounded-full overflow-hidden bg-[#F0F5DF]">
              <Image
                src="/circle_logo.webp"
                alt="Naty"
                fill
                sizes="52px"
                className="object-cover"
              />
            </div>
            <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-xs">
              <MessageCircle className="h-2 w-2 text-white" />
            </div>
          </div>
          <span className="text-[11px] font-black text-[#5A781E] tracking-tight mt-0.5">
            Naty
          </span>
        </button>

        {/* 3. Botón Consumidos (Derecha - Registro fuera de dieta) */}
        <button
          type="button"
          onClick={onOpenConsumedFoods}
          className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-[#20212B] active:scale-90 transition-all cursor-pointer group py-1"
          aria-label="Registrar alimentos consumidos fuera de pauta"
          title="Anotar alimentos consumidos fuera de dieta"
        >
          <div className="relative">
            <UtensilsCrossed className="w-5 h-5 stroke-[2] group-hover:scale-110 group-active:scale-95 transition-transform text-[#5A781E]" />
            {consumedFoodsCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#86A83C] text-[9px] font-black text-white shadow-xs ring-2 ring-white">
                {consumedFoodsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold tracking-tight text-center leading-none">
            Consumidos
          </span>
        </button>
      </div>
    </footer>
  );
}
