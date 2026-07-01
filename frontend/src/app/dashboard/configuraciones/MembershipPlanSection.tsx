"use client";

import { useMemo, useState } from "react";
import { Crown, ShieldCheck, Sparkles, X, Zap, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/context/SubscriptionContext";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { TransferPaymentModal } from "@/components/pagos/TransferPaymentModal";
import { membershipService, type MembershipPlan } from "@/features/memberships/services/membership.service";
import { syncMembershipToStoredUser } from "@/lib/membership-session";
import { goToMembershipWelcome } from "@/lib/membership-navigation";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";

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
  const [isCanceling, setIsCanceling] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<MembershipPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradePlans, setUpgradePlans] = useState<MembershipPlan[]>([]);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<MembershipPlan | null>(null);
  const [isLoadingUpgradePlans, setIsLoadingUpgradePlans] = useState(false);

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
            {currentPrice === 0 && (
              <button
                onClick={async () => {
                  setIsLoadingUpgradePlans(true);
                  try {
                    const plans = await membershipService.getActivePlans();
                    const paidPlans = plans.filter((p) => Number(p.price) > 0);
                    setUpgradePlans(paidPlans);
                    if (paidPlans.length === 1) {
                      setSelectedUpgradePlan(paidPlans[0]);
                    }
                    setIsUpgradeModalOpen(true);
                  } catch {
                    toast.error("No se pudieron cargar los planes");
                  } finally {
                    setIsLoadingUpgradePlans(false);
                  }
                }}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {isLoadingUpgradePlans ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Hacer upgrade"
                )}
              </button>
            )}
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

      {isChangingPlan && (
        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Cambiar plan</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Comparar y elegir</h3>
            </div>
            <button
              onClick={() => setIsChangingPlan(false)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Cerrar
            </button>
          </div>

          {currentPrice > 0 && daysRemaining && daysRemaining > 0 && (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
              Tienes {daysRemaining} días restantes de tu plan actual ({currentPlan.name}). Se aplicará el crédito proporcional al nuevo plan.
            </div>
          )}

          {/* Launch Offer Banner */}
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg">
              <Sparkles className="h-3.5 w-3.5" />
              OFERTA DE LANZAMIENTO: $19.990/mes para las primeras 20 personas (Precio regular $25.000)
            </div>
          </div>

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
                          {plan.slug === "pro" && (
                            <p className="mt-1 text-xs font-semibold text-slate-400 line-through">$25.000 / mes</p>
                          )}
                          <p className="mt-1 text-xs text-slate-500">{money(targetPrice)} / mes</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                          {actionLabel}
                        </span>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={async () => {
                            setUpgradingPlanId(plan.id);
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
      )}

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

      {isUpgradeModalOpen && upgradePlans.length > 1 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="fixed inset-0" onClick={() => setIsUpgradeModalOpen(false)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-8 space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-200 mb-4">
                  <Zap className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900">
                  Hacer upgrade
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Selecciona el plan que mejor se adapte a tus necesidades
                </p>
              </div>

              <div className="grid gap-4">
                {upgradePlans.map((plan) => {
                  const isPopular = plan.isPopular;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedUpgradePlan(plan)}
                      className={`relative flex flex-col rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                        isPopular
                          ? "border-indigo-500 shadow-[0_10px_40px_rgba(99,102,241,0.15)]"
                          : selectedUpgradePlan?.id === plan.id
                            ? "border-indigo-400 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow">
                          Más Popular
                        </div>
                      )}
                      <div className={cn("p-4", isPopular && "pt-6")}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn("font-bold text-lg", isPopular ? "text-indigo-700" : "text-slate-900")}>
                              {plan.name}
                            </p>
                            {plan.slug === "pro" && (
                              <p className="text-sm font-semibold text-slate-400 line-through">$25.000 /mes</p>
                            )}
                            <p className="text-2xl font-black text-slate-900">
                              ${Number(plan.price).toLocaleString("es-CL")}
                              <span className="text-sm font-normal text-slate-400">/mes</span>
                            </p>
                          </div>
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                            selectedUpgradePlan?.id === plan.id
                              ? "bg-indigo-600 border-indigo-600"
                              : "border-slate-300"
                          )}>
                            {selectedUpgradePlan?.id === plan.id && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="flex-1 h-12 rounded-xl font-bold border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setIsUpgradeModalOpen(false)}
                  disabled={!selectedUpgradePlan}
                  className="flex-1 h-12 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedUpgradePlan && (
        <TransferPaymentModal
          isOpen={!!selectedUpgradePlan && (isUpgradeModalOpen || true)}
          onClose={() => {
            setSelectedUpgradePlan(null);
            setIsUpgradeModalOpen(false);
          }}
          planId={selectedUpgradePlan.id}
          planName={selectedUpgradePlan.name}
          planPrice={Number(selectedUpgradePlan.price)}
          nutritionistEmail={getCurrentUser()?.email || ""}
          nutritionistName={getCurrentUser()?.nutritionist?.fullName}
          onSuccess={async () => {
            await refreshSubscription();
          }}
        />
      )}
    </div>
  );
}
