# Confirmed Technical Patterns

Patrones estables aprobados para reducir decision fatigue en desarrollo futuro.

## Frontend

### UI & Forms
- **Validation**: React Hook Form + Zod para todos los formularios
- **Schemas**: Colocalizados en `frontend/src/lib/validators/` o en la carpeta del feature
- **Form state**: useForm con zodResolver. No usar useState para campos de formulario

### API & Data Fetching
- **Centralizacion**: Todas las llamadas HTTP via `frontend/src/lib/api.ts` (cliente API compartido)
- **Server state**: TanStack Query v5 (useQuery para GET, useMutation para POST/PUT/DELETE)
- **Invalidacion**: invalidateQueries despues de mutaciones que modifican datos
- **Cache**: staleTime configurado por query, no cache global excesivo

### Organizacion de Features
- **Pattern**: `src/features/[feature]/` con hooks, types, utils colocalizados
- **Page entry**: `app/dashboard/[feature]/page.tsx` (server component ligero) + `[Feature]Client.tsx` (client component con logica)
- **Nombrado**: hooks con prefijo `use` (useRecipesState), clients con sufijo `Client` (DietClient)

### Componentes UI
- **Atomicos**: `components/ui/` para botones, inputs, cards, badges, modales, etc.
- **Layout**: `components/layout/` para sidebar, header, shell
- **Nombrado**: PascalCase para componentes, camelCase para hooks/utils

## Backend

### NestJS Modules
- **Un modulo por dominio**: PatientsModule, DietModule, RecipesModule, etc.
- **Service-as-Repository**: La logica de negocio vive en services. Los controllers solo delegan.
- **DTOs**: class-validator + class-transformer para validacion estricta de inputs
- **Global providers**: solo via `CommonModule` (@Global). No duplicar providers entre modulos.

### AI Integration
- **AiService**: unico punto de entrada para llamadas LLM. Provider-agnostic via fallback chain.
- **Prompts**: colocalizados con el modulo que los usa (recipes-ai-prompts.ts, pautas-ai-prompts.ts)
- **Quota**: PlanUsageService.consumeMonthlyQuota() antes de cada llamada AI

### Prisma & Database
- **Schema**: unico archivo `prisma/schema.prisma`
- **Migraciones**: control manual, nunca automaticas
- **JSONB**: para datos clinicos variables (Creation.content, Patient.dietRestrictions)
- **Relacional**: para FK, identidad, campos de busqueda frecuente

### Auth & Security
- **JWT**: passport-jwt + @nestjs/jwt
- **Guards**: AuthGuard + PermissionsGuard en endpoints protegidos
- **IDOR prevention**: validar que el recurso pertenece al usuario autenticado

## Proyecto

### Monorepo
- **Sin workspace manager**: frontend/ y backend/ son proyectos independientes
- **Scripts separados**: `npm run dev` en frontend (puerto 3000) y `npm run start:dev` en backend (puerto 3001)
- **No shared packages**: no hay `packages/shared/` ni tipos compartidos entre frontend y backend

### AI Documentation Framework
- **agents.md**: identidad y reglas del agente desarrollador (SIEMPRE cargar)
- **memory.md**: aprendizaje cross-sesion (SIEMPRE cargar, ESCRIBIR automaticamente)
- **rules/**: reglas de desarrollo y diseno
- **context/**: conocimiento del dominio (glosario, arquitectura, modulos)
- **evolution/**: decisiones, patrones, propuestas
- **skills/**: conocimiento especializado on-demand
