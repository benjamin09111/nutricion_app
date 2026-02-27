"use client";

import { useState } from "react";
import {
  Save,
  Globe,
  Lock,
  Mail,
  Server,
  Bell,
  Shield,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  useSubscription,
  SubscriptionPlan,
} from "@/context/SubscriptionContext";

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    // Toast would go here
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-indigo-900">
            Ajustes Globales
          </h1>
          <p className="text-slate-500">
            Configuración general de la plataforma NutriSaaS.
          </p>
        </div>
        <Button
          onClick={handleSave}
          isLoading={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <Save className="h-4 w-4" />
          Guardar Cambios
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <div className="rounded-xl border border-indigo-100 bg-white shadow-sm">
          <div className="border-b border-indigo-100 px-6 py-4 bg-indigo-50/10">
            <div className="flex items-center gap-x-2">
              <Globe className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold text-indigo-900">General</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">
                Nombre de la Plataforma
              </label>
              <Input defaultValue="NutriSaaS" />
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">
                URL de Soporte
              </label>
              <Input defaultValue="https://soporte.nutrisaas.com" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-slate-700">
                Modo Mantenimiento
              </span>
              <div className="h-6 w-11 rounded-full bg-slate-200 border-2 border-transparent cursor-pointer"></div>
            </div>
          </div>
        </div>

        {/* Email Service */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-x-2">
              <Mail className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold text-slate-900">
                Servicio de Correo
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">
                Proveedor (SMTP)
              </label>
              <select className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                <option>AWS SES</option>
                <option>SendGrid</option>
                <option>Mailgun</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">
                Email Remitente
              </label>
              <Input defaultValue="no-reply@nutrisaas.com" />
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-x-2">
              <Shield className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold text-slate-900">Seguridad</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-sm font-medium text-slate-700">
                  Registro Abierto
                </span>
                <span className="text-xs text-slate-500">
                  Permitir que nuevos usuarios se registren libremente
                </span>
              </div>
              <div className="h-6 w-11 rounded-full bg-indigo-600 border-2 border-transparent cursor-pointer relative">
                <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"></span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-sm font-medium text-slate-700">
                  2FA Obligatorio (Admin)
                </span>
                <span className="text-xs text-slate-500">
                  Requerir autenticación de dos factores para admins
                </span>
              </div>
              <div className="h-6 w-11 rounded-full bg-slate-200 border-2 border-transparent cursor-pointer"></div>
            </div>
          </div>
        </div>

        {/* System Notifications */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-x-2">
              <Bell className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold text-slate-900">
                Anuncios del Sistema
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">
                Banner de Anuncio (Global)
              </label>
              <Input placeholder="Ej: Mantenimiento programado para el Domingo..." />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="w-full">
                Limpiar
              </Button>
              <Button
                variant="outline"
                className="w-full text-indigo-600 border-indigo-200 bg-indigo-50"
              >
                Publicar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for Admin View
