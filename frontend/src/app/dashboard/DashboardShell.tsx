"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { NutriaChatWidget } from "@/components/layout/NutriaChatWidget";
import { ReturnToConsultationWidget } from "@/components/layout/ReturnToConsultationWidget";
import { NotesAgendaWidget } from "@/components/layout/NotesAgendaWidget";
import { NatyWelcomeDrawer } from "@/components/copilot/NatyWelcomeDrawer";
import { WelcomeOverlay } from "@/components/welcome/WelcomeOverlay";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AppRatingModal } from "@/components/ratings/AppRatingModal";
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
import { ModuleSkeleton } from "@/components/ui/ModuleSkeleton";
import { isGuestMode } from "@/lib/demo-local-api";

function DashboardContent({ children, isDemo }: { children: React.ReactNode; isDemo?: boolean }) {
  const { isAdminView, isLoading } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isSidebarCollapsed, setSidebarCollapsed } = useDashboardShell();
  const { isDarkMode } = useTheme();
  const pathname = usePathname();
  const isRecipesModule = pathname.startsWith("/dashboard/recetas");
  const isDashboardHome = pathname === "/dashboard" || pathname === "/demo";
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    setIsGuest(isGuestMode());
  }, []);

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

  if (isLoading && !isDemo && !isGuest) {
    return (
      <div className={cn("min-h-screen w-full p-4 sm:p-8", isDarkMode ? "dashboard-shell-bg" : "bg-white")}>
        <ModuleSkeleton />
      </div>
    );
  }

  const dashboardShell = (
    <div className={cn("dashboard-shell-bg relative h-full", isDashboardHome && "lg:h-screen lg:max-h-screen lg:overflow-hidden")}>
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
        className={cn(
          "flex h-full min-h-screen min-w-0 flex-col transition-all duration-300",
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-[17rem]",
          isDashboardHome && "lg:h-screen lg:max-h-screen lg:overflow-hidden",
        )}
      >
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          isMobileMenuOpen={sidebarOpen}
        />
        <main
          className={cn(
            "min-w-0 flex-1",
            isDashboardHome
              ? "py-2 sm:py-3 lg:py-4 flex flex-col min-h-0 lg:overflow-hidden"
              : isAdminView
              ? "py-4 lg:py-4 xl:py-5"
              : "py-6 lg:py-4 xl:py-8",
            isAdminView && !isDarkMode && "bg-indigo-50/10",
          )}
        >
          <div
            className={cn(
              "mx-auto w-full min-w-0",
              isDashboardHome
                ? "max-w-[88rem] px-3 sm:px-4 lg:px-6 xl:px-8 flex-1 flex flex-col min-h-0 lg:overflow-hidden"
                : isAdminView
                ? "max-w-[96rem] px-3 sm:px-4 lg:px-4 xl:px-6"
                : isRecipesModule
                ? "max-w-[120rem] px-3 sm:px-5 lg:px-4 xl:px-6"
                : "max-w-[88rem] px-3 sm:px-4 lg:px-6 xl:px-8",
            )}
          >
            {children}
          </div>
        </main>
      </div>

      {!isAdminView && (
        <>
          <NutriaChatWidget />
          <ReturnToConsultationWidget />
          <NotesAgendaWidget />
          <WelcomeOverlay />
          <MobileBottomNav />
          <AppRatingModal />
        </>
      )}

      <FreemiumUpgradeModal
        isOpen={freemiumModalData.isOpen}
        onClose={() => setFreemiumModalData({ isOpen: false, description: "" })}
        description={freemiumModalData.description}
      />
    </div>
  );

  if (isAdminView || isDemo || isGuest) {
    return dashboardShell;
  }

  return <MembershipGate>{dashboardShell}</MembershipGate>;
}

export function DashboardShell({
  children,
  isDemo,
}: {
  children: React.ReactNode;
  isDemo?: boolean;
}) {
  return (
    <AdminProvider>
      <SubscriptionProvider>
        <DashboardShellProvider>
          <DashboardContent isDemo={isDemo}>{children}</DashboardContent>
        </DashboardShellProvider>
      </SubscriptionProvider>
    </AdminProvider>
  );
}
