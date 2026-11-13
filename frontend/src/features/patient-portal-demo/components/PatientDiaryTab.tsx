"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Send,
  Calendar,
  Clock,
  Trash2,
  Sparkles,
  Heart,
  Zap,
  Smile,
  HelpCircle,
  Star,
} from "lucide-react";
import { PatientDiaryEntry, PatientMoodKey } from "../types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PatientDiaryTabProps {
  entries: PatientDiaryEntry[];
  onAddEntry: (entry: Omit<PatientDiaryEntry, "id">) => void;
  onDeleteEntry: (id: string) => void;
}

const MOODS: {
  key: PatientMoodKey;
  label: string;
  icon: React.ElementType;
  colorClass: string;
}[] = [
  { key: "energia", label: "Con energía", icon: Zap, colorClass: "text-amber-500" },
  { key: "excelente", label: "Excelente", icon: Smile, colorClass: "text-emerald-500" },
  { key: "tranquila", label: "Tranquila", icon: Heart, colorClass: "text-rose-500" },
  { key: "cansada", label: "Cansada", icon: Clock, colorClass: "text-slate-400" },
  { key: "ansiedad", label: "Con ansiedad", icon: HelpCircle, colorClass: "text-indigo-500" },
];

export function PatientDiaryTab({
  entries,
  onAddEntry,
  onDeleteEntry,
}: PatientDiaryTabProps) {
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[number]>(MOODS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Escribe tu registro antes de guardar.");
      return;
    }

    const now = new Date();
    const formattedDate = `Hoy, ${now.toLocaleDateString("es-CL", { day: "numeric", month: "long" })}`;
    const formattedTime = now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

    onAddEntry({
      date: formattedDate,
      time: formattedTime,
      mood: selectedMood.key,
      moodLabel: selectedMood.label,
      content: content.trim(),
    });

    setContent("");
    toast.success("¡Entrada guardada en tu diario! (+15 puntos)", {
      description: "Registrar tus sensaciones ayuda a tu nutricionista a personalizar tu plan.",
    });
  };

  const getMoodConfig = (key: PatientMoodKey) => {
    return MOODS.find((m) => m.key === key) || MOODS[0];
  };

  return (
    <div className="space-y-6">
      {/* 1. Formulario para escribir una nueva entrada */}
      <div className="rounded-2xl border border-[#E9E5E7] bg-white p-4 sm:p-6 shadow-2xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-[#20212B] tracking-tight">
              Mi Diario de Hábitos & Sensaciones
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F0F5DF] text-[#5A781E]">
              Espacio Personal
            </span>
          </div>
          <p className="text-xs text-[#626573] mt-0.5">
            Escribe cómo te sientes hoy, si tuviste algún antojo, cómo estuvo tu energía o digestión.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Estado de Ánimo */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ¿Cómo te sientes en este momento?
            </label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((mood) => {
                const Icon = mood.icon;
                const isSelected = selectedMood.key === mood.key;
                return (
                  <button
                    key={mood.key}
                    type="button"
                    onClick={() => setSelectedMood(mood)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs",
                      isSelected
                        ? "bg-[#86A83C] text-white shadow-sm shadow-[#86A83C]/20 border border-[#78A82F] scale-102"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-white" : mood.colorClass)} />
                    <span>{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo de texto libre */}
          <div className="space-y-1.5">
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ej: Hoy me sentí con mucha energía después del almuerzo, la quinoa me sentó muy bien. Por la tarde salí a caminar 40 minutos..."
              className="w-full rounded-xl border border-[#E9E5E7] bg-slate-50/50 p-3.5 text-xs text-[#20212B] placeholder:text-slate-400 focus:bg-white focus:border-[#86A83C] focus:ring-1 focus:ring-[#86A83C] outline-none transition-all leading-relaxed resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>Ganas +15 puntos por cada registro</span>
            </span>

            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] text-white text-xs font-bold transition-all shadow-sm shadow-[#86A83C]/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Guardar en mi diario</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Historial de Entradas Anteriores */}
      <div className="space-y-4">
        <h3 className="text-sm font-extrabold text-[#20212B]">
          Entradas Recientes ({entries.length})
        </h3>

        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Aún no tienes entradas registradas. ¡Escribe tu primera reflexión arriba!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const moodConfig = getMoodConfig(entry.mood);
              const MoodIcon = moodConfig.icon;
              return (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-[#E9E5E7] bg-white p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                        <MoodIcon className={cn("w-3.5 h-3.5", moodConfig.colorClass)} />
                      </div>
                      <span className="text-xs font-bold text-[#20212B]">{entry.moodLabel}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {entry.date} ({entry.time} hrs)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onDeleteEntry(entry.id);
                        toast.info("Entrada eliminada");
                      }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar entrada"
                      aria-label="Eliminar entrada"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    {entry.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
