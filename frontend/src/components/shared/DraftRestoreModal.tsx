"use client";

import { RotateCcw, Plus, Clock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface DraftRestoreModalProps {
    isOpen: boolean;
    moduleName: string;
    draftLabel: string; // e.g. "Dieta: Protocolo Hipertrofia"
    draftDate?: string; // ISO date string
    onKeep: () => void;
    onDiscard: () => void;
}

export function DraftRestoreModal({
    isOpen,
    moduleName,
    draftLabel,
    draftDate,
    onKeep,
    onDiscard,
}: DraftRestoreModalProps) {
    const formattedDate = draftDate
        ? new Date(draftDate).toLocaleString("es-CL", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        })
        : null;

    return (
        <Modal isOpen={isOpen} onClose={onKeep} title="">
            <div className="px-2 pb-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Clock className="h-8 w-8 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">
                        Tienes un borrador guardado
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                        Encontramos progreso anterior en{" "}
                        <span className="font-bold text-slate-700">{moduleName}</span>.
                        ¿Qué deseas hacer?
                    </p>
                </div>

                {/* Draft info pill */}
                {draftLabel && (
                    <div className="mb-6 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-700 truncate">
                                {draftLabel}
                            </p>
                            {formattedDate && (
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    Guardado: {formattedDate}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Options */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onKeep}
                        className="flex flex-col items-start p-5 border-2 border-indigo-500 bg-indigo-50/50 rounded-2xl hover:bg-indigo-50 transition-all cursor-pointer group"
                    >
                        <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <RotateCcw className="h-5 w-5 text-indigo-600" />
                        </div>
                        <h4 className="font-black text-indigo-900 text-sm leading-tight">
                            Mantener borrador
                        </h4>
                        <p className="text-[10px] text-indigo-600/70 mt-1 font-medium leading-snug">
                            Continuar donde lo dejaste
                        </p>
                    </button>

                    <button
                        onClick={onDiscard}
                        className="flex flex-col items-start p-5 border-2 border-slate-200 bg-white rounded-2xl hover:border-rose-300 hover:bg-rose-50/30 transition-all cursor-pointer group"
                    >
                        <div className="h-10 w-10 bg-slate-100 group-hover:bg-rose-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-all">
                            <Plus className="h-5 w-5 text-slate-500 group-hover:text-rose-600" />
                        </div>
                        <h4 className="font-black text-slate-800 group-hover:text-rose-700 text-sm leading-tight transition-colors">
                            Empezar de cero
                        </h4>
                        <p className="text-[10px] text-slate-400 group-hover:text-rose-500 mt-1 font-medium leading-snug transition-colors">
                            Borra el progreso anterior
                        </p>
                    </button>
                </div>
            </div>
        </Modal>
    );
}
