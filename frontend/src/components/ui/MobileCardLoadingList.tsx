interface MobileCardLoadingListProps {
  rows?: number;
}

export function MobileCardLoadingList({ rows = 3 }: MobileCardLoadingListProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-slate-100 rounded-xl" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
              <div className="h-3 w-1/2 bg-slate-50 rounded" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
