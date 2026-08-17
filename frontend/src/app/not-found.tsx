import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Search, Home, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Página no encontrada | NutriNet",
  description: "La página que buscas no existe o ha sido movida.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-emerald-50/30 px-4 py-12 text-slate-900">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xl shadow-slate-900/5 sm:p-10">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 ring-1 ring-emerald-100/80">
          <Image
            src="/logo_2.webp"
            alt="NutriNet"
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
            priority
          />
        </div>

        <div className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200/60">
          Error 404
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Página no encontrada
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          La página o el perfil profesional que intentas consultar no existe, cambió su dirección o ya no está disponible públicamente.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            Ir al inicio
          </Link>

          <Link
            href="/nutricionistas"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <Search className="h-4 w-4 text-slate-500" />
            Buscar nutricionista
          </Link>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-400">
            ¿Crees que se trata de un error? Escríbenos a{" "}
            <a
              href="mailto:contacto@nutrinet.cl"
              className="font-medium text-emerald-600 hover:underline"
            >
              contacto@nutrinet.cl
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
