"use client";

import React, { useState } from "react";
import { FileCode, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { Modal } from "@/components/ui/Modal";
import { readQuickPlanDraft } from "@/features/plan-context/storage/plan-context-storage";
import { buildWorkflowContextPreview } from "@/features/plan-context/adapters/build-workflow-context-preview";

export interface ActionDockItem {
  id: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: "indigo" | "emerald" | "amber" | "rose" | "slate";
  isSeparator?: boolean;
  disabled?: boolean;
}

interface ActionDockProps {
  items: ActionDockItem[];
  className?: string;
  desktopBreakpoint?: "md" | "lg";
}

export function ActionDock({ items, className, desktopBreakpoint = "md" }: ActionDockProps) {
  const { isDarkMode } = useTheme();
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [currentJson, setCurrentJson] = useState<Record<string, unknown> | null>(null);
  const [jsonView, setJsonView] = useState<"context" | "ai" | "diagnostic">("context");

  const readCurrentJson = () => {
    const readStorageJson = (key: string) => {
      const rawValue = window.localStorage.getItem(key);
      if (!rawValue) return null;

      try {
        return JSON.parse(rawValue);
      } catch {
        return { _error: `No se pudo leer ${key}` };
      }
    };

    const activeDraft = readStorageJson("nutri_active_draft");
    const quickDeliverableDraft = readQuickPlanDraft();
    const isQuickDeliverableRoute = window.location.pathname === "/dashboard/rapido";
    const planContext = isQuickDeliverableRoute
      ? quickDeliverableDraft?.planContext
      : activeDraft?.planContext;
    const normalizedWorkflowContext = !isQuickDeliverableRoute && activeDraft
      ? buildWorkflowContextPreview(activeDraft)
      : null;
    const diagnostic = {
      activeDraft,
      ...(isQuickDeliverableRoute
        ? { quickDeliverableDraft }
        : {}),
      patient: readStorageJson("nutri_patient"),
    };

    return {
      planContext: planContext || normalizedWorkflowContext,
      diagnostic,
    };
  };

  const dockItems: ActionDockItem[] = [
    ...items,
    {
      id: "current-json",
      icon: FileCode,
      label: "Mostrar JSON actual acumulado",
      description: "Ver el estado acumulado del flujo en formato JSON",
      variant: "slate",
      onClick: () => {
        setCurrentJson(readCurrentJson());
        setJsonView("context");
        setIsJsonModalOpen(true);
      },
    },
  ];

  const planContext = currentJson?.planContext as {
    patient?: Record<string, unknown>;
    creation?: Record<string, unknown>;
    plan?: Record<string, any>;
    metadata?: Record<string, unknown>;
  } | undefined;
  const aiPreview = planContext
    ? {
        patient: planContext.patient,
        creation: planContext.creation,
        plan: planContext.plan
          ? {
              ...planContext.plan,
              resources: Array.isArray(planContext.plan.resources)
                ? planContext.plan.resources.map((resource: Record<string, unknown>) => ({
                    resourceId: resource.resourceId,
                    title: resource.title,
                  }))
                : [],
            }
          : undefined,
      }
    : null;
  const displayedJson =
    jsonView === "ai"
      ? aiPreview
      : jsonView === "diagnostic"
        ? currentJson
        : planContext || currentJson;
  const desktopPositionClasses = desktopBreakpoint === "lg"
    ? "lg:bottom-auto lg:left-auto lg:right-4 lg:top-1/2 lg:-translate-y-1/2 lg:max-w-none lg:mx-0 xl:right-8"
    : "md:bottom-auto md:left-auto md:right-4 md:top-1/2 md:-translate-y-1/2 md:max-w-none md:mx-0 xl:right-8";
  const desktopLayoutClasses = desktopBreakpoint === "lg"
    ? "lg:rounded-4xl"
    : "md:rounded-4xl";
  const desktopItemsClasses = desktopBreakpoint === "lg"
    ? "lg:flex-col lg:justify-start lg:gap-2 lg:py-0 lg:px-0"
    : "md:flex-col md:justify-start md:gap-2 md:py-0 md:px-0";
  const desktopIconClasses = desktopBreakpoint === "lg" ? "lg:p-4" : "md:p-4";

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300",
        // Mobile (< 768px): Bottom floating navbar
        "bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-2 right-2 sm:left-4 sm:right-4 max-w-[calc(100vw-1rem)] mx-auto",
        // Desktop (>= 768px): Vertical dock on the right
        desktopPositionClasses,
        className,
      )}
    >
      <div
        className={cn(
          "backdrop-blur-xl border shadow-2xl transition-all duration-200",
          "rounded-2xl p-1 sm:p-2",
          desktopLayoutClasses,
          isDarkMode
            ? "border-emerald-400/12 bg-slate-950/90 shadow-black/40"
            : "bg-white/95 border-slate-200/90 shadow-slate-900/15",
        )}
      >
        <div className={cn(
          "flex flex-row items-center justify-around gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5",
          desktopItemsClasses,
        )}>
          {dockItems.map((item, index) => {
            if (item.isSeparator) {
              return (
                <div
                  key={`sep-${index}`}
                  className={cn(
                    "shrink-0",
                    "my-1 h-6 w-px mx-0.5",
                     desktopBreakpoint === "lg"
                       ? "lg:my-1 lg:h-px lg:w-auto lg:mx-2"
                       : "md:my-1 md:h-px md:w-auto md:mx-2",
                    isDarkMode ? "bg-emerald-400/10" : "bg-slate-200"
                  )}
                />
              );
            }

            const variantStyles = {
              indigo: isDarkMode
                ? "bg-indigo-500/12 text-indigo-100 hover:bg-indigo-500/18"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
              emerald: isDarkMode
                ? "bg-emerald-500/12 text-emerald-50 hover:bg-emerald-500/18"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
              amber: isDarkMode
                ? "bg-amber-500/12 text-amber-50 hover:bg-amber-500/18"
                : "bg-amber-50 text-amber-600 hover:bg-amber-100",
              rose: isDarkMode
                ? "bg-rose-500/12 text-rose-50 hover:bg-rose-500/18"
                : "bg-rose-50 text-rose-600 hover:bg-rose-100",
              slate: isDarkMode
                ? "bg-slate-800/80 text-emerald-50 hover:bg-slate-700/80"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100",
            };

            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                disabled={item.disabled}
                className={cn(
                   "group relative rounded-full p-2.5 sm:p-3 transition-all shrink-0 flex items-center justify-center",
                   desktopIconClasses,
                  variantStyles[item.variant || "slate"],
                  item.disabled ? "cursor-not-allowed opacity-45 hover:bg-slate-50" : "cursor-pointer active:scale-95",
                )}
                title={item.description || item.label}
              >
                <Icon className="h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:scale-110 shrink-0" />

                {/* Tooltip para escritorios */}
                <span
                  className={cn(
                     cn(
                       desktopBreakpoint === "lg" ? "hidden lg:block" : "hidden md:block",
                       "absolute right-full top-1/2 mr-4 -translate-y-1/2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 z-[60]",
                     ),
                    isDarkMode ? "bg-slate-950 text-emerald-50" : "bg-slate-900 text-white",
                  )}
                >
                  {item.description || item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={isJsonModalOpen}
        onClose={() => {
          setIsJsonModalOpen(false);
          setJsonView("context");
        }}
        title="JSON actual acumulado"
        description="Estado local reunido durante el flujo actual."
        className="max-w-4xl"
      >
        <div className="mb-4 flex flex-wrap gap-2 rounded-2xl bg-slate-50 p-2">
          {([
            ["context", "Contexto canónico"],
            ["ai", "Payload compacto IA"],
            ["diagnostic", "Diagnóstico"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setJsonView(value)}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-bold transition-colors",
                jsonView === value
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-white hover:text-slate-900",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <pre className="max-h-[60vh] overflow-auto rounded-2xl bg-slate-950 p-4 text-left text-xs leading-5 text-emerald-200">
          {JSON.stringify(displayedJson, null, 2)}
        </pre>
      </Modal>
    </div>
  );
}
