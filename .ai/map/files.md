# NutriNet File Map (Pattern-based)

## Main Folders
- **App**: /frontend/src/app (Next.js Routes)
- **API**: /backend/src/modules (NestJS Modules)
- **DB**: /backend/prisma/schema.prisma (PostgreSQL)

## Frontend Patterns
- **Routes**: /frontend/src/app/dashboard/* (Nutritionist Modules)
- **Admin**: /frontend/src/app/dashboard/admin (Restricted)
- **UI**: /frontend/src/components/ui/*.tsx (Atomic)
- **Layout**: /frontend/src/components/layout/*.tsx (Shell)
- **Logic**: /frontend/src/lib/*.ts (Validators/APIs/Utils)

## Backend Patterns
- **Modules**: /backend/src/modules/<name>/*.{service,controller,module}.ts
- **Auth**: /backend/src/modules/auth/*.ts (JWT/Login)
- **Data**: /backend/src/modules/{patients,projects,creations}/*.ts (Core Clinical)

## Configs
- **Rules**: /.ai/ (AI Documentation Framework)
- **Global**: AGENTS.md | ARCHITECTURE.md | STRATEGIC_PLAN.md

*Boundary: Admin vs Nutritionist roles are strictly isolated.*
