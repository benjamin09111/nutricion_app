"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/context/SubscriptionContext";
import { syncMembershipToStoredUser } from "@/lib/membership-session";
import {
  membershipService,
  type MembershipPlan,
} from "@/features/memberships/services/membership.service";

export function DeveloperPlanSwitcher() {
  const { isDeveloper, currentPlan, refreshSubscription } = useSubscription();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (!isDeveloper) return;

    let alive = true;
    setIsLoadingPlans(true);

    membershipService
      .getActivePlans()
      .then((data) => {
        if (alive) setPlans(data);
      })
      .catch(() => toast.error("No se pudieron cargar los planes de QA"))
      .finally(() => {
        if (alive) setIsLoadingPlans(false);
      });

    return () => {
      alive = false;
    };
  }, [isDeveloper]);

  const handleChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const planId = event.target.value;
    if (!planId || planId === currentPlan?.id) return;

    setIsSwitching(true);
    try {
      const result = await membershipService.devChangePlan(planId);
      syncMembershipToStoredUser(result.membershipStatus || null, result.plan);
      await refreshSubscription();
      const planName = result.plan?.name || "plan";
      toast.success(`QA: ahora estás en ${planName}`);
      window.location.reload();
    } catch (error) {
      console.error("Error changing developer plan:", error);
      toast.error("No se pudo cambiar el plan de QA");
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isDeveloper) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
        Dev
      </span>
      <label className="sr-only" htmlFor="dev-plan-switcher">
        Cambiar plan de QA
      </label>
      <select
        id="dev-plan-switcher"
        value={currentPlan?.id || ""}
        onChange={handleChange}
        disabled={isLoadingPlans || isSwitching || plans.length === 0}
        className={cn(
          "min-w-[9rem] rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none transition-colors",
          "cursor-pointer focus:border-amber-400 focus:ring-2 focus:ring-amber-200",
          (isLoadingPlans || isSwitching || plans.length === 0) &&
            "cursor-not-allowed opacity-70",
        )}
      >
        {plans.length === 0 ? (
          <option value="">Cargando planes...</option>
        ) : (
          plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
