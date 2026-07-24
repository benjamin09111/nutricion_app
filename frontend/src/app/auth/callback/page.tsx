import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuthCallbackClient />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <p className="text-sm font-bold text-slate-800">Iniciando sesión</p>
        <p className="max-w-xs text-center text-sm leading-6 text-slate-600">
          Validando tu cuenta y preparando tu espacio de trabajo...
        </p>
      </div>
    </main>
  );
}
