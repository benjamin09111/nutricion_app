"use client";

import { useState } from "react";
import { Sparkles, Activity, NotebookPen, Crown } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { PlanLimitsModal } from "@/components/memberships/PlanLimitsModal";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export function MobileBottomNav() {
  const { isDarkMode } = useTheme();
  const { isDeveloper, plan, currentPlan } = useSubscription();
  const [isPlanLimitsOpen, setIsPlanLimitsOpen] = useState(false);

  const currentPrice = Number(currentPlan?.price || 0);
  const isFreemium =
    !isDeveloper &&
    (plan === "free" ||
      currentPrice === 0 ||
      (currentPlan?.slug || "").toLowerCase().includes("free") ||
      (currentPlan?.slug || "").toLowerCase().includes("freemium"));

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent("toggle-nutria-chat"));
  };

  const handleOpenNotes = () => {
    window.dispatchEvent(new CustomEvent("toggle-notes-agenda"));
  };

  const handleOpenPlan = () => {
    if (isFreemium) {
      setIsPlanLimitsOpen(true);
    } else {
      window.location.href = "/dashboard/configuraciones?tab=membership";
    }
  };

  return (
    <>
      <nav
        aria-label="Navegación móvil"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t px-2 py-2.5 shadow-2xl lg:hidden transition-colors pb-safe",
          isDarkMode
            ? "border-emerald-400/20 bg-slate-950/95 text-slate-200 backdrop-blur-md"
            : "border-slate-200 bg-white/95 text-slate-600 backdrop-blur-md",
        )}
      >
        <button
          type="button"
          onClick={handleOpenChat}
          className="flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs font-bold transition-all active:scale-95 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 cursor-pointer"
        >
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <span className="text-[10px] font-extrabold tracking-tight">Chat Nutria</span>
        </button>

        <button
          type="button"
          onClick={handleOpenPlan}
          className="flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs font-bold transition-all active:scale-95 text-amber-600 dark:text-amber-400 hover:text-amber-800 cursor-pointer"
        >
          {isFreemium ? (
            <Activity className="h-5 w-5 text-amber-500" />
          ) : (
            <Crown className="h-5 w-5 text-amber-500" />
          )}
          <span className="text-[10px] font-extrabold tracking-tight">Mi Plan</span>
        </button>

        <button
          type="button"
          onClick={handleOpenNotes}
          className="flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs font-bold transition-all active:scale-95 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 cursor-pointer"
        >
          <NotebookPen className="h-5 w-5 text-emerald-500" />
          <span className="text-[10px] font-extrabold tracking-tight">Mis notas</span>
        </button>
      </nav>

      <PlanLimitsModal
        isOpen={isPlanLimitsOpen}
        onClose={() => setIsPlanLimitsOpen(false)}
      />
    </>
  );
}
