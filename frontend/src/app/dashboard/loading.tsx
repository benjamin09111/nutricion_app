export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center min-h-[500px]">
      <div className="relative flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600 shadow-lg shadow-emerald-500/20"></div>
        <p className="text-sm font-bold text-emerald-600/80 animate-pulse">
          Cargando...
        </p>
      </div>
    </div>
  );
}
