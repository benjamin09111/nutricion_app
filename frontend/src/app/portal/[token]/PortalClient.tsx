"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  ChevronRight,
  Loader2,
  Calendar,
  User,
  ClipboardList,
  Download,
  MessageSquare,
  Bell,
  Clock,
  Lock,
  Utensils,
  BookOpen,
  FileText,
  Send,
  Sparkles,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-base";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PortalPreview {
  patientName: string;
  patientEmail: string | null;
  nutritionistName: string;
  expiresAt: string;
}

interface PortalVerificationResponse {
  accessToken: string;
  patient: any;
  summary: any;
  entries: any[];
  questions: any[];
  tracking: any[];
  sharedResources: any[];
  sharedDeliverables: any[];
}

const getPortalStorageKey = (token: string) =>
  token === "me" ? "portal_session_me" : `portal_session_${token}`;

// Helper for safe localStorage access
const safeLocalStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (e) { }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (e) { }
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadPortal = useCallback(async (tokenStr: string) => {
    try {
      const response = await fetchApi("/patient-portals/me", {
        headers: { Authorization: `Bearer ${tokenStr}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPortalData(data);
      } else {
        safeLocalStorage.removeItem(getPortalStorageKey(token));
        setAccessToken(null);
      }
    } catch (error) {
      console.error("Error loading portal:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isMounted) return;
    const stored = safeLocalStorage.getItem(getPortalStorageKey(token));
    if (stored) {
      setAccessToken(stored);
    } else if (token === "me") {
      router.push("/portal/login");
    }
  }, [token, isMounted, router]);

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
      } catch (err) {
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

  const [activeTab, setActiveTab] = useState<"diary" | "questions" | "plans" | "notifications" | "messages">("diary");
  const [entryText, setEntryText] = useState("");
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);
  const [visibleEntriesCount, setVisibleEntriesCount] = useState(3);

  const [questionText, setQuestionText] = useState("");
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
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

  // Check for new notifications
  useEffect(() => {
    if (isMounted && portalData?.notifications) {
      const lastReadCount = safeLocalStorage.getItem(`portal_last_notif_${portalData.patient.id}`);
      if (portalData.notifications.length > Number(lastReadCount || 0)) {
        setHasNewNotifications(true);
      }
    }
  }, [portalData, isMounted]);

  // Mark as read when entering the info tab
  useEffect(() => {
    if (isMounted && activeTab === "info" && portalData) {
      setHasNewNotifications(false);
      safeLocalStorage.setItem(`portal_last_notif_${portalData.patient.id}`, portalData.notifications.length.toString());
    }
  }, [activeTab, portalData, isMounted]);

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
    } catch (error) {
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
    } catch (error) {
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
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
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
                    className="h-20 rounded-2xl border-slate-200 bg-slate-50 text-center text-3xl font-black tracking-[0.3em] transition-all focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
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
                Vence el: {preview?.expiresAt ? new Date(preview.expiresAt).toLocaleDateString("es-CL", { day: '2-digit', month: 'long' }) : "—"}
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
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 font-sans">
      {/* Navbar Superior */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600 leading-none mb-0.5">Mi Portal</p>
              <h2 className="text-sm font-semibold text-slate-800 leading-none">{patient.fullName}</h2>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              safeLocalStorage.removeItem(getPortalStorageKey(token));
              window.location.reload();
            }}
            className="rounded-xl h-9 px-4 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 p-4 md:p-8">
        {/* Sidebar del Portal - Solo 4 Tabs */}
        <aside className="w-full lg:w-64 shrink-0 space-y-2">
          <div className="px-2 mb-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Navegación</h3>
          </div>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("diary")}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-3xl transition-all font-semibold text-sm group relative",
                activeTab === "diary" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full absolute left-3 transition-all",
                activeTab === "diary" ? "bg-white scale-100" : "bg-transparent scale-0"
              )} />
              <User className="h-5 w-5" />
              Diario
            </button>

            <button
              onClick={() => setActiveTab("messages")}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-3xl transition-all font-semibold text-sm group relative",
                activeTab === "messages" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full absolute left-3 transition-all",
                activeTab === "messages" ? "bg-white scale-100" : "bg-transparent scale-0"
              )} />
              <Send className="h-5 w-5" />
              Mensajes de tu Nutri
            </button>

            <button
              onClick={() => setActiveTab("questions")}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-3xl transition-all font-semibold text-sm group relative",
                activeTab === "questions" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full absolute left-3 transition-all",
                activeTab === "questions" ? "bg-white scale-100" : "bg-transparent scale-0"
              )} />
              <MessageSquare className="h-5 w-5" />
              Consultas y Dudas
            </button>

            <button
              onClick={() => setActiveTab("plans")}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-3xl transition-all font-semibold text-sm group relative",
                activeTab === "plans" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full absolute left-3 transition-all",
                activeTab === "plans" ? "bg-white scale-100" : "bg-transparent scale-0"
              )} />
              <Sparkles className="h-5 w-5" />
              Planes Entregados
            </button>

            <button
              onClick={() => setActiveTab("notifications")}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-3xl transition-all font-semibold text-sm group relative",
                activeTab === "notifications" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full absolute left-3 transition-all",
                activeTab === "notifications" ? "bg-white scale-100" : "bg-transparent scale-0"
              )} />
              <Bell className="h-5 w-5" />
              <span>Notificaciones Correo</span>
              {hasNewNotifications && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full ring-4 ring-white animate-pulse" />
              )}
            </button>
          </nav>

          <div className="bg-slate-50/80 rounded-[2.5rem] p-6 border border-slate-100">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.25em]">Powered by NutriNet</p>
            </div>
          </div>
        </aside>

        {/* Contenido Principal con Renderizado Condicional */}
        <main className="flex-1 space-y-8 min-w-0">
          {/* TAB: DIARIO */}
          {activeTab === "diary" && (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Input de Libreta (Estilo Facebook/Tweet) */}
              <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
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
                    className="rounded-2xl bg-indigo-600 text-white px-8 h-11 font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
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
                      <div key={entry.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-3 hover:border-indigo-100 transition-all group">
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
                          className="rounded-full px-8 border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all group"
                        >
                          Ver más registros
                          <ChevronRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 border-dashed p-12 text-center space-y-3">
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
              <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
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
                    className="rounded-2xl bg-emerald-600 text-white px-8 h-11 font-semibold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
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
                        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-3">
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
                          <div className="ml-8 space-y-3 border-l-2 border-slate-100 pl-6 py-1">
                            {question.replies.map((reply: any) => (
                              <div key={reply.id} className="bg-slate-50/50 rounded-[1.5rem] p-5 space-y-2 border border-slate-100/50">
                                <div className="flex items-center gap-3">
                                  {portalData.patient.nutritionist.avatarUrl ? (
                                    <img
                                      src={portalData.patient.nutritionist.avatarUrl}
                                      alt={portalData.patient.nutritionist.fullName}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                      <User className="h-3 w-3" />
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-900">{portalData.patient.nutritionist.fullName}</span>
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
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 border-dashed p-12 text-center space-y-3">
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
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Planes entregados</h1>
                    <p className="text-slate-400 font-medium text-sm">Material compartido por tu nutricionista para tu proceso.</p>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {portalData.sharedDeliverables.length > 0 ? (
                  portalData.sharedDeliverables.map((del: any) => {
                    const isDiet = del.type === 'DIET';
                    const isRecipe = del.type === 'RECIPE' || del.type === 'RECIPES';
                    const isFast = del.type === 'FAST_DELIVERABLE';

                    return (
                      <div key={del.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all group flex flex-col justify-between">
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
                  <div className="sm:col-span-2 lg:col-span-3 border-2 border-slate-100 border-dashed rounded-[3rem] p-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
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
                    <div key={msg.id} className="flex gap-4 max-w-2xl">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
                        {patient.nutritionist?.avatarUrl ? (
                          <img src={patient.nutritionist.avatarUrl} alt="Nutri" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          <User className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="bg-white rounded-[2rem] rounded-tl-none p-6 border border-slate-100 shadow-sm space-y-2 relative">
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
                <div className="bg-white rounded-[3rem] border border-slate-100 border-dashed p-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
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

          {/* TAB: NOTIFICACIONES POR CORREO */}
          {activeTab === "notifications" && (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {patient.nutritionist?.avatarUrl ? (
                    <img
                      src={patient.nutritionist.avatarUrl}
                      alt={patient.nutritionist.fullName}
                      className="w-24 h-24 rounded-[2rem] object-cover border border-indigo-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                      <User className="h-10 w-10" />
                    </div>
                  )}
                  <div className="text-center md:text-left space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Tu Profesional</p>
                    <h2 className="text-2xl font-semibold text-slate-900">{patient.nutritionist?.fullName}</h2>
                    <p className="text-slate-500 font-medium">Nutricionista Clínico a cargo de tu proceso</p>
                  </div>
                </div>

                <div className="space-y-6 pt-8 border-t border-slate-100">
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Historial de Notificaciones Correo</h3>
                  </div>

                  {portalData.notifications && portalData.notifications.length > 0 ? (
                    <div className="space-y-4">
                      {portalData.notifications.map((notif: any) => {
                        const isAlert = notif.payload?.notificationType === 'ALERT';
                        return (
                          <div key={notif.id} className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 space-y-4 relative overflow-hidden group">
                            {isAlert && <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />}
                            <div className="flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ring-1",
                                  isAlert ? "bg-orange-50 text-orange-700 ring-orange-100" : "bg-emerald-50 text-emerald-700 ring-emerald-100"
                                )}>
                                  {notif.payload?.notificationType || "INFO"}
                                </span>
                                <span className="text-[10px] text-slate-300">•</span>
                                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(notif.createdAt).toLocaleDateString("es-CL", { day: '2-digit', month: 'long' })}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2 relative z-10">
                              <h4 className="text-lg font-bold text-slate-900 leading-tight">
                                {notif.payload?.notificationTitle || "Aviso de tu nutricionista"}
                              </h4>
                              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                {notif.body}
                              </p>
                            </div>
                            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                              <Bell className="w-24 h-24" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 border-dashed p-12 text-center space-y-3">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-slate-200">
                        <Bell className="h-6 w-6" />
                      </div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Sin notificaciones</h3>
                      <p className="text-[10px] text-slate-400 max-w-xs mx-auto">No has recibido avisos por correo todavía.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
