"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Filter,
  MessageSquareWarning,
  Search,
  Users,
} from "lucide-react";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useFollowUps, type FollowUpsTab } from "@/features/patient-portal";

function localCn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function FollowUpsClient() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<FollowUpsTab>("Pendientes");

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearchTerm(searchTerm),
      searchTerm ? 350 : 0,
    );
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { followUps, meta, isLoading } = useFollowUps({
    page,
    searchTerm: debouncedSearchTerm,
    tab,
    documentIdFilter: "",
    classificationTags: [],
    pendingOnly: tab === "Pendientes",
  });

  const pendingAttention = followUps.filter((item) => item.hasAttention).length;

  return (
    <ModuleLayout
      title="Seguimientos de mis pacientes"
      description="Revisa en una sola pantalla los seguimientos más recientes, priorizando a los pacientes que todavía te dejaron preguntas pendientes."
      className="max-w-7xl"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            Pacientes en vista
          </p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {meta.filteredTotal}
          </p>
        </div>
        <div className="rounded-[2rem] border border-amber-100 bg-amber-50/70 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-600">
            Con preguntas pendientes
          </p>
          <p className="mt-2 text-3xl font-black text-amber-700">
            {meta.pendingCount}
          </p>
        </div>
        <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">
            Alertas visibles
          </p>
          <p className="mt-2 text-3xl font-black text-emerald-700">
            {pendingAttention}
          </p>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Buscar paciente, correo o documento..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 text-sm font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["Pendientes", "Todos"] as FollowUpsTab[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setTab(item);
                  setPage(1);
                }}
                className={localCn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
                  tab === item
                    ? item === "Pendientes"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {isLoading ? (
            <div className="rounded-[2rem] border border-dashed border-slate-200 p-12 text-center text-sm font-medium text-slate-400">
              Cargando seguimientos...
            </div>
          ) : followUps.length > 0 ? (
            followUps.map((item) => (
              <article
                key={item.patient.id}
                className={cn(
                  "rounded-[2rem] border p-5 shadow-sm transition-all",
                  item.hasAttention
                    ? "border-amber-200 bg-amber-50/60"
                    : "border-slate-100 bg-white hover:border-slate-200",
                )}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">
                        {item.patient.fullName}
                      </h3>
                      {item.hasAttention && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                          {item.pendingQuestions} pregunta
                          {item.pendingQuestions === 1 ? "" : "s"} pendiente
                          {item.pendingQuestions === 1 ? "" : "s"}
                        </span>
                      )}
                      {item.patient.status && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {item.patient.status}
                        </span>
                      )}
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                      {item.hasAttention
                        ? `El paciente ${item.patient.fullName} te ha dejado una pregunta.`
                        : "No tiene preguntas pendientes, pero aquí puedes revisar su último movimiento."}
                    </p>

                    <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <span className="block font-black uppercase tracking-widest text-slate-400">
                          Última actividad
                        </span>
                        <span className="mt-1 block text-slate-700">
                          {item.latestEntryAt
                            ? new Intl.DateTimeFormat("es-CL", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(item.latestEntryAt))
                            : "Sin actividad"}
                        </span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <span className="block font-black uppercase tracking-widest text-slate-400">
                          Última pregunta
                        </span>
                        <span className="mt-1 block text-slate-700">
                          {item.latestQuestionAt
                            ? new Intl.DateTimeFormat("es-CL", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(item.latestQuestionAt))
                            : "Sin preguntas"}
                        </span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <span className="block font-black uppercase tracking-widest text-slate-400">
                          Contacto
                        </span>
                        <span className="mt-1 block truncate text-slate-700">
                          {item.patient.email ||
                            item.patient.phone ||
                            "Sin dato"}
                        </span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <span className="block font-black uppercase tracking-widest text-slate-400">
                          Documento
                        </span>
                        <span className="mt-1 block text-slate-700">
                          {item.patient.documentId || "Sin dato"}
                        </span>
                      </div>
                    </div>

                    {item.latestQuestionBody && (
                      <div className="rounded-[1.5rem] border border-slate-100 bg-white p-4 text-sm leading-6 text-slate-600">
                        <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600">
                          <MessageSquareWarning className="h-3.5 w-3.5" />
                          Última pregunta
                        </span>
                        <p>{item.latestQuestionBody}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 md:w-48 md:items-stretch">
                    <Button
                      onClick={() =>
                        router.push(
                          `/dashboard/pacientes/${item.patient.id}?tab=acompanamiento`,
                        )
                      }
                      className={cn(
                        "h-11 rounded-2xl font-bold shadow-sm",
                        item.hasAttention
                          ? "bg-amber-600 text-white hover:bg-amber-700"
                          : "bg-slate-900 text-white hover:bg-slate-800",
                      )}
                    >
                      Ir al seguimiento
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(`/dashboard/pacientes/${item.patient.id}`)
                      }
                      className="h-11 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Ver ficha
                    </Button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-200 p-14 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm font-semibold text-slate-500">
                No se encontraron seguimientos con los filtros actuales.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <Pagination
            currentPage={meta.page}
            totalPages={meta.lastPage}
            onPageChange={setPage}
          />
        </div>
      </div>
    </ModuleLayout>
  );
}
