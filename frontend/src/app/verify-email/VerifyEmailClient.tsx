"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchApi } from "@/lib/api-base";

type VerifyState = "loading" | "success" | "error";

export default function VerifyEmailClient({
  token,
}: {
  token: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState(
    "Estamos confirmando tu correo...",
  );

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Falta el token de confirmación.");
      return;
    }

    let isMounted = true;

    const verify = async () => {
      try {
        const response = await fetchApi(
          `/auth/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "No se pudo confirmar el correo.");
        }

        if (isMounted) {
          setState("success");
          setMessage(data.message || "Correo confirmado correctamente.");
        }
      } catch (error) {
        if (!isMounted) return;
        setState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "No se pudo confirmar el correo.",
        );
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-emerald-50 px-4 py-12 text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-lg items-center justify-center">
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <div className="mb-6 flex items-center justify-center">
            {state === "loading" && (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {state === "success" && (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            )}
            {state === "error" && (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertCircle className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-slate-400">
              Confirmación de correo
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {state === "success"
                ? "Tu cuenta ya está activa"
                : state === "error"
                  ? "No pudimos confirmar tu correo"
                  : "Validando tu acceso"}
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">{message}</p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              className="h-12 flex-1 rounded-full bg-indigo-600 px-6 text-sm font-bold text-white hover:bg-indigo-500"
              onClick={() => router.push("/login")}
            >
              Ir al login
            </Button>
            {state === "error" && (
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-full px-6 text-sm font-bold"
                onClick={() => router.push("/")}
              >
                Volver al inicio
              </Button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
