"use client";

import { Crown, Lock } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";

type FeatureGateProps = {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  message?: string;
};

export function FeatureGate({
  feature,
  children,
  fallback,
  message,
}: FeatureGateProps) {
  const { can, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex min-h-[16rem] items-center justify-center rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-sm font-semibold text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600" />
          Verificando permisos...
        </div>
      </div>
    );
  }

  if (can(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="rounded-3xl border border-indigo-100 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Lock className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">Función bloqueada</h3>
      <p className="mt-2 text-sm text-slate-500">
        {message || "Esta funcionalidad no está incluida en tu plan actual."}
      </p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        <Crown className="h-3.5 w-3.5" />
        Actualiza tu plan para continuar
      </div>
    </div>
  );
}
