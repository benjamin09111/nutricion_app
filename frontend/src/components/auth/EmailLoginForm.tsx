"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { authService } from "@/features/auth/services/auth.service";
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth";
import AuthField from "./AuthField";
import PasswordField from "./PasswordField";

const SUPPORT_EMAIL = "contacto@nutrinet.cl";

type EmailLoginFormProps = {
  onSuccess: (user: { role?: string }) => void;
  onVerificationRequired: (email: string) => void;
};

export default function EmailLoginForm({
  onSuccess,
  onVerificationRequired,
}: EmailLoginFormProps) {
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

