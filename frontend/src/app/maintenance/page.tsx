import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Estamos mejorando NutriNet",
  description: "NutriNet está temporalmente en mantenimiento mientras preparamos nuevas mejoras.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 px-4 text-slate-900">
      <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white/95 p-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
        <div className="flex justify-center">
          <Image
            src="/logo_2.webp"
            alt="NutriNet"
            width={220}
            height={72}
            className="h-auto w-[160px] object-contain sm:w-[220px]"
            priority
          />
        </div>

        <div className="mx-auto mt-8 inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          Mantenimiento temporal
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Estamos mejorando NutriNet
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
          Estamos realizando ajustes internos para dejar la plataforma lista antes del lanzamiento.
          Mientras tanto, solo están disponibles las páginas legales.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/privacy-policy"
            className="inline-flex h-11 items-center justify-center rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Política de Privacidad
          </Link>
          <Link
            href="/terms"
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Términos de Servicio
          </Link>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Si necesitas hablar con nosotros, escribe a{' '}
          <a className="font-semibold text-emerald-700 underline underline-offset-4" href="mailto:contacto@nutrinet.cl">
            contacto@nutrinet.cl
          </a>
        </p>
      </div>
    </main>
  );
}
