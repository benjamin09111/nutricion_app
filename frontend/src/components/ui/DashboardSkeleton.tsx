"use client";

import { Card, CardContent } from "@/components/ui/Card";

export function DashboardSkeleton() {
  return (
    <div className="w-full flex-1 flex flex-col justify-between gap-3 sm:gap-4 lg:gap-5 min-h-0 lg:overflow-hidden animate-pulse">
      {/* Row 1: Header Skeleton */}
      <div className="pt-1 space-y-2 shrink-0">
        <div className="h-4 w-28 rounded-full bg-slate-200/80" />
        <div className="h-7 sm:h-8 w-64 sm:w-80 rounded-xl bg-slate-200/80" />
        <div className="h-3.5 w-72 sm:w-96 rounded-lg bg-slate-200/60" />
      </div>

      {/* Row 2: Stats Cards Skeleton */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3 shrink-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-white/80 p-3 sm:p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-200/80 shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-slate-200/60" />
                <div className="h-6 w-12 rounded bg-slate-200/80" />
                <div className="h-2.5 w-24 rounded bg-slate-200/50" />
              </div>
            </div>
            <div className="h-4 w-4 rounded bg-slate-200/40" />
          </div>
        ))}
      </div>

      {/* Row 3: 3 Columns Skeleton */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 flex-1 min-h-0">
        {[1, 2, 3].map((col) => (
          <div key={col} className="flex flex-col min-h-0">
            <div className="flex items-center justify-between pb-1.5 shrink-0">
              <div className="h-3.5 w-24 rounded bg-slate-200/70" />
              <div className="h-3 w-12 rounded bg-slate-200/50" />
            </div>
            <div className="space-y-2 flex-1 min-h-0">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-slate-200/80 shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <div className="h-3.5 w-28 rounded bg-slate-200/80" />
                      <div className="h-2.5 w-20 rounded bg-slate-200/50" />
                    </div>
                  </div>
                  <div className="h-3.5 w-3.5 rounded bg-slate-200/40 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

