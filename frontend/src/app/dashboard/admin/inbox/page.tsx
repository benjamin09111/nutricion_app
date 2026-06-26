"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Inbox,
  Mail,
  RefreshCw,
  Send,
  Search,
  Clock,
  CheckCircle2,
  MessageSquare,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { fetchApi } from "@/lib/api-base";

type InboxItem = {
  id: string;
  email: string;
  message: string | null;
  type: "PASSWORD_RESET" | "CONTACT" | "OTHER" | "FEEDBACK" | "TESTIMONIO" | "COMPLAINT" | "IDEA";
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  updatedAt: string;
};

const statusLabels: Record<InboxItem["status"], string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En proceso",
  RESOLVED: "Resuelto",
};

const statusStyles: Record<InboxItem["status"], string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const extractSubject = (message: string | null) => {
  if (!message) return "Sin asunto";

  const match = message.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
  return match?.[1]?.trim() || "Mensaje de contacto";
};

const extractBody = (message: string | null) => {
  if (!message) return "Sin mensaje";

  const match = message.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
  return match?.[2]?.trim() || message.trim();
};

export default function AdminInboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | InboxItem["status"]>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const loadInbox = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetchApi("/support", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("No se pudo cargar el inbox");
      }

      const data = (await response.json()) as InboxItem[];
      const landingMessages = data.filter((item) => item.type === "CONTACT");
      setItems(landingMessages);

      setSelectedItem((current) => {
        if (!landingMessages.length) return null;
        if (current) {
          return landingMessages.find((item) => item.id === current.id) || landingMessages[0];
        }
        return landingMessages[0];
      });
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los mensajes del inbox");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  useEffect(() => {
    setReplyMessage("");
  }, [selectedItem?.id]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        item.email.toLowerCase().includes(search) ||
        extractSubject(item.message).toLowerCase().includes(search) ||
        extractBody(item.message).toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [items, searchTerm, statusFilter]);

  const pendingCount = items.filter((item) => item.status === "PENDING").length;
  const resolvedCount = items.filter((item) => item.status === "RESOLVED").length;

  const handleReply = async () => {
    if (!selectedItem) return;

    const message = replyMessage.trim();
    if (!message) {
      toast.error("Escribe una respuesta antes de enviar");
      return;
    }

    setIsSending(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetchApi(`/support/${selectedItem.id}/reply`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error("No se pudo enviar la respuesta");
      }

      toast.success("Respuesta enviada por correo electrónico");
      setReplyMessage("");
      window.dispatchEvent(new Event("admin-inbox-updated"));
      await loadInbox();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo responder el mensaje");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
            <Inbox className="h-4 w-4" />
            Inbox
          </div>
          <h1 className="text-3xl font-black tracking-tight text-indigo-950">Mensajes de la landing</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Aquí llegan las dudas y preguntas del formulario. La respuesta sale desde el correo configurado del proyecto.
          </p>
        </div>

        <Button variant="outline" onClick={loadInbox} className="gap-2 self-start lg:self-auto">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Pendientes</p>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Respondidos</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">{resolvedCount}</p>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total</p>
            <MessageSquare className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">{items.length}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por correo o texto..."
                  className="h-11 pl-9"
                />
              </div>
              <div className="flex gap-2">
                {(["ALL", "PENDING", "RESOLVED"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] transition ${
                      statusFilter === status
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {status === "ALL" ? "Todos" : statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-h-[72vh] divide-y divide-slate-100 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-4 sm:p-5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-50" />
                ))}
              </div>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isActive = selectedItem?.id === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className={`w-full cursor-pointer px-4 py-4 text-left transition sm:px-5 ${
                      isActive ? "bg-indigo-50/70" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                            {extractSubject(item.message)}
                          </span>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusStyles[item.status]}`}>
                            {statusLabels[item.status]}
                          </span>
                        </div>
                        <p className="truncate text-sm font-semibold text-slate-900">{item.email}</p>
                        <p className="line-clamp-2 text-sm text-slate-600">{extractBody(item.message)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2 text-xs text-slate-400">
                        <span>
                          {formatDistanceToNow(new Date(item.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                        <Mail className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
                <Inbox className="h-10 w-10 text-slate-300" />
                <h2 className="mt-4 text-lg font-bold text-slate-900">Sin mensajes para mostrar</h2>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  No hay preguntas nuevas con estos filtros.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {selectedItem ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
                    <User className="h-4 w-4" />
                    {selectedItem.email}
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">
                    {extractSubject(selectedItem.message)}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {formatDistanceToNow(new Date(selectedItem.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${statusStyles[selectedItem.status]}`}>
                  {statusLabels[selectedItem.status]}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Mensaje</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {extractBody(selectedItem.message)}
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Respuesta rápida
                </label>
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Escribe aquí la respuesta que recibirá por correo..."
                  className="min-h-36"
                  disabled={selectedItem.status === "RESOLVED"}
                />
                <Button
                  onClick={handleReply}
                  isLoading={isSending}
                  disabled={selectedItem.status === "RESOLVED"}
                  className="w-full gap-2"
                >
                  <Send className="h-4 w-4" />
                  Responder y cerrar
                </Button>
                {selectedItem.status === "RESOLVED" && (
                  <p className="text-xs text-emerald-600">
                    Este mensaje ya fue respondido.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <Inbox className="h-12 w-12 text-slate-300" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">Selecciona un mensaje</h2>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Aquí verás el detalle y podrás responderle al usuario por correo.
              </p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
