"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Crown,
  Settings,
  Shield,
  Building2,
  Inbox,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api-base";
import { useDashboardShell } from "@/context/DashboardShellContext";
import { useTheme } from "@/context/ThemeContext";

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
    title: "Principal",
    items: [
      {
        name: "Admin Dashboard",
        href: "/dashboard/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      { name: "Peticiones", href: "/dashboard/admin/peticiones", icon: Inbox },
      {
        name: "Clientes",
        href: "/dashboard/admin/nutricionistas",
        icon: Users,
      },
      { name: "Cuentas", href: "/dashboard/admin/usuarios", icon: Shield },
      {
        name: "Mensajes",
        href: "/dashboard/admin/mensajes",
        icon: MessageSquare,
      },
      { name: "Feedback", href: "/dashboard/admin/feedback", icon: Inbox },
      {
        name: "Licencias",
        href: "/dashboard/admin/organizaciones",
        icon: Building2,
        locked: true,
      },
    ],
  },
  {
    title: "Finanzas",
    items: [
      { name: "Pagos", href: "/dashboard/admin/pagos", icon: CreditCard },
      { name: "Membresías", href: "/dashboard/admin/membresias", icon: Crown },
    ],
  },
  {
    title: "Configuración",
    items: [
      {
        name: "Ajustes Globales",
        href: "/dashboard/admin/ajustes",
        icon: Settings,
        locked: true,
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);
  const { isSidebarCollapsed } = useDashboardShell();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const token =
          Cookies.get("auth_token") || localStorage.getItem("auth_token");
        if (!token) return; // Don't fetch if no token

        const res = await fetchApi(`/requests/count/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const count = await res.json();
          setPendingCount(count);
        }
      } catch (error) {
        // Silently handle fetch errors in sidebar to avoid intrusive error overlays
        console.error("Error fetching pending count:", error);
      }
    };

    fetchPendingCount();

    // Optional: Poll every 30s
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "dashboard-sidebar-bg flex grow flex-col gap-y-4 overflow-y-auto border-r pb-4 transition-all duration-300",
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
          <Image
            src="/logo_2.webp"
            alt="NutriSaaS"
            width={isSidebarCollapsed ? 72 : 180}
            height={isSidebarCollapsed ? 23 : 57}
            className={cn("h-auto w-auto object-contain", isSidebarCollapsed ? "max-w-[72px]" : "max-w-[180px]")}
            priority
          />
        </div>
      </div>
      <nav className="flex flex-1 flex-col mt-2">
        <ul role="list" className="flex flex-1 flex-col gap-y-3">
          {groups.map((group) => (
            <li key={group.title}>
              {!isSidebarCollapsed && (
                <div
                  className={cn(
                    "mb-1 pl-2 text-[0.8rem] font-bold uppercase tracking-wider",
                    isDarkMode ? "text-indigo-200/45" : "text-indigo-400",
                  )}
                >
                  {group.title}
                </div>
              )}
              <ul role="list" className="-mx-2 space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href);

                  if (item.locked) return null;

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? isDarkMode
                              ? "bg-indigo-500/14 text-indigo-100"
                              : "bg-indigo-100 text-indigo-700"
                            : isDarkMode
                              ? "text-indigo-100/75 hover:bg-indigo-500/8 hover:text-indigo-50"
                              : "text-slate-600 hover:text-indigo-700 hover:bg-indigo-50",
                          "group flex gap-x-2 rounded-md p-2 leading-5 font-medium transition-colors items-center cursor-pointer",
                          isSidebarCollapsed && "justify-center",
                        )}
                        title={item.name}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? isDarkMode
                                ? "text-indigo-200"
                                : "text-indigo-700"
                              : isDarkMode
                                ? "text-indigo-100/35 group-hover:text-indigo-200"
                                : "text-slate-400 group-hover:text-indigo-600",
                            "h-4 w-4 shrink-0",
                          )}
                          aria-hidden="true"
                        />
                        {!isSidebarCollapsed && <span>{item.name}</span>}
                        {!isSidebarCollapsed &&
                          item.name === "Peticiones" &&
                          pendingCount > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            {pendingCount}
                          </span>
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
