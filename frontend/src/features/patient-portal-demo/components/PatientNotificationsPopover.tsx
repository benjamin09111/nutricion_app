"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Sparkles, Droplets, Flame, FileText, X, ArrowLeft, CheckCircle2 } from "lucide-react";
import { PatientNotification } from "../types";
import { cn } from "@/lib/utils";

interface PatientNotificationsPopoverProps {
  notifications: PatientNotification[];
  onMarkAllAsRead: () => void;
}

export function PatientNotificationsPopover({
  notifications,
  onMarkAllAsRead,
}: PatientNotificationsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Prevent background scrolling when open in full-screen on mobile
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Only close if screen is desktop (on mobile, back/X button is used)
        if (window.innerWidth >= 640) {
          setIsOpen(false);
        }
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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
    <div className="relative" ref={dropdownRef}>
      {/* Botón Campana */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
        aria-label="Notificaciones importantes"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] sm:text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 
        Modal de Notificaciones:
        - En móviles (< sm): Pantalla completa nativa (fixed inset-0), ultra cómoda y legible.
        - En desktop (sm+): Popover elegante desplegable (absolute right-0 w-96).
      */}
      {isOpen && (
        <>
          {/* Backdrop solo para desktop */}
          <div
            className="hidden sm:block fixed inset-0 z-[190]"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={cn(
              "z-[200] bg-white flex flex-col animate-in duration-200",
              // Móvil: Pantalla completa fija
              "fixed inset-0 sm:inset-auto sm:absolute sm:right-0 sm:mt-2 sm:w-96 sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-2xl sm:max-h-[32rem]",
              "slide-in-from-bottom sm:slide-in-from-top-2"
            )}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden p-1.5 -ml-1 rounded-xl text-slate-600 hover:bg-slate-200/50 cursor-pointer"
                  aria-label="Volver"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-xs font-black text-[#20212B]">Notificaciones</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                      {unreadCount} nuevas
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="text-xs sm:text-[11px] font-bold text-[#668E20] hover:text-[#527518] px-2 py-1 rounded-lg hover:bg-[#F0F5DF] transition-colors cursor-pointer"
                  >
                    Marcar leídas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="hidden sm:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Cerrar notificaciones"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lista de Notificaciones */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-0 no-scrollbar pb-safe">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <Bell className="w-8 h-8 text-slate-200 mx-auto" />
                  <p>No tienes notificaciones pendientes.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "p-4 sm:p-3.5 flex items-start gap-3.5 transition-colors rounded-2xl sm:rounded-none my-1 sm:my-0",
                      !notif.isRead ? "bg-[#F0F5DF]/40" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shrink-0 shadow-2xs">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-xs font-bold text-[#20212B]">{notif.title}</p>
                      <p className="text-xs sm:text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1.5 block font-medium">
                        {notif.timeAgo}
                      </span>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#86A83C] shrink-0 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
