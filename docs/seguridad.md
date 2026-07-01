# Sistema de seguridad de NutriNet

## Objetivo
Proteger datos de salud, sesiones y accesos administrativos con un enfoque de mínimo privilegio y reducción de exposición en cliente.

## Controles aplicados

### Sesión y autenticación
- Inicio de sesión solo por Google.
- La sesión real viaja en cookie `auth_token_http` con `HttpOnly`, `Secure` y `SameSite=Lax`.
- El frontend usa `auth_token` solo como marcador legible para validar estado de sesión.
- El frontend ya no guarda el JWT en `localStorage`.
- El snapshot de usuario se mantiene en cookie `user` y no en `localStorage` en los flujos principales.
- Se usa un ticket temporal de un solo uso para completar el callback de Google sin exponer el JWT en la URL.
- `fetchApi` envía cookies con `credentials: include`.

### Autorización
- JWT validado por NestJS con extracción desde cookie o `Authorization`.
- Guardas de autenticación y validación de ownership por `nutritionistId` en módulos clínicos.
- Endpoints de pagos y membresías restringidos a roles admin.
- `ApiKeyGuard` de citas ahora valida secreto real o JWT válido.

### Transporte y navegador
- `helmet()` activo.
- CORS limitado a orígenes permitidos.
- Logs HTTP con redacción de parámetros sensibles.
- No se persiste el JWT en `localStorage`.

### Secretos
- Boot falla si faltan secretos críticos como `JWT_SECRET` o `ENCRYPTION_KEY`.
- `ENCRYPTION_KEY`, `APPOINTMENTS_API_KEY`, `PORTAL_JWT_SECRET` y `PORTAL_ACCESS_CODE_SECRET` quedan documentados en `.env.example`.

### Auditoría y privacidad
- Se evita registrar tokens en URLs.
- Los flujos públicos de paciente siguen usando tokens hasheados en base de datos.
- El frontend conserva solo datos de UI no sensibles donde todavía sea necesario, pero la sesión ya no depende de `localStorage`.

## Estado actual
- Cubierto: sesión Google segura, cookies protegidas, CORS, headers, logs, roles admin, citas.
- Pendiente: migrar los últimos accesos de UI que aún leen `user` desde almacenamiento cliente y unificar rate limiting por endpoint sensible.
