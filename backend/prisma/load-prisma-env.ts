import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env');

export function loadPrismaEnv() {
  const runtimeNodeEnv = process.env.NODE_ENV;

  if (fs.existsSync(envPath)) {
    const lines = fs
      .readFileSync(envPath, 'utf-8')
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const value =
        rawValue.length >= 2 &&
        ((rawValue.startsWith('"') && rawValue.endsWith('"')) ||
          (rawValue.startsWith("'") && rawValue.endsWith("'")))
          ? rawValue.slice(1, -1)
          : rawValue;

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }

  const isProduction = ['production', 'prod'].includes(
    (runtimeNodeEnv || process.env.NODE_ENV || '').toLowerCase(),
  );
  if (isProduction) {
    throw new Error(
      'Prisma seed and maintenance scripts are disabled in production. Use reviewed migrations for production changes.',
    );
  }

  const databaseUrl = process.env.DATABASE_URL_DEV;
  const directUrl = process.env.DIRECT_URL_DEV || databaseUrl;
  if (!databaseUrl || !directUrl) {
    throw new Error(
      'DATABASE_URL_DEV and DIRECT_URL_DEV are required for development Prisma scripts.',
    );
  }
  process.env.DATABASE_URL = databaseUrl;
  process.env.DIRECT_URL = directUrl;
}
