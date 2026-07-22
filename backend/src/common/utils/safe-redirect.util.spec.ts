import { resolveSafePostAuthPath } from './safe-redirect.util';

describe('resolveSafePostAuthPath', () => {
  it.each([
    'https://evil.example',
    '//evil.example',
    'javascript:alert(1)',
    '/\\evil.example',
    '/auth/callback',
  ])('rejects unsafe destination %s', (value) => {
    expect(resolveSafePostAuthPath(value)).toBe('/dashboard');
  });

  it('keeps allowed internal destinations', () => {
    expect(resolveSafePostAuthPath('/dashboard/pacientes?tab=activos')).toBe(
      '/dashboard/pacientes?tab=activos',
    );
  });
});
