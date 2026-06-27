import React from "react";
import CreationsClient from "@/app/dashboard/creaciones/CreationsClient";
import { Patient } from "@/features/patients";
import { PatientPortalOverview } from "@/features/patient-portal";

interface PatientCreationsTabProps {
  patient: Patient;
  portalOverview: PatientPortalOverview | null;
  fetchPortalOverview: () => Promise<void>;
}

export function PatientCreationsTab({
  patient,
  portalOverview,
  fetchPortalOverview,
}: PatientCreationsTabProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <CreationsClient
        isInsidePatientDetail={true}
        fixedPatientName={patient.fullName}
        patientId={patient.id}
        sharedCreationIds={
          portalOverview?.sharedDeliverables?.map((plan) => plan.id) ?? []
        }
        onUpdate={fetchPortalOverview}
      />
    </div>
  );
}
