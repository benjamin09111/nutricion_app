"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  User,
  LogOut,
  ChevronDown,
  Settings,
  Bell,
  Menu,
  Crown,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";
import { cn } from "@/lib/utils";
import {
  useSubscription,
} from "@/context/SubscriptionContext";
import { authService } from "@/features/auth/services/auth.service";
import { useNotifications } from "@/context/NotificationsContext";
import { useTheme } from "@/context/ThemeContext";
import { useFont } from "@/context/FontContext";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";
import { api } from "@/lib/api";
// import { FollowUpNotificationsMenu } from "@/components/layout/FollowUpNotificationsMenu";
import { getCurrentUser } from "@/lib/current-user";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [userEmail] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "usuario@demo.com";
    }

    const storedUser = getCurrentUser();
    if (!storedUser) {
      return "usuario@demo.com";
    }

    return typeof storedUser?.email === "string" ? storedUser.email : "usuario@demo.com";
  });
  const [userAvatarUrl] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedUser = getCurrentUser();
    if (!storedUser) {
      return null;
    }

    return storedUser?.googleAvatarUrl || null;
  });
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const { isAdminView } = useAdmin();
  const { planName, currentPlan, hasPendingTransfer } = useSubscription();
  const { unreadCount, notifications, markAsRead, markAllAsRead } =
    useNotifications();
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontPreference, setFontPreference } = useFont();

  const [isSecureSubModalOpen, setIsSecureSubModalOpen] = useState(false);
  const [isSecuringSub, setIsSecuringSub] = useState(false);

  const handleSecureSubscription = async () => {
    setIsSecuringSub(true);
    try {
      await api.post("/support/secure-subscription");
      toast.success(
        "¡Excelente! Hemos registrado tu interés. Nos pondremos en contacto contigo pronto.",
      );
      setIsSecureSubModalOpen(false);
    } catch (error) {
      console.error("Error securing subscription:", error);
      toast.error(
        "Hubo un error al procesar tu solicitud. Por favor intenta más tarde.",
      );
    } finally {
      setIsSecuringSub(false);
    }
  };

  useEffect(() => {
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
          className={cn(
            "h-6 w-6",
            isDarkMode ? "text-emerald-100" : "text-slate-600",
          )}
          aria-hidden="true"
        />
      </button>

        <div className="flex flex-1 items-center gap-x-4 lg:gap-x-6">
          <div className="flex flex-1 items-center justify-end gap-x-3 sm:gap-x-4 lg:gap-x-8">
            {!isAdminView && (
              <Link
                href="/dashboard/actualizaciones"
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all",
                  isDarkMode
                    ? "border-indigo-400/20 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/15"
                    : "border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
                )}
              >
                <Sparkles className="h-4 w-4" />
                Futuras funciones
              </Link>
            )}

            {/* <FollowUpNotificationsMenu title="Seguimiento de pacientes" /> */}

            {!isAdminView && currentPlan?.key === "free" && (
              <button
                type="button"
                onClick={() =>
                  hasPendingTransfer
                    ? null
                    : router.push(
                        "/dashboard/configuraciones?tab=membership&openPlanModal=1",
                      )
                }
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all",
                  hasPendingTransfer
                    ? "border border-slate-200 bg-slate-50 text-slate-600 cursor-default"
                    : isDarkMode
                      ? "border border-amber-400/30 bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 hover:from-amber-500/30 hover:to-amber-600/30"
                      : "border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 hover:from-amber-100 hover:to-amber-200 shadow-sm",
                )}
              >
                <Crown className="h-4 w-4" />
                {hasPendingTransfer ? "Plan pendiente de aprobación" : "Ascender a Pro"}
              </button>
            )}

            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={cn(
                  "relative rounded-full p-2 transition-all outline-none",
                  isDarkMode
                    ? "text-emerald-100/70 hover:bg-emerald-500/10 hover:text-emerald-50"
                    : "text-slate-400 hover:bg-slate-50 hover:text-emerald-600",
                )}
                title="Notificaciones"
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
                        isDarkMode
                          ? "divide-emerald-400/10"
                          : "divide-slate-100",
                      )}
                    >
                      {notifications.slice(0, 3).map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "group relative flex cursor-pointer gap-3 px-4 py-3 transition-colors",
                            isDarkMode
                              ? "hover:bg-emerald-500/7"
                              : "hover:bg-slate-50",
                            !notification.read &&
                              (isDarkMode
                                ? "bg-emerald-500/8"
                                : "bg-emerald-50/30"),
                          )}
                          onClick={() => {
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }

                            if (notification.link) {
                              setIsNotificationsOpen(false);
                              router.push(notification.link);
                            }
                          }}
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
                                isDarkMode
                                  ? "text-emerald-100/65"
                                  : "text-slate-500",
                              )}
                            >
                              {notification.message}
                            </p>
                            <p
                              className={cn(
                                "mt-1.5 text-[10px]",
                                isDarkMode
                                  ? "text-emerald-100/45"
                                  : "text-slate-400",
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
                  "flex h-9 w-9 items-center justify-center rounded-full border overflow-hidden shadow-sm transition-transform active:scale-95",
                  isAdminView
                    ? "border-indigo-200 bg-indigo-600"
                    : "border-emerald-300/20 bg-emerald-500",
                )}
              >
                {isAdminView ? (
                  <span className="text-white font-bold text-sm">A</span>
                ) : userAvatarUrl ? (
                  <Image
                    src={userAvatarUrl}
                    alt="Perfil"
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4.5 w-4.5 text-white" />
                )}
              </div>
              <span className="hidden lg:flex lg:items-center whitespace-nowrap">
                <span
                  className={cn(
                    "ml-1 text-sm font-brand font-bold leading-6",
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
                    {isAdminView ? "Admin" : `Plan ${planName}`}
                  </p>
                </div>

                <Link
                  href="/dashboard/configuraciones"
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm leading-6 transition-colors",
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

                <div
                  className={cn(
                    "border-t px-4 py-2",
                    isDarkMode ? "border-emerald-400/10" : "border-slate-100",
                  )}
                >
                  <p
                    className={cn(
                      "mb-2 text-[10px] font-semibold uppercase tracking-wider",
                      isDarkMode ? "text-emerald-100/50" : "text-slate-400",
                    )}
                  >
                    Legal
                  </p>
                  <div className="space-y-1">
                    <Link
                      href="/terms"
                      className={cn(
                        "flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        isDarkMode
                          ? "text-emerald-100/80 hover:bg-emerald-500/8"
                          : "text-slate-700 hover:bg-slate-50",
                      )}
                      role="menuitem"
                      tabIndex={-1}
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Términos de Servicio
                    </Link>
                    <Link
                      href="/privacy-policy"
                      className={cn(
                        "flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        isDarkMode
                          ? "text-emerald-100/80 hover:bg-emerald-500/8"
                          : "text-slate-700 hover:bg-slate-50",
                      )}
                      role="menuitem"
                      tabIndex={-1}
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Política de Privacidad
                    </Link>
                  </div>
                </div>

                <div
                  className={cn(
                    "border-t px-4 py-2",
                    isDarkMode ? "border-emerald-400/10" : "border-slate-100",
                  )}
                >
                  <p
                    className={cn(
                      "mb-2 text-[10px] font-semibold uppercase tracking-wider",
                      isDarkMode ? "text-emerald-100/50" : "text-slate-400",
                    )}
                  >
                    Tipografía
                  </p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setFontPreference("default")}
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        fontPreference === "default"
                          ? isDarkMode
                            ? "bg-emerald-500/10 text-emerald-50"
                            : "bg-emerald-50 text-emerald-700"
                          : isDarkMode
                            ? "text-emerald-100/80 hover:bg-emerald-500/8"
                            : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <span>Texto por defecto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontPreference("formal")}
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        fontPreference === "formal"
                          ? isDarkMode
                            ? "bg-emerald-500/10 text-emerald-50"
                            : "bg-emerald-50 text-emerald-700"
                          : isDarkMode
                            ? "text-emerald-100/80 hover:bg-emerald-500/8"
                            : "text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      <span>Texto tradicional</span>
                    </button>
                  </div>
                </div>

                <button
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm leading-6 transition-colors",
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

      <ConfirmationModal
        isOpen={isSecureSubModalOpen}
        onClose={() => !isSecuringSub && setIsSecureSubModalOpen(false)}
        onConfirm={handleSecureSubscription}
        title="Asegurar mi suscripción"
        description="¿Te gusta NutriNet? Al confirmar, registraremos tu interés para mantener tu cuenta activa después de la versión beta. Nos pondremos en contacto contigo manualmente vía email para coordinar los detalles."
        confirmText="Confirmar interés"
        cancelText="Volver"
        isLoading={isSecuringSub}
      />
    </div>
  );
}
