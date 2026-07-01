"use client";

import { useMemo, useState } from "react";
import { Crown, ShieldCheck, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { usePaymentMode } from "@/hooks/usePaymentMode";
import { useSubscription } from "@/context/SubscriptionContext";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Modal } from "@/components/ui/Modal";
import { membershipService, type MembershipPlan, type DiscountValidationResult } from "@/features/memberships/services/membership.service";
import { syncMembershipToStoredUser } from "@/lib/membership-session";
import { goToMembershipWelcome } from "@/lib/membership-navigation";

const FEATURE_LABELS: Record<string, string> = {
  "patients.active.limit": "Pacientes activos",
  "consultations.monthly.limit": "Consultas mensuales",
  "pdf.monthly.limit": "PDFs mensuales",
  "followups.private.active.limit": "Seguimientos privados",
  "ingredients.base.read": "Base de ingredientes",
  "clinical_calculator.access": "Calculadora clínica",
  "food_groups.access": "Grupos de alimentos",
  "ai.calls.limit": "Llamadas a IA",
  "ai.autofill.access": "Relleno automático IA",
  "appointments.access": "Gestión de citas",
  "google_calendar.sync": "Google Calendar",
  "nutritionist_portal.access": "Portal nutricionista",
  "sii_invoices.access": "Boletas SII",
};

const FEATURE_ORDER = [
  "patients.active.limit",
  "consultations.monthly.limit",
  "pdf.monthly.limit",
  "followups.private.active.limit",
  "ai.calls.limit",
  "ingredients.base.read",
  "clinical_calculator.access",
  "food_groups.access",
  "ai.autofill.access",
  "appointments.access",
  "google_calendar.sync",
  "nutritionist_portal.access",
  "sii_invoices.access",
];

const money = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export function MembershipPlanSection() {
  const {
    currentPlan,
    subscriptionEndsAt,
    daysRemaining,
    cancelAtPeriodEnd,
    status,
    refreshSubscription,
    usage,
    billing,
  } = useSubscription();
  const { mode, toggle: togglePaymentMode } = usePaymentMode();
  const [isCanceling, setIsCanceling] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<MembershipPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountResults, setDiscountResults] = useState<Map<string, DiscountValidationResult>>(new Map());
  const [validatingPlanId, setValidatingPlanId] = useState<string | null>(null);

  const currentPrice = Number(currentPlan?.price || 0);
  const nextPaymentLabel = useMemo(() => {
    if (currentPrice === 0) return "Sin cobro";
    return formatDate(billing?.nextPaymentAt || subscriptionEndsAt?.toISOString() || null);
  }, [billing?.nextPaymentAt, currentPrice, subscriptionEndsAt]);

  const usageRows = useMemo(
    () => [
      {
        label: "Pacientes activos",
        usage: usage?.patientsActive ?? 0,
        limit: currentPlan?.entitlements?.["patients.active.limit"],
      },
      {
        label: "Consultas mensuales",
        usage: usage?.consultationsMonthly ?? 0,
        limit: currentPlan?.entitlements?.["consultations.monthly.limit"],
      },
      {
        label: "PDFs mensuales",
        usage: usage?.pdfMonthly ?? 0,
        limit: currentPlan?.entitlements?.["pdf.monthly.limit"],
      },
      {
        label: "IA mensual",
        usage: usage?.aiMonthly ?? 0,
        limit: currentPlan?.entitlements?.["ai.calls.limit"],
      },
    ],
    [currentPlan?.entitlements, usage],
  );

  const featureRows = useMemo(
    () =>
      FEATURE_ORDER.map((key) => ({
        key,
        label: FEATURE_LABELS[key] || key,
        value: currentPlan?.entitlements?.[key],
      })),
    [currentPlan],
  );

  if (!currentPlan) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
        <Crown className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-slate-500 font-medium">No tienes un plan activo.</p>
        <p className="mt-1 text-sm text-slate-400">Selecciona un plan para comenzar.</p>
      </div>
    );
  }

  const currentLabel = currentPlan.key || currentPlan.slug;
  const renewalText =
    currentPrice > 0
      ? billing?.nextPaymentAmount
        ? money(billing.nextPaymentAmount)
        : money(currentPrice)
      : "Plan gratuito";

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-indigo-100 bg-linear-to-br from-white via-white to-indigo-50/40 p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Suscripción activa
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200/60">
                <Crown className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">{currentPlan.name}</h2>
                  <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                    {currentLabel}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                    {cancelAtPeriodEnd ? "Cancela al vencer" : status === "PAST_DUE" ? "Expirado" : "Activo"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {money(currentPrice)} / mes · Próximo cobro {nextPaymentLabel}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Días restantes</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{daysRemaining ?? "-"}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vence</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(subscriptionEndsAt?.toISOString() || null)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monto próximo</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{renewalText}</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Modo de pago</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{mode === "mock" ? "Prueba" : "Real"}</p>
              </div>
              <button
                onClick={togglePaymentMode}
                aria-label="Cambiar modo de pago"
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
              {mode === "mock"
                ? "Los pagos se aprueban automáticamente en modo prueba."
                : "Pagos procesados por Mercado Pago."}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Consumo</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Uso del plan</h3>
            </div>
            <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Actualizado en vivo</div>
          </div>

          <div className="mt-5 grid gap-4">
            {usageRows.map((row) => {
              const isUnlimited = typeof row.limit === "number" && row.limit < 0;
              const limit = isUnlimited ? 100 : Number(row.limit || 0);
              const ratio = isUnlimited ? 12 : Math.min(100, Math.round((row.usage / Math.max(limit, 1)) * 100));

              return (
                <div key={row.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">{row.label}</span>
                    <span className="font-bold text-slate-900">{row.usage} / {isUnlimited ? "∞" : limit}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-emerald-500" style={{ width: `${ratio}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Acciones</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Gestión de suscripción</h3>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {!cancelAtPeriodEnd && currentPrice > 0 && (
              <button onClick={() => setIsCancelConfirmOpen(true)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                Cancelar plan
              </button>
            )}
            {cancelAtPeriodEnd && (
              <button
                onClick={async () => {
                  setIsResuming(true);
                  try {
                    await membershipService.resumeSubscription();
                    toast.success("Plan reanudado correctamente");
                    await refreshSubscription();
                  } catch (e: any) {
                    toast.error(e?.message || "Error al reanudar plan");
                  } finally {
                    setIsResuming(false);
                  }
                }}
                disabled={isResuming}
                className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isResuming ? "Reanudando..." : "Reanudar plan"}
              </button>
            )}
            <button
              onClick={async () => {
                setIsChangingPlan(true);
                setIsLoadingPlans(true);
                try {
                  const plans = await membershipService.getActivePlans();
                  setAvailablePlans(plans.filter((p) => p.id !== currentPlan?.id));
                } catch {
                  toast.error("No se pudieron cargar los planes");
                } finally {
                  setIsLoadingPlans(false);
                }
              }}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
            >
              Cambiar plan
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-900">Renovación y control</p>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300" />Próximo pago y fecha visibles en tiempo real.</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300" />Cancelación con acceso hasta el vencimiento.</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300" />Cambio de plan con lectura clara de upgrade/downgrade.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Características</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Restricciones incluidas</h3>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {featureRows.map((feature) => (
            <div key={feature.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{feature.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {typeof feature.value === "boolean"
                  ? feature.value ? "Incluido" : "No incluido"
                  : typeof feature.value === "number"
                    ? feature.value < 0 ? "Ilimitado" : feature.value
                    : "-"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isChangingPlan}
        onClose={() => setIsChangingPlan(false)}
        closeOnEscape
        closeOnBackdropClick
        className="max-w-5xl"
        title="Comparar y elegir"
      >
        <div className="mt-2">

          {currentPrice > 0 && daysRemaining && daysRemaining > 0 && (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
              Tienes {daysRemaining} días restantes de tu plan actual ({currentPlan.name}). Se aplicará el crédito proporcional al nuevo plan.
            </div>
          )}

          <div className="mt-5">
            {isLoadingPlans ? (
              <p className="text-sm text-slate-500">Cargando planes...</p>
            ) : availablePlans.length === 0 ? (
              <p className="text-sm text-slate-500">No hay otros planes disponibles.</p>
            ) : (
              <div className="grid gap-4 xl:grid-cols-3">
                {availablePlans.map((plan) => {
                  const targetPrice = Number(plan.price || 0);
                  const actionLabel =
                    targetPrice === 0
                      ? "Downgrade a Free"
                      : targetPrice > currentPrice
                        ? "Upgrade"
                        : targetPrice < currentPrice
                          ? "Down plan"
                          : "Cambiar";

                  return (
                    <div key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{money(targetPrice)} / mes</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                          {actionLabel}
                        </span>
                      </div>

                      {targetPrice > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Codigo de descuento"
                              value={discountCode}
                              onChange={(e) => {
                                setDiscountCode(e.target.value);
                                setDiscountResults((prev) => {
                                  const next = new Map(prev);
                                  next.delete(plan.id);
                                  return next;
                                });
                              }}
                              className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                if (!discountCode.trim()) return;
                                setValidatingPlanId(plan.id);
                                try {
                                  const result = await membershipService.validateDiscount(plan.id, discountCode.trim());
                                  setDiscountResults((prev) => {
                                    const next = new Map(prev);
                                    next.set(plan.id, result);
                                    return next;
                                  });
                                  toast.success(`Codigo aplicado: ${result.discountPercent}% descuento`);
                                } catch (e: any) {
                                  toast.error(e?.message || "Codigo invalido");
                                } finally {
                                  setValidatingPlanId(null);
                                }
                              }}
                              disabled={validatingPlanId === plan.id || !discountCode.trim()}
                              className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-[10px] font-bold text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-50 cursor-pointer"
                            >
                              {validatingPlanId === plan.id ? "..." : "Aplicar"}
                            </button>
                          </div>
                          {discountResults.has(plan.id) && (
                            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-[10px] space-y-0.5">
                              <div className="flex justify-between text-slate-500">
                                <span>Original</span>
                                <span>{money(discountResults.get(plan.id)!.originalPrice)}</span>
                              </div>
                              {discountResults.get(plan.id)!.proratedCredit > 0 && (
                                <div className="flex justify-between text-slate-500">
                                  <span>Credito</span>
                                  <span>-{money(discountResults.get(plan.id)!.proratedCredit)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-emerald-700 font-bold">
                                <span>-{discountResults.get(plan.id)!.discountPercent}%</span>
                                <span>-{money(discountResults.get(plan.id)!.basePrice - discountResults.get(plan.id)!.finalPrice)}</span>
                              </div>
                              <div className="flex justify-between text-slate-900 font-black pt-1 border-t border-emerald-200">
                                <span>Total</span>
                                <span>{money(discountResults.get(plan.id)!.finalPrice)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={async () => {
                            setUpgradingPlanId(plan.id);
                            const planDiscount = discountResults.get(plan.id);
                            try {
                              if (targetPrice === 0) {
                                const result = await membershipService.selectFreePlan(plan.id);
                                syncMembershipToStoredUser(result.membershipStatus, plan);
                                toast.success(`Cambiado a ${plan.name}`);
                                await refreshSubscription();
                                setIsChangingPlan(false);
                                goToMembershipWelcome({ planName: plan.name, planSlug: plan.slug });
                                return;
                              }

                              if (mode === "real") {
                                const returnPath = window.location.pathname;
                                const result = planDiscount?.code
                                  ? await membershipService.createFlowDiscountCheckout(plan.id, planDiscount.code, returnPath)
                                  : await membershipService.createFlowCheckout(plan.id, returnPath);
                                if (result.paymentUrl) {
                                  window.location.href = result.paymentUrl;
                                  return;
                                }
                                throw new Error("No se obtuvo link de pago");
                              }

                              const result = await membershipService.checkout(plan.id);
                              if (result.proratedCredit && result.proratedCredit > 0) {
                                toast.success(`Plan ${plan.name} activado. Se descontaron ${money(result.proratedCredit)} por los días no usados de tu plan anterior.`, { duration: 6000 });
                              } else {
                                toast.success(`Plan ${plan.name} activado`);
                              }
                              goToMembershipWelcome({ planName: plan.name, planSlug: plan.slug, payment: "success" });
                              await refreshSubscription();
                              setIsChangingPlan(false);
                            } catch (e: any) {
                              toast.error(e?.message || "Error al cambiar plan");
                            } finally {
                              setUpgradingPlanId(null);
                            }
                          }}
                          disabled={upgradingPlanId === plan.id}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
                        >
                          {upgradingPlanId === plan.id ? "..." : actionLabel}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={async () => {
          setIsCanceling(true);
          try {
            await membershipService.cancelSubscription();
            toast.success("Tu plan se cancelará al final del período actual");
            await refreshSubscription();
          } catch (e: any) {
            toast.error(e?.message || "Error al cancelar");
          } finally {
            setIsCanceling(false);
            setIsCancelConfirmOpen(false);
          }
        }}
        title="Cancelar plan"
        description="Tu plan se cancelará al final del período actual. Seguirás teniendo acceso hasta esa fecha. Puedes reanudar tu plan en cualquier momento antes de que termine."
        confirmText="Sí, cancelar al vencimiento"
        cancelText="Volver"
        isLoading={isCanceling}
      />
    </div>
  );
}
