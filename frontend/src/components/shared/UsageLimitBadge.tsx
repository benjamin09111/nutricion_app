"use client";

import { cn } from "@/lib/utils";

interface UsageLimitBadgeProps {
  label: string;
  usage: number;
  limit?: number | null;
  className?: string;
}

export function UsageLimitBadge({
  label,
  usage,
  limit,
  className,
}: UsageLimitBadgeProps) {
  const isUnlimited = typeof limit === "number" && limit < 0;
  const maxLimit = isUnlimited || limit === undefined || limit === null ? null : Number(limit);
  const isAtLimit = maxLimit !== null && usage >= maxLimit;
  const ratio = maxLimit !== null && maxLimit > 0 ? Math.min(100, Math.round((usage / maxLimit) * 100)) : 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-[#E8EBF0] bg-white px-2.5 py-1.5 shrink-0",
        className,
      )}
    >
      <span className="font-medium text-[#667085] uppercase text-[10px] tracking-wider">{label}</span>
      <span className={cn("font-semibold text-xs", isAtLimit ? "text-rose-600" : "text-[#20283B]")}>
        {usage} / {maxLimit === null ? "∞" : maxLimit}
      </span>
      {maxLimit !== null && maxLimit > 0 && (
        <div className="h-1.5 w-14 rounded-full bg-[#F3F5F7] overflow-hidden ml-0.5">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isAtLimit ? "bg-rose-500" : "bg-[#7048C6]",
            )}
            style={{ width: `${ratio}%` }}
          />
        </div>
      )}
    </div>
  );
}
