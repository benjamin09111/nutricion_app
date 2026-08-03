"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">
            Verificando tu membresía...
          </p>
        </div>
      </div>
    );
  }

  if (membershipError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <p className="text-slate-600 font-semibold text-sm">{membershipError}</p>
          <button
            type="button"
            onClick={() => void refreshSubscription()}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (requiresPlanSelection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">
            Verificando tu membresía...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
