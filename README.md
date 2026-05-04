# NutriSaaS

NutriSaaS es una plataforma para nutricionistas. Su foco es acelerar la consulta clínica, organizar pacientes y consultas, crear dietas y recetas, y exportar entregables profesionales con soporte para recursos educativos y catálogos personalizados.

## Qué resuelve

- Gestión de pacientes y consultas clínicas.
- Construcción de dietas y porciones.
- Generación de recetas, carrito y entregable PDF.
- Reutilización de contenidos y recursos educativos.
- Panel admin para soporte, pagos, membresías y peticiones.

## Flujo principal

1. `Dieta`
2. `Recetas y Porciones`
3. `Carrito`
4. `Entregable`

También existe modo independiente para usar módulos sueltos, por ejemplo un entregable rápido, recursos, recetas o creación de contenido sin arrancar un caso clínico completo.

## Cómo está organizado

- `frontend/`: app Next.js 16 con el dashboard y las pantallas de trabajo.
- `backend/`: API NestJS + Prisma con los módulos de dominio.
- `.agent/`: reglas, roadmap, flujos y specs internas del proyecto.

## Dónde leer primero

1. [ARCHITECTURE.md](/Users/juako/Code/nutricion_app/ARCHITECTURE.md)
2. [docs/README.md](/Users/juako/Code/nutricion_app/docs/README.md)
3. [.agent/rules/product-context.md](/Users/juako/Code/nutricion_app/.agent/rules/product-context.md)
4. [.agent/APPLICATION_FLOW.md](/Users/juako/Code/nutricion_app/.agent/APPLICATION_FLOW.md)
5. [.agent/roadmap.md](/Users/juako/Code/nutricion_app/.agent/roadmap.md)

## Documentación por paquete

- [frontend/README.md](/Users/juako/Code/nutricion_app/frontend/README.md)
- [backend/README.md](/Users/juako/Code/nutricion_app/backend/README.md)
- [backend/scripts/README.md](/Users/juako/Code/nutricion_app/backend/scripts/README.md)

## Estado de la documentación

- `README.md`: entrada principal del proyecto.
- `ARCHITECTURE.md`: mapa funcional y técnico de alto nivel.
- `docs/README.md`: índice de documentación.
- `.agent/*`: contexto interno, reglas y roadmap vivo.

## Nota

Si cambias un flujo importante del producto, actualiza también el workflow correspondiente en `.agent/workflows/` para que la documentación operativa no se quede atrás.
