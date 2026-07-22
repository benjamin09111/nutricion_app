"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Crown,
  Settings,
  Shield,
  Building2,
  MessageSquare,
  Globe2,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardShell } from "@/context/DashboardShellContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchApi } from "@/lib/api-base";
import { useAdmin } from "@/context/AdminContext";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  locked?: boolean;
  badge?: "inboxPending" | "deletionRequests";
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
      {
        name: "Clientes",
        href: "/dashboard/admin/nutricionistas",
        icon: Users,
        badge: "deletionRequests",
      },
      {
        name: "Portal",
        href: "/dashboard/admin/portal",
        icon: Globe2,
      },
      { name: "Cuentas", href: "/dashboard/admin/usuarios", icon: Shield },
      {
        name: "Mensajes",
        href: "/dashboard/admin/mensajes",
        icon: MessageSquare,
      },
      {
        name: "Inbox",
        href: "/dashboard/admin/inbox",
        icon: Inbox,
        badge: "inboxPending",
      },
      { name: "Feedback", href: "/dashboard/admin/feedback", icon: MessageSquare },
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
      { name: "Cupones", href: "/dashboard/admin/cupones", icon: Crown },
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

const WORKER_ALLOWED_PATHS = new Set([
  "/dashboard/admin",
  "/dashboard/admin/nutricionistas",
  "/dashboard/admin/mensajes",
  "/dashboard/admin/feedback",
  "/dashboard/admin/cupones",
]);

export function AdminSidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed } = useDashboardShell();
  const { isDarkMode } = useTheme();
  const [inboxPendingCount, setInboxPendingCount] = useState(0);
  const [deletionRequestsCount, setDeletionRequestsCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchInboxPendingCount = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        const response = await fetchApi("/support", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const data = (await response.json()) as Array<{
          type: string;
          status: string;
        }>;
        const pendingCount = data.filter(
          (item) => item.type === "CONTACT" && item.status === "PENDING",
        ).length;

        if (isMounted) {
          setInboxPendingCount(pendingCount);
        }
      } catch (error) {
        console.error("Error fetching inbox pending count:", error);
      }
    };

    const fetchDeletionRequestsCount = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        const response = await fetchApi("/users/deletion-requests/count", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const data = await response.json();
        if (isMounted) {
          setDeletionRequestsCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching deletion requests count:", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchInboxPendingCount();
        fetchDeletionRequestsCount();
      }
    };

    fetchInboxPendingCount();
    fetchDeletionRequestsCount();
    window.addEventListener("admin-inbox-updated", fetchInboxPendingCount);
    window.addEventListener("admin-deletion-request-accepted", fetchDeletionRequestsCount);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = window.setInterval(() => {
      fetchInboxPendingCount();
      fetchDeletionRequestsCount();
    }, 60000);

    return () => {
      isMounted = false;
      window.removeEventListener("admin-inbox-updated", fetchInboxPendingCount);
      window.removeEventListener("admin-deletion-request-accepted", fetchDeletionRequestsCount);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(interval);
    };
  }, []);

  const getItemBadge = (item: SidebarItem) => {
    if (item.badge === "inboxPending" && inboxPendingCount > 0) {
      return inboxPendingCount > 99 ? "99+" : String(inboxPendingCount);
    }
    if (item.badge === "deletionRequests" && deletionRequestsCount > 0) {
      return deletionRequestsCount > 99 ? "99+" : String(deletionRequestsCount);
    }
    return null;
  };
  const { role } = useAdmin();
  const isWorker = role === "WORKER";

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: isWorker
        ? group.items.filter((item) => WORKER_ALLOWED_PATHS.has(item.href))
        : group.items,
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div
      className={cn(
        "dashboard-sidebar-bg flex grow flex-col gap-y-4 overflow-y-auto border-r pb-4 transition-all duration-300",
        isSidebarCollapsed ? "px-2" : "px-4",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center sticky top-0 z-10 dashboard-sidebar-bg",
          isSidebarCollapsed ? "justify-center -mx-2 px-2" : "-mx-4 px-4 pl-6",
        )}
      >
        <div className="flex items-center space-x-2">
          <Image
            src="/logo_2.webp"
            alt="NutriNet"
            width={isSidebarCollapsed ? 72 : 180}
            height={isSidebarCollapsed ? 23 : 57}
            className={cn("h-auto w-auto object-contain", isSidebarCollapsed ? "max-w-[72px]" : "max-w-[180px]")}
            style={{ width: "auto", height: "auto" }}
          />
        </div>
      </div>
      <nav className="flex flex-1 flex-col mt-2">
        <ul role="list" className="flex flex-1 flex-col gap-y-3">
          {visibleGroups.map((group) => (
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
                  const itemBadge = getItemBadge(item);

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
                          "group flex min-w-0 gap-x-2 rounded-md p-2 leading-5 font-medium transition-colors items-center cursor-pointer",
                          "relative",
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
                        {!isSidebarCollapsed && <span className="min-w-0 flex-1 truncate">{item.name}</span>}
                        {itemBadge && (
                          <span
                            className={cn(
                              "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-black leading-none text-white shadow-sm ring-2",
                              isDarkMode ? "ring-slate-900" : "ring-white",
                              isSidebarCollapsed &&
                                "absolute -right-1 -top-1 ml-0",
                            )}
                            aria-label={`${itemBadge} mensajes pendientes`}
                          >
                            {itemBadge}
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
