"use client";

import { useEffect } from "react";

/**
 * SecurityShield: Protección en cliente contra copia de código e inspección casual.
 * Activa únicamente en entornos de producción (NODE_ENV === 'production').
 */
export function SecurityShield() {
  useEffect(() => {
    // Solo activado en producción para no interferir con el desarrollo y depuración local
    if (process.env.NODE_ENV !== "production") return;

    // 1. Bloqueo de menú contextual de clic derecho (excepto en campos editables)
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
    };

    // 2. Bloqueo de atajos de DevTools y Ver código fuente
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }

      const isMac =
        typeof navigator !== "undefined" &&
        navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl) {
        // Ctrl+Shift+I (DevTools), Ctrl+Shift+J (Consola), Ctrl+Shift+C (Inspector), Ctrl+Shift+K (Firefox)
        if (
          e.shiftKey &&
          ["I", "i", "J", "j", "C", "c", "K", "k"].includes(e.key)
        ) {
          e.preventDefault();
          return;
        }

        // Ctrl+U (Ver código fuente HTML)
        if (["U", "u"].includes(e.key)) {
          e.preventDefault();
          return;
        }

        // Ctrl+S (Guardar página completa)
        if (["S", "s"].includes(e.key)) {
          const target = e.target as HTMLElement | null;
          if (target?.tagName !== "INPUT" && target?.tagName !== "TEXTAREA") {
            e.preventDefault();
            return;
          }
        }
      }
    };

    // 3. Prevención de arrastre de imágenes de marca
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "IMG") {
        e.preventDefault();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("dragstart", handleDragStart);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  return null;
}
