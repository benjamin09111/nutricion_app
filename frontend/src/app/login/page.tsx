"use client";

import { useState } from "react";
import Image from "next/image";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

export default function LoginPage() {
  const [view, setView] = useState<"login" | "register">("login");

  return (
    <main className="flex min-h-screen w-full bg-slate-50">
      <section className="hidden lg:flex w-1/2 bg-linear-to-br from-indigo-900 via-slate-950 to-emerald-900 justify-center items-start relative overflow-hidden">
        {/* Abstract shapes for professional feel */}
        <div className="absolute top-0 -left-10 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-10 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 flex flex-col justify-center min-h-screen text-white px-14 py-20 w-full max-w-2xl">
          <div className="mb-12">
            <Image
              src="/logo_2.webp"
              alt="NutriNet"
              width={300}
              height={64}
              className="h-auto w-[240px] sm:w-[300px] object-contain"
              priority
            />
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-6 tracking-tight text-white">
            Gestión Profesional para Nutricionistas
          </h1>
          <p className="text-slate-300/90 text-xl leading-relaxed max-w-lg">
            Automatiza tu flujo de trabajo, gestiona pacientes y crea planes
            personalizados con precisión clínica.
          </p>
        </div>
      </section>
      <section className="flex flex-col justify-center px-6 py-12 sm:px-8 w-full lg:w-1/2 bg-white">
        <div className="mx-auto w-full max-w-md">
          {view === "login" ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900">
                Ingresa a tu cuenta
              </h2>
              <p className="mt-3 text-base leading-6 text-slate-500">
                Bienvenido de vuelta. Por favor ingresa tus credenciales.
              </p>
              <div className="mt-10">
                <LoginForm />
              </div>

              <div className="mt-10 relative">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-base font-medium leading-6">
                  <span className="bg-white px-6 text-slate-500">
                    ¿No tienes cuenta?
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setView("register")}
                  className="flex w-full justify-center rounded-lg bg-white px-4 py-3 text-base font-semibold leading-6 text-emerald-600 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all cursor-pointer"
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
