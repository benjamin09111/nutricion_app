"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchApi } from "@/lib/api-base";
import { formatRut, validateRut } from "@/lib/rut-utils";
import { getCurrentUser, setCurrentUser } from "@/lib/current-user";

const DEFAULT_NEXT = "/dashboard";

const cleanAndFormatRut = (value: string): string => {
  let clean = value.replace(/[^0-9kK]/g, "");
  if (clean.length > 9) {
    clean = clean.slice(0, 9);
  }
  if (clean.length <= 1) return clean.toUpperCase();
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedBody}-${dv}`;
};

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
      <main className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 flex items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-md">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-slate-600">Validando tu cuenta...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-100/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2 block">
            Paso obligatorio
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Completa tu RUT
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Ingresa tu RUT para completar el registro en NutriNet.
          </p>
        </div>

        {/* Warning Alert */}
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-xs leading-relaxed text-amber-800">
          <p className="font-semibold mb-0.5">Atención:</p>
          Este RUT quedará asociado permanentemente. Para correcciones posteriores, deberás contactar a soporte.
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500" htmlFor="rut">
              RUT chileno
            </label>
            <input
              id="rut"
              type="text"
              inputMode="text"
              autoComplete="off"
              value={rut}
              onChange={(event) => {
                setRut(cleanAndFormatRut(event.target.value));
                setError(null);
              }}
              placeholder="12.345.678-9"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-xs outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400">
              Formato: 12.345.678-9 o 12345678-9
            </p>
          </div>

          {email ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Cuenta activa:</span> {email}
            </div>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={!isRutValid || isSaving}
            className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
            isLoading={isSaving}
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando RUT...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Confirmar y continuar
              </span>
            )}
          </Button>
        </form>

        {/* Security Footer Details */}
        <div className="mt-6 space-y-3 pt-6 border-t border-slate-100">
          <div className="flex gap-2.5 items-start text-xs text-slate-500">
            <Shield className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Por motivos de seguridad y validación profesional, tu cuenta se vinculará a este identificador único.
            </p>
          </div>
          <div className="flex gap-2.5 items-start text-xs text-slate-500">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-slate-400">
              El ingreso de datos falsos o el uso de un RUT que no te pertenezca resultará en la suspensión inmediata de la cuenta.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
