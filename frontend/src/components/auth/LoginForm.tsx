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
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(
        error.message ||
          "Error al iniciar sesión. Por favor verifica tus credenciales.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupportRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalSubmitting(true);

    const type = activeModal === "reset" ? "PASSWORD_RESET" : "CONTACT";

    try {
      const response = await fetch(`${API_URL}/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: modalEmail,
          message: activeModal === "contact" ? modalMessage : undefined,
          type: type,
        }),
      });

      if (!response.ok) throw new Error("Error al enviar solicitud");

      toast.success("Solicitud enviada correctamente al equipo de soporte.");
      setActiveModal(null);
      setModalEmail("");
      setModalMessage("");
    } catch (error) {
      toast.error("Hubo un error al enviar tu solicitud.");
    } finally {
      setIsModalSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium leading-6 text-slate-900"
          >
            Correo electrónico
          </label>
          <div className="mt-2">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ejemplo@nutricion.com"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium leading-6 text-slate-900"
            >
              Contraseña
            </label>
            <div className="text-sm">
              <button
                type="button"
                onClick={() => setActiveModal("reset")}
                className="font-semibold text-emerald-600 hover:text-emerald-500"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>
          <div className="mt-2 relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              error={errors.password?.message}
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
              {...register("rememberMe")}
            />
            <label
              htmlFor="rememberMe"
              className="ml-3 block text-sm leading-6 text-slate-900 cursor-pointer"
            >
              Mantener sesión iniciada
            </label>
          </div>
        </div>

        <div>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Iniciar Sesión"}
          </Button>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setActiveModal("contact")}
            className="text-xs text-slate-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            <MessageCircle className="h-3 w-3" />
            Contactar a un supervisor
          </button>
        </div>
      </form>

      {/* Support Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center mb-3 ${
                  activeModal === "reset"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {activeModal === "reset" ? (
                  <KeyRound className="h-5 w-5" />
                ) : (
                  <MessageCircle className="h-5 w-5" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {activeModal === "reset"
                  ? "Recuperar Acceso"
                  : "Contactar Soporte"}
              </h3>
              <p className="text-sm text-slate-500">
                {activeModal === "reset"
                  ? "Ingresa tu correo. Un administrador revisará tu solicitud y te enviará nuevas credenciales."
                  : "Envía un mensaje al equipo de administración."}
              </p>
            </div>

            <form onSubmit={handleSupportRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mensaje
                  </label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border-slate-200 text-sm p-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none border"
                    placeholder="Describe tu problema o consulta..."
                    required
                    value={modalMessage}
                    onChange={(e) => setModalMessage(e.target.value)}
                  />
                </div>
              )}

              <Button
                type="submit"
                className={`w-full ${activeModal === "reset" ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}
                isLoading={isModalSubmitting}
              >
                Enviar Solicitud
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
