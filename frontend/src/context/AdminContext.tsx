"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

type UserRole = "ADMIN" | "ADMIN_MASTER" | "ADMIN_GENERAL" | "NUTRITIONIST";
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
    } catch {
      return null;
    }
  });
  const router = useRouter();
  function checkIsAdmin(r: string | null) {
    return r ? ["ADMIN", "ADMIN_MASTER", "ADMIN_GENERAL"].includes(r) : false;
  }

  const viewMode: ViewMode = checkIsAdmin(role) ? "ADMIN" : "NUTRITIONIST";
  const isLoading = false;

  useEffect(() => {
    if (checkIsAdmin(role)) {
      if (pathname === "/dashboard") {
        router.push("/dashboard/admin");
      }
    }
  }, [pathname, role, router]);

  const toggleViewMode = () => {
    // Logic removed to prevent admins from seeing nutritionist-specific data
    console.warn("View switching is disabled for Admins to ensure data isolation.");
  };

  const value = {
    role,
    viewMode,
    toggleViewMode,
    isAdmin: checkIsAdmin(role),
    isAdminView: viewMode === "ADMIN",
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
