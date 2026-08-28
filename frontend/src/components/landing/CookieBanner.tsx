"use client";

import { useState, useEffect } from "react";
import { Cookie, ShieldCheck, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("nutrinet_cookie_consent");
      if (!consent) {
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(
        "nutrinet_cookie_consent",
        JSON.stringify({
          essential: true,
          analytics: true,
          date: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.warn("Could not save cookie consent:", err);
    }
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem(
        "nutrinet_cookie_consent",
        JSON.stringify({
          essential: true,
          analytics: false,
          date: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.warn("Could not save cookie consent:", err);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Dark backdrop overlay to focus attention & enhance contrast */}
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[85] animate-in fade-in duration-300 cursor-pointer"
        onClick={handleAcceptEssential}
      />

      <div className="fixed bottom-0 left-0 right-0 w-full z-[90] border-t border-indigo-100 bg-white/98 backdrop-blur-xl shadow-2xl py-6 sm:py-7 px-4 sm:px-8 lg:px-12 shadow-indigo-950/20 animate-in slide-in-from-bottom-6 fade-in duration-300">
        <div className="mx-auto max-w-7xl space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Text & Icon */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#a88aed] shrink-0 mt-0.5">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  Privacidad y Cookies en NutriNet
                  <ShieldCheck className="h-4 w-4 text-emerald-600 inline" />
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                  Utilizamos cookies esenciales para proteger tu sesión clínica, calcular métricas y ofrecer la mejor experiencia según la normativa chilena (Ley 19.628). Tus datos de salud y pacientes son 100% privados y encriptados.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
              <Button
                type="button"
                onClick={handleAcceptAll}
                className="h-10 px-6 bg-[#a88aed] hover:bg-[#8f70d8] text-white font-bold text-xs rounded-xl shadow-md gap-1.5 transition-transform active:scale-95 shrink-0 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                Aceptar todo
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfig(!showConfig)}
                className="h-10 px-4 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shrink-0 cursor-pointer"
              >
                {showConfig ? "Ocultar" : "Configurar"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleAcceptEssential}
                className="h-10 px-3 text-slate-500 hover:text-slate-800 text-xs font-semibold shrink-0 cursor-pointer"
              >
                Solo esenciales
              </Button>

              <button
                type="button"
                onClick={handleAcceptEssential}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100 shrink-0 ml-1 cursor-pointer"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Configuration Panel */}
          {showConfig && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Cookies Técnicas / Esenciales</span>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Requeridas</span>
              </div>
              <p className="text-[11px] text-slate-500">Sesión segura, cifrado de datos clínicos y autenticación con Google.</p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-800">Rendimiento y Experiencia</span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">Opcionales</span>
              </div>
              <p className="text-[11px] text-slate-500">Métricas anónimas para optimizar los tiempos de respuesta de la IA (Naty).</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
