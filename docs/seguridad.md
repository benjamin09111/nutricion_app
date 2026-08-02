# Sistema de seguridad de NutriNet

## Estado

La plataforma aplica controles de mínimo privilegio para sesiones, portal de pacientes,
datos clínicos y endpoints públicos. Los secretos críticos se validan antes de iniciar NestJS.

## Sesión y autenticación

- Las sesiones de cuenta usan cookies `httpOnly`, `Secure` en producción y `SameSite=Lax`.
- El JWT real no se persiste en `localStorage`.
- El callback OAuth usa tickets temporales de un solo uso; el JWT no viaja en la URL.
- Las sesiones del portal usan `PORTAL_JWT_SECRET` independiente y expiran en 7 días.
- El guard del portal revalida invitación, estado, revocación y expiración en cada solicitud.

## Portal de pacientes

- Los códigos son aleatorios de 8 dígitos y se almacenan únicamente como hash `scrypt` con sal.
- Los códigos no se derivan de identificadores de paciente o nutricionista.
- Cinco fallos bloquean la invitación durante 15 minutos; diez fallos la bloquean definitivamente.
- Los códigos pueden rotarse desde `POST /patient-portals/patients/:patientId/access-code/rotate`.
- Los endpoints de login, verificación y rotación tienen límites dedicados por IP.
- La reemisión masiva usa `backend/prisma/reissue-portal-codes.ts` durante el despliegue.

## Autorización y auditoría

- JWT de cuenta validado por NestJS; el rol efectivo se resuelve desde la base de datos.
- Los módulos clínicos validan ownership mediante `nutritionistId`.
- Las lecturas clínicas marcadas registran actor, rol, recurso, paciente, IP, user-agent y fecha.
- `GET /audit/patients/:patientId` está restringido a `ADMIN_MASTER`.
- La auditoría no registra cuerpos ni contenido clínico y no expone endpoints de edición o borrado.

## Transporte y límites

- `helmet()` y CORS con lista blanca están activos.
- La protección CSRF bloquea métodos inseguros cross-site no autorizados.
- Login, registro, verificación, portal, intake público, reservas, interés público y soporte tienen límites explícitos.
- Los webhooks de pago deben validar firma; no se consideran protegidos únicamente por rate limiting.

## Secretos

Variables obligatorias, con mínimo 32 caracteres, generadas con:

```bash
openssl rand -base64 48
```

`PORTAL_JWT_SECRET` debe ser distinto de `JWT_SECRET`. El proceso falla al arrancar si falta
un secreto, es corto o usa valores de ejemplo.

## Pendientes P2

- MFA TOTP obligatorio para roles administrativos.
- Almacenamiento privado S3/R2 para archivos clínicos con URLs firmadas y magic bytes.
- Política de sesión y revocación explícita para staff.

Estos controles requieren definir proveedor de almacenamiento, migración de archivos existentes
y flujo UX de enrolamiento MFA antes de activarlos en producción.
