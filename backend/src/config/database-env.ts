const isProductionEnvironment = () =>
  ['production', 'prod'].includes((process.env.NODE_ENV || '').toLowerCase());

export function configureDatabaseEnvironment() {
  if (isProductionEnvironment()) {
    return;
  }

  const databaseUrl = process.env.DATABASE_URL_DEV;
  const directUrl = process.env.DIRECT_URL_DEV || databaseUrl;

  if (!databaseUrl || !directUrl) {
    throw new Error(
      'DATABASE_URL_DEV and DIRECT_URL_DEV are required outside production. Refusing to use the production database.',
    );
  }

  process.env.DATABASE_URL = databaseUrl;
  process.env.DIRECT_URL = directUrl;
}
