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
        id="register-name"
        label="Nombre completo"
        autoComplete="name"
        placeholder="María González"
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
      <PasswordField
        id="register-password"
        label="Contraseña"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-2xl bg-slate-50 px-4 py-3">
        {requirements.map((rule) => (
          <span
            key={rule.key}
            className={`flex items-center gap-1.5 text-[11px] font-medium ${
              rule.met ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            <Check className={`h-3 w-3 shrink-0 ${rule.met ? "opacity-100" : "opacity-30"}`} />
            {rule.label}
          </span>
        ))}
      </div>

      <PasswordField
        id="register-confirm-password"
        label="Confirmar contraseña"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button
        type="submit"
        className="h-12 w-full rounded-2xl bg-emerald-600 text-base font-bold text-white shadow-sm hover:bg-emerald-700"
        isLoading={isSubmitting}
      >
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        {!isSubmitting ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
      </Button>

      <p className="text-center text-xs leading-5 text-slate-500">
        Te enviaremos un enlace para confirmar tu correo antes de ingresar.
      </p>
    </form>
  );
}
