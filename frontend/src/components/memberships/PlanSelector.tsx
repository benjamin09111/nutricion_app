"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Zap,
  Sparkles,
  Crown,
  ArrowRight,
  ShieldCheck,
  TestTube,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import {
  membershipService,
  type MembershipPlan,
  type DiscountValidationResult,
} from "@/features/memberships/services/membership.service";
import { getMembershipFeatureDisplay } from "@/features/memberships/utils/feature-format";
import { useSubscription } from "@/context/SubscriptionContext";
import { usePaymentMode } from "@/hooks/usePaymentMode";
import { cn } from "@/lib/utils";
import { goToMembershipWelcome } from "@/lib/membership-navigation";
import { syncMembershipToStoredUser } from "@/lib/membership-session";

export function PlanSelector() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountResult, setDiscountResult] = useState<DiscountValidationResult | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const { refreshSubscription } = useSubscription();
  const router = useRouter();
  const { mode, toggle: toggleMode } = usePaymentMode();

  useEffect(() => {
    membershipService
      .getActivePlans()
      .then(setPlans)
      .catch(() => toast.error("No se pudieron cargar los planes"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelectFree = async (plan: MembershipPlan) => {
    setSubmittingId(plan.id);
    try {
      const result = await membershipService.selectFreePlan(plan.id);
      syncMembershipToStoredUser(result.membershipStatus, plan);
      toast.success(`Plan ${plan.name} activado correctamente`);
      await refreshSubscription();
      router.refresh();
      goToMembershipWelcome({
        planName: plan.name,
        planSlug: plan.slug,
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error al activar plan");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCheckout = async (plan: MembershipPlan) => {
    setSubmittingId(plan.id);
    try {
      if (mode === "real") {
        const result = discountResult?.code
          ? await membershipService.createFlowDiscountCheckout(plan.id, discountResult.code)
          : await membershipService.createFlowCheckout(plan.id);
        if (result.paymentUrl) {
          window.location.href = result.paymentUrl;
          return;
        }
        throw new Error("No se obtuvo link de pago");
      }

      // Mock payment
      const result = await membershipService.checkout(plan.id);
      if (result.proratedCredit && result.proratedCredit > 0) {
        toast.success(
          `Plan ${plan.name} activado. Crédito aplicado: $${result.proratedCredit.toLocaleString("es-CL")}`,
          { duration: 5000 },
        );
      } else {
        toast.success(`Plan ${plan.name} activado correctamente`);
      }
      await refreshSubscription();
      goToMembershipWelcome({
        planName: plan.name,
        planSlug: plan.slug,
        payment: "success",
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error al procesar el pago");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleValidateDiscount = async (plan: MembershipPlan) => {
    if (!discountCode.trim()) return;
    setIsValidatingDiscount(true);
    setActivePlanId(plan.id);
    try {
      const result = await membershipService.validateDiscount(plan.id, discountCode.trim());
      setDiscountResult(result);
      toast.success(`Codigo aplicado: ${result.discountPercent}% descuento`);
    } catch (error: unknown) {
      setDiscountResult(null);
      toast.error(error instanceof Error ? error.message : "Codigo invalido");
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">
            Cargando planes...
          </p>
        </div>
      </div>
    );
  }

  const freePlan = plans.find((p) => Number(p.price) === 0);
  const paidPlans = plans.filter((p) => Number(p.price) > 0);
  const allPlans = [...paidPlans, ...(freePlan ? [freePlan] : [])];

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
        {/* Steps indicator */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            Cuenta creada
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300" />
          <div className="flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-xs font-bold text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            Elige tu plan
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300" />
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">
            <Zap className="h-3.5 w-3.5" />
            Comienza
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Elige cómo quieres comenzar
          </h1>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
            Todos los planes incluyen acceso completo por 30 días. Sin
            compromiso, puedes cambiar o cancelar cuando quieras.
          </p>
        </div>

        {/* Payment Mode Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-sm">
            <button
              onClick={() => mode !== "mock" && toggleMode()}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                mode === "mock"
                  ? "bg-amber-100 text-amber-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              <TestTube className="h-3.5 w-3.5" />
              Modo Prueba
            </button>
            <button
              onClick={() => mode !== "real" && toggleMode()}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                mode === "real"
                  ? "bg-emerald-100 text-emerald-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Pago Real
            </button>
          </div>
        </div>

        {mode === "mock" && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 text-[11px] font-bold text-amber-700">
              <TestTube className="h-3.5 w-3.5" />
              Los pagos se aprueban automáticamente — solo para pruebas
            </div>
          </div>
        )}

        {/* All Plans Grid */}
        {allPlans.length > 0 && (
          <div className="grid gap-6 mb-10 lg:grid-cols-3 max-w-5xl mx-auto">
            {allPlans.map((plan) => {
              const isFree = Number(plan.price) === 0;
              const isPopular = plan.isPopular;
              const features = Array.isArray(plan.features)
                ? plan.features
                : typeof plan.features === "string"
                  ? JSON.parse(plan.features)
                  : [];

              if (isFree) {
                return (
                  <div
                    key={plan.id}
                    className="relative flex flex-col rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex flex-col flex-1 p-6 sm:p-8 text-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700 mb-4 mx-auto">
                        <Sparkles className="h-3.5 w-3.5" />
                        Plan gratuito
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline justify-center gap-1 mb-4">
                        <span className="text-4xl font-black tracking-tight text-slate-900">
                          $0
                        </span>
                        <span className="text-slate-500 text-sm">/mes</span>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-slate-500 mb-4">
                          {plan.description}
                        </p>
                      )}
                      <ul className="mb-8 space-y-3 text-left flex-1">
                        {features.map((feature: string, idx: number) => {
                          const fd = getMembershipFeatureDisplay(feature);
                          return (
                            <li key={idx} className="flex items-start gap-3">
                              <div className={`mt-0.5 rounded-full p-0.5 ${fd.isExcluded ? "bg-red-100" : "bg-emerald-100"}`}>
                                {fd.isExcluded ? (
                                  <X className="h-3.5 w-3.5 text-red-500" />
                                ) : (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                )}
                              </div>
                              <span className="text-sm text-slate-700">{fd.label}</span>
                            </li>
                          );
                        })}
                      </ul>
                      <Button
                        onClick={() => handleSelectFree(plan)}
                        disabled={submittingId === plan.id}
                        className="w-full cursor-pointer bg-white border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700 font-semibold py-3 rounded-2xl transition-all duration-300 text-base"
                      >
                        {submittingId === plan.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="h-4 w-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                            Activando...
                          </span>
                        ) : (
                          "Activar plan gratis"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-3xl bg-white transition-all duration-300 ${
                    isPopular
                      ? "border-2 border-indigo-500 shadow-[0_20px_60px_rgba(99,102,241,0.15)] lg:scale-105 z-10"
                      : "border border-slate-200 shadow-sm hover:shadow-md"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Más Popular
                    </div>
                  )}
                  <div
                    className={`flex flex-col flex-1 p-6 sm:p-8 ${
                      isPopular ? "pt-10" : "pt-6"
                    }`}
                  >
                    <div className="mb-6 text-center">
                      <h3
                        className={`text-xl font-bold mb-2 ${
                          isPopular ? "text-indigo-700" : "text-slate-900"
                        }`}
                      >
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-black tracking-tight text-slate-900">
                          ${Number(plan.price).toLocaleString("es-CL")}
                        </span>
                        <span className="text-slate-500 text-sm">/mes</span>
                      </div>
                      {plan.description && (
                        <p className="mt-2 text-sm text-slate-500">
                          {plan.description}
                        </p>
                      )}
                    </div>

                    <ul className="mb-8 space-y-3 text-left flex-1">
                      {features.map((feature: string, idx: number) => {
                        const featureDisplay = getMembershipFeatureDisplay(feature);

                        return (
                          <li key={idx} className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 rounded-full p-0.5 ${
                                featureDisplay.isExcluded
                                  ? "bg-red-100"
                                  : isPopular
                                    ? "bg-indigo-100"
                                    : "bg-slate-100"
                              }`}
                            >
                              {featureDisplay.isExcluded ? (
                                <X className="h-3.5 w-3.5 text-red-500" />
                              ) : (
                                <Check
                                  className={`h-3.5 w-3.5 ${
                                    isPopular
                                      ? "text-indigo-600"
                                      : "text-slate-500"
                                  }`}
                                />
                              )}
                            </div>
                            <span className="text-sm text-slate-700">
                              {featureDisplay.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="mb-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Codigo de descuento"
                          value={activePlanId === plan.id ? discountCode : ""}
                          onChange={(e) => {
                            setActivePlanId(plan.id);
                            setDiscountCode(e.target.value);
                            setDiscountResult(null);
                          }}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleValidateDiscount(plan)}
                          disabled={isValidatingDiscount || !discountCode.trim()}
                          className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-50 cursor-pointer"
                        >
                          {isValidatingDiscount && activePlanId === plan.id
                            ? "..."
                            : "Aplicar"}
                        </button>
                      </div>
                      {discountResult && activePlanId === plan.id && (
                        <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs space-y-1">
                          <div className="flex justify-between text-slate-500">
                            <span>Precio original</span>
                            <span>${discountResult.originalPrice.toLocaleString("es-CL")}</span>
                          </div>
                          {discountResult.proratedCredit > 0 && (
                            <div className="flex justify-between text-slate-500">
                              <span>Credito prorrateado</span>
                              <span>-${discountResult.proratedCredit.toLocaleString("es-CL")}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-emerald-700 font-bold">
                            <span>Descuento {discountResult.discountPercent}%</span>
                            <span>-${(discountResult.basePrice - discountResult.finalPrice).toLocaleString("es-CL")}</span>
                          </div>
                          <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-emerald-200">
                            <span>Total a pagar</span>
                            <span>${discountResult.finalPrice.toLocaleString("es-CL")}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleCheckout(plan)}
                      disabled={submittingId === plan.id}
                      className={`w-full cursor-pointer text-base font-semibold py-3 rounded-2xl transition-all duration-300 ${
                        isPopular
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                    >
                      {submittingId === plan.id ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {mode === "real"
                            ? "Redirigiendo..."
                            : "Confirmando..."}
                        </span>
                      ) : mode === "real" ? (
                        `Pagar ${plan.name}`
                      ) : (
                        `Obtener ${plan.name}`
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {allPlans.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-slate-500">
              No hay planes disponibles en este momento.
            </p>
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-sm text-slate-400 mt-12">
          {mode === "real"
            ? "Pago seguro con Flow · Facturación en CLP · Cancela cuando quieras"
            : "Modo prueba — los pagos se confirman automáticamente"}
        </p>
      </div>
    </div>
  );
}
