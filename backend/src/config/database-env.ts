export function configureDatabaseEnvironment() {
  const selectedDatabase = (process.env.DATABASE || '').trim().toLowerCase();

  if (selectedDatabase === 'prod') {
    if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
      throw new Error(
        'DATABASE_URL and DIRECT_URL are required when DATABASE=prod.',
      );
    }

    return;
  }

  if (selectedDatabase !== 'dev') {
    throw new Error('DATABASE must be explicitly set to dev or prod.');
  }

  const databaseUrl = process.env.DATABASE_URL_DEV;
  const directUrl = process.env.DIRECT_URL_DEV || databaseUrl;

  if (!databaseUrl || !directUrl) {
    throw new Error(
      'DATABASE_URL_DEV and DIRECT_URL_DEV are required when DATABASE=dev. Refusing to use the production database.',
    );
  }

  process.env.DATABASE_URL = databaseUrl;
  process.env.DIRECT_URL = directUrl;
}
