"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  User,
  UserPlus,
  AlertCircle,
  Loader2,
  Check,
  X,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
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
      title=""
      className="max-w-2xl overflow-hidden p-0 rounded-3xl border border-slate-200 bg-white shadow-2xl"
    >
      {/* Header Premium */}
      <div className="relative border-b border-slate-100 bg-slate-50/90 px-6 pt-6 pb-5">
        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {title}
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Selecciona un paciente para personalizar la estrategia nutricional
              </p>
            </div>
          </div>
        </div>

        {/* Buscador Integrado */}
        <div className="relative mt-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, email o rut..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-2xl border-slate-200 bg-white pl-11 pr-10 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Contenido Principal con Altura Fija */}
      <div className="p-6 bg-white">
        <div className="flex items-center justify-between pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Pacientes ({filteredPatients.length})</span>
          {searchQuery && <span>Búsqueda activa</span>}
        </div>

        <div className="min-h-[320px] max-h-[380px] space-y-2.5 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
          {/* Skeleton de carga inicial */}
          {isLoading && patients.length === 0 && (
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 animate-pulse"
                >
                  <div className="h-11 w-11 rounded-2xl bg-slate-200/80" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded-md bg-slate-200/80" />
                    <div className="h-3 w-1/2 rounded-md bg-slate-200/50" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-3">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-rose-600">Error al cargar pacientes</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredPatients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <UserPlus className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">
                {searchQuery
                  ? "No se encontraron resultados"
                  : "Sin pacientes registrados"}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                {searchQuery
                  ? `No hay coincidencias para "${searchQuery}". Intenta con otros términos.`
                  : "Aún no tienes pacientes registrados en tu clínica."}
              </p>
            </div>
          )}

          {/* Lista de Pacientes */}
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
                  "group relative flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 bg-white",
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                    : "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 hover:shadow-md",
                  isLinkingThis && "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Avatar con Iniciales */}
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-black text-sm transition-transform duration-200 group-hover:scale-105",
                      isSelected
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                        : "bg-slate-100 text-slate-700 group-hover:bg-emerald-500 group-hover:text-white"
                    )}
                  >
                    {isLinkingThis ? (
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600 group-hover:text-white" />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Info Paciente */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {name}
                      </h3>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                          <Check className="h-3 w-3" /> Vinculado
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                      {patient.email || "Sin correo"}
                      {patient.weight ? ` · ${patient.weight} kg` : ""}
                      {patient.age || patient.ageYears ? ` · ${patient.age || patient.ageYears} años` : ""}
                    </p>

                    {/* Tags de Restricciones */}
                    {restrictions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {restrictions.slice(0, 3).map((r, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-600"
                          >
                            <ShieldAlert className="h-2.5 w-2.5" />
                            {r}
                          </span>
                        ))}
                        {restrictions.length > 3 && (
                          <span className="text-[10px] font-bold text-slate-400 self-center">
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
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 animate-pulse">
                      <span>Vinculando...</span>
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
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
