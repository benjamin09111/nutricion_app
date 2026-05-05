# Plan: Refactor Portal UX (Standard "Pacientes")

## Objetivo
Refactorizar el Portal del Paciente (`PortalClient.tsx`) para cumplir con el estándar visual de la plataforma (basado en el módulo de Pacientes). Esto implica suavizar la tipografía, reducir el uso de letras negras pesadas (`font-black`), optimizar el espacio y reordenar la navegación.

## Alcance
- **Archivo**: `frontend/src/app/portal/[token]/PortalClient.tsx`
- **Estándares**: `pacientes-visual-standard.md`, `product-context.md`.

## Cambios Visuales y Estructurales
1. **Tipografía**: Reemplazar `font-black` por `font-semibold` o `font-medium` en la mayoría de los textos. Reducir tamaños de fuente excesivos (`text-4xl`, `text-5xl`).
2. **Paleta de Colores**: Priorizar `indigo` como acento principal, `verde/emerald` para estados positivos y `ivory` como superficie terciaria. Eliminar el fondo `bg-emerald-600` dominante por algo más sutil.
3. **Navegación (Sidebar del Portal)**:
   - Implementar un sistema de navegación más estructurado (tipo sidebar o tabs claras).
   - **Orden solicitado**: 
     1. **Biblioteca** (Recursos compartidos).
     2. **Mis recursos** (Entregables/PDFs compartidos).
     3. **Portada e Introducción** (Mensaje de bienvenida y resumen, con icono de candado si es contenido base).
4. **Cards y Superficies**: Usar el estilo de cards del dashboard (bordes sutiles `slate-100`, fondos blancos, sombras suaves).
5. **Responsividad**: Asegurar que el nuevo layout sea totalmente responsive (mobile-first).

## Pasos de Implementación
1. **Limpieza de Tipografía**: Recorrer el archivo y suavizar los pesos de fuente.
2. **Refactor de Layout**: 
   - Cambiar el Header para que sea más ligero.
   - Reemplazar el Hero dominante por un saludo más cálido y limpio.
   - Agrupar el contenido en las secciones solicitadas.
3. **Reordenamiento**: Mover los bloques de código para que la jerarquía visual siga el orden Biblioteca -> Mis recursos -> Portada e Introducción.
4. **Pulido**: Ajustar espaciados y alineaciones (especialmente en filtros si hubiera).

## Verificación
- `npm run lint` en el frontend.
- Validación visual de que no hay "div soup" y se usa HTML semántico.
- Confirmar que el código de acceso sigue funcionando correctamente (normalización).
