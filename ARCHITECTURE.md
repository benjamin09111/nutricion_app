# NutriNet Architecture

Este documento resume la arquitectura funcional y técnica actual del proyecto. La idea es separar con claridad lo que ya existe, lo que está parcial y lo que sigue en roadmap.

## 1. Producto

NutriNet es un SaaS para nutricionistas. El objetivo es reducir trabajo manual en consulta clínica, centralizar pacientes y consultas, y producir entregables profesionales con contenido reutilizable.

## 2. Flujo Principal

El flujo principal visible en el producto es:

1. `Dieta`
2. `Recetas y Porciones`
3. `Carrito`
4. `Entregable`

El sistema también soporta uso por módulos, por ejemplo:

- crear recetas sin arrancar un caso completo,
- reutilizar creaciones guardadas,
- editar recursos educativos,
- trabajar con pacientes y consultas de forma independiente.

## 3. Frontend

El frontend vive en `frontend/` y usa Next.js App Router.

### Zonas principales

- `dashboard/`: shell principal del producto.
- `dashboard/pacientes`: CRM clínico.
- `dashboard/consultas`: consultas y seguimiento.
- `dashboard/dieta`: armado de dieta base.
- `dashboard/recetas`: porciones y recetas.
- `dashboard/carrito`: lista de compra.
- `dashboard/entregable`: exportación final.
- `dashboard/recursos`: base de conocimiento y contenido reutilizable.
- `dashboard/creaciones`: artefactos guardados.
- `dashboard/platos`: platos/recetas reutilizables.
- `dashboard/admin`: panel administrativo.

### UI shell

- Sidebar principal con módulos clínicos y herramientas.
- Sidebar admin separado.
- Modo mobile con drawer.
- Tema claro/oscuro.

## 4. Backend

El backend vive en `backend/` y usa NestJS con Prisma.

### Dominios ya presentes

- `auth`: login, creación de cuenta, recuperación de contraseña.
- `users`: gestión de cuentas y planes.
- `patients`: pacientes, filtros, exámenes.
- `consultations`: historia clínica y seguimiento.
- `foods`: catálogo de alimentos y preferencias.
- `recipes`: recetas, compatibilidad, autofill con IA.
- `diet`: validación de alimentos contra restricciones.
- `creations`: artefactos guardados.
- `resources`: biblioteca de contenido y variables.
- `projects`: orquestación del flujo clínico.
- `requests`: peticiones de acceso/registro.
- `support`: feedback y soporte.
- `payments` y `memberships`: parte comercial.
- `metrics`: métricas clínicas o de negocio.
- `substitutes`, `tags`, `ingredient-groups`, `uploads`: soporte de dominio.

### Endpoints clave

- `GET /patients`
- `GET /consultations`
- `GET /foods`
- `GET /recipes`
- `POST /diet/verify-foods`
- `GET /resources`
- `GET /creations`
- `GET /projects`
- `GET /dashboard/stats`

## 5. Datos

La base de datos es PostgreSQL con Prisma.

### Entidades core

- `Account`: cuenta base de acceso.
- `Nutritionist`: perfil profesional.
- `Patient`: ficha del paciente.
- `Consultation`: consulta clínica.
- `PatientExam`: exámenes del paciente.
- `Creation`: artefacto reusable.
- `Project`: contenedor del flujo de trabajo.
- `Ingredient`: catálogo de alimentos/ingredientes.

### Idea de diseño

- Campos rígidos para identidad, relaciones y estado.
- `Json` para contenido flexible, borradores y estructuras dinámicas.
- `Project` como ancla del flujo entre paciente, dieta, recetas, carrito y entregable.

## 6. Qué está Implementado vs Qué Está en Visión

### Implementado o visible en código

- Gestión de pacientes, consultas, recursos, creaciones, recetas y catálogo.
- Panel admin.
- Orquestación por proyectos.
- Validación de dieta contra restricciones.

### Parcial o en evolución

- Generación completa de dieta asistida por IA.
- Carrito con equivalentes avanzados.
- Entregable final totalmente unificado.
- Automatizaciones más pesadas con IA o jobs.

### Roadmap

- Agentes conversacionales.
- Integración con supermercados.
- WhatsApp/push.
- Inteligencia de precios más amplia.

## 7. Documentación Relacionada

- [README.md](/Users/juako/Code/nutricion_app/README.md)
- [docs/README.md](/Users/juako/Code/nutricion_app/docs/README.md)
- [.agent/rules/product-context.md](/Users/juako/Code/nutricion_app/.agent/rules/product-context.md)
- [.agent/APPLICATION_FLOW.md](/Users/juako/Code/nutricion_app/.agent/APPLICATION_FLOW.md)
- [.agent/roadmap.md](/Users/juako/Code/nutricion_app/.agent/roadmap.md)
