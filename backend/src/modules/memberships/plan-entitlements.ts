export type PlanEntitlements = Record<string, boolean | number>;

export const PLAN_ENTITLEMENT_KEYS = {
  PATIENTS_ACTIVE_LIMIT: 'patients.active.limit',
  CONSULTATIONS_MONTHLY_LIMIT: 'consultations.monthly.limit',
  PDF_MONTHLY_LIMIT: 'pdf.monthly.limit',
  FOLLOWUPS_PRIVATE_ACTIVE_LIMIT: 'followups.private.active.limit',
  INGREDIENTS_BASE_READ: 'ingredients.base.read',
  CLINICAL_CALCULATOR_ACCESS: 'clinical_calculator.access',
  FOOD_GROUPS_ACCESS: 'food_groups.access',
  AI_CALLS_LIMIT: 'ai.calls.limit',
  AI_AUTOFILL_ACCESS: 'ai.autofill.access',
  APPOINTMENTS_ACCESS: 'appointments.access',
  GOOGLE_CALENDAR_SYNC: 'google_calendar.sync',
  NUTRITIONIST_PORTAL_ACCESS: 'nutritionist_portal.access',
  SII_INVOICES_ACCESS: 'sii_invoices.access',
} as const;

export const MEMBERSHIP_PLAN_ENTITLEMENTS: Record<string, PlanEntitlements> = {
  free: {
    [PLAN_ENTITLEMENT_KEYS.PATIENTS_ACTIVE_LIMIT]: 3,
    [PLAN_ENTITLEMENT_KEYS.CONSULTATIONS_MONTHLY_LIMIT]: 5,
    [PLAN_ENTITLEMENT_KEYS.PDF_MONTHLY_LIMIT]: 5,
    [PLAN_ENTITLEMENT_KEYS.FOLLOWUPS_PRIVATE_ACTIVE_LIMIT]: 2,
    [PLAN_ENTITLEMENT_KEYS.INGREDIENTS_BASE_READ]: true,
    [PLAN_ENTITLEMENT_KEYS.CLINICAL_CALCULATOR_ACCESS]: false,
    [PLAN_ENTITLEMENT_KEYS.FOOD_GROUPS_ACCESS]: false,
    [PLAN_ENTITLEMENT_KEYS.AI_CALLS_LIMIT]: 10,
    [PLAN_ENTITLEMENT_KEYS.AI_AUTOFILL_ACCESS]: false,
    [PLAN_ENTITLEMENT_KEYS.APPOINTMENTS_ACCESS]: false,
    [PLAN_ENTITLEMENT_KEYS.GOOGLE_CALENDAR_SYNC]: false,
    [PLAN_ENTITLEMENT_KEYS.NUTRITIONIST_PORTAL_ACCESS]: false,
    [PLAN_ENTITLEMENT_KEYS.SII_INVOICES_ACCESS]: false,
  },
  iniciante: {
    [PLAN_ENTITLEMENT_KEYS.PATIENTS_ACTIVE_LIMIT]: 30,
    [PLAN_ENTITLEMENT_KEYS.CONSULTATIONS_MONTHLY_LIMIT]: 60,
    [PLAN_ENTITLEMENT_KEYS.PDF_MONTHLY_LIMIT]: 30,
    [PLAN_ENTITLEMENT_KEYS.FOLLOWUPS_PRIVATE_ACTIVE_LIMIT]: 2,
    [PLAN_ENTITLEMENT_KEYS.INGREDIENTS_BASE_READ]: true,
    [PLAN_ENTITLEMENT_KEYS.CLINICAL_CALCULATOR_ACCESS]: true,
    [PLAN_ENTITLEMENT_KEYS.FOOD_GROUPS_ACCESS]: true,
    [PLAN_ENTITLEMENT_KEYS.AI_CALLS_LIMIT]: 20,
    [PLAN_ENTITLEMENT_KEYS.AI_AUTOFILL_ACCESS]: false,
    [PLAN_ENTITLEMENT_KEYS.APPOINTMENTS_ACCESS]: false,
    [PLAN_ENTITLEMENT_KEYS.GOOGLE_CALENDAR_SYNC]: false,
    [PLAN_ENTITLEMENT_KEYS.NUTRITIONIST_PORTAL_ACCESS]: false,
    [PLAN_ENTITLEMENT_KEYS.SII_INVOICES_ACCESS]: false,
  },
  pro: {
    [PLAN_ENTITLEMENT_KEYS.PATIENTS_ACTIVE_LIMIT]: -1,
    [PLAN_ENTITLEMENT_KEYS.CONSULTATIONS_MONTHLY_LIMIT]: -1,
    [PLAN_ENTITLEMENT_KEYS.PDF_MONTHLY_LIMIT]: -1,
    [PLAN_ENTITLEMENT_KEYS.FOLLOWUPS_PRIVATE_ACTIVE_LIMIT]: -1,
    [PLAN_ENTITLEMENT_KEYS.INGREDIENTS_BASE_READ]: true,
    [PLAN_ENTITLEMENT_KEYS.CLINICAL_CALCULATOR_ACCESS]: true,
    [PLAN_ENTITLEMENT_KEYS.FOOD_GROUPS_ACCESS]: true,
    [PLAN_ENTITLEMENT_KEYS.AI_CALLS_LIMIT]: -1,
    [PLAN_ENTITLEMENT_KEYS.AI_AUTOFILL_ACCESS]: true,
    [PLAN_ENTITLEMENT_KEYS.APPOINTMENTS_ACCESS]: true,
    [PLAN_ENTITLEMENT_KEYS.GOOGLE_CALENDAR_SYNC]: true,
    [PLAN_ENTITLEMENT_KEYS.NUTRITIONIST_PORTAL_ACCESS]: true,
    [PLAN_ENTITLEMENT_KEYS.SII_INVOICES_ACCESS]: true,
  },
};

export const getMembershipPlanEntitlements = (slug: string) =>
  MEMBERSHIP_PLAN_ENTITLEMENTS[slug.toLowerCase()] || {};

export const normalizeMembershipPlanKey = (value: string) => {
  const normalized = value.trim().toLowerCase();

  if (normalized.includes('free') || normalized.includes('gratis'))
    return 'free';
  if (normalized.includes('iniciante') || normalized.includes('starter'))
    return 'iniciante';
  if (normalized.includes('pro') || normalized.includes('premium'))
    return 'pro';

  return normalized;
};

export const getMembershipPlanKey = (plan: {
  name?: string | null;
  slug?: string | null;
}) => normalizeMembershipPlanKey(plan.slug || plan.name || '');

export const getMembershipPlanEntitlementsFromPlan = (plan: {
  name?: string | null;
  slug?: string | null;
}) => MEMBERSHIP_PLAN_ENTITLEMENTS[getMembershipPlanKey(plan)] || {};
