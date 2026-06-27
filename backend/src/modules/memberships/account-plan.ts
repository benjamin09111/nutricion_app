import { SubscriptionPlan } from '@prisma/client';

export const resolveAccountPlanFromMembershipPlan = (
  slug?: string | null,
): SubscriptionPlan => {
  const normalized = (slug || '').toLowerCase();

  if (normalized.includes('free')) {
    return SubscriptionPlan.FREE;
  }

  if (normalized.includes('enterprise')) {
    return SubscriptionPlan.ENTERPRISE;
  }

  return SubscriptionPlan.PRO;
};
