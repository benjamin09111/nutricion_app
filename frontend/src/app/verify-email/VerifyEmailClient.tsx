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
    <main className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-100/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="mb-6 flex items-center justify-center">
          {state === "loading" && (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50/50 text-emerald-600">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {state === "success" && (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          )}
          {state === "error" && (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertCircle className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2 block">
            Confirmación de correo
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {state === "success"
              ? "Tu cuenta ya está activa"
              : state === "error"
                ? "No pudimos confirmar tu correo"
                : "Validando tu acceso"}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-500">{message}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            className="h-11 flex-1 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
            onClick={() => router.push("/login")}
          >
            Ir al login
          </Button>
          {state === "error" && (
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              onClick={() => router.push("/")}
            >
              Volver al inicio
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}

