"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";

type Props = {
  autoStart?: boolean;
};

export default function LoginPageClient({ autoStart = false }: Props) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

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
    <main className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 lg:flex">
      <section className="relative flex items-center justify-center overflow-hidden bg-linear-to-br from-indigo-900 via-slate-950 to-emerald-900 px-6 py-8 text-white lg:w-1/2 lg:items-start lg:px-0 lg:py-0">
        <div className="absolute top-0 -left-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl lg:h-96 lg:w-96"></div>
        <div className="absolute top-0 -right-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl lg:h-96 lg:w-96"></div>
        <div className="absolute -bottom-32 left-20 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl lg:h-96 lg:w-96"></div>

        <div className="relative z-10 flex min-h-[42vh] w-full max-w-2xl flex-col justify-center py-8 lg:min-h-screen lg:px-14 lg:py-20">
          <div className="mb-8 lg:mb-12">
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
            Tu consulta, siempre a mano
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-slate-200/90 sm:text-lg lg:text-xl">
            Ingresa con tu correo profesional y mantén pacientes, agenda y
            planificación nutricional en un solo lugar.
          </p>
        </div>
      </section>

      <section className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 lg:bg-white">
        <div className="mx-auto w-full max-w-md">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                NutriNet
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                {activeTab === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {activeTab === "login"
                  ? "Ingresa con tus credenciales profesionales."
                  : "Regístrate como nutricionista e inicia tu prueba gratuita."}
              </p>
            </div>

            {/* Tab Selector */}
            <div
              className="grid w-full grid-cols-2 rounded-2xl bg-slate-100 p-1 mb-8"
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
                    className={`rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                      selected
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
          </div>
        </div>
      </section>
    </main>
  );
}
