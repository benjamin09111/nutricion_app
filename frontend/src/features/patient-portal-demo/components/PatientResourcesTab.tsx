"use client";

import React, { useState } from "react";
import {
  Clock,
  ArrowRight,
  Bookmark,
  X,
  CheckCircle2,
} from "lucide-react";
import { PatientResourceItem } from "../types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PatientResourcesTabProps {
  resources: PatientResourceItem[];
}

export function PatientResourcesTab({ resources }: PatientResourcesTabProps) {
  const [selectedResource, setSelectedResource] = useState<PatientResourceItem | null>(null);

  return (
    <div className="space-y-4">
      {/* Header Limpio */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E9E5E7] shadow-2xs">
        <h2 className="text-base sm:text-lg font-bold text-[#20212B]">
          Educación & Guías Nutricionales
        </h2>
        <p className="text-xs text-[#626573] mt-0.5">
          Artículos breves seleccionados por tu nutricionista para aprender hábitos saludables
        </p>
      </div>

      {/* Grid de Recursos (Suelto, sin sobrecarga) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {resources.map((res) => (
          <div
            key={res.id}
            className="rounded-2xl border border-[#E9E5E7] bg-white p-4 sm:p-5 shadow-2xs hover:border-[#86A83C] transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[#5A781E] bg-[#F0F5DF] px-2 py-0.5 rounded-md">
                  {res.category}
                </span>
                <span className="text-[11px] text-[#626573] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {res.readTimeMinutes} min
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#20212B] line-clamp-2">
                  {res.title}
                </h3>
                <p className="text-xs text-[#626573] mt-1 leading-relaxed line-clamp-2">
                  {res.summary}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                #{res.tags[0]}
              </span>

              <button
                type="button"
                onClick={() => setSelectedResource(res)}
                className="text-xs font-bold text-[#668E20] hover:text-[#527518] flex items-center gap-1 cursor-pointer"
              >
                <span>Leer guía</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Lectura Simple */}
      {selectedResource && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedResource(null)}
          />

          <div className="relative w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 z-10 space-y-4 max-h-[calc(100dvh-3rem)] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase text-[#5A781E] bg-[#F0F5DF] px-2 py-0.5 rounded-md">
                {selectedResource.category} • {selectedResource.readTimeMinutes} min
              </span>
              <button
                type="button"
                onClick={() => setSelectedResource(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#20212B]">
              {selectedResource.title}
            </h3>

            <p className="text-xs text-[#626573] leading-relaxed bg-[#F0F5DF]/30 p-3.5 rounded-xl">
              {selectedResource.summary}
            </p>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#20212B] uppercase tracking-wider">
                Puntos destacados:
              </h4>
              <div className="space-y-1.5">
                {selectedResource.keyTakeaways.map((takeaway, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#86A83C] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{takeaway}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedResource(null)}
                className="h-9 px-4 rounded-xl bg-[#86A83C] text-white text-xs font-bold hover:bg-[#78A82F] transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
