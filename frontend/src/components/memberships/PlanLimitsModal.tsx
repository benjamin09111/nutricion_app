"use client";

import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useSubscription } from "@/context/SubscriptionContext";
import { Crown, Sparkles, Activity, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PlanLimitsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlanLimitsModal({ isOpen, onClose }: PlanLimitsModalProps) {
  const router = useRouter();
  const {
    plan,
    planName,
    currentPlan,
    usage,
    refreshSubscription,
    isDeveloper,
  } = useSubscription();

  useEffect(() => {
    if (isOpen) {
      void refreshSubscription({ silent: true });
    }
  }, [isOpen, refreshSubscription]);

  const currentPrice = Number(currentPlan?.price || 0);
  const isFreemium =
    !isDeveloper &&
    (plan === "free" ||
      currentPrice === 0 ||
      (currentPlan?.slug || "").toLowerCase().includes("free") ||
      (currentPlan?.slug || "").toLowerCase().includes("freemium"));

  const entitlements = currentPlan?.entitlements;

  const usageRows = [
    {
      label: "Pacientes totales",
      usage: usage?.patientsActive ?? 0,
      limit: entitlements?.["patients.total.limit"] ?? entitlements?.["patients.active.limit"],
    },
    {
      label: "Consultas guardadas",
      usage: usage?.consultationsUsed ?? 0,
      limit: entitlements?.["consultations.saved.limit"] ?? entitlements?.["consultations.monthly.limit"],
    },
    {
      label: "PDFs generados",
      usage: usage?.pdfUsed ?? 0,
      limit: entitlements?.["pdf.exports.total.limit"] ?? entitlements?.["pdf.monthly.limit"],
    },
    {
      label: "Dietas guardadas",
      usage: usage?.dietCreationsUsed ?? 0,
      limit: entitlements?.["creations.diet.save.limit"],
    },
    {
      label: "Creaciones guardadas",
      usage: usage?.creationsUsed ?? 0,
      limit: entitlements?.["creations.save.limit"] ?? entitlements?.["creations.monthly.limit"],
    },
    {
      label: "Operaciones IA",
      usage: usage?.aiUsed ?? 0,
      limit: entitlements?.["ai.operations.total.limit"] ?? entitlements?.["ai.calls.limit"],
    },
    {
      label: "Grupos creados",
      usage: usage?.foodGroupsUsed ?? 0,
      limit: entitlements?.["food_groups.total.limit"],
    },
    {
      label: "Calculadora clínica",
      usage: usage?.calculatorUsed ?? 0,
      limit: entitlements?.["clinical_calculator.limit"],
    },
  ];

  const handleUpgradeClick = () => {
    onClose();
    router.push("/dashboard/configuraciones#membership");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Límites de mi plan">
      <div className="space-y-6 pt-1">
        {isFreemium ? (
          <>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-xs">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-amber-900 text-sm">{planName || "Plan Freemium"}</h3>
                    <p className="text-xs text-amber-700 font-medium">Uso acumulado y límites disponibles</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 border border-amber-200">
                  Freemium
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {usageRows.map((row) => {
                const isUnlimited = typeof row.limit === "number" && row.limit < 0;
                const rawLimit = isUnlimited ? null : typeof row.limit === "number" ? row.limit : null;
                const isAtLimit = rawLimit !== null && row.usage >= rawLimit;
                const ratio = rawLimit !== null && rawLimit > 0 ? Math.min(100, Math.round((row.usage / rawLimit) * 100)) : 0;

                return (
                  <div
                    key={row.label}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-2 transition-all hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{row.label}</span>
                      <span className={cn("font-black", isAtLimit ? "text-rose-600" : "text-slate-900")}>
                        {row.usage} / {rawLimit === null ? "∞" : rawLimit}
                      </span>
                    </div>

                    {rawLimit !== null && (
                      <div className="h-2 rounded-full bg-slate-200/80 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            isAtLimit
                              ? "bg-rose-500"
                              : ratio >= 80
                                ? "bg-amber-500"
                                : "bg-gradient-to-r from-emerald-500 to-teal-500",
                          )}
                          style={{ width: `${Math.max(ratio, 4)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
                ¿Necesitas más capacidad y funciones avanzadas?
              </p>
              <Button
                type="button"
                onClick={handleUpgradeClick}
                className="w-full sm:w-auto h-10 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs shadow-sm hover:from-amber-600 hover:to-amber-700 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Crown className="h-4 w-4 text-white" />
                <span>Ascender a Plan Pro</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-white/80" />
              </Button>
            </div>
          </>
        ) : (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                {planName || "Plan Pro"} Activo
              </span>
              <h3 className="text-xl font-bold text-slate-900">Acceso Completo sin Restricciones</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                Tu plan cuenta con acceso total e ilimitado. Los límites y restricciones de cuotas solo aplican al plan Freemium.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-10 rounded-xl px-6 font-bold text-xs cursor-pointer"
              >
                Entendido
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
