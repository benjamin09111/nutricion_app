"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useTheme } from "@/context/ThemeContext";

interface MobileSidebarProps {
  isOpen: boolean;
  isAdminView: boolean;
  onClose: () => void;
}

export function MobileSidebar({
  isOpen,
  isAdminView,
  onClose,
}: MobileSidebarProps) {
  const { isDarkMode } = useTheme();

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[200] lg:hidden">
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex h-[100dvh] w-full">
        <DialogPanel
          id="mobile-dashboard-navigation"
          className={cn(
            "relative flex h-full min-h-0 w-full flex-col shadow-2xl",
            "dashboard-sidebar-bg",
            isDarkMode ? "text-indigo-50" : "text-slate-900",
          )}
        >
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "absolute right-3 top-3 z-20 rounded-xl border p-2 transition-colors",
              isDarkMode
                ? "border-emerald-400/10 bg-emerald-500/8 text-emerald-100/65 hover:text-rose-300"
                : "border-slate-100 bg-slate-50 text-slate-400 hover:text-rose-500",
            )}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
            {isAdminView ? (
              <AdminSidebar isMobile onItemClick={onClose} />
            ) : (
              <Sidebar isMobile onItemClick={onClose} />
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
