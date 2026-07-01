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
- Ver [../SAFE_MODE.md](/Users/juako/Code/nutricion_app/SAFE_MODE.md) antes de tocar migraciones o entornos.

## Documentación relacionada

- [../README.md](/Users/juako/Code/nutricion_app/README.md)
- [../ARCHITECTURE.md](/Users/juako/Code/nutricion_app/ARCHITECTURE.md)
- [../docs/README.md](/Users/juako/Code/nutricion_app/docs/README.md)
- [scripts/README.md](/Users/juako/Code/nutricion_app/backend/scripts/README.md)
