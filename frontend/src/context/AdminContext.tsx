"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

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
  const [role] = useState<UserRole | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      return null;
    }

    try {
      const user = JSON.parse(storedUser);
      return user.role as UserRole;
    } catch (error) {
      console.error("Error parsing stored user:", error);
      return null;
    }
  });
  const [isLoading] = useState(false);

  function checkIsAdmin(r: string | null) {
    return r ? ["ADMIN", "ADMIN_MASTER", "ADMIN_GENERAL"].includes(r) : false;
  }

  function checkIsWorker(r: string | null) {
    return r ? ["WORKER"].includes(r) : false;
  }

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
