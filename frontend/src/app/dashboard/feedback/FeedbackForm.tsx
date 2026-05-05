"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Send,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { fetchApi } from "@/lib/api-base";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const feedbackSchema = z.object({
  type: z.enum(["feedback", "complaint", "idea", "testimonio"]),
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres"),
  message: z
    .string()
    .min(10, "El mensaje debe ser más detallado (mínimo 10 caracteres)"),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

export function FeedbackForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: "feedback",
      subject: "",
      message: "",
    },
  });

  const selectedType = watch("type");

  const onSubmit = async (data: FeedbackFormData) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const payload = {
        ...data,
        // Map frontend types to uppercase for backend consistency if needed,
        // though backend DTO maps string to enum.
        type: data.type.toUpperCase(),
      };

      const response = await fetchApi(
        `/support/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error("Error enviando feedback");
      }

      console.log("Feedback submitted:", data);
      setIsSuccess(true);
      reset();

      // Reset success message after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      // Optionally set an error state to show to user
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeStyles = {
    feedback: {
      wrapper: "border-emerald-500 bg-emerald-50",
      icon: "text-emerald-600",
      label: "text-emerald-900", // High contrast
      dot: "bg-emerald-500",
    },
    testimonio: {
      wrapper: "border-sky-500 bg-sky-50",
      icon: "text-sky-600",
      label: "text-sky-950",
      dot: "bg-sky-500",
    },
    idea: {
      wrapper: "border-amber-500 bg-amber-50",
      icon: "text-amber-600",
      label: "text-amber-950", // High contrast (was likely too light before)
      dot: "bg-amber-500",
    },
    complaint: {
      wrapper: "border-rose-500 bg-rose-50",
      icon: "text-rose-600",
      label: "text-rose-950", // High contrast
      dot: "bg-rose-500",
    },
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden relative">
        {/* Header Decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500" />

        <div className="p-10">
          <div className="mb-10 text-center">
            <h3 className="text-2xl font-semibold text-slate-900 tracking-tight mb-3">
              Tu mensaje nos importa
            </h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md mx-auto">
              Ayúdanos a mejorar NutriSaaS. Cuéntanos tus ideas, problemas o testimonios para seguir evolucionando juntos.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Type Selection */}
            <div className="space-y-4">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Tipo de Mensaje
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { id: "feedback", label: "Feedback", icon: MessageSquare, color: "indigo" },
                  { id: "testimonio", label: "Testimonio", icon: CheckCircle2, color: "green" },
                  { id: "idea", label: "Idea", icon: Lightbulb, color: "amber" },
                  { id: "complaint", label: "Problema", icon: AlertTriangle, color: "rose" },
                ].map((item) => {
                  const isSelected = selectedType === item.id;
                  const colorMap: Record<string, string> = {
                    indigo: "indigo",
                    green: "emerald",
                    amber: "amber",
                    rose: "rose"
                  };
                  const color = colorMap[item.color];

                  return (
                    <div
                      key={item.id}
                      onClick={() =>
                        setValue("type", item.id as FeedbackFormData["type"])
                      }
                      className={cn(
                        "cursor-pointer relative overflow-hidden rounded-[1.5rem] border-2 p-4 transition-all duration-200 hover:shadow-sm active:scale-95 text-center flex flex-col items-center gap-2",
                        isSelected
                          ? `border-${color}-500 bg-${color}-50 text-${color}-700`
                          : "border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-6 h-6",
                          isSelected ? `text-${color}-600` : "text-slate-300",
                        )}
                      />
                      <span className="text-[11px] font-semibold uppercase tracking-wider">
                        {item.label}
                      </span>
                      {isSelected && (
                        <div className={cn("absolute top-2 right-2 w-1.5 h-1.5 rounded-full", `bg-${color}-500`)} />
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedType === "testimonio" && (
                <div className="rounded-[1.25rem] border border-green-100 bg-green-50 p-4 text-xs text-green-700 font-medium leading-relaxed">
                  <p className="font-semibold text-green-800 mb-1">Testimonio público</p>
                  Si nos autorizas, podemos usar tu comentario como testimonio público en nuestra plataforma. ¡Gracias por tu apoyo!
                </div>
              )}
              {errors.type && (
                <p className="flex items-center text-rose-500 text-xs font-bold mt-1 ml-1 animate-in slide-in-from-left-1">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.type.message}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="subject" className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Asunto
                </label>
                <Input
                  id="subject"
                  placeholder="Resumen breve..."
                  error={errors.subject?.message}
                  {...register("subject")}
                  className="rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                  Detalle del mensaje
                </label>
                <Textarea
                  id="message"
                  placeholder="Escribe aquí tus comentarios..."
                  rows={4}
                  error={errors.message?.message}
                  {...register("message")}
                  className="rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white focus:border-indigo-500 transition-all font-medium resize-none"
                />
              </div>
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                disabled={isSubmitting || isSuccess}
                className={cn(
                  "w-full h-12 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-[0.98] cursor-pointer",
                  isSuccess
                    ? "bg-green-500 hover:bg-green-600 shadow-green-100"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100",
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </span>
                ) : isSuccess ? (
                  <span className="flex items-center gap-2 animate-in fade-in zoom-in">
                    <CheckCircle2 className="w-5 h-5" />
                    ¡Enviado con éxito!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Enviar mensaje
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Security / Privacy Note */}
      <p className="text-center text-xs text-slate-400 mt-6 max-w-lg mx-auto">
        <LockIcon className="w-3 h-3 inline mr-1 mb-0.5" />
        Tus datos son procesados de forma segura. No compartimos tu información
        con terceros.
      </p>
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
