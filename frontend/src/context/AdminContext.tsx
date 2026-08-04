"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-base";
import { setCurrentUser } from "@/lib/current-user";

type UserRole =
  | "ADMIN"
  | "ADMIN_MASTER"
  | "ADMIN_GENERAL"
  | "NUTRITIONIST"
  | "NUTRITIONIST_DEVELOPER"
  | "WORKER";
type ViewMode = "ADMIN" | "NUTRITIONIST";

interface AdminContextType {
  role: UserRole | null;
  viewMode: ViewMode;
  toggleViewMode: () => void;
  isAdmin: boolean;
  isAdminView: boolean;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function checkIsAdmin(r: string | null) {
    return r ? ["ADMIN", "ADMIN_MASTER", "ADMIN_GENERAL"].includes(r) : false;
  }

  function checkIsWorker(r: string | null) {
    return r ? ["WORKER"].includes(r) : false;
  }

  useEffect(() => {
    const syncRole = async () => {
      // SEGURIDAD: el rol se pide siempre al backend. No se siembra ni se hace
      // fallback con cookies/localStorage porque el usuario puede editarlos.
      try {
        let response: Response | null = null;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          response = await fetchApi("/auth/me");
          if (response.ok || response.status === 401) break;
          await new Promise((resolve) => window.setTimeout(resolve, 400));
        }

        if (!response?.ok) {
          console.warn(
            `No se pudo sincronizar la sesión (HTTP ${response?.status ?? "sin respuesta"}).`,
          );
          setRole(null);
          return;
        }

        const data = await response.json();
        const user = data?.user || data;
        setRole((user?.role as UserRole | null) ?? null);

        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.warn("No se pudo sincronizar el rol de la sesión:", error);
        // Fallar cerrado: sin confirmación del backend no hay rol privilegiado.
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    void syncRole();
  }, []);

  const isAdmin = checkIsAdmin(role);
  const isWorker = checkIsWorker(role);
  const isAdminView = isAdmin || isWorker;
  const viewMode: ViewMode = isAdminView ? "ADMIN" : "NUTRITIONIST";

  useEffect(() => {
    if (!isLoading && isAdminView) {
      if (pathname === "/dashboard") {
        router.push("/dashboard/admin");
      }
    }
  }, [pathname, isAdminView, router, isLoading]);

  const toggleViewMode = () => {
    console.warn(
      "View switching is disabled for Admins to ensure data isolation.",
    );
  };

  const value = {
    role,
    viewMode,
    toggleViewMode,
    isAdmin,
    isAdminView,
    isLoading,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
