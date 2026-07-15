"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown, ShieldCheck, Sparkles, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/context/SubscriptionContext";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Modal } from "@/components/ui/Modal";
import { TransferPaymentModal } from "@/components/pagos/TransferPaymentModal";
import { membershipService, type MembershipPlan } from "@/features/memberships/services/membership.service";
import { getMembershipFeatureDisplay } from "@/features/memberships/utils/feature-format";
import { syncMembershipToStoredUser } from "@/lib/membership-session";
import { goToDashboard } from "@/lib/membership-navigation";
import { getCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";

type AttributeRow = {
  key: string;
  label: string;
  value: boolean | number;
};

const formatEntitlementValue = (value: boolean | number) => {
  if (typeof value === "boolean") {
    return value ? "Sí" : "—";
  }

  if (value < 0) {
    return "Ilimitado";
  }

  return value > 0 ? "Sí" : "—";
};

const getPlanAttributeRows = (
  plan?: Pick<MembershipPlan, "features" | "entitlements"> | null,
): AttributeRow[] => {
  const featureRows = (plan?.features ?? [])
    .map((feature, index) => {
      const display = getMembershipFeatureDisplay(feature);

      return {
        key: `feature-${index}-${display.label}`,
        label: display.label,
        value: display.isExcluded ? false : true,
      };
    })
    .filter((row) => row.label.length > 0);

  if (featureRows.length > 0) {
    return featureRows;
  }

  return Object.entries(plan?.entitlements ?? {})
    .map(([key, value]) => ({
      key,
      label: key
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      value,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "es-CL"));
};

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

export function MembershipPlanSection({
  autoOpenChangePlan = false,
}: {
  autoOpenChangePlan?: boolean;
}) {
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
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<MembershipPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [pendingPaidPlan, setPendingPaidPlan] = useState<MembershipPlan | null>(null);
  const [hasAutoOpenedChangePlan, setHasAutoOpenedChangePlan] = useState(false);

  const currentPrice = Number(currentPlan?.price || 0);
  const canChangePlan = currentPrice === 0;
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
        label: "Consultas consumidas",
        usage: usage?.consultationsUsed ?? 0,
        limit: currentPlan?.entitlements?.["consultations.monthly.limit"],
      },
      {
        label: "PDFs consumidos",
        usage: usage?.pdfUsed ?? 0,
        limit: currentPlan?.entitlements?.["pdf.monthly.limit"],
      },
      {
        label: "Seguimientos privados activos",
        usage: usage?.followupsPrivateActive ?? 0,
        limit: currentPlan?.entitlements?.["followups.private.active.limit"],
      },
      {
        label: "Calculadora clínica",
        usage: usage?.calculatorUsed ?? 0,
        limit: currentPlan?.entitlements?.["clinical_calculator.limit"],
      },
      {
        label: "IA consumida",
        usage: usage?.aiUsed ?? 0,
        limit: currentPlan?.entitlements?.["ai.calls.limit"],
      },
    ],
    [currentPlan?.entitlements, usage],
  );

  const featureRows = useMemo(
    () => getPlanAttributeRows(currentPlan),
    [currentPlan],
  );

  const loadAvailablePlans = async () => {
    setIsChangingPlan(true);
    setIsLoadingPlans(true);
    try {
      const plans = await membershipService.getActivePlans();
      setAvailablePlans(
        plans.filter((p) => {
          if (p.id === currentPlan?.id) return false;
          const planKey = String(p.slug || p.name || "").toLowerCase();
          return planKey === "free" || planKey === "pro";
        }),
      );
    } catch {
      toast.error("No se pudieron cargar los planes");
    } finally {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    if (autoOpenChangePlan && !hasAutoOpenedChangePlan) {
      setHasAutoOpenedChangePlan(true);
      void loadAvailablePlans();
    }
  }, [autoOpenChangePlan, hasAutoOpenedChangePlan]);

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
      : "Prueba sin renovación";

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-indigo-100 bg-linear-to-br from-white via-white to-indigo-50/40 p-6 lg:p-8 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-2">
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
                  {currentPrice > 0
                    ? `${money(currentPrice)} / mes · Próximo cobro ${nextPaymentLabel}`
                    : "Prueba gratuita · Esto no se renueva automáticamente"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-stretch gap-3">
            <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Días restantes</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{daysRemaining ?? "-"}</p>
            </div>
            <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vence</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(subscriptionEndsAt?.toISOString() || null)}</p>
            </div>
            <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monto próximo</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{renewalText}</p>
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
          {currentPrice === 0 && (
            <p className="mt-4 text-xs text-amber-700">
              Tu plan gratis es una prueba sin renovación automática. Cada uso queda registrado hasta agotar el límite.
            </p>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Acciones</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">Gestión de suscripción</h3>
              </div>
              <button
              onClick={loadAvailablePlans}
              disabled={!canChangePlan}
              className="rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none bg-indigo-600 hover:bg-indigo-700 text-white"
              >
              {canChangePlan ? "Cambiar mi plan" : "Plan ya activo"}
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
            <h3 className="mt-1 text-lg font-bold text-slate-900">Atributos del plan</h3>
          </div>
        </div>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Incluidas</p>
            {featureRows
              .filter((f) => {
                if (typeof f.value === "boolean") return f.value === true;
                if (typeof f.value === "number") return f.value > 0;
                return false;
              })
              .map((feature) => (
                <div key={feature.key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-2.5">
                  <span className="text-sm font-medium text-slate-700">{feature.label}</span>
                  <span className="text-sm font-semibold text-emerald-700">{formatEntitlementValue(feature.value)}</span>
                </div>
              ))}
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">No incluidas</p>
            {featureRows
              .filter((f) => {
                if (typeof f.value === "boolean") return f.value === false;
                if (typeof f.value === "number") return f.value === 0;
                return true;
              })
              .map((feature) => (
                <div key={feature.key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5">
                  <span className="text-sm font-medium text-slate-500">{feature.label}</span>
                  <span className="text-sm font-semibold text-slate-400">—</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isChangingPlan}
        onClose={() => { setIsChangingPlan(false); setSelectedPlan(null); }}
        closeOnEscape
        closeOnBackdropClick
        className="max-w-4xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">Cambiar de plan</h3>
            <p className="text-sm text-slate-500 mt-1">Selecciona el plan que se ajuste a tus necesidades</p>
          </div>
        </div>

        {isLoadingPlans ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : availablePlans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No hay otros planes disponibles.</p>
          </div>
        ) : (
          <>
            {currentPrice > 0 && daysRemaining && daysRemaining > 0 && (
              <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                Tienes {daysRemaining} días restantes de tu plan actual ({currentPlan.name}). Se aplicará el crédito proporcional al nuevo plan.
              </div>
            )}

            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              OFERTA DE LANZAMIENTO: $19.990/mes para las primeras 20 personas (Precio regular $25.000)
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mi plan actual</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-slate-900">{currentPlan.name}</p>
                    <p className="text-sm text-slate-500">{currentPrice > 0 ? money(currentPrice) : "Gratuito"} /mes</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {featureRows.slice(0, 5).map((feature) => (
                    <div key={feature.key} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-slate-600">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {availablePlans.map((plan) => {
                const isPopular = plan.isPopular;
                const planFeatureRows = getPlanAttributeRows(plan);

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "rounded-2xl border-2 p-6 transition-all",
                      isPopular
                        ? "border-indigo-500 shadow-[0_10px_40px_rgba(99,102,241,0.15)] bg-white"
                        : "border-indigo-200 bg-indigo-50/50"
                    )}
                  >
                    {isPopular && (
                      <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold px-3 py-1 mb-4">
                        <Sparkles className="h-3 w-3" />
                        Más Popular
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Nuevo plan</span>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        isPopular ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-600"
                      )}>
                        <Crown className="h-6 w-6" />
                      </div>
                      <div>
                        <p className={cn("font-bold text-lg", isPopular ? "text-indigo-700" : "text-slate-900")}>
                          {plan.name}
                        </p>
                        <div className="flex items-baseline gap-2">
                          {plan.slug === "pro" && (
                            <p className="text-sm font-semibold text-slate-400 line-through">$25.000</p>
                          )}
                          <p className={cn("font-black text-xl", isPopular ? "text-indigo-600" : "text-slate-900")}>
                            ${Number(plan.price).toLocaleString("es-CL")}
                            <span className="text-sm font-normal text-slate-400">/mes</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mb-6">
                      {planFeatureRows.slice(0, 5).map((feature) => (
                        <div key={feature.key} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-indigo-500 shrink-0" />
                          <span className="text-slate-600">{feature.label}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        const targetPrice = Number(plan.price || 0);

                        if (targetPrice === 0) {
                          try {
                            const result = await membershipService.selectFreePlan(plan.id);
                            syncMembershipToStoredUser(result.membershipStatus, plan);
                            toast.success(`Cambiado a ${plan.name}`);
                            await refreshSubscription();
                            setIsChangingPlan(false);
                            setSelectedPlan(null);
                            goToDashboard();
                          } catch (e: any) {
                            toast.error(e?.message || "Error al cambiar plan");
                          }
                          return;
                        }

                        setIsChangingPlan(false);
                        setPendingPaidPlan(plan);
                      }}
                      className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg transition-all cursor-pointer"
                    >
                      Cambiar mi plan mensual
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
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

      {pendingPaidPlan && (
        <TransferPaymentModal
          isOpen={!!pendingPaidPlan}
          onClose={() => {
            setPendingPaidPlan(null);
            setSelectedPlan(null);
          }}
          planId={pendingPaidPlan.id}
          planName={pendingPaidPlan.name}
          planPrice={Number(pendingPaidPlan.price)}
          currentPlanName={currentPlan.name}
          currentPlanPrice={currentPrice}
          nutritionistEmail={getCurrentUser()?.email || ""}
          nutritionistName={getCurrentUser()?.nutritionist?.fullName}
          onSuccess={async () => {
            setPendingPaidPlan(null);
            setSelectedPlan(null);
            await refreshSubscription();
          }}
        />
      )}
    </div>
  );
}


