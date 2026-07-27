import React from "react";
import { Eye, CalendarDays, User, Trash2, Edit2 } from "lucide-react";
import { RecordsTable, type Column } from "@/components/shared/RecordsTable";
import { Consultation } from "@/features/consultations";
import { formatDateOnlyForLocale } from "@/features/patients/utils/patient-helpers";
import { MobileCardLoadingList } from "@/components/ui/MobileCardLoadingList";

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
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block">
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
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <MobileCardLoadingList rows={3} />
        ) : consultations.length > 0 ? (
          consultations.map((item) => (
            <div
              key={item.id}
              onClick={() => onViewConsultation(item.id)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm active:scale-[0.99] transition-all space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 shrink-0">
                    {item.patientName?.charAt(0) || "P"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {item.patientName || "Paciente"}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                      <CalendarDays className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>
                        {formatDateOnlyForLocale(item.date, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {item.title && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                  {item.title}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                {!isInsidePatient && onViewPatient ? (
                  <button
                    onClick={() => onViewPatient(item.patientId)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    Ver Ficha <User className="w-3.5 h-3.5" />
                  </button>
                ) : <div />}

                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item.id)}
                      className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onViewConsultation(item.id)}
                    className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Ver"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition-all"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm font-medium">Sin consultas registradas</p>
          </div>
        )}

        {footer && <div className="pt-2">{footer}</div>}
      </div>
    </div>
  );
}
