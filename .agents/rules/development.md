# Reglas de Desarrollo

## Reutilizacion de Componentes
- Antes de crear un componente nuevo, verificar si ya existe en `frontend/src/components/`
- Usar componentes de `components/ui/` siempre que sea posible (Button, Card, Badge, Modal, Input, Select, etc.)
- No duplicar logica que ya existe en `frontend/src/lib/` o `frontend/src/features/`
- Si un componente similar existe, extenderlo en vez de crear uno nuevo

## Organizacion de Archivos
```
frontend/
├── src/app/dashboard/[feature]/page.tsx    ← lightweight entry point (server component)
├── src/app/dashboard/[feature]/[Feature]Client.tsx ← client logic + UI
├── src/features/[feature]/                 ← hooks, state, types colocalizados
├── src/components/ui/                      ← componentes atomicos compartidos (Button, Card, etc.)
├── src/components/layout/                  ← shell, sidebar, header
├── src/lib/                                ← utilidades, validators, api client

backend/
├── src/modules/[domain]/                   ← NestJS module por dominio
│   ├── [domain].controller.ts
│   ├── [domain].service.ts
│   ├── [domain].module.ts
│   └── dto/
└── src/common/                             ← servicios globales, interceptors, middleware
```

## Convenciones de Codigo

### Frontend
- **Forms**: React Hook Form + Zod. Schemas en `frontend/src/lib/validators/`
- **API calls**: todos via `frontend/src/lib/api.ts` o TanStack Query hooks
- **Estado servidor**: TanStack Query v5 (useQuery, useMutation)
- **Estado local**: useState, useReducer. Evitar estado global innecesario
- **Toasts**: sonner (toast.success, toast.error, toast.info)
- **Iconos**: exclusivamente lucide-react
- **Modales**: siempre `ConfirmationModal`, nunca HTML nativo

### Backend
- **Patron**: Service-as-Repository. La logica vive en services, no en controllers
- **DTOs**: class-validator + class-transformer para validacion estricta
- **Global providers**: registrar en CommonModule (@Global) solo servicios cross-cutting
- **Modulos**: un dominio = un modulo. Importar solo lo necesario
- **JSONB**: usar para contenido flexible (Creation.content, Patient.dietRestrictions). Relacional para FK e identidad

## Estructura de Archivos
- Preferir **muchos archivos pequenos y cohesivos** sobre uno grande
- Si un archivo mezcla concerns (fetch + state + render + transform), dividirlo
- Nombres descriptivos: `useDietState.ts`, `QuickRecipesClient.tsx`, no `utils.ts`
- Hooks: prefijo `use` (useRecipesState, usePatientData)
- Tipos: `interfaces/` o colocalizados en el feature

## Imports y Dependencias
- No imports circulares
- No barrel exports excesivos que causen side effects
- imports relativos dentro del mismo modulo, alias `@/` desde fuera
- No instalar nuevas dependencias sin preguntar

## Lo que NO hacer
- No crear componentes wrapper si el original ya sirve
- No modificar `package.json` sin preguntar
- No ejecutar `npx prisma migrate` sin permiso explicito
- No modificar archivos de configuracion (`.env`, `tsconfig`, `next.config`) sin preguntar
- No hacer refactors no solicitados
- No renombrar variables, archivos o terminologia clinica sin preguntar
