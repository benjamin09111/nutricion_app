"use client";

import React, { useEffect } from "react";
import { Quote, X, Calendar, Sparkles, CheckCircle2 } from "lucide-react";

interface NutriAdviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  nutriName?: string;
  nutriSpecialty?: string;
  dateStr?: string;
  adviceText?: string;
}

export function NutriAdviceModal({
  isOpen,
  onClose,
  nutriName = "Valentina Soto",
  dateStr = "14 Nov",
  adviceText = "Excelente ritmo esta semana Camila. Para los días de caminata o entrenamiento por la tarde, recuerda tomar tu colación de avena y yogurt al menos 40 minutos antes. ¡Vas por gran camino!",
}: NutriAdviceModalProps) {
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

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-3 sm:p-4 pt-4 sm:pt-8 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog (desliza de arriba hacia abajo) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nutri-advice-modal-title"
        className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-6 z-10 animate-sheet-down space-y-4"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F0F5DF] flex items-center justify-center text-[#5A781E]">
              <Quote className="w-5 h-5 fill-[#86A83C]/20" />
            </div>
            <h2 id="nutri-advice-modal-title" className="text-base sm:text-lg font-bold text-[#20212B]">
              Consejo de tu Nutri
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
            aria-label="Cerrar consejo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TARJETA DESTACADA DEL CONSEJO (Llamativa, visual y con identidad clínica) */}
        <div className="relative rounded-2xl bg-gradient-to-br from-[#F8FAF2] via-white to-[#F0F5DF] border border-[#DCE8BF] p-4 sm:p-5 shadow-2xs space-y-3.5 overflow-hidden">
          {/* Marca de agua decorativa */}
          <Quote className="absolute -top-3 -right-3 w-20 h-20 text-[#86A83C]/10 pointer-events-none rotate-12" />

          {/* Fila de la Nutricionista */}
          <div className="flex items-center justify-between gap-2 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#86A83C] text-white font-bold flex items-center justify-center text-xs shadow-2xs ring-2 ring-white">
                VS
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#20212B] leading-tight">
                  Nutri. {nutriName}
                </p>
                <p className="text-[11px] font-medium text-[#5A781E]">
                  Tu Nutricionista
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5A781E] bg-white border border-[#D5E3B3] px-2 py-0.5 rounded-full shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#86A83C]" />
              Personalizado
            </span>
          </div>

          {/* Caja con la cita clínica destacada */}
          <div className="relative z-10 bg-white/95 backdrop-blur-xs rounded-xl p-3.5 sm:p-4 border border-[#E2EBC8] shadow-2xs">
            <p className="text-sm sm:text-[15px] font-medium text-[#20212B] leading-relaxed italic">
              &ldquo;{adviceText}&rdquo;
            </p>
          </div>

          {/* Pie de tarjeta con fecha y estado */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5 relative z-10 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#86A83C]" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-1 text-[#5A781E]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#668E20]" />
              <span>Pauta activa</span>
            </div>
          </div>
        </div>

        {/* Botón Entendido */}
        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 min-h-[44px] rounded-xl bg-[#86A83C] hover:bg-[#78A82F] active:scale-[0.98] text-white text-sm font-bold transition-all cursor-pointer shadow-sm shadow-[#86A83C]/30 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>¡Entendido!</span>
        </button>
      </div>
    </div>
  );
}
