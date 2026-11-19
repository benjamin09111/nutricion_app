/**
 * Reorders membership plans for the landing page:
 * 1. Freemium plan (price === 0) ALWAYS on the far left.
 * 2. Paid / Popular plans in the middle / right.
 * 3. Coming Soon plans (isComingSoon === true) ALWAYS on the far right.
 */
export function sortPlansForLanding<T extends { price?: number; isPopular?: boolean; isComingSoon?: boolean; displayOrder?: number; slug?: string }>(
  plans: T[]
): T[] {
  if (!plans || plans.length <= 1) return plans;

  return [...plans].sort((a, b) => {
    // 1. Freemium (slug free) always first on the left
    const aIsFree = (a.slug || "").toLowerCase().includes("free");
    const bIsFree = (b.slug || "").toLowerCase().includes("free");
    if (aIsFree && !bIsFree) return -1;
    if (!aIsFree && bIsFree) return 1;

    // 2. Plan Pack / Clínicas o Coming Soon always last on the far right
    const aIsPack = (a.slug || "").toLowerCase().includes("pack") || a.isComingSoon;
    const bIsPack = (b.slug || "").toLowerCase().includes("pack") || b.isComingSoon;
    if (aIsPack && !bIsPack) return 1;
    if (!aIsPack && bIsPack) return -1;

    // 3. Popular / Paid plans in the middle
    if (a.isPopular && !b.isPopular) return -1;
    if (!a.isPopular && b.isPopular) return 1;

    // 4. Fallback to displayOrder or price
    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || (Number(a.price || 0) - Number(b.price || 0));
  });
}

/**
 * Legacy alias for backwards compatibility
 */
export function sortPlansWithPopularInCenter<T extends { price?: number; isPopular?: boolean; isComingSoon?: boolean; displayOrder?: number; slug?: string }>(
  plans: T[]
): T[] {
  return sortPlansForLanding(plans);
}
