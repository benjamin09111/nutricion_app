# Auditoría de Seguridad — NutriNet

**Fecha:** 2026-08-25
**Alcance:** `backend/` (NestJS 11 + Prisma + PostgreSQL) y `frontend/` (Next.js 16)
**Rama auditada:** `chore/pre-testing-cleanup`
**Método:** revisión estática de código, historial de git, configuración de despliegue y `npm audit`.
**Estado:** Fase 0 aplicada y verificada (ver sección 7). A2 cerrado además por adelantado.

---

## 1. Resumen ejecutivo

La aplicación está **bastante mejor protegida de lo que sugiere la lista de 20 puntos**. De los 20 riesgos
planteados, **11 ya están correctamente mitigados**, 6 están parcialmente cubiertos y 3 requieren trabajo real.

Sin embargo, la auditoría encontró **6 problemas graves que no estaban en la lista original** y que son
más peligrosos que la mayoría de los 20 puntos. Están detallados en la sección 3 como `A0`–`A5`.

| # | Problema | Impacto | Estado |
|---|---|---|---|
| `A0` | **RLS de Supabase sin verificar** (confirmado 2026-08-25: la BD de producción es del mismo proyecto Supabase que el storage) | Si RLS no está activo, la `anon key` publicada en el navegador abre **lectura y escritura de toda la base de datos** vía PostgREST | ⚠️ **Requiere acción tuya — `P1`** |
| `A1` | El rol `NUTRITIONIST_DEVELOPER` estaba dentro de `ADMIN_ROLES` | Panel de administración completo: listar, cambiar rol, suspender y borrar usuarios, y promover cuentas a `ADMIN` | ✅ Corregido |
| `A2` | `ApiKeyGuard` aceptaba una API key estática + `x-nutritionist-id` arbitraria | Suplantación de **cualquier** nutricionista en la agenda; salto de la revocación de sesión | ✅ Corregido |
| `A3` | El proxy BFF reenviaba todas las cabeceras del cliente | Hacía A2 explotable desde el navegador y permitía falsear la IP del rate limiting | ✅ Corregido |
| `A4` | El bucket de Supabase Storage es **público** | Exámenes, PDF y documentos clínicos accesibles sin autenticación por URL | ⏳ Fase 1 — bloqueado por `P4` |
| `A5` | Filtro de tenant que se evapora cuando `nutritionistId` es `undefined` | Lectura y borrado de recursos de otro nutricionista desde una cuenta de personal interno | ✅ Corregido |

**A0 es ahora el hallazgo número uno** y no se puede cerrar desde el repositorio: depende de una
verificación en el panel de Supabase. Los pasos exactos están en `P1`.

---

## 2. Veredicto sobre los 20 puntos originales

| # | Punto | Veredicto | Detalle |
|---|---|---|---|
| 1 | `.env` en git | ✅ **OK** | Ningún `.env` está trackeado ni aparece en el historial completo (`git log --all`). `.gitignore` cubre raíz, `backend/` y `frontend/`. Sólo hay `.env.example` sin valores. Escaneo de secretos en el historial: sólo *fixtures* de test. |
| 2 | APIs expuestas | 🟡 **Parcial** | Los endpoints públicos son intencionales y acotados (`/public/*`, `/booking-links/*`, `/payments/flow/*`, `count/nutritionists`). Pero `/calendars/*` usa un guard propio y débil → ver `A2`. |
| 3 | No RLS | 🟡 **Parcial** | No se usa RLS de PostgreSQL: el aislamiento por nutricionista es a nivel de aplicación y **está bien implementado en general** (ej. `patients.service.ts:268` valida propiedad explícitamente). El riesgo real es `A5` (filtro `undefined`). Falta confirmar RLS en Supabase → ver *Pregunta 1*. |
| 4 | Validar permisos en front | ✅ **OK** | `frontend/src/proxy.ts` es sólo UX: el rol se consulta al backend (`/auth/session-role`), nunca se deduce de la cookie ni del JWT. El backend valida de nuevo en cada request. |
| 5 | Endpoints sin rate limiting | ✅ **OK** (con reserva) | Límite global 500/15min + limitadores específicos en login (10), registro (5), verificación (5), Google (30), portal (10), intake (30), reservas (20), soporte (20). **Reserva:** el store es en memoria → no funciona con varias instancias ni sobrevive a reinicios (`B6`). Faltan `/uploads` y el webhook de Flow (`C8`). |
| 6 | Mal SQL | ✅ **OK** | Una sola consulta cruda en todo el backend (`creations.service.ts:359`) y usa *tagged template* de Prisma → parametrizada. Cero `$queryRawUnsafe` / `Prisma.raw`. |
| 7 | Cero validación en server | 🟡 **Parcial** | `ValidationPipe` global con `whitelist` + `forbidNonWhitelisted` + `transform`. Pero **~28 endpoints usan `@Body() body: any` o tipos inline**, que TypeScript borra en runtime → esos endpoints no validan nada → `B1`. |
| 8 | Output user en HTML puro | 🟡 **Parcial** | Sólo 3 usos de `dangerouslySetInnerHTML`. Dos son riesgo real (`B3`). El `SanitizationPipe` global mitiga parcialmente escapando `<`/`>` en la entrada, pero es una *blacklist* casera (`B10`). |
| 9 | Contraseñas en texto plano | ✅ **OK** | `bcrypt` (coste 10) para cuentas; `scrypt` con salt para códigos del portal. Login con hash *dummy* contra *timing attacks*, bloqueo por intentos fallidos y mensaje genérico. Subir coste a 12 (`C2`). |
| 10 | Tokens en localStorage | 🟡 **Parcial** | El JWT principal vive en cookie `httpOnly` (`auth_session`) + cookie indicadora no sensible. **Excepción:** `frontend/src/app/portal/login/page.tsx:61` guarda `data.accessToken` del portal en `localStorage`, siendo que el backend ya lo pone en cookie `httpOnly` → `B5`. |
| 11 | Panel admin sin auth | 🟡 **Parcial** | Está autenticado y con jerarquía (sólo `ADMIN_MASTER` toca a otros admins). **Pero** `NUTRITIONIST_DEVELOPER` cuenta como admin → `A1`. Además no hay 2FA para admins (`B8`). |
| 12 | CORS `*` | ✅ **OK** | Whitelist por origen en producción con variantes `www`, `credentials: true`, más una comprobación anti-CSRF por `Sec-Fetch-Site`/`Origin` en métodos no seguros. Fuera de producción acepta cualquier origen (`C3`, sólo dev). |
| 13 | No validar email | 🟡 **Parcial** | `RegisterDto`/`LoginDto` usan `@IsEmail` + `@MaxLength(254)` y hay verificación por correo obligatoria (login bloquea `PENDING`). **Pero** `POST /public/nutritionist-interest` valida con `email.includes('@')` y sin DTO (`C6`). |
| 14 | IDs secuenciales | ✅ **OK** | Las 52 tablas usan `String @id @default(uuid())`. Cero autoincrementales. |
| 15 | Guardar request body | ✅ **OK** | `HttpLoggerMiddleware` sólo registra método, URL (con token redactado), status, UA e IP. `LoggingInterceptor` está desactivado. `AuditInterceptor` guarda metadatos (ruta, actor, IP), nunca el cuerpo. |
| 16 | Webhooks sin verificación | ✅ **OK** | `POST /payments/flow/confirmation` **no confía en el cuerpo**: toma el token y re-consulta el estado a la API de Flow (`flow.service.ts:147`). Es el patrón correcto. Falta limitador propio (`C8`). |
| 17 | Stack trace en prod | ✅ **OK** | No hay `ExceptionFilter` personalizado → NestJS devuelve `500 Internal server error` genérico y registra el stack sólo en servidor. **Excepción menor:** el copiloto retransmite `error.message` del proveedor de IA al cliente (`B9`). |
| 18 | Dependencias sin update | ✅ **OK** | `npm audit --omit=dev`: **0 críticas, 0 altas, 2 moderadas** en cada proyecto, y ambas son la misma (`uuid` transitivo vía `exceljs`, GHSA-w5hq-g745-h8pq) — no explotable aquí porque no se pasa el parámetro `buf`. Stack al día (Next 16, Nest 11, React 19). |
| 19 | Uso de contraseñas filtradas | ❌ **No implementado** | Política fuerte (8+, mayúscula, minúscula, número, especial, sin espacios) pero **sin verificación contra brechas conocidas** (HIBP k-anonymity) → `C5`. Tampoco hay flujo de recuperación de contraseña (`C4`). |
| 20 | Subida de archivos insegura | ✅ **OK** (código) | `memoryStorage`, whitelist MIME + extensión, límite 10 MB, **verificación de magic bytes**, nombre UUID, autenticado y con permisos. **Pero** el bucket destino es público → `A4`. |

---

## 3. Hallazgos nuevos (no estaban en la lista)

### 🔴 A0 — La `anon key` de Supabase está publicada y RLS está sin verificar

`frontend/src/lib/supabase.ts:3-6` — `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Confirmaste que **el PostgreSQL de producción vive en el mismo proyecto de Supabase** que el storage.
Eso cambia por completo la lectura del punto 3 de tu lista original.

La `anon key` es pública por diseño y aparece en el bundle de JavaScript de cualquier visitante — eso
es normal y esperado. Lo que **no** es normal es que sea segura sólo si se cumplen las dos condiciones
a la vez:

1. Row Level Security activo en **todas** las tablas del esquema `public`, y
2. políticas que no concedan nada al rol `anon`.

Este proyecto usa Prisma contra la conexión directa de PostgreSQL, así que **nunca creó políticas RLS**:
Prisma se conecta con un usuario privilegiado y no necesita ninguna. Si el esquema `public` está expuesto
en la API de Supabase (lo está por defecto), cualquiera puede abrir la consola del navegador, tomar la
`anon key` del bundle y hacer:

```
GET  https://<proyecto>.supabase.co/rest/v1/patients?select=*
POST https://<proyecto>.supabase.co/rest/v1/accounts
```

…saltándose por completo NestJS, los guards, la auditoría y el aislamiento por nutricionista. Sería
lectura y escritura de toda la base de datos, incluidas fichas clínicas.

**Ironía a tener presente:** todo el trabajo de autorización del backend (que está bien hecho) no sirve
de nada si esta puerta está abierta. Por eso es el hallazgo número uno. Verificación en `P1`.

### 🔴 A1 — `NUTRITIONIST_DEVELOPER` tiene privilegios de administrador

`backend/src/modules/permissions/permissions.constants.ts:7-12`

```ts
export const ADMIN_ROLES = ['ADMIN','ADMIN_MASTER','ADMIN_GENERAL','NUTRITIONIST_DEVELOPER'];
```

`isAdminRole()` e `isStaffRole()` devuelven `true` para este rol, y esas dos funciones son la **única**
barrera de autorización en `users.controller.ts` (17 endpoints), `testimonials.controller.ts`,
`support`, `discount-codes`, `announcements` y `memberships`.

Consecuencia: una cuenta `NUTRITIONIST_DEVELOPER` — que la UI muestra literalmente como
"Nutricionista" (`auth.service.ts:48`) y que tiene perfil de nutricionista y datos de pacientes —
puede listar todos los usuarios, cambiar planes, suspender, borrar y **promover a otra cuenta a `ADMIN`**
(la única regla de jerarquía que aplica es que no puede crear un `ADMIN_MASTER`). Eso es un camino
directo de escalada a administrador real.

Además contradice la regla de `AGENTS.md`: *"los admins no deben tener visibilidad"* de los datos de paciente.

### 🔴 A2 — Autenticación paralela y débil en el módulo de agenda

`backend/src/modules/appointments/api-key.guard.ts` y `appointments-auth.ts:38-48`

`/calendars/*` **no usa** el `AuthGuard`/`JwtStrategy` endurecido del resto de la app. Usa un guard propio con dos problemas:

1. **API key estática + tenant arbitrario.** Si la petición trae `x-api-key: <APPOINTMENTS_API_KEY>` y
   `x-nutritionist-id: <cualquier-id>`, el guard aprueba y `resolveNutritionistIdFromRequest` devuelve
   ese id sin comprobar ninguna relación con quien llama → **acceso total a la agenda de cualquier
   nutricionista**. Es un secreto compartido único, sin rotación ni ámbito. Comparación no *timing-safe*.
2. **Bypass de revocación.** Usa `jwt.verify(token, JWT_SECRET)` a secas: sin `issuer`/`audience`,
   sin lista de algoritmos, y **sin revalidar `tokenVersion` ni `status` en la base de datos**.
   El `JwtStrategy` principal sí hace todo eso (`jwt.strategy.ts:55-95`). Resultado: un token de una
   cuenta **suspendida, borrada o con sesión revocada sigue funcionando** en `/calendars/*`.

### 🔴 A3 — El proxy BFF reenvía cabeceras arbitrarias del cliente

`frontend/src/app/api/appointments/[[...path]]/route.ts:44-52`

```ts
const headers = new Headers(request.headers);   // todas, tal cual
headers.delete("host"); headers.delete("content-length");
```

Cualquier navegador puede fijar `x-api-key`, `x-nutritionist-id` y `X-Forwarded-For` y el proxy los
entrega al backend. Esto **convierte A2 en explotable desde el navegador** y, como el backend corre con
`trust proxy: 1`, un `X-Forwarded-For` falsificado puede falsear la IP usada por el *rate limiting*.

*(Nota funcional: `getAuthToken()` devuelve `""` a propósito y el guard no lee cookies, así que hoy el
módulo de agenda probablemente devuelve 401 desde la UI. Conviene confirmarlo antes de tocarlo.)*

### 🔴 A4 — Bucket de almacenamiento público

`backend/src/common/services/storage.service.ts:74-80` — `upload()` devuelve `getPublicUrl()`.

Exámenes de laboratorio, PDF de pautas, fotos y documentos clínicos quedan en un bucket **público**.
Los nombres son UUID (no enumerables), pero la URL viaja en correos, en el portal del paciente y en la
cabecera `Referer` hacia terceros. Para datos de salud en Chile (Ley 19.628 y Ley 21.719, que entra en
vigencia en diciembre de 2026) esto es un riesgo de cumplimiento, no sólo técnico.

### 🟠 A5 — Filtro de tenant que puede evaporarse (`undefined`)

66 endpoints leen `req.user.nutritionistId` y **ninguno comprueba que exista**. Para cuentas staff
(`ADMIN`, `WORKER`, ...) ese campo es `undefined` porque no tienen registro de nutricionista.

Cuando ese valor llega a un `where` de Prisma, **Prisma ignora silenciosamente las claves `undefined`**:

```ts
// creations.service.ts:295, 309, 347, 370
await this.prisma.creation.findFirst({ where: { id, nutritionistId } });
// nutritionistId === undefined  →  where: { id }  →  lee/borra el recurso de cualquiera
```

Los módulos críticos (`patients`) sí comparan la propiedad explícitamente y están a salvo, pero el
patrón inseguro existe y no hay nada que impida que se repita. La solución correcta es un *guard*
o decorador que rechace la petición cuando falta `nutritionistId`, no auditar 66 sitios uno por uno.

---

## 4. Hallazgos de severidad media

| ID | Hallazgo | Ubicación |
|---|---|---|
| `B1` | ~28 endpoints con `@Body() body: any` o tipo inline → `ValidationPipe` no aplica (sin whitelist, sin longitudes máximas, sin tipos). Los más sensibles: `users.controller.ts:104,113`, `creations.controller.ts:30`, `resources.controller.ts:42,66,92`, `substitutes.controller.ts:28`, `payments.controller.ts` (5). | backend |
| `B2` | `updateMySettings` fusiona JSON arbitrario del cliente en `nutritionist.settings` (`{...current, ...body}`) sin límite de tamaño ni de claves, y acepta `publicSlug` sin validar formato → colisión/secuestro de rutas públicas `/nutricionistas/{slug}`. | `users.service.ts:420-445` |
| `B3` | XSS almacenado potencial: (a) `ResourcesClient.tsx:747` renderiza `resource.content` de BD como HTML crudo; (b) `JsonLd.tsx:9` inserta `JSON.stringify(data)` dentro de `<script>` sin escapar `<` → un `</script>` en un nombre/bio rompe el bloque. Hoy el `SanitizationPipe` lo amortigua, pero los datos que entran por Google OAuth no pasan por ese pipe. | frontend |
| `B4` | CSP con `script-src 'unsafe-inline' 'unsafe-eval'` → cualquier XSS es directamente ejecutable. Falta `Strict-Transport-Security` en el frontend. Y **`img-src` no incluye el host de Supabase**, así que las imágenes subidas (ej. `PortalClient.tsx:961`) quedan bloqueadas en producción. | `frontend/next.config.ts:17-30` |
| `B5` | El JWT del portal se duplica en `localStorage` (`portal_session_me`) aunque el backend ya lo entrega en cookie `httpOnly`. Es exposición gratuita a XSS. | `portal/login/page.tsx:61` |
| `B6` | `express-rate-limit` con `MemoryStore`: los contadores no se comparten entre instancias ni sobreviven a un redeploy → el límite de login se reinicia con cada despliegue. | `main.ts:129`, `rate-limits.ts` |
| `B7` | Sin cifrado de datos clínicos en reposo. `ENCRYPTION_KEY` se retiró de `secrets.ts` con el comentario de que ningún módulo la lee. Es un requisito explícito de `AGENTS.md`. | `config/secrets.ts:3-7` |
| `B8` | Sin 2FA para cuentas `ADMIN`/`ADMIN_MASTER`. Existe `common/utils/totp.util.ts` con tests, pero **no se usa en ningún sitio**. | backend |
| `B9` | El copiloto retransmite `error.message` del proveedor de IA al cliente (fuga de detalles internos) y `CopilotMessageDto.message` no tiene `@MaxLength` → abuso de coste (la cuota es por llamada, no por tokens). | `copilot.controller.ts:70-78`, `copilot-message.dto.ts` |
| `B10` | `SanitizationPipe` es una *blacklist* artesanal con regex. Escapa `<`/`>` en **todas** las cadenas de entrada, lo que corrompe texto legítimo (`"5 < 10"`) y contenido de editor enriquecido, y aun así no sustituye a un sanitizador real. | `common/pipes/sanitization.pipe.ts` |

## 5. Hallazgos de severidad baja

| ID | Hallazgo |
|---|---|
| `C1` | `uuid < 11.1.1` (moderada, transitiva vía `exceljs`) en backend y frontend. No explotable en el uso actual. |
| `C2` | `bcrypt` con coste 10 → subir a 12 (`auth.service.ts:507`). |
| `C3` | Fuera de producción, CORS acepta cualquier origen con credenciales (`main.ts:113-122`). Sólo afecta a desarrollo. |
| `C4` | No hay recuperación de contraseña: `POST /auth/reset-password` lanza 400 y remite a `contacto@nutrinet.cl`. Gestión manual = riesgo de ingeniería social. |
| `C5` | Sin verificación contra contraseñas filtradas (HIBP *k-anonymity*). |
| `C6` | `POST /public/nutritionist-interest` sin DTO y con `email.includes('@')` como validación; `name`/`email` sin límite de longitud y se interpolan en un correo. |
| `C7` | Comparación de API key con `===` en lugar de `crypto.timingSafeEqual`. |
| `C8` | Sin limitador específico en `POST /uploads` ni en `POST /payments/flow/confirmation`. |
| `C9` | `@supabase/supabase-js` se carga en el cliente sólo para un `signOut()` inútil (`features/auth/services/auth.service.ts:86`). Superficie y peso innecesarios. |

---

## 6. Lo que ya está bien hecho (no tocar)

Vale la pena dejarlo por escrito para no romperlo en un refactor:

- **JWT sin autoridad.** El token sólo lleva `sub`, `email` y `tokenVersion`. El **rol se lee siempre de la
  base de datos** en cada request (`jwt.strategy.ts:55-95`). Editar el token a mano no otorga nada.
- **Revocación instantánea** vía `tokenVersion`, más verificación de `status !== ACTIVE`.
- `issuer`, `audience` y `algorithms: ['HS256']` fijados (evita *algorithm confusion*).
- **Login endurecido:** hash *dummy* contra *timing attacks*, bloqueo por intentos, errores genéricos,
  verificación de correo obligatoria, expiración corta (12 h) para admins.
- **Anti-CSRF** por `Sec-Fetch-Site` + `Origin` en métodos no seguros con cookie de sesión (`main.ts:80-107`).
- **Subida de archivos** con verificación de *magic bytes*, no sólo MIME/extensión.
- **Webhook de Flow** verificado fuera de banda (re-consulta a la API), no confía en el cuerpo.
- **UUID en todas las tablas**, arranque abortado si faltan secretos (`assertSecretsConfigured`),
  `PORTAL_JWT_SECRET != JWT_SECRET` forzado.
- **Aislamiento de bases de datos** dev/prod y protecciones anti-seed destructivo.
- **Portal del paciente** con bloqueo por intentos, `scrypt` + salt, y errores genéricos.

---

## 7. Plan de ejecución

### Fase 0 — Contención ✅ **APLICADA** (2026-08-25)

Verificación: `npx tsc --noEmit` limpio en backend, `npx jest` **38 suites / 133 tests en verde**
(20 nuevos), ESLint sin errores en los archivos tocados.

| # | Acción | Archivos | Estado |
|---|---|---|---|
| 0.1 | `NUTRITIONIST_DEVELOPER` sale de `ADMIN_ROLES`. Se separan dos conceptos que estaban mezclados: `isAdminRole`/`isStaffRole` (**autorización**, panel admin) y el nuevo `hasUnlimitedEntitlements` (**facturación**, cuotas ilimitadas). El rol developer conserva sus cuotas ilimitadas y la exención de RUT, pero pierde el panel de administración. | `permissions.constants.ts`, `permissions.service.ts` (6 usos), `auth/guards/auth.guard.ts` | ✅ |
| 0.2 | Nuevo `NutritionistScopeGuard`: lanza `403` si `req.user.nutritionistId` no es un string no vacío. Aplicado a los 10 controladores exclusivamente por tenant. | `common/guards/nutritionist-scope.guard.ts` + 10 controladores | ✅ |
| 0.3 | El proxy BFF pasa de blocklist a **allowlist**: sólo reenvía `cookie`, `content-type`, `accept`, `accept-language`. Quedan bloqueadas `x-api-key`, `x-nutritionist-id`, `authorization` y `x-forwarded-*`. | `api/appointments/[[...path]]/route.ts` | ✅ |
| 0.4 | El JWT del portal deja de escribirse en `localStorage`; sólo queda el marcador `"1"`. El cliente del portal pasa a autenticarse con la cookie `httpOnly` (`fetchApi` ya envía `credentials:"include"`) y se eliminan las cabeceras `Authorization: Bearer` que quedaban. Cubre tanto `/portal/me` como el flujo por invitación. | `portal/login/page.tsx`, `portal/[token]/PortalClient.tsx` | ✅ |
| 0.5 | El host de Supabase se deriva de `NEXT_PUBLIC_SUPABASE_URL` y se añade a `img-src` del CSP y a `images.remotePatterns`. **Falta confirmar en producción** que las imágenes cargan. | `next.config.ts` | ✅ (verificar en prod) |

**Efecto secundario deseable de 0.1:** `PatientDataAccessGuard` bloquea a `isStaffRole` para cumplir la
Ley 21.719. Como el rol developer contaba como staff, estaba bloqueado de **sus propios pacientes**.
Al salir de `STAFF_ROLES` recupera ese acceso, que es el comportamiento correcto.

### Fase 1 — Cierre de agujeros graves (≈1 semana)

| # | Acción | Estado |
|---|---|---|
| 1.1 | ✅ **Adelantada.** Confirmaste que el módulo de agenda no está en uso, así que se eliminó por completo la vía de API key en lugar de parchearla: borrado `api-key.guard.ts`, nuevo `AppointmentsAuthGuard` que extiende el `AuthGuard` estándar (cookie `httpOnly` → `JwtStrategy`, con `issuer`/`audience`, algoritmo fijo, `tokenVersion` y `status` revalidados en BD). `resolveNutritionistIdFromRequest` se reescribió para leer **sólo** `request.user`; las cabeceras `x-api-key`/`x-nutritionist-id` se eliminaron incluso del tipo `AppointmentRequest`. `/calendars/google/callback` sigue siendo público porque su identidad viaja firmada en el `state`. `APPOINTMENTS_API_KEY` marcada como retirada en `.env.example` → **pendiente quitarla del entorno (`P2`)**. | ✅ |
| 1.2 | Pasar el bucket de Supabase a **privado** y servir con URLs firmadas de corta duración generadas por el backend tras validar propiedad. Requiere migrar las URLs ya guardadas en BD → bloqueado por `P4`. | ⏳ |
| 1.3 | Crear DTOs con `class-validator` para los ~28 endpoints de `B1`. Regla de lint que prohíba `@Body() ... : any`. | ⏳ |
| 1.4 | Sanitizar salida HTML con `isomorphic-dompurify` en `ResourcesClient`. Escapar `<`, `>`, `&` en `JsonLd` antes de inyectar. | ⏳ |
| 1.5 | Endurecer CSP: quitar `unsafe-eval`, migrar `unsafe-inline` a nonce. Añadir `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. | ⏳ |
| 1.6 | Limitar `settings` en `updateMySettings`: whitelist de claves + tope de tamaño. Validar `publicSlug` con regex `^[a-z0-9-]{3,60}$` y garantizar unicidad. | ⏳ |
| 1.7 | Aplicar `NutritionistScopeGuard` (o una comprobación equivalente por método) a `patient-portals.controller.ts`, que quedó fuera de 0.2 porque mezcla rutas de nutricionista con rutas de sesión de paciente (`PatientPortalAuthGuard`). | ⏳ |
| 1.8 | Revisar `resources` y `recipes`, los otros dos controladores excluidos de 0.2: sí admiten cuentas administrativas a propósito (contenido global), así que necesitan una comprobación de propiedad explícita por método en lugar de un guard de clase. | ⏳ |

### Fase 2 — Endurecimiento (≈2 semanas)

| # | Acción |
|---|---|
| 2.1 | Rate limiting con Redis (`rate-limit-redis`) para que sea consistente entre instancias y redeploys. Añadir limitadores a `/uploads` y al webhook de Flow. |
| 2.2 | **2FA obligatorio (TOTP) para `ADMIN`, `ADMIN_MASTER`, `ADMIN_GENERAL`.** `totp.util.ts` ya existe y está probado — sólo falta cablearlo. |
| 2.3 | Cifrado a nivel de campo (AES-256-GCM) para ficha clínica, exámenes y notas personales, con `ENCRYPTION_KEY` reintroducida en `assertSecretsConfigured`. Cumple la regla de `AGENTS.md`. |
| 2.4 | Sustituir `SanitizationPipe` por `sanitize-html` con política por campo (texto plano vs. editor enriquecido), en lugar del escape global de `<`/`>`. |
| 2.5 | `ExceptionFilter` global que normalice errores, oculte internos y añada `requestId` correlacionable con los logs. Dejar de retransmitir `error.message` del proveedor de IA. |
| 2.6 | `@MaxLength` en `CopilotMessageDto.message` y cuota por tokens además de por llamada. |
| 2.7 | Subir `bcrypt` a coste 12 con rehash transparente en el próximo login. |

### Fase 3 — Higiene y cumplimiento (continuo)

| # | Acción |
|---|---|
| 3.1 | Flujo de recuperación de contraseña con token de un solo uso, hasheado y con expiración (hoy es manual por correo). |
| 3.2 | Verificación HIBP (*k-anonymity*, sin enviar la contraseña) en registro y cambio de contraseña. |
| 3.3 | `npm audit fix` para `uuid`/`exceljs` cuando haya versión sin *breaking change*. Dependabot o Renovate en el repo. |
| 3.4 | DTO y `@IsEmail` en `POST /public/nutritionist-interest`; longitudes máximas en todo formulario público. |
| 3.5 | `crypto.timingSafeEqual` para cualquier comparación de secretos que quede. |
| 3.6 | Eliminar el cliente de Supabase del frontend (`lib/supabase.ts`) — sólo se usa para un `signOut()` inútil. |
| 3.7 | Cabeceras de seguridad también en el frontend: `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`. |

---

## 8. Pendientes de Benjamín (fuera del código)

Estas acciones no se pueden hacer desde el repositorio. Marcar al completar:

- [ ] **P1 — 🔴 URGENTE: verificar RLS en Supabase.** Confirmado que la BD de producción es del mismo
      proyecto Supabase, así que esto es el hallazgo `A0` y es lo más importante de todo el informe.
      **Prueba de 30 segundos, hazla primero** — desde cualquier terminal, con la `anon key` que ya es
      pública (está en el bundle del frontend):

      ```bash
      curl "https://<TU-PROYECTO>.supabase.co/rest/v1/patients?select=id&limit=1" \
        -H "apikey: <ANON_KEY>"
      ```

      - Devuelve `[]` o un error de permisos → **estás protegido.** Marca este punto y sigue.
      - Devuelve filas con datos de pacientes → **brecha crítica abierta.** Actúa de inmediato.

      Repite con `accounts`, `consultations` y `clinical_records`. Si alguna responde con datos:

      1. *Settings → API → Exposed schemas*: quita `public` de la lista. Es el corte más rápido y
         **no afecta a la aplicación**, porque Prisma se conecta por el puerto de PostgreSQL, no por
         PostgREST.
      2. Además, como defensa en profundidad, activa RLS en todas las tablas
         (`ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;`) sin crear políticas para `anon`.
      3. Si hubo exposición, asume acceso no autorizado a datos de salud: aplica el procedimiento de
         notificación de brechas de `P10`.

      Ojo: si el bucket es público (`A4`), su lectura seguirá abierta aunque cierres PostgREST — son
      dos superficies distintas.

- [ ] **P2 — Eliminar `APPOINTMENTS_API_KEY` del entorno de producción.** El código ya no la lee
      (la ruta de API key se borró en 1.1). Bórrala en Railway/Vercel para que no quede un secreto
      huérfano circulando.
- [ ] **P3 — Rotar `SUPABASE_SERVICE_ROLE_KEY`** si el archivo `backend/.env.prod` estuvo alguna vez en un
      chat, correo, respaldo en la nube o en la máquina de otra persona. Nunca estuvo en git, pero existe
      en local sin cifrar.
- [ ] **P4 — Decidir sobre el bucket privado** (bloquea la tarea 1.2). Ver *Pregunta 3*.
- [ ] **P5 — Provisionar Redis** (Railway/Upstash) para el rate limiting distribuido (tarea 2.1).
- [ ] **P6 — Activar 2FA** en las cuentas de GitHub, Railway, Vercel, Supabase y Resend.
- [ ] **P7 — Protección de rama** en `main`: PR obligatorio, sin *force push*, y *secret scanning* +
      *push protection* de GitHub activados.
- [ ] **P8 — WAF / protección de bots** delante del frontend y la API (Cloudflare gratuito basta).
- [ ] **P9 — Backups cifrados** de PostgreSQL con retención definida y **una prueba real de restauración**.
- [ ] **P10 — Ley 21.719 (Chile).** Entra en vigencia en diciembre de 2026 y los datos de salud son
      categoría sensible. Revisar con asesoría legal: política de privacidad, consentimiento explícito,
      DPA con Supabase/Railway/Resend, plazos de retención y procedimiento de notificación de brechas.
      Enlaza con el ítem "Data Protection & Encryption" de `AGENTS.md`.
- [ ] **P11 — Logging centralizado** con alertas (login fallido repetido, 403 en cascada, picos de 5xx).

---

## 9. Preguntas

### Respondidas (2026-08-25)

| # | Pregunta | Respuesta | Consecuencia |
|---|---|---|---|
| 1 | ¿El PostgreSQL de producción está en el mismo proyecto de Supabase que el storage? | **Sí, es Supabase** | Se abre el hallazgo `A0` y pasa a ser el nº 1 del informe. `P1` es urgente. |
| 2 | ¿`/calendars` se usa desde la UI y `APPOINTMENTS_API_KEY` está en producción? | **No se usa / está a medias** | Se eliminó por completo la vía de API key en lugar de parchearla (1.1 ✅). |
| 3 | ¿`NUTRITIONIST_DEVELOPER` debía tener panel de administración? | **No** | Aplicado 0.1 ✅, conservando sus cuotas ilimitadas. |

### Abiertas

4. **¿Se puede pasar el bucket a privado?** (bloquea `1.2` / `A4`) Implica migrar las URLs públicas ya
   almacenadas en BD (avatares, PDF, exámenes) a rutas de objeto + URLs firmadas. ¿Cuántos archivos hay
   aproximadamente y se puede aceptar una ventana de mantenimiento?
5. **¿Prioridad del cifrado de datos clínicos (`2.3`)?** Es el ítem más caro del plan (toca el esquema,
   las migraciones y las búsquedas) y es un requisito escrito en `AGENTS.md`. ¿Antes o después del
   lanzamiento?
6. **¿Confirmas en producción que las imágenes cargan tras 0.5?** Necesita un despliegue: abre el portal
   de un paciente con avatar y comprueba que no hay errores de CSP en la consola del navegador.

---

## 10. Trazabilidad

| Estado | Ítems |
|---|---|
| ✅ Auditado, sin acción | Puntos 1, 4, 6, 9, 14, 15, 16, 17, 18 |
| ✅ Corregido y verificado | A1, A2, A3, A5 · Fase 0 completa (0.1–0.5) · 1.1 |
| 🔴 Pendiente — crítico | **A0** (requiere `P1`), A4 (bloqueado por `P4`) |
| 🟠 Pendiente — medio | B1 … B10 · 1.3 … 1.8 |
| 🟡 Pendiente — bajo | C1 … C9 |
| ⏳ Bloqueado por respuesta | 1.2 (`P4` / Pregunta 4), 2.1 (`P5`), 2.3 (Pregunta 5) |
| 👤 Acción de Benjamín | **P1 (urgente)**, P2 … P11 |

### Registro de cambios

**2026-08-25 — Auditoría inicial.** Revisión de los 20 puntos + 6 hallazgos nuevos.

**2026-08-25 — Fase 0 + 1.1 aplicadas.** `tsc --noEmit` limpio, 38 suites / 133 tests en verde
(20 nuevos), ESLint sin errores. Archivos tocados:

- `backend/src/modules/permissions/permissions.constants.ts` — separa autorización de facturación
- `backend/src/modules/permissions/permissions.service.ts` — 6 usos migrados a `hasUnlimitedEntitlements`
- `backend/src/modules/auth/guards/auth.guard.ts` — exención de RUT para el rol developer
- `backend/src/common/guards/nutritionist-scope.guard.ts` — **nuevo** (+ spec)
- `backend/src/modules/permissions/permissions.constants.spec.ts` — **nuevo**, test de regresión de A1
- 10 controladores por tenant — `NutritionistScopeGuard` añadido
- `backend/src/modules/appointments/api-key.guard.ts` — **eliminado**
- `backend/src/modules/appointments/appointments-auth.guard.ts` — **nuevo**
- `backend/src/modules/appointments/appointments-auth.ts` — reescrito sin API key ni `jwt.verify` manual
- `backend/src/modules/appointments/appointments.types.ts` — cabeceras de suplantación eliminadas del tipo
- `backend/.env.example` — `APPOINTMENTS_API_KEY` marcada como retirada
- `frontend/src/app/api/appointments/[[...path]]/route.ts` — allowlist de cabeceras
- `frontend/src/app/portal/login/page.tsx` y `portal/[token]/PortalClient.tsx` — sesión sólo por cookie
- `frontend/next.config.ts` — host de storage en CSP y `remotePatterns`

*Nota: los 10 errores de `tsc` del frontend son preexistentes y ajenos a estos cambios (están en
archivos con trabajo en curso: `WizardStepper.tsx`, `configuraciones/page.tsx`, `herramientas/tests`,
`admin/papelera`, `admin/ia-costos`, `NotesAgendaWidget`, `PlanWizardShell`).*
