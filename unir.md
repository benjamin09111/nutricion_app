# Plan de implementación: unificar Pautas en Rápido

## Objetivo

Eliminar `/dashboard/pautas` como módulo independiente y consolidar sus capacidades en `/dashboard/rapido`, evitando duplicación y confusión para el nutricionista.

Las creaciones históricas de tipo `PAUTAS` mantendrán compatibilidad permanente: deberán poder abrirse, editarse, importarse, descargarse y compartirse desde el módulo rápido. No se realizará una migración destructiva de datos.

## Alcance funcional

- Incorporar una restricción clínica opcional en la información general.
- Ofrecer dos formatos de contenido: `Párrafos de pauta` y `Tabla de comidas`.
- Incorporar recursos educativos con los orígenes `Automático`, `Importar` y `Manual`.
- Mostrar `Automático` solo si existe una restricción clínica seleccionada.
- Preservar las funciones existentes de entregable rápido: tabla diaria/semanal, alimentos a evitar, guía de porciones, paciente, IA, guardado, importación, proyectos, PDF y portal del paciente.

## Implementación

1. Definir un contrato único de entregable en `/dashboard/rapido`.
   - Modelar un modo de contenido para `paragraphs` y `table`.
   - Conservar los datos de comidas, alimentos a evitar, guía de porciones, paciente y recursos.
   - Incorporar los datos de párrafos: categorías, porciones, alimentos e imágenes.
   - Incorporar la restricción clínica y el origen del recurso educativo.

2. Actualizar `frontend/src/app/dashboard/rapido/QuickDeliverableClient.tsx`.
   - Agregar en información general la pregunta: `¿El paciente tiene una restricción alimenticia y de salud?`.
   - Mostrar el selector y buscador de restricción solo al confirmar la pregunta.
   - Mantener el flujo rápido sin restricción cuando la respuesta sea negativa.
   - Incluir la restricción seleccionada en el contexto de IA cuando exista.
   - Reemplazar el paso actual de comidas por un selector entre `Párrafos de pauta` y `Tabla de comidas`.
   - Reutilizar la edición de categorías, porciones, alimentos, imágenes y la generación IA de párrafos desde pautas.
   - Conservar la tabla rápida diaria y semanal existente.

3. Unificar el paso de recursos educativos.
   - Agregar un selector de origen: `Automático`, `Importar` y `Manual`.
   - Mostrar `Automático` solo con una restricción clínica seleccionada.
   - Resolver recursos automáticos usando los aliases clínicos y recursos del sistema existentes.
   - Mantener en `Importar` el catálogo de recursos, filtros, búsqueda y reemplazo de variables del paciente.
   - Permitir en `Manual` redactar contenido y guardarlo como recurso reutilizable.
   - Persistir el origen, contenido final, recurso de referencia y variables resueltas para conservar el resultado al reabrir una creación.

4. Mantener persistencia y compatibilidad.
   - Guardar las nuevas creaciones como `FAST_DELIVERABLE` con su modo de contenido.
   - Permitir que `/dashboard/rapido` cargue `FAST_DELIVERABLE` y `PAUTAS` mediante un adaptador de formato.
   - El adaptador debe preservar párrafos, imágenes, restricción, alimentos a evitar y contenido educativo de las pautas históricas.
   - Consolidar los borradores `nutri_quick_deliverable_draft` y `nutri_pauta_alimentacion_draft` sin pérdida de datos ni colisiones.
   - Actualizar carga por `creationId`, carga desde `project`, importación, guardado, reinicio y dirty tracking.

5. Unificar exportación PDF.
   - Extender `frontend/src/features/pdf/FastDeliverablePdfDocument.tsx` para renderizar tabla o párrafos de pauta según el modo elegido.
   - Mostrar restricción clínica, alimentos a evitar, guía de porciones y recursos educativos cuando correspondan.
   - Centralizar la descarga en `frontend/src/features/pdf/fastDeliverablePdfExport.ts` y conservar el consumo de cuota PDF del módulo rápido.
   - Adaptar las descargas desde Creaciones y el Portal del Paciente para exportar también las `PAUTAS` históricas con el documento consolidado.

6. Mantener las pautas históricas accesibles.
   - Actualizar `frontend/src/app/dashboard/creaciones/CreationsClient.tsx` para reconocer `PAUTAS` como entregable compatible y abrirlo en `/dashboard/rapido?creationId=...`.
   - Actualizar `frontend/src/components/shared/ImportCreationModal.tsx` para permitir importar ambos tipos desde rápido.
   - Actualizar los tipos compartidos en `frontend/src/lib/workflow.ts` y componentes relacionados.
   - Actualizar el Portal del Paciente para descargar entregables históricos `PAUTAS`.
   - Actualizar el filtro de `backend/src/modules/patient-portals/patient-portals.service.ts` para incluir `PAUTAS` entre los entregables compartibles.

7. Retirar el módulo duplicado tras completar la integración.
   - Quitar `Pautas de Alimentación` de `frontend/src/components/layout/Sidebar.tsx`.
   - Eliminar `frontend/src/app/dashboard/pautas/`.
   - Eliminar el exportador y documento PDF exclusivos de pautas cuando el PDF consolidado cubra ambos formatos.
   - Mantener el endpoint `POST /pautas/ai-generate` mientras sea usado por la generación de párrafos desde rápido. Su renombre o consolidación técnica se evaluará después, sin cambiar el comportamiento clínico.

## Validación

1. Crear, guardar, reabrir, importar y exportar entregables rápidos en ambos formatos.
2. Confirmar que `Automático` aparece solo al seleccionar una restricción clínica y que resuelve el recurso correcto.
3. Confirmar que `Importar` y `Manual` mantienen contenido y variables al guardar y reabrir.
4. Abrir una creación histórica `PAUTAS` desde Creaciones y verificar edición, PDF, importación y portal del paciente.
5. Verificar que los borradores previos de rápido y pautas no se pierdan.
6. Ejecutar lint, build y las pruebas de frontend y backend relevantes antes de dar por terminada la implementación.
