# Backend Utility Scripts

This directory contains various utility and maintenance scripts for the NutriSaaS backend.

## Usage

These scripts are intended to be run from the backend root directory (`nutricion_app/backend`).

### TypeScript Scripts
Run using `ts-node`:
```bash
npx ts-node scripts/<script-name>.ts
```

### JavaScript Scripts
Run using `node`:
```bash
node scripts/<script-name>.js
```

## Description of Scripts

- **check-admins.ts**: Queries the database to list all users with `ADMIN_MASTER` or `ADMIN_GENERAL` roles. Useful for verifying admin access.
- **check-env.js**: Checks if critical environment variables (like `DATABASE_URL`) are loaded correctly.
- **test-metrics.ts**: A standalone script to test metric calculation logic without starting the full NestJS application.
- **update-admin-role.ts**: Updates a specific user (e.g., `admin@nutrisaas.com`) to a specific role. **Use with caution.**

## Note
Ensure your `.env` file is present in the backend root before running these scripts as they rely on environment variables for database connections.
