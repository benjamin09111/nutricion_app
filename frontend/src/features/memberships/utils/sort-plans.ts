import type { MembershipPlan } from "../services/membership.service";

/**
 * Reorders membership plans so that the most recommended plan (`isPopular === true`)
 * is ALWAYS placed in the exact center (or as close to the middle as possible).
 */
export function sortPlansWithPopularInCenter<T extends { isPopular?: boolean; displayOrder?: number }>(
  plans: T[],
): T[] {
  if (!plans || plans.length <= 1) return plans;

  // First sort by displayOrder if present
  const sorted = [...plans].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const popularIndex = sorted.findIndex((p) => p.isPopular);
  if (popularIndex === -1) return sorted;

  const popularPlan = sorted[popularIndex];
  const otherPlans = sorted.filter((_, idx) => idx !== popularIndex);

  // Calculate target middle index
  const middleIndex = Math.floor(otherPlans.length / 2);

  const result = [...otherPlans];
  result.splice(middleIndex, 0, popularPlan);

  return result;
}
