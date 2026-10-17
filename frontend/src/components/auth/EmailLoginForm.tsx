"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, AlertCircle, ShieldCheck, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { authService } from "@/features/auth/services/auth.service";
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth";
import AuthField from "./AuthField";
import PasswordField from "./PasswordField";

const SUPPORT_EMAIL = "contacto@nutrinet.cl";

type EmailLoginFormProps = {
  onSuccess: (user: {
    role?: string;
    rut?: string | null;
    requiresPlanSelection?: boolean;
  }) => void;
  onVerificationRequired: (email: string) => void;
};

export default function EmailLoginForm({
  onSuccess,
  onVerificationRequired,
}: EmailLoginFormProps) {
  const [totpChallenge, setTotpChallenge] = useState<{
    tempToken: string;
    email: string;
  } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState<string | null>(null);
  const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const onSubmit = async (values: LoginFormData) => {
    try {
      const response = await authService.signIn(values);
      if (response.requiresTotp && response.tempToken) {
        setTotpChallenge({
          tempToken: response.tempToken,
          email: values.email,
        });
        return;
      }
      onSuccess(response.user || {});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No pudimos iniciar tu sesión.";

      if (message.toLowerCase().includes("confirmar tu correo")) {
        onVerificationRequired(values.email.trim().toLowerCase());
        return;
      }

      setError("root.server", { message });
    }
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpChallenge || !totpCode.trim()) return;

    setIsVerifyingTotp(true);
    setTotpError(null);

    try {
      const res = await authService.verifyTotp(
        totpChallenge.tempToken,
        totpCode.trim(),
      );
      onSuccess(res.user || {});
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Código de verificación incorrecto.";
      setTotpError(msg);
    } finally {
      setIsVerifyingTotp(false);
    }
  };

  if (totpChallenge) {
    return (
      <form onSubmit={handleVerifyTotp} className="space-y-4" noValidate>
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900">
          <div className="rounded-xl bg-emerald-600 p-2.5 text-white shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="text-xs">
            <p className="font-extrabold text-sm text-emerald-950">
              Autenticación en dos pasos (2FA)
            </p>
            <p className="text-emerald-800">
              Ingresa el código de 6 dígitos de tu aplicación de autenticación para{" "}
              <strong className="font-semibold">{totpChallenge.email}</strong>.
            </p>
          </div>
        </div>

        {totpError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{totpError}</span>
          </div>
        ) : null}

        <AuthField
          id="totp-code"
          label="Código de verificación o respaldo"
          type="text"
          autoComplete="one-time-code"
          placeholder="123456 o XXXX-XXXX"
          value={totpCode}
          onChange={(e) => setTotpCode(e.target.value)}
          required
        />

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setTotpChallenge(null);
              setTotpCode("");
              setTotpError(null);
            }}
            className="h-11 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Volver
          </Button>

          <Button
            type="submit"
            className="h-11 flex-1 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
            isLoading={isVerifyingTotp}
          >
            {isVerifyingTotp ? "Verificando..." : "Confirmar e ingresar"}
            {!isVerifyingTotp ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
          </Button>
        </div>
      </form>
    );
  }

  const supportHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "Solicitud de recuperación de acceso a NutriNet",
  )}&body=${encodeURIComponent(
    "Hola, necesito ayuda para recuperar el acceso a mi cuenta de NutriNet.\n\nCorreo asociado: \nNombre: \n\nGracias.",
  )}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {errors.root?.server?.message ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errors.root.server.message}</span>
        </div>
      ) : null}

      <AuthField
        id="login-email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        placeholder="tu@correo.cl"
        error={errors.email?.message}
        {...register("email")}
      />

      <div>
        <PasswordField
          id="login-password"
          label="Contraseña"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="mt-2 flex justify-end">
          <a
            href={supportHref}
            className="text-xs font-bold text-emerald-700 transition hover:text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
          {...register("rememberMe")}
        />
        Mantener sesión iniciada
      </label>

      <Button
        type="submit"
        className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
        isLoading={isSubmitting}
      >
        {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
        {!isSubmitting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
      </Button>
    </form>
  );
}
