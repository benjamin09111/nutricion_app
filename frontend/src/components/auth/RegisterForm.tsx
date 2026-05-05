"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { registerSchema, type RegisterFormData } from "@/lib/schemas/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { sendRegistrationRequest } from "@/app/actions/auth";

interface RegisterFormProps {
  onBack: () => void;
}

export default function RegisterForm({ onBack }: RegisterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      description: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const res = await sendRegistrationRequest(data);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setServerError(res.error || "Algo salió mal al enviar la solicitud.");
      }
    } catch (error) {
      console.error(error);
      setServerError("Error de conexión. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-5">
          <svg
            className="h-7 w-7 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          ¡Solicitud Enviada!
        </h3>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
          Hemos recibido tus datos correctamente. Te contactaremos a tu correo
          para finalizar el proceso de alta.
        </p>
        <Button onClick={onBack} variant="outline" className="w-full">
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-right-4 duration-300 w-full">
      <div className="mb-6 flex items-center">
        <button
          onClick={onBack}
          className="mr-3 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h3 className="text-xl font-bold text-slate-900">
          Solicitar Acceso
        </h3>
      </div>

      <p className="text-base text-slate-500 mb-8 leading-relaxed">
        Esta solicitud enviará tus datos a nuestro equipo. Te contactaremos vía
        correo electrónico para habilitar tu cuenta y explicarte el proceso de
        alta en el servicio.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-base font-semibold leading-5 text-slate-700 mb-2"
          >
            Nombre completo
          </label>
          <Input
            id="name"
            placeholder="Ej: Dra. Paula Rosales"
            className="h-12 text-base"
            {...register("name")}
            error={errors.name?.message}
          />
        </div>

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
            placeholder="contacto@ejemplo.cl"
            className="h-12 text-base"
            {...register("email")}
            error={errors.email?.message}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-base font-semibold leading-5 text-slate-700 mb-2"
          >
            Mensaje (Opcional)
          </label>
          <Textarea
            id="description"
            placeholder="Cuéntanos brevemente sobre tu consulta o requerimientos..."
            className="text-base"
            {...register("description")}
            error={errors.description?.message}
          />
        </div>

        {serverError && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 leading-relaxed">
            {serverError}
          </div>
        )}

        <Button type="submit" className="w-full text-base h-12" isLoading={isSubmitting}>
          Enviar Solicitud
        </Button>
      </form>
    </div>
  );
}
