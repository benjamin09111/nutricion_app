"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Eye,
  Download,
  ArrowRight,
  Heart,
  Tag,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Patient } from "@/features/patients";
import { buildClinicalRecordDraft } from "@/features/patients/clinical-record";
import { buildClinicalRecordPdfData } from "@/features/patients/utils/clinical-record-export";
import { fetchApi } from "@/lib/api-base";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatRestrictions(restrictions?: string[], primaryCondition?: string) {
  if (!Array.isArray(restrictions) || restrictions.length === 0) {
    return [];
  }
  const trimmed = restrictions.map((r) => r.trim()).filter(Boolean);
  if (primaryCondition) {
    return trimmed.filter((r) => r.toLowerCase() !== primaryCondition.toLowerCase());
  }
  return trimmed;
}

interface ClinicalRecordPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onNavigateToPatient?: (patientId: string) => void;
}

export function ClinicalRecordPreviewModal({
  isOpen,
  onClose,
  patient,
  onNavigateToPatient,
}: ClinicalRecordPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"resumen" | "pdf">("resumen");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let currentUrl: string | null = null;
    let isCancelled = false;

    async function loadPdf() {
      if (!isOpen || !patient) {
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null);
        }
        setDraft(null);
        return;
      }

      setIsLoading(true);
      setActiveTab("resumen");

      try {
        const [{ pdf }, { ClinicalRecordPdfDocument }, ReactLib] = await Promise.all([
          import("@react-pdf/renderer"),
          import("@/features/pdf/ClinicalRecordPdfDocument"),
          import("react"),
        ]);

        const response = await fetchApi(`/patients/${patient.id}/clinical-record`);
        const clinicalRecord = response.ok ? await response.json() : null;
        const clinicalRecordDraft = buildClinicalRecordDraft(patient, clinicalRecord);
        const pdfData = buildClinicalRecordPdfData(patient, clinicalRecordDraft);

        const doc = ReactLib.createElement(ClinicalRecordPdfDocument, { data: pdfData });
        const blob = await pdf(doc as unknown as Parameters<typeof pdf>[0]).toBlob();

        if (!isCancelled) {
          currentUrl = URL.createObjectURL(blob);
          setPdfUrl(currentUrl);
          setDraft(clinicalRecordDraft);
        }
      } catch (err) {
        console.error("Error generating clinical record preview:", err);
        if (!isCancelled) {
          toast.error("Error al cargar la ficha clínica");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPdf();

    return () => {
      isCancelled = true;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [isOpen, patient?.id]);

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setDraft(null);
    onClose();
  };

  if (!patient) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Vista Previa de Ficha Clínica"
      description={`Ficha clínica y antecedentes de ${patient.fullName}`}
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Pestañas: Resumen Clínico / Vista Previa PDF */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("resumen")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === "resumen"
                  ? "bg-[#668E20] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Resumen Clínico</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pdf")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === "pdf"
                  ? "bg-[#668E20] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Vista Previa PDF</span>
            </button>
          </div>

          {pdfUrl && (
            <a
              href={pdfUrl}
              download={`Ficha_Clinica_${patient.fullName.replace(/\s+/g, "_")}.pdf`}
              className="h-8 px-3 rounded-xl bg-white border border-[#DDE7B8] hover:bg-[#F0F5DF] text-[#668E20] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </a>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="h-10 w-10 border-4 border-[#DDE7B8] border-t-[#86A83C] rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">
              Generando vista previa de la ficha clínica...
            </p>
          </div>
        ) : activeTab === "pdf" ? (
          /* Visor PDF embebido */
          <div className="space-y-3">
            <div className="relative w-full h-[65vh] sm:h-[70vh] rounded-2xl overflow-hidden bg-slate-50 border border-slate-200">
              {pdfUrl ? (
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=0`}
                  className="w-full h-full border-0"
                  title={`Ficha clínica en PDF de ${patient.fullName}`}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No se pudo cargar el visor PDF
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Vista estructurada de Resumen Clínico */
          <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1">
            {/* Tarjeta de Identidad */}
            <div className="p-4 rounded-2xl bg-[#F0F5DF]/60 border border-[#DDE7B8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-[#F0F5DF] border border-[#DDE7B8] flex items-center justify-center text-[#668E20] font-extrabold text-lg shrink-0 shadow-2xs">
                  {patient.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-[#20212B] text-base">
                    {patient.fullName}
                  </h4>
                  <p className="text-xs text-[#668E20] font-semibold">
                    {patient.documentId ? `RUT: ${patient.documentId}` : "Sin RUT"} • {patient.email || "Sin email"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {onNavigateToPatient && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onNavigateToPatient(patient.id);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>Ver paciente completo</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#668E20]" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab("pdf")}
                  className="px-4 py-2 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 shadow-2xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver en PDF</span>
                </button>
              </div>
            </div>

            {/* Antropometría básica */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Peso actual</span>
                <span className="text-base font-extrabold text-[#20212B] mt-0.5 block">
                  {patient.weight ? `${patient.weight} kg` : "—"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Estatura</span>
                <span className="text-base font-extrabold text-[#20212B] mt-0.5 block">
                  {patient.height ? `${patient.height} cm` : "—"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">IMC estimado</span>
                <span className="text-base font-extrabold text-[#668E20] mt-0.5 block">
                  {patient.weight && patient.height
                    ? (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)
                    : "—"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Nivel actividad</span>
                <span className="text-base font-extrabold text-[#20212B] mt-0.5 block capitalize">
                  {patient.activityLevel || "Sedentario"}
                </span>
              </div>
            </div>

            {/* Diagnóstico y Anamnesis */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#668E20] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#86A83C]" />
                  <span>Diagnóstico Nutricional & Motivo</span>
                </span>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  {draft?.nutritionalAnamnesis?.diagnosticoNutricional ||
                    draft?.vitalHistory?.motivoConsulta ||
                    patient.primaryCondition ||
                    patient.clinicalSummary ||
                    patient.nutritionalFocus ||
                    "Control nutricional, evaluación antropométrica y hábitos de vida saludable."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Antecedentes Mórbidos y Familiares</span>
                </span>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  {draft?.vitalHistory?.diagnosedPathologies ||
                    draft?.vitalHistory?.familyHistory ||
                    "Sin antecedentes mórbidos personales de riesgo agudo; antecedentes familiares controlados."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Restricciones y Alergias Registradas</span>
                </span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {(() => {
                    const restrictions = formatRestrictions(
                      patient.dietRestrictions,
                      patient.primaryCondition
                    );
                    if (restrictions.length === 0)
                      return (
                        <p className="text-xs text-slate-400">
                          Sin restricciones alimentarias registradas.
                        </p>
                      );
                    return restrictions.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#FEFCE8] border border-[#FEF08A] px-2.5 py-1 text-xs font-bold text-[#854D0E]"
                      >
                        <Tag className="w-3 h-3 text-[#A16207]" />
                        <span>{r}</span>
                      </span>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
