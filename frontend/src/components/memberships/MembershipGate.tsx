"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";

export function MembershipGate({ children }: { children: React.ReactNode }) {
  const { requiresPlanSelection, isLoading, membershipError, refreshSubscription } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !membershipError && requiresPlanSelection) {
      router.replace("/plan");
    }
  }, [isLoading, membershipError, requiresPlanSelection, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-xs text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden="true" />
          <p className="text-sm font-bold text-slate-800" aria-live="polite">
            Verificando tu membresía...
          </p>
        </div>
      </div>
    );
  }

  if (membershipError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-xs">
          <p className="text-slate-600 font-semibold text-sm">{membershipError}</p>
          <button
            type="button"
            onClick={() => void refreshSubscription()}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-xs"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (requiresPlanSelection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-xs text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden="true" />
          <p className="text-sm font-bold text-slate-800" aria-live="polite">
            Verificando tu membresía...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

