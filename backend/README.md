# Backend

Backend de NutriNet construido con NestJS, Prisma y PostgreSQL.

## Qué cubre

- Autenticación y cuentas.
- Pacientes y consultas.
- Catálogo de alimentos.
- Recetas, dietas y sustitutos.
- Recursos, creaciones y proyectos.
- Soporte, requests, pagos, membresías y métricas.

## Desarrollo

```bash
npm install
npm run start:dev
```

Otros comandos:

```bash
npm run build
npm run test
npm run test:e2e
npm run lint
```

## Rutas de dominio

- `auth`
- `users`
- `patients`
- `consultations`
- `foods`
- `recipes`
- `diet`
- `creations`
- `resources`
- `projects`
- `requests`
- `support`
- `payments`
- `memberships`
- `metrics`
- `substitutes`
- `ingredient-groups`
- `tags`
- `uploads`

## Datos y seguridad

- PostgreSQL + Prisma.
- `Project` actúa como contenedor del flujo clínico.
- `Patient`, `Consultation`, `Creation` y `Resource` concentran gran parte del dominio.
- Antes de tocar migraciones o entornos, revisa `../.agents/rules/core.md`.

## Documentación relacionada

- [../README.md](../README.md)
- [../docs/README.md](../docs/README.md)
- [scripts/README.md](scripts/README.md)
