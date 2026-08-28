"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  UserRound,
  Calculator,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/context/SubscriptionContext";
import { PatientSelectionModal } from "@/components/patients/PatientSelectionModal";
import { TestSelectorPanel } from "@/features/screening-tests/components/TestSelectorPanel";
import { ScreeningTestModal } from "@/features/screening-tests/components/ScreeningTestModal";
import { suggestTestType } from "@/features/screening-tests";
import type { ScreeningTestType, PatientAutoFillData } from "@/features/screening-tests";

type PatientItem = {
  id?: string;
  fullName?: string;
  name?: string;
  weight?: number | string | null;
  height?: number | string | null;
  age?: number | null;
  ageYears?: number | null;
  birthDate?: string | null;
  gender?: string | null;
};

export default function TestsPage() {
  const { can, plan } = useSubscription();
  const isFreemium = plan === "free";
  const patientImportLocked = isFreemium || !can("IMPORT_PATIENT_DATA");

  // UI state
  const [showGlossary, setShowGlossary] = useState(false);

  // Patient import state
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientsError, setPatientsError] = useState<string | null>(null);

  // Test modal state
  const [activeTestType, setActiveTestType] = useState<ScreeningTestType | null>(null);

  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    setPatientsError(null);
    try {
      const res = await api.get("/patients?status=Activos&limit=100");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.items)
              ? data.items
              : [];
        setPatients(list);
      } else {
        setPatientsError("No se pudieron cargar los pacientes.");
      }
    } catch {
      setPatientsError("Error al conectar con el servidor.");
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleOpenPatientModal = () => {
    if (patientImportLocked) {
      window.dispatchEvent(
        new CustomEvent("show-freemium-upgrade", {
          detail: {
            feature: "Importar datos de paciente",
            description:
              "La importación de datos de pacientes está disponible únicamente en los planes de pago.",
          },
        }),
      );
      return;
    }
    if (patients.length === 0 && !isLoadingPatients) {
      fetchPatients();
    }
    setIsPatientModalOpen(true);
  };

  const handleSelectPatient = (p: PatientItem) => {
    setSelectedPatient(p);
    setIsPatientModalOpen(false);
  };

  const parseNum = (val: string | number | null | undefined): number | null => {
    if (val === null || val === undefined) return null;
    const clean = String(val).trim().replace(",", ".");
    if (!clean) return null;
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
  };

  // Build patient auto-fill object
  const patientAutoFill: PatientAutoFillData | undefined = selectedPatient
    ? {
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName || selectedPatient.name,
        age: selectedPatient.ageYears ?? selectedPatient.age ?? undefined,
        weight: parseNum(selectedPatient.weight) ?? undefined,
        height: parseNum(selectedPatient.height) ?? undefined,
        gender: selectedPatient.gender ?? undefined,
      }
    : undefined;

  // Auto-suggest test type
  const suggestedTest = patientAutoFill ? suggestTestType(patientAutoFill) : null;

  return (
    <ModuleLayout
      title="Tests de Tamizaje Nutricional"
      description="Herramientas clínicas validadas (NRS-2002, MUST, MNA, StrongKids, Atalah) para la evaluación del riesgo de malnutrición."
      rightContent={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenPatientModal}
            className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold h-8 rounded-xl flex-1 sm:flex-none justify-center gap-1 cursor-pointer"
          >
            {patientImportLocked ? (
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <UserRound className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            )}
            <span>{selectedPatient ? "Cambiar paciente" : "Importar paciente"}</span>
          </Button>

          <Link href="/dashboard/herramientas/calculos">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold h-8 rounded-xl flex-1 sm:flex-none justify-center gap-1 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Ir a Calculadora Nutricional</span>
            </Button>
          </Link>
        </div>
      }
    >

      {/* Glosario Clínico Toggle */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowGlossary(!showGlossary)}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer text-left"
        >
          <span>ℹ️ Criterios de tamizaje nutricional aplicados (ESPEN, BAPEN, Nestlé MNA®, MINSAL Chile)</span>
          <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform", showGlossary && "rotate-180")} />
        </button>
        {showGlossary && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <strong className="text-slate-800">Adultos Hospitalizados:</strong> NRS-2002 (ESPEN 2002) evalúa severidad de enfermedad y pérdida nutricional.
            </div>
            <div>
              <strong className="text-slate-800">Ambulatorio / Comunidad:</strong> MUST (BAPEN) e Indicadores Atalah (Embarazadas MINSAL).
            </div>
            <div>
              <strong className="text-slate-800">Pediatría & Adulto Mayor:</strong> StrongKids (&lt;18 años) y MNA® Full/SF (&ge;65 años).
            </div>
          </div>
        )}
      </div>

      {/* Hero Banner de Paciente Importado (estilo exacto Calculadora) */}
      {selectedPatient && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 mb-6 shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-black uppercase text-white tracking-wide">
                  {selectedPatient.fullName || selectedPatient.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase border border-emerald-500/30">
                  Paciente Importado
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {selectedPatient.weight ? `${selectedPatient.weight} kg` : "Peso N/I"} •{" "}
                {selectedPatient.height ? `${selectedPatient.height} cm` : "Talla N/I"} •{" "}
                {patientAutoFill?.age ? `${patientAutoFill.age} años` : "Edad N/I"}
                {suggestedTest && ` — Test recomendado: ${suggestedTest.toUpperCase()}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {suggestedTest && (
              <Button
                type="button"
                size="sm"
                onClick={() => setActiveTestType(suggestedTest)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs h-8 px-4 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Ejecutar {suggestedTest}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPatient(null)}
              className="text-xs border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700 h-8 rounded-xl cursor-pointer"
            >
              Limpiar
            </Button>
          </div>
        </div>
      )}

      {/* Grid de Pautas de Tamizaje */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <TestSelectorPanel
          onSelect={(type) => setActiveTestType(type)}
          locked={isFreemium}
          suggestedTest={suggestedTest}
        />
      </div>

      {/* Modal de Selección de Pacientes */}
      <PatientSelectionModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        patients={patients}
        onSelectPatient={handleSelectPatient}
        isLoading={isLoadingPatients}
        selectedPatientId={selectedPatient?.id}
        error={patientsError}
        title="Seleccionar paciente para Tamizaje"
      />

      {/* Modal del Test Seleccionado */}
      {activeTestType && (
        <ScreeningTestModal
          testType={activeTestType}
          isOpen={Boolean(activeTestType)}
          onClose={() => setActiveTestType(null)}
          patientData={patientAutoFill}
        />
      )}
    </ModuleLayout>
  );
}
