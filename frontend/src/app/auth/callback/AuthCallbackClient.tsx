"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api-base";
import { getCurrentUser } from "@/lib/current-user";
import { resolveSafePostAuthPath } from "@/lib/safe-redirect";
import { persistAuthSession } from "@/features/auth/services/auth.service";

const DRAFT_STORAGE_KEYS = [
  "nutri_active_draft",
  "nutri_patient",
  "nutri_quick_deliverable_draft",
  "nutri_quick_recipes_draft",
  "nutri_pauta_alimentacion_draft",
];

const SESSION_DRAFT_KEYS = [
  "nutri_cart_draft_decided",
  "nutri_deliverable_draft_decided",
];

type Props = {
  fallbackMessage?: string;
};

export default function AuthCallbackClient({ fallbackMessage }: Props = {}) {
  const params = useSearchParams();
  const router = useRouter();
  const hasStartedRef = useRef(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [message, setMessage] = useState(fallbackMessage || "Finalizando inicio de sesión...");

  useEffect(() => {
    // The URL is cleaned below, which can cause useSearchParams to update.
    // Do not interpret that second render as a failed authentication.
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const ticket = params.get("ticket");
    const next = resolveSafePostAuthPath(params.get("next"));

    if (!ticket) {
      setMessage("No encontramos el ticket de autenticación.");
      router.replace("/login");
      return;
    }

    window.history.replaceState({}, "", window.location.pathname);

    const hydrate = async () => {
      try {
        const sessionResponse = ticket
          ? await fetchApi("/auth/oauth/exchange", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ticket }),
            })
          : null;

        if (sessionResponse && !sessionResponse.ok) {
          throw new Error("No pudimos validar el ticket de autenticación.");
        }

        const exchangedSession = sessionResponse
          ? await sessionResponse.json()
          : null;
        if (!exchangedSession?.user) {
          throw new Error("Google no devolvió una sesión válida.");
        }

        const user = exchangedSession.user;

        // JWT is already in the httpOnly cookie (auth_session) set by the backend.
        // oauth/exchange returns the full user payload – no need to call /auth/me separately.
        try {
          const previousUser = getCurrentUser();
          if (previousUser?.id && previousUser.id !== user?.id) {
            DRAFT_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
            SESSION_DRAFT_KEYS.forEach((key) => sessionStorage.removeItem(key));
          }
        } catch (error) {
          console.error("Error clearing stale draft storage", error);
        }
        persistAuthSession("", user);

        const isAdmin = ["ADMIN", "ADMIN_MASTER", "ADMIN_GENERAL"].includes(
          user?.role || "",
        );
        const defaultTarget = user?.requiresPlanSelection ? "/dashboard/uso-recomendado" : "/dashboard";
        const targetPath = next === "/dashboard" && isAdmin ? "/dashboard/admin" : (next === "/dashboard" ? defaultTarget : next);
        const postRutNext = user?.requiresPlanSelection ? "/plan" : targetPath;

        const destination = user?.rut
          ? postRutNext
          : `/onboarding/rut?next=${encodeURIComponent(postRutNext)}`;

        setIsRedirecting(true);
        setMessage("Inicio de sesión exitoso. Preparando tu espacio de trabajo...");

        // Keep the dedicated callback loader visible until navigation begins.
        router.prefetch(destination);
        router.replace(destination);
      } catch (error) {
        console.error("Auth callback error:", error);
        setMessage("No pudimos completar el inicio de sesión con Google.");
        router.replace("/login");
      }
    };

    void hydrate();
  }, [params, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden="true" />
        <p className="text-sm font-bold text-slate-800" aria-live="polite">
          {isRedirecting ? "Sesión lista" : "Iniciando sesión"}
        </p>
        <p className="max-w-xs text-center text-sm leading-6 text-slate-600" aria-live="polite">
          {message}
        </p>
      </div>
    </main>
  );
}
