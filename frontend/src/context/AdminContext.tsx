"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const [role, setRole] = useState<UserRole | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("NUTRITIONIST");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkIsAdmin = (r: string | null) =>
    r ? ["ADMIN", "ADMIN_MASTER", "ADMIN_GENERAL"].includes(r) : false;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const userRole = user.role as UserRole;
        setRole(userRole);

        if (checkIsAdmin(userRole)) {
          setViewMode("ADMIN");
          // Ensure they are on the admin path if they just logged in/initialized
          if (window.location.pathname === "/dashboard") {
            router.push("/dashboard/admin");
          }
        } else {
          setViewMode("NUTRITIONIST");
        }
      } catch (e) {
        console.error("Error parsing user role", e);
      }
    }
    setIsLoading(false);
  }, [router]);

  const toggleViewMode = () => {
    if (!checkIsAdmin(role)) return;
    setViewMode((prev) => (prev === "ADMIN" ? "NUTRITIONIST" : "ADMIN"));
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
