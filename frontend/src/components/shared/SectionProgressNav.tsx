import { CheckCircle2, Circle, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type SectionProgressStatus = "complete" | "pending" | "hidden";

export type SectionProgressNavItem = {
  id: string;
  label: string;
  status: SectionProgressStatus;
  active?: boolean;
  onClick: () => void;
};

type SectionProgressNavProps = {
  title?: string;
  items: SectionProgressNavItem[];
  className?: string;
};

const statusStyles: Record<
  SectionProgressStatus,
  {
    icon: typeof CheckCircle2;
    dot: string;
    text: string;
  }
> = {
  complete: {
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    text: "text-emerald-600",
  },
  pending: {
    icon: AlertCircle,
    dot: "bg-amber-500",
    text: "text-amber-500",
  },
  hidden: {
    icon: EyeOff,
    dot: "bg-slate-300",
    text: "text-slate-400",
  },
};

export function SectionProgressNav({
  title = "Indice rapido",
  items,
  className,
}: SectionProgressNavProps) {
  return (
    <aside
      className={cn(
        "w-52 rounded-[28px] border border-slate-200/80 bg-white/92 p-4 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur",
        className,
      )}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
        {title}
      </p>
      <div className="mt-4 space-y-1">
        {items.map((item, index) => {
          const status = statusStyles[item.status];
          const StatusIcon = status.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={cn(
                "group flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-all",
                item.active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <div className="flex min-h-8 w-5 justify-center pt-0.5">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full transition-colors",
                      item.active ? "bg-white" : status.dot,
                    )}
                  />
                  {index < items.length - 1 ? (
                    <span className="mt-2 h-8 w-px bg-slate-200" />
                  ) : null}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold leading-tight">
                    {item.label}
                  </span>
                  {item.active ? (
                    <Circle className="h-3.5 w-3.5 shrink-0 fill-current text-white" />
                  ) : (
                    <StatusIcon
                      className={cn("h-3.5 w-3.5 shrink-0", status.text)}
                    />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
