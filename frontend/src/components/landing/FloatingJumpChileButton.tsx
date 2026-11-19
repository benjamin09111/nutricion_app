"use client";

import { useState } from "react";
import { Sparkles, X, ChevronUp, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FloatingJumpChileButtonProps {
  onCtaClick: () => void;
}

export function FloatingJumpChileButton({ onCtaClick }: FloatingJumpChileButtonProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleClick = () => {
    onCtaClick();
    const targetElement = document.getElementById("registro");
    if (targetElement) {
      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });

      const input = document.getElementById("lead-fullname");
      if (input) {
        setTimeout(() => input.focus(), 400);
      }
    }
  };

  if (isDismissed) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#a88aed]/40 text-slate-800 text-xs font-bold shadow-lg hover:border-[#a88aed] hover:shadow-xl transition-all cursor-pointer"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Trophy className="h-3 w-3" />
          </div>
          <span className="text-[#8f70d8]">¿Te interesa NutriNet?</span>
          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Postulación Jump Chile"
      className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 max-w-[340px] sm:max-w-[360px] w-[calc(100vw-1.5rem)] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="relative rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 sm:p-4 shadow-xl shadow-slate-300/30 backdrop-blur-md">
        
        {/* Header con botón de minimizar e ícono oficial */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-2xs">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                ¿Te interesa NutriNet?
              </p>
              <span className="text-[10px] font-semibold text-[#8f70d8] block">
                Convocatoria Jump Chile 2026
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Minimizar"
            aria-label="Minimizar notificación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Microcopy de apoyo */}
        <p className="text-[11px] sm:text-xs text-slate-600 mb-3 leading-snug">
          Estamos postulando a <strong className="text-slate-900">Jump Chile</strong> y tu interés profesional valida nuestro proyecto frente al jurado.
        </p>

        {/* Botón CTA adaptativo y responsive sin desbordamiento de texto */}
        <Button
          onClick={handleClick}
          className="w-full rounded-xl min-h-[42px] h-auto py-2.5 px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-[#a88aed] hover:bg-[#8f70d8] text-white transition-all duration-200 hover:scale-[1.01] shadow-sm flex items-center justify-center gap-2 cursor-pointer text-center leading-tight whitespace-normal"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-300" />
          <span>¡Apóyanos en nuestra postulación!</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-90" />
        </Button>

      </div>
    </aside>
  );
}
