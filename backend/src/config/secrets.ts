const MIN_SECRET_LENGTH = 32;

const REQUIRED_SECRETS = [
  'JWT_SECRET',
  'PORTAL_JWT_SECRET',
  'ENCRYPTION_KEY',
  'OAUTH_STATE_SECRET',
] as const;

const FORBIDDEN_VALUES = new Set([
  'secret',
  'changeme',
  'test',
  'dev',
  'password',
]);

export function assertSecretsConfigured(env: NodeJS.ProcessEnv = process.env) {
  const problems: string[] = [];

  for (const key of REQUIRED_SECRETS) {
    const value = env[key];
    if (!value) {
      problems.push(`${key} no está definida`);
      continue;
    }
    if (value.length < MIN_SECRET_LENGTH) {
      problems.push(
        `${key} debe tener al menos ${MIN_SECRET_LENGTH} caracteres`,
      );
    }
    if (FORBIDDEN_VALUES.has(value.toLowerCase())) {
      problems.push(`${key} usa un valor de ejemplo inseguro`);
    }
  }

  if (env.PORTAL_JWT_SECRET && env.PORTAL_JWT_SECRET === env.JWT_SECRET) {
    problems.push('PORTAL_JWT_SECRET debe ser distinto de JWT_SECRET');
  }

  if (problems.length > 0) {
    throw new Error(
      `Configuración de secretos inválida:\n  - ${problems.join('\n  - ')}\n` +
        'Genera valores con: openssl rand -base64 48',
    );
  }
}
