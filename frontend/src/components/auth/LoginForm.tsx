"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import GoogleButton from "@/components/auth/GoogleButton";
import { resolveRequiredUrl } from "@/lib/runtime-url.util";

export default function LoginForm() {
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const searchParams = useSearchParams();

  const handleGoogleLogin = () => {
    if (isGoogleSigningIn) return;

    setIsGoogleSigningIn(true);
    const backendUrl = resolveRequiredUrl(
      process.env.NEXT_PUBLIC_BACKEND_URL,
      process.env.NEXT_PUBLIC_API_URL,
    );
    const next = searchParams.get("callbackUrl") || "/dashboard";

    window.location.href = `${backendUrl}/auth/google/start?next=${encodeURIComponent(next)}`;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50/70 p-6 shadow-sm">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
          <Sparkles className="h-3.5 w-3.5" />
          Acceso con Google
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Inicia sesión con tu cuenta de Google
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          Sin contraseñas. Tu correo verificado y Google Calendar quedan listos
          desde el primer acceso.
        </p>
      </div>

      <GoogleButton
        onClick={handleGoogleLogin}
        isLoading={isGoogleSigningIn}
        text="Continuar con Google"
      />

      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <p>
          Usa tu correo profesional de Google para entrar y conectar tu agenda
          altiro.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        <span className="h-px w-10 bg-slate-200" />
        o simplemente presiona el botón
        <span className="h-px w-10 bg-slate-200" />
      </div>

      <p className="text-center text-xs leading-5 text-slate-500">
        Si necesitas ayuda, escríbenos desde la landing antes de iniciar.
      </p>
    </div>
  );
}
