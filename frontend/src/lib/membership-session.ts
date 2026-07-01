import type { MembershipActivationSnapshot } from "@/features/memberships/services/membership.service";
import { getCurrentUser, setCurrentUser } from "@/lib/current-user";

export function syncMembershipToStoredUser(
  snapshot: MembershipActivationSnapshot | null,
  plan: { id: string; name: string; slug: string },
) {
  const user = getCurrentUser();
  if (!user) return;

  user.plan = snapshot?.accountPlan || user.plan || "FREE";
  user.planName = plan.name;
  user.currentPlan = snapshot?.currentPlan || user.currentPlan || null;
  user.currentPlanKey = snapshot?.currentPlan?.key || user.currentPlanKey || null;
  user.subscription = snapshot?.subscription || user.subscription || null;
  user.entitlements = snapshot?.entitlements || user.entitlements || {};
  user.usage = snapshot?.usage || user.usage || null;
  user.billing = snapshot?.billing || user.billing || null;
  user.requiresPlanSelection = snapshot?.requiresPlanSelection ?? false;
  user.membershipSelected = true;
  setCurrentUser(user);
}
