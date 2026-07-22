import React from "react";
import { Eye, CalendarDays, User, Trash2, Edit2 } from "lucide-react";
import { RecordsTable, type Column } from "@/components/shared/RecordsTable";
import { Consultation } from "@/features/consultations";
import { formatDateOnlyForLocale } from "@/features/patients/utils/patient-helpers";

interface ConsultationsTableViewProps {
  consultations: Consultation[];
  isLoading: boolean;
  onViewConsultation: (id: string) => void;
  onViewPatient?: (patientId: string) => void;
  onEdit?: (id: string) => void;
  onDelete: (id: string) => void;
  isInsidePatient?: boolean;
  footer?: React.ReactNode;
}

export function ConsultationsTableView({
  consultations,
  isLoading,
  onViewConsultation,
  onViewPatient,
  onEdit,
  onDelete,
  isInsidePatient = false,
  footer,
}: ConsultationsTableViewProps) {
  const columns: Column<Consultation>[] = [
    ...(isInsidePatient
      ? []
      : [
          {
            header: "Paciente",
            render: (item: Consultation) => (
              <div className="flex items-center">
                <div className="h-10 w-10 shrink-0">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold border border-indigo-100 shadow-sm">
                    {item.patientName?.charAt(0) || "P"}
                  </div>
                </div>
                <div className="ml-4 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 leading-none mb-1 truncate">
                    {item.patientName}
                  </div>
                  {onViewPatient && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewPatient(item.patientId);
                      }}
                      className="text-xs text-slate-500 font-medium hover:text-indigo-600 transition-colors text-left cursor-pointer"
                    >
                      Ver ficha del paciente
                    </button>
                  )}
                </div>
              </div>
            ),
          } as Column<Consultation>,
        ]),
    {
      header: "Fecha",
      render: (item: Consultation) => (
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs">
          <CalendarDays className="w-4 h-4 text-indigo-400" />
          {formatDateOnlyForLocale(item.date, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      ),
    },
    {
      header: "Sesión",
      render: (item: Consultation) => (
        <span className="text-sm font-semibold text-slate-800 tracking-tight block max-w-xs truncate">
          {item.title}
        </span>
      ),
    },
    {
      header: "Acciones",
      className: "text-right",
      render: (item: Consultation) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {!isInsidePatient && onViewPatient && (
            <button
              onClick={() => onViewPatient(item.patientId)}
              className="group relative p-2.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all cursor-pointer"
              title="Ver Paciente"
            >
              <User className="w-4.5 h-4.5" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(item.id)}
              className="group relative p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
              title="Editar Consulta"
            >
              <Edit2 className="w-4.5 h-4.5" />
            </button>
          )}
          <button
            onClick={() => onViewConsultation(item.id)}
            className="group relative p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
            title="Ver Consulta"
          >
            <Eye className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="group relative p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Eliminar"
          >
            <Trash2 className="w-4.5 h-4.5 text-rose-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <RecordsTable
      columns={columns}
      data={consultations}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      loadingColumns={columns.length}
      onRowClick={(item) => onViewConsultation(item.id)}
      rowClassName="hover:bg-slate-50 transition-colors group cursor-pointer"
      emptyState={
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
            <CalendarDays className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">
            Sin consultas registradas
          </p>
        </div>
      }
      footer={footer}
    />
  );
}
