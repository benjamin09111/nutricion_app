# Guía: Solución de Bucle de Login con Google OAuth en Producción (Next.js 16 + NextAuth v5)

Esta guía detalla la solución al problema común donde el inicio de sesión con Google OAuth funciona correctamente localmente, pero en producción (e.g., Vercel, Railway) redirige infinitamente de vuelta a la página de login sin iniciar la sesión, así como los cambios de convención introducidos en Next.js 16.

---

## 1. El Problema: `getToken` retorna `null` en Producción (Cookie Segura)

### Causa Raíz
* **Local (HTTP):** NextAuth crea y lee cookies estándar sin cifrado SSL obligado (ej. `authjs.session-token`).
* **Producción (HTTPS):** NextAuth genera cookies seguras con el prefijo seguro `__Secure-` (ej. `__Secure-authjs.session-token`).
* **El conflicto con Reverse Proxies:** Hosting como Vercel o Railway utilizan proxies inversos que redirigen el tráfico de forma interna usando HTTP ordinario. Cuando el código del middleware/proxy de Next.js se ejecuta en el servidor, detecta que la petición interna es `http://...`, asume que está en desarrollo y busca `authjs.session-token` (sin prefijo seguro). Como el navegador solo envió la cookie con `__Secure-`, no la encuentra y retorna `null`.

### La Solución
Se debe forzar a `getToken` a buscar la cookie segura utilizando el parámetro `secureCookie` si estamos en entorno de producción.

```typescript
// En tu archivo de proxy/middleware
import { getToken } from "next-auth/jwt";

const isProduction = process.env.NODE_ENV === "production";

const token = await getToken({
  req,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  secureCookie: isProduction, // <-- FUERZA el uso del prefijo "__Secure-" en producción
});
```

---

## 2. Nueva Convención de Next.js 16: Adiós a `middleware.ts`, Hola a `proxy.ts`

Next.js 16 depreca oficialmente la convención de archivos `middleware.ts` en favor de **`proxy.ts`** para interceptar peticiones entrantes.

### Pasos de Migración
1. Renombra tu archivo de `src/middleware.ts` a `src/proxy.ts`.
2. Modifica el nombre de la función exportada de `middleware` a `proxy`.
3. Mantén la misma configuración de `config.matcher`.

### Ejemplo Completo del Archivo `src/proxy.ts`
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = req.nextUrl.pathname === "/admin/login";

  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  // Leer token forzando secureCookie en producción
  const token = await getToken({
    req,
    secret: authSecret,
    secureCookie: isProduction,
  });
  
  const isAdmin = Boolean(token?.role === "admin" && token?.authProvider === "google");

  // Redirigir a login si intenta entrar a zona protegida sin sesión válida
  if (isAdminRoute && !isLoginPage && !isAdmin) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // Redirigir a panel principal si ya tiene sesión activa e intenta ir a login
  if (isLoginPage && isAdmin) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 3. Checklist de Variables de Entorno en Producción

Para que NextAuth no falle de forma silenciosa, estas variables deben estar correctamente configuradas en el panel de control de tu hosting (Vercel, Railway, etc.):

| Variable | Valor Recomendado | Propósito |
| :--- | :--- | :--- |
| `AUTH_TRUST_HOST` | `true` | Indica a NextAuth que confíe en los encabezados `X-Forwarded-*` del proxy inverso. |
| `NEXTAUTH_URL` | `https://tu-dominio-produccion.com` | URL raíz del sitio. Usado para construir enlaces y validar cookies. |
| `AUTH_URL` | `https://tu-dominio-produccion.com` | Requerido por NextAuth v5 en conjunto con `NEXTAUTH_URL` si se define explícitamente. |
| `AUTH_SECRET` | *Generar una cadena aleatoria de mínimo 32 caracteres* | Clave para firmar y cifrar el JWT de sesión. Puedes usar `npx auth secret` para crearla. |
| `GOOGLE_CLIENT_ID` | *Obtenido de Google Cloud Console* | ID de credencial OAuth. |
| `GOOGLE_CLIENT_SECRET` | *Obtenido de Google Cloud Console* | Clave secreta de credencial OAuth. |

---

## 4. Configuración del Consentimiento en Google Cloud Console

1. Entra a tu consola de desarrollador en [Google Cloud Console](https://console.cloud.google.com/).
2. Asegúrate de añadir la URL exacta de callback en **"URIs de redireccionamiento autorizados"**:
   ```text
   https://tu-dominio-produccion.com/api/auth/callback/google
   ```
3. Si la aplicación está en estado **"Prueba" (Testing)** de consentimiento, recuerda que **únicamente** los correos electrónicos agregados explícitamente en la lista de **"Usuarios de prueba"** de la pantalla de consentimiento de OAuth podrán iniciar sesión.
