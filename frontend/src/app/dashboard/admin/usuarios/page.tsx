"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Mail,
  Shield,
  KeyRound,
  RefreshCw,
  User,
  Trash2,
  Calendar,
  CheckCircle2,
  UserX,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { fetchApi } from "@/lib/api-base";

interface UserData {
  id: string;
  email: string;
  fullName?: string;
  role:
    | "ADMIN"
    | "ADMIN_MASTER"
    | "ADMIN_GENERAL"
    | "NUTRITIONIST"
    | "NUTRITIONIST_DEVELOPER"
    | "WORKER"
    | "ORGANIZATION"
    | "SUPPLEMENT_STORE"
    | "SUPERMARKET";
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  plan: "FREE" | "PRO" | "ENTERPRISE";
  subscriptionEndsAt: string | null;
  createdAt: string;
}

interface MembershipPlan {
  id: string;
  name: string;
  billingPeriod: string;
}

type CreationRole =
  | "ADMIN_MASTER"
  | "ADMIN_GENERAL"
  | "NUTRITIONIST"
  | "NUTRITIONIST_DEVELOPER"
  | "WORKER"
  | "ORGANIZATION"
  | "SUPPLEMENT_STORE"
  | "SUPERMARKET";

const ADMIN_ROLES = ["ADMIN", "ADMIN_MASTER", "ADMIN_GENERAL"] as const;
const isAdminRole = (role: string) =>
  (ADMIN_ROLES as readonly string[]).includes(role);
const isDeveloperRole = (role: string) => role === "NUTRITIONIST_DEVELOPER";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  ADMIN_MASTER: "Admin Master",
  ADMIN_GENERAL: "Admin General",
  NUTRITIONIST: "Nutricionista",
  NUTRITIONIST_DEVELOPER: "Nutri Dev QA",
  WORKER: "Worker",
  ORGANIZATION: "Organización",
  SUPPLEMENT_STORE: "Tienda de Suplementos",
  SUPERMARKET: "Supermercado",
};

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<"create" | "reset" | "admins">(
    "admins",
  );
  const [accountFilter, setAccountFilter] = useState<
    "all" | "admins" | "developer"
  >("all");
  const [currentAdminRole, setCurrentAdminRole] = useState<string | null>(null);

  // State for Users List
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Selection state for modals
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "STATUS" | "ROLE" | "DELETE";
    targetValue: string;
  } | null>(null);

  // Create Account State
  const [creationEmail, setCreationEmail] = useState("");
  const [creationName, setCreationName] = useState("");
  const [creationRole, setCreationRole] = useState<CreationRole>("NUTRITIONIST");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [pendingCreatePayload, setPendingCreatePayload] = useState<{
    email: string;
    fullName: string;
    role: CreationRole;
    planId?: string;
  } | null>(null);
  const [isCreateConflictModalOpen, setIsCreateConflictModalOpen] =
    useState(false);

  // Reset Password State
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Get current user role from token
  useEffect(() => {
    const token =
      Cookies.get("auth_token") || localStorage.getItem("auth_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentAdminRole(payload.role);
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }
  }, []);

  const fetchMembershipPlans = async () => {
    try {
      const response = await fetchApi(`/memberships/active`);
      if (!response.ok) throw new Error("Error al cargar planes");
      const data = await response.json();
      setMembershipPlans(data);
      if (data.length > 0) {
        setSelectedPlanId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching membership plans:", error);
    }
  };

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const roleFilter =
        accountFilter === "admins"
          ? "ALL_ADMINS"
          : accountFilter === "developer"
            ? "NUTRITIONIST_DEVELOPER"
            : "ALL_MANAGEMENT_ACCOUNTS";

      const response = await fetchApi(`/users?role=${roleFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al cargar usuarios");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los usuarios");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [accountFilter]);

  // Fetch users when on 'admins' tab
  useEffect(() => {
    fetchMembershipPlans();
    if (activeTab === "admins") {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  // Permission Helpers
  const isMaster = currentAdminRole === "ADMIN_MASTER";

  const canModifyAdmins = (targetUser: UserData) => {
    const isTargetAdmin = isAdminRole(targetUser.role);
    // Only Master can touch other admins
    return isMaster || !isTargetAdmin;
  };

  // Action Helpers
  const handleStatusToggle = (user: UserData) => {
    if (!canModifyAdmins(user)) {
      toast.error(
        "Solo un Admin Master puede desactivar cuentas administrativas",
      );
      return;
    }
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setSelectedUser(user);
    setConfirmAction({ type: "STATUS", targetValue: nextStatus });
    setIsConfirmModalOpen(true);
  };

  const handleRoleChangeRequest = (user: UserData, nextRole: string) => {
    if (!isMaster) {
      toast.error("Solo un Admin Master puede cambiar jerarquías");
      return;
    }
    setSelectedUser(user);
    setConfirmAction({ type: "ROLE", targetValue: nextRole });
    setIsConfirmModalOpen(true);
  };

  const handleDeleteRequest = (user: UserData) => {
    if (!canModifyAdmins(user)) {
      toast.error("Solo un Admin Master puede eliminar cuentas administrativas");
      return;
    }

    setSelectedUser(user);
    setConfirmAction({ type: "DELETE", targetValue: "DELETE" });
    setIsConfirmModalOpen(true);
  };

  const executeConfirmAction = async () => {
    if (!selectedUser || !confirmAction) return;

    setIsLoadingUsers(true);
    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response =
        confirmAction.type === "DELETE"
          ? await fetchApi(`/users/${selectedUser.id}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          : await fetchApi(`/users/${selectedUser.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body:
                confirmAction.type === "STATUS"
                  ? JSON.stringify({ status: confirmAction.targetValue })
                  : JSON.stringify({ role: confirmAction.targetValue }),
            });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Error en la actualización");
      }

      toast.success(
        confirmAction.type === "DELETE"
          ? "Usuario eliminado permanentemente"
          : "Usuario actualizado correctamente",
      );
      setIsConfirmModalOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Hubo un error al procesar el cambio",
      );
    } finally {
      setIsLoadingUsers(false);
      setSelectedUser(null);
      setConfirmAction(null);
    }
  };

  const submitCreateAccount = async (
    payload: {
      email: string;
      fullName: string;
      role: CreationRole;
      planId?: string;
    },
    forceRoleChange = false,
  ) => {
    setIsCreatingAccount(true);
    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/auth/create-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: payload.email,
          fullName: payload.fullName,
          role: payload.role,
          planId: payload.planId,
          forceRoleChange,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 409 && !forceRoleChange) {
          setPendingCreatePayload(payload);
          setIsCreateConflictModalOpen(true);
          return;
        }

        throw new Error(data.message || "Error al crear cuenta");
      }

      setCreationEmail("");
      setCreationName("");
      toast.success(
        forceRoleChange
          ? "Se actualizó el acceso Google y el rol"
          : "Acceso Google habilitado y notificado",
      );
      setActiveTab("admins");
      setPendingCreatePayload(null);
      setIsCreateConflictModalOpen(false);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error al crear la cuenta",
      );
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();

    const isTargetAdmin = isAdminRole(creationRole);
    if (isTargetAdmin && !isMaster) {
      toast.error(
        "Solo un Admin Master puede crear otras cuentas administrativas",
      );
      return;
    }

    void submitCreateAccount({
      email: creationEmail,
      fullName: creationName,
      role: creationRole,
      planId:
        creationRole === "NUTRITIONIST" || creationRole === "ORGANIZATION"
          ? selectedPlanId
          : undefined,
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    try {
      const response = await fetchApi(`/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al reenviar acceso");
      }

      setResetEmail("");
      toast.success("Se ha reenviado el acceso Google");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al reenviar acceso",
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-indigo-900">
          Cuentas
        </h1>
        <p className="text-slate-500">
          Administración de administradores y nutricionistas developer.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-indigo-100 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("admins")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "admins"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
          }`}
        >
          <Shield className="h-4 w-4" />
          Usuarios
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "create"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Crear Cuenta
        </button>
        <button
          onClick={() => setActiveTab("reset")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "reset"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          Reenviar Acceso
        </button>
      </div>

      {activeTab === "admins" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={() => setAccountFilter("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                accountFilter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setAccountFilter("admins")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                accountFilter === "admins"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Admins
            </button>
            <button
              type="button"
              onClick={() => setAccountFilter("developer")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                accountFilter === "developer"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Nutri Dev
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Usuario</th>
                  <th className="px-6 py-3">Nivel de Acceso</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingUsers ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {user.fullName || user.email}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isAdminRole(user.role) ? (
                          <select
                            value={user.role}
                            disabled={!isMaster}
                            onChange={(e) =>
                              handleRoleChangeRequest(user, e.target.value)
                            }
                            className={`text-xs font-bold text-slate-900 rounded-md bg-white border-slate-200 focus:ring-indigo-500 py-1 transition-all shadow-sm ${!isMaster ? "opacity-70 cursor-not-allowed bg-slate-50" : "cursor-pointer"}`}
                          >
                            {user.role === "ADMIN" && (
                              <option value="ADMIN">
                                Administrador (Legado)
                              </option>
                            )}
                            <option value="ADMIN_MASTER">Admin Master</option>
                            <option value="ADMIN_GENERAL">Admin General</option>
                          </select>
                        ) : isDeveloperRole(user.role) ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              Nutri Dev QA
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Nutricionista con extras para pruebas y cambios de plan.
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-600">
                            {roleLabels[user.role] || user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            user.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {user.status === "ACTIVE" ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            disabled={!canModifyAdmins(user)}
                            onClick={() => handleStatusToggle(user)}
                            className={`h-8 px-3 ${!canModifyAdmins(user) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${
                              user.status === "ACTIVE"
                                ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {user.status === "ACTIVE" ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Activar
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={!canModifyAdmins(user)}
                            onClick={() => handleDeleteRequest(user)}
                            className={`h-8 px-3 ${!canModifyAdmins(user) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} text-slate-600 hover:text-rose-700 hover:bg-rose-50`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Forms shown ONLY when their specific tab is active */}
      {(activeTab === "create" || activeTab === "reset") && (
        <div className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "create" ? (
            <div className="rounded-xl border border-indigo-200 bg-white shadow-sm h-fit">
              <div className="border-b border-indigo-100 px-6 py-4 bg-indigo-50/30">
                <div className="flex items-center gap-x-2">
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                  <h2 className="font-semibold text-indigo-900">
                    Crear Nuevo Usuario
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <Input
                        type="text"
                        required
                        value={creationName}
                        onChange={(e) => setCreationName(e.target.value)}
                        className="pl-10"
                        placeholder="Nombre del Usuario"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <Input
                        type="email"
                        required
                        value={creationEmail}
                        onChange={(e) => setCreationEmail(e.target.value)}
                        className="pl-10"
                        placeholder="usuario@ejemplo.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">
                      Rol Proporcionado
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield className="h-4 w-4 text-slate-400" />
                      </div>
                      <select
                        value={creationRole}
                        onChange={(e) => setCreationRole(e.target.value as CreationRole)}
                        className="block w-full rounded-md border-0 py-2.5 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      >
                        <option value="NUTRITIONIST">Nutricionista</option>
                        <option value="NUTRITIONIST_DEVELOPER">
                          Nutri Dev QA
                        </option>
                        <option value="WORKER">Worker</option>
                        {isMaster && (
                          <option value="ADMIN_GENERAL">
                            ADMIN GENERAL (Gestión)
                          </option>
                        )}
                        <option value="ORGANIZATION">
                          Organización / Clínica
                        </option>
                        <option value="SUPPLEMENT_STORE">
                          Tienda de Suplementos
                        </option>
                        <option value="SUPERMARKET">Supermercado</option>
                      </select>
                    </div>
                  </div>

                  {/* Plan Selection - Only for Nutritionists/Orgs */}
                  {(creationRole === "NUTRITIONIST" ||
                    creationRole === "ORGANIZATION") && (
                    <div className="animate-in fade-in duration-300">
                      <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">
                        Plan de Suscripción Inicial
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-4 w-4 text-slate-400" />
                        </div>
                        <select
                          value={selectedPlanId}
                          onChange={(e) => setSelectedPlanId(e.target.value)}
                          className="block w-full rounded-md border-0 py-2.5 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white"
                        >
                          {membershipPlans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} ({plan.billingPeriod})
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500 italic">
                        * Se creará una suscripción activa de 30 días para este
                        plan.
                      </p>
                    </div>
                  )}

                    {creationRole === "NUTRITIONIST_DEVELOPER" && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 animate-in fade-in duration-300">
                        Se creará con el mayor plan activo y acceso al selector de
                        planes en el navbar para QA.
                      </div>
                    )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      isLoading={isCreatingAccount}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      Habilitar Acceso con Google
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-white shadow-sm h-fit">
              <div className="border-b border-amber-100 px-6 py-4 bg-amber-50/30">
                <div className="flex items-center gap-x-2">
                  <RefreshCw className="h-5 w-5 text-amber-600" />
                  <h2 className="font-semibold text-amber-900">
                    Reenvío de Acceso
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">
                      Correo Electrónico del Usuario
                    </label>
                    <Input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="correo-a-reenviar@ejemplo.com"
                    />
                  </div>
                  <div className="pt-2">
                    <Button
                      type="submit"
                      isLoading={isResetting}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      Reenviar Acceso
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col justify-center h-fit">
            <h3 className="font-semibold text-slate-800 mb-2">
              Protocolo de Seguridad
            </h3>
            <p className="text-sm text-slate-600">
              Todos los accesos se habilitan con Google. Si el correo ya existe,
              puedes confirmar el cambio de rol o cancelar antes de sobrescribir
              la cuenta.
            </p>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isCreateConflictModalOpen}
        onClose={() => {
          setIsCreateConflictModalOpen(false);
          setPendingCreatePayload(null);
        }}
        onConfirm={() => {
          if (!pendingCreatePayload) return;
          void submitCreateAccount(pendingCreatePayload, true);
        }}
        isLoading={isCreatingAccount}
        title="Correo ya registrado"
        message={`Ese correo ya existe. Si continúas, se forzará el rol a ${roleLabels[pendingCreatePayload?.role || "ADMIN_GENERAL"] || "el rol seleccionado"} y se habilitará el acceso con Google.`}
        confirmText="Forzar cambio"
        cancelText="Cancelar"
        variant="warning"
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeConfirmAction}
        isLoading={isLoadingUsers}
        title={
          confirmAction?.type === "STATUS"
            ? "Cambiar Estado de Cuenta"
            : confirmAction?.type === "ROLE"
              ? "Cambiar Rol de Usuario"
              : "Eliminar Cuenta"
        }
        message={
          confirmAction?.type === "DELETE"
            ? `¿Estás seguro de que deseas eliminar permanentemente la cuenta de ${selectedUser?.email}? Esta acción borrará la cuenta de la base de datos y no se puede deshacer.`
            : `¿Estás seguro de que deseas cambiar el ${confirmAction?.type === "STATUS" ? "estado" : "rol"} de ${selectedUser?.email} a ${confirmAction?.type === "ROLE" ? roleLabels[confirmAction.targetValue] : confirmAction?.targetValue === "ACTIVE" ? "Activo" : "Inactivo"}? Esta acción tendrá efecto inmediato.`
        }
        variant={confirmAction?.type === "DELETE" ? "danger" : confirmAction?.type === "STATUS" ? "danger" : "warning"}
        confirmText={confirmAction?.type === "DELETE" ? "Sí, eliminar" : "Sí, actualizar"}
        cancelText="Cancelar"
      />
    </div>
  );
}
