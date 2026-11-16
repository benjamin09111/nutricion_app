# Analítica de producto y actividad

NutriNet registra actividad técnica y de producto para mejorar la demo, detectar
errores y saber qué módulos utilizan las cuentas autenticadas y las sesiones
invitadas.

## Qué se registra

- Vistas de ruta (`page_view`) y salida de ruta (`page_exit`).
- Duración aproximada de permanencia.
- Evento, módulo y ruta normalizada.
- Cuenta autenticada cuando existe, o un identificador anónimo de sesión.
- Fecha, rol y actividad reciente agregada.

## Qué nunca se registra

No se envían a PostHog ni se incluyen en los eventos: nombres de pacientes,
RUT, correos de pacientes, diagnósticos, peso, altura, consultas, dietas,
recetas, notas clínicas, tokens, query strings ni contenido de formularios.

La ruta se normaliza y los identificadores dinámicos se reemplazan por `:id` o
`:token`. El registro interno utiliza `AuditLog` y sólo el personal autorizado
puede consultar el resumen en `/dashboard/admin/analitica`.

## PostHog

PostHog es opcional. Para activarlo en backend se configuran únicamente:

```env
POSTHOG_API_KEY=...
POSTHOG_HOST=...
```

Si faltan las variables, NutriNet conserva el registro interno y no realiza
ninguna llamada externa. Nunca se debe colocar `POSTHOG_API_KEY` en el frontend.

## Panel administrador

La vista **Analítica de uso** muestra eventos, usuarios activos, sesiones
invitadas, tiempo medio, rutas, eventos, actividad diaria, módulos sin uso y
actividad reciente. Los datos son operativos y no sustituyen una auditoría
clínica ni un sistema de seguridad.

## CI/CD

`.github/workflows/ci.yml` ejecuta Prisma generate, tests y build del backend,
además de lint y build del frontend en cada PR y en `staging`/`main`.

`.github/workflows/deploy.yml` ofrece despliegue continuo a `staging` después de
un CI exitoso mediante el secreto `STAGING_DEPLOY_HOOK_URL`. Producción requiere
ejecución manual, el entorno protegido de GitHub y el secreto
`PRODUCTION_DEPLOY_HOOK_URL`. Los hooks son agnósticos del proveedor (Railway,
Vercel u otro servicio que exponga un deploy hook).
