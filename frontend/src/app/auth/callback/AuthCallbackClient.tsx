"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api-base";
import { normalizeTutorialStore, setTutorialStore } from "@/lib/tutorials";

const storageOptions = {
  expires: 30,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

type Props = {
  fallbackMessage?: string;
};

export default function AuthCallbackClient({ fallbackMessage }: Props = {}) {
  const params = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState(fallbackMessage || "Finalizando inicio de sesión...");

  useEffect(() => {
    const token = params.get("token");
    const next = params.get("next") || "/dashboard";

    if (!token) {
      setMessage("No encontramos el token de autenticación.");
      router.replace("/login");
      return;
    }

    const hydrate = async () => {
      try {
        const response = await fetchApi("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("No pudimos completar la sesión.");
        }

        const data = await response.json();
        Cookies.set("auth_token", token, storageOptions);
        Cookies.set("user", JSON.stringify(data.user), storageOptions);
        localStorage.setItem("auth_token", token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setTutorialStore(normalizeTutorialStore(data.user?.tutorialProgress));

        router.replace(data.user?.requiresPlanSelection ? "/plan" : next);
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
