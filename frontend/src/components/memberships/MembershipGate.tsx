"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/context/SubscriptionContext";

export function MembershipGate({ children }: { children: React.ReactNode }) {
  const { requiresPlanSelection, isLoading } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && requiresPlanSelection) {
      router.replace("/plan");
    }
  }, [isLoading, requiresPlanSelection, router]);

  if (isLoading || requiresPlanSelection) {
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
