"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, HelpCircle, AlertCircle, MessageSquare } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import { Modal } from "@/components/ui/Modal";
import LandingContactForm from "@/components/landing/LandingContactForm";

type Props = {
  autoStart?: boolean;
};

function LoginPageContent({ autoStart = false }: Props) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("error");

  if (autoStart) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="flex flex-col items-center gap-5 rounded-[2rem] border border-slate-200 bg-white px-8 py-10 shadow-sm">
          <Image
            src="/logo_2.webp"
            alt="NutriNet"
            width={220}
            height={60}
            style={{ width: "auto", height: "auto" }}
            className="h-auto w-[180px] object-contain"
            priority
          />
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-slate-600">
            Redirigiendo a Google para iniciar sesión...
          </p>
          <Suspense fallback={null}>
            <LoginForm autoStart activeTab="login" onTabChange={setActiveTab} />
          </Suspense>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh w-full bg-white lg:flex lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      {/* Hero Banner - Solo visible en pantallas grandes (Desktop / Tablet lg) */}
      <section className="hidden lg:flex relative items-center justify-center min-h-dvh overflow-hidden bg-linear-to-br from-indigo-900 via-slate-950 to-emerald-900 text-white lg:h-dvh lg:min-h-0 lg:w-1/2">
        <div className="absolute top-0 -left-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl lg:h-96 lg:w-96"></div>
        <div className="absolute top-0 -right-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl lg:h-96 lg:w-96"></div>
        <div className="absolute -bottom-32 left-20 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl lg:h-96 lg:w-96"></div>

        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col justify-center px-8 py-10 lg:px-16">
          <div className="mb-8 lg:mb-8">
            <Image
              src="/logo_2.webp"
              alt="NutriNet"
              width={300}
              height={64}
              style={{ width: "auto", height: "auto" }}
              className="h-auto w-[210px] object-contain sm:w-[260px] lg:w-[300px]"
              priority
            />
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 backdrop-blur-sm lg:mb-2">
            Acceso profesional
          </div>
          <h1 className="mb-4 mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ingresa a la plataforma creada para nutricionistas
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-slate-200/90 sm:text-lg lg:text-xl">
            Ingresa con tu correo profesional y gestiona tus pacientes, planes y actividades diarias en un solo lugar.
          </p>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => setIsSupportModalOpen(true)}
              className="inline-flex items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white shadow-sm backdrop-blur-md hover:bg-white/20 transition-all cursor-pointer"
            >
              <HelpCircle className="h-4 w-4 text-emerald-400" />
              Contactar a soporte
            </button>
          </div>
        </div>
      </section>

      {/* Form Area - Vista única simplificada en móviles y panel derecho en Desktop */}
      <section className="flex min-h-dvh w-full flex-col justify-start bg-white px-6 py-10 sm:py-16 lg:h-dvh lg:min-h-0 lg:w-1/2 lg:justify-center lg:overflow-y-auto lg:px-16 lg:py-8">
        <div className="mx-auto w-full max-w-md lg:shrink-0">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Logo para Celulares */}
            <div className="mb-6 block lg:hidden">
              <Image
                src="/logo_2.webp"
                alt="NutriNet"
                width={200}
                height={48}
                style={{ height: "auto" }}
                className="h-auto w-[160px] object-contain"
                priority
              />
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-sm animate-in fade-in duration-300">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-900 mb-0.5">Atención</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="mb-8 mt-8 lg:mb-5 lg:mt-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                NutriNet
              </p>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {activeTab === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                {activeTab === "login"
                  ? "Ingresa con tus credenciales profesionales."
                  : "Regístrate como nutricionista e inicia tu prueba gratuita."}
              </p>
            </div>

            {/* Tab Selector */}
            <div
              className="mb-8 grid w-full grid-cols-2 rounded-2xl bg-slate-100 p-1 lg:mb-5"
              role="tablist"
              aria-label="Opciones de acceso"
            >
              {(["login", "register"] as const).map((tab) => {
                const selected = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${selected
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    {tab === "login" ? "Iniciar sesión" : "Registrarse"}
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <Suspense fallback={null}>
              <LoginForm activeTab={activeTab} onTabChange={setActiveTab} />
            </Suspense>

            {/* Support Link for Mobile */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center lg:hidden">
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(true)}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 text-slate-400" />
                ¿Problemas para acceder? Contactar a soporte
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Soporte */}
      <Modal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        title="Soporte NutriNet"
        className="max-w-md p-6 rounded-3xl"
      >
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500">
            Si estás teniendo problemas para acceder o necesitas ayuda con tu cuenta, envíanos un mensaje y te responderemos lo antes posible.
          </p>
        </div>
        <LandingContactForm />
      </Modal>
    </main>
  );
}

export default function LoginPageClient({ autoStart = false }: Props) {
  return (
    <Suspense fallback={null}>
      <LoginPageContent autoStart={autoStart} />
    </Suspense>
  );
}
