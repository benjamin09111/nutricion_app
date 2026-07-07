# NutriNet File Map (Pattern-based)

## Main Folders
- **App**: `/frontend/src/app` (Next.js Routes)
- **API**: `/backend/src/modules` (NestJS Modules)
- **DB**: `/backend/prisma/schema.prisma` (PostgreSQL)

## Frontend Patterns
- **Routes**: `/frontend/src/app/dashboard/*` (Nutritionist Modules)
- **Admin**: `/frontend/src/app/dashboard/admin` (Restricted)
- **UI Components**: `/frontend/src/components/ui/*.tsx` (Atomic: Button, Card, Badge, Modal, etc.)
- **Layout**: `/frontend/src/components/layout/*.tsx` (Shell, Sidebar, Header)
- **Features**: `/frontend/src/features/*` (Hooks, state, types per feature)
- **Lib**: `/frontend/src/lib/*.ts` (API client, validators, utilities)

## Backend Patterns
- **Modules**: `/backend/src/modules/<name>/*.{service,controller,module}.ts`
- **DTOs**: `/backend/src/modules/<name>/dto/*.dto.ts`
- **AI Prompts**: `/backend/src/modules/<name>/*-ai-prompts.ts`
- **Common**: `/backend/src/common/services/*.ts` (Global services: AiService, CacheService)
- **Auth**: `/backend/src/modules/auth/*.ts` (JWT/Login)
- **Core Data**: `/backend/src/modules/{patients,projects,creations,diet,recipes}/*.ts`

## AI Agent System
- **Agent Identity**: `/.agents/agents.md` (Developer agent definition)
- **Agent Memory**: `/.agents/memory.md` (Cross-session learning)
- **Rules**: `/.agents/rules/` (Development, design, core rules)
- **Context**: `/.agents/context/` (Domain knowledge, architecture, product)
- **Evolution**: `/.agents/evolution/` (Decisions, patterns, proposals)
- **Skills**: `/.agents/skills/` (Specialized on-demand knowledge)
- **Workflows**: `/.agents/workflows/` (Step-by-step procedures)
- **Checks**: `/.agents/checks/` (Preflight and postflight)

## Configs
- **Rules**: `/.agents/` (AI Documentation Framework)
- **Entrypoint**: `/.agents/entrypoint.md` (What to load and when)

*Boundary: Admin vs Nutritionist roles are strictly isolated.*
