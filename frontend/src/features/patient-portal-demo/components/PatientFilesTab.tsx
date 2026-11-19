"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  Eye,
  X,
  CheckCircle2,
} from "lucide-react";
import { PatientDeliverableFile } from "../types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PatientFilesTabProps {
  files: PatientDeliverableFile[];
}

export function PatientFilesTab({ files }: PatientFilesTabProps) {
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<PatientDeliverableFile | null>(null);

  const handleDownload = (file: PatientDeliverableFile) => {
    toast.success(`Descargando "${file.title}"...`, {
      description: "Documento oficial generado con NutriNet.",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Limpio */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E9E5E7] shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#20212B]">
            Pautas & Material Compartido
          </h2>
          <p className="text-xs text-[#626573] mt-0.5">
            Documentos y recetarios preparados por tu nutricionista
          </p>
        </div>
        <span className="text-xs font-bold text-[#668E20] bg-[#F0F5DF] px-2.5 py-1 rounded-full">
          {files.length} archivos
        </span>
      </div>

      {/* Grid de Archivos y Pautas (Suelto y sin marcos pesados) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="rounded-2xl border border-[#E9E5E7] bg-white p-4 sm:p-5 shadow-2xs hover:border-[#86A83C] transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[#5A781E] bg-[#F0F5DF] px-2 py-0.5 rounded-md">
                  {file.category}
                </span>
                <span className="text-[11px] text-[#626573]">{file.updatedAt}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#20212B]">
                  {file.title}
                </h3>
                <p className="text-xs text-[#626573] mt-0.5 line-clamp-2">
                  {file.description}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                {file.fileSize}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedFileForPreview(file)}
                  className="h-8 px-2.5 rounded-lg border border-[#E9E5E7] hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(file)}
                  className="h-8 px-3 rounded-lg bg-[#86A83C] hover:bg-[#78A82F] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Vista Previa Simple */}
      {selectedFileForPreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedFileForPreview(null)}
          />

          <div className="relative w-full max-w-lg rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 z-10 space-y-4 max-h-[calc(100dvh-3rem)] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F0F5DF] flex items-center justify-center text-[#5A781E]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#20212B]">
                    {selectedFileForPreview.title}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {selectedFileForPreview.category} • {selectedFileForPreview.updatedAt}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFileForPreview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6 text-center space-y-2">
              <p className="text-xs font-bold text-[#20212B]">
                Vista previa de {selectedFileForPreview.title}
              </p>
              <p className="text-xs text-[#626573] max-w-sm mx-auto leading-relaxed">
                {selectedFileForPreview.description}
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#5A781E] bg-[#F0F5DF] px-3 py-1 rounded-full font-semibold mt-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Documento verificado por Nutri. Valentina Soto</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedFileForPreview(null)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownload(selectedFileForPreview);
                  setSelectedFileForPreview(null);
                }}
                className="h-9 px-4 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
