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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDashboardShell } from "@/context/DashboardShellContext";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

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
      { name: "Fichas clínicas", href: "/dashboard/fichas-clinicas", icon: FileText },
      { name: "Citas", href: "/dashboard/citas", icon: CalendarDays, tutorialPath: "/dashboard/citas" },
    ],
  },
  {
    title: "Nutrición y Dietética",
    items: [
      { name: "Principal", isSubHeader: true },
      { name: "Entregable Rápido", href: "/dashboard/rapido", icon: NotebookText },
      { name: "Pautas de Alimentación", href: "/dashboard/pautas", icon: FileText },
      { name: "Recetas", href: "/dashboard/rapido/recetas", icon: ChefHat },
      { name: "Entregable Personalizado", href: "/dashboard/dieta", icon: Apple, tutorialPath: "/dashboard/dieta" },
      { name: "Alimentos", isSubHeader: true },
      { name: "Tabla de composición", href: "/dashboard/alimentos", icon: Apple, tutorialPath: "/dashboard/alimentos" },
      { name: "Platos", href: "/dashboard/platos", icon: ChefHat, tutorialPath: "/dashboard/platos", hidden: true },
      { name: "Grupos", href: "/dashboard/alimentos/grupos", icon: FolderPlus },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { name: "Creaciones", href: "/dashboard/creaciones", icon: Folder, tutorialPath: "/dashboard/creaciones" },
      { name: "Recursos", href: "/dashboard/recursos", icon: FileText, tutorialPath: "/dashboard/recursos" },
      { name: "Calculadora", href: "/dashboard/herramientas/calculos", icon: Calculator, tutorialPath: "/dashboard/herramientas/calculos" },
      { name: "Configuración Clínica", href: "/dashboard/detalles", icon: Settings, tutorialPath: "/dashboard/detalles" },
    ],
  },
  {
    title: "Ejercicio y Deporte",
    items: [
      { name: "Rutinas de ejercicios", href: "/dashboard/ejercicio/rutinas", icon: Dumbbell, locked: true },
      { name: "Suplementos", href: "/dashboard/ejercicio/suplementos", icon: Pill, locked: true },
    ],
  },
  {
    title: "Agentes & IA",
    items: [
      { name: "Chatbots", href: "/dashboard/chatbots", icon: MessageCircle, locked: true, hidden: true },
      { name: "Agentes", href: "/dashboard/agentes", icon: Bot, locked: true, hidden: true },
    ],
  },
  {
    title: "Ajustes",
    items: [
      { name: "Información de Cálculos", href: "/dashboard/herramientas/porciones-intercambio", icon: BookOpen },
      { name: "Notificaciones", href: "/dashboard/ajustes/notificaciones", icon: Bell },
      { name: "Feedback & Soporte", href: "/dashboard/feedback", icon: MessageSquare },
    ],
  },
  {
    title: "Ayuda",
    items: [
      { name: "Preguntas frecuentes", href: "/dashboard/preguntas-frecuentes", icon: HelpCircle },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebarCollapsed, isSidebarToggleHighlighted } = useDashboardShell();
  const { isDarkMode } = useTheme();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    if (isSidebarCollapsed) return;
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const getGroupPriority = (group: SidebarGroup) => {
    if (group.title === "Administración") return 0;
    if (group.title === "Nutrición y Dietética") return 1;
    if (group.title === "Ejercicio y Deporte") return 2;
    if (group.title === "Herramientas") return 3;
    if (group.title === "Agentes & IA") return 4;
    if (group.title === "Ayuda") return 5;
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
        "sidebar-scroll dashboard-sidebar-bg flex h-full grow flex-col gap-y-4 overflow-y-auto border-r pb-4 transition-all duration-300",
        isSidebarCollapsed ? "px-2" : "px-4",
      )}
      style={{ scrollbarWidth: "thin" }}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center justify-between sticky top-0 z-10 dashboard-sidebar-bg",
          isSidebarCollapsed ? "flex-col gap-1 pt-2 pb-1 h-20 -mx-2 px-2" : "-mx-4 px-4 pl-6",
        )}
      >
        <Link
          href="/dashboard"
          className="flex items-center rounded-xl transition-colors hover:opacity-90"
          aria-label="Ir al dashboard"
          title="Ir al dashboard"
        >
          <Image
            src="/logo_2.webp"
            alt="NutriNet"
            width={isSidebarCollapsed ? 72 : 180}
            height={isSidebarCollapsed ? 23 : 57}
            className={cn("h-auto w-auto object-contain", isSidebarCollapsed ? "max-w-[72px]" : "max-w-[180px]")}
            priority
          />
        </Link>

        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          className={cn(
            "hidden lg:inline-flex items-center justify-center rounded-xl p-2 transition-all transition-colors",
            isDarkMode
              ? "text-indigo-100/50 hover:text-indigo-50 hover:bg-indigo-500/10"
              : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50",
            isSidebarToggleHighlighted && "animate-pulse ring-2 ring-indigo-500/20",
          )}
          title={isSidebarCollapsed ? "Mostrar menú" : "Contraer menú"}
        >
          {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col mt-2">
        <ul role="list" className="flex flex-1 flex-col gap-y-2">
          {visibleGroups.map((group) => {
            const isOpen = openGroups[group.title] === true;
            const showItems = isOpen;

            return (
              <li key={group.title}>
                {!isSidebarCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className={cn(
                      "flex w-full items-center justify-between mb-1 pl-2 text-[0.7rem] font-bold uppercase tracking-wider transition-colors",
                      isDarkMode ? "text-indigo-100/55 hover:text-indigo-100/80" : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    <span>{group.title}</span>
                    <div className="flex items-center pr-1">
                      {isOpen ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </div>
                  </button>
                )}
                {showItems && (
                  <ul role="list" className={cn("-mx-2 space-y-0.5", !isSidebarCollapsed && "mt-1")}>
                    {group.items.map((item) => {
                      if (item.isSubHeader) {
                        if (isSidebarCollapsed) return null;
                        return (
                          <li key={item.name} className="mt-4 mb-1 px-3">
                            <div className={cn(
                              "text-[10px] font-bold uppercase tracking-widest",
                              isDarkMode ? "text-indigo-300/40" : "text-slate-400/80"
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
                                toast.info("Próximamente", {
                                  description: `El módulo "${item.name}" estará disponible en futuras actualizaciones.`,
                                });
                              }
                            }}
                            className={cn(
                              isActive
                                ? isDarkMode
                                  ? "bg-indigo-500/12 text-indigo-50 font-bold"
                                  : "bg-slate-50 text-indigo-600 font-bold"
                                : isDarkMode
                                  ? "text-indigo-100/72 hover:bg-indigo-500/8 hover:text-indigo-50 font-medium"
                                  : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50 font-medium",
                              isLocked && "cursor-not-allowed grayscale opacity-50",
                              "group flex cursor-pointer items-center gap-x-2 rounded-md p-2 leading-5 transition-colors",
                              isSidebarCollapsed && "justify-center",
                              !isSidebarCollapsed && group.title === "Nutrición y Dietética" && "pl-4"
                            )}
                            title={item.name}
                          >
                            <span className="relative inline-flex">
                              {item.icon && (
                                <item.icon
                                  className={cn(
                                    isActive
                                      ? isDarkMode
                                        ? "text-indigo-300"
                                        : "text-indigo-600"
                                      : isDarkMode
                                        ? "text-indigo-100/35 group-hover:text-indigo-300"
                                        : "text-slate-400 group-hover:text-indigo-600",
                                    "h-4 w-4 shrink-0",
                                  )}
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                            {!isSidebarCollapsed && <span className="flex-1">{item.name}</span>}
                            {isLocked && <Lock className={cn("h-3 w-3", isDarkMode ? "text-indigo-100/35" : "text-slate-400")} />}
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
    </div>
  );
}
