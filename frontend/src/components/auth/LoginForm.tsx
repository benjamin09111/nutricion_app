"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import GoogleButton from "@/components/auth/GoogleButton";
import { resolveRequiredUrl } from "@/lib/runtime-url.util";
import EmailLoginForm from "./EmailLoginForm";
import RegisterForm from "./RegisterForm";
import VerificationNotice from "./VerificationNotice";
import { resolveSafePostAuthPath } from "@/lib/safe-redirect";

type AuthTab = "login" | "register";
type VerificationState = { email: string; emailSent: boolean };

type LoginFormProps = {
  autoStart?: boolean;
  activeTab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
};

export default function LoginForm({
  autoStart = false,
  activeTab,
  onTabChange,
}: LoginFormProps) {
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

  if (isGoogleSigningIn) {
    return (
      <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-white px-4">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden="true" />
          <p className="text-sm font-bold text-slate-800" aria-live="polite">
            Iniciando sesión con Google
          </p>
          <p className="max-w-xs text-sm leading-6 text-slate-600">
            Te estamos redirigiendo de forma segura. No cierres esta ventana.
          </p>
        </div>
      </div>
    );
  }

  if (verification) {
    return (
      <VerificationNotice
        email={verification.email}
        emailSent={verification.emailSent}
        onBack={() => {
          setVerification(null);
          onTabChange("login");
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

  const bodyWidthClass = "mx-auto w-full max-w-md";

  return (
    <div className="space-y-6">
      <div className={bodyWidthClass}>
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
    </div>
  );
}

