"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, MessageCircle, X, ArrowRight, AlertCircle } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authService } from "@/features/auth/services/auth.service";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { cn } from "@/lib/utils";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [activeModal, setActiveModal] = useState<"reset" | "contact" | null>(
    null,
  );
  const [modalEmail, setModalEmail] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const router = useRouter();
  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const response = await authService.signIn(data);
      if (
        ["ADMIN", "ADMIN_MASTER", "ADMIN_GENERAL"].includes(response.user?.role)
      ) {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      toast.error(
        getErrorMessage(
          error,
          "Error al iniciar sesión. Por favor verifica tus credenciales.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email.trim());

  const handleSupportRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalSubmitting(true);
    setModalError(null);

    if (!validateEmail(modalEmail)) {
      setModalError("Ingresa un correo válido.");
      setIsModalSubmitting(false);
      return;
    }

    if (activeModal === "contact" && !modalMessage.trim()) {
      setModalError("Escribe un mensaje para continuar.");
      setIsModalSubmitting(false);
      return;
    }

    // If it's a password reset, call the direct AUTH endpoint instead of SUPPORT
    if (activeModal === "reset") {
      try {
        const response = await fetchApi(`/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: modalEmail }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Error al procesar la recuperación");
        }

        toast.success(data.message || "Nueva contraseña enviada por correo.");
        setActiveModal(null);
        setModalEmail("");
        setModalError(null);
      } catch (error: unknown) {
        console.error("Reset password error:", error);
        toast.error(
          getErrorMessage(error, "No se pudo procesar la recuperación."),
        );
      } finally {
        setIsModalSubmitting(false);
      }
      return;
    }

    // Otherwise, keep the support request logic for CONTACT
    const type = "CONTACT";

    try {
      const response = await fetchApi(`/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: modalEmail,
          message: modalMessage,
          type: type,
        }),
      });

      if (!response.ok) throw new Error("Error al enviar solicitud");

      toast.success("Solicitud enviada correctamente al equipo de soporte.");
      setActiveModal(null);
      setModalEmail("");
      setModalMessage("");
      setModalError(null);
    } catch (error: unknown) {
      console.error("Support request error:", error);
      toast.error("Hubo un error al enviar tu solicitud.");
    } finally {
      setIsModalSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-black uppercase tracking-[0.18em] text-slate-500"
          >
            Correo electrónico
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="ejemplo@nutricion.com"
            error={errors.email?.message}
            className="h-12 rounded-2xl border-slate-200 bg-white px-4 text-base shadow-sm"
            {...register("email")}
          />
          {errors.email?.message && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-sm font-black uppercase tracking-[0.18em] text-slate-500"
            >
              Contraseña
            </label>
            <button
              type="button"
              onClick={() => setActiveModal("reset")}
              className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 transition-colors hover:text-emerald-500 cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              error={errors.password?.message}
              className="h-12 rounded-2xl border-slate-200 bg-white pr-11 text-base shadow-sm"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-400 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Usa tu correo profesional y una contraseña segura.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center">
          <input
            id="rememberMe"
            type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
            {...register("rememberMe")}
          />
          <label
            htmlFor="rememberMe"
              className="ml-2.5 block text-sm font-medium leading-5 text-slate-600 cursor-pointer select-none"
          >
            Mantener sesión iniciada
          </label>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            Seguro
          </span>
        </div>

        <div>
          <Button
            type="submit"
            className="h-12 w-full rounded-2xl bg-emerald-600 text-base font-bold shadow-sm transition hover:bg-emerald-700"
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Ingresando..." : "Iniciar Sesión"}
            {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>

        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => setActiveModal("contact")}
            className="mx-auto flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-emerald-600 cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Contactar a un supervisor
          </button>
        </div>
      </form>

      {/* Support Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200 sm:p-8">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:bg-slate-50 hover:text-slate-600 cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 pr-10">
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                  activeModal === "reset"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {activeModal === "reset" ? (
                  <KeyRound className="h-6 w-6" />
                ) : (
                  <MessageCircle className="h-6 w-6" />
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1.5">
                {activeModal === "reset"
                  ? "Recuperar Acceso"
                  : "Contactar Soporte"}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {activeModal === "reset"
                  ? "Ingresa tu correo. Te enviaremos nuevas credenciales de acceso de forma automática."
                  : "Envía un mensaje al equipo de administración."}
              </p>
            </div>

            {modalError && (
              <div className="mb-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSupportRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Tu Correo
                </label>
                <Input
                  type="email"
                  required
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm"
                />
              </div>

              {activeModal === "contact" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Mensaje
                  </label>
                  <textarea
                    className="w-full min-h-[110px] rounded-2xl border border-slate-200 p-3 text-sm outline-none transition-colors resize-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Describe tu problema o consulta..."
                    required
                    value={modalMessage}
                    onChange={(e) => setModalMessage(e.target.value)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 flex-1 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  onClick={() => setActiveModal(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className={cn(
                    "h-11 flex-1 rounded-2xl text-white shadow-sm",
                    activeModal === "reset"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-blue-600 hover:bg-blue-700",
                  )}
                  isLoading={isModalSubmitting}
                >
                  Enviar Solicitud
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
