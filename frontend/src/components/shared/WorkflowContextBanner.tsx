interface WorkflowContextBannerProps {
  projectName?: string | null;
  patientName?: string | null;
  mode?: string | null;
  moduleLabel: string;
}

export function WorkflowContextBanner({
  projectName,
  patientName,
  mode,
  moduleLabel,
}: WorkflowContextBannerProps) {
  if (!projectName && !patientName && !mode) return null;

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
        <span className="rounded-full bg-white px-2.5 py-1 text-emerald-700 border border-emerald-200">
          {moduleLabel}
        </span>
        {projectName ? (
          <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 border border-slate-200">
            Proyecto: {projectName}
          </span>
        ) : null}
        {patientName ? (
          <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 border border-slate-200">
            Paciente: {patientName}
          </span>
        ) : null}
        {mode ? (
          <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 border border-slate-200">
            Modo: {mode === "CLINICAL" ? "Clínico" : "General"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
