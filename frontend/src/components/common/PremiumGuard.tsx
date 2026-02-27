"use client";

import { useSubscription } from "@/context/SubscriptionContext";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface PremiumGuardProps {
  children: React.ReactNode;
  feature?: "canGenerateDiet" | "canExportPDF"; // scalable feature flags
  fallback?: React.ReactNode;
  showLockIcon?: boolean;
}

export function PremiumGuard({
  children,
  feature = "canGenerateDiet",
  fallback,
  showLockIcon = true,
}: PremiumGuardProps) {
  const { features, plan } = useSubscription();

  const isAllowed = features[feature];

  // If allowed, render children normally
  if (isAllowed) return <>{children}</>;

  // If locked, render wrapped child blocking interaction
  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast("Funcionalidad Pro", {
      description:
        "Esta característica requiere el plan de pago. ¿Quieres subir de plan ahora?",
      action: {
        label: "¡Subir a Pro!",
        onClick: () => console.log("Redirect to payment"),
      },
      icon: <Crown className="h-5 w-5 text-amber-500" />,
      duration: 5000,
    });
  };

  if (fallback) return <>{fallback}</>;

  return (
    <div
      className="relative group cursor-not-allowed"
      onClick={handleLockedClick}
    >
      <div
        className="pointer-events-none opacity-50 grayscale select-none"
        aria-disabled="true"
      >
        {children}
      </div>

      {showLockIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-indigo-600/90 text-white px-4 py-2 rounded-2xl flex flex-col items-center gap-1 text-xs font-black backdrop-blur-sm shadow-2xl transform transition-transform group-hover:scale-110 shadow-indigo-500/40">
            <Crown className="h-4 w-4 text-amber-300 animate-pulse" />
            <span className="uppercase tracking-tighter">Plan Pro</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Higher order component for pages/sections
export function PremiumOverlay({
  message = "Esta sección es exclusiva para suscriptores Pro",
}: {
  message?: string;
}) {
  return (
    <div className="absolute inset-0 bg-white/40 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(79,70,229,0.15)] border border-indigo-100 max-w-sm w-full transform hover:scale-[1.01] transition-transform">
        <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200 rotate-3">
          <Crown className="h-8 w-8 text-amber-300" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
          Acceso Pro Requerido
        </h3>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
          {message}
        </p>
        <div className="space-y-3">
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl font-black shadow-lg shadow-indigo-200 transition-all active:scale-95 cursor-pointer uppercase text-xs tracking-widest">
            ¡Suscribirse Ahora!
          </Button>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Prueba gratis de 7 días activa
          </p>
        </div>
      </div>
    </div>
  );
}
