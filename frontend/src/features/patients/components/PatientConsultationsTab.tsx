import React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Patient } from "@/features/patients";
import { Consultation, ConsultationsTableView } from "@/features/consultations";

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

      <ConsultationsTableView
        consultations={clinicalConsultations}
        isLoading={isConsultationsLoading}
        onViewConsultation={(id) =>
          router.push(`/dashboard/consultas/${id}/view`)
        }
        onEdit={(id) =>
          router.push(`/dashboard/consultas/${id}`)
        }
        onDelete={(id) => {
          setConsultationToDelete(id);
          setIsDeleteConsultationConfirmOpen(true);
        }}
        isInsidePatient
      />
    </div>
  );
}
