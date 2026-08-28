"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, ArrowLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export function ReturnToConsultationWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkMode } = useTheme();

  const [hasDraft, setHasDraft] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);

  const normalizedPathname = pathname || "";
  const isConsultationCreateRoute = normalizedPathname.startsWith("/dashboard/consultas/nueva");
  const isFromConsultationQuery = searchParams.get("fromConsultation") === "true";
  const isPlanCreationRoute =
    normalizedPathname.startsWith("/dashboard/rapido") ||
    normalizedPathname.startsWith("/dashboard/dietas") ||
    normalizedPathname.startsWith("/dashboard/dieta") ||
    normalizedPathname.startsWith("/dashboard/recetas") ||
    normalizedPathname.startsWith("/dashboard/planes");

  const isTargetContext = isFromConsultationQuery || isPlanCreationRoute;

  useEffect(() => {
    if (!isTargetContext || isConsultationCreateRoute) {
      setHasDraft(false);
      return;
    }

    const checkDraft = () => {
      try {
        const stored = localStorage.getItem("active_consultation_draft");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.active) {
            setHasDraft(true);
            setPatientId(parsed.patientId || null);
            return;
          }
        }
      } catch {
        /* ignore */
      }

      if (isFromConsultationQuery) {
        setHasDraft(true);
      } else {
        setHasDraft(false);
      }
    };

    checkDraft();
    const interval = setInterval(checkDraft, 2000);
    return () => clearInterval(interval);
  }, [isTargetContext, isConsultationCreateRoute, isFromConsultationQuery]);

  if (!isTargetContext || isConsultationCreateRoute || !hasDraft) {
    return null;
  }

  const handleReturn = () => {
    const targetUrl = patientId
      ? `/dashboard/consultas/nueva?patientId=${patientId}`
      : "/dashboard/consultas/nueva";
    router.push(targetUrl);
  };

  return (
    <div className="fixed bottom-6 right-24 z-[70] hidden sm:flex items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        type="button"
        onClick={handleReturn}
        className={cn(
          "group relative flex items-center gap-2.5 h-14 px-4 rounded-2xl shadow-xl transition-all duration-300 active:scale-95 cursor-pointer border",
          isDarkMode
            ? "bg-slate-900/95 hover:bg-slate-800 text-white border-indigo-500/40 shadow-indigo-950/50 backdrop-blur-md"
            : "bg-slate-900 hover:bg-slate-800 text-white border-indigo-400/30 shadow-indigo-900/20"
        )}
        title="Volver a la consulta en borrador"
      >
        <div className="relative flex items-center justify-center h-8 w-8 rounded-xl bg-indigo-600 text-white group-hover:bg-indigo-500 transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>

        <div className="flex flex-col text-left pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-wide text-white">Volver a Consulta</span>
            <ClipboardList className="h-3 w-3 text-indigo-300" />
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5 inline" /> Borrador activo
          </span>
        </div>
      </button>
    </div>
  );
}
