import React from "react";
import { useRouter } from "next/navigation";
import { Plus, CalendarDays, Eye, Edit2, Trash2, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Patient } from "@/features/patients";
import { Consultation } from "@/features/consultations";

interface PatientConsultationsTabProps {
  patient: Patient;
  clinicalConsultations: Consultation[];
  isConsultationsLoading: boolean;
  setConsultationToDelete: (id: string | null) => void;
  setIsDeleteConsultationConfirmOpen: (open: boolean) => void;
}

export function PatientConsultationsTab({
  patient,
  clinicalConsultations,
  isConsultationsLoading,
  setConsultationToDelete,
  setIsDeleteConsultationConfirmOpen,
}: PatientConsultationsTabProps) {
  const router = useRouter();

  return (
    <div className="space-y-6 lg:space-y-10 animate-in slide-in-from-right-4 duration-500 px-1 lg:px-6 py-2">
      <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900">
            Historial Clínico
          </h2>
          <p className="text-xs lg:text-sm font-medium text-slate-400">
            Visualiza y gestiona las consultas del paciente
          </p>
        </div>
        <Button
          onClick={() =>
            router.push(
              "/dashboard/consultas/nueva?patientId=" + patient.id,
            )
          }
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 px-6 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5 mr-2" />
          NUEVA CONSULTA
        </Button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isConsultationsLoading ? (
            <div className="p-20 flex justify-center lg:col-span-2">
              <div className="h-10 w-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : clinicalConsultations.length > 0 ? (
            clinicalConsultations.map((consultation) => (
              <div
                key={consultation.id}
                className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:scale-[1.01] hover:border-emerald-200 hover:bg-emerald-50/20 transition-all cursor-pointer"
                onClick={() =>
                  router.push(
                    `/dashboard/consultas/${consultation.id}/view`,
                  )
                }
              >
                <div className="flex items-center gap-4 lg:gap-6">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                    <CalendarDays className="w-6 h-6 text-slate-300 group-hover:text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-emerald-600 mb-1">
                      {new Date(consultation.date).toLocaleDateString(
                        "es-ES",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </div>
                    <h4 className="text-lg font-semibold text-slate-800 tracking-tight leading-none group-hover:text-slate-900">
                      {consultation.title}
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {consultation.metrics &&
                    consultation.metrics.length > 0 && (
                      <div className="hidden md:flex items-center gap-2">
                        {consultation.metrics.slice(0, 1).map((m, i) => (
                          <div
                            key={i}
                            className="px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-400"
                          >
                            {m.label}: {m.value}
                            {m.unit}
                          </div>
                        ))}
                      </div>
                    )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/dashboard/consultas/${consultation.id}/view`,
                        );
                      }}
                      className="p-3 rounded-xl text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer"
                      title="Ver consulta"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/dashboard/consultas/${consultation.id}`,
                        );
                      }}
                      className="p-3 rounded-xl text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer"
                      title="Editar consulta"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setConsultationToDelete(consultation.id);
                        setIsDeleteConsultationConfirmOpen(true);
                      }}
                      className="p-3 rounded-xl text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer"
                      title="Eliminar consulta"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-50 rounded-2xl p-16 text-center border-4 border-dashed border-slate-200/50 lg:col-span-2">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center mx-auto mb-6">
                <Activity className="w-10 h-10 text-slate-200" />
              </div>
              <h4 className="text-xs font-semibold text-slate-600 mb-2">
                Sin registros de consulta
              </h4>
              <p className="text-slate-400 font-medium max-w-xs mx-auto mb-8">
                Empieza a documentar el progreso de {patient.fullName}{" "}
                creando su primera consulta.
              </p>
              <Button
                onClick={() =>
                  router.push(
                    "/dashboard/consultas/nueva?patientId=" + patient.id,
                  )
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 px-4 rounded-2xl transition-all shadow-xl shadow-emerald-200/50 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Iniciar Evaluación
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
