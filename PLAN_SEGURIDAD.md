# Plan de endurecimiento de seguridad — NutriNet

**Estado:** propuesto · **Autor:** auditoría interna · **Fecha:** 2026-07-25 · **Rama base:** `staging`

Este documento es el plan de ejecución para llevar la plataforma a un estándar defendible
para datos de salud (PHI) bajo la **Ley N° 21.719** de protección de datos personales de
Chile. Cada tarea es atómica, tiene archivo objetivo, criterio de aceptación y prueba
asociada. El orden importa: las fases están ordenadas por riesgo real, no por esfuerzo.

---

## 1. Resumen ejecutivo

| Fase | Alcance | Riesgo que cierra | Esfuerzo | Bloquea producción |
|------|---------|-------------------|----------|--------------------|
| **P0** | Secretos, portal de pacientes | Acceso no autorizado a fichas clínicas | ~1-2 días | **Sí** |
| **P1** | Auditoría, criptografía, límites de tasa | Trazabilidad legal e integridad | ~3-4 días | Sí para certificar |
| **P2** | MFA, almacenamiento de archivos, sesiones | Reducción de superficie | ~1 semana | No |
| **P3** | Documentación, proceso, monitoreo | Sostenibilidad | continuo | No |

**Ya completado** (commit previo a este plan): el sistema de roles quedó exclusivamente
del lado del servidor. El JWT ya no transporta `role`; `JwtStrategy` resuelve el rol desde
la base de datos en cada request; la cookie `user` no puede contener datos de autorización;
el middleware de Next verifica el rol contra `GET /auth/session-role`. Prueba que fija el
invariante: `backend/src/modules/auth/strategies/jwt.strategy.spec.ts`.

---

## 2. Inventario de hallazgos

| # | Severidad | Hallazgo | Ubicación |
|---|-----------|----------|-----------|
| H-01 | **Crítica** | Secreto JWT del portal con fallback a la cadena literal `'secret'`, en 4 puntos | `patient-portal.guard.ts:46`, `patient-portals.service.ts:484`, `:563`, `:1617` |
| H-02 | **Crítica** | Código de acceso del portal: 6 dígitos derivados, sin límite de intentos, no rotable | `patient-portals.service.ts:1612-1624`, `:500-548` |
| H-03 | **Crítica** | Sesión del portal con `expiresIn: '100y'`, en las 2 rutas que emiten token | `patient-portals.service.ts:485` (`verifyInvitation`), `:564` (`login`) |
| H-04 | **Alta** | Sin registro de auditoría de acceso a datos clínicos | (ausente) |
| H-05 | **Alta** | Utilidad de cifrado insegura que degrada a texto plano ante error | `common/utils/encryption.util.ts` |
| H-06 | Media | Comparación de códigos de acceso no es de tiempo constante | `patient-portals.service.ts:445`, `:541` |
| H-07 | Media | Sin MFA para cuentas administrativas | `modules/auth` |
| H-08 | Media | Uploads en disco local, nombres predecibles, validación por extensión, sin control de acceso | `modules/uploads/uploads.controller.ts` |
| H-09 | Baja | `docs/seguridad.md` describe un modelo de cookies que ya no existe | `docs/seguridad.md` |

### Controles ya correctos (no tocar)

`helmet()`, CORS con lista blanca y variantes de dominio, protección anti-CSRF por
`Sec-Fetch-Site` para métodos no seguros con cookie de sesión, `ValidationPipe` con
`whitelist` + `forbidNonWhitelisted`, `SanitizationPipe`, JWT en cookie `httpOnly`,
límites de tasa en login/registro/verificación, `trust proxy` para IP real,
`PatientDataAccessGuard` que excluye a roles administrativos de datos de pacientes,
tokens de invitación de 32 bytes almacenados con hash SHA-256, y logs HTTP sin cuerpos
y con redacción de parámetros sensibles.

---

## 3. Fase P0 — Crítico (bloquea producción)

### P0-1 · Fail-fast de secretos al arrancar

**Problema.** `PORTAL_JWT_SECRET || JWT_SECRET || 'secret'` significa que un entorno mal
configurado no falla: arranca con un secreto público. Cualquiera puede firmar un token
`kind: 'patient-portal'` y leer la ficha clínica de cualquier paciente. El patrón está
repetido en cuatro puntos —el guard que **verifica** y los dos `signAsync` que **emiten**,
más la derivación del código de acceso—, así que arreglar uno solo no cierra nada: basta
que sobreviva el del guard para que un token forjado siga siendo aceptado.

**Implementación.** Crear `backend/src/config/secrets.ts`:

```ts
const MIN_SECRET_LENGTH = 32;

const REQUIRED_SECRETS = [
  'JWT_SECRET',
  'PORTAL_JWT_SECRET',
  'PORTAL_ACCESS_CODE_SECRET',
  'ENCRYPTION_KEY',
  'OAUTH_STATE_SECRET',
] as const;

const FORBIDDEN_VALUES = new Set(['secret', 'changeme', 'test', 'dev', 'password']);

/** Se invoca en bootstrap ANTES de crear la app Nest. Nunca degrada. */
export function assertSecretsConfigured() {
  const problems: string[] = [];

  for (const key of REQUIRED_SECRETS) {
    const value = process.env[key];
    if (!value) {
      problems.push(`${key} no está definida`);
      continue;
    }
    if (value.length < MIN_SECRET_LENGTH) {
      problems.push(`${key} debe tener al menos ${MIN_SECRET_LENGTH} caracteres`);
    }
    if (FORBIDDEN_VALUES.has(value.toLowerCase())) {
      problems.push(`${key} usa un valor de ejemplo inseguro`);
    }
  }

  const portal = process.env.PORTAL_JWT_SECRET;
  if (portal && portal === process.env.JWT_SECRET) {
    problems.push('PORTAL_JWT_SECRET debe ser distinto de JWT_SECRET');
  }

  if (problems.length) {
    throw new Error(
      `Configuración de secretos inválida:\n  - ${problems.join('\n  - ')}\n` +
        'Genera valores con: openssl rand -base64 48',
    );
  }
}
```

Luego, en cada punto de consumo, eliminar la cadena de fallbacks y leer la variable
específica. `ConfigService.getOrThrow` es la forma idiomática en Nest:

```ts
// patient-portal.guard.ts:46 y patient-portals.service.ts:484, :563, :1617
secret: this.configService.getOrThrow<string>('PORTAL_JWT_SECRET'),
```

Mejor aún: centralizar la opción de firma en una constante del módulo
(`portalJwtOptions(configService)`) para que no vuelvan a divergir los cuatro puntos.

**Archivos:** `backend/src/config/secrets.ts` (nuevo), `backend/src/main.ts`,
`backend/src/modules/patient-portals/guards/patient-portal.guard.ts`,
`backend/src/modules/patient-portals/patient-portals.service.ts`,
`backend/.env.example` (documentar longitud mínima y comando de generación).

**Criterio de aceptación.** Con `PORTAL_JWT_SECRET` ausente, el proceso **no arranca** y
el mensaje nombra la variable faltante. Ninguna búsqueda de `'secret'` como literal de
fallback sobrevive en `backend/src` (`rg "\|\| 'secret'"` → 0 resultados).

**Pruebas.** `backend/src/config/secrets.spec.ts`: variable ausente, secreto corto, valor
prohibido, `PORTAL_JWT_SECRET === JWT_SECRET`, y caso feliz.

> **Nota de despliegue.** Rotar `PORTAL_JWT_SECRET` invalida las sesiones de portal
> vigentes. Es intencional y deseable: cualquier token emitido bajo el secreto débil deja
> de servir. Los pacientes vuelven a ingresar con su código.

---

### P0-2 · Código de acceso del portal: aleatorio, con hash y con bloqueo

**Problema.** El código es `sha256(secreto:nutritionistId:patientId) % 10⁶` → 6 dígitos.
El endpoint `POST /patient-portals/login` no tiene límite de tasa propio, así que sólo
aplica el global de 500 peticiones por 15 minutos: ~48.000 intentos diarios por IP contra
un espacio de un millón. Con el correo del paciente, la fuerza bruta es viable. Además el
código **no se puede rotar** sin cambiar el secreto de toda la plataforma: si se filtra
uno, se filtró de forma permanente.

**Modelo de datos.** Añadir a `PatientPortalInvitation` en
`backend/prisma/schema.prisma`:

```prisma
  accessCodeHash         String?                @map("access_code_hash")
  accessCodeSetAt        DateTime?              @map("access_code_set_at")
  failedAttempts         Int                    @default(0) @map("failed_attempts")
  lockedUntil            DateTime?              @map("locked_until")
```

Migración `backend/prisma/migrations/20260725120000_portal_access_code_hardening/migration.sql`:

```sql
ALTER TABLE "patient_portal_invitations"
  ADD COLUMN "access_code_hash"    TEXT,
  ADD COLUMN "access_code_set_at"  TIMESTAMP(3),
  ADD COLUMN "failed_attempts"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "locked_until"        TIMESTAMP(3);

CREATE INDEX "patient_portal_invitations_locked_until_idx"
  ON "patient_portal_invitations" ("locked_until");
```

**Lógica.** En `patient-portals.service.ts`:

1. **Generación.** Reemplazar `getPortalAccessCode(patientId, nutritionistId)` por
   `issueAccessCode(invitationId)`, que produce 8 dígitos con
   `crypto.randomInt(0, 100_000_000)` (10⁸ de espacio, CSPRNG), persiste
   `accessCodeHash = scrypt/bcrypt(code)` junto a `accessCodeSetAt`, y devuelve el código
   en claro **una sola vez** para el correo. El código nunca se puede reconstruir desde
   la base de datos.
2. **Verificación.** `verifyAccessCode(invitation, code)` compara con
   `crypto.timingSafeEqual` sobre los digests (resuelve H-06). Ya no se itera sobre todas
   las invitaciones del correo probando códigos: se resuelve la invitación primero y se
   verifica una vez.
3. **Bloqueo progresivo.** Éxito → `failedAttempts = 0`, `lockedUntil = null`. Fallo →
   incremento atómico; a partir del 5.º fallo, `lockedUntil = now + 15 min` y respuesta
   `429` genérica. Al 10.º, `blockedAt = now` (la columna ya existe) y se notifica al
   nutricionista a cargo.
4. **Rotación.** Nuevo endpoint `POST /patient-portals/patients/:patientId/access-code/rotate`
   protegido por `AuthGuard` + verificación de propiedad, para que el nutricionista emita
   un código nuevo si el paciente lo pierde o se filtra.
5. **Respuestas indistinguibles.** Correo inexistente, código incorrecto y cuenta
   bloqueada devuelven el mismo mensaje y código de estado, para no confirmar qué correos
   tienen portal activo.

**Límite de tasa dedicado.** En `patient-portals.module.ts`, aplicar un limitador propio
siguiendo el patrón de `auth-rate-limit.middleware.ts`:

| Ruta | Ventana | Máximo |
|------|---------|--------|
| `POST patient-portals/login` | 15 min | 10 |
| `POST patient-portals/invitations/:token/verify` | 15 min | 10 |
| `POST patient-portals/patients/:patientId/access-code/rotate` | 1 h | 20 |

El límite por IP es la primera barrera; el bloqueo por invitación es la que realmente
importa, porque sobrevive a la rotación de IP.

**Migración de códigos existentes.** Las invitaciones activas quedan con
`accessCodeHash = NULL`. Estrategia elegida: **re-emisión bajo demanda**. Un
`accessCodeHash` nulo hace fallar el login con un mensaje que indica solicitar un código
nuevo, y se ejecuta el script `backend/prisma/reissue-portal-codes.ts` para enviar por
correo un código nuevo a todas las invitaciones `ACTIVE` no expiradas. No se acepta ningún
período de gracia con el código derivado: eso mantendría vivo el vector.

**Criterio de aceptación.** No existe forma de derivar un código de acceso desde
identificadores. Seis intentos fallidos consecutivos dejan la invitación bloqueada 15
minutos. El nutricionista puede rotar el código. `rg "getPortalAccessCode"` → 0 resultados.

**Pruebas.** `patient-portals.service.spec.ts`:
código correcto autentica; código incorrecto incrementa el contador; el 5.º fallo bloquea;
el bloqueo expira; el éxito reinicia el contador; la rotación invalida el anterior; el
código no viaja en ninguna respuesta salvo la de emisión; correo inexistente y código
inválido son indistinguibles.

---

### P0-3 · Expiración de la sesión del portal

**Problema.** `expiresIn: '100y'` en las dos rutas que emiten sesión de portal
(`verifyInvitation` en `:485` y `login` en `:564`). Un token filtrado —correo reenviado,
dispositivo compartido, respaldo en la nube— da acceso perpetuo a la ficha clínica.

**Implementación.** `expiresIn: '7d'` en **ambas** rutas y `maxAge` coherente en
`patient-portal-cookie.constants.ts`. Como `PatientPortalAuthGuard` ya revalida la
invitación contra la base de datos en cada request, revocar sigue siendo inmediato; la
expiración corta acota la ventana de un token robado. Al vencer, el paciente reingresa con
su código, que es un flujo de dos campos.

**Criterio de aceptación.** Ningún `signAsync` en el proyecto emite tokens de más de 30
días. `rg "expiresIn: '100y'"` → 0 resultados.

**Pruebas.** El guard rechaza un token vencido; acepta uno vigente; rechaza uno vigente
cuya invitación fue revocada (ya cubierto, mantener).

---

## 4. Fase P1 — Alta

### P1-1 · Registro de auditoría de acceso a datos clínicos

**Problema.** Hoy no existe forma de responder «¿quién vio esta ficha?». La Ley 21.719
exige trazabilidad, y ante un incidente es la primera evidencia que se solicita.

**Modelo.**

```prisma
model AuditLog {
  id           String   @id @default(uuid())
  actorId      String?  @map("actor_id")          // Account.id; null en accesos de portal
  actorType    String   @map("actor_type")        // ACCOUNT | PATIENT_PORTAL | SYSTEM
  actorRole    String?  @map("actor_role")        // rol efectivo al momento del acceso
  action       String                             // READ | CREATE | UPDATE | DELETE | EXPORT | LOGIN | LOGIN_FAILED
  resourceType String   @map("resource_type")     // PATIENT | CLINICAL_RECORD | EXAM | ACCOUNT | PAYMENT
  resourceId   String?  @map("resource_id")
  patientId    String?  @map("patient_id")        // desnormalizado: consulta por paciente
  ip           String?
  userAgent    String?  @map("user_agent")
  metadata     Json     @default("{}")            // NUNCA contenido clínico
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([patientId, createdAt])
  @@index([actorId, createdAt])
  @@index([resourceType, resourceId])
  @@map("audit_logs")
}
```

**Implementación.** `common/audit/audit.service.ts` con escritura no bloqueante (fallar al
auditar no debe tumbar la petición, pero sí registrar el error), más un
`@Audit({ action, resourceType })` aplicado por interceptor sobre los controladores
clínicos: `patients`, `patient-intake`, `consultations`, `patient-portals`, y las acciones
sensibles de `users` (cambio de rol, suspensión, borrado) y `auth` (login, login fallido).

**Reglas duras.**
- El `metadata` jamás contiene datos clínicos: sólo identificadores, nombres de campo y
  contadores. Un registro de auditoría filtrado no debe ser en sí mismo una filtración.
- Retención de 6 años (plazo de conservación de la ficha clínica), sólo inserción, sin
  endpoint de borrado ni de edición.
- Consulta limitada a `ADMIN_MASTER`, y ese acceso también se audita.

**Criterio de aceptación.** Toda lectura de datos de un paciente deja un registro con
actor, rol, recurso, IP y marca temporal. Existe un endpoint
`GET /audit/patients/:patientId` restringido a `ADMIN_MASTER`.

**Pruebas.** Interceptor: registra en éxito y en `ForbiddenException`; el fallo del
servicio de auditoría no altera la respuesta; el `metadata` no incluye campos clínicos.

---

### P1-2 · Eliminar la utilidad de cifrado insegura

**Problema.** `common/utils/encryption.util.ts` usa AES-256-CBC sin autenticación (permite
manipulación del texto cifrado), deriva la clave con `Buffer.from(KEY.substring(0, 32))`
como UTF-8 (entropía muy inferior a 256 bits si la clave viene en hexadecimal), y ante
cualquier excepción **devuelve el texto plano**, es decir, escribiría PHI en claro sin
señal alguna. Hoy nadie la importa: `google-integration.service.ts` tiene su propia
implementación con IV de 12 bytes y GCM, que sí es correcta.

**Implementación.** Borrar el archivo. Si más adelante se necesita cifrado a nivel de
aplicación, extraer la implementación GCM de `google-integration.service.ts` a
`common/crypto/aead.ts` con la firma `encrypt/decrypt` que **lanza** en vez de degradar, y
con la clave derivada por `scrypt` desde `ENCRYPTION_KEY`.

**Criterio de aceptación.** `rg "encryption.util"` → 0 resultados y el proyecto compila.
Ninguna función de cifrado en el repositorio devuelve el texto de entrada en su rama de
error.

---

### P1-3 · Cobertura de límites de tasa

Auditar cada endpoint público o sensible que hoy sólo tiene el límite global de 500/15 min:
`public/patient-intake/submit/:token`, `booking-links/:token/requests`,
`public/nutritionists/:slug/appointments/request`, `public/nutritionist-interest`,
`support` (creación anónima), `payments/flow/confirmation` (webhook: validar firma en vez
de limitar). Definirlos en una tabla única en `common/rate-limits.ts` para que la política
sea legible de un vistazo y no quede dispersa por módulos.

---

## 5. Fase P2 — Media

### P2-1 · MFA obligatorio para roles administrativos

TOTP (RFC 6238) para `ADMIN`, `ADMIN_GENERAL` y `ADMIN_MASTER`. Campos
`totpSecretEncrypted`, `totpEnabledAt`, `recoveryCodeHashes[]` en `Account`. Enrolamiento
obligatorio al primer login con rol administrativo; `AuthGuard` rechaza sesiones de
staff sin MFA activo salvo en las rutas de enrolamiento. Motivo: hoy una sola contraseña
comprometida entrega la plataforma completa, incluida la capacidad de crear otros
administradores.

### P2-2 · Almacenamiento de archivos

`uploads.controller.ts` escribe en `./uploads` con nombres `Date.now()-Math.random()`, y
valida el tipo por la extensión del nombre. En Render/Railway el disco es efímero: **los
exámenes subidos se pierden en cada despliegue**, lo que además es un problema de
integridad de la ficha, no sólo de seguridad. Migrar a S3/R2 con:

- Clave de objeto `crypto.randomUUID()`, sin relación con el nombre original.
- Validación del tipo real por *magic bytes*, no por extensión.
- Buckets privados y descarga mediante URL firmada de corta duración, autorizada por el
  mismo criterio de propiedad que el resto de los datos del paciente.
- Registro de auditoría en cada descarga (`action: READ`, `resourceType: EXAM`).

### P2-3 · Política de sesión para staff

Vida más corta para sesiones administrativas que para nutricionistas (por ejemplo 12 h sin
`rememberMe`), y revocación explícita: una tabla de sesiones o un `tokenVersion` en
`Account` que se incremente al cambiar rol, contraseña o al suspender la cuenta. Hoy el
mecanismo es `lastLoginAt` comparado con `iat`, que funciona pero es implícito y frágil.

---

## 6. Fase P3 — Proceso

- **P3-1.** Reescribir `docs/seguridad.md`: describe cookies (`auth_token_http`,
  `auth_token`) y un modelo de «solo Google» que ya no corresponden al código. Un documento
  de seguridad desactualizado es peor que no tenerlo, porque se usa para decidir.
- **P3-2.** Añadir al pipeline: `npm audit --audit-level=high`, escaneo de secretos
  (gitleaks) y la suite de pruebas de seguridad como *gate* de merge a `main`.
- **P3-3.** Registro de tratamiento de datos y procedimiento de notificación de brechas
  (plazos y destinatarios) exigidos por la Ley 21.719.
- **P3-4.** Alertas sobre el registro de auditoría: picos de accesos, bloqueos de portal,
  creación de cuentas administrativas.

---

## 7. Variables de entorno

Todas obligatorias, mínimo 32 caracteres, generadas con `openssl rand -base64 48`.
`PORTAL_JWT_SECRET` **debe** ser distinto de `JWT_SECRET`: separar los dominios de firma
evita que un token de paciente sea aceptable como token de cuenta.

| Variable | Estado | Acción |
|----------|--------|--------|
| `JWT_SECRET` | existente | verificar longitud |
| `PORTAL_JWT_SECRET` | existente, con fallback inseguro | **rotar** y hacer obligatoria |
| `PORTAL_ACCESS_CODE_SECRET` | existente | queda obsoleta al implementar P0-2; eliminar |
| `ENCRYPTION_KEY` | existente | verificar longitud |
| `OAUTH_STATE_SECRET` | existente | verificar longitud |

---

## 8. Secuencia de despliegue

1. Fusionar P0 en `staging`. Configurar los secretos nuevos en el entorno **antes** de
   desplegar: con el fail-fast activo, un secreto faltante impide el arranque (falla
   ruidosa y temprana, que es lo correcto).
2. Aplicar `prisma migrate deploy`. Las columnas nuevas son aditivas y admiten nulos: no
   hay ventana de incompatibilidad con la versión anterior del código.
3. Verificar en `staging` el flujo completo de portal: emisión de código, ingreso, bloqueo
   por intentos, rotación y expiración de sesión.
4. Producción en ventana de baja actividad. Inmediatamente después, ejecutar
   `reissue-portal-codes.ts` y avisar a los nutricionistas: **los códigos anteriores dejan
   de servir y sus pacientes recibirán uno nuevo por correo.** Este aviso debe salir antes
   del despliegue, no después.
5. Vigilar 429 y fallos de login de portal durante 48 h; un alza sostenida indica que la
   re-emisión no llegó a alguien, no necesariamente un ataque.

**Reversión.** El código es reversible por despliegue. La migración no requiere reversión
(columnas aditivas). Lo que **no** se revierte es la rotación de `PORTAL_JWT_SECRET`: las
sesiones ya invalidadas siguen invalidadas, que es el resultado buscado.

---

## 9. Verificación final

```bash
# Sin fallbacks de secretos ni códigos derivados
rg "\|\| 'secret'" backend/src                    # → 0
rg "getPortalAccessCode|expiresIn: '100y'" backend/src  # → 0
rg "encryption.util" backend/src                  # → 0

# El rol nunca sale del token (invariante de la fase anterior)
rg "payload\.role" backend/src                    # → 0

# Compilación y pruebas
cd backend  && npx tsc --noEmit && npx jest
cd frontend && npx tsc --noEmit && npx next build
```

**Definición de terminado, por fase.**

- **P0.** El proceso no arranca sin secretos válidos. Ningún código de acceso es derivable.
  Seis intentos fallidos bloquean. Las sesiones de portal expiran. Suite en verde.
- **P1.** Toda lectura de datos de paciente queda auditada con actor, rol, IP y momento.
  No queda criptografía que degrade a texto plano. Los endpoints públicos tienen límites
  explícitos y documentados.
- **P2.** Ningún administrador accede sin segundo factor. Los archivos clínicos viven en
  almacenamiento privado con URLs firmadas y auditoría de descarga.
- **P3.** `docs/seguridad.md` refleja el código. El pipeline bloquea dependencias con
  vulnerabilidades altas y secretos filtrados.

---

## 10. Deuda conocida, aceptada por ahora

- **Cifrado a nivel de campo para la ficha clínica.** Hoy la protección en reposo es la del
  motor de base de datos. Cifrar campo por campo impide buscar y filtrar por ellos, así que
  requiere decidir qué campos y con qué costo funcional. Se documenta como decisión
  consciente, no como olvido.
- **Aislamiento multi-tenant.** `X-Tenant-ID` circula por el frontend pero la autorización
  no se apoya en él. Mientras haya un solo tenant no es explotable; antes de admitir un
  segundo hay que revisarlo de forma explícita.
- **Prueba de penetración externa.** Ninguna auditoría interna la sustituye. Recomendada
  una vez cerradas P0 y P1.
