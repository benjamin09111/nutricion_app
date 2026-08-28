"use client";

import { useEffect, useState } from "react";
import { Star, X, Sparkles, CheckCircle2, HeartHandshake } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

const DISMISSED_KEY = "nutri_rating_modal_dismissed_session";

export function AppRatingModal() {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [stars, setStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        if (sessionStorage.getItem(DISMISSED_KEY) === "true") return;

        const res = await api.get("/ratings/status");
        if (res.ok) {
          const data = await res.json();
          if (!data.hasRated && data.eligibleForAutoPrompt) {
            // Small delay so user settles into dashboard
            const timer = setTimeout(() => {
              setIsOpen(true);
            }, 2500);
            return () => clearTimeout(timer);
          }
        }
      } catch (err) {
        console.error("Error checking rating status:", err);
      }
    };

    checkStatus();

    const handleManualOpen = () => {
      setIsSubmitted(false);
      setStars(0);
      setComment("");
      setIsOpen(true);
    };

    window.addEventListener("open-app-rating", handleManualOpen);
    return () => {
      window.removeEventListener("open-app-rating", handleManualOpen);
    };
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "true");
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) {
      toast.error("Por favor selecciona entre 1 y 5 estrellas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/ratings", { stars, comment });
      if (res.ok) {
        setIsSubmitted(true);
        toast.success("¡Muchas gracias por valorar NutriNet!");
        setTimeout(() => {
          setIsOpen(false);
        }, 3000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || "Error al registrar valoración.");
      }
    } catch {
      toast.error("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[90] w-full max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border shadow-2xl p-6 transition-all",
          isDarkMode
            ? "border-amber-400/20 bg-slate-950 text-slate-100 ring-1 ring-amber-400/10"
            : "border-amber-200/80 bg-white text-slate-900 ring-1 ring-amber-200/30",
        )}
      >
        {/* Background glow accent */}
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-amber-400/20 to-indigo-500/20 blur-2xl pointer-events-none" />

        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Cerrar valoración"
        >
          <X className="h-4 w-4" />
        </button>

        {isSubmitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">¡Valoración Recibida!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Muchas gracias por tomarte el tiempo. Tu opinión nos ayuda directamente a mejorar la plataforma diariamente.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Tu opinión nos importa
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  ¿Cómo valorarías NutriNet?
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecciona de 1 a 5 estrellas para calificar tu experiencia en la plataforma:
            </p>

            {/* Interactive Stars */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const isFilled = starIndex <= (hoverStars || stars);
                return (
                  <button
                    key={starIndex}
                    type="button"
                    onMouseEnter={() => setHoverStars(starIndex)}
                    onMouseLeave={() => setHoverStars(0)}
                    onClick={() => setStars(starIndex)}
                    className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                    aria-label={`Calificar con ${starIndex} estrellas`}
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors duration-150",
                        isFilled
                          ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                          : "text-slate-300 dark:text-slate-700",
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {/* Textarea for optional feedback */}
            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="¿Qué es lo que más te gusta o qué podríamos mejorar? (opcional)"
                rows={2}
                maxLength={300}
                className={cn(
                  "w-full rounded-2xl p-3 text-xs outline-none transition-all resize-none border",
                  isDarkMode
                    ? "bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-amber-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500",
                )}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Recordar más tarde
              </button>

              <button
                type="submit"
                disabled={isSubmitting || stars === 0}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-white shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                  stars > 0
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    : "bg-slate-300 dark:bg-slate-800 text-slate-500",
                )}
              >
                <HeartHandshake className="h-4 w-4" />
                <span>{isSubmitting ? "Enviando..." : "Enviar Valoración"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
