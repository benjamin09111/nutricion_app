import Link from "next/link";
import Image from "next/image";

type Props = {
  searchParams?: Promise<{ email?: string }>;
};

export default async function SessionUpdatedPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const email = params.email || "tu correo";

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 ring-1 ring-emerald-100">
          <Image src="/logo_2.webp" alt="NutriNet" width={56} height={56} className="h-14 w-14 object-contain" priority />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Tu plan se ha actualizado
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Por favor, actualiza tu sesión de <span className="font-semibold text-slate-900">{email}</span>.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Esto asegura que veas los permisos correctos de tu nuevo plan.
        </p>

        <Link
          href="/login?autostart=1&callbackUrl=/dashboard"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    </main>
  );
}
