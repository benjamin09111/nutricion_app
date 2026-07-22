"use client";

import React, { useMemo, useState } from "react";
import { User, X, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

export interface PlanPatient {
  id?: string;
  fullName: string;
  email?: string | null;
  ageYears?: number | null;
  weight?: number | null;
  height?: number | null;
  gender?: string;
  nutritionalFocus?: string;
  fitnessGoals?: string;
  restrictions?: string[];
  likes?: string;
  clinicalSummary?: string;
  activityLevel?: string;
  phone?: string;
  documentId?: string;
  birthDate?: string;
  tags?: string[];
  dietRestrictions?: string[];
}

interface PlanPatientSelectorProps {
  patient: PlanPatient | null;
  onSelect: (patient: PlanPatient) => void;
  onClear: () => void;
  fetchPatients: () => Promise<PlanPatient[]>;
  className?: string;
}

export function PlanPatientSelector({
  patient,
  onSelect,
  onClear,
  fetchPatients,
  className,
}: PlanPatientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<PlanPatient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    return patients.filter((p) =>
      (p.fullName || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [patients, search]);

  const openModal = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setSearch("");
    try {
      const data = await fetchPatients();
      setPatients(data || []);
    } catch {
      // handled silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (p: PlanPatient) => {
    onSelect(p);
    setIsOpen(false);
    toast.success(`Paciente ${p.fullName} seleccionado.`);
  };

  if (patient?.fullName) {
    return (
      <div className={cn("flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5", className)}>
        <User className="h-4 w-4 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-900 truncate">{patient.fullName}</p>
          <div className="flex gap-2 text-xs text-emerald-700">
            {patient.ageYears != null && <span>{patient.ageYears} a&ntilde;os</span>}
            {patient.weight != null && <span>{patient.weight} kg</span>}
            {patient.height != null && <span>{patient.height} cm</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full p-1.5 text-rose-500 hover:bg-rose-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={openModal}
        className={cn("h-10 rounded-xl border-slate-200 text-sm font-semibold", className)}
      >
        <User className="mr-2 h-4 w-4" />
        Vincular paciente
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-lg">
        <div className="p-6">
          <h3 className="mb-4 text-base font-semibold text-slate-800">Seleccionar paciente</h3>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="h-10 pl-10 rounded-xl"
              />
            </div>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-4">
                {patients.length === 0 ? "No hay pacientes registrados." : "Sin resultados."}
              </p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id || p.fullName}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.fullName}</p>
                    {p.email && <p className="text-xs text-slate-500 truncate">{p.email}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
