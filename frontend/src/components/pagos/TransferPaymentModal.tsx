"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Loader2, Building2, AlertCircle, X, Tag, Sparkles } from "lucide-react";
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

interface DiscountResult {
  valid: boolean;
  code: string;
  type: string;
  discountPercent: number;
  originalPrice: number;
  proratedCredit: number;
  basePrice: number;
  finalPrice: number;
  currency: string;
}

interface TransferPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  planPrice: number;
  currentPlanName?: string;
  currentPlanPrice?: number;
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

type Phase = "transfer" | "success";

export function TransferPaymentModal({
  isOpen,
  onClose,
  planId,
  planName,
  planPrice,
  currentPlanName,
  currentPlanPrice,
  nutritionistEmail,
  nutritionistName,
  onSuccess,
}: TransferPaymentModalProps) {
  const [bankData, setBankData] = useState<BankData | null>(null);
  const [isLoadingBankData, setIsLoadingBankData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState<Phase>("transfer");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [discountCode, setDiscountCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPhase("transfer");
      setDiscountCode("");
      setDiscountResult(null);
      return;
    }

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

  const handleValidateDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error("Ingresa un código de descuento");
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetchApi("/payments/validate-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, code: discountCode.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Código de descuento inválido");
      }

      const result = await response.json();
      setDiscountResult(result);
      toast.success(`¡Descuento del ${result.discountPercent}% aplicado!`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Código de descuento inválido");
      setDiscountResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmitPayment = async () => {
    setIsSubmitting(true);
    try {
      const finalPrice = discountResult?.finalPrice ?? planPrice;
      
      const response = await fetchApi("/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          nutritionistEmail,
          nutritionistName: nutritionistName || "No especificado",
          discountCode: discountResult?.code,
          amount: finalPrice,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al registrar el pago");
      }

      setPhase("success");
      onSuccess?.();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error al enviar solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const displayPrice = discountResult?.finalPrice ?? planPrice;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 min-h-screen">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {phase === "success" ? (
          <div className="p-8 space-y-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 mb-4">
              <Check className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">
              ¡Gracias por tu suscripción!
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              En breve tu plan será cambiado. Mientras revisamos tu transferencia,
              seguirás usando tu plan gratuito.
            </p>
            <Button
              onClick={onClose}
              className="h-12 px-8 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 border-2 border-indigo-200">
                  <Building2 className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900">
                    Datos para transferir
                  </h3>
                  <p className="text-sm text-slate-500">
                    Realiza la transferencia y avísanos cuando hayas terminado
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="space-y-6 min-w-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Mi plan actual</p>
                    <p className="font-bold text-slate-900">{currentPlanName || "Plan gratuito"}</p>
                    <p className="text-sm text-slate-500">{currentPlanPrice ? money(currentPlanPrice) : "Sin costo"}</p>
                  </div>
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 mb-2">Nuevo plan</p>
                    <p className="font-bold text-slate-900">{planName}</p>
                    <p className="text-sm font-semibold text-indigo-600">
                      {discountResult ? (
                        <span className="flex items-center gap-1">
                          <span className="line-through text-slate-400">{money(discountResult.originalPrice)}</span>
                          <span>{money(discountResult.finalPrice)}</span>
                        </span>
                      ) : (
                        money(planPrice)
                      )}
                    </p>
                    {discountResult && (
                      <p className="text-xs text-emerald-600 font-semibold mt-1">
                        -{discountResult.discountPercent}% con {discountResult.code}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Monto a transferir
                    </span>
                    {discountResult && (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Descuento {discountResult.discountPercent}% aplicado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-900">{planName}</span>
                    <span className="text-3xl font-black text-indigo-600 text-right">
                      {money(displayPrice)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 min-w-0">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => {
                          setDiscountCode(e.target.value.toUpperCase());
                          setDiscountResult(null);
                        }}
                        placeholder="Código de descuento"
                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <Button
                      onClick={handleValidateDiscount}
                      disabled={isValidating || !discountCode.trim()}
                      className="h-12 px-4 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isValidating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Activar cupón"
                      )}
                    </Button>
                  </div>
                  {discountResult && (
                    <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                      <Check className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-emerald-800">
                          ¡Código válido! Descuento del {discountResult.discountPercent}%
                        </p>
                        <p className="text-emerald-700">
                          Precio final: {money(discountResult.finalPrice)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isLoadingBankData ? (
                <div className="flex items-center justify-center py-8 min-w-0">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : bankData ? (
                <div className="space-y-4 min-w-0 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-sm font-semibold text-slate-900">Datos bancarios</span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const text = `Nombre: ${bankData.beneficiary}\nRUT: ${bankData.rut}\nBanco: ${bankData.bankName}\nTipo de cuenta: ${bankData.accountType}\nNumero de cuenta: ${bankData.accountNumber}\nCorreo: ${bankData.email}`;
                        try {
                          await navigator.clipboard.writeText(text);
                          setCopiedField("all");
                          setTimeout(() => setCopiedField(null), 2000);
                        } catch {
                          toast.error("No se pudo copiar al portapapeles");
                        }
                      }}
                      className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 cursor-pointer"
                    >
                      {copiedField === "all" ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-500" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copiar todo
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-white p-3 min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Banco</div>
                      <div className="mt-1 break-words text-sm font-semibold text-slate-900">{bankData.bankName}</div>
                    </div>

                    <div className="rounded-xl bg-white p-3 min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tipo</div>
                      <div className="mt-1 break-words text-sm font-semibold text-slate-900">{bankData.accountType}</div>
                    </div>

                    <div className="rounded-xl bg-white p-3 min-w-0 sm:col-span-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Número de cuenta</div>
                      <div className="mt-1 break-words text-sm font-semibold text-slate-900">{bankData.accountNumber}</div>
                    </div>

                    <div className="rounded-xl bg-white p-3 min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">RUT</div>
                      <div className="mt-1 break-words text-sm font-semibold text-slate-900">{bankData.rut}</div>
                    </div>

                    <div className="rounded-xl bg-white p-3 min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email</div>
                      <div className="mt-1 break-words text-sm font-semibold text-slate-900">{bankData.email}</div>
                    </div>

                    <div className="rounded-xl bg-white p-3 min-w-0 sm:col-span-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Beneficiario</div>
                      <div className="mt-1 break-words text-sm font-semibold text-slate-900">{bankData.beneficiary}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                      <strong>Importante:</strong> Si utilizas un correo distinto en la transferencia,
                      asegurate de colocar en la descripción de la transferencia el correo{" "}
                      <strong>{nutritionistEmail}</strong> para identificar tu pago.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 min-w-0">
                  No se pudieron cargar los datos bancarios
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
                  "Ya transferí"
                )}
              </Button>
            </div>

            <p className="text-center text-xs text-slate-400">
              Un administrador revisará tu transferencia y activará tu plan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
