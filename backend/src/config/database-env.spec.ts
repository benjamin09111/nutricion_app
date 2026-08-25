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
    process.env.DATABASE = 'dev';
    process.env.DATABASE_URL = 'postgresql://production';
    process.env.DIRECT_URL = 'postgresql://production-direct';
    process.env.DATABASE_URL_DEV = 'postgresql://development';
    process.env.DIRECT_URL_DEV = 'postgresql://development-direct';

    configureDatabaseEnvironment();

    expect(process.env.DATABASE_URL).toBe('postgresql://development');
    expect(process.env.DIRECT_URL).toBe('postgresql://development-direct');
  });

  it('refuses to fall back to production when development is selected', () => {
    process.env.DATABASE = 'dev';
    delete process.env.DATABASE_URL_DEV;
    delete process.env.DIRECT_URL_DEV;

    expect(() => configureDatabaseEnvironment()).toThrow(
      'DATABASE_URL_DEV and DIRECT_URL_DEV are required',
    );
  });

  it('preserves production URLs when production is selected', () => {
    process.env.DATABASE = 'prod';
    process.env.DATABASE_URL = 'postgresql://production';
    process.env.DIRECT_URL = 'postgresql://production-direct';
    process.env.DATABASE_URL_DEV = 'postgresql://development';
    process.env.DIRECT_URL_DEV = 'postgresql://development-direct';

    configureDatabaseEnvironment();

    expect(process.env.DATABASE_URL).toBe('postgresql://production');
    expect(process.env.DIRECT_URL).toBe('postgresql://production-direct');
  });

  it('requires production URLs when production is selected', () => {
    process.env.DATABASE = 'prod';
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_URL;

    expect(() => configureDatabaseEnvironment()).toThrow(
      'DATABASE_URL and DIRECT_URL are required when DATABASE=prod',
    );
  });

  it.each([undefined, '', 'staging'])(
    'rejects invalid selector %p',
    (value) => {
      if (value === undefined) {
        delete process.env.DATABASE;
      } else {
        process.env.DATABASE = value;
      }

      expect(() => configureDatabaseEnvironment()).toThrow(
        'DATABASE must be explicitly set to dev or prod',
      );
    },
  );
});
