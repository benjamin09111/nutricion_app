import { configureDatabaseEnvironment } from './database-env';

describe('configureDatabaseEnvironment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('maps development URLs to Prisma standard variables', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://production';
    process.env.DIRECT_URL = 'postgresql://production-direct';
    process.env.DATABASE_URL_DEV = 'postgresql://development';
    process.env.DIRECT_URL_DEV = 'postgresql://development-direct';

    configureDatabaseEnvironment();

    expect(process.env.DATABASE_URL).toBe('postgresql://development');
    expect(process.env.DIRECT_URL).toBe('postgresql://development-direct');
  });

  it('refuses to fall back to production outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.DATABASE_URL_DEV;
    delete process.env.DIRECT_URL_DEV;

    expect(() => configureDatabaseEnvironment()).toThrow(
      'DATABASE_URL_DEV and DIRECT_URL_DEV are required',
    );
  });

  it('preserves production URLs in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://production';
    process.env.DIRECT_URL = 'postgresql://production-direct';
    process.env.DATABASE_URL_DEV = 'postgresql://development';
    process.env.DIRECT_URL_DEV = 'postgresql://development-direct';

    configureDatabaseEnvironment();

    expect(process.env.DATABASE_URL).toBe('postgresql://production');
    expect(process.env.DIRECT_URL).toBe('postgresql://production-direct');
  });
});
