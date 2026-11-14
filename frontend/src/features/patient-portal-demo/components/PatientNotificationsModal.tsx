"use client";

import React, { useEffect } from "react";
import {
  Bell,
  Sparkles,
  Droplets,
  Flame,
  FileText,
  X,
  CheckCircle2,
} from "lucide-react";
import { PatientNotification } from "../types";
import { cn } from "@/lib/utils";

interface PatientNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PatientNotification[];
  onMarkAllAsRead: () => void;
}

export function PatientNotificationsModal({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
}: PatientNotificationsModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotifIcon = (type: PatientNotification["type"]) => {
    switch (type) {
      case "plan":
        return <FileText className="w-4 h-4 text-[#5A781E]" />;
      case "streak":
        return <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />;
      case "water":
        return <Droplets className="w-4 h-4 text-sky-500 fill-sky-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#86A83C]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog (Limpio, sin textos redundantes y con tipografía legible) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-modal-title"
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-6 overflow-hidden z-10 max-h-[90dvh] flex flex-col animate-sheet-up pb-safe"
      >
        {/* Drag handle sutil para móvil */}
        <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto -mt-1 mb-3 shrink-0 sm:hidden" />

        {/* Header Directo y Limpio */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F0F5DF] flex items-center justify-center text-[#5A781E]">
              <Bell className="w-5 h-5 stroke-[2]" />
            </div>
            <h2
              id="notif-modal-title"
              className="text-base sm:text-lg font-bold text-[#20212B]"
            >
              Notificaciones
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-xs font-semibold text-[#5A781E] hover:underline px-2 py-1 rounded-lg hover:bg-[#F0F5DF] active:scale-95 transition-all cursor-pointer"
              >
                Marcar leídas
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lista de Notificaciones con tipografía cómoda (título 14px, texto 13px, tiempo 12px) */}
        <div className="overflow-y-auto no-scrollbar py-3 space-y-2.5 flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-[#86A83C]" />
              <p className="text-sm font-medium">No tienes notificaciones pendientes</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "p-3.5 rounded-xl border transition-all flex items-start gap-3",
                  notif.isRead
                    ? "bg-white border-slate-100"
                    : "bg-[#F8FAF2] border-[#E2EBC8] shadow-2xs"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                    notif.isRead
                      ? "bg-slate-50 border-slate-200 text-slate-400"
                      : "bg-white border-[#D5E3B3] text-[#5A781E] shadow-2xs"
                  )}
                >
                  {getNotifIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#20212B] truncate">{notif.title}</p>
                    <span className="text-xs text-slate-400 font-normal shrink-0">{notif.timeAgo}</span>
                  </div>
                  <p className="text-[13px] font-normal text-[#626573] mt-0.5 leading-snug">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
