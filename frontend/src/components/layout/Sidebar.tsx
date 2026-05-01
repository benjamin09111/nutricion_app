"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Utensils,
  Apple,
  ChefHat,
  ShoppingCart,
  CalendarDays,
  FileText,
  NotebookText,
  MessageCircle,
  ClipboardCheck,
  MessageSquare,
  Lock,
  Folder,
  FolderPlus,
  Dumbbell,
  Bot,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDashboardShell } from "@/context/DashboardShellContext";
import { useTheme } from "@/context/ThemeContext";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
  tutorialPath?: string;
  disabled?: boolean;
  locked?: boolean;
  hidden?: boolean;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const groups: SidebarGroup[] = [
  {
    title: "PRINCIPAL",
    items: [
      { name: "Entregable Rápido", href: "/dashboard/rapido", icon: NotebookText },
      { name: "Recetas", href: "/dashboard/rapido/recetas", icon: ChefHat },
      { name: "Entregable Personalizado", href: "/dashboard/dieta", icon: Utensils, tutorialPath: "/dashboard/dieta" },
    ],
  },
  {
    title: "Administración",
    items: [
      { name: "Pacientes", href: "/dashboard/pacientes", icon: Users, tutorialPath: "/dashboard/pacientes" },
      { name: "Consultas", href: "/dashboard/consultas", icon: CalendarDays, tutorialPath: "/dashboard/consultas" },
    ],
  },
  {
    title: "Alimentos",
    items: [
      { name: "Ingredientes", href: "/dashboard/alimentos", icon: Apple, tutorialPath: "/dashboard/alimentos" },
      { name: "Platos", href: "/dashboard/platos", icon: ChefHat, tutorialPath: "/dashboard/platos", hidden: true },
      { name: "Grupos", href: "/dashboard/alimentos/grupos", icon: FolderPlus },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { name: "Creaciones", href: "/dashboard/creaciones", icon: Folder, tutorialPath: "/dashboard/creaciones" },
      { name: "Recursos", href: "/dashboard/recursos", icon: FileText, tutorialPath: "/dashboard/recursos" },
      { name: "Porciones de Intercambio", href: "/dashboard/herramientas/porciones-intercambio", icon: ClipboardCheck, tutorialPath: "/dashboard/herramientas/porciones-intercambio" },
      { name: "Configuración Clínica", href: "/dashboard/detalles", icon: Settings, tutorialPath: "/dashboard/detalles" },
    ],
  },
  {
    title: "Agentes & IA",
    items: [
      { name: "Chatbots", href: "/dashboard/chatbots", icon: MessageCircle, locked: true },
      { name: "Agentes", href: "/dashboard/agentes", icon: Bot, locked: true },
    ],
  },
  {
    title: "Ajustes",
    items: [
      { name: "Notificaciones", href: "/dashboard/ajustes/notificaciones", icon: Bell },
      { name: "Feedback & Soporte", href: "/dashboard/feedback", icon: MessageSquare },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebarCollapsed, isSidebarToggleHighlighted } = useDashboardShell();
  const { isDarkMode } = useTheme();
  const getGroupPriority = (group: SidebarGroup) => {
    const hrefs = group.items.map((item) => item.href);
    if (hrefs.some((href) => href.startsWith("/dashboard/pacientes") || href.startsWith("/dashboard/consultas"))) {
      return 0;
    }
    if (hrefs.some((href) => href.startsWith("/dashboard/alimentos"))) {
      return 1;
    }
    if (hrefs.some((href) => href.startsWith("/dashboard/rapido"))) {
      return 2;
    }
    if (
      hrefs.some(
        (href) =>
          href.startsWith("/dashboard/dieta") ||
          href.startsWith("/dashboard/recetas") ||
          href.startsWith("/dashboard/carrito") ||
          href.startsWith("/dashboard/entregable"),
      )
    ) {
      return 3;
    }
    return 10;
  };
  const orderedGroups = [...groups].sort(
    (a, b) => getGroupPriority(a) - getGroupPriority(b),
  );
  const visibleGroups = orderedGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.hidden),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div
      className={cn(
        "sidebar-scroll dashboard-sidebar-bg flex h-full grow flex-col gap-y-4 overflow-y-auto border-r pb-4 transition-all duration-300",
        isSidebarCollapsed ? "px-2" : "px-4",
      )}
      style={{ scrollbarWidth: "thin" }}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center justify-between",
          isSidebarCollapsed ? "flex-col gap-2 pt-4" : "pl-2",
        )}
      >
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 rounded-xl transition-colors hover:opacity-90"
          aria-label="Ir al dashboard"
          title="Ir al dashboard"
        >
          <div className="h-8 w-8 rounded bg-emerald-500 flex items-center justify-center shrink-0">
            <span className="font-bold text-white text-lg">N</span>
          </div>
          {!isSidebarCollapsed && (
            <span className={cn("text-xl font-bold tracking-wide", isDarkMode ? "text-emerald-50" : "text-slate-900")}>
              NutriSaaS
            </span>
          )}
        </Link>

        {/* Sidebar Toggle (Desktop Internal) */}
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          className={cn(
            "hidden lg:inline-flex items-center justify-center rounded-xl p-2 transition-all transition-colors",
            isDarkMode
              ? "text-emerald-100/40 hover:text-emerald-50 hover:bg-emerald-500/10"
              : "text-slate-400 hover:text-emerald-600 hover:bg-slate-50",
            isSidebarToggleHighlighted && "animate-pulse ring-2 ring-emerald-500/20",
            isSidebarCollapsed && "mt-2",
          )}
          title={isSidebarCollapsed ? "Mostrar menú" : "Contraer menú"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>
      <nav className="flex flex-1 flex-col mt-2">
        <ul role="list" className="flex flex-1 flex-col gap-y-2">
          {visibleGroups.map((group) => (
            <li
              key={group.title}
              className={cn(
                group.title === "PRINCIPAL" && "hidden lg:block"
              )}
            >
              {!isSidebarCollapsed && (
                <div
                  className={cn(
                    "mb-1 pl-2 text-[0.7rem] font-bold uppercase tracking-wider",
                    isDarkMode ? "text-emerald-100/45" : "text-slate-400",
                  )}
                >
                  {group.title}
                </div>
              )}
              <ul role="list" className="-mx-2 space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const isLocked = item.locked;

                  return (
                    <li key={item.name}>
                      <Link
                        href={isLocked ? "#" : item.href}
                        onClick={(e) => {
                          if (isLocked) {
                            e.preventDefault();
                            toast.info("Próximamente", {
                              description: `El módulo "${item.name}" estará disponible en futuras actualizaciones.`
                            });
                          }
                        }}
                        className={cn(
                          isActive
                            ? isDarkMode
                              ? "bg-emerald-500/12 text-emerald-50 font-bold"
                              : "bg-slate-50 text-emerald-600 font-bold"
                            : isDarkMode
                              ? "text-emerald-100/72 hover:bg-emerald-500/8 hover:text-emerald-50 font-medium"
                              : "text-slate-600 hover:text-emerald-600 hover:bg-slate-50 font-medium",
                          isLocked && "opacity-50 cursor-not-allowed grayscale",
                          "group flex gap-x-2 rounded-md p-2 leading-5 transition-colors items-center cursor-pointer",
                          isSidebarCollapsed && "justify-center",
                        )}
                        title={item.name}
                      >
                        <span className="relative inline-flex">
                          <item.icon
                            className={cn(
                              isActive
                                ? isDarkMode
                                  ? "text-emerald-300"
                                  : "text-emerald-600"
                                : isDarkMode
                                  ? "text-emerald-100/35 group-hover:text-emerald-300"
                                  : "text-slate-400 group-hover:text-emerald-600",
                              "h-4 w-4 shrink-0",
                            )}
                            aria-hidden="true"
                          />
                        </span>
                        {!isSidebarCollapsed && (
                          <span className="flex-1">{item.name}</span>
                        )}
                        {isLocked && (
                          <Lock
                            className={cn(
                              "h-3 w-3",
                              isDarkMode ? "text-emerald-100/35" : "text-slate-400",
                            )}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
      <style jsx>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.35);
          border-radius: 999px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.45);
        }
      `}</style>
    </div>
  );
}
