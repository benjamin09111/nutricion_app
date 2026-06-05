"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { UserCheck, Mail, Send, CheckCircle2 } from "lucide-react";

export default function NutritionistCTAButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Completa todos los campos");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Ingresa un correo válido");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetchApi("/public/nutritionist-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      if (!response.ok) {
        throw new Error("No se pudo enviar");
      }

      setSubmitted(true);
      setName("");
      setEmail("");
    } catch (error) {
      toast.error("Error al enviar. Intenta nuevamente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setSubmitted(false), 300);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="rounded-full h-10 px-5 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#a88aed] to-emerald-500 hover:from-[#8f70d8] hover:to-emerald-600 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88aed] focus-visible:ring-offset-2"
      >
        <UserCheck className="h-4 w-4 mr-1.5" />
        ¿Eres nutricionista?
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title={submitted ? undefined : "¿Eres nutricionista?"}>
        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">¡Solicitud recibida!</h3>
            <p className="text-slate-600 mb-6">
              Gracias por tu interés. Te contactaremos pronto al correo proporcionado.
            </p>
            <Button onClick={handleClose} className="cursor-pointer">
              Entendido
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-slate-600 leading-relaxed">
              Si eres nutricionista y quieres aparecer en nuestro directorio público, completa tus datos y nos pondremos en contacto contigo.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Tu nombre completo
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: María Fernanda López"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Correo electrónico
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.cl"
                  required
                />
              </div>

              <div className="rounded-2xl bg-[#a88aed]/5 p-4 flex items-start gap-3">
                <Mail className="h-5 w-5 text-[#a88aed] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-slate-700">
                    <strong>¿Qué sigue?</strong>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Te contactaremos al correo proporcionado para coordinar los siguientes pasos y activar tu perfil en el portal.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full rounded-2xl bg-[#a88aed] hover:bg-[#8f70d8] font-bold cursor-pointer h-12"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar solicitud
              </Button>
            </form>
          </div>
        )}
      </Modal>
    </>
  );
}
