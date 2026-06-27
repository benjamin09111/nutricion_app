"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-base";

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
      const token = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("user");

      if (!token && !storedUser) {
        setIsLoading(false);
        return;
      }

      if (!token) {
        try {
          const user = JSON.parse(storedUser || "null");
          setRole(user?.role as UserRole | null);
        } catch (error) {
          console.error("Error parsing stored user:", error);
          setRole(null);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetchApi("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("No se pudo sincronizar la sesión");
        }

        const data = await response.json();
        const user = data?.user || data;
        setRole(user?.role as UserRole | null);

        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }
      } catch (error) {
        console.error("Error syncing admin session:", error);
        try {
          const user = JSON.parse(storedUser || "null");
          setRole(user?.role as UserRole | null);
        } catch (parseError) {
          console.error("Error parsing stored user:", parseError);
          setRole(null);
        }
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
