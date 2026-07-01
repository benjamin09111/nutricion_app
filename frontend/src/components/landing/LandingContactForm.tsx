"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { fetchApi } from "@/lib/api-base";
import { cn } from "@/lib/utils";
import {
  landingContactSchema,
  type LandingContactFormData,
} from "@/lib/schemas/contact";

export default function LandingContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LandingContactFormData>({
    resolver: zodResolver(landingContactSchema),
    defaultValues: {
      email: "",
      message: "",
    },
  });

  const onSubmit = async (values: LandingContactFormData) => {
    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const response = await fetchApi("/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          message: values.message,
          type: "CONTACT",
          subject: "Mensaje desde la landing",
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo enviar tu mensaje");
      }

      setIsSuccess(true);
      reset();
    } catch (error) {
      console.error("Landing contact error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-[0.18em] text-[#a88aed]">
          Tu correo
        </label>
        <Input
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          className="h-12 rounded-2xl border-[#a88aed]/25 bg-white/90 px-5 transition-all duration-300 focus:border-[#a88aed] focus:shadow-md"
          error={errors.email?.message}
          {...register("email")}
        />
        {errors.email?.message && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-[0.18em] text-[#a88aed]">
          Mensaje
        </label>
        <Textarea
          placeholder="Cuéntanos tu duda o lo que necesitas"
          className={cn(
            "min-h-32 rounded-2xl border-[#a88aed]/25 bg-white/90 p-4 text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-300 focus:border-[#a88aed] focus:outline-none focus:ring-2 focus:ring-[#a88aed]/20",
            errors.message && "border-rose-300 bg-rose-50 text-rose-900",
          )}
          error={errors.message?.message}
          {...register("message")}
        />
        {errors.message?.message && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.message.message}
          </p>
        )}
      </div>

      {isSuccess && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Mensaje enviado. Te responderemos por correo electrónico.</span>
        </div>
      )}

      <Button
        type="submit"
        isLoading={isSubmitting}
        className="h-12 w-full rounded-2xl bg-[#a88aed] text-base font-bold text-white shadow-lg shadow-[#a88aed]/25 transition hover:bg-[#8f70d8]"
      >
        Enviar mensaje
      </Button>
    </form>
  );
}
