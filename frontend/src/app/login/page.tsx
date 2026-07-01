"use client";

import { useState } from "react";
import Image from "next/image";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

export default function LoginPage() {
  const [view, setView] = useState<"login" | "register">("login");

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 lg:flex">
      <section className="relative flex items-center justify-center overflow-hidden bg-linear-to-br from-indigo-900 via-slate-950 to-emerald-900 px-6 py-8 text-white lg:w-1/2 lg:items-start lg:px-0 lg:py-0">
        {/* Abstract shapes for professional feel */}
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
              className="h-auto w-[210px] object-contain sm:w-[260px] lg:w-[300px]"
              priority
            />
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 backdrop-blur-sm lg:mb-2">
            Acceso profesional
          </div>
          <h1 className="mb-4 mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Gestión Profesional para Nutricionistas
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-slate-200/90 sm:text-lg lg:text-xl">
            Automatiza tu flujo de trabajo, gestiona pacientes y crea planes
            personalizados con precisión clínica.
          </p>
        </div>
      </section>

      <section className="flex w-full flex-col justify-center px-4 py-8 sm:px-6 sm:py-10 lg:w-1/2 lg:px-8 lg:py-12 lg:bg-white">
        <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8 lg:max-w-md lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <div className="mb-6 lg:hidden">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              NutriNet
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Ingresa a tu cuenta
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Acceso rápido, seguro y pensado para jornadas largas de trabajo.
            </p>
          </div>

          {view === "login" ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="hidden lg:block">
                <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900">
                Ingresa a tu cuenta
                </h2>
                <p className="mt-3 text-base leading-6 text-slate-500">
                  Bienvenido de vuelta. Por favor ingresa tus credenciales.
                </p>
              </div>

              <div className="mt-6 lg:mt-10">
                <LoginForm />
              </div>

              <div className="relative mt-8 lg:mt-10">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6 sm:text-base">
                  <span className="bg-white px-4 text-slate-500 sm:px-6">
                    ¿No tienes cuenta?
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <button
                  onClick={() => setView("register")}
                  className="flex w-full justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 cursor-pointer sm:text-base"
                >
                  Solicitar Registro Profesional
                </button>
              </div>
            </div>
          ) : (
            <RegisterForm onBack={() => setView("login")} />
          )}
        </div>
      </section>
    </main>
  );
}
