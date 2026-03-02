"use client";

import { useState } from "react";
import {
  useNotifications,
  NotificationType,
} from "@/context/NotificationsContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Bell, Send, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import Cookies from "js-cookie";

export default function AdminNotificationsPage() {
  const { addNotification } = useNotifications();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [link, setLink] = useState("");
  const [targetRoles, setTargetRoles] = useState<string[]>(["ALL"]);

  const handleRoleChange = (role: string) => {
    if (role === "ALL") {
      setTargetRoles(["ALL"]);
    } else {
      let newRoles = targetRoles.filter((r) => r !== "ALL");
      if (newRoles.includes(role)) {
        newRoles = newRoles.filter((r) => r !== role);
      } else {
        newRoles = [...newRoles, role];
      }
      if (newRoles.length === 0) newRoles = ["ALL"]; // Fallback to all if empty? Or just let it be empty (invalid state)
      setTargetRoles(newRoles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    const token = Cookies.get("auth_token");
    if (!token) {
      toast.error("Sesión no válida");
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          message,
          type,
          link: link || undefined,
          targetRoles,
        }),
      });

      if (res.ok) {
        toast.success("Anuncio enviado correctamente");
        // Reset form
        setTitle("");
        setMessage("");
        setType("info");
        setLink("");
        setTargetRoles(["ALL"]);
      } else {
        toast.error("Error al enviar el anuncio");
      }
    } catch (error) {
      console.error("Error sending announcement:", error);
      toast.error("Error de conexión");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <Bell size={24} />
          </div>
          Gestor de Anuncios
        </h1>
        <p className="text-slate-500 mt-2">
          Envía avisos y novedades a todos los nutricionistas de la plataforma.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Tipo de Notificación
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
                className="w-full h-10 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              >
                <option value="info">Información (Azul)</option>
                <option value="success">Éxito (Verde)</option>
                <option value="warning">Advertencia (Ambar)</option>
                <option value="error">Error/Crítico (Rojo)</option>
                <option value="promo">Novedad/Promo (Índigo)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Enlace (Opcional)
              </label>
              <Input
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="text-slate-900 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Título
            </label>
            <Input
              placeholder="Ej: Nuevo módulo de recetas disponible"
              className="font-medium text-slate-900"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">
              Destinatarios
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange("ALL")}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                  targetRoles.includes("ALL")
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("NUTRITIONIST")}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                  targetRoles.includes("NUTRITIONIST")
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Nutricionistas
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("ADMIN")}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                  targetRoles.includes("ADMIN")
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Administradores
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Mensaje
            </label>
            <textarea
              placeholder="Escribe el contenido de la notificación..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none font-medium"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setTitle("");
                setMessage("");
                setType("info");
                setLink("");
              }}
              className="text-slate-500"
            >
              <RotateCcw size={16} className="mr-2" />
              Limpiar
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
            >
              <Send size={16} className="mr-2" />
              Enviar Notificación
            </Button>
          </div>
        </form>
      </div>

      {/* Preview Section */}
      <div className="mt-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
          Vista Previa
        </h3>
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 opacity-75">
          <div className="flex gap-4 items-start">
            <div
              className={`p-3 rounded-xl h-fit w-fit
                            ${type === "info" ? "bg-blue-100 text-blue-600" : ""}
                            ${type === "success" ? "bg-emerald-100 text-emerald-600" : ""}
                            ${type === "warning" ? "bg-amber-100 text-amber-600" : ""}
                            ${type === "error" ? "bg-red-100 text-red-600" : ""}
                            ${type === "promo" ? "bg-indigo-100 text-indigo-600" : ""}
                        `}
            >
              <Bell size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">
                {title || "Título de la notificación"}
              </h4>
              <p className="text-slate-600 text-sm mt-1">
                {message || "El mensaje aparecerá aquí..."}
              </p>
              <p className="text-xs text-slate-400 mt-2">Hace un momento</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {targetRoles.map((role) => (
              <span
                key={role}
                className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase"
              >
                {role === "ALL" ? "Todos" : role}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
