"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, BookOpen, MessageSquare, Bot, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface NatyWelcomeDrawerProps {
  isOpenByDefault?: boolean;
}

export function NatyWelcomeDrawer({ isOpenByDefault = false }: NatyWelcomeDrawerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenClosed, setHasBeenClosed] = useState(false);

  useEffect(() => {
    // Check if this is the first login / account opening
    const shownKey = "naty_welcome_shown";
    const alreadyShown = localStorage.getItem(shownKey);

    if (!alreadyShown || isOpenByDefault) {
      setIsOpen(true);
      localStorage.setItem(shownKey, "true");
    }
  }, [isOpenByDefault]);

  const handleOpenTutorial = () => {
    setIsOpen(false);
    router.push("/dashboard/uso-recomendado");
  };

  const handleClose = () => {
    setIsOpen(false);
    setHasBeenClosed(true);
  };

  return (
    <>
      {/* Docked Launcher Floating Button when Closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9990] flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 group animate-in fade-in zoom-in duration-300"
          title="Hablar con Naty AI"
        >
          <div className="relative">
            <Image
              src="/nutria.webp"
              alt="Naty"
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover ring-2 ring-white/60"
            />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-xs font-black uppercase tracking-wider">Asistente Naty</span>
        </button>
      )}

      {/* Slide / Drag Animated Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-950/30 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in">
          <div className="fixed inset-0" onClick={handleClose} />

          {/* Drawer Container with Smooth Drag / Slide Animation */}
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between border-b border-indigo-950">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src="/nutria.webp"
                    alt="Naty la Nutria"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-emerald-400"
                  />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                    Naty la Nutria
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  </h3>
                  <p className="text-[11px] text-indigo-200 font-medium">Asistente Clínico Inteligente</p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Glowing Shiny Recommended Usage Button Banner */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-indigo-50 border-b border-emerald-100/80">
              <button
                onClick={handleOpenTutorial}
                className="w-full group relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-r from-emerald-600 via-indigo-600 to-emerald-600 bg-[length:200%_auto] text-white shadow-lg hover:shadow-emerald-500/20 transition-all duration-500 transform hover:scale-[1.02] flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 block">
                      Tutorial de Inicio
                    </span>
                    <span className="text-xs font-extrabold text-white block">
                      Uso recomendado de la app ✨
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/80 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Chat Conversation Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
              {/* Naty Welcome Message */}
              <div className="flex items-start gap-3">
                <Image
                  src="/nutria.webp"
                  alt="Naty"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                />
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2 text-xs text-slate-700 leading-relaxed font-medium">
                  <p className="font-bold text-slate-900">¡Hola! Soy Naty, tu copiloto clínico en NutriNet 🦦</p>
                  <p>
                    Estoy aquí para ayudarte a calcular macros, armar recetas, validar restricciones clínicas y preparar entregables completos para tus pacientes.
                  </p>
                  <p className="text-slate-500 italic">
                    Te recomiendo hacer clic en el botón de arriba **"Uso recomendado de la app"** para conocer la guía paso a paso de uso.
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Footer */}
            <div className="p-4 bg-white border-t border-slate-200 space-y-2">
              <Button
                onClick={handleOpenTutorial}
                className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Ver Documentación y Guía de Uso
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
