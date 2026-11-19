"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  UserPlus,
  AlertCircle,
  Loader2,
  Check,
  X,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

export interface SelectablePatient {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string | null;
  rut?: string | null;
  weight?: number | string | null;
  height?: number | string | null;
  age?: number | null;
  ageYears?: number | null;
  dietRestrictions?: string[] | null;
  restrictions?: string[] | null;
  tags?: string[] | null;
  nutritionalFocus?: string | null;
  fitnessGoals?: string | null;
  [key: string]: any;
}

interface PatientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: any[];
  onSelectPatient: (patient: any) => void | Promise<void>;
  isLoading?: boolean;
  selectedPatientId?: string | null;
  error?: string | null;
  title?: string;
}

export const PatientSelectionModal: React.FC<PatientSelectionModalProps> = ({
  isOpen,
  onClose,
  patients,
  onSelectPatient,
  isLoading = false,
  selectedPatientId,
  error = null,
  title = "Vincular Paciente",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [linkingPatientId, setLinkingPatientId] = useState<string | null>(null);

  const getPatientName = (patient: SelectablePatient) =>
    patient.fullName || patient.name || "Paciente sin nombre";

  const getPatientInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRestrictions = (patient: SelectablePatient): string[] => {
    const list = patient.dietRestrictions || patient.restrictions || patient.tags || [];
    return Array.isArray(list) ? list : [];
  };

  const filteredPatients = useMemo(() => {
    const list: SelectablePatient[] = Array.isArray(patients)
      ? patients
      : Array.isArray((patients as any)?.data)
        ? (patients as any).data
        : Array.isArray((patients as any)?.items)
          ? (patients as any).items
          : [];
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase().trim();
    return list.filter((patient) => {
      const name = getPatientName(patient).toLowerCase();
      const email = (patient.email || "").toLowerCase();
      const rut = (patient.rut || "").toLowerCase();
      return name.includes(query) || email.includes(query) || rut.includes(query);
    });
  }, [patients, searchQuery]);

  const handlePatientClick = async (patient: SelectablePatient) => {
    const id = patient.id || "linking-patient";
    setLinkingPatientId(id);
    try {
      await onSelectPatient(patient);
    } finally {
      setLinkingPatientId(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSearchQuery("");
        onClose();
      }}
      title={title}
      description="Selecciona un paciente para personalizar la estrategia nutricional"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Buscador Uniforme */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#848792]" />
          <input
            type="search"
            placeholder="Buscar por nombre, email o rut..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#E9E5E7] bg-white pl-10 pr-10 text-sm font-medium text-[#20212B] placeholder:text-[#848792] focus:outline-none focus:ring-2 focus:ring-[#86A83C]/15 focus:border-[#86A83C] transition-all shadow-2xs"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#20212B] p-1 rounded-lg cursor-pointer transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Encabezado de Lista */}
        <div className="flex items-center justify-between text-xs font-semibold text-[#626573] px-0.5">
          <span>Pacientes disponibles ({filteredPatients.length})</span>
          {searchQuery && (
            <span className="text-[#668E20] font-semibold">
              Búsqueda activa
            </span>
          )}
        </div>

        {/* Lista de Pacientes */}
        <div
          className="min-h-[280px] max-h-[380px] space-y-2.5 overflow-y-auto pr-1"
          style={{ scrollbarWidth: "thin" }}
        >
          {/* Skeleton de carga inicial */}
          {isLoading && patients.length === 0 && (
            <div className="space-y-2.5 pt-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 rounded-xl border border-[#E9E5E7] bg-white p-3.5 animate-pulse"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded-md bg-slate-200/70" />
                    <div className="h-3 w-1/2 rounded-md bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500 mb-3 border border-rose-100">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-rose-600">
                Error al cargar pacientes
              </p>
              <p className="text-xs text-[#626573] mt-1 max-w-xs">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredPatients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20] mb-3">
                <UserPlus className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-[#20212B]">
                {searchQuery
                  ? "No se encontraron resultados"
                  : "Sin pacientes registrados"}
              </p>
              <p className="text-xs text-[#626573] mt-1 max-w-xs">
                {searchQuery
                  ? `No hay coincidencias para "${searchQuery}". Intenta con otros términos.`
                  : "Aún no tienes pacientes registrados en tu clínica."}
              </p>
            </div>
          )}

          {/* Pacientes encontrados */}
          {filteredPatients.map((patient) => {
            const name = getPatientName(patient);
            const initials = getPatientInitials(name);
            const restrictions = getRestrictions(patient);
            const isSelected = selectedPatientId === patient.id;
            const isLinkingThis = linkingPatientId === patient.id;

            return (
              <button
                key={patient.id || Math.random().toString()}
                type="button"
                disabled={Boolean(linkingPatientId)}
                onClick={() => void handlePatientClick(patient)}
                className={cn(
                  "group flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all bg-white cursor-pointer",
                  isSelected
                    ? "border-[#86A83C] bg-[#F0F5DF]/50 shadow-2xs ring-1 ring-[#86A83C]/30"
                    : "border-[#E9E5E7] hover:border-[#86A83C] hover:bg-[#F0F5DF]/20 hover:shadow-2xs",
                  isLinkingThis && "border-[#86A83C] bg-[#F0F5DF] ring-2 ring-[#86A83C]/20",
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Avatar con Iniciales */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs transition-colors",
                      isSelected
                        ? "bg-[#86A83C] text-white"
                        : "bg-[#F0F5DF] text-[#668E20] group-hover:bg-[#86A83C] group-hover:text-white",
                    )}
                  >
                    {isLinkingThis ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#668E20] group-hover:text-white" />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Info Paciente */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-[#20212B] truncate">
                        {name}
                      </h4>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F0F5DF] px-2 py-0.5 text-[10px] font-semibold text-[#668E20] border border-[#DDE7B8]">
                          <Check className="h-3 w-3" /> Vinculado
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-[#626573] truncate mt-0.5">
                      {patient.email || "Sin correo"}
                      {patient.rut ? ` · ${patient.rut}` : ""}
                      {patient.weight ? ` · ${patient.weight} kg` : ""}
                      {patient.age || patient.ageYears
                        ? ` · ${patient.age || patient.ageYears} años`
                        : ""}
                    </p>

                    {/* Tags de Restricciones */}
                    {restrictions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {restrictions.slice(0, 3).map((r, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-medium text-amber-800"
                          >
                            <ShieldAlert className="h-2.5 w-2.5 text-amber-600" />
                            {r}
                          </span>
                        ))}
                        {restrictions.length > 3 && (
                          <span className="text-[10px] font-medium text-[#848792] self-center">
                            +{restrictions.length - 3} más
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acción a la derecha */}
                <div className="ml-3 shrink-0">
                  {isLinkingThis ? (
                    <span className="text-xs font-semibold text-[#668E20] animate-pulse">
                      Vinculando...
                    </span>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-[#848792] group-hover:bg-[#86A83C] group-hover:text-white transition-all">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
