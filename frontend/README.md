# Frontend

Frontend de NutriNet construido con Next.js 16, React, TypeScript y Tailwind.

## Qué cubre

- Landing pública.
- Login y autenticación.
- Dashboard clínico.
- Pacientes, consultas, dieta, recetas, carrito y entregable.
- Recursos, creaciones, platos y panel admin.

## Desarrollo

```bash
npm run dev
```

Otros comandos:

```bash
npm run build
npm run start
npm run lint
```

## Estructura útil

- `src/app/`: rutas y páginas.
- `src/components/`: UI compartida.
- `src/features/`: lógica por dominio.
- `src/content/`: contenido estático en JSON.
- `src/lib/`: helpers y utilidades.
- `src/context/`: estado global de UI.

## Rutas principales

- `/`
- `/login`
- `/dashboard`
- `/dashboard/pacientes`
- `/dashboard/consultas`
- `/dashboard/dieta`
- `/dashboard/recetas`
- `/dashboard/carrito`
- `/dashboard/entregable`
- `/dashboard/creaciones`
- `/dashboard/recursos`
- `/dashboard/platos`
- `/dashboard/admin`

## Documentación relacionada

- [../README.md](../README.md)
- [../docs/README.md](../docs/README.md)
