"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import {
  DashboardShellProvider,
  useDashboardShell,
} from "@/context/DashboardShellContext";
import { TutorialProvider } from "@/context/TutorialContext";
import { X } from "lucide-react";

import { SubscriptionProvider } from "@/context/SubscriptionContext";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isAdminView, isLoading } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isSidebarCollapsed } = useDashboardShell();
  const pathname = usePathname();
  const isRecipesModule = pathname.startsWith("/dashboard/recetas");

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white relative">
      {/* Mobile Sidebar (Drawer) */}
      <div className={`fixed inset-0 z-9999 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300" 
          onClick={() => setSidebarOpen(false)}
        />
        
        {/* Content */}
        <div className={`fixed inset-y-0 left-0 w-72 bg-white shadow-2xl transition-transform duration-300 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="absolute top-4 right-4 animate-in fade-in duration-500">
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 rounded-lg border border-slate-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="h-full overflow-y-auto pt-10">
             {isAdminView ? <AdminSidebar /> : <Sidebar />}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ${
          isSidebarCollapsed ? "lg:w-20" : "lg:w-72"
        }`}
      >
        {isAdminView ? <AdminSidebar /> : <Sidebar />}
      </div>

      <div
        className={`h-full min-h-screen flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
        }`}
      >
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main
          className={`flex-1 py-6 lg:py-10 ${isAdminView ? "bg-indigo-50/10" : ""}`}
        >
          <div
            className={`mx-auto w-full ${
              isRecipesModule
                ? "max-w-[120rem] px-3 sm:px-5 lg:px-6"
                : "max-w-7xl px-4 sm:px-6 lg:px-8"
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <SubscriptionProvider>
        <DashboardShellProvider>
          <TutorialProvider>
            <DashboardContent>{children}</DashboardContent>
          </TutorialProvider>
        </DashboardShellProvider>
      </SubscriptionProvider>
    </AdminProvider>
  );
}
