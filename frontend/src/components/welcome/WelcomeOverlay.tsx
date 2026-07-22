"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Sparkles, Users, ClipboardList, Utensils, Calculator } from "lucide-react";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "nutri_welcome_pending";

export function isWelcomePending() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function clearWelcomePending() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function WelcomeOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isWelcomePending()) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    clearWelcomePending();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[2.5rem] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={handleDismiss}
          className="absolute top-6 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-3">
          <div className="md:col-span-2 flex flex-col justify-center p-8 sm:p-10 lg:p-14">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300 mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              Primera vez
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              ¡Bienvenido a NutriNet!
            </h1>

            <p className="mt-4 text-base leading-relaxed text-slate-200">
              Nati la nutria te acompañará en las vistas, su ícono está abajo a la
              derecha y puedes revisar información de cada módulo.
            </p>

            <p className="mt-4 text-sm font-semibold text-white/90">
              Actualmente tienes el plan gratis, si compraste y transferiste un plan
              de pago, será actualizado en breve.
            </p>

            <p className="mt-5 text-sm leading-relaxed text-slate-200">
              La plataforma incluye funcionalidades de gestión e IA:
            </p>

            <ul className="mt-3 space-y-2.5">
              {[
                { icon: Users, text: "Pacientes y consultas" },
                { icon: ClipboardList, text: "Generación de planes específicos y variados" },
                { icon: Utensils, text: "Alimentos, recetas, tabla de composición" },
                { icon: Calculator, text: "Calculadora y cálculos automáticos" },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <item.icon className="h-3.5 w-3.5 text-indigo-300" />
                  </div>
                  <span className="text-sm text-slate-200">{item.text}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-sm leading-relaxed text-slate-200">
              ¡Que te diviertas! Recuerda que NutriNet se construye para ti y
              contigo, cualquier pregunta, duda, retroalimentación, error o posible
              mejora, déjalo en la sección de <span className="font-semibold text-white">feedback</span> en
              el menú lateral izquierdo.
            </p>

            <p className="mt-4 text-sm font-semibold text-white/90">
              ¡Mucho éxito! Nuestro soporte está para ti, contacta a{" "}
              <span className="text-emerald-300">contacto@nutrinet.cl</span>
            </p>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Puedes revisar los términos y condiciones en{" "}
              <span className="font-semibold text-white">Configuración y perfil</span>{" "}
              dentro del menú lateral.
            </p>

            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Esta es la primera versión de NutriNet y tú puedes ayudar a mejorar
              cada día la plataforma con tus comentarios.
            </p>

            <Button
              onClick={handleDismiss}
              className="mt-8 h-12 w-full rounded-2xl bg-white text-sm font-black uppercase tracking-widest text-indigo-700 shadow-lg hover:bg-slate-100 cursor-pointer md:hidden"
            >
              Explorar NutriNet
            </Button>
          </div>

          <div className="hidden md:flex flex-col items-center justify-center p-8 sm:p-10 lg:p-14">
            <div className="relative w-[35rem] h-[35rem]">
              <Image
                src="/nutria.webp"
                alt="Nati la Nutria"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>

            <Button
              onClick={handleDismiss}
              className="mt-8 h-12 w-full max-w-xs rounded-2xl bg-white text-sm font-black uppercase tracking-widest text-indigo-700 shadow-lg hover:bg-slate-100 cursor-pointer"
            >
              Explorar NutriNet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
