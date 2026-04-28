"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Bell,
  Download,
  Dumbbell,
  FileText,
  Globe,
  Leaf,
  Library,
  MessageSquare,
  Package,
  Reply,
  Send,
  ShieldCheck,
  UtensilsCrossed,
  Waves,
} from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  PatientPortalOverview,
  PortalVerificationResponse,
} from "@/features/patient-portal";
import { cn } from "@/lib/utils";

interface PortalPreview {
  patientName: string;
  patientEmail?: string | null;
  nutritionistName: string;
  expiresAt: string;
}

type PortalTab = "diario" | "recursos" | "notificaciones" | "consultas" | "entregables";

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

const getTodayDateInputValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const safeJsonText = (value: unknown) => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

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
    entryDate: getTodayDateInputValue(),
    alimentacion: "",
    suplementos: "",
    actividadFisica: "",
  });

  const loadPortal = useCallback(async (sessionToken: string) => {
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
    } catch {
      localStorage.removeItem(getPortalStorageKey(token));
      setAccessToken(null);
      setOverview(null);
      toast.error("Tu sesión del portal expiró. Vuelve a confirmar tu correo.");
    }
  }, [token]);

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
          setEmail((current) => current || data.patientEmail || "");
        } else {
          toast.error("El enlace no está disponible o ya expiró.");
        }
      } catch {
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
  }, [accessToken, loadPortal]);

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
        throw new Error((data as { message?: string })?.message || "No pudimos validar tu acceso");
      }

      localStorage.setItem(getPortalStorageKey(token), data.accessToken);
      setAccessToken(data.accessToken);
      setOverview(data);
      setActiveTab("consultas");
      toast.success("Portal activado. Ya puedes revisar tus materiales.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "No se pudo verificar el correo.");
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
      toast.success("Tu pregunta quedó guardada para el nutri.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar tu mensaje.");
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
        entryDate: getTodayDateInputValue(),
        alimentacion: "",
        suplementos: "",
        actividadFisica: "",
      });
      setOverview(data.overview);
      toast.success("Tu diario quedó guardado con fecha.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar tu seguimiento.");
    } finally {
      setIsSubmittingTracking(false);
    }
  };

  const isHydratingSession = Boolean(accessToken && !overview);

  const summaryCards = useMemo(
    () => [
      {
        label: "Diario",
        value: overview?.tracking.length ?? 0,
        icon: BookOpen,
      },
      {
        label: "Consultas",
        value: overview?.summary.questionsCount ?? 0,
        icon: MessageSquare,
      },
        {
          label: "Recursos",
          value: overview?.sharedResources.length ?? 0,
          icon: Library,
        },
        {
          label: "Avisos",
          value: overview?.summary.notificationsCount ?? overview?.notifications?.length ?? 0,
          icon: Bell,
        },
        {
          label: "Entregables",
          value: overview?.sharedDeliverables.length ?? 0,
          icon: Package,
        },
    ],
    [overview],
  );

  const questions = overview?.questions || [];
  const tracking = overview?.tracking || [];
  const recentTracking = tracking.slice(0, 6);
  const notifications = overview?.notifications || [];
  const sharedResources = overview?.sharedResources || [];
  const sharedDeliverables = overview?.sharedDeliverables || [];

  const tabButtonClass = (tab: PortalTab) =>
    cn(
      "rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.18em] transition-all",
      activeTab === tab
        ? "bg-slate-950 text-white shadow-lg shadow-slate-900/10"
        : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-900",
    );

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
                  Tu espacio compartido con el nutri, ordenado por fecha
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
                  Este espacio fue compartido por{" "}
                  <span className="font-semibold text-slate-900">{preview?.nutritionistName || "tu nutricionista"}</span>.
                  Aquí puedes dejar tu diario, hacer preguntas, revisar recursos y descargar entregables compartidos.
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
                  { label: "Preguntas", icon: MessageSquare },
                  { label: "Diario", icon: BookOpen },
                  { label: "Material", icon: FileText },
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
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-100/70">Acompañamiento</p>
                    <p className="text-2xl font-black">Seguimiento simple, útil y constante</p>
                  </div>
                </div>
                <div className="space-y-3 rounded-[1.5rem] border border-white/15 bg-white/8 p-5 backdrop-blur">
                  <p className="text-sm font-semibold text-emerald-50/90">Qué puedes hacer</p>
                  <ul className="space-y-3 text-sm text-emerald-50/90">
                    {[
                      "Escribir tu día a día con fecha",
                      "Dejar preguntas para el nutri",
                      "Revisar recursos y entregables compartidos",
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#effdf6_100%)] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-emerald-100/60 backdrop-blur md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-700">
                <Leaf className="h-4 w-4" />
                Portal privado
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                  {preview?.patientName || overview.patient.fullName}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                  Usa este espacio para escribir tu diario, dejar preguntas, revisar materiales y descargar los entregables
                  que tu nutri compartió especialmente contigo.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {summaryCards.map((card) => (
                  <div key={card.label} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
                      <p className="text-lg font-black text-slate-900">{card.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <ShieldCheck className="h-6 w-6 text-emerald-300" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200/70">Acceso activo</p>
                  <p className="text-lg font-bold">Portal de {preview?.nutritionistName || "tu nutricionista"}</p>
                </div>
              </div>
              <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-200">
                <p>• Diario con fecha y hora guardada.</p>
                <p>• Preguntas asincrónicas para el nutri.</p>
                <p>• Recursos y entregables compartidos por invitación.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-300/70">Vigencia</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {activeInvitationExpiresAt ? formatDate(activeInvitationExpiresAt) : "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-300/70">Pendientes</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {overview.summary.pendingQuestions} consultas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { id: "diario" as const, label: "Diario" },
            { id: "recursos" as const, label: "Recursos" },
            { id: "notificaciones" as const, label: "Avisos" },
            { id: "consultas" as const, label: "Preguntas" },
            { id: "entregables" as const, label: "Entregables" },
          ].map((tab) => (
            <button key={tab.id} className={tabButtonClass(tab.id)} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "diario" && (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <form
              onSubmit={handleSubmitTracking}
              className="space-y-5 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">Diario</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Registra tu día a día</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Escribe con fecha. El nutri verá cada registro como una entrada ordenada en el tiempo.
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Fecha</p>
                  <p className="text-sm font-semibold text-emerald-900">{formatDate(trackingForm.entryDate)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Fecha del diario</label>
                <Input
                  type="date"
                  value={trackingForm.entryDate}
                  onChange={(e) => setTrackingForm((prev) => ({ ...prev, entryDate: e.target.value }))}
                  className="h-12 rounded-3xl border-slate-200"
                />
              </div>

              {[
                {
                  key: "alimentacion" as const,
                  label: "Alimentación",
                  icon: UtensilsCrossed,
                  placeholder:
                    "Cuenta lo que comiste, horarios, antojos, porciones o cambios que quieras registrar.",
                },
                {
                  key: "suplementos" as const,
                  label: "Suplementos",
                  icon: Waves,
                  placeholder:
                    "Escribe qué tomaste, dosis, horario y si hubo algún cambio o duda.",
                },
                {
                  key: "actividadFisica" as const,
                  label: "Actividad física",
                  icon: Dumbbell,
                  placeholder:
                    "Puedes colocar el tiempo, intensidad, tipo de ejercicio o cómo te sentiste.",
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
                Guardar diario
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
                    <h2 className="mt-2 text-2xl font-black text-slate-950">Últimos registros del diario</h2>
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
                                {entry.payload?.entryDate ? `Fecha del diario: ${entry.payload.entryDate}` : "Registro de diario"}
                              </p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-100">
                              Guardado
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
                      Todavía no hay registros de diario.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "recursos" && (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Recursos compartidos</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Lo que tu nutri te dejó para revisar</h2>
                </div>
                <Library className="h-5 w-5 text-emerald-500" />
              </div>

              <div className="mt-6 space-y-4">
                {sharedResources.length > 0 ? (
                  sharedResources.map((resource) => (
                    <article key={resource.id} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900">{resource.title}</p>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{resource.category}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                          {resource.isPublic ? "Público" : "Privado"}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-700">{resource.content}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(resource.tags || []).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ring-1 ring-slate-100"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {resource.fileUrl && (
                        <div className="mt-4">
                          <Button variant="outline" className="rounded-2xl" onClick={() => window.open(resource.fileUrl || "", "_blank", "noopener,noreferrer")}>
                            <Download className="mr-2 h-4 w-4" />
                            Abrir archivo
                          </Button>
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Todavía no hay recursos compartidos en este portal.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Cómo funciona</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">Recursos y materiales</h2>
                  </div>
                  <Globe className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="mt-5 space-y-3 rounded-3xl border border-slate-100 bg-slate-50/80 p-5 text-sm leading-7 text-slate-700">
                  <p>• Estos recursos se comparten de forma específica para tu acceso.</p>
                  <p>• Puedes volver a abrirlos cuando quieras.</p>
                  <p>• Si el nutri te comparte más material en una nueva invitación, lo verás aquí.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notificaciones" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Avisos</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Mensajes directos del nutri</h2>
                </div>
                <Bell className="h-5 w-5 text-emerald-500" />
              </div>

              <div className="mt-6 space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((entry) => (
                    <article key={entry.id} className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {entry.payload?.notificationTitle || "Notificación del nutricionista"}
                          </p>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {formatDateTime(entry.createdAt)}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                          {entry.payload?.notificationType || "INFO"}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-700">{entry.body}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Todavía no hay avisos directos del nutri.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Uso</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Para qué sirven</h2>
                </div>
                <Bell className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="mt-5 space-y-3 rounded-3xl border border-slate-100 bg-slate-50/80 p-5 text-sm leading-7 text-slate-700">
                <p>• Tu nutri puede enviarte avisos concretos para este paciente.</p>
                <p>• Si existe un correo activo en la invitación, también llega por email.</p>
                <p>• El mensaje queda guardado en el portal para que no se pierda entre preguntas.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "consultas" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <form
              onSubmit={handleSubmitQuestion}
              className="space-y-5 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-600">Preguntas</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Deja tu pregunta o comentario</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Escribe lo que necesites. El nutri podrá verlo y responderte cuando revise tu portal.
                  </p>
                </div>
                <MessageSquare className="h-5 w-5 text-emerald-500" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Tu mensaje</label>
                <Textarea
                  value={questionMessage}
                  onChange={(e) => setQuestionMessage(e.target.value)}
                  className="min-h-[180px] rounded-3xl border-slate-200"
                  placeholder="Escribe aquí tu consulta, duda o actualización breve para tu nutri."
                />
              </div>

              <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-950">
                <p className="font-semibold">Tip</p>
                <p className="mt-1 text-emerald-900/80">
                  Mientras más claro lo escribas, más fácil será para el nutri responder cuando revise tus mensajes.
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

        {activeTab === "entregables" && (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Entregables compartidos</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Tus archivos listos para descargar</h2>
                </div>
                <FileText className="h-5 w-5 text-emerald-500" />
              </div>

              <div className="mt-6 space-y-4">
                {sharedDeliverables.length > 0 ? (
                  sharedDeliverables.map((deliverable) => {
                    const downloadPdf = () => {
                      const doc = new jsPDF("p", "mm", "a4");
                      const margin = 16;
                      let y = 18;
                      const pageWidth = doc.internal.pageSize.getWidth();

                      doc.setFont("helvetica", "bold");
                      doc.setFontSize(18);
                      doc.text(deliverable.name, margin, y);
                      y += 8;

                      doc.setFont("helvetica", "normal");
                      doc.setFontSize(11);
                      doc.text(`Tipo: ${deliverable.type}`, margin, y);
                      y += 6;
                      doc.text(`Formato: ${deliverable.format}`, margin, y);
                      y += 6;
                      doc.text(`Actualizado: ${formatDateTime(deliverable.updatedAt)}`, margin, y);
                      y += 10;

                      const body = safeJsonText(deliverable.content);
                      const lines = doc.splitTextToSize(body || "Sin contenido disponible", pageWidth - margin * 2);
                      doc.text(lines, margin, y);

                      doc.save(`${deliverable.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "entregable"}.pdf`);
                    };

                    return (
                      <article key={deliverable.id} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-slate-900">{deliverable.name}</p>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{deliverable.type}</p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                            PDF
                          </span>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-slate-700">
                          {safeJsonText(deliverable.content) || "Sin contenido disponible"}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(deliverable.tags || []).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ring-1 ring-slate-100"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4">
                          <Button className="rounded-2xl" onClick={downloadPdf}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar PDF
                          </Button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Todavía no hay entregables compartidos.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-emerald-100/60 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Qué recibes</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">Tus entregables en PDF</h2>
                  </div>
                  <Package className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="mt-5 space-y-3 rounded-3xl border border-slate-100 bg-slate-50/80 p-5 text-sm leading-7 text-slate-700">
                  <p>• Aquí verás los materiales exportados que tu nutri decidió compartir contigo.</p>
                  <p>• El PDF se genera desde el contenido del entregable para que puedas guardarlo o reenviarlo.</p>
                  <p>• Cada invitación puede tener su propio conjunto de materiales, así que el acceso es personalizado.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
