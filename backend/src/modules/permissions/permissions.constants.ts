export const REQUIRED_FEATURES_KEY = 'required_features';

export const SPECIAL_FEATURES = {
  MEMBERSHIP_SELECTED: 'membership.selected',
} as const;

// SEGURIDAD: `ADMIN_ROLES` decide quién entra al panel de administración
// (gestión de usuarios, planes, cupones, testimonios, soporte). `isAdminRole` e
// `isStaffRole` son la ÚNICA barrera de autorización en esos controladores, así
// que sólo pueden estar aquí los roles administrativos reales.
//
// `NUTRITIONIST_DEVELOPER` se retiró a propósito: es una cuenta de nutricionista
// (la UI la muestra como "Nutricionista" y tiene pacientes propios) que sólo
// necesita cuotas ilimitadas para pruebas, no privilegios administrativos.
// Estando aquí podía listar y borrar usuarios y promover cuentas a ADMIN.
// Sus permisos legítimos viven ahora en DEVELOPER_ROLES / hasUnlimitedEntitlements.
export const ADMIN_ROLES = ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'] as const;
export const WORKER_ROLES = ['WORKER'] as const;
export const STAFF_ROLES = [...ADMIN_ROLES, ...WORKER_ROLES] as const;

/** Cuentas de nutricionista con cuotas ilimitadas para desarrollo y pruebas. */
export const DEVELOPER_ROLES = ['NUTRITIONIST_DEVELOPER'] as const;

export type EntitlementValue = boolean | number;
export type EntitlementMap = Record<string, EntitlementValue>;

export const isAdminRole = (role?: string | null) =>
  Boolean(role && ADMIN_ROLES.includes(role as any));

export const isWorkerRole = (role?: string | null) =>
  Boolean(role && WORKER_ROLES.includes(role as any));

export const isStaffRole = (role?: string | null) =>
  Boolean(role && STAFF_ROLES.includes(role as any));

export const isDeveloperRole = (role?: string | null) =>
  Boolean(role && DEVELOPER_ROLES.includes(role as any));

/**
 * Quién no consume cuota de plan: el personal interno y las cuentas developer.
 * Es una decisión de FACTURACIÓN, no de autorización — nunca la uses para
 * decidir si alguien puede entrar al panel de administración.
 */
export const hasUnlimitedEntitlements = (role?: string | null) =>
  isStaffRole(role) || isDeveloperRole(role);

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
