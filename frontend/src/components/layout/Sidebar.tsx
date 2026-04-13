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
  PlayCircle,
  Folder,
  FolderPlus,
  Dumbbell,
  Bot,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDashboardShell } from "@/context/DashboardShellContext";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  locked?: boolean;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const groups: SidebarGroup[] = [
  {
    title: "RÁPIDO",
    items: [
      { name: "Entregable", href: "/dashboard/rapido", icon: NotebookText },
    ],
  },
  {
    title: "PRINCIPAL",
    items: [
      { name: "Dieta", href: "/dashboard/dieta", icon: Utensils },
      { name: "Recetas y Porciones", href: "/dashboard/recetas", icon: ChefHat },
      { name: "Carrito", href: "/dashboard/carrito", icon: ShoppingCart },
      { name: "Entregable", href: "/dashboard/entregable", icon: ClipboardCheck },
    ],
  },
  {
    title: "Administración",
    items: [
      { name: "Pacientes", href: "/dashboard/pacientes", icon: Users },
      { name: "Consultas", href: "/dashboard/consultas", icon: CalendarDays },
    ],
  },
  {
    title: "Alimentos",
    items: [
      { name: "Ingredientes", href: "/dashboard/alimentos", icon: Apple },
      { name: "Grupos", href: "/dashboard/alimentos?tab=Mis grupos", icon: FolderPlus },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { name: "Creaciones", href: "/dashboard/creaciones", icon: Folder },
      { name: "Recursos & Material", href: "/dashboard/recursos", icon: FileText },
      { name: "Detalles", href: "/dashboard/detalles", icon: FileText },
      { name: "Platos", href: "/dashboard/platos", icon: ChefHat },
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
      { name: "Tutoriales", href: "/dashboard/tutoriales", icon: PlayCircle, locked: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed } = useDashboardShell();

  return (
    <div
      className={cn(
        "flex grow flex-col gap-y-4 overflow-y-auto border-r border-slate-200 bg-white pb-4 h-full transition-all duration-300",
        isSidebarCollapsed ? "px-2" : "px-4",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center",
          isSidebarCollapsed ? "justify-center" : "pl-2",
        )}
      >
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded bg-emerald-500 flex items-center justify-center">
            <span className="font-bold text-white text-lg">N</span>
          </div>
          {!isSidebarCollapsed && (
            <span className="text-xl font-bold tracking-wide text-slate-900">
              NutriSaaS
            </span>
          )}
        </div>
      </div>
      <nav className="flex flex-1 flex-col mt-2">
        <ul role="list" className="flex flex-1 flex-col gap-y-2">
          {groups.map((group) => (
            <li key={group.title}>
              {!isSidebarCollapsed && (
                <div className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400 mb-1 pl-2">
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
                            ? "bg-slate-50 text-emerald-600 font-bold"
                            : "text-slate-600 hover:text-emerald-600 hover:bg-slate-50 font-medium",
                          isLocked && "opacity-50 cursor-not-allowed grayscale",
                          "group flex gap-x-2 rounded-md p-2 leading-5 transition-colors items-center cursor-pointer",
                          isSidebarCollapsed && "justify-center",
                        )}
                        title={item.name}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? "text-emerald-600"
                              : "text-slate-400 group-hover:text-emerald-600",
                            "h-4 w-4 shrink-0",
                          )}
                          aria-hidden="true"
                        />
                        {!isSidebarCollapsed && (
                          <span className="flex-1">{item.name}</span>
                        )}
                        {isLocked && (
                          <Lock className="h-3 w-3 text-slate-400" />
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
    </div>
  );
}
