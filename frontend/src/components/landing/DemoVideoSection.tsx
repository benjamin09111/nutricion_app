"use client";

import { useState } from "react";
import {
  Play,
  Clock,
  Sparkles,
  Heart,
  Laptop,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DemoVideoSectionProps {
  onProbarNutriNetClick?: () => void;
  onInterestClick?: () => void;
}

const YOUTUBE_VIDEO_ID = "UFPPfnwmhgM";

const CHAPTERS = [
  { label: "00:12", title: "Introducción y visión", seconds: 12 },
  { label: "02:15", title: "Módulo rápido y cálculo", seconds: 135 },
  { label: "05:30", title: "Tabla INTA y porciones", seconds: 330 },
  { label: "08:10", title: "Entregables y PDF clínico", seconds: 490 },
];

export function DemoVideoSection({
  onProbarNutriNetClick,
  onInterestClick,
}: DemoVideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [startSeconds, setStartSeconds] = useState(12);

  const handleStartPlay = () => {
    setStartSeconds(12);
    setIsPlaying(true);
  };

  const handleSeek = (seconds: number) => {
    setStartSeconds(seconds);
    setIsPlaying(true);
  };

  return (
    <section id="video-demo" className="relative py-16 sm:py-24 bg-slate-50/70 border-t border-b border-slate-200/80 overflow-hidden">
      {/* Glow decorativo de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#86A83C]/10 to-[#a88aed]/15 blur-3xl pointer-events-none rounded-full" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        {/* Encabezado de la sección con estándar visual NutriNet */}
        <div className="text-center space-y-4 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-semibold sm:px-5 sm:text-sm bg-[#a88aed]/10 text-[#a88aed] border-[#a88aed]/30 transition-all duration-300 hover:scale-105">
            <Film className="h-4 w-4" />
            <span>Demostración oficial paso a paso · 10 minutos</span>
          </div>

          <div className="space-y-3">
            <h2 className="space-y-2 sm:space-y-3">
              <span
                className="block text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-6xl uppercase text-center"
                style={{
                  WebkitTextStroke: "2.5px #a6c261",
                  color: "transparent",
                  fontWeight: 900,
                }}
              >
                MIRA NUTRINET EN ACCIÓN
              </span>
              <span className="block text-xl font-bold tracking-tight text-[#a88aed] sm:text-2xl lg:text-4xl text-center">
                Recorrido guiado por la plataforma
              </span>
            </h2>
          </div>

          <p className="mx-auto max-w-3xl text-sm sm:text-base text-slate-600 leading-relaxed">
            Te mostramos en detalle cómo diseñar pautas completas, aplicar equivalencias
            oficiales del INTA y generar entregables de alto impacto en minutos.
          </p>
        </div>

        {/* Mockup Frame tipo ventana de aplicación SaaS */}
        <div className="relative mx-auto max-w-4xl rounded-3xl border border-slate-200/90 bg-slate-900 shadow-2xl shadow-slate-950/20 overflow-hidden">
          {/* Barra superior de la ventana */}
          <div className="flex h-11 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
            </div>

            <div className="flex items-center gap-1.5 rounded-lg bg-slate-900/90 px-3 py-1 text-[11px] font-medium text-slate-400 border border-slate-800/80">
              <Laptop className="h-3 w-3 text-slate-400" />
              <span>nutrinet.cl/demo — Video Demostración</span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">10 min</span>
            </div>
          </div>

          {/* Contenedor del reproductor de video (YouTube Embed) */}
          <div className="relative aspect-video w-full bg-black">
            {isPlaying ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&start=${startSeconds}&rel=0`}
                title="Demostración oficial NutriNet"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            ) : (
              <div
                onClick={handleStartPlay}
                className="relative h-full w-full flex flex-col items-center justify-center bg-slate-950/90 cursor-pointer transition-all hover:bg-slate-950/80 group overflow-hidden"
              >
                {/* Miniatura de fondo */}
                <img
                  src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`}
                  alt="Demostración NutriNet"
                  className="absolute inset-0 h-full w-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback a hqdefault si maxresdefault no está lista
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/hqdefault.jpg`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-slate-950/30" />

                <div className="relative z-10 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-[#86A83C] text-white shadow-2xl shadow-[#86A83C]/50 transition-transform duration-300 group-hover:scale-110">
                  <Play className="h-9 w-9 sm:h-10 sm:w-10 fill-white translate-x-0.5" />
                </div>
                <div className="relative z-10 mt-5 text-center px-4 space-y-1">
                  <p className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-md">
                    Reproducir demostración oficial
                  </p>
                  <p className="text-xs sm:text-sm text-slate-200 drop-shadow">
                    Duración: 10 min · Comienza en 00:12
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Barra inferior de capítulos rápidos */}
          <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400 font-semibold">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Saltar a sección:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {CHAPTERS.map((chapter) => (
                  <button
                    key={chapter.seconds}
                    type="button"
                    onClick={() => handleSeek(chapter.seconds)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-[#86A83C] hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="text-[#86A83C] font-mono font-bold">{chapter.label}</span>
                    <span>{chapter.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción directa debajo del reproductor */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {onProbarNutriNetClick && (
            <Button
              onClick={onProbarNutriNetClick}
              className="w-full sm:w-auto rounded-full h-13 px-8 text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#86A83C] hover:bg-[#78A82F] text-white transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-[#86A83C]/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Probar NutriNet gratis
            </Button>
          )}

          {onInterestClick && (
            <Button
              variant="outline"
              onClick={onInterestClick}
              className="w-full sm:w-auto rounded-full h-13 px-8 text-xs sm:text-sm font-bold text-indigo-700 bg-white border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
            >
              <Heart className="h-4 w-4 text-indigo-600 fill-indigo-100" />
              <span>Me interesa NutriNet</span>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
