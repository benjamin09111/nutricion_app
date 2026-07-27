"use client";

import { useRouter } from "next/navigation";
import { useNotifications, Notification } from "@/context/NotificationsContext";
import { Button } from "@/components/ui/Button";
import {
  Bell,
  CheckCheck,
  Trash2,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    unreadCount,
  } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="text-indigo-600" />;
      case "warning":
        return <AlertTriangle className="text-amber-500" />;
      case "error":
        return <XCircle className="text-red-500" />;
      case "promo":
        return <Sparkles className="text-indigo-500" />;
      default:
        return <Info className="text-slate-400" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-indigo-50 border-indigo-100";
      case "warning":
        return "bg-amber-50 border-amber-100";
      case "error":
        return "bg-red-50 border-red-100";
      case "promo":
        return "bg-indigo-50 border-indigo-100";
      default:
        return "bg-slate-50 border-slate-100";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 sm:pb-0 sm:border-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Bell className="text-indigo-600 shrink-0" />
            Notificaciones
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
            Acá encontrarás todas las notificaciones que has recibido, los administradores pueden enviarte mensajes para avisos o información relevante.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="bg-white hover:bg-slate-50 text-slate-600 border-slate-200 rounded-full font-semibold px-4 sm:px-5 w-full sm:w-auto justify-center text-xs sm:text-sm"
            >
              <CheckCheck size={16} className="mr-2 shrink-0" />
              Marcar todo como leído
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 sm:py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs text-slate-300">
              <Bell size={28} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 sm:mb-2">
              No tienes notificaciones
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Te avisaremos cuando haya novedades importantes.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "relative p-4 sm:p-6 rounded-2xl border transition-all duration-300 group cursor-pointer",
                notification.read
                  ? "bg-white border-slate-100 opacity-80 hover:opacity-100"
                  : "bg-white border-slate-200 shadow-xs shadow-slate-200/40 ring-1 ring-indigo-500/10",
              )}
              onClick={() => {
                markAsRead(notification.id);
                if (notification.link) router.push(notification.link);
              }}
            >
              {!notification.read && (
                <span className="absolute top-4 right-4 sm:top-6 sm:right-6 w-2 h-2 bg-indigo-500 rounded-full shadow-indigo-200 shadow-xs animate-pulse" />
              )}

              <div className="flex gap-3 sm:gap-4 items-start">
                <div
                  className={cn(
                    "p-2.5 sm:p-3 rounded-xl h-fit shrink-0",
                    getBgColor(notification.type),
                  )}
                >
                  {getIcon(notification.type)}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex justify-between items-start pr-6 sm:pr-8">
                    <h3
                      className={cn(
                        "font-semibold text-sm sm:text-lg tracking-tight leading-snug",
                        notification.read ? "text-slate-700" : "text-slate-900",
                      )}
                    >
                      {notification.title}
                    </h3>
                  </div>

                  <p
                    className={cn(
                      "text-xs sm:text-sm leading-relaxed font-medium",
                      notification.read ? "text-slate-400" : "text-slate-500",
                    )}
                  >
                    {notification.message}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <span className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 font-medium bg-slate-50 px-2 py-1 rounded-md">
                      <Calendar size={12} className="shrink-0" />
                      {new Date(notification.date).toLocaleString("es-CL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
                      title="Eliminar notificación"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
