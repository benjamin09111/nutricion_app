import { FileText, Loader2, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/Button";

type QuickPatientEmptyStateProps = {
  isLoading?: boolean;
  onImportPatient: () => void;
  onManualPatient: () => void;
  onContinueWithoutPatient: () => void;
};

export function QuickPatientEmptyState({
  isLoading = false,
  onImportPatient,
  onManualPatient,
  onContinueWithoutPatient,
}: QuickPatientEmptyStateProps) {
  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <div className="max-w-2xl">
        <p className="text-sm font-bold leading-6 text-amber-900">Puedes generar platos sin paciente o importar uno para personalizar mejor la IA.</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">Si importas un paciente, Naty considerará sus restricciones, objetivos y contexto clínico. El PDF sigue requiriendo un paciente vinculado.</p>
      </div>
      <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={onImportPatient}
          disabled={isLoading}
          className="h-10 min-w-44 justify-center rounded-xl border-emerald-200 bg-white px-4 text-sm text-emerald-700 font-semibold hover:bg-emerald-50 hover:border-emerald-300 transition-all"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-600" /> : <User className="mr-2 h-4 w-4" />}
          {isLoading ? "Cargando..." : "Importar paciente"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onManualPatient}
          disabled={isLoading}
          className="h-10 min-w-44 justify-center rounded-xl border-slate-200 bg-white px-4 text-sm text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <FileText className="mr-2 h-4 w-4" />
          Rellenar manualmente
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onContinueWithoutPatient}
          disabled={isLoading}
          className="h-10 min-w-44 justify-center rounded-xl border-indigo-200 bg-indigo-50 px-4 text-sm text-indigo-700 font-semibold hover:bg-indigo-100 hover:border-indigo-300 transition-all"
        >
          <Sparkles className="mr-2 h-4 w-4 text-indigo-600" />
          Continuar sin paciente
        </Button>
      </div>
    </div>
  );
}
