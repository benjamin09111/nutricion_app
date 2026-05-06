# Plan: Redefine Portal Navigation

## Objetivo
Reestructurar completamente la navegación del Portal del Paciente para simplificarlo a solo 4 secciones principales, e implementar un sistema de Login independiente mediante Email y Código de Acceso.

## Secciones Definidas
1. **Diario**: Espacio para el registro diario del paciente.
2. **Preguntas a tu nutri**: Canal de comunicación y soporte.
3. **Planes entregados**: Listado de PDFs compartidos (Entregables).
4. **Información de tu nutri**: Datos del profesional y perfil básico.

## Cambios en el Código
- Introducir un estado `activeTab` en `PortalClient.tsx`.
- Limpiar el sidebar lateral para mostrar únicamente estas 4 opciones.
- Eliminar la sección de "Recursos/Biblioteca" y "Portada e Introducción".
- Implementar el renderizado condicional del contenido principal basado en la pestaña activa.
- Mantener la estética visual del estándar "Pacientes" aplicada anteriormente.
- **Backend**: Crear endpoint `POST /patient-portals/login` para validación sin token.
- **Frontend**: Crear página `/portal/login` con interfaz premium.

## Pasos de Implementación
1. **Definición de Tabs**: Crear el tipo `Tab` y el estado correspondiente.
2. **Refactor de Sidebar**: Actualizar los botones de navegación para manejar el cambio de estado.
3. **Refactor de Contenido**: Crear sub-componentes o bloques de renderizado para cada pestaña.
4. **Eliminación de Código Obsoleto**: Remover el mapeo de `sharedResources` y los bloques de "Portada".
5. **Backend Login**: Implementar la lógica de búsqueda y validación de invitaciones por email+código.
6. **Frontend Login Page**: Crear la interfaz de acceso en `/portal/login`.
7. **Verificación**: Asegurar que la navegación sea fluida y el login persistente.
