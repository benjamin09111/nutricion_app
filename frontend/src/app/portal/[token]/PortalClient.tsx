"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  FileText,
  Filter,
  Leaf,
  MessageSquare,
  Reply,
  Send,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Waves,
} from "lucide-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  PatientPortalOverview,
  PortalVerificationResponse,
  PatientPortalEntry,
} from "@/features/patient-portal";
import { cn } from "@/lib/utils";

interface PortalPreview {
  patientName: string;
  patientEmail?: string | null;
  nutritionistName: string;
  expiresAt: string;
}

type PortalTab = "consultas" | "seguimiento" | "respuestas";

const getPortalStorageKey = (token: string) => `patient-portal-session-${token}`;

const isFilled = (value?: string | null) => Boolean(value && value.trim().length > 0);

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function PortalClient({ token }: { token: string }) {
  const [preview, setPreview] = useState<PortalPreview | null>(null);
  const [overview, setOverview] = useState<PatientPortalOverview | null>(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [isSubmittingTracking, setIsSubmittingTracking] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PortalTab>("consultas");
  const [questionMessage, setQuestionMessage] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [trackingForm, setTrackingForm] = useState({
    alimentacion: "",
    suplementos: "",
    actividadFisica: "",
  });

  const loadPortal = async (sessionToken: string) => {
    try {
      const response = await fetchApi(`/patient-portals/me`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar el portal");
      }

      const data: PatientPortalOverview = await response.json();
      setOverview(data);
    } catch (error) {
      localStorage.removeItem(getPortalStorageKey(token));
      setAccessToken(null);
      setOverview(null);
      toast.error("Tu sesión del portal expiró. Vuelve a confirmar tu correo.");
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(getPortalStorageKey(token));
    if (stored) {
      setAccessToken(stored);
    }
  }, [token]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetchApi(`/patient-portals/invitations/${token}/preview`);
        if (response.ok) {
          const data: PortalPreview = await response.json();
          setPreview(data);
          if (!email && data.patientEmail) {
            setEmail(data.patientEmail);
          }
        } else {
          toast.error("El enlace no está disponible o ya expiró.");
        }
      } catch (error) {
        toast.error("No pudimos abrir el portal de seguimiento.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [token]);

  useEffect(() => {
    if (!accessToken) return;
    loadPortal(accessToken);
  }, [accessToken]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Ingresa tu correo para activar el portal.");
      return;
    }

    if (!accessCode.trim()) {
      toast.error("Ingresa tu código de acceso.");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetchApi(`/patient-portals/invitations/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, accessCode }),
      });

      const data: PortalVerificationResponse = await response.json();
      if (!response.ok) {
        throw new Error((data as any)?.message || "No pudimos validar tu acceso");
      }

      localStorage.setItem(getPortalStorageKey(token), data.accessToken);
      setAccessToken(data.accessToken);
      setOverview(data);
      setActiveTab("consultas");
      toast.success("Portal activado. Ya puedes registrar tu seguimiento.");
    } catch (error: any) {
      toast.error(error?.message || "No se pudo verificar el correo.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) {
      toast.error("Primero activa tu portal.");
      return;
    }

    if (!questionMessage.trim()) {
      toast.error("Escribe tu pregunta o consulta.");
      return;
    }

    setIsSubmittingQuestion(true);
    try {
      const response = await fetchApi(`/patient-portals/me/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message: questionMessage }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "No se pudo guardar tu consulta");
      }

      setQuestionMessage("");
      setOverview(data.overview);
      toast.success("Tu consulta quedó guardada para que el nutri la vea.");
    } catch (error: any) {
      toast.error(error?.message || "No se pudo enviar tu mensaje.");
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleSubmitTracking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) {
      toast.error("Primero activa tu portal.");
      return;
    }

    if (
      !isFilled(trackingForm.alimentacion) &&
      !isFilled(trackingForm.suplementos) &&
      !isFilled(trackingForm.actividadFisica)
    ) {
      toast.error("Completa al menos una sección antes de guardar.");
      return;
    }

    setIsSubmittingTracking(true);
    try {
      const response = await fetchApi(`/patient-portals/me/tracking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(trackingForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "No se pudo guardar tu seguimiento");
      }

      setTrackingForm({
        alimentacion: "",
        suplementos: "",
        actividadFisica: "",
      });
      setOverview(data.overview);
      toast.success("Tu seguimiento quedó guardado con fecha y hora.");
    } catch (error: any) {
      toast.error(error?.message || "No se pudo guardar tu seguimiento.");
    } finally {
      setIsSubmittingTracking(false);
    }
  };

  const isHydratingSession = Boolean(accessToken && !overview);

  const summaryCards = useMemo(
    () => [
      {
        label: "Entradas",
        value: overview?.summary.totalEntries ?? 0,
        icon: CalendarDays,
      },
      {
        label: "Consultas",
        value: overview?.summary.questionsCount ?? 0,
        icon: MessageSquare,
      },
      {
        label: "Seguimiento",
        value: overview?.summary.trackingCount ?? 0,
        icon: Sparkles,
      },
      {
        label: "Pendientes",
        value: overview?.summary.pendingQuestions ?? 0,
        icon: Clock3,
      },
    ],
    [overview],
  );

  const questions = overview?.questions || [];
  const replies = overview?.replies || [];
  const tracking = overview?.tracking || [];
  const recentTracking = tracking.slice(0, 6);

  if (isLoading || isHydratingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eefbf5_100%)] px-6">
        <div className="flex items-center gap-3 rounded-3xl border border-white/70 bg-white/90 px-6 py-4 shadow-2xl shadow-emerald-100">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span className="text-sm font-semibold text-slate-700">Abriendo tu portal...</span>
        </div>
      </div>
    );
  }

  if (!accessToken || !overview) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.22),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#ecfdf5_100%)] px-4 py-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
          <div className="grid w-full gap-8 overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-emerald-100/60 backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:p-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-700">
                <Leaf className="h-4 w-4" />
                Portal de seguimiento
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
                  Tu seguimiento, fuera de consulta, en un solo lugar
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                  Este espacio fue compartido por{" "}
                  <span className="font-semibold text-slate-900">{preview?.nutritionistName || "tu nutricionista"}</span>.
                  Aquí puedes dejar consultas, registrar tu seguimiento y revisar respuestas cuando el nutri las vaya leyendo.
                  Para entrar, usa tu correo y el código fijo de 6 dígitos que te compartieron.
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
                    Confirma tu correo
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu correo de paciente"
                    className="h-12 rounded-2xl border-slate-200 bg-white/90"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
                    Código de acceso
                  </label>
                  <Input
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="h-12 rounded-2xl border-slate-200 bg-white/90 tracking-[0.3em]"
                  />
                </div>
                <Button
                  type="submit"
                  isLoading={isVerifying}
                  className="h-12 rounded-2xl bg-emerald-600 px-6 font-black text-white shadow-lg shadow-emerald-200 hover:bg-emerald-500"
                >
                  Activar portal
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Consultas", icon: MessageSquare },
                  { label: "Alimentación", icon: UtensilsCrossed },
                  { label: "Actividad física", icon: Dumbbell },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Registro</p>
                      <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(160deg,#0f172a_0%,#0f766e_42%,#34d399_100%)] p-6 text-white shadow-2xl shadow-emerald-200 md:p-8">
              <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-emerald-200/20 blur-3xl" />
              <div className="relative space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                    <ShieldCheck className="h-7 w-7 text-emerald-100" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-100/70">Acompañamiento premium</p>
                    <p className="text-2xl font-black">Seguimiento simple, útil y constante</p>
                  </div>
                </div>
                <div className="space-y-3 rounded-[1.5rem] border border-white/15 bg-white/8 p-5 backdrop-blur">
                  <p className="text-sm font-semibold text-emerald-50/90">Qué puedes registrar</p>
                  <ul className="space-y-3 text-sm text-emerald-50/90">
                    {[
                      "Preguntas o dudas para tu nutri, sin chat en vivo",
                      "Alimentación, suplementos y actividad física",
                      "Todo se guarda con fecha y hora automática",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-200" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/15 bg-white/8 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100/60">Paciente</p>
                    <p className="mt-2 break-all text-sm text-white/90">{preview?.patientName || "Portal privado"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/8 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100/60">Expira</p>
                    <p className="mt-2 text-sm text-white/90">
                      {preview?.expiresAt ? formatDate(preview.expiresAt) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeInvitationExpiresAt = overview.portal.activeInvitation?.expiresAt || preview?.expiresAt || null;

  const tabButtonClass = (tab: PortalTab) =>
    cn(
      "rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.18em] transition-all",
      activeTab === tab
        ? "bg-slate-950 text-white shadow-lg shadow-slate-900/10"
        : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-900",
    );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#effdf7_100%)] px-4 py-6 text-slate-900 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-2xl shadow-emerald-100/70 backdrop-blur">
          <div className="grid gap-6 bg-[linear-gradient(135deg,#0f172a_0%,#0f766e_55%,#34d399_100%)] px-6 py-8 text-white md:grid-cols-[1.2fr_0.8fr] md:px-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-50/85">
                <Sparkles className="h-4 w-4" />
                Portal activo
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                  Hola, {overview.patient.fullName}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/85 md:text-base">
                  Este portal no es un chat en vivo. Tú dejas consultas, seguimiento y contexto; el nutri revisa y responde
                  cuando puede. Todo queda como historial ordenado.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-lg shadow-black/5 backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-50/60">{card.label}</p>
                    <card.icon className="h-4 w-4 text-emerald-100" />
                  </div>
                  <p className="mt-3 text-2xl font-black text-white">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {overview.summary.alerts.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3">
            {overview.summary.alerts.map((alert) => (
              <div
                key={alert}
                className="flex items-start gap-3 rounded-3xl border border-amber-100 bg-amber-50/80 p-4 text-amber-950 shadow-sm"
              >
                <Bell className="mt-0.5 h-4 w-4 text-amber-600" />
                <p className="text-sm font-medium">{alert}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {[
            { id: "consultas" as const, label: "Consultas al nutri" },
            { id: "seguimiento" as const, label: "Seguimiento" },
            { id: "respuestas" as const, label: "Respuestas del nutri" },
          ].map((tab) => (
            <button key={tab.id} className={tabButtonClass(tab.id)} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "consultas" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <form
              onSubmit={handleSubmitQuestion}
              className="space-y-5 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">Consultas al nutri</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Deja tu pregunta o comentario</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Escribe dudas, avisos o temas que quieras que el nutri revise cuando tenga espacio.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Actualizado</p>
                  <p className="text-sm font-semibold text-emerald-900">{formatDateTime(new Date().toISOString())}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Tu mensaje</label>
                <Textarea
                  value={questionMessage}
                  onChange={(e) => setQuestionMessage(e.target.value)}
                  className="min-h-[180px] rounded-3xl border-slate-200"
                  placeholder="Ej: Me costó seguir el plan en la cena del viernes, ¿te parece si ajustamos las porciones?"
                />
              </div>

              <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-950">
                <p className="font-semibold">Tip</p>
                <p className="mt-1 text-emerald-900/80">
                  Escribe todo lo que creas útil. El nutri lo verá como historial, no como chat en vivo.
                </p>
              </div>

              <Button
                type="submit"
                isLoading={isSubmittingQuestion}
                className="h-12 rounded-2xl bg-emerald-600 px-6 font-black text-white shadow-lg shadow-emerald-200 hover:bg-emerald-500"
              >
                Enviar consulta
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Historial</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Tus consultas guardadas</h2>
                </div>
                <MessageSquare className="h-5 w-5 text-emerald-500" />
              </div>

              <div className="mt-6 space-y-4">
                {questions.length > 0 ? (
                  questions.map((entry) => {
                    const hasReplies = (entry.replies || []).length > 0;

                    return (
                      <article key={entry.id} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-slate-900">{formatDateTime(entry.createdAt)}</p>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {hasReplies ? "Respondida" : "En espera"}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-100">
                            Consulta
                          </span>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-slate-700">{entry.body}</p>

                        <div className="mt-4 space-y-3">
                          {hasReplies ? (
                            entry.replies?.map((reply) => (
                              <div key={reply.id} className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">
                                  <Reply className="h-4 w-4" />
                                  Respuesta del nutri
                                </div>
                                <p className="mt-2 text-sm leading-7 text-slate-700">{reply.body}</p>
                                <p className="mt-3 text-xs font-semibold text-slate-400">{formatDateTime(reply.createdAt)}</p>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                              El nutri todavía no responde. Cuando lo haga, aparecerá aquí.
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Todavía no hay consultas. Puedes dejar la primera ahora mismo.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "seguimiento" && (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <form
              onSubmit={handleSubmitTracking}
              className="space-y-5 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">Seguimiento</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Registra tu día a día</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Completa las secciones que quieras. El nutri las leerá como historial y verá la fecha y hora
                    automáticamente.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Auto-guardado</p>
                  <p className="text-sm font-semibold text-emerald-900">Fecha y hora actual</p>
                </div>
              </div>

              {[
                {
                  key: "alimentacion" as const,
                  label: "Alimentación",
                  icon: UtensilsCrossed,
                  placeholder:
                    "Cuenta todo lo que comiste, horarios, antojos, porciones o cualquier cambio que quieras que el nutri lea.",
                },
                {
                  key: "suplementos" as const,
                  label: "Suplementos",
                  icon: Waves,
                  placeholder:
                    "Escribe cuál tomaste, dosis, horario y si lo olvidaste. También puedes agregar cambios o dudas.",
                },
                {
                  key: "actividadFisica" as const,
                  label: "Actividad física",
                  icon: Dumbbell,
                  placeholder:
                    "Puedes colocar el tiempo, si seguiste alguna rutina, intensidad, tipo de ejercicio o cómo te sentiste.",
                },
              ].map((section) => (
                <div key={section.key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <section.icon className="h-4 w-4 text-emerald-500" />
                    <label className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{section.label}</label>
                  </div>
                  <Textarea
                    value={trackingForm[section.key]}
                    onChange={(e) => setTrackingForm((prev) => ({ ...prev, [section.key]: e.target.value }))}
                    className="min-h-[120px] rounded-3xl border-slate-200"
                    placeholder={section.placeholder}
                  />
                </div>
              ))}

              <Button
                type="submit"
                isLoading={isSubmittingTracking}
                className="h-12 rounded-2xl bg-slate-950 px-6 font-black text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800"
              >
                Guardar seguimiento
              </Button>
            </form>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Resumen</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">Lo que ya dejaste registrado</h2>
                  </div>
                  <CalendarDays className="h-5 w-5 text-emerald-500" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Alimentación", value: overview.summary.sectionCounts.alimentacion, icon: UtensilsCrossed },
                    { label: "Suplementos", value: overview.summary.sectionCounts.suplementos, icon: Waves },
                    { label: "Actividad", value: overview.summary.sectionCounts.actividadFisica, icon: Dumbbell },
                  ].map((item) => (
                    <div key={item.label} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
                      <item.icon className="h-5 w-5 text-emerald-500" />
                      <p className="mt-3 text-sm font-semibold text-slate-500">{item.label}</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Historial</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">Últimos registros de seguimiento</h2>
                  </div>
                  <Clock3 className="h-5 w-5 text-emerald-500" />
                </div>

                <div className="mt-6 space-y-4">
                  {recentTracking.length > 0 ? (
                    recentTracking.map((entry) => {
                      const sections = entry.payload.sections || {};
                      return (
                        <article key={entry.id} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-slate-900">{formatDateTime(entry.createdAt)}</p>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Registro de seguimiento
                              </p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-100">
                              Guardado automático
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3">
                            {sections.alimentacion && (
                              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Alimentación</p>
                                <p className="mt-2 text-sm leading-7 text-slate-700">{sections.alimentacion}</p>
                              </div>
                            )}
                            {sections.suplementos && (
                              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Suplementos</p>
                                <p className="mt-2 text-sm leading-7 text-slate-700">{sections.suplementos}</p>
                              </div>
                            )}
                            {sections.actividadFisica && (
                              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Actividad física</p>
                                <p className="mt-2 text-sm leading-7 text-slate-700">{sections.actividadFisica}</p>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                      Todavía no hay registros de seguimiento.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "respuestas" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Respuestas del nutri</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Mensajes que te dejó el nutri</h2>
                </div>
                <Reply className="h-5 w-5 text-emerald-500" />
              </div>

              <div className="mt-6 space-y-4">
                {replies.length > 0 ? (
                  replies.map((reply) => (
                    <article key={reply.id} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900">{formatDateTime(reply.createdAt)}</p>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Respuesta del nutri</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                          Mensaje guardado
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-700">{reply.body}</p>
                      {reply.replyTo?.body && (
                        <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Respondió a</p>
                          <p className="mt-2 text-sm leading-7 text-slate-600">{reply.replyTo.body}</p>
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Aquí aparecerán las respuestas que el nutri te vaya dejando. No necesitas estar conectado al mismo tiempo.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Estado</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">Cómo funciona este espacio</h2>
                  </div>
                  <FileText className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="mt-5 space-y-3 rounded-3xl border border-slate-100 bg-slate-50/80 p-5 text-sm leading-7 text-slate-700">
                  <p>• Todo queda guardado como historial simple y liviano.</p>
                  <p>• Las consultas no son en vivo, pero sí quedan ordenadas para revisar luego.</p>
                  <p>• Las respuestas del nutri aparecen como una conversación guardada.</p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Invitación</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">Tu acceso actual</h2>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="mt-5 space-y-3 rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                  <p className="text-sm font-semibold text-slate-700">
                    {activeInvitationExpiresAt
                      ? `Activo hasta ${formatDate(String(activeInvitationExpiresAt))}`
                      : "Acceso activo"}
                  </p>
                  <p className="text-xs leading-6 text-slate-500">
                    Si tu nutri renueva el enlace, el portal seguirá funcionando con la invitación más reciente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
