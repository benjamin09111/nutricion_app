# NutriNet

NutriNet es una plataforma SaaS para nutricionistas en Chile. El producto automatiza el trabajo clínico diario: pacientes, consultas, dietas, recetas, entregables y herramientas de apoyo.

## Leer primero

1. `.agents/rules/core.md`
2. `.agents/entrypoint.md`
3. `.agents/context/product.md`
4. `.agents/context/architecture.md`
5. `docs/README.md`

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

No hay `package.json` en el root. Trabaja dentro de cada paquete:

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
