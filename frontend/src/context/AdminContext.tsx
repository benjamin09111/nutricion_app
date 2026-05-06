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
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setRole(user.role as UserRole);
      } catch (error) {
        console.error("Error parsing stored user:", error);
      }
    }
    setIsLoading(false);
  }, []);

  function checkIsAdmin(r: string | null) {
    return r ? ["ADMIN", "ADMIN_MASTER", "ADMIN_GENERAL"].includes(r) : false;
  }

  const isAdmin = checkIsAdmin(role);
  const viewMode: ViewMode = isAdmin ? "ADMIN" : "NUTRITIONIST";

  useEffect(() => {
    if (!isLoading && isAdmin) {
      if (pathname === "/dashboard") {
        router.push("/dashboard/admin");
      }
    }
  }, [pathname, isAdmin, router, isLoading]);

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
