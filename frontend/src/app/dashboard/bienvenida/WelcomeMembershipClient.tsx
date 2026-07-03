"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Loader2, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { membershipService } from "@/features/memberships/services/membership.service";

type Props = {
  initialPlan: string | null;
  planSlug: string | null;
  payment: string | null;
};

export default function WelcomeMembershipClient({
  initialPlan,
  planSlug,
  payment,
}: Props) {
  const router = useRouter();
  const [planName] = useState(initialPlan || "tu plan");
  const [isChecking, setIsChecking] = useState(payment === "success");

  const title = useMemo(() => {
    if (isChecking) return "Estamos activando tu plan";
    if (payment === "failure") return "No pudimos confirmar el pago";
    if (payment === "pending") return "Tu pago está pendiente";
    return `Plan ${planName} activado`;
  }, [isChecking, payment, planName]);

  useEffect(() => {
    if (payment !== "success") {
      return;
    }

    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    const verifyActivation = async () => {
      try {
        const response = await membershipService.getStatus();
        const active = response.requiresPlanSelection === false;
        if (!mounted) return;

        if (active) {
          setIsChecking(false);
          if (interval) clearInterval(interval);
          // Auto-redirect removed per user request
        }
      } catch {
        // Keep polling a little while in case the webhook is still processing.
      }
    };

    void verifyActivation();
    interval = setInterval(() => void verifyActivation(), 2000);

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [payment]);

  useEffect(() => {
    // Auto-redirect removed per user request
  }, [payment]);

  const handleEnterDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen dark:bg-slate-950 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_36%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] dark:bg-none px-4 py-10 text-slate-900 dark:text-slate-100">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:shadow-none lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
              <BadgeCheck className="h-4 w-4" />
              Acceso listo
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
                {title}, bienvenido a NutriNet!
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">
                Ya puedes comenzar. Si tu pago quedó pendiente de revisión, seguirás con acceso al plan gratuito mientras se aprueba.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "Dashboard listo",
                "Plan seleccionado",
                "Módulos activos",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="h-12 rounded-full bg-indigo-600 px-6 text-sm font-bold text-white hover:bg-indigo-500"
                onClick={handleEnterDashboard}
              >
                Entrar al dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-full px-6 text-sm font-bold dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => router.push("/dashboard/configuraciones")}
              >
                Ver plan
              </Button>
            </div>

            {payment === "success" && isChecking && (
              <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirmando activación de tu pago...
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between rounded-[1.75rem] bg-gradient-to-br from-indigo-600 via-indigo-500 to-emerald-500 p-6 text-white shadow-[0_24px_60px_rgba(79,70,229,0.25)] sm:p-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/90">
                <Sparkles className="h-3.5 w-3.5" />
                Plan activo
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
                {planName}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/85">
                NutriNet ya está listo para acompañarte en tu flujo clínico.
              </p>
              {planSlug && (
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  {planSlug}
                </p>
              )}
            </div>

            <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
                Siguiente paso
              </p>
              <p className="mt-2 text-sm leading-6 text-white/90">
                Irás directo al dashboard para empezar con tus pacientes, dietas y planes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
