import { assertSecretsConfigured } from './secrets';

const validSecrets = () => ({
  JWT_SECRET: 'jwt-secret-with-at-least-32-characters-1234',
  PORTAL_JWT_SECRET: 'portal-secret-with-at-least-32-characters-1234',
  ENCRYPTION_KEY: 'encryption-secret-with-at-least-32-characters',
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
    env.ENCRYPTION_KEY = 'secret';

    expect(() => assertSecretsConfigured(env)).toThrow('valor de ejemplo');
  });

  it('rejects reusing the account secret for the portal', () => {
    const env = validSecrets();
    env.PORTAL_JWT_SECRET = env.JWT_SECRET;

    expect(() => assertSecretsConfigured(env)).toThrow(
      'PORTAL_JWT_SECRET debe ser distinto',
    );
  });
});
