"use client";

import { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  ChevronDown,
  Settings,
  Glasses,
  ScanEye,
  CreditCard,
  Check,
  Crown,
  Bell,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";
import { cn } from "@/lib/utils";
import {
  useSubscription,
  SubscriptionPlan,
} from "@/context/SubscriptionContext";
import { authService } from "@/features/auth/services/auth.service";
import { useNotifications } from "@/context/NotificationsContext";

function SubscriptionSwitcher() {
  const { plan, forceUpdatePlan } = useSubscription();
  // Plans to show in the quick switcher
  const plans: SubscriptionPlan[] = ["free", "trial", "pro"];

  return (
    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-full border border-slate-200 ml-2">
      {plans.map((p) => (
        <button
          key={p}
          onClick={() => forceUpdatePlan(p)}
          className={cn(
            "px-2 py-0.5 text-[10px] font-bold uppercase rounded-full transition-all",
            plan === p
              ? "bg-white text-emerald-700 shadow-sm border border-emerald-100"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50",
          )}
          title={`Simular Plan: ${p.toUpperCase()}`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

export function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAdmin, isAdminView, toggleViewMode } = useAdmin();
  const { plan, trialEndsAt } = useSubscription();
  const { unreadCount, notifications, markAsRead, markAllAsRead } =
    useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const daysLeft = trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (trialEndsAt.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  const [userEmail, setUserEmail] = useState<string>("usuario@demo.com");

  // Close dropdown when clicking outside
  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.email) {
          setUserEmail(user.email);
        }
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    authService.signOut();
    router.replace("/login");
  };

  return (
    <div
      className={cn(
        "sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 transition-colors",
        isAdminView
          ? "bg-indigo-50/50 border-indigo-100"
          : "bg-white border-slate-200",
      )}
    >
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-full transition-all outline-none"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 z-20 mt-2.5 w-80 sm:w-96 origin-top-right rounded-xl bg-white shadow-xl ring-1 ring-slate-900/5 focus:outline-none animate-in fade-in zoom-in-95 duration-100 border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Notificaciones
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Marcar todo como leído
                    </button>
                  )}
                </div>

                <div className="max-h-[70vh] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-slate-500">
                        No tienes notificaciones recientes
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.slice(0, 3).map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 group relative cursor-pointer",
                            !notification.read && "bg-emerald-50/30",
                          )}
                          onClick={() =>
                            !notification.read && markAsRead(notification.id)
                          }
                        >
                          <div
                            className={cn(
                              "h-2 w-2 mt-2 rounded-full shrink-0",
                              !notification.read
                                ? "bg-emerald-500"
                                : "bg-slate-200",
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm font-medium truncate pr-6",
                                !notification.read
                                  ? "text-slate-900"
                                  : "text-slate-600",
                              )}
                            >
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5">
                              {new Intl.DateTimeFormat("es-CL", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(notification.date))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                  <Link
                    href="/dashboard/ajustes/notificaciones"
                    className="flex items-center justify-center w-full px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                    onClick={() => setIsNotificationsOpen(false)}
                  >
                    Ver todas las notificaciones
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Subscription Status Indicator - Only for Nutris, not Admins */}
          {!isAdmin && (
            <div className="hidden md:flex items-center gap-3 bg-linear-to-r from-emerald-50 to-white px-3 py-1.5 rounded-full border border-emerald-100/50 shadow-xs mr-2 group hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                  Prueba gratuita
                </span>
              </div>
            </div>
          )}

          {/* View Switcher for Admins */}
          {isAdmin && (
            <div className="hidden sm:flex items-center gap-4 border-r border-slate-200 pr-4 sm:pr-6">
              <button
                onClick={toggleViewMode}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  isAdminView
                    ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 ring-1 ring-indigo-500/20"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 ring-1 ring-emerald-500/20",
                )}
                title={
                  isAdminView
                    ? "Cambiar a Vista Nutricionista"
                    : "Cambiar a Vista Admin"
                }
              >
                {isAdminView ? (
                  <>
                    <Glasses className="h-4 w-4" />
                    <span className="hidden md:inline">Vista Admin</span>
                  </>
                ) : (
                  <>
                    <ScanEye className="h-4 w-4" />
                    <span className="hidden md:inline">
                      Vista Nutricionista
                    </span>
                  </>
                )}
              </button>

              {/* DEV: Plan Switcher */}
              {!isAdminView && <SubscriptionSwitcher />}
            </div>
          )}

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="-m-1.5 flex items-center p-1.5 hover:bg-slate-50 rounded-md transition-colors outline-none"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <span className="sr-only">Abrir menú de usuario</span>
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-white border border-slate-200",
                  isAdminView ? "bg-indigo-600" : "bg-emerald-500", // Change avatar bg based on view
                )}
              >
                {isAdminView ? "A" : <User className="h-4 w-4" />}
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span
                  className="ml-2 text-sm font-semibold leading-6 text-slate-900"
                  aria-hidden="true"
                >
                  Perfil y Configuración
                </span>
                <ChevronDown
                  className="ml-2 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
              </span>
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div
                className="absolute right-0 z-10 mt-2.5 w-56 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-slate-900/5 focus:outline-none animate-in fade-in zoom-in-95 duration-100 border border-slate-100"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
                tabIndex={-1}
              >
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {userEmail}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-0.5 font-bold uppercase",
                      isAdminView ? "text-indigo-600" : "text-emerald-600",
                    )}
                  >
                    {isAdminView
                      ? (() => {
                          const user = JSON.parse(
                            localStorage.getItem("user") || "{}",
                          );
                          if (user.role === "ADMIN_MASTER")
                            return "Admin Master";
                          return "Admin General";
                        })()
                      : "Prueba gratuita"}
                  </p>
                </div>

                {/* Mobile View Switcher (inside dropdown for mobile) */}
                {isAdmin && (
                  <div className="sm:hidden px-2 py-1">
                    <button
                      onClick={() => {
                        toggleViewMode();
                        setIsProfileOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-2 py-1.5 text-xs rounded-md flex items-center gap-2",
                        isAdminView
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-emerald-50 text-emerald-700",
                      )}
                    >
                      <Glasses className="h-3 w-3" />
                      Cambiar a {isAdminView ? "Vista Nutri" : "Vista Admin"}
                    </button>
                  </div>
                )}

                <Link
                  href="/dashboard/configuraciones"
                  className="w-full text-left px-4 py-2 text-sm leading-6 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Configuraciones
                </Link>

                <button
                  className="w-full text-left px-4 py-2 text-sm leading-6 text-red-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
