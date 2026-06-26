export const REQUIRED_FEATURES_KEY = 'required_features';

export const SPECIAL_FEATURES = {
  MEMBERSHIP_SELECTED: 'membership.selected',
} as const;

export const ADMIN_ROLES = ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'] as const;
export const WORKER_ROLES = ['WORKER'] as const;
export const STAFF_ROLES = [...ADMIN_ROLES, ...WORKER_ROLES] as const;

export type EntitlementValue = boolean | number;
export type EntitlementMap = Record<string, EntitlementValue>;

export const isAdminRole = (role?: string | null) =>
  Boolean(role && ADMIN_ROLES.includes(role as any));

export const isWorkerRole = (role?: string | null) =>
  Boolean(role && WORKER_ROLES.includes(role as any));

export const isStaffRole = (role?: string | null) =>
  Boolean(role && STAFF_ROLES.includes(role as any));

export const normalizeEntitlementMap = (value: unknown): EntitlementMap => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.entries(
    value as Record<string, unknown>,
  ).reduce<EntitlementMap>((acc, [key, raw]) => {
    if (typeof raw === 'boolean' || typeof raw === 'number') {
      acc[key] = raw;
    }
    return acc;
  }, {});
};
