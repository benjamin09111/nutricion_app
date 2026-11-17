"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Apple,
  ChefHat,
  CalendarDays,
  FileText,
  NotebookText,
  MessageCircle,
  Calculator,
  ClipboardCheck,
  Utensils,
  BookOpen,
  MessageSquare,
  Lock,
  Folder,
  FolderPlus,
  Bot,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Dumbbell,
  Pill,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Megaphone,
  Sparkles,
  Star,
  FlaskConical,
  User,
  NotebookPen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDashboardShell } from "@/context/DashboardShellContext";
import { useTheme } from "@/context/ThemeContext";
import { useAdmin } from "@/context/AdminContext";
import { useNotifications } from "@/context/NotificationsContext";
import { isGuestMode } from "@/lib/demo-local-api";
import { getCurrentUser } from "@/lib/current-user";
import { useState, useEffect } from "react";

interface SidebarItem {
  name: string;
  href?: string;
  icon?: React.ElementType;
  tutorialPath?: string;
  disabled?: boolean;
  locked?: boolean;
  hidden?: boolean;
  isSubHeader?: boolean;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const groups: SidebarGroup[] = [
  {
    title: "Administración",
    items: [
      { name: "Pacientes", href: "/dashboard/pacientes", icon: Users, tutorialPath: "/dashboard/pacientes" },
      { name: "Consultas", href: "/dashboard/consultas", icon: CalendarDays, tutorialPath: "/dashboard/consultas" },
      { name: "Citas", href: "/dashboard/citas", icon: CalendarDays, locked: true },
    ],
  },
  {
    title: "Dietética",
    items: [
      { name: "Rápido", href: "/dashboard/rapido", icon: NotebookText },
      { name: "Personalizado", href: "/dashboard/dieta", icon: Apple, tutorialPath: "/dashboard/dieta" },
      { name: "Recetas", href: "/dashboard/rapido/recetas", icon: ChefHat },
      { name: "Dietas", href: "/dashboard/dietas", icon: Utensils, tutorialPath: "/dashboard/dietas" },
    ],
  },
  {
    title: "Nutrición",
    items: [
      { name: "Tabla de composición", href: "/dashboard/alimentos", icon: Apple, tutorialPath: "/dashboard/alimentos" },
      { name: "Grupos", href: "/dashboard/alimentos/grupos", icon: FolderPlus, locked: true },
      { name: "Intercambios", href: "/dashboard/herramientas/porciones-intercambio", icon: Calculator, tutorialPath: "/dashboard/herramientas/porciones-intercambio" },
      { name: "Calculadora", href: "/dashboard/herramientas/calculos", icon: Calculator, tutorialPath: "/dashboard/herramientas/calculos" },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { name: "Creaciones", href: "/dashboard/creaciones", icon: Folder, tutorialPath: "/dashboard/creaciones" },
      { name: "Recursos", href: "/dashboard/recursos", icon: FileText, tutorialPath: "/dashboard/recursos" },
      { name: "Exámenes", href: "/dashboard/herramientas/examenes", icon: FlaskConical, locked: true },
      { name: "Tests", href: "/dashboard/herramientas/tests", icon: ClipboardCheck, tutorialPath: "/dashboard/herramientas/tests", locked: true },
    ],
  },

];

interface SidebarProps {
  onItemClick?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ onItemClick, isMobile = false }: SidebarProps = {}) {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebarCollapsed, isSidebarToggleHighlighted } = useDashboardShell();
  const { isDarkMode } = useTheme();
  const { isAdmin, toggleViewMode } = useAdmin();
  const { unreadCount } = useNotifications();
  const [isGuest, setIsGuest] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("usuario@demo.com");
  const shouldCollapse = !isMobile && isSidebarCollapsed && !onItemClick;

  useEffect(() => {
    setIsGuest(isGuestMode());
    const stored = getCurrentUser();
    if (stored?.email) setUserEmail(stored.email);
  }, []);

  const SIDEBAR_GROUPS_STORAGE_KEY = "nutri_dashboard_sidebar_open_groups";

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Administración": true,
    "Dietética": true,
    "Nutrición": true,
    "Herramientas": true,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_GROUPS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        if (typeof parsed === "object" && parsed !== null) {
          setOpenGroups((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      // Ignorar error al leer de localStorage
    }
  }, []);

  const toggleGroup = (title: string) => {
    if (isSidebarCollapsed) return;
    setOpenGroups((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      if (typeof window !== "undefined") {
        localStorage.setItem(SIDEBAR_GROUPS_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const getGroupPriority = (group: SidebarGroup) => {
    if (group.title === "Administración") return 0;
    if (group.title === "Dietética") return 1;
    if (group.title === "Nutrición") return 2;
    if (group.title === "Herramientas") return 3;
    return 10;
  };

  const orderedGroups = [...groups].sort((a, b) => getGroupPriority(a) - getGroupPriority(b));
  const visibleGroups = orderedGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.hidden),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div
      className={cn(
        "sidebar-scroll dashboard-sidebar-bg flex h-full min-h-0 grow flex-col gap-y-4 overflow-x-hidden border-r pb-4 transition-all duration-300",
        !isMobile && "overflow-y-auto",
        shouldCollapse ? "px-2" : "px-3",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center justify-between sticky top-0 z-10 dashboard-sidebar-bg",
          shouldCollapse ? "flex-col gap-1 pt-2 pb-1 h-20 -mx-2 px-2" : "-mx-4 px-4 pl-5 pr-12 lg:pr-4",
        )}
      >
        <Link
          href="/dashboard"
          onClick={onItemClick}
          className="flex min-w-0 items-center rounded-xl transition-colors hover:opacity-90 cursor-pointer"
          aria-label="Ir al dashboard"
          title="Ir al dashboard"
        >
          <Image
            src="/logo_2.webp"
            alt="NutriNet"
            width={shouldCollapse ? 72 : 180}
            height={shouldCollapse ? 23 : 57}
            className={cn("h-auto w-auto object-contain cursor-pointer", shouldCollapse ? "max-w-[72px]" : "max-w-[180px]")}
            style={{ height: "auto" }}
            priority
          />
        </Link>

        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          className={cn(
            "hidden lg:inline-flex items-center justify-center rounded-xl p-2 transition-all transition-colors",
            isDarkMode
              ? "text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10"
              : "text-slate-400 hover:text-[#668E20] hover:bg-[#F0F5DF]/60",
            isSidebarToggleHighlighted && "animate-pulse ring-2 ring-[#86A83C]/30",
          )}
          title={isSidebarCollapsed ? "Mostrar menú" : "Contraer menú"}
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      {isAdmin && !shouldCollapse && (
        <button
          type="button"
          onClick={() => toggleViewMode()}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-2 text-xs transition-colors cursor-pointer"
          title="Cambiar al panel de administración"
        >
          <span>Ir a Vista Administrador</span>
          <span>⚙️</span>
        </button>
      )}

      {/* Mobile Top Actions: Iniciar sesión / Perfil, Mis notas, Notificaciones (Minimalista) */}
      {isMobile && (
        <div className="space-y-2 pb-3 mb-2 border-b border-[#F0ECEE] px-1">
          {/* Iniciar sesión o Perfil */}
          {isGuest ? (
            <Link
              href="/login"
              onClick={onItemClick}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#86A83C] hover:bg-[#78A82F] text-white text-xs font-semibold shadow-2xs cursor-pointer w-full transition-all active:scale-98"
            >
              <User className="w-4 h-4 text-white shrink-0" />
              <span>Iniciar sesión</span>
            </Link>
          ) : (
            <Link
              href="/dashboard/configuraciones"
              onClick={onItemClick}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[#E9E5E7] bg-slate-50 text-[#20212B] text-xs font-semibold cursor-pointer w-full transition-all hover:bg-slate-100"
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                <User className="w-4 h-4 text-[#86A83C] shrink-0" />
                <span className="truncate">{userEmail || "Mi Perfil y Configuración"}</span>
              </div>
              <Settings className="w-4 h-4 text-[#848792] shrink-0" />
            </Link>
          )}

          {/* Fila: Mis Notas + Notificaciones (Estilo minimalista blanco con borde #E9E5E7) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onItemClick?.();
                window.dispatchEvent(new CustomEvent("toggle-notes-agenda"));
              }}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#E9E5E7] bg-white text-[#20212B] text-xs font-medium cursor-pointer transition-all hover:bg-slate-50 hover:border-[#86A83C] shadow-2xs active:scale-98"
            >
              <NotebookPen className="w-4 h-4 text-[#86A83C] shrink-0" />
              <span>Mis notas</span>
            </button>

            <Link
              href="/dashboard/ajustes/notificaciones"
              onClick={onItemClick}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#E9E5E7] bg-white text-[#20212B] text-xs font-medium cursor-pointer transition-all hover:bg-slate-50 hover:border-[#86A83C] shadow-2xs active:scale-98"
            >
              <Bell className="w-4 h-4 text-[#848792] shrink-0" />
              <span>Notificaciones</span>
              {unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}

      <nav className="flex flex-1 flex-col mt-2">
        <ul role="list" className="flex flex-1 flex-col gap-y-2">
          {visibleGroups.map((group) => {
            const isOpen = openGroups[group.title] === true;
            const showItems = onItemClick ? true : isOpen;

            return (
              <li key={group.title}>
                {!shouldCollapse && (
                  onItemClick ? (
                    <div
                      className={cn(
                        "mb-1.5 pl-2 text-xs font-bold uppercase tracking-wider",
                        isDarkMode ? "text-indigo-200/70" : "text-slate-500",
                      )}
                    >
                      {group.title}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title)}
                      className={cn(
                        "flex w-full items-center justify-between mb-1.5 pl-2 text-xs font-bold uppercase tracking-wider transition-colors",
                        isDarkMode ? "text-indigo-200/70 hover:text-indigo-100" : "text-slate-500 hover:text-slate-800",
                      )}
                    >
                      <span>{group.title}</span>
                      <div className="flex items-center pr-1">
                        {isOpen ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </div>
                    </button>
                  )
                )}
                {showItems && (
                   <ul role="list" className={cn("-mx-2 space-y-0.5", !shouldCollapse && "mt-1")}>
                    {group.items.map((item) => {
                      if (item.isSubHeader) {
                        if (shouldCollapse) return null;
                        return (
                          <li key={item.name} className="mt-4 mb-1 px-3">
                            <div className={cn(
                              "px-3 text-[11px] font-bold uppercase tracking-widest",
                              isDarkMode ? "text-indigo-300/60" : "text-slate-500"
                            )}>
                              {item.name}
                            </div>
                          </li>
                        );
                      }

                      const isActive = pathname === item.href;
                      const isLocked = item.locked;

                      return (
                        <li key={item.name}>
                          <Link
                            href={isLocked ? "#" : (item.href || "#")}
                            onClick={(event) => {
                              if (isLocked) {
                                event.preventDefault();
                                const desc = item.name === "Marketing"
                                  ? "Próximamente: conecta con potenciales pacientes que buscan un nutricionista. Perfil público, directorio especializado y canal de captación."
                                  : `El módulo "${item.name}" estará disponible en futuras actualizaciones.`;
                                toast.info("Próximamente", {
                                  description: desc,
                                });
                              } else {
                                onItemClick?.();
                              }
                            }}
                            className={cn(
                              isActive
                                ? isDarkMode
                                  ? "bg-emerald-500/15 text-emerald-300 font-bold"
                                  : "bg-[#F0F5DF] text-[#668E20] font-bold"
                                : isDarkMode
                                  ? "text-slate-300 hover:bg-slate-800 hover:text-white font-medium"
                                  : "text-slate-700 hover:text-[#668E20] hover:bg-[#F0F5DF]/60 font-medium",
                              isLocked && "cursor-not-allowed opacity-60",
                              "group flex min-w-0 cursor-pointer items-center gap-x-3 rounded-xl px-3 py-2.5 min-h-[40px] leading-5 transition-all text-sm",
                              shouldCollapse && "justify-center",
                            )}
                            title={item.name}
                          >
                            <span className="relative inline-flex">
                              {item.icon && (
                                <item.icon
                                  className={cn(
                                    isActive
                                      ? isDarkMode
                                        ? "text-emerald-300"
                                        : "text-[#668E20]"
                                      : isDarkMode
                                        ? "text-slate-400 group-hover:text-emerald-300"
                                        : "text-slate-500 group-hover:text-[#668E20]",
                                    "h-4.5 w-4.5 shrink-0 transition-colors",
                                  )}
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                            {!shouldCollapse && <span className="min-w-0 flex-1 truncate">{item.name}</span>}
                            {isLocked && <Lock className={cn("h-3.5 w-3.5 shrink-0 ml-auto", isDarkMode ? "text-slate-400" : "text-slate-400")} />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Circular Initial Badge */}
      <div className={cn("pt-2 pb-1 border-t border-slate-100 flex items-center", shouldCollapse ? "justify-center" : "justify-start px-2")}>
        <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
          N
        </div>
      </div>
    </div>
  );
}
