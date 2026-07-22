"use client";

import { Crown, ArrowRight, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface FreemiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  description: string;
}

export function FreemiumUpgradeModal({
  isOpen,
  onClose,
  description,
}: FreemiumUpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push("/dashboard/configuraciones?tab=membership&openPlanModal=1");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Acceso Limitado"
      className="max-w-md"
    >
      <div className="flex flex-col items-center text-center gap-4 py-2">
        {/* Visual Header */}
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-md">
            <Crown className="h-8 w-8 text-amber-500 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center text-white border-2 border-white">
            <ShieldAlert className="h-3 w-3" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 px-1">
          <h3 className="text-lg font-black text-slate-900 leading-tight">
            No puedes acceder a esto con tu plan actual
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Info Box */}
        <div className="w-full text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3.5 leading-relaxed text-left flex items-start gap-2">
          <Crown className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wider text-[9px] mb-0.5">Plan Freemium Activo</p>
            <p>Sube de nivel para desbloquear la gestión completa de pacientes, ediciones, creaciones ilimitadas y más.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2 mt-2">
          <Button
            onClick={handleUpgrade}
            className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            Mejorar mi plan
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full h-11 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
