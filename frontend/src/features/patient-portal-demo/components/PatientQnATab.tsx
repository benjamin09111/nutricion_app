"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  MessageSquare,
  Send,
  ChevronDown,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PatientQnAItem } from "../types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PatientQnATabProps {
  qnaItems: PatientQnAItem[];
  onAskQuestion: (question: string) => void;
}

export function PatientQnATab({ qnaItems, onAskQuestion }: PatientQnATabProps) {
  const [newQuestion, setNewQuestion] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(qnaItems[0]?.id || null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) {
      toast.error("Escribe tu pregunta antes de enviar.");
      return;
    }

    onAskQuestion(newQuestion.trim());
    setNewQuestion("");
    toast.success("Pregunta enviada a Nutri. Valentina", {
      description: "Recibirás la respuesta en tu portal.",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Limpio */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E9E5E7] shadow-2xs">
        <h2 className="text-base sm:text-lg font-bold text-[#20212B]">
          Consultas & Dudas Frecuentes
        </h2>
        <p className="text-xs text-[#626573] mt-0.5">
          Respuestas clínicas de tu nutricionista sobre comidas y reemplazos
        </p>
      </div>

      {/* Formulario de Nueva Consulta (Limpio y directo) */}
      <div className="rounded-2xl border border-[#E9E5E7] bg-white p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#20212B]">
          <MessageSquare className="w-4 h-4 text-[#668E20]" />
          <span>Hacer una consulta a Valentina Soto</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            rows={2}
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="¿Tienes dudas sobre un alimento, reemplazo o porción? Escríbela aquí..."
            className="w-full rounded-xl border border-[#E9E5E7] bg-slate-50/50 p-3 text-xs text-[#20212B] placeholder:text-slate-400 focus:bg-white focus:border-[#86A83C] outline-none transition-all resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Respuesta en menos de 2 horas
            </span>
            <button
              type="submit"
              className="h-9 px-4 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar consulta</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Preguntas Resueltas */}
      <div className="space-y-2.5">
        {qnaItems.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-[#E9E5E7] bg-white overflow-hidden shadow-2xs transition-all"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-[#86A83C] shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-[#20212B] truncate">
                    {item.question}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-semibold text-[#5A781E] bg-[#F0F5DF] px-2 py-0.5 rounded-full">
                    {item.isResolved ? "Respondida" : "Pendiente"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-slate-400 transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs text-slate-700 leading-relaxed space-y-1">
                  <p className="font-semibold text-[#5A781E] text-[11px]">
                    Respuesta de Nutri. Valentina:
                  </p>
                  <p className="text-slate-600 bg-[#F0F5DF]/30 p-3 rounded-xl">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
