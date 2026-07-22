"use client";

import { CheckCircle2, MailCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { authService } from "@/features/auth/services/auth.service";

export default function VerificationNotice({
  email,
  emailSent = true,
  onBack,
}: {
  email: string;
  emailSent?: boolean;
  onBack: () => void;
}) {
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resend = async () => {
    if (isResending) return;
    setIsResending(true);
    setMessage(null);
    setError(null);
    try {
      const response = await authService.resendVerification(email);
      setMessage(response.message || "Te enviamos un nuevo enlace.");
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "No pudimos reenviar el correo.",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-5 text-center" role="status">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
        <MailCheck className="h-8 w-8" />
      </div>
      <div>
        <h3 className="text-2xl font-black tracking-tight text-slate-900">
          Confirma tu correo
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {emailSent ? "Enviamos" : "Intentamos enviar"} un enlace a{" "}
          <strong className="text-slate-900">{email}</strong>. Debes confirmarlo para activar la cuenta
          antes de poder iniciar sesión.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {emailSent
            ? "Revisa también spam o promociones."
            : "El primer envío falló. Usa el botón de reenvío para intentarlo nuevamente."}
        </p>
      </div>

      {message ? (
        <p className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-2xl"
          isLoading={isResending}
          onClick={resend}
        >
          {isResending ? "Reenviando..." : "Reenviar correo"}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="w-full py-2 text-sm font-bold text-emerald-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          Volver a iniciar sesión
        </button>
      </div>
    </div>
  );
}

