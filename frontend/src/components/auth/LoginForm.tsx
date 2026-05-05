"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, MessageCircle, X } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authService } from "@/features/auth/services/auth.service";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";

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

  const handleSupportRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalSubmitting(true);

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
            className="block text-base font-semibold leading-5 text-slate-700 mb-2"
          >
            Correo electrónico
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="ejemplo@nutricion.com"
            error={errors.email?.message}
            className="h-12 text-base"
            {...register("email")}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-base font-semibold leading-5 text-slate-700"
            >
              Contraseña
            </label>
            <button
              type="button"
              onClick={() => setActiveModal("reset")}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-500 cursor-pointer transition-colors"
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
              className="pr-10 h-12 text-base"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

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

        <div>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Iniciar Sesión"}
          </Button>
        </div>

        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => setActiveModal("contact")}
            className="text-sm text-slate-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Contactar a un supervisor
          </button>
        </div>
      </form>

      {/* Support Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${
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
              <p className="text-sm text-slate-500 leading-relaxed">
                {activeModal === "reset"
                  ? "Ingresa tu correo. Te enviaremos nuevas credenciales de acceso de forma automática."
                  : "Envía un mensaje al equipo de administración."}
              </p>
            </div>

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
                />
              </div>

              {activeModal === "contact" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Mensaje
                  </label>
                  <textarea
                    className="w-full min-h-[100px] rounded-lg border border-slate-200 text-sm p-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-colors resize-none"
                    placeholder="Describe tu problema o consulta..."
                    required
                    value={modalMessage}
                    onChange={(e) => setModalMessage(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setActiveModal(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className={`flex-1 ${activeModal === "reset" ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}
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
