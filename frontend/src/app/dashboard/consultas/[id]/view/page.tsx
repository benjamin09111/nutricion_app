import { Suspense } from "react";
import ConsultationDetailClient from "./ConsultationDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConsultationDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="h-16 w-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-semibold text-xs text-center">
            Cargando consulta...
          </p>
        </div>
      }
    >
      <ConsultationDetailClient id={id} />
    </Suspense>
  );
}
