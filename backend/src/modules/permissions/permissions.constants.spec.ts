import {
  ADMIN_ROLES,
  hasUnlimitedEntitlements,
  isAdminRole,
  isDeveloperRole,
  isStaffRole,
} from './permissions.constants';

describe('permissions.constants', () => {
  describe('NUTRITIONIST_DEVELOPER no es un rol administrativo', () => {
    // Regresión: este rol estuvo dentro de ADMIN_ROLES, lo que le daba el panel
    // de administración completo (listar, suspender y borrar usuarios, y
    // promover cuentas a ADMIN) mientras la UI lo mostraba como "Nutricionista".
    it('no aparece en ADMIN_ROLES', () => {
      expect(ADMIN_ROLES).not.toContain('NUTRITIONIST_DEVELOPER' as never);
    });

    it('no pasa isAdminRole ni isStaffRole', () => {
      expect(isAdminRole('NUTRITIONIST_DEVELOPER')).toBe(false);
      expect(isStaffRole('NUTRITIONIST_DEVELOPER')).toBe(false);
    });

    it('sí es un rol developer', () => {
      expect(isDeveloperRole('NUTRITIONIST_DEVELOPER')).toBe(true);
      expect(isDeveloperRole('NUTRITIONIST')).toBe(false);
    });

    it('conserva las cuotas ilimitadas para pruebas', () => {
      expect(hasUnlimitedEntitlements('NUTRITIONIST_DEVELOPER')).toBe(true);
      expect(hasUnlimitedEntitlements('NUTRITIONIST')).toBe(false);
    });
  });

  describe('roles administrativos reales', () => {
    it.each(['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'])(
      '%s conserva privilegios de administrador',
      (role) => {
        expect(isAdminRole(role)).toBe(true);
        expect(isStaffRole(role)).toBe(true);
        expect(hasUnlimitedEntitlements(role)).toBe(true);
      },
    );

    it('WORKER es staff pero no admin', () => {
      expect(isStaffRole('WORKER')).toBe(true);
      expect(isAdminRole('WORKER')).toBe(false);
    });

    it('NUTRITIONIST no es admin ni staff', () => {
      expect(isAdminRole('NUTRITIONIST')).toBe(false);
      expect(isStaffRole('NUTRITIONIST')).toBe(false);
    });

    it.each([undefined, null, '', 'ROL_INVENTADO'])(
      'rechaza el rol %p',
      (role) => {
        expect(isAdminRole(role)).toBe(false);
        expect(isStaffRole(role)).toBe(false);
        expect(hasUnlimitedEntitlements(role)).toBe(false);
      },
    );
  });
});
