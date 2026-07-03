"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquareWarning, ArrowRight, Clock3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-base";
import { getAuthToken } from "@/lib/auth-token";
import { useTheme } from "@/context/ThemeContext";
import { useAdmin } from "@/context/AdminContext";
import { cn } from "@/lib/utils";
import { type PatientPortalFollowUpsResponse } from "@/features/patient-portal";

async function fetchFollowUpNotifications() {
  const token = getAuthToken();
  const response = await fetchApi(
    "/patient-portals/follow-ups?limit=5&pendingOnly=true",
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  if (!response.ok) {
    throw new Error("No se pudieron cargar los seguimientos");
  }

  return response.json() as Promise<PatientPortalFollowUpsResponse>;
}

export function FollowUpNotificationsMenu({ title }: { title?: string }) {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { isAdminView } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["follow-up-notifications"],
    queryFn: fetchFollowUpNotifications,
    refetchInterval: 60000,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items = data?.data || [];
  const pendingCount = data?.meta.pendingCount || 0;

  const previewItems = items.slice(0, 5);

  if (isAdminView) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className={cn(
          "relative rounded-full p-2 transition-all outline-none",
          isDarkMode
            ? "text-emerald-100/70 hover:bg-emerald-500/10 hover:text-emerald-50"
            : "text-slate-400 hover:bg-slate-50 hover:text-emerald-600",
        )}
        aria-label="Ver seguimientos pendientes"
        title={title || "Seguimiento de pacientes"}
      >
        <MessageSquareWarning className="h-5 w-5" />
        {pendingCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute right-0 z-20 mt-2.5 w-[22rem] origin-top-right overflow-hidden rounded-xl border shadow-xl ring-1 animate-in fade-in zoom-in-95 duration-100 focus:outline-none sm:w-[26rem]",
            isDarkMode
              ? "border-emerald-400/14 bg-slate-950/96 ring-black/20"
              : "border-slate-100 bg-white ring-slate-900/5",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between border-b px-4 py-3",
              isDarkMode
                ? "border-emerald-400/12 bg-emerald-500/8"
                : "border-slate-100 bg-slate-50/50",
            )}
          >
            <div>
              <h3
                className={cn(
                  "text-sm font-semibold",
                  isDarkMode ? "text-emerald-50" : "text-slate-900",
                )}
              >
                Seguimientos pendientes
              </h3>
              <p
                className={cn(
                  "mt-0.5 text-xs",
                  isDarkMode ? "text-emerald-100/60" : "text-slate-500",
                )}
              >
                Preguntas nuevas de tus pacientes
              </p>
            </div>
            <div
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                isDarkMode
                  ? "bg-emerald-500/10 text-emerald-100"
                  : "bg-amber-50 text-amber-700",
              )}
            >
              {pendingCount}
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {previewItems.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p
                  className={cn(
                    "text-sm",
                    isDarkMode ? "text-emerald-100/70" : "text-slate-500",
                  )}
                >
                  No tienes seguimientos pendientes
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "divide-y",
                  isDarkMode ? "divide-emerald-400/10" : "divide-slate-100",
                )}
              >
                {previewItems.map((item) => (
                  <button
                    key={item.patient.id}
                    type="button"
                    className={cn(
                      "group relative flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors",
                      isDarkMode
                        ? "hover:bg-emerald-500/7"
                        : "hover:bg-slate-50",
                    )}
                    onClick={() => {
                      setIsOpen(false);
                      router.push(
                        `/dashboard/pacientes/${item.patient.id}?tab=acompanamiento`,
                      );
                    }}
                  >
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <MessageSquareWarning className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate pr-6 text-sm font-medium",
                          isDarkMode ? "text-emerald-50" : "text-slate-900",
                        )}
                      >
                        El paciente {item.patient.fullName} te ha dejado una
                        pregunta.
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 line-clamp-2 text-xs",
                          isDarkMode ? "text-emerald-100/65" : "text-slate-500",
                        )}
                      >
                        {item.latestQuestionBody ||
                          "Revisa su seguimiento para responderle a tiempo."}
                      </p>
                      <p
                        className={cn(
                          "mt-1.5 flex items-center gap-1 text-[10px]",
                          isDarkMode ? "text-emerald-100/45" : "text-slate-400",
                        )}
                      >
                        <Clock3 className="h-3 w-3" />
                        {item.latestQuestionAt
                          ? new Intl.DateTimeFormat("es-CL", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(item.latestQuestionAt))
                          : "Nuevo"}
                      </p>
                    </div>
                    <ArrowRight
                      className={cn(
                        "mt-2 h-4 w-4 shrink-0",
                        isDarkMode ? "text-emerald-100/40" : "text-slate-300",
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            className={cn(
              "border-t p-2",
              isDarkMode
                ? "border-emerald-400/12 bg-emerald-500/6"
                : "border-slate-100 bg-slate-50/50",
            )}
          >
            <Link
              href="/dashboard/pacientes/seguimientos"
              className={cn(
                "flex w-full items-center justify-center rounded-lg border px-4 py-2 text-xs font-medium shadow-sm transition-colors",
                isDarkMode
                  ? "border-emerald-400/14 bg-slate-900 text-emerald-100/80 hover:bg-slate-800 hover:text-emerald-50"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
              onClick={() => setIsOpen(false)}
            >
              Ver todos los seguimientos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
