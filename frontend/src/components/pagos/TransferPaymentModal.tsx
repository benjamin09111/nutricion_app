"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Loader2, Building2, CreditCard, User, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { cn } from "@/lib/utils";

interface BankData {
  bankName: string;
  accountType: string;
  accountNumber: string;
  rut: string;
  email: string;
  beneficiary: string;
}

interface TransferPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  planPrice: number;
  nutritionistEmail: string;
  nutritionistName?: string;
  onSuccess?: () => void;
}

const money = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);

export function TransferPaymentModal({
  isOpen,
  onClose,
  planId,
  planName,
  planPrice,
  nutritionistEmail,
  nutritionistName,
  onSuccess,
}: TransferPaymentModalProps) {
  const [bankData, setBankData] = useState<BankData | null>(null);
  const [isLoadingBankData, setIsLoadingBankData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadBankData = async () => {
      setIsLoadingBankData(true);
      try {
        const response = await fetchApi("/payments/bank-data");
        if (response.ok) {
          const data = await response.json();
          setBankData(data);
        }
      } catch (error) {
        console.error("Error loading bank data:", error);
        toast.error("No se pudieron cargar los datos bancarios");
      } finally {
        setIsLoadingBankData(false);
      }
    };

    loadBankData();
  }, [isOpen]);

  const handleCopy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  };

  const handleSubmitPayment = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetchApi("/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          nutritionistEmail,
          nutritionistName: nutritionistName || "No especificado",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al registrar el pago");
      }

      toast.success("Solicitud de pago enviada. Te notificaremos cuando esté listo.");
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error al enviar solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 min-h-screen">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 border-2 border-indigo-200 mb-4">
              <Building2 className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">
              Datos para transferir
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Realiza la transferencia y avísanos cuando hayas terminado
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Plan seleccionado
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">{planName}</span>
              <span className="text-xl font-black text-indigo-600">
                {money(planPrice)}
              </span>
            </div>
          </div>

          {isLoadingBankData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : bankData ? (
            <div className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Banco</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{bankData.bankName}</span>
                    <button
                      onClick={() => handleCopy(bankData.bankName, "bank")}
                      className="p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {copiedField === "bank" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Tipo</span>
                  </div>
                  <span className="font-semibold text-slate-900">{bankData.accountType}</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">Número de cuenta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{bankData.accountNumber}</span>
                    <button
                      onClick={() => handleCopy(bankData.accountNumber, "account")}
                      className="p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {copiedField === "account" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">RUT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{bankData.rut}</span>
                    <button
                      onClick={() => handleCopy(bankData.rut, "rut")}
                      className="p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {copiedField === "rut" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{bankData.email}</span>
                    <button
                      onClick={() => handleCopy(bankData.email, "email")}
                      className="p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {copiedField === "email" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">Beneficiario</span>
                  </div>
                  <span className="font-semibold text-slate-900">{bankData.beneficiary}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  <strong>Importante:</strong> Tu correo de nutricionista es{" "}
                  <strong>{nutritionistEmail}</strong>. Usa este email como referencia en la
                  transferencia para que podamos identificar tu pago.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No se pudieron cargar los datos bancarios
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitPayment}
              disabled={isSubmitting || isLoadingBankData}
              className={cn(
                "flex-1 h-12 rounded-xl font-black shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2",
                "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200",
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Ya pagué"
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-slate-400">
            Un administrador revisará tu transferencia y activará tu plan
          </p>
        </div>
      </div>
    </div>
  );
}
