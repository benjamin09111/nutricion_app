"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  Stethoscope,
  Heart,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Flame,
  Star,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog (rounded-3xl according to rule #10) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-selector-title"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-8 overflow-hidden z-10 max-h-[calc(100dvh-2rem)] overflow-y-auto no-scrollbar"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header con Naty */}
        <div className="text-center space-y-2 mb-6 sm:mb-8 pr-6 sm:pr-0">
          <div className="inline-flex items-center justify-center p-1.5 rounded-2xl bg-[#F0F5DF] border border-[#DDE7B8] mb-1">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden">
              <Image
                src="/nutria.webp"
                alt="Naty NutriNet"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
          </div>
          <h2
            id="demo-selector-title"
            className="text-xl sm:text-2xl font-black text-[#20212B] tracking-tight"
          >
            ¿Cómo deseas explorar la DEMO?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Elige el perfil para probar NutriNet en vivo sin necesidad de registrarte:
          </p>
        </div>

        {/* 2 Opciones en Cards (rounded-2xl according to rule #10) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Opción 1: Vista Nutricionista (Púrpura / Morado) */}
          <div
            onClick={handleSelectNutritionist}
            className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl border-2 border-purple-100 hover:border-[#7842D4] bg-white hover:bg-purple-50/30 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7842D4] group-hover:scale-105 transition-transform shadow-xs">
                  <Stethoscope className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-100 text-[#7842D4]">
                  Profesional
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#20212B] group-hover:text-[#7842D4] transition-colors">
                  Vista Nutricionista
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Espacio clínico completo para profesionales de la salud.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#7842D4] shrink-0 mt-0.5" />
                  <span>Fichas clínicas y evolución de pacientes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#7842D4] shrink-0 mt-0.5" />
                  <span>Módulo Rápido de pautas en 2 minutos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#7842D4] shrink-0 mt-0.5" />
                  <span>Cálculo automático de GET, IMC y macros</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-purple-50">
              <button
                type="button"
                className="w-full h-11 rounded-xl bg-[#7842D4] hover:bg-[#6936C8] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#7842D4]/25"
              >
                <span>Entrar como Nutricionista</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Opción 2: Vista Paciente (Verde NutriNet) */}
          <div
            onClick={handleSelectPatient}
            className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl border-2 border-[#DDE7B8] hover:border-[#86A83C] bg-gradient-to-b from-[#F0F5DF]/40 to-white hover:bg-[#F0F5DF]/30 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 text-left"
          >
            {/* Tag destacado */}
            <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-full bg-[#86A83C] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Novedad</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#86A83C] text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm shadow-[#86A83C]/30">
                  <Heart className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#E4ECC8] text-[#5A781E]">
                  Portal Paciente
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#20212B] group-hover:text-[#5A781E] transition-colors">
                  Vista Paciente
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Experiencia que viven tus pacientes con su pauta en su celular.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#86A83C] shrink-0 mt-0.5" />
                  <span>Horario con tabla de comidas y recordatorios</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#86A83C] shrink-0 mt-0.5" />
                  <span>Diario de vida de hábitos, racha y estrellas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#86A83C] shrink-0 mt-0.5" />
                  <span>Descarga de pautas y chat con Naty la nutria</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-[#DDE7B8]/40">
              <button
                type="button"
                className="w-full h-11 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#86A83C]/30"
              >
                <span>Entrar como Paciente</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-[#86A83C]" />
          <span>Acceso instantáneo con datos demostrativos • Sin tarjeta ni registro</span>
        </div>
      </div>
    </div>
  );
}

