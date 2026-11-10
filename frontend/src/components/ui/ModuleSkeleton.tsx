"use client";

import { Card, CardContent } from "@/components/ui/Card";

export function ModuleSkeleton({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
} = {}) {
  return (
    <div className="w-full space-y-6 pb-8 animate-pulse">
      {/* Module Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 sm:h-9 w-48 sm:w-64 rounded-xl bg-slate-200/80" />
        <div className="h-4 w-72 sm:w-96 rounded-lg bg-slate-200/60" />
      </div>

      {/* Action / Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="h-10 w-full sm:w-80 rounded-xl bg-slate-200/70" />
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="h-10 w-24 rounded-xl bg-slate-200/60" />
          <div className="h-10 w-36 rounded-xl bg-slate-200/80" />
        </div>
      </div>

      {/* Main Content / Table Skeleton */}
      <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-xs">
        <CardContent className="p-0">
          <div className="border-b border-slate-100 p-4 flex items-center justify-between">
            <div className="h-4 w-32 rounded-md bg-slate-200/70" />
            <div className="h-4 w-20 rounded-md bg-slate-200/50" />
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200/80" />
                  <div className="space-y-2 min-w-0">
                    <div className="h-4 w-36 sm:w-48 rounded-md bg-slate-200/80" />
                    <div className="h-3 w-24 sm:w-36 rounded-md bg-slate-200/50" />
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="h-6 w-20 rounded-full bg-slate-200/60" />
                  <div className="h-8 w-8 rounded-xl bg-slate-200/50" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

