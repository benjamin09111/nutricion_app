import {
  resolveSafePostAuthPath,
  resolveSafeRelativePath,
} from './safe-redirect.util';

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

describe('resolveSafeRelativePath', () => {
  it.each([
    'https://evil.example',
    '//evil.example',
    'javascript:alert(1)',
    '/\\evil.example',
    '',
    undefined,
  ])('rejects unsafe destination %s', (value) => {
    expect(resolveSafeRelativePath(value)).toBe('/');
  });

  it('keeps any internal path, without an allow-list', () => {
    expect(resolveSafeRelativePath('/dashboard/configuraciones?tab=plan')).toBe(
      '/dashboard/configuraciones?tab=plan',
    );
    expect(resolveSafeRelativePath('/portal/me')).toBe('/portal/me');
  });

  it('honours a custom fallback', () => {
    expect(resolveSafeRelativePath('//evil.example', '/dashboard')).toBe(
      '/dashboard',
    );
  });
});
