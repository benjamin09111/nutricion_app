import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center min-h-[500px]">
      <div className="relative flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden="true" />
        <p className="text-sm font-bold text-slate-700" aria-live="polite">
          Cargando...
        </p>
      </div>
    </div>
  );
}

