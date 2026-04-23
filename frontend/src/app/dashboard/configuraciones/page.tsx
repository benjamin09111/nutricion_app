"use client";

import { useState, useEffect } from "react";
import { User, Lock, Save, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authService } from "@/features/auth/services/auth.service";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";

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
    settings?: any;
  } | null>(null);

  const [professionalInstagram, setProfessionalInstagram] = useState("");
  const [professionalPhone, setProfessionalPhone] = useState("");
  const [professionalEmail, setProfessionalEmail] = useState("");
  const [isSavingProfessionalContact, setIsSavingProfessionalContact] =
    useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const settings = user.nutritionist?.settings || {};
        setUserData({
          email: user.email,
          fullName: user.nutritionist?.fullName || "Profesional",
          settings,
        });
        setProfessionalInstagram(settings.professionalInstagram || "");
        setProfessionalPhone(settings.professionalPhone || "");
        setProfessionalEmail(settings.professionalEmail || "");
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

  const handleSaveProfessionalContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfessionalContact(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetchApi(`/users/me/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          professionalInstagram: professionalInstagram.trim(),
          professionalPhone: professionalPhone.trim(),
          professionalEmail: professionalEmail.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el contacto profesional");
      }

      toast.success("Contacto profesional guardado correctamente");

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.nutritionist) {
          user.nutritionist.settings = {
            ...user.nutritionist.settings,
            professionalInstagram: professionalInstagram.trim(),
            professionalPhone: professionalPhone.trim(),
            professionalEmail: professionalEmail.trim(),
          };
          localStorage.setItem("user", JSON.stringify(user));
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Hubo un error");
    } finally {
      setIsSavingProfessionalContact(false);
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

            <form onSubmit={handleSaveProfessionalContact} className="mt-6 space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Instagram (Portada Entregable)
                  </label>
                  <Input
                    type="text"
                    value={professionalInstagram}
                    onChange={(e) => setProfessionalInstagram(e.target.value)}
                    placeholder="@tuusuario"
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Número de Celular (Portada Entregable)
                  </label>
                  <Input
                    type="text"
                    value={professionalPhone}
                    onChange={(e) => setProfessionalPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    maxLength={40}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Correo de Contacto (Portada Entregable)
                  </label>
                  <Input
                    type="email"
                    value={professionalEmail}
                    onChange={(e) => setProfessionalEmail(e.target.value)}
                    placeholder="contacto@tudominio.cl"
                    maxLength={120}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={isSavingProfessionalContact}
                  className="flex items-center gap-2 font-bold"
                >
                  {!isSavingProfessionalContact && <Save className="h-4 w-4" />}
                  Guardar Contacto Profesional
                </Button>
              </div>
            </form>
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

    </div>
  );
}
