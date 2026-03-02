"use client";

import {
  Building2,
  Plus,
  Users,
  ShieldCheck,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const organizations = [
  {
    id: "1",
    name: "Clínica Alemana",
    admin: "Carlos Rodríguez",
    licensesTotal: 50,
    licensesUsed: 32,
    status: "Active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Centro Salud Integral",
    admin: "Marta Sánchez",
    licensesTotal: 10,
    licensesUsed: 8,
    status: "Active",
    createdAt: "2024-02-01",
  },
  {
    id: "3",
    name: "Hospital del Trabajador",
    admin: "Juan Pérez",
    licensesTotal: 100,
    licensesUsed: 45,
    status: "Pending",
    createdAt: "2024-02-10",
  },
];

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Organizaciones y Licencias
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Gestiona empresas, clínicas y centros de salud con múltiples
            licencias profesionales.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Organización
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total Organizaciones
            </p>
            <Building2 className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {organizations.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Licencias Asignadas
            </p>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">160</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Uso Promedio</p>
            <ShieldCheck className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">54%</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Organización
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Admin Corp
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Licencias (Uso/Total)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Fecha Alta
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200 font-medium">
              {organizations.map((org) => (
                <tr
                  key={org.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-slate-900">
                          {org.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          ID: ORG-{org.id}00
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {org.admin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 w-32">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">
                          {org.licensesUsed} / {org.licensesTotal}
                        </span>
                        <span className="font-bold text-indigo-600">
                          {Math.round(
                            (org.licensesUsed / org.licensesTotal) * 100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all"
                          style={{
                            width: `${(org.licensesUsed / org.licensesTotal) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        org.status === "Active"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {org.status === "Active" ? "Activo" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {org.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hint Box */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
        <div className="flex">
          <div className="shrink-0">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-bold text-indigo-800">
              Concepto B2B / CORP_ADMIN
            </h3>
            <div className="mt-2 text-sm text-indigo-700">
              <p>
                El flujo para corporativos permitirá que una organización compre
                un paquete de licencias. Un administrador de la clínica tendrá
                su propio panel para asignar estos correos a sus nutricionistas
                sin intervención manual de NutriSaaS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
