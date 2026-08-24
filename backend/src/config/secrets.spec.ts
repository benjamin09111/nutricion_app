import { assertSecretsConfigured } from './secrets';

const validSecrets = () => ({
  JWT_SECRET: 'jwt-secret-with-at-least-32-characters-1234',
  PORTAL_JWT_SECRET: 'portal-secret-with-at-least-32-characters-1234',
  OAUTH_STATE_SECRET: 'oauth-secret-with-at-least-32-characters-12',
});

describe('assertSecretsConfigured', () => {
  it('accepts complete independent secrets', () => {
    expect(() => assertSecretsConfigured(validSecrets())).not.toThrow();
  });

  it('rejects missing secrets', () => {
    const env: NodeJS.ProcessEnv = validSecrets();
    env.PORTAL_JWT_SECRET = undefined;

    expect(() => assertSecretsConfigured(env)).toThrow('PORTAL_JWT_SECRET');
  });

  it('rejects short secrets', () => {
    const env = validSecrets();
    env.JWT_SECRET = 'too-short';

    expect(() => assertSecretsConfigured(env)).toThrow('JWT_SECRET');
  });

  it('rejects forbidden example values', () => {
    const env = validSecrets();
    env.OAUTH_STATE_SECRET = 'secret';

    expect(() => assertSecretsConfigured(env)).toThrow('valor de ejemplo');
  });

  it('no exige ENCRYPTION_KEY: ningún módulo la lee todavía', () => {
    const env: NodeJS.ProcessEnv = validSecrets();
    delete env.ENCRYPTION_KEY;

    expect(() => assertSecretsConfigured(env)).not.toThrow();
  });

  it('rejects reusing the account secret for the portal', () => {
    const env = validSecrets();
    env.PORTAL_JWT_SECRET = env.JWT_SECRET;

    expect(() => assertSecretsConfigured(env)).toThrow(
      'PORTAL_JWT_SECRET debe ser distinto',
    );
  });
});
