"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api-base";
import { getCurrentUser, setCurrentUser } from "@/lib/current-user";
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
  const [message, setMessage] = useState(fallbackMessage || "Finalizando inicio de sesión...");

  useEffect(() => {
    const ticket = params.get("ticket");
    const next = resolveSafePostAuthPath(params.get("next"));

    if (!ticket) {
      setMessage("No encontramos el ticket de autenticación.");
      router.replace("/login");
      return;
    }

    if (ticket) {
      window.history.replaceState({}, "", window.location.pathname);
    }

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
        if (!exchangedSession?.access_token) {
          throw new Error("Google no devolvió una sesión válida.");
        }
        persistAuthSession(exchangedSession.access_token);

        const response = await fetchApi("/auth/me");

        if (!response.ok) {
          throw new Error("No pudimos completar la sesión.");
        }

        const data = await response.json();
        try {
          const previousUser = getCurrentUser();
          if (previousUser?.id && previousUser.id !== data.user?.id) {
            DRAFT_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
            SESSION_DRAFT_KEYS.forEach((key) => sessionStorage.removeItem(key));
          }
        } catch (error) {
          console.error("Error clearing stale draft storage", error);
        }
        setCurrentUser(data.user);

        const isAdmin = ["ADMIN", "ADMIN_MASTER", "ADMIN_GENERAL"].includes(
          data.user?.role || "",
        );
        const targetPath = next === "/dashboard" && isAdmin ? "/dashboard/admin" : next;
        const postRutNext = data.user?.requiresPlanSelection ? "/plan" : targetPath;

        if (!data.user?.rut) {
          router.replace(
            `/onboarding/rut?next=${encodeURIComponent(postRutNext)}`,
          );
          return;
        }

        router.replace(postRutNext);
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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-slate-600">{message}</p>
      </div>
    </main>
  );
}
