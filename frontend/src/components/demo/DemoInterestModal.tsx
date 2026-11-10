"use client";

import { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { X, Sparkles, CheckCircle2, Loader2, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";

interface DemoInterestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoInterestModal({ isOpen, onClose }: DemoInterestModalProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Enviar a Support Requests (almacenado en DB)
      const supportPromise = fetchApi("/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          type: "CONTACT",
          subject: "Interés en NutriNet (Demo)",
          message: `Usuario interesado desde la Demo. Nombre: ${fullName.trim() || "No especificado"}. Desea ser notificado al término de la demo y lanzamiento oficial.`,
        }),
      }).catch((err) => {
        console.warn("Error en /support:", err);
      });

      // 2. Enviar a Landing Leads (si está disponible)
      const leadPromise = fetchApi("/landing/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          fullName: fullName.trim() || cleanEmail.split("@")[0],
          practiceArea: "Nutrición Clínica (Demo)",
          source: "demo_navbar",
          notes: "Registrado desde botón 'Me interesa NutriNet' en la barra superior de la demo.",
        }),
      }).catch((err) => {
        console.warn("Error en /landing/leads:", err);
      });

      await Promise.allSettled([supportPromise, leadPromise]);

      setIsSubmitted(true);
      toast.success("¡Gracias! Hemos registrado tu interés exitosamente.");
    } catch (error) {
      console.error("Error al registrar interés en la demo:", error);
      toast.error("Hubo un error al registrar tu correo. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after dialog animation finishes
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail("");
      setFullName("");
    }, 300);
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-[200]">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" />

      <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
        <DialogPanel className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 sm:p-8 text-left shadow-2xl transition-all border border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>

          {isSubmitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  ¡Registro confirmado!
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                  Guardamos tu correo <strong>{email}</strong>. Te avisaremos apenas termine la etapa demo y esté lista la versión definitiva de NutriNet.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  onClick={handleClose}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5"
                >
                  Continuar explorando la Demo
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100/80">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Acceso anticipado</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Me interesa NutriNet
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Actualmente estás probando la versión interactiva. Déjanos tu correo para notificarte el día del lanzamiento oficial y asegurar tus beneficios de bienvenida.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Tu nombre o especialidad (opcional)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej. Dra. Camila Soto"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Correo electrónico <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@clinica.cl"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-2.5 shadow-md shadow-indigo-500/15"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Registrando...
                      </span>
                    ) : (
                      "Quiero estar cuando termine la demo"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

