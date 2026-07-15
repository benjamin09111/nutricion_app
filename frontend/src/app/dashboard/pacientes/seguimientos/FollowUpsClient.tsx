"use client";

import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ComingSoonBanner } from "@/components/shared/ComingSoonBanner";

export default function FollowUpsClient() {
  return (
    <ModuleLayout
      title="Seguimientos de mis pacientes"
      description="Revisa en una sola pantalla los seguimientos más recientes, priorizando a los pacientes que todavía te dejaron preguntas pendientes."
      className="max-w-7xl"
    >
      <div className="bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-6">
        <ComingSoonBanner />
      </div>
    </ModuleLayout>
  );
}

