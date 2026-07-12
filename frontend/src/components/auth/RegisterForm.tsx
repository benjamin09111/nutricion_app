"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Check } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { authService } from "@/features/auth/services/auth.service";
import { getPasswordRequirements } from "@/lib/password-policy";
import { registerSchema, type RegisterFormData } from "@/lib/schemas/auth";
import AuthField from "./AuthField";
import PasswordField from "./PasswordField";

export default function RegisterForm({
  onRegistered,
}: {
  onRegistered: (email: string, emailSent: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = useWatch({ control, name: "password" });
  const requirements = getPasswordRequirements(password);

  const onSubmit = async (values: RegisterFormData) => {
    try {
      const response = await authService.signUp(values);
      onRegistered(
        values.email.trim().toLowerCase(),
        response.emailSent !== false,
      );
    } catch (error) {
      setError("root.server", {
        message:
          error instanceof Error ? error.message : "No pudimos crear tu cuenta.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
      {errors.root?.server?.message ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errors.root.server.message}</span>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <AuthField
          id="register-name"
          label="Nombre completo"
          autoComplete="name"
          placeholder="María González Pérez"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <AuthField
          id="register-email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.cl"
          error={errors.email?.message}
          {...register("email")}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <PasswordField
          id="register-password"
          label="Contraseña"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <PasswordField
          id="register-confirm-password"
          label="Confirmar contraseña"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 rounded-xl bg-slate-50 px-3 py-2.5">
        {requirements.map((rule) => (
          <span
            key={rule.key}
            className={`flex items-center gap-1.5 text-[10px] font-medium leading-tight ${
              rule.met ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            <Check className={`h-3 w-3 shrink-0 ${rule.met ? "opacity-100" : "opacity-30"}`} />
            {rule.label}
          </span>
        ))}
      </div>

      <Button
        type="submit"
        className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
        isLoading={isSubmitting}
      >
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        {!isSubmitting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
      </Button>

      <p className="text-center text-[11px] leading-5 text-slate-500">
        Te enviaremos un enlace para confirmar tu correo. La cuenta se activa solo después de verificarlo. Tu nombre debe incluir nombre, apellido paterno y apellido materno.
      </p>
    </form>
  );
}



