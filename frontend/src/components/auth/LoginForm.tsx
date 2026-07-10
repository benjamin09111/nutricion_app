"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GoogleButton from "@/components/auth/GoogleButton";
import { resolveRequiredUrl } from "@/lib/runtime-url.util";
import EmailLoginForm from "./EmailLoginForm";
import RegisterForm from "./RegisterForm";
import VerificationNotice from "./VerificationNotice";
import { resolveSafePostAuthPath } from "@/lib/safe-redirect";

type AuthTab = "login" | "register";
type VerificationState = { email: string; emailSent: boolean };

export default function LoginForm({ autoStart = false }: { autoStart?: boolean }) {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [verification, setVerification] = useState<VerificationState | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = resolveSafePostAuthPath(
    searchParams.get("callbackUrl"),
  );

  const handleGoogleLogin = useCallback(() => {
    if (isGoogleSigningIn) return;
    setIsGoogleSigningIn(true);
    const backendUrl = resolveRequiredUrl(
      process.env.NEXT_PUBLIC_BACKEND_URL,
      process.env.NEXT_PUBLIC_API_URL,
    );
    window.location.href = `${backendUrl}/auth/google/start?next=${encodeURIComponent(
      callbackUrl,
    )}`;
  }, [callbackUrl, isGoogleSigningIn]);

  useEffect(() => {
    if (!autoStart || isGoogleSigningIn) return;
    handleGoogleLogin();
  }, [autoStart, handleGoogleLogin, isGoogleSigningIn]);

  if (autoStart) return null;

  if (verification) {
    return (
      <VerificationNotice
        email={verification.email}
        emailSent={verification.emailSent}
        onBack={() => {
          setVerification(null);
          setActiveTab("login");
        }}
      />
    );
  }

  const handleLoginSuccess = (user: { role?: string }) => {
    if (searchParams.get("callbackUrl")) {
      router.push(callbackUrl);
      return;
    }
    const isAdmin = ["ADMIN", "ADMIN_MASTER", "ADMIN_GENERAL"].includes(
      user.role || "",
    );
    router.push(isAdmin ? "/dashboard/admin" : "/dashboard");
  };

  return (
    <div>
      <div
        className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1"
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
              className={`rounded-xl px-3 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                selected
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          );
        })}
      </div>

      {activeTab === "login" ? (
        <EmailLoginForm
          onSuccess={handleLoginSuccess}
          onVerificationRequired={(email) =>
            setVerification({ email, emailSent: true })
          }
        />
      ) : (
        <RegisterForm
          onRegistered={(email, emailSent) =>
            setVerification({ email, emailSent })
          }
        />
      )}

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            o continúa con
          </span>
        </div>
      </div>

      <GoogleButton
        onClick={handleGoogleLogin}
        isLoading={isGoogleSigningIn}
        text="Continuar con Google"
      />
    </div>
  );
}
