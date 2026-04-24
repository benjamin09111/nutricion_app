"use client";

import { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  ChevronDown,
  Settings,
  Bell,
  Sparkles,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
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
import { useDashboardShell } from "@/context/DashboardShellContext";
import { useTheme } from "@/context/ThemeContext";

function SubscriptionSwitcher() {
  const { plan, forceUpdatePlan } = useSubscription();
  const { isDarkMode } = useTheme();
  const plans: SubscriptionPlan[] = ["free", "trial", "pro"];

  return (
    <div
      className={cn(
        "ml-2 flex items-center gap-1 rounded-full border p-0.5",
        isDarkMode
          ? "border-emerald-400/14 bg-emerald-950/40"
          : "border-slate-200 bg-slate-100",
      )}
    >
      {plans.map((p) => (
        <button
          key={p}
          onClick={() => forceUpdatePlan(p)}
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase transition-all",
            plan === p
              ? isDarkMode
                ? "border border-emerald-300/20 bg-emerald-500/15 text-emerald-50 shadow-sm"
                : "border border-emerald-100 bg-white text-emerald-700 shadow-sm"
              : isDarkMode
                ? "text-emerald-100/65 hover:bg-emerald-500/10 hover:text-emerald-50"
                : "text-slate-400 hover:bg-slate-200/50 hover:text-slate-600",
          )}
          title={`Simular Plan: ${p.toUpperCase()}`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("usuario@demo.com");
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { isAdmin, isAdminView } = useAdmin();
  const { planName } = useSubscription();
  const { unreadCount, notifications, markAsRead, markAllAsRead } =
    useNotifications();
  const { isDarkMode, toggleTheme } = useTheme();
  const {
    isSidebarCollapsed,
    isSidebarToggleHighlighted,
    toggleSidebarCollapsed,
  } = useDashboardShell();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.email) {
          setUserEmail(user.email);
        }
      } catch (error) {
        console.error("Error parsing user data", error);
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.signOut();
    router.replace("/login");
  };

  return (
    <div
      className={cn(
        "dashboard-nav-bg sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b px-4 backdrop-blur-xl sm:gap-x-6 sm:px-6 lg:px-8 transition-colors",
        isAdminView && !isDarkMode && "bg-indigo-50/50 border-indigo-100",
        isAdminView && isDarkMode && "border-indigo-400/20",
      )}
    >
      {/* Mobile Menu Toggle (Preserved) */}
      <button
        type="button"
        className={cn(
          "-m-2.5 cursor-pointer rounded-lg p-2.5 transition-colors lg:hidden",
          isDarkMode
            ? "text-emerald-50 hover:bg-emerald-500/10"
            : "text-slate-700 hover:bg-slate-50",
        )}
        onClick={onMenuClick}
      >
        <span className="sr-only">Abrir menú</span>
        <Menu
          className={cn("h-6 w-6", isDarkMode ? "text-emerald-100" : "text-slate-600")}
          aria-hidden="true"
        />
      </button>

      <div className="flex flex-1 items-center gap-x-4 lg:gap-x-6">
        <div className="flex flex-1 items-center justify-start gap-6 lg:gap-8">

          {!isAdmin && (
            <div
              className={cn(
                "hidden items-center gap-3 rounded-full border px-3 py-1.5 shadow-xs transition-colors md:flex",
                isDarkMode
                  ? "border-emerald-400/12 bg-linear-to-r from-emerald-500/8 to-slate-950/10"
                  : "border-slate-100 bg-linear-to-r from-slate-50 to-white",
              )}
            >
              <div className="flex items-center gap-1.5 line-clamp-1">
                <span
                  className={cn(
                    "whitespace-nowrap text-[10px] font-black uppercase tracking-widest",
                    isDarkMode ? "text-emerald-100/70" : "text-slate-400",
                  )}
                >
                  Plan Activo:
                </span>
                <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  {planName.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {isAdmin && <SubscriptionSwitcher />}

        </div>

        <div className="flex flex-1 justify-end gap-x-6 self-stretch lg:gap-x-12">
          <div className="flex items-center gap-x-6 lg:gap-x-8">
          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all",
              isDarkMode
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-50 hover:bg-emerald-500/18"
                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700",
            )}
            title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="hidden sm:inline">{isDarkMode ? "Light" : "Dark"}</span>
          </button>

          <Link
            href="/dashboard/actualizaciones"
            className={cn(
              "group hidden items-center gap-2 rounded-xl border px-3 py-1.5 transition-all sm:flex",
              isDarkMode
                ? "border-emerald-400/16 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/30 hover:bg-emerald-500/16"
                : "border-emerald-100 bg-emerald-50 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-100",
            )}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-500 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              ¡Futuras actualizaciones!
            </span>
          </Link>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={cn(
                "relative rounded-full p-2 transition-all outline-none",
                isDarkMode
                  ? "text-emerald-100/70 hover:bg-emerald-500/10 hover:text-emerald-50"
                  : "text-slate-400 hover:bg-slate-50 hover:text-emerald-600",
              )}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div
                className={cn(
                  "absolute right-0 z-20 mt-2.5 w-80 origin-top-right overflow-hidden rounded-xl border shadow-xl ring-1 animate-in fade-in zoom-in-95 duration-100 focus:outline-none sm:w-96",
                  isDarkMode
                    ? "border-emerald-400/14 bg-slate-950/96 ring-black/20"
                    : "border-slate-100 bg-white ring-slate-900/5",
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-between border-b px-4 py-3",
                    isDarkMode
                      ? "border-emerald-400/12 bg-emerald-500/8"
                      : "border-slate-100 bg-slate-50/50",
                  )}
                >
                  <h3
                    className={cn(
                      "text-sm font-semibold",
                      isDarkMode ? "text-emerald-50" : "text-slate-900",
                    )}
                  >
                    Notificaciones
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                    >
                      Marcar todo como leído
                    </button>
                  )}
                </div>

                <div className="max-h-[70vh] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p
                        className={cn(
                          "text-sm",
                          isDarkMode ? "text-emerald-100/70" : "text-slate-500",
                        )}
                      >
                        No tienes notificaciones recientes
                      </p>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "divide-y",
                        isDarkMode ? "divide-emerald-400/10" : "divide-slate-100",
                      )}
                    >
                      {notifications.slice(0, 3).map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "group relative flex cursor-pointer gap-3 px-4 py-3 transition-colors",
                            isDarkMode ? "hover:bg-emerald-500/7" : "hover:bg-slate-50",
                            !notification.read &&
                              (isDarkMode ? "bg-emerald-500/8" : "bg-emerald-50/30"),
                          )}
                          onClick={() =>
                            !notification.read && markAsRead(notification.id)
                          }
                        >
                          <div
                            className={cn(
                              "mt-2 h-2 w-2 shrink-0 rounded-full",
                              !notification.read
                                ? "bg-emerald-500"
                                : isDarkMode
                                  ? "bg-emerald-100/25"
                                  : "bg-slate-200",
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "truncate pr-6 text-sm font-medium",
                                !notification.read
                                  ? isDarkMode
                                    ? "text-emerald-50"
                                    : "text-slate-900"
                                  : isDarkMode
                                    ? "text-emerald-100/75"
                                    : "text-slate-600",
                              )}
                            >
                              {notification.title}
                            </p>
                            <p
                              className={cn(
                                "mt-0.5 line-clamp-2 text-xs",
                                isDarkMode ? "text-emerald-100/65" : "text-slate-500",
                              )}
                            >
                              {notification.message}
                            </p>
                            <p
                              className={cn(
                                "mt-1.5 text-[10px]",
                                isDarkMode ? "text-emerald-100/45" : "text-slate-400",
                              )}
                            >
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

                <div
                  className={cn(
                    "border-t p-2",
                    isDarkMode
                      ? "border-emerald-400/12 bg-emerald-500/6"
                      : "border-slate-100 bg-slate-50/50",
                  )}
                >
                  <Link
                    href="/dashboard/ajustes/notificaciones"
                    className={cn(
                      "flex w-full items-center justify-center rounded-lg border px-4 py-2 text-xs font-medium shadow-sm transition-colors",
                      isDarkMode
                        ? "border-emerald-400/14 bg-slate-900 text-emerald-100/80 hover:bg-slate-800 hover:text-emerald-50"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    )}
                    onClick={() => setIsNotificationsOpen(false)}
                  >
                    Ver todas las notificaciones
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              className={cn(
                "-m-1.5 flex items-center gap-3 rounded-xl p-2 transition-all outline-none",
                isDarkMode ? "hover:bg-emerald-500/10" : "hover:bg-slate-50",
              )}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <span className="sr-only">Abrir menú de usuario</span>
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-white shadow-sm transition-transform active:scale-95",
                  isAdminView ? "border-indigo-200 bg-indigo-600" : "border-emerald-300/20 bg-emerald-500",
                )}
              >
                {isAdminView ? "A" : <User className="h-4.5 w-4.5" />}
              </div>
              <span className="hidden lg:flex lg:items-center whitespace-nowrap">
                <span
                  className={cn(
                    "ml-1 text-sm font-bold leading-6",
                    isDarkMode ? "text-emerald-50" : "text-slate-900",
                  )}
                  aria-hidden="true"
                >
                  Perfil y Configuración
                </span>
                <ChevronDown
                  className={cn(
                    "ml-2 h-4 w-4 transition-transform duration-200",
                    isProfileOpen && "rotate-180",
                    isDarkMode ? "text-emerald-100/55" : "text-slate-400",
                  )}
                  aria-hidden="true"
                />
              </span>
            </button>

            {isProfileOpen && (
              <div
                className={cn(
                  "absolute right-0 z-10 mt-2.5 w-56 origin-top-right rounded-md border py-2 shadow-lg ring-1 animate-in fade-in zoom-in-95 duration-100 focus:outline-none",
                  isDarkMode
                    ? "border-emerald-400/14 bg-slate-950/96 ring-black/20"
                    : "border-slate-100 bg-white ring-slate-900/5",
                )}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
                tabIndex={-1}
              >
                <div
                  className={cn(
                    "mb-1 border-b px-4 py-2",
                    isDarkMode ? "border-emerald-400/10" : "border-slate-100",
                  )}
                >
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      isDarkMode ? "text-emerald-50" : "text-slate-900",
                    )}
                  >
                    {userEmail}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-xs font-bold uppercase",
                      isAdminView ? "text-indigo-600" : "text-emerald-600",
                    )}
                  >
                    {isAdminView ? "Admin" : planName}
                  </p>
                </div>

                <Link
                  href="/dashboard/configuraciones"
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2 text-left text-sm leading-6 transition-colors",
                    isDarkMode
                      ? "text-emerald-100/85 hover:bg-emerald-500/8"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Settings
                    className={cn(
                      "h-4 w-4",
                      isDarkMode ? "text-emerald-100/55" : "text-slate-400",
                    )}
                  />
                  Configuraciones
                </Link>

                <button
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2 text-left text-sm leading-6 transition-colors",
                    isDarkMode
                      ? "text-rose-300 hover:bg-rose-500/8"
                      : "text-red-600 hover:bg-slate-50",
                  )}
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
    </div>
  );
}
