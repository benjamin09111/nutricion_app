"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchApi } from "@/lib/api-base";
import { formatRut, validateRut } from "@/lib/rut-utils";
import { getCurrentUser, setCurrentUser } from "@/lib/current-user";

const DEFAULT_NEXT = "/dashboard";

export function RutOnboardingClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || DEFAULT_NEXT;
  const [rut, setRut] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedRut = useMemo(() => rut.replace(/\s+/g, "").trim(), [rut]);
  const isRutValid = validateRut(normalizedRut);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const response = await fetchApi("/auth/me");

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const data = await response.json();
        const user = data?.user || data;

        if (user?.rut) {
          setCurrentUser(user);
          router.replace(next);
          return;
        }

        setCurrentUser(user);
        setEmail(user?.email || getCurrentUser()?.email || null);
      } catch {
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    void hydrate();
  }, [next, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isRutValid) {
      setError("Ingresa un RUT chileno válido.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetchApi("/auth/me/rut", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut: normalizedRut }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "No pudimos registrar tu RUT");
      }

      setCurrentUser(data.user);
      router.replace(next);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No pudimos registrar tu RUT",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-600">Validando tu cuenta...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-indigo-50 px-4 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">
                Paso obligatorio
              </p>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Completa tu RUT para entrar a NutriNet
              </h1>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Este RUT quedará asociado de forma permanente a tu cuenta. Si necesitas corregirlo,
            deberás contactarte con soporte.
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="rut">
                RUT chileno
              </label>
              <input
                id="rut"
                type="text"
                inputMode="text"
                autoComplete="off"
                value={rut}
                onChange={(event) => {
                  setRut(event.target.value);
                  setError(null);
                }}
                onBlur={() => setRut((value) => formatRut(value))}
                placeholder="12.345.678-9"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white"
              />
              <p className="text-xs text-slate-500">
                Debe ser un RUT válido y no podrá editarse después.
              </p>
            </div>

            {email ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Cuenta:</span> {email}
              </div>
            ) : null}

            {error ? (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={!isRutValid || isSaving}
              className="w-full rounded-2xl py-3 text-base font-bold"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando RUT
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar y continuar
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Sparkles className="mb-2 h-4 w-4 text-indigo-600" />
              Protege el plan gratuito contra cuentas duplicadas.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-600" />
              Si hay un error, soporte puede ayudarte con la corrección.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
