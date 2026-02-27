"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import {
  Mail,
  Send,
  Users,
  History,
  FileText,
  CheckCircle2,
  Bell,
  Sparkles,
  AlertTriangle,
  XCircle,
  Info,
  Cpu,
  Zap,
  Clock,
  Shield,
  Bookmark,
  PlusCircle,
} from "lucide-react";
import Cookies from "js-cookie";
import appConfig from "@/content/config.json";

type Tab = "templates" | "create" | "admin" | "history" | "automation";
type CommunicationType = "email" | "announcement";
type RecipientType = "nutri" | "admin";

interface MessageForm {
  subject: string;
  content: string;
  targetMode: "all" | "specific" | "list";
  specificUserId?: string;
  emailList?: string;
  commType: CommunicationType;
  announcementType: "info" | "success" | "warning" | "error" | "promo";
  announcementLink?: string;
}

interface MessageTemplate {
  id: number;
  title: string;
  subject: string;
  content: string;
  lastUsed?: string;
}

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("templates");
  const { register, handleSubmit, watch, setValue, reset, control } =
    useForm<MessageForm>({
      defaultValues: {
        targetMode: "all",
        commType: "email",
        announcementType: "info",
      },
    });

  const targetMode = watch("targetMode");
  const commType = watch("commType");
  const announcementType = watch("announcementType");
  const formSubject = watch("subject");
  const formContent = watch("content");

  const [isSending, setIsSending] = useState(false);
  const [nutriOptions, setNutriOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoadingNutris, setIsLoadingNutris] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Pre-defined templates for "Mis Mensajes"
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: 1,
      title: "Bienvenida Estándar",
      subject: "¡Bienvenido(a) a la familia NutriSaaS!",
      content:
        "Estamos muy felices de tenerte con nosotros. Tu cuenta ya está activa y puedes empezar a gestionar tus pacientes de inmediato.",
      lastUsed: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Aviso de Mantenimiento",
      subject: "Aviso Importante: Mantenimiento Programado",
      content:
        "Realizaremos mejoras técnicas este domingo. El sistema podría presentar intermitencias por 1 hora.",
      lastUsed: new Date(Date.now() - 172800000).toISOString(),
    },
  ]);

  useEffect(() => {
    const fetchNutris = async () => {
      const role = activeTab === "admin" ? "ADMIN_GENERAL" : "NUTRITIONIST";
      if (targetMode !== "specific" || !searchQuery.trim()) {
        setNutriOptions([]);
        return;
      }

      setIsLoadingNutris(true);
      try {
        const token =
          Cookies.get("auth_token") || localStorage.getItem("auth_token");
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        const res = await fetch(
          `${apiUrl}/users?role=${role}&search=${searchQuery}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res.ok) {
          const data = await res.json();
          const options = data.map((u: any) => ({
            value: u.id,
            label: `${u.fullName} (${u.email})`,
          }));
          setNutriOptions(options);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoadingNutris(false);
      }
    };

    const timer = setTimeout(fetchNutris, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, targetMode, activeTab]);

  const [history, setHistory] = useState([
    {
      id: 1,
      subject: "Bienvenida a NutriSaaS",
      sentAt: new Date().toISOString(),
      recipientCount: 15,
      status: "completed",
      type: "email",
      target: "nutri",
    },
    {
      id: 2,
      subject: "Aviso Mantenimiento Servidor",
      sentAt: new Date(Date.now() - 3600000).toISOString(),
      recipientCount: 2,
      status: "completed",
      type: "announcement",
      target: "admin",
    },
  ]);

  const onSubmit = async (data: MessageForm) => {
    setIsSending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const recipientType: RecipientType =
        activeTab === "admin" ? "admin" : "nutri";
      let recipientCount = 0;
      if (data.targetMode === "all")
        recipientCount = recipientType === "admin" ? 3 : 100;
      if (data.targetMode === "specific") recipientCount = 1;
      if (data.targetMode === "list") {
        recipientCount =
          data.emailList?.split("\n").filter((e) => e.trim()).length || 0;
      }

      const newHistoryItem = {
        id: Date.now(),
        subject: data.subject,
        sentAt: new Date().toISOString(),
        recipientCount,
        status: "completed",
        type: data.commType,
        target: recipientType,
      };

      setHistory([newHistoryItem, ...history]);
      toast.success(
        `Mensaje enviado correctamente a ${recipientType === "admin" ? "Administradores" : "Nutricionistas"}.`,
      );
      reset();
      setActiveTab("history");
    } catch (error) {
      toast.error("Error al enviar el mensaje.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectTemplate = (template: MessageTemplate) => {
    setValue("subject", template.subject);
    setValue("content", template.content);
    setActiveTab("create");
    toast.info(`Cargada plantilla: ${template.title}`);
  };

  const commonGreeting = "Estimado [Nombre]";
  const commonClosing = `Muchas gracias por su atención.\nEquipo de ${appConfig.appName}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-indigo-900">
            Centro de Mensajería
          </h1>
          <p className="text-slate-500">
            Gestiona la comunicación con nutricionistas y equipo interno.
          </p>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav
          className="-mb-px flex space-x-8 overflow-x-auto"
          aria-label="Tabs"
        >
          {[
            { id: "templates", label: "Mis Mensajes", icon: Bookmark },
            { id: "create", label: "Mensaje Nutris", icon: Users },
            { id: "admin", label: "Coordinación Admin", icon: Shield },
            { id: "history", label: "Historial", icon: History },
            { id: "automation", label: "Automatizados", icon: Zap },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as Tab);
                if (tab.id === "admin") {
                  setValue("commType", "announcement");
                  setValue("targetMode", "all");
                }
              }}
              className={`
                                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center gap-2 transition-all
                                ${
                                  activeTab === tab.id
                                    ? "border-indigo-500 text-indigo-600"
                                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                }
                            `}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "templates" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex justify-between items-center bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <div>
              <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                <Bookmark className="h-5 w-5 fill-indigo-600" />
                Mensajes Guardados
              </h2>
              <p className="text-sm text-indigo-700 font-medium">
                Reutiliza tus mejores redacciones para ahorrar tiempo.
              </p>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-indigo-200">
              <PlusCircle className="h-5 w-5 mr-2" />
              Crear Nuevo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white border-2 border-slate-100 rounded-2xl p-6 hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer group flex flex-col justify-between h-full"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Plantilla
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                      {template.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-1 line-clamp-1">
                      {template.subject}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3 font-medium leading-relaxed italic">
                    "{template.content}"
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-tighter">
                    <Clock className="h-3 w-3" />
                    Usado:{" "}
                    {new Intl.DateTimeFormat("es-CL").format(
                      new Date(template.lastUsed || ""),
                    )}
                  </span>
                  <span className="text-indigo-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all">
                    Usar ahora →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === "create" || activeTab === "admin") && (
        <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div
                  className={`p-4 rounded-xl border transition-colors ${activeTab === "admin" ? "bg-indigo-50 border-indigo-200 text-indigo-900 font-bold flex items-center gap-3" : "bg-slate-50 border-slate-200"}`}
                >
                  {activeTab === "admin" ? (
                    <>
                      <Shield className="h-5 w-5" />
                      <span>Modo: Coordinación Interna (Solo Admins)</span>
                      <input
                        type="hidden"
                        value="announcement"
                        {...register("commType")}
                      />
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider text-[11px]">
                        Método de Envío
                      </label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setValue("commType", "email")}
                          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-bold ${commType === "email" ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-600"}`}
                        >
                          <Mail className="h-4 w-4" /> Correo
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue("commType", "announcement")}
                          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-bold ${commType === "announcement" ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-600"}`}
                        >
                          <Bell className="h-4 w-4" /> Notificación App
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider text-[11px]">
                    ¿A quién enviamos?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        mode: "all",
                        icon: Users,
                        label:
                          activeTab === "admin"
                            ? "Todos los Admins"
                            : "Todos los Nutris",
                      },
                      { mode: "specific", icon: Mail, label: "Específico" },
                      { mode: "list", icon: FileText, label: "Lista" },
                    ].map((item) => (
                      <label
                        key={item.mode}
                        className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center text-center gap-2 transition-all ${targetMode === item.mode ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}
                      >
                        <input
                          type="radio"
                          value={item.mode}
                          className="sr-only"
                          {...register("targetMode")}
                        />
                        <item.icon className="h-6 w-6" />
                        <span className="text-[10px] font-black uppercase tracking-tight leading-tight">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {targetMode === "specific" && (
                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <label className="block text-sm font-bold text-indigo-900 mb-2">
                      Buscar{" "}
                      {activeTab === "admin"
                        ? "Administrador"
                        : "Nutricionista"}
                    </label>
                    <Controller
                      name="specificUserId"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <SearchableSelect
                          options={nutriOptions}
                          value={field.value || ""}
                          onChange={field.onChange}
                          onSearch={setSearchQuery}
                          isLoading={isLoadingNutris}
                          placeholder="Escribe para buscar..."
                          className="bg-white"
                        />
                      )}
                    />
                    <p className="mt-2 text-[10px] text-indigo-600 font-medium italic">
                      Debes escribir para ver coincidencias.
                    </p>
                  </div>
                )}

                {targetMode === "list" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      Correos manuales
                    </label>
                    <Textarea
                      placeholder={
                        "correo1@ejemplo.com\ncorreo2@ejemplo.com\ncorreo3@ejemplo.com"
                      }
                      className="min-h-[120px]"
                      {...register("emailList", { required: true })}
                    />
                    <p className="text-[10px] text-slate-500 font-medium italic">
                      Ingresa un correo por línea para un procesamiento
                      correcto.
                    </p>
                  </div>
                )}

                {commType === "announcement" && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-emerald-900 mb-2">
                        Tipo
                      </label>
                      <select
                        {...register("announcementType")}
                        className="w-full h-11 px-3 rounded-xl border border-emerald-200 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      >
                        <option value="info">💬 Informativo</option>
                        <option value="success">✨ Sistema / Novedad</option>
                        <option value="warning">⚠️ Aviso Urgente</option>
                        <option value="error">🚨 Crítico / Error</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-emerald-900 mb-2">
                        Enlace (Opcional)
                      </label>
                      <Input
                        placeholder="https://..."
                        {...register("announcementLink")}
                        className="bg-white border-emerald-200"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t">
                  <Input
                    placeholder="Asunto..."
                    className="font-bold text-lg"
                    {...register("subject", { required: true })}
                  />
                  <Textarea
                    placeholder="Contenido del mensaje..."
                    className="min-h-[200px]"
                    {...register("content", { required: true })}
                  />
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <Info className="h-4 w-4 text-amber-600 shrink-0" />
                    <p className="text-[10px] text-amber-700 font-medium leading-tight">
                      Se añadirá automáticamente el saludo{" "}
                      <strong>"{commonGreeting}"</strong> al inicio y la firma
                      de <strong>{appConfig.appName}</strong> al final.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[200px]"
                    isLoading={isSending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {activeTab === "admin"
                      ? "Enviar Notificación Admin"
                      : commType === "email"
                        ? "Enviar Correos"
                        : "Publicar Notificación"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden h-fit">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="h-24 w-24" />
              </div>
              <h3 className="text-sm font-black text-indigo-400 uppercase mb-4 tracking-widest text-center">
                Vista Previa
              </h3>
              <div className="bg-white/5 rounded-xl border border-white/10 space-y-3 flex flex-col min-h-[400px]">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-indigo-300 px-2 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20">
                    {activeTab === "admin"
                      ? "CANAL ADMIN"
                      : commType.toUpperCase()}
                  </span>
                  {activeTab === "admin" && (
                    <Shield className="h-3 w-3 text-indigo-400" />
                  )}
                </div>
                <div className="px-5 py-2">
                  <h4 className="font-bold text-xl leading-tight break-all">
                    {formSubject || "Escribe un asunto..."}
                  </h4>
                </div>
                <div className="px-5 pb-5 space-y-4 flex-1 flex flex-col">
                  <p className="text-indigo-400 text-xs font-black uppercase tracking-widest">
                    {commonGreeting},
                  </p>
                  <p className="text-slate-200 text-sm whitespace-pre-wrap break-all flex-1">
                    {formContent ||
                      "Redacta el contenido para previsualizarlo aquí..."}
                  </p>

                  {watch("announcementLink") && (
                    <div className="pt-2">
                      <div className="w-full py-2 bg-indigo-600 rounded text-center text-xs font-bold shadow-lg shadow-indigo-900/40">
                        IR AL ENLACE
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/5 space-y-1">
                    <p className="text-slate-400 text-xs italic whitespace-pre-line">
                      {commonClosing}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[10px] text-slate-500 text-center italic font-medium">
                Esta es una representación de cómo se verá el mensaje final.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">
                    Asunto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">
                    Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">
                    Canal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {item.subject}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${item.target === "admin" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-green-100 text-green-700 border border-green-200"}`}
                      >
                        {item.target === "admin"
                          ? "Equipo Admin"
                          : "Nutricionistas"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.type === "email" ? "bg-blue-100 text-blue-700" : "bg-indigo-100 text-indigo-700"}`}
                      >
                        {item.type === "email" ? (
                          <Mail className="h-3 w-3" />
                        ) : (
                          <Bell className="h-3 w-3" />
                        )}
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">
                      {new Intl.DateTimeFormat("es-CL", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(item.sentAt))}
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
                      Completado
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "automation" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden text-center sm:text-left">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Cpu className="h-32 w-32" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-2 flex items-center justify-center sm:justify-start gap-2">
                <Zap className="h-6 w-6 text-yellow-300 fill-yellow-300" />
                Módulo de Automatización
              </h2>
              <p className="text-indigo-100 text-lg font-medium leading-relaxed">
                Próximamente: Diseña flujos de comunicación inteligentes. Podrás
                programar envíos automáticos basados en eventos y reutilizar tus
                mensajes guardados para ahorrar tiempo valioso.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">
                Automatizaciones Activas
              </h3>
              <p className="text-xs text-slate-500">
                Reglas que se ejecutan automáticamente por el sistema.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest"
                    >
                      Nombre / Disparador
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest"
                    >
                      Acción
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest"
                    >
                      Estado
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest"
                    >
                      Frecuencia
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">
                          Termino de Prueba Gratuita
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium italic">
                          Trigger: Trial Ends
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <Bell className="h-4 w-4 text-amber-500" />
                        Notificación de expiración y compra de plan.
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        Activo
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                        <Clock className="h-3.5 w-3.5" />
                        En Tiempo Real
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex gap-4 hover:border-indigo-200 transition-colors cursor-default">
              <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm text-indigo-600">
                <History className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Usa "Mis Mensajes"</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Conecta tus plantillas redactadas con disparadores automáticos
                  para una comunicación coherente y profesional.
                </p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex gap-4 hover:border-emerald-200 transition-colors cursor-default">
              <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm text-emerald-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">
                  Segmentación Inteligente
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Automatiza basado en el comportamiento: registros nuevos,
                  inactividad proactiva, o renovaciones de suscripción exitosas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Crown({ className }: { className?: string }) {
  return <Sparkles className={className} />;
}
