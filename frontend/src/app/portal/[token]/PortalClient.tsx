"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  ChevronRight,
  Loader2,
  Calendar,
  User,
  Download,
  MessageSquare,
  Clock,
  Lock,
  Utensils,
  BookOpen,
  FileText,
  Send,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-base";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type PortalVerificationResponse } from "@/features/patient-portal/types";

interface PortalPreview {
  patientName: string;
  patientEmail: string | null;
  nutritionistName: string;
  expiresAt: string;
}



const getPortalStorageKey = (token: string) =>
  token === "me" ? "portal_session_me" : `portal_session_${token}`;

// Helper for safe localStorage access
const safeLocalStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch { }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch { }
  }
};

export default function PortalClient({ token: propToken }: { token?: string }) {
  const params = useParams<{ token: string }>();
  const token = propToken || params.token;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [preview, setPreview] = useState<PortalPreview | null>(null);
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [portalData, setPortalData] = useState<PortalVerificationResponse | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const nutritionistSettings = portalData?.patient?.nutritionist?.settings as
    | {
        isScheduleActive?: boolean;
        bookingUrl?: string;
      }
    | null
    | undefined;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadPortal = useCallback(async (tokenStr?: string) => {
    try {
      const response = await fetchApi(
        "/patient-portals/me",
        tokenStr
          ? {
              headers: { Authorization: `Bearer ${tokenStr}` },
            }
          : undefined,
      );

      if (response.ok) {
        const data = await response.json();
        setPortalData(data);
      } else {
        if (token === "me") {
          safeLocalStorage.removeItem(getPortalStorageKey(token));
          setAccessToken(null);
          router.push("/portal/login");
          return;
        }

        safeLocalStorage.removeItem(getPortalStorageKey(token));
        setAccessToken(null);
      }
    } catch (error) {
      console.error("Error loading portal:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    if (!isMounted) return;
    const stored = safeLocalStorage.getItem(getPortalStorageKey(token));
    if (stored) {
      setAccessToken(stored);
    } else if (token === "me") {
      router.push("/portal/login");
    }
  }, [token, isMounted, loadPortal]);

  useEffect(() => {
    if (token === "me") return;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetchApi(`/patient-portals/invitations/${token}/preview`);
        if (response.ok) {
          const data: PortalPreview = await response.json();
          setPreview(data);
          if (data.patientEmail) {
            setEmail(data.patientEmail);
          }
        } else {
          toast.error("El enlace no está disponible o ya expiró.");
        }
    } catch {
      toast.error("No pudimos abrir el portal de seguimiento.");
    } finally {
        if (isMounted && !safeLocalStorage.getItem(getPortalStorageKey(token))) {
          setIsLoading(false);
        }
      }
    };

    load();
  }, [token, isMounted]);

  useEffect(() => {
    if (!accessToken) return;
    loadPortal(accessToken);
  }, [accessToken, loadPortal]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = accessCode.trim().replace(/\D/g, "");

    if (!normalizedEmail) {
      toast.error("Ingresa tu correo para activar el portal.");
      return;
    }

    if (normalizedCode.length !== 6) {
      toast.error("El código debe tener 6 dígitos.");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetchApi(`/patient-portals/invitations/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          accessCode: normalizedCode
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Código de acceso incorrecto o correo no coincide");
      }

      const tokenStr = data.accessToken;
      safeLocalStorage.setItem(getPortalStorageKey(token), tokenStr);
      setAccessToken(tokenStr);
      setPortalData(data);
      toast.success("¡Acceso verificado!");
    } catch (error: any) {
      toast.error(error.message || "Error al verificar el código");
    } finally {
      setIsVerifying(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"diary" | "questions" | "plans" | "messages" | "appointments" | "guide">("diary");
  const [entryText, setEntryText] = useState("");
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);
  const [visibleEntriesCount, setVisibleEntriesCount] = useState(3);

  const [questionText, setQuestionText] = useState("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [isDownloadingDeliverableId, setIsDownloadingDeliverableId] = useState<string | null>(null);

  const buildDietData = (raw: any) => {
    const foods: any[] = [];

    if (raw.metadata?.foodSummary?.length) {
      raw.metadata.foodSummary.forEach((food: any) => {
        foods.push({
          producto: food.name,
          grupo: food.group || "Varios",
          unidad: food.unit,
          calorias: food.calories,
          proteinas: food.proteins,
          lipidos: food.lipids,
          carbohidratos: food.carbs,
        });
      });
    } else if (Array.isArray(raw.content?.manualAdditions)) {
      raw.content.manualAdditions.forEach((food: any) => {
        foods.push({
          producto: food.producto,
          grupo: food.grupo || "Varios",
          unidad: food.unidad,
          calorias: food.calorias,
          proteinas: food.proteinas,
          lipidos: food.lipidos,
          carbohidratos: food.carbohidratos,
        });
      });
    }

    return {
      dietName: raw.name,
      dietTags: raw.tags || [],
      activeConstraints: raw.content?.activeConstraints || [],
      patientName: raw.metadata?.patientName || raw.content?.patientMeta?.fullName,
      foods,
    };
  };

  const buildFastDeliverableData = (raw: any) => ({
    name:
      typeof raw.content?.title === "string"
        ? raw.content.title
        : typeof raw.name === "string" && raw.name.trim()
          ? raw.name
          : "Entregable",
    patientName:
      typeof raw.metadata?.patientName === "string"
        ? raw.metadata.patientName
        : null,
    patient: raw.content?.patientMeta ?? undefined,
    meals: Array.isArray(raw.content?.meals) ? raw.content.meals : [],
    avoidFoods: Array.isArray(raw.content?.avoidFoods) ? raw.content.avoidFoods : [],
    resources: Array.isArray(raw.content?.resources) ? raw.content.resources : [],
    portionGuide: Array.isArray(raw.content?.portionGuide) ? raw.content.portionGuide : [],
    supplementNote:
      typeof raw.content?.supplementNote === "string"
        ? raw.content.supplementNote
        : undefined,
    generatedAt:
      typeof raw.content?.updatedAt === "string"
        ? new Date(raw.content.updatedAt).toLocaleDateString("es-CL")
        : new Date(raw.updatedAt || Date.now()).toLocaleDateString("es-CL"),
  });

  const buildQuickRecipesData = (raw: any) => ({
    title:
      typeof raw.content?.title === "string"
        ? raw.content.title
        : typeof raw.name === "string" && raw.name.trim()
          ? raw.name
          : "Recetas",
    dietName: typeof raw.name === "string" ? raw.name : undefined,
    patientName:
      typeof raw.metadata?.patientName === "string"
        ? raw.metadata.patientName
        : null,
    nutritionistNotes:
      typeof raw.content?.nutritionistNotes === "string"
        ? raw.content.nutritionistNotes
        : undefined,
    dishes: Array.isArray(raw.content?.dishes) ? raw.content.dishes : [],
    generatedAt:
      typeof raw.content?.updatedAt === "string"
        ? new Date(raw.content.updatedAt).toLocaleDateString("es-CL")
        : new Date(raw.updatedAt || Date.now()).toLocaleDateString("es-CL"),
  });

  const handleDownloadDeliverable = async (del: any) => {
    if (isDownloadingDeliverableId) return;

    setIsDownloadingDeliverableId(del.id);
    try {
      if (del.type === "DIET") {
        const { downloadDietPdf } = await import("@/features/pdf/pdfExport");
        await downloadDietPdf(buildDietData(del));
        toast.success("PDF descargado correctamente.");
        return;
      }

      if (del.type === "FAST_DELIVERABLE") {
        const { downloadFastDeliverablePdf } = await import("@/features/pdf/fastDeliverablePdfExport");
        await downloadFastDeliverablePdf(buildFastDeliverableData(del));
        toast.success("PDF descargado correctamente.");
        return;
      }

      if (del.type === "RECIPE" || del.type === "RECIPES") {
        const { downloadQuickRecipesPdf } = await import("@/features/pdf/quickRecipesPdfExport");
        await downloadQuickRecipesPdf(buildQuickRecipesData(del));
        toast.success("PDF descargado correctamente.");
        return;
      }

      toast.info("Exportación PDF para este tipo próximamente.");
    } catch (error) {
      console.error("Error downloading shared deliverable:", error);
      toast.error("Error al generar el PDF.");
    } finally {
      setIsDownloadingDeliverableId(null);
    }
  };

  const handleSubmitEntry = async () => {
    if (!entryText.trim() || !accessToken) return;

    setIsSubmittingEntry(true);
    try {
      const response = await fetchApi("/patient-portals/me/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          alimentacion: entryText.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state with the new entry
        if (portalData) {
          setPortalData({
            ...portalData,
            entries: [data.entry, ...portalData.entries],
            tracking: [data.entry, ...portalData.tracking],
            summary: data.overview.summary
          });
        }
        setEntryText("");
        toast.success("Publicado para tu nutricionista");
      } else {
        toast.error("No se pudo publicar el registro");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!questionText.trim() || !accessToken) return;

    setIsSubmittingQuestion(true);
    try {
      const response = await fetchApi("/patient-portals/me/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          message: questionText.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (portalData) {
          setPortalData({
            ...portalData,
            entries: [data.entry, ...portalData.entries],
            questions: [data.entry, ...portalData.questions],
          });
        }
        setQuestionText("");
        toast.success("Consulta enviada con éxito");
      } else {
        toast.error("No se pudo enviar la consulta");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  if (!isMounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-600" />
          <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Cargando tu portal...
          </p>
        </div>
      </div>
    );
  }

  if (!accessToken || !portalData) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-200 mb-4 animate-in fade-in zoom-in duration-700">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-600 mb-1">
              Portal del Paciente
            </h2>
            <div className="h-1 w-12 bg-emerald-600 mx-auto rounded-full opacity-20" />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Bienvenido <span className="text-emerald-600">de vuelta</span>
              </h1>
              <p className="text-slate-500 font-medium text-sm px-4">
                Espacio clínico compartido con el profesional <span className="text-slate-900 font-bold">{preview?.nutritionistName || "tu nutricionista"}</span>.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Email de Invitación
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    disabled={!!preview?.patientEmail}
                    className={cn(
                      "h-14 pl-12 rounded-2xl border-slate-200 font-bold transition-all",
                      !!preview?.patientEmail ? "bg-slate-50 text-slate-500 cursor-not-allowed border-transparent" : "bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                    )}
                  />
                  {!!preview?.patientEmail && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <Lock className="h-4 w-4 text-slate-300" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Código de Acceso (6 dígitos)
                </label>
                <div className="relative">
                  <Input
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="· · ·   · · ·"
                    className="h-16 sm:h-20 rounded-2xl border-slate-200 bg-slate-50 text-center text-2xl sm:text-3xl font-black tracking-[0.2em] sm:tracking-[0.3em] transition-all focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isVerifying}
                className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.15em] text-sm shadow-xl shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                Acceder al Portal
                <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <Calendar className="h-3 w-3" />
                Acceso permanente — tu código no vence
              </div>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                Powered by NutriNet
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { patient } = portalData;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar Superior */}
      <header className="sticky top-0 z-40 w-full bg-white px-4 py-3 sm:px-6 sm:py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 leading-none mb-0.5">Mi Portal</p>
              <h2 className="truncate text-sm font-semibold text-slate-800 leading-none">{patient.fullName}</h2>
            </div>
          </div>

          <button
            onClick={() => {
              safeLocalStorage.removeItem(getPortalStorageKey(token));
              window.location.reload();
            }}
            className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-24 sm:p-6 sm:pb-8 lg:flex-row lg:gap-8 lg:p-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-full lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
            <button
              onClick={() => setActiveTab("diary")}
              className={cn(
                "shrink-0 cursor-pointer lg:w-full flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all font-semibold text-[11px] sm:text-xs whitespace-nowrap",
                activeTab === "diary" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
            >
              <User className="h-4 w-4" />
              Diario
            </button>

            <button
              onClick={() => setActiveTab("messages")}
              className={cn(
                "shrink-0 cursor-pointer lg:w-full flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all font-semibold text-[11px] sm:text-xs whitespace-nowrap",
                activeTab === "messages" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
            >
              <Send className="h-4 w-4" />
              Mensajes
            </button>

            <button
              onClick={() => setActiveTab("questions")}
              className={cn(
                "shrink-0 cursor-pointer lg:w-full flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all font-semibold text-[11px] sm:text-xs whitespace-nowrap",
                activeTab === "questions" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
            >
              <MessageSquare className="h-4 w-4" />
              Consultas
            </button>

            <button
              onClick={() => setActiveTab("plans")}
              className={cn(
                "shrink-0 cursor-pointer lg:w-full flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all font-semibold text-[11px] sm:text-xs whitespace-nowrap",
                activeTab === "plans" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
            >
              <Sparkles className="h-4 w-4" />
              Planes
            </button>

            <button
              onClick={() => setActiveTab("appointments")}
              disabled
              className={cn(
                "shrink-0 cursor-not-allowed lg:w-full flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all font-semibold text-[11px] sm:text-xs whitespace-nowrap relative opacity-50",
                activeTab === "appointments" ? "bg-slate-100 text-slate-400" : "text-slate-300 hover:bg-slate-50"
              )}
            >
              <Lock className="h-4 w-4" />
              Mis Citas
              <span className="ml-auto shrink-0"><Lock className="h-3 w-3" /></span>
            </button>

            {nutritionistSettings?.isScheduleActive && (
              <button
                onClick={() => {
                  const url = nutritionistSettings?.bookingUrl;
                  if (typeof url === "string" && url.trim()) {
                    window.open(url, "_blank");
                  }
                }}
                className="shrink-0 cursor-pointer lg:w-full flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all font-bold text-[11px] sm:text-xs bg-emerald-600 text-white hover:bg-emerald-700 mt-2 whitespace-nowrap"
              >
                <Calendar className="h-4 w-4" />
                Agendar Cita
              </button>
            )}
          </nav>
        </aside>

        {/* Contenido Principal con Renderizado Condicional */}
        <main className="min-w-0 flex-1 space-y-6">
          {/* TAB: DIARIO */}
          {activeTab === "diary" && (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Input de Libreta (Estilo Facebook/Tweet) */}
              <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <User className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">¿Cómo va tu día?</p>
                </div>
                <Textarea
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value)}
                  placeholder="escribe qué comiste hoy, si hiciste deporte, o si no pudiste seguir la dieta, ¿cómo te sientes?"
                  className="min-h-[120px] rounded-3xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-indigo-500/10 focus:border-indigo-500 resize-none py-4 px-6 text-sm font-medium leading-relaxed"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitEntry}
                    disabled={!entryText.trim() || isSubmittingEntry}
                    isLoading={isSubmittingEntry}
                    className="w-full sm:w-auto rounded-2xl bg-indigo-600 text-white px-5 sm:px-8 h-11 font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    Publicar para mi nutricionista
                  </Button>
                </div>
              </div>

              {/* Feed de Entradas (Estilo Tweets) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Historial de Libreta</h3>
                </div>

                {portalData.tracking && portalData.tracking.length > 0 ? (
                  <div className="space-y-4">
                    {portalData.tracking.slice(0, visibleEntriesCount).map((entry: any) => (
                       <div key={entry.id} className="bg-white rounded-[1.75rem] sm:rounded-[2rem] p-5 sm:p-6 border border-slate-100 shadow-sm space-y-3 hover:border-indigo-100 transition-all group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">Registro de Paciente</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(entry.createdAt).toLocaleString("es-CL", {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">
                          {entry.body}
                        </p>
                      </div>
                    ))}

                    {visibleEntriesCount < portalData.tracking.length && (
                      <div className="flex justify-center pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setVisibleEntriesCount(prev => prev + 10)}
                            className="w-full sm:w-auto rounded-full px-4 sm:px-8 border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all group"
                          >
                          Ver más registros
                          <ChevronRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 border-dashed p-8 sm:p-12 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Aún no hay publicaciones</h3>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Tus pensamientos y progresos aparecerán aquí.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TAB: PREGUNTAS */}
          {activeTab === "questions" && (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Input de Consulta */}
              <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">¿Tienes alguna duda para tu nutri?</p>
                </div>
                <Textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Escribe aquí tu consulta sobre la dieta, recetas o cómo te sientes..."
                  className="min-h-[120px] rounded-3xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-emerald-500/10 focus:border-emerald-500 resize-none py-4 px-6 text-sm font-medium leading-relaxed"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitQuestion}
                    disabled={!questionText.trim() || isSubmittingQuestion}
                    isLoading={isSubmittingQuestion}
                    className="w-full sm:w-auto rounded-2xl bg-emerald-600 text-white px-5 sm:px-8 h-11 font-semibold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                  >
                    Enviar consulta
                  </Button>
                </div>
              </div>

              {/* Feed de Consultas */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tus consultas anteriores</h3>
                </div>

                {portalData.questions && portalData.questions.length > 0 ? (
                  <div className="space-y-6">
                    {portalData.questions.map((question: any) => (
                      <div key={question.id} className="space-y-3">
                        {/* Pregunta del Paciente */}
                        <div className="bg-white rounded-[1.75rem] sm:rounded-[2rem] p-5 sm:p-6 border border-slate-100 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Tu Consulta</span>
                              <span className="text-[10px] text-slate-300">•</span>
                              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(question.createdAt).toLocaleString("es-CL", {
                                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed">
                            {question.body}
                          </p>
                        </div>

                        {/* Respuestas del Nutri (Estilo Comentarios) */}
                        {question.replies && question.replies.length > 0 && (
                          <div className="ml-4 sm:ml-8 space-y-3 border-l-2 border-slate-100 pl-4 sm:pl-6 py-1">
                            {question.replies.map((reply: any) => (
                              <div key={reply.id} className="bg-slate-50/50 rounded-[1.25rem] sm:rounded-[1.5rem] p-4 sm:p-5 space-y-2 border border-slate-100/50">
                                <div className="flex items-center gap-3">
                                  {portalData.patient.nutritionist?.avatarUrl ? (
                                    <img
                                      src={portalData.patient.nutritionist?.avatarUrl}
                                      alt={portalData.patient.nutritionist?.fullName}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                      <User className="h-3 w-3" />
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-900">{portalData.patient.nutritionist?.fullName}</span>
                                    <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Nutricionista</span>
                                  </div>
                                  <span className="text-[10px] text-slate-300 ml-auto font-medium">
                                    {new Date(reply.createdAt).toLocaleString("es-CL", {
                                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed pl-1">
                                  {reply.body}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 border-dashed p-8 sm:p-12 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Aún no hay consultas</h3>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Tus dudas resueltas aparecerán aquí.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TAB: PLANES ENTREGADOS */}
          {activeTab === "plans" && (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 border border-slate-100 shadow-sm space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Planes entregados</h1>
                    <p className="text-slate-400 font-medium text-sm">Material compartido por tu nutricionista para tu proceso.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {portalData.sharedDeliverables.length > 0 ? (
                  portalData.sharedDeliverables.map((del: any) => {
                    const isDiet = del.type === 'DIET';
                    const isRecipe = del.type === 'RECIPE' || del.type === 'RECIPES';
                    const isFast = del.type === 'FAST_DELIVERABLE';

                    return (
                      <div key={del.id} className="bg-white rounded-[1.75rem] sm:rounded-[2rem] p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all group flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDiet ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' :
                                isRecipe ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' :
                                  'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                              }`}>
                              {isDiet ? <Utensils className="h-6 w-6" /> : isRecipe ? <BookOpen className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                            </div>
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(del.createdAt).toLocaleDateString("es-CL")}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                              {del.name}
                            </h4>
                            <div className="flex gap-2">
                              <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ring-1 ${isDiet ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' :
                                  isRecipe ? 'bg-orange-50 text-orange-700 ring-orange-100' :
                                    'bg-indigo-50 text-indigo-700 ring-indigo-100'
                                }`}>
                                {isDiet ? 'Dieta' : isRecipe ? 'Recetas' : isFast ? 'Guía rápida' : 'Entregable'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between">
                          <p className="text-[10px] text-slate-400 font-medium">Formato Digital</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-xl text-indigo-600 font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-50 px-4 group/btn"
                            onClick={() => handleDownloadDeliverable(del)}
                            disabled={isDownloadingDeliverableId === del.id}
                          >
                            DESCARGAR
                            <Download className="h-3 w-3 ml-2 group-hover/btn:translate-y-0.5 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="sm:col-span-2 lg:col-span-3 border-2 border-slate-100 border-dashed rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 lg:p-20 text-center space-y-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
                      <Download className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Aún no hay planes entregados</h3>
                      <p className="text-xs text-slate-300 max-w-xs mx-auto">Tu nutricionista compartirá tus pautas y guías PDF aquí cuando estén listas.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TAB: MENSAJES DE TU NUTRI */}
          {activeTab === "messages" && (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 px-2">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Mensajes de tu Profesional</h3>
              </div>

              {portalData.messages && portalData.messages.length > 0 ? (
                <div className="space-y-6">
                  {portalData.messages.map((msg: any) => (
                    <div key={msg.id} className="flex gap-3 sm:gap-4 max-w-2xl">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
                        {patient.nutritionist?.avatarUrl ? (
                          <img src={patient.nutritionist.avatarUrl} alt="Nutri" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <User className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="bg-white rounded-[1.75rem] sm:rounded-[2rem] rounded-tl-none p-4 sm:p-6 border border-slate-100 shadow-sm space-y-2 relative">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{patient.nutritionist?.fullName}</span>
                          <span className="text-[10px] font-bold text-slate-300">•</span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {new Date(msg.createdAt).toLocaleString("es-CL", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">
                          {msg.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 border-dashed p-8 sm:p-12 lg:p-20 text-center space-y-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
                    <Send className="h-10 w-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Sin mensajes todavía</h3>
                    <p className="text-xs text-slate-300 max-w-xs mx-auto">Aquí aparecerán los mensajes, recomendaciones y saludos que tu nutricionista te envíe.</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* TAB: MIS CITAS */}
          {activeTab === "appointments" && (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 border border-slate-100 shadow-sm space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mis Citas</h1>
                    <p className="text-slate-400 font-medium text-sm">Tus próximas citas agendadas con tu nutricionista.</p>
                  </div>
                </div>
              </div>

              {portalData.appointments && portalData.appointments.length > 0 ? (
                <div className="space-y-6">
                  {portalData.appointments.map((apt: any) => (
                    <div key={apt.id} className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all group">
                      {(() => {
                        const status = String(apt.status || "").toUpperCase();
                        const statusLabel =
                          status === "CONFIRMED" || status === "SCHEDULED"
                            ? "Confirmada"
                            : status === "REQUESTED"
                              ? "Pendiente"
                              : status === "REJECTED"
                                ? "Rechazada"
                                : status === "CANCELLED"
                                  ? "Cancelada"
                                  : "Agendada";

                        return (
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            <Calendar className="h-7 w-7" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {apt.title}
                            </h3>
                            {apt.description && (
                              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xl">
                                {apt.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 pt-2">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Clock className="h-4 w-4" />
                                {new Date(apt.startTime).toLocaleDateString("es-CL", { weekday: 'long', day: '2-digit', month: 'long' })}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                                {new Date(apt.startTime).toLocaleTimeString("es-CL", { hour: '2-digit', minute: '2-digit' })}
                                -
                                {new Date(apt.endTime).toLocaleTimeString("es-CL", { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ring-1",
                          status === 'CONFIRMED' || status === 'SCHEDULED' ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : status === 'REJECTED' ? "bg-rose-50 text-rose-700 ring-rose-100" : status === 'REQUESTED' ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-slate-50 text-slate-600 ring-slate-100"
                        )}>
                          {statusLabel}
                        </span>
                      </div>
                        )
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 border-dashed p-8 sm:p-12 lg:p-20 text-center space-y-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
                    <Calendar className="h-10 w-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">No hay citas agendadas</h3>
                    <p className="text-xs text-slate-300 max-w-xs mx-auto">Tu nutritionistate contactará para agendar tu próxima cita.</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* TAB: GUÍA */}
          {activeTab === "guide" && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 border border-slate-100 shadow-sm space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Guía del portal</h1>
                    <p className="text-slate-400 font-medium text-sm">Aprende a usar tu espacio de seguimiento.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] sm:rounded-[2rem] border border-emerald-100 bg-emerald-50/70 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-emerald-700 mb-3">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em]">Qué es este portal</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-700">
                  Este es tu espacio de seguimiento con tu nutricionista. Aquí puedes registrar tu progreso,
                  ver tus materiales y mantenerte al día con lo que necesitas hacer.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    icon: BookOpen,
                    title: "Comparte cómo vas",
                    description: "En Diario puedes escribir qué comiste, cómo te sentiste y cualquier cambio importante de tu día.",
                  },
                  {
                    icon: Send,
                    title: "Revisa tus mensajes",
                    description: "En Mensajes verás avisos, recomendaciones y saludos que tu nutricionista te envíe.",
                  },
                  {
                    icon: MessageSquare,
                    title: "Haz tus preguntas",
                    description: "En Consultas puedes dejar dudas sobre tu plan, tus comidas o lo que necesites revisar con tu nutricionista.",
                  },
                  {
                    icon: Download,
                    title: "Revisa tus entregables",
                    description: "En Planes verás tus dietas, recetas y documentos para descargarlos cuando los necesites.",
                  },
                ].map((step) => (
                  <div key={step.title} className="rounded-[1.4rem] border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <step.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900">{step.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 sm:p-5 text-sm leading-relaxed text-slate-600">
                <p className="font-black text-slate-900">Recomendación rápida</p>
                <p className="mt-2">
                  Empieza por <span className="font-semibold text-indigo-700">Diario</span>, revisa los mensajes de
                  tu nutricionista y vuelve aquí cuando necesites recordar qué hacer.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navbar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-stretch">
          <button
            onClick={() => setActiveTab("diary")}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors cursor-pointer",
              activeTab === "diary" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <User className="h-5 w-5" />
            <span>Diario</span>
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors cursor-pointer",
              activeTab === "messages" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Send className="h-5 w-5" />
            <span>Mensajes</span>
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors cursor-pointer",
              activeTab === "questions" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <MessageSquare className="h-5 w-5" />
            <span>Consultas</span>
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors cursor-pointer",
              activeTab === "plans" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Sparkles className="h-5 w-5" />
            <span>Planes</span>
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors cursor-pointer",
              activeTab === "guide" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <BookOpen className="h-5 w-5" />
            <span>Guía</span>
          </button>
          <button
            disabled
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold opacity-40 cursor-not-allowed text-slate-300"
          >
            <Lock className="h-5 w-5" />
            <span>Mis Citas</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
