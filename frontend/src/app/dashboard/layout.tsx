"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { NutriaChatWidget } from "@/components/layout/NutriaChatWidget";
import { NotesAgendaWidget } from "@/components/layout/NotesAgendaWidget";
import { NatyWelcomeDrawer } from "@/components/copilot/NatyWelcomeDrawer";
import { WelcomeOverlay } from "@/components/welcome/WelcomeOverlay";
import { AdminProvider, useAdmin } from "@/context/AdminContext";
import {
  DashboardShellProvider,
  useDashboardShell,
} from "@/context/DashboardShellContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { MembershipGate } from "@/components/memberships/MembershipGate";
import { FreemiumUpgradeModal } from "@/components/memberships/FreemiumUpgradeModal";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isAdminView, isLoading } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isSidebarCollapsed, setSidebarCollapsed } = useDashboardShell();
  const { isDarkMode } = useTheme();
  const pathname = usePathname();
  const isRecipesModule = pathname.startsWith("/dashboard/recetas");

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const isPlanRoute =
      pathname.startsWith("/dashboard/rapido") ||
      pathname.startsWith("/dashboard/dieta") ||
      pathname.startsWith("/dashboard/pautas") ||
      pathname.startsWith("/dashboard/entregable");

    if (isPlanRoute) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [pathname, setSidebarCollapsed]);

  const [freemiumModalData, setFreemiumModalData] = useState<{
    isOpen: boolean;
    description: string;
  }>({ isOpen: false, description: "" });

  useEffect(() => {
    const handleShowModal = (e: Event) => {
      const customEvent = e as CustomEvent<{ description: string }>;
      setFreemiumModalData({
        isOpen: true,
        description: customEvent.detail?.description || "",
      });
    };

    window.addEventListener("show-freemium-upgrade", handleShowModal);
    return () => {
      window.removeEventListener("show-freemium-upgrade", handleShowModal);
    };
  }, []);

  if (isLoading) {
    return (
      <div className={cn("flex h-screen w-full items-center justify-center", isDarkMode ? "dashboard-shell-bg" : "bg-white")}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const dashboardShell = (
    <div className="dashboard-shell-bg relative h-full">
      <MobileSidebar
        isOpen={sidebarOpen}
        isAdminView={isAdminView}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ${
          isSidebarCollapsed ? "lg:w-20" : "lg:w-[17rem]"
        }`}
      >
        {isAdminView ? <AdminSidebar /> : <Sidebar />}
      </div>

      <div
        className={`flex h-full min-h-screen min-w-0 flex-col transition-all duration-300 ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-[17rem]"
        }`}
      >
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          isMobileMenuOpen={sidebarOpen}
        />
        <main
          className={cn(
            isAdminView ? "min-w-0 flex-1 py-4 lg:py-4 xl:py-5" : "min-w-0 flex-1 py-6 lg:py-4 xl:py-8",
            isAdminView && !isDarkMode && "bg-indigo-50/10",
          )}
        >
          <div
            className={`mx-auto w-full min-w-0 ${
              isAdminView
                ? "max-w-[96rem] px-3 sm:px-4 lg:px-4 xl:px-6"
                : isRecipesModule
                ? "max-w-[120rem] px-3 sm:px-5 lg:px-4 xl:px-6"
                : "max-w-[88rem] px-3 sm:px-4 lg:px-6 xl:px-8"
            }`}
          >
            {children}
          </div>
        </main>
      </div>

      {!isAdminView && (
        <>
          <NutriaChatWidget />
          <NotesAgendaWidget />
          <WelcomeOverlay />
        </>
      )}

      <FreemiumUpgradeModal
        isOpen={freemiumModalData.isOpen}
        onClose={() => setFreemiumModalData({ isOpen: false, description: "" })}
        description={freemiumModalData.description}
      />
    </div>
  );

  if (isAdminView) {
    return dashboardShell;
  }

  return <MembershipGate>{dashboardShell}</MembershipGate>;
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
          <DashboardContent>{children}</DashboardContent>
        </DashboardShellProvider>
      </SubscriptionProvider>
    </AdminProvider>
  );
}
