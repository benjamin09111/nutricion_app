"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Stethoscope, Heart } from "lucide-react";

interface DemoRoleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoRoleSelectorModal({ isOpen, onClose }: DemoRoleSelectorModalProps) {
  const router = useRouter();

  // Prevent background scroll when modal is open
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

  const handleSelectNutritionist = () => {
    try {
      localStorage.setItem("nutrinet_guest_session", "true");
      sessionStorage.setItem("guest_mode", "nutritionist");
    } catch {
      // safe fallback
    }
    onClose();
    router.push("/dashboard");
  };

  const handleSelectPatient = () => {
    try {
      localStorage.setItem("nutrinet_patient_guest_session", "true");
      sessionStorage.setItem("guest_mode", "patient");
    } catch {
      // safe fallback
    }
    onClose();
    router.push("/paciente/dashboard");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Ultra-Minimalista (rounded-3xl) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-selector-title"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 z-10 animate-spring-pop select-none"
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título único y limpio */}
        <div className="text-center mb-5 pr-6 sm:pr-0">
          <h2
            id="demo-selector-title"
            className="text-lg sm:text-xl font-bold text-[#20212B] tracking-tight"
          >
            Elige un modo de Demo
          </h2>
        </div>

        {/* Dos opciones minimalistas: Nutricionista (morado) y Paciente (verde) */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {/* Opción 1: Vista Nutricionista (Morado) */}
          <button
            type="button"
            onClick={handleSelectNutritionist}
            className="group flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl border-2 border-purple-100 hover:border-[#7842D4] bg-white hover:bg-purple-50/40 active:scale-95 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md text-center"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-[#7842D4] group-hover:scale-105 transition-transform shadow-xs mb-3">
              <Stethoscope className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-[#20212B] group-hover:text-[#7842D4] transition-colors leading-tight">
              Vista Nutricionista
            </span>
          </button>

          {/* Opción 2: Vista Paciente (Verde) */}
          <button
            type="button"
            onClick={handleSelectPatient}
            className="group flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl border-2 border-[#DDE7B8] hover:border-[#86A83C] bg-white hover:bg-[#F0F5DF]/40 active:scale-95 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md text-center"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#F0F5DF] border border-[#DDE7B8] flex items-center justify-center text-[#86A83C] group-hover:scale-105 transition-transform shadow-xs mb-3">
              <Heart className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2] fill-[#86A83C]/20" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-[#20212B] group-hover:text-[#5A781E] transition-colors leading-tight">
              Vista Paciente
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
