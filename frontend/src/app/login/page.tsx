import Image from "next/image";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
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
            Gestión profesional con Google
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-slate-200/90 sm:text-lg lg:text-xl">
            Accede con tu cuenta de Google, conecta Calendar y mantén tu flujo
            profesional en un solo lugar.
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
              Inicia sesión con Google
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sin contraseña, sin fricción y con tu correo profesional verificado.
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="hidden lg:block">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900">
                Inicia sesión con Google
              </h2>
              <p className="mt-3 text-base leading-6 text-slate-500">
                Tu correo de Google será tu acceso único a NutriNet.
              </p>
            </div>

            <div className="mt-6 lg:mt-10">
              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
