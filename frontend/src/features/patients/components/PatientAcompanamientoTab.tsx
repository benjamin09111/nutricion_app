import React from "react";
import {
  ClipboardList,
  Send,
  MessageSquare,
  Sparkles,
  Bell,
  ShieldCheck,
  Search,
  User,
  History as HistoryIcon,
  Reply,
  CalendarDays,
  AlertCircle,
  Globe,
  Plus,
  Link2,
  Copy,
  Mail,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Patient } from "@/features/patients";
import { PatientPortalOverview, PatientPortalEntry } from "@/features/patient-portal";
import { cn } from "../utils/patient-helpers";

interface PatientAcompanamientoTabProps {
  patient: Patient;
  portalOverview: PatientPortalOverview | null;
  activeAcompTab: "diario" | "preguntas" | "planes" | "notificaciones" | "mensajes";
  setActiveAcompTab: (tab: "diario" | "preguntas" | "planes" | "notificaciones" | "mensajes") => void;
  portalFilter: { search: string };
  setPortalFilter: React.Dispatch<React.SetStateAction<any>>;
  replyTarget: PatientPortalEntry | null;
  setReplyTarget: (target: PatientPortalEntry | null) => void;
  replyMessage: string;
  setReplyMessage: (msg: string) => void;
  isSubmittingPortalReply: boolean;
  handleReplyPortalQuestion: () => Promise<void>;
  portalMessageText: string;
  setPortalMessageText: (text: string) => void;
  isCreatingPortalMessage: boolean;
  handleCreatePortalMessage: () => Promise<void>;
  setActiveTab: (tab: any) => void;
  portalAccessCode: string;
  generatedPortalLink: string;
  handleCopyPortalLink: (link?: string) => Promise<void>;
  handleSendInvitationEmail: (email?: string) => Promise<void>;
  isCreatingPortalInvite: boolean;
  setIsPortalInviteModalOpen: (open: boolean) => void;

  // Notification modal props
  isPortalNotificationModalOpen: boolean;
  setIsPortalNotificationModalOpen: (open: boolean) => void;
  portalNotificationTitle: string;
  setPortalNotificationTitle: (title: string) => void;
  portalNotificationMessage: string;
  setPortalNotificationMessage: (msg: string) => void;
  portalNotificationSendEmail: boolean;
  setPortalNotificationSendEmail: (send: boolean) => void;
  isCreatingPortalNotification: boolean;
  handleCreatePortalNotification: () => Promise<void>;
}

export function PatientAcompanamientoTab({
  patient,
  portalOverview,
  activeAcompTab,
  setActiveAcompTab,
  portalFilter,
  setPortalFilter,
  replyTarget,
  setReplyTarget,
  replyMessage,
  setReplyMessage,
  isSubmittingPortalReply,
  handleReplyPortalQuestion,
  portalMessageText,
  setPortalMessageText,
  isCreatingPortalMessage,
  handleCreatePortalMessage,
  setActiveTab,
  portalAccessCode,
  generatedPortalLink,
  handleCopyPortalLink,
  handleSendInvitationEmail,
  isCreatingPortalInvite,
  setIsPortalInviteModalOpen,

  isPortalNotificationModalOpen,
  setIsPortalNotificationModalOpen,
  portalNotificationTitle,
  setPortalNotificationTitle,
  portalNotificationMessage,
  setPortalNotificationMessage,
  portalNotificationSendEmail,
  setPortalNotificationSendEmail,
  isCreatingPortalNotification,
  handleCreatePortalNotification,
}: PatientAcompanamientoTabProps) {
  const portalEntries = portalOverview?.entries || [];
  const activeInvitation = portalOverview?.portal?.activeInvitation;
  const latestInvitation = portalOverview?.portal?.latestInvitation;
  const isVerified = !!(activeInvitation?.verifiedAt || latestInvitation?.verifiedAt);
  const hasPortal = !!(activeInvitation || latestInvitation);
  const displayCode = portalAccessCode;
  const displayLink = generatedPortalLink;

  if (!hasPortal) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
            <Link2 className="w-7 h-7 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              Crea un link y compártelo a tu paciente
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Genera un enlace de acceso y un código personal. Tu paciente entrará con su correo y el código, y una vez verifique su identidad, el portal queda activo de forma permanente.
            </p>
          </div>
          <Button
            onClick={() => setIsPortalInviteModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 h-12 rounded-2xl shadow-lg shadow-emerald-100 cursor-pointer"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Crear link de acceso
          </Button>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-base font-bold text-slate-900">Esperando que el paciente ingrese su código</h3>
              <p className="text-sm text-slate-500">
                Tu paciente aún no ha ingresado su código de acceso. Comparte el link y el código para que pueda activar su portal.
              </p>
            </div>
          </div>
          {displayLink && (
            <div className="space-y-3 bg-slate-50 rounded-2xl p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Link de acceso</p>
                <p className="text-sm font-semibold text-slate-700 break-all">{displayLink}</p>
              </div>
              {displayCode && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Código de acceso</p>
                  <p className="text-2xl font-black tracking-[0.2em] text-slate-900">{displayCode}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => void handleCopyPortalLink(displayLink)}
                  className="flex-1 rounded-2xl h-10 cursor-pointer"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar link
                </Button>
                <Button
                  onClick={() => void handleSendInvitationEmail()}
                  isLoading={isCreatingPortalInvite}
                  className="flex-1 rounded-2xl h-10 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar por correo
                </Button>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsPortalInviteModalOpen(true)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            Generar un nuevo link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Portal active status */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-700">Portal del paciente activo</p>
            <p className="text-xs text-slate-400">
              {portalOverview?.summary?.latestEntryAt
                ? `Última actividad hace ${portalOverview.summary.daysSinceLastEntry} día${portalOverview.summary.daysSinceLastEntry === 1 ? '' : 's'}`
                : 'Sin actividad aún'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {displayCode && (
            <span className="text-xs font-black tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl">
              {displayCode}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleCopyPortalLink(displayLink)}
            className="h-8 rounded-xl text-[10px] font-bold cursor-pointer"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copiar link
          </Button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {[
            {
              id: "diario",
              label: "Diario",
              icon: ClipboardList,
              activeColor: "text-indigo-600",
            },
            {
              id: "mensajes",
              label: "Mensajes",
              icon: Send,
              activeColor: "text-blue-600",
            },
            {
              id: "preguntas",
              label: "Consultas",
              icon: MessageSquare,
              activeColor: "text-emerald-600",
            },
            {
              id: "planes",
              label: "Planes",
              icon: Sparkles,
              activeColor: "text-amber-600",
            },
            {
              id: "notificaciones",
              label: "Notificaciones",
              icon: Bell,
              activeColor: "text-rose-600",
            },
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveAcompTab(sub.id as any)}
              className={cn(
                "px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0",
                activeAcompTab === sub.id
                  ? `${sub.activeColor} bg-slate-50`
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              <sub.icon className="w-3.5 h-3.5" />
              {sub.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            Portal activo
          </span>
        </div>
      </div>

      {/* Sub-tab Content */}
      <div className="min-h-[400px]">
        {activeAcompTab === "diario" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-indigo-50">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600">
                    Diario
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400">
                    Bitácora de alimentación y hábitos de {patient?.fullName}
                  </p>
                </div>
              </div>

              {/* Filters and Search for Entries */}
              <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar en el diario..."
                    className="h-12 pl-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500/20 text-slate-950 font-medium"
                    value={portalFilter.search}
                    onChange={(e) =>
                      setPortalFilter((prev: any) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Entries List */}
              <div className="space-y-4">
                {portalOverview?.tracking &&
                portalOverview.tracking.length > 0 ? (
                  portalOverview.tracking
                    .filter(
                      (h) =>
                        !portalFilter.search ||
                        (h.body || "")
                          .toLowerCase()
                          .includes(portalFilter.search.toLowerCase()),
                    )
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-white text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                              Registro Diario
                            </span>
                            <span className="text-[10px] font-bold text-slate-300">
                              •
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                              {new Date(entry.createdAt).toLocaleDateString(
                                "es-ES",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-700 font-semibold leading-relaxed">
                          {entry.body || "Sin mensaje adjunto"}
                        </p>
                      </div>
                    ))
                ) : (
                  <div className="p-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <HistoryIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      Sin registros diarios
                    </h4>
                    <p className="text-xs font-medium text-slate-400 mt-2">
                      El paciente aún no ha registrado su actividad diaria.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeAcompTab === "preguntas" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-emerald-50">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600">
                    Consultas
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400">
                    Responde las dudas de {patient?.fullName}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {portalOverview?.questions &&
                portalOverview.questions.length > 0 ? (
                  portalOverview.questions.map((q) => {
                    const replies = q.replies || [];
                    return (
                      <div key={q.id} className="space-y-4">
                        <div className="flex gap-4 max-w-[90%]">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                {patient?.fullName}
                              </span>
                              <span className="text-[10px] font-bold text-slate-300">
                                •
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                {new Date(q.createdAt).toLocaleDateString(
                                  "es-ES",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                            <p className="text-slate-700 font-semibold leading-relaxed">
                              {q.body}
                            </p>
                          </div>
                        </div>

                        {replies.map((r) => (
                          <div
                            key={r.id}
                            className="flex justify-end gap-4 ml-12"
                          >
                            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 relative group">
                              <div className="flex items-center gap-2 mb-2 justify-end">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                  {new Date(r.createdAt).toLocaleDateString(
                                    "es-ES",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-300">
                                  •
                                </span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                  TÚ (NUTRI)
                                </span>
                              </div>
                              <p className="text-emerald-900 font-semibold text-right leading-relaxed">
                                {r.body}
                              </p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-md">
                              {portalOverview.patient?.nutritionist?.avatarUrl ? (
                                <img
                                  src={portalOverview.patient.nutritionist.avatarUrl}
                                  alt="Me"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-white" />
                              )}
                            </div>
                          </div>
                        ))}

                        <div className="flex justify-end pl-12 pr-14">
                          {replyTarget?.id === q.id ? (
                            <div className="w-full space-y-3 bg-white p-5 rounded-2xl border border-emerald-100 shadow-xl shadow-emerald-500/5 animate-in zoom-in-95 duration-300">
                              <Textarea
                                placeholder="Escribe tu respuesta aquí..."
                                className="min-h-[100px] rounded-2xl border-transparent bg-slate-50 focus:bg-white focus:border-emerald-500/20 font-medium py-4 px-6 text-sm resize-none"
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                              />
                              <div className="flex justify-end gap-3">
                                <Button
                                  variant="ghost"
                                  className="h-11 rounded-2xl font-bold text-slate-400 px-6 hover:bg-slate-50 cursor-pointer"
                                  onClick={() => {
                                    setReplyTarget(null);
                                    setReplyMessage("");
                                  }}
                                >
                                  CANCELAR
                                </Button>
                                <Button
                                  className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 rounded-2xl shadow-lg shadow-emerald-100 active:scale-95 transition-all text-xs tracking-widest cursor-pointer"
                                  onClick={handleReplyPortalQuestion}
                                  disabled={isSubmittingPortalReply}
                                >
                                  {isSubmittingPortalReply
                                    ? "ENVIANDO..."
                                    : "ENVIAR RESPUESTA"}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplyTarget(q)}
                              className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-emerald-100 text-emerald-600 font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-50 transition-all active:scale-95 group cursor-pointer"
                            >
                              <Reply className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                              Continuar hilo o responder
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      Sin consultas
                    </h4>
                    <p className="text-xs font-medium text-slate-400 mt-2">
                      Tu paciente no ha enviado ninguna consulta todavía.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeAcompTab === "planes" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-50">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-600">
                      Planes
                    </h3>
                    <p className="text-[10px] font-medium text-slate-400">
                      Entregables visibles para {patient?.fullName}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setActiveTab("Creaciones")}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black px-5 rounded-2xl shadow-lg h-10 text-[10px] tracking-widest uppercase cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  Compartir
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portalOverview?.sharedDeliverables &&
                portalOverview.sharedDeliverables.length > 0 ? (
                  portalOverview.sharedDeliverables.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-amber-100 transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                          <ClipboardList className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">
                            {plan.type}
                          </p>
                          <h4 className="text-sm font-bold text-slate-800 leading-none truncate max-w-[150px]">
                            {plan.name}
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {new Date(plan.createdAt).toLocaleDateString(
                            "es-ES",
                            { day: "numeric", month: "short" },
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                          onClick={() => {
                            window.open(
                              `/dashboard/creaciones/${plan.id}`,
                              "_blank",
                            );
                          }}
                        >
                          Ver Detalle
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <Sparkles className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      No hay planes compartidos
                    </p>
                    <p className="text-xs font-medium text-slate-400 mt-2">
                      Haz clic en compartir para que tu paciente pueda ver sus guías.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeAcompTab === "mensajes" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-blue-600">
                    Mensajes
                  </h3>
                  <p className="text-[10px] font-medium text-slate-400">
                    Mensajes que tu paciente leerá en su portal
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Textarea
                  value={portalMessageText}
                  onChange={(e) => setPortalMessageText(e.target.value)}
                  placeholder="Escribe un mensaje, recomendación o saludo para tu paciente..."
                  className="min-h-[120px] rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-blue-500/10 focus:border-blue-500 resize-none py-5 px-6 text-sm font-medium leading-relaxed"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleCreatePortalMessage}
                    disabled={
                      !portalMessageText.trim() || isCreatingPortalMessage
                    }
                    isLoading={isCreatingPortalMessage}
                    className="rounded-2xl bg-blue-600 text-white px-8 h-12 font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all uppercase text-[10px] tracking-widest cursor-pointer"
                  >
                    Publicar en el Portal
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                  Historial de Mensajes
                </h4>
                {portalOverview?.messages &&
                portalOverview.messages.length > 0 ? (
                  <div className="space-y-4">
                    {portalOverview.messages.map((m) => (
                      <div
                        key={m.id}
                        className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            {new Date(m.createdAt).toLocaleString("es-ES", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium leading-relaxed">
                          {m.body}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                      No hay mensajes enviados
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeAcompTab === "notificaciones" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-50">
                    <Bell className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-600">
                      Notificaciones
                    </h3>
                    <p className="text-[10px] font-medium text-slate-400">
                      Envía avisos que disparan un email a tu paciente
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsPortalNotificationModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black px-5 rounded-2xl shadow-lg h-10 text-[10px] tracking-widest uppercase cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                  Nueva
                </Button>
              </div>

              <div className="space-y-4">
                {portalOverview?.notifications &&
                portalOverview.notifications.length > 0 ? (
                  portalOverview.notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-rose-100 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                              notif.payload?.notificationType === "ALERT"
                                ? "bg-red-50 text-red-600 border-red-100"
                                : notif.payload?.notificationType === "REMINDER"
                                  ? "bg-amber-50 text-amber-600 border-amber-100"
                                  : "bg-indigo-50 text-indigo-600 border-indigo-100",
                            )}
                          >
                            {notif.payload?.notificationType || "INFO"}
                          </div>
                          <span className="text-[10px] font-bold text-slate-300">
                            •
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            {new Date(notif.createdAt).toLocaleDateString(
                              "es-ES",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">
                        {notif.payload?.notificationTitle || "Sin título"}
                      </h4>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {notif.body}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      Sin notificaciones
                    </h4>
                    <p className="text-xs font-medium text-slate-400 mt-2">
                      No has enviado ninguna notificación por correo todavía.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isPortalNotificationModalOpen}
        onClose={() => setIsPortalNotificationModalOpen(false)}
        title="Enviar notificación al paciente"
      >
        <div className="space-y-5 py-2">
          <div className="rounded-3xl border border-indigo-100 bg-[#fffeec]/80 p-4">
            <p className="text-sm font-semibold text-indigo-900">
              Envía un aviso puntual a este paciente. La notificación aparecerá
              de inmediato en su portal privado.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Título
            </label>
            <Input
              value={portalNotificationTitle}
              onChange={(e) => setPortalNotificationTitle(e.target.value)}
              placeholder="Ej: Recuerda tu comida post entrenamiento"
              className="h-12 rounded-2xl border-slate-200 text-slate-900 font-semibold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Mensaje
            </label>
            <Textarea
              value={portalNotificationMessage}
              onChange={(e) => setPortalNotificationMessage(e.target.value)}
              placeholder="Escribe el aviso o indicación que debe ver el paciente."
              className="min-h-[160px] rounded-2xl border-slate-200 resize-none py-4 px-6 text-sm font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsPortalNotificationModalOpen(false)}
              className="rounded-2xl px-5 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreatePortalNotification}
              isLoading={isCreatingPortalNotification}
              className="rounded-2xl bg-indigo-600 px-5 text-white hover:bg-indigo-700 cursor-pointer"
            >
              <Bell className="mr-2 h-4 w-4" />
              Enviar notificación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
