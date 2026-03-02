"use client";

import { useState } from "react";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

export default function LoginPage() {
  const [view, setView] = useState<"login" | "register">("login");

  return (
    <main className="flex min-h-screen w-full bg-slate-50">
      <section className="hidden lg:flex w-1/2 bg-slate-900 justify-center items-center relative overflow-hidden">
        {/* Abstract shapes for professional feel */}
        <div className="absolute top-0 -left-10 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 text-white p-12 max-w-lg">
          <div className="mb-6 inline-flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-emerald-500 flex items-center justify-center">
              <span className="font-bold text-white text-lg">N</span>
            </div>
            <span className="text-xl font-bold tracking-wide">NutriSaaS</span>
          </div>
          <h1 className="text-4xl font-bold mb-6">
            Gestión Profesional para Nutricionistas
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Automatiza tu flujo de trabajo, gestiona pacientes y crea planes
            personalizados con precisión clínica.
          </p>
        </div>
      </section>
      <section className="flex flex-col justify-center px-4 py-12 sm:px-6 w-full lg:w-1/2 bg-white relative">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {view === "login" ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <h2 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-slate-900">
                Ingresa a tu cuenta
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Bienvenido de vuelta. Por favor ingresa tus credenciales.
              </p>
              <div className="mt-10">
                <LoginForm />
              </div>

              <div className="mt-8 relative">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-white px-6 text-slate-500">
                    ¿No tienes cuenta?
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setView("register")}
                  className="flex w-full justify-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold leading-6 text-emerald-600 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors cursor-pointer"
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
