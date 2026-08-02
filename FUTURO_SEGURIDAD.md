# Seguridad futura de NutriNet

Este documento registra mejoras de seguridad planificadas que no son necesarias para la
operación actual, pero deben completarse antes de trabajar con pacientes reales o escalar
la plataforma.

## MFA administrativo

- Implementar MFA TOTP obligatorio para `ADMIN`, `ADMIN_GENERAL` y `ADMIN_MASTER`.
- Agregar enrolamiento, códigos de recuperación y renovación segura del secreto.
- Rechazar sesiones administrativas sin MFA habilitado, salvo las rutas de enrolamiento.
- Incorporar la pantalla de configuración y el desafío MFA al inicio de sesión.

## Archivos clínicos

- Migrar uploads desde disco local a S3, Cloudflare R2 u otro almacenamiento privado.
- Usar claves de objeto aleatorias sin relación con el nombre original.
- Validar archivos mediante magic bytes, no solo por extensión o MIME declarado.
- Entregar archivos mediante URLs firmadas de corta duración.
- Autorizar cada descarga usando ownership del paciente y registrar la descarga en auditoría.
- Migrar de forma controlada los archivos existentes antes de desactivar el almacenamiento local.

## Sesiones de staff

- Usar una duración de sesión administrativa menor que la de nutricionistas.
- Implementar revocación explícita mediante `tokenVersion` o tabla de sesiones.
- Invalidar sesiones al cambiar contraseña, rol o estado de la cuenta.
- Incorporar un listado de sesiones activas y cierre remoto.

## Dependencias

La auditoría actual reporta vulnerabilidades en dependencias transitivas y directas. Antes de
producción con datos reales:

- Ejecutar `npm audit` en backend y frontend.
- Actualizar NestJS, `express-rate-limit`, `multer`, `handlebars` y dependencias relacionadas.
- Revisar especialmente `xlsx`, que actualmente reporta vulnerabilidades sin solución automática.
- Evaluar reemplazar librerías sin parche disponible.
- Mantener el workflow `.github/workflows/security.yml` como gate de integración.

## Operación y monitoreo

- Configurar alertas ante picos de accesos clínicos.
- Alertar sobre bloqueos repetidos del portal.
- Alertar ante creación o modificación de cuentas administrativas.
- Formalizar el registro de tratamiento de datos y el procedimiento de notificación de brechas.
- Realizar una prueba de penetración externa antes de admitir pacientes reales.

## Estado actual

Los controles críticos de secretos, portal, auditoría y límites de tasa ya están implementados.
La reemisión de códigos del portal fue ejecutada y no encontró pacientes activos.
