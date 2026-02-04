---
name: documentation-standards
description: Guide for maintaining professional, up-to-date documentation in Spanish. Defines where and how to document architecture, workflows, API endpoints, and onboarding for new developers.
---

# Estándares de Documentación y Mantenimiento de Conocimiento

Esta skill define cómo mantener el proyecto documentado de forma continua, asegurando que cualquier nuevo desarrollador pueda entender el sistema, su arquitectura orgánica y el rol del Agente AI en el desarrollo.

## 1. El "Source of Truth" (La Fuente de Verdad)

La documentación no es algo que se hace "al final". Es parte del "Definition of Done".

### Archivos Clave
- **`README.md` (Raíz)**: La puerta de entrada. Debe contener:
  - Qué es el proyecto (Business Goal).
  - Tech Stack (Next.js, NestJS, Supabase, etc).
  - **AI-Driven Development**: Explicación explícita de que este proyecto es co-desarrollado con un Agente AI y cómo interactuar con él (reglas, skills).
  - Setup Guide: Pasos exactos para levantar el entorno (`npm install`, variables de entorno requeridas).
  
- **`ARCHITECTURE.md` (Docs)**: Diagramas y explicaciones de alto nivel.
  - Flujo de datos.
  - Modelo de db (referencia a Schema).
  - Integraciones externas.

- **`CHANGELOG.md`**: Registro de hitos importantes (no commits individuales, sino "Features Completadas").

## 2. Documentación "Just-in-Time"

Cuando se desarrolla una funcionalidad **IMPORTANTE** (ej: un nuevo módulo de negocio, cambio de base de datos, integración de pagos), se debe actualizar la documentación.

**Criterio de "Importante"**:
- ¿Cambia la arquitectura? -> Actualizar `ARCHITECTURE.md`.
- ¿Requiere nuevas variables de entorno? -> Actualizar `README.md` y `.env.example`.
- ¿Introduce un nuevo flujo de usuario complejo? -> Crear/Actualizar un diagrama o guía en `/docs`.

## 3. Comentarios en Código (TSDoc)

El código debe ser auto-explicativo, pero las **decisiones de negocio** deben documentarse.

- **SÍ**: Explicar por qué se eligió una lógica compleja ("Usamos este algoritmo de búsqueda porque X").
- **NO**: Explicar qué hace la sintaxis ("Itera sobre el array").
- Usar JSDoc/TSDoc para servicios y funciones públicas.

## 4. Onboarding para Nuevos Desarrolladores

El `README.md` debe tener una sección explícita "Guía para Desarrolladores Nuevos":
1. Clona el repo.
2. Instala dependencias.
3. Configura las ENV Vars (link a la lista de variables).
4. **Cómo trabajar con el Agente**: Explicar que existe una carpeta `.agent` que contiene el cerebro del proyecto y que se deben respetar las reglas allí definidas.

## 5. El Rol del Agente

Documentar explícitamente en el proyecto que gran parte de la base de código sigue estándares definidos en `.agent/rules`.

> "Este proyecto utiliza estándares estrictos gestionados por un Agente AI. Antes de modificar arquitectura crítica, consulta las reglas en `.agent/rules/global.md`."

## 6. Mantenimiento Automático

Al finalizar hitos grandes, el Agente debe revisar:
1. ¿El README sigue siendo cierto?
2. ¿Hay variables de entorno nuevas no documentadas?
3. ¿Se eliminó alguna tecnología obsoleta?
