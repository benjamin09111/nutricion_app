"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ChevronRight,
  Mail,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-base";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

// Helper for safe localStorage access
const safeLocalStorage = {
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (e) { }
  }
};

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = accessCode.trim().replace(/\D/g, "");

    if (!normalizedEmail || normalizedCode.length !== 6) {
      toast.error("Por favor ingresa tu correo y el código de 6 dígitos.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchApi("/patient-portals/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          accessCode: normalizedCode
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Credenciales incorrectas");
      }

      // Guardamos el token de forma global para el portal
      // Usamos una clave especial que PortalClient reconozca como "sesión global"
      safeLocalStorage.setItem("portal_session_me", data.accessToken);

      toast.success("¡Bienvenido de nuevo!");
      // Redirigimos a la ruta de dashboard personal
      router.push("/portal/me");
    } catch (error: any) {
      toast.error(error.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-50/50 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-50/50 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo/Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="w-20 h-20 rounded-[2rem] bg-white shadow-2xl shadow-indigo-100 flex items-center justify-center mx-auto mb-6 transform hover:scale-105 transition-transform duration-500">
            <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Portal del Paciente</h1>
          <p className="text-slate-500 font-medium text-sm">Ingresa tus datos para continuar tu seguimiento</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl shadow-indigo-100/50 border border-white relative overflow-hidden group">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-300" />
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Código de Acceso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-300" />
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="6 dígitos"
                  className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-black tracking-[0.3em] text-xl transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              Iniciar Sesión
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Powered by NutriNet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
