# Tutorial: Conversión de un Proyecto Next.js (App Router) a PWA (Progressive Web App)

Este documento es una guía paso a paso para que cualquier agente de IA o desarrollador pueda convertir un proyecto Next.js (App Router) en una **PWA ligera, moderna e instalable** en dispositivos móviles y de escritorio, siguiendo la arquitectura limpia y ligera implementada en este proyecto.

---

## 🎯 Objetivo de la Arquitectura PWA

Implementar una PWA **online-first** utilizando las capacidades nativas de Next.js App Router (rutas de manifest nativas) y un Service Worker ligero:
1. **Evita problemas de caché agresivos**: No interfiere con el renderizado del servidor ni con las APIs dinámicas de Next.js.
2. **Cero dependencias pesadas**: No requiere librerías complejas o desactualizadas (como `@ducanh2912/next-pwa` o `next-pwa`).
3. **Puntaje de instalabilidad nativo**: Habilita la instalación nativa en Android, iOS, Windows y macOS.

---

## 📁 Archivos a Crear y Modificar

```text
├── public/
│   ├── sw.js                     # [NUEVO] Service Worker mínimo online-first
│   └── icon.svg                  # [EXISTENTE/NUEVO] Icono de la aplicación
├── src/
│   ├── app/
│   │   ├── manifest.ts           # [NUEVO] Generador dinámico de Web Manifest
│   │   └── layout.tsx            # [MODIFICAR] Metadatos del manifest y componente registrador
│   └── components/
│       └── pwa-register.tsx      # [NUEVO] Registrador del Service Worker en el cliente
```

---

## 🛠️ Paso 1: Generar el Manifest (`src/app/manifest.ts`)

Next.js App Router permite exportar un archivo de manifest dinámico y tipado directamente en la carpeta `src/app/`.

Crea el archivo `src/app/manifest.ts`:

```typescript
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nombre Completo de la Aplicación",
    short_name: "NombreCorto",
    description: "Descripción breve de la aplicación y sus características principales.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
```

---

## ⚙️ Paso 2: Crear el Service Worker Mínimo (`public/sw.js`)

Crea el archivo `public/sw.js`. Este Service Worker cumple con los requisitos indispensables que exige Chrome y Safari para permitir la instalación de la PWA sin causar problemas de caché con Next.js.

```javascript
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Intencionalmente mínimo. La aplicación funciona online-first; esto habilita la instalabilidad PWA.
});
```

---

## 🔌 Paso 3: Crear el Componente Registrador (`src/components/pwa-register.tsx`)

Crea el componente de cliente que registrará el Service Worker una vez que el navegador cargue el sitio.

Crea el archivo `src/components/pwa-register.tsx`:

```tsx
"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Ignorar fallos de registro; la instalación PWA sigue funcionando si el SW está disponible.
    });
  }, []);

  return null;
}
```

---

## 🌐 Paso 4: Integrar en el Layout Principal (`src/app/layout.tsx`)

Modifica `src/app/layout.tsx` para agregar la referencia al manifest en los `metadata`, la configuración del `viewport` y el componente `<PwaRegister />` en el `body`.

```tsx
import type { Metadata } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tu Proyecto | Nombre del Sitio",
  description: "Descripción de tu proyecto.",
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
```

---

## 📲 Paso 5 (Opcional): Botón de Instalación Personalizado (`beforeinstallprompt`)

Si deseas permitir que los usuarios instalen la PWA directamente mediante un botón interactivo (en una pantalla de Login, Dashboard o Header), implementa el siguiente patrón:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => setInstallPrompt(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleInstallApp() {
    if (!installPrompt) return;

    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  if (!installPrompt) return null;

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleInstallApp}
    >
      <Download className="mr-2 h-4 w-4" />
      Instalar app
    </Button>
  );
}
```

---

## ✅ Lista de Verificación y Comprobación

1. **Compilación**: Ejecuta `npm run build` para asegurar que `src/app/manifest.ts` compile correctamente sin errores de TypeScript.
2. **DevTools de Chrome**:
   - Abre la pestaña **Application** -> **Manifest**. Verifica que los campos (`name`, `short_name`, `icons`, `start_url`) se muestren sin advertencias.
   - Abre la pestaña **Application** -> **Service Workers**. Confirma que `/sw.js` esté registrado y activo (`activated and is running`).
3. **Prueba de Instalación**:
   - En escritorio (Chrome/Edge): Debe aparecer el icono de instalación en la barra de direcciones.
   - En móvil (Android/Chrome o iOS/Safari): Debe permitir agregar a la pantalla de inicio o mostrar el botón personalizado si configuraste el evento `beforeinstallprompt`.
