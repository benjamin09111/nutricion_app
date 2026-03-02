"use client";

import { useState, useEffect } from "react";
import { User, Lock, Save, Eye, EyeOff, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authService } from "@/features/auth/services/auth.service";
import { toast } from "sonner";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [userData, setUserData] = useState<{
    email: string;
    fullName?: string;
  } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserData({
          email: user.email,
          fullName: user.nutritionist?.fullName || "Profesional",
        });
      } catch (e) {
        console.error("Error loading user data", e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }

    setIsLoading(true);
    try {
      await authService.updatePassword({
        currentPassword,
        newPassword,
      });
      toast.success("Contraseña actualizada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Configuraciones
        </h1>
        <p className="text-slate-500">
          Gestiona tu perfil y preferencias de la cuenta.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm font-medium">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-x-2">
              <User className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold text-slate-900">
                Información del Perfil
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-x-4 mb-6 font-bold">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 border border-emerald-200 text-2xl font-bold">
                {userData?.fullName?.charAt(0) || "U"}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {userData?.fullName || "Cargando..."}
                </h3>
                <p className="text-sm font-medium text-slate-500">
                  {userData?.email || "..."}
                </p>
                <div className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  Perfil Profesional
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 caps-lock">
                  Nombre en Pantalla
                </label>
                <Input
                  type="text"
                  disabled
                  value={userData?.fullName || ""}
                  className="bg-slate-50 cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 caps-lock">
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  disabled
                  value={userData?.email || ""}
                  className="bg-slate-50 cursor-not-allowed font-medium"
                />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400 italic">
              * Para cambiar tu nombre o correo, contacta con soporte
              administrativo.
            </p>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm font-medium">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-x-2">
              <Lock className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold text-slate-900">
                Seguridad y Acceso
              </h2>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    className="pr-10"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    className="pr-10"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    className="pr-10"
                    placeholder="Repite tu nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full flex items-center gap-2 font-bold"
                >
                  {!isLoading && <Save className="h-4 w-4" />}
                  Guardar Nueva Contraseña
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Advanced Information (Locked/Pro Feature) - Compact Version */}
      <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 flex items-center justify-between text-sm">
        <div className="flex items-center gap-x-4 text-emerald-900">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <span className="font-bold text-base block mb-0.5">
              Potencia tu Marca Personal
            </span>
            <span className="text-emerald-700/80 font-medium">
              Próximamente: Vincula tus redes sociales (Instagram, LinkedIn) y
              añade una BIO profesional que aparecerá en tus informes y PDF
              entregables.
            </span>
          </div>
        </div>
        <div className="hidden sm:block">
          <span className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
            PRÓXIMAMENTE
          </span>
        </div>
      </div>
    </div>
  );
}
