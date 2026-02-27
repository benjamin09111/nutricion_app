import ConsultationsClient from "./ConsultationsClient";

export default function ConsultationsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
        <div>
          <p className="text-emerald-600 font-semibold uppercase text-xs tracking-tight mb-2">
            Clinical Intelligence
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
            Mis Consultas
          </h2>
          <p className="mt-2 text-slate-500 font-medium text-sm max-w-md">
            Sistema centralizado de seguimiento y evolución clínica de
            pacientes.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-tight">
              Live Sync
            </span>
          </div>
        </div>
      </div>

      <ConsultationsClient />
    </div>
  );
}
