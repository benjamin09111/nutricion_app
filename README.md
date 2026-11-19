# NutriNet

NutriNet es una plataforma SaaS para nutricionistas en Chile. El producto automatiza el trabajo clínico diario: pacientes, consultas, dietas, recetas, entregables y herramientas de apoyo.

## Leer primero

1. `NUTRINET_MASTER_DOCUMENT.md` (Documento Maestro Integral: Negocio, Propuesta de Valor, Arquitectura y Agentes)
2. `.agents/rules/core.md`
3. `.agents/AGENTS.md`
4. `docs/README.md`

## Estructura del repo

- `frontend/`: app Next.js 16.
- `backend/`: API NestJS + Prisma.
- `docs/`: documentación técnica y de dominio.
- `.agents/`: reglas y contexto para agentes.

## Flujo clínico principal

1. `Dieta`
2. `Recetas y Porciones`
3. `Carrito`
4. `Entregable`

## Inicio rápido

Puedes levantar ambos servicios simultáneamente desde la raíz del proyecto:

```bash
npm run dev
```

Esto ejecutará concurrentemente:
- **Backend (NestJS)**: `http://localhost:3001` (`npm run start:dev`)
- **Frontend (Next.js)**: `http://localhost:3000` (`npm run dev`)

También puedes trabajar dentro de cada paquete de forma independiente:

```bash
cd frontend
npm install
npm run dev
```

```bash
cd backend
npm install
npm run start:dev
```

## Comandos útiles

- Frontend: `npm run build`, `npm run start`, `npm run lint`
- Backend: `npm run build`, `npm run test`, `npm run test:e2e`, `npm run lint`

## Convenciones del proyecto

- UI en español.
- Código y comentarios en inglés.
- Light mode only.
- Cambios pequeños y modulares.
- No hacer migraciones destructivas.

## Documentación por paquete

- `frontend/README.md`
- `backend/README.md`
- `backend/scripts/README.md`

## Para agentes

Si eres un agente, sigue `.agents/entrypoint.md` antes de modificar código. Si el cambio afecta un flujo clínico o una integración, actualiza también la documentación correspondiente en `docs/`.
