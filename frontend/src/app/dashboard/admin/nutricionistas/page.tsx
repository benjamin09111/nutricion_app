"use client";

import { toast } from "sonner";
import Cookies from "js-cookie";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  MoreHorizontal,
  Building2,
  Pill,
  ShoppingCart,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings,
  Mail,
  X,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { fetchApi } from "@/lib/api-base";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  billingPeriod: string;
  isActive: boolean;
}

type ClientTab =
  | "Nutricionistas"
  | "Organizaciones"
  | "Suplementos fitness"
  | "Supermercados";

export default function AdminClientsPage() {
  const [activeTab, setActiveTab] = useState<ClientTab>("Nutricionistas");
  const [clients, setClients] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Modal states
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuRef = useRef<HTMLDivElement | null>(null);

  const normalizePlanValue = (plan?: MembershipPlan | null) => {
    if (!plan) return "FREE";
    if (plan.price === 0 || plan.slug.toLowerCase().includes("free")) {
      return "FREE";
    }
    return plan.slug.toUpperCase();
  };

  const getFreePlanValue = (plans: MembershipPlan[]) => {
    const freePlan = plans.find(
      (plan) => plan.price === 0 || plan.slug.toLowerCase().includes("free"),
    );
    return normalizePlanValue(freePlan || null);
  };

  const getPlanLabel = (plan: MembershipPlan) => {
    const price = Number(plan.price);
    const priceLabel =
      price === 0
        ? "Gratis"
        : new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0,
          }).format(price);

    return `${plan.name} — ${priceLabel}`;
  };

  const getFilterPlanOptions = () => {
    const freePlan = membershipPlans.find(
      (plan) => plan.price === 0 || plan.slug.toLowerCase().includes("free"),
    );

    return [
      { value: "all", label: "Todos los planes" },
      ...(freePlan
        ? [{ value: freePlan.slug.toLowerCase(), label: "Gratis" }]
        : [{ value: "free", label: "Gratis" }]),
      ...membershipPlans
        .filter((plan) => plan.price > 0)
        .map((plan) => ({
          value: plan.slug.toLowerCase(),
          label: plan.name,
        })),
    ];
  };

  const getSelectedPlanValue = (clientPlan?: string | null) => {
    if (!clientPlan) return getFreePlanValue(membershipPlans);

    const normalized = clientPlan.toUpperCase();
    const matchingPlan = membershipPlans.find(
      (plan) => normalizePlanValue(plan) === normalized,
    );

    return matchingPlan ? normalizePlanValue(matchingPlan) : getFreePlanValue(membershipPlans);
  };

  const getSelectedMembershipPlan = () =>
    membershipPlans.find((plan) => normalizePlanValue(plan) === selectedPlan) || null;

  useEffect(() => {
    fetchMembershipPlans();
    fetchClients(1);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedMenu = menuRef.current?.contains(target) ?? false;
      const clickedButton = openMenuId
        ? actionButtonRefs.current[openMenuId]?.contains(target) ?? false
        : false;

      if (openMenuId && !clickedMenu && !clickedButton) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  useEffect(() => {
    if (!openMenuId) return;

    const button = actionButtonRefs.current[openMenuId];
    if (!button) return;

    setMenuPosition(getMenuPosition(button));
  }, [openMenuId, clients]);

  useEffect(() => {
    if (!openMenuId) return;

    const closeMenu = () => {
      setOpenMenuId(null);
      setMenuPosition(null);
    };

    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [openMenuId]);

  const fetchMembershipPlans = async () => {
    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/memberships`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al cargar planes");
      const data = await response.json();
      setMembershipPlans(data);

      const freePlanValue = getFreePlanValue(data);
      setSelectedPlan((current) => current || freePlanValue);
    } catch (error) {
      console.error("Error fetching membership plans:", error);
    }
  };

  const fetchClients = async (pageArg = currentPage) => {
    setIsLoading(true);
    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const params = new URLSearchParams({
        role: "ALL_NUTRITIONISTS",
        page: String(pageArg),
        limit: "10",
      });

      switch (activeTab) {
        case "Organizaciones":
          params.set("role", "ORGANIZATION");
          break;
        case "Suplementos fitness":
          params.set("role", "SUPPLEMENT_STORE");
          break;
        case "Supermercados":
          params.set("role", "SUPERMARKET");
          break;
      }

      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (planFilter !== "all") params.set("plan", planFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (paymentFilter !== "all") {
        if (paymentFilter === "pending_transfer") {
          params.set("verification", "pending_transfer");
        } else {
          params.set("payment", paymentFilter);
        }
      }

      const response = await fetchApi(`/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error al cargar clientes");
      const data = await response.json();

      if (Array.isArray(data)) {
        setClients(data);
        setTotalItems(data.length);
        setTotalPages(1);
      } else {
        setClients(data.items || []);
        setTotalItems(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.page || pageArg || 1);
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los clientes");
      setClients([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    void fetchClients(1);
  };

  const handlePlanFilterChange = (value: string) => {
    setPlanFilter(value);
    setCurrentPage(1);
    void fetchClients(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    void fetchClients(1);
  };

  const handlePaymentFilterChange = (value: string) => {
    setPaymentFilter(value);
    setCurrentPage(1);
    void fetchClients(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    void fetchClients(page);
  };

  const handlePlanChange = (user: any, newPlan: string) => {
    setSelectedUser(user);
    setSelectedPlan(newPlan);
    setShowConfigModal(true);
  };

  const handleManualConfig = async (recordPayment = false) => {
    if (!selectedUser || !selectedPlan) return;

    const membershipPlan = getSelectedMembershipPlan();
    if (membershipPlan && membershipPlan.price > 0 && !recordPayment) {
      setShowPaymentConfirmModal(true);
      return;
    }

    setIsUpdating(true);
    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/users/${selectedUser.id}/plan`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          days: durationDays,
          recordPayment,
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar configuración");

      toast.success(
        `Configuración aplicada a ${selectedUser.fullName || selectedUser.email}`,
      );
      setShowConfigModal(false);
      setShowPaymentConfirmModal(false);
      fetchClients();
    } catch (error) {
      console.error(error);
      toast.error("Error al aplicar configuración");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(
        `/users/${selectedUser.id}/delete`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Error al eliminar usuario");

      toast.success(
        `Usuario ${selectedUser.fullName || selectedUser.email} marcado como eliminado`,
      );
      setShowDeleteModal(false);
      fetchClients();
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el usuario");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetUnpaidPlans = async () => {
    setIsUpdating(true);
    try {
      const token =
        Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/users/reset-unpaid-plans`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error al resetear planes");

      const result = await response.json();
      toast.success(result.message || "Planes reseteados correctamente");
      setShowResetModal(false);
      fetchClients();
    } catch (error) {
      console.error(error);
      toast.error("Error al resetear planes");
    } finally {
      setIsUpdating(false);
    }
  };

  const tabs: { label: ClientTab; icon: any }[] = [
    { label: "Nutricionistas", icon: GraduationCap },
    { label: "Organizaciones", icon: Building2 },
    { label: "Suplementos fitness", icon: Pill },
    { label: "Supermercados", icon: ShoppingCart },
  ];

  const getPaymentStatus = (client: any) => {
    if (client.verification === "pending_transfer") {
      return {
        label: "Transferencia pendiente",
        color: "text-amber-700 bg-amber-50",
        icon: AlertCircle,
      };
    }

    if (client.paymentState === "free") {
      return {
        label: "Gratis",
        color: "text-slate-700 bg-slate-100",
        icon: CheckCircle2,
      };
    }

    if (client.paymentState === "paid") {
      return {
        label: "Aprobado",
        color: "text-green-700 bg-green-50",
        icon: CheckCircle2,
      };
    }

    if (client.paymentState === "expired") {
      return {
        label: "Vencido",
        color: "text-rose-700 bg-rose-50",
        icon: AlertCircle,
      };
    }

    if (!client.subscriptionEndsAt)
      return {
        label: "Sin pago",
        color: "text-slate-500 bg-slate-100",
        icon: AlertCircle,
      };
    const endDate = new Date(client.subscriptionEndsAt);
    const now = new Date();

    if (endDate > now) {
      return {
        label: "Aprobado",
        color: "text-green-700 bg-green-50",
        icon: CheckCircle2,
      };
    } else {
      return {
        label: "Vencido",
        color: "text-rose-700 bg-rose-50",
        icon: AlertCircle,
      };
    }
  };

  const handleResendVerificationEmail = async (client: any) => {
    setIsResendingVerification(true);
    try {
      const response = await fetchApi(`/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: client.email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "No se pudo reenviar el correo");
      }

      toast.success(
        data.message || `Correo de confirmación reenviado a ${client.email}`,
      );
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo reenviar el correo de confirmación",
      );
    } finally {
      setIsResendingVerification(false);
    }
  };

  const getMenuPosition = (button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    const estimatedWidth = 144;
    const estimatedHeight = 132;
    const gap = 8;

    let left = rect.right - estimatedWidth;
    left = Math.max(gap, Math.min(left, window.innerWidth - estimatedWidth - gap));

    let top = rect.bottom + gap;
    if (top + estimatedHeight > window.innerHeight - gap) {
      top = Math.max(gap, rect.top - estimatedHeight - gap);
    }

    return { top, left };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-indigo-900">
            Clientes
          </h1>
          <p className="text-slate-500">
            Gestión de profesionales y partners de la plataforma.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "Nutricionistas" && (
            <Button
              onClick={() => setShowResetModal(true)}
              variant="outline"
              className="text-amber-600 border-amber-200 hover:bg-amber-50 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetear No Pagadores
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => {
                  setCurrentPage(1);
                  setActiveTab(tab.label);
                }}
                className={cn(
                  "group inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-400 group-hover:text-slate-600",
                  )}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder={`Buscar ${activeTab.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
          >
            Buscar
          </Button>
        </form>

      <div className="grid gap-3 md:grid-cols-3">
        <select
          value={planFilter}
          onChange={(e) => handlePlanFilterChange(e.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
        >
          {getFilterPlanOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
        >
          <option value="all">Todos los estados</option>
          <option value="ACTIVE">Activo</option>
          <option value="PENDING">Pendiente</option>
          <option value="SUSPENDED">Suspendido</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => handlePaymentFilterChange(e.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
        >
          <option value="all">Todos los pagos</option>
          <option value="free">Gratis</option>
          <option value="paid">Solo realizados</option>
          <option value="pending_transfer">Transferencias pendientes</option>
          <option value="expired">Vencido</option>
          <option value="none">Sin pago</option>
        </select>
      </div>
      <p className="text-xs font-medium text-slate-500">
        Ordenado del acceso más reciente al más antiguo.
      </p>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {activeTab === "Nutricionistas"
                    ? "Profesional"
                    : activeTab === "Organizaciones"
                      ? "Organización"
                      : activeTab === "Suplementos fitness"
                        ? "Tienda"
                        : "Supermercado"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pago
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {activeTab === "Nutricionistas"
                    ? "Pacientes"
                    : activeTab === "Organizaciones"
                      ? "Miembros"
                      : activeTab === "Suplementos fitness"
                        ? "Productos"
                        : "Sucursales"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-3 w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Cargando...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No hay clientes registrados en esta categoría.
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  const paymentStatus = getPaymentStatus(client);
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium uppercase">
                            {client.fullName?.charAt(0) ||
                              client.email.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {client.fullName || "Sin Nombre"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {client.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={getSelectedPlanValue(client.plan)}
                          onChange={(e) =>
                            handlePlanChange(client, e.target.value)
                          }
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset cursor-pointer border-none outline-none ${
                            client.plan === "ENTERPRISE"
                              ? "bg-purple-50 text-purple-700 ring-purple-600/20"
                              : client.plan === "PRO"
                                ? "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
                                : "bg-slate-50 text-slate-700 ring-slate-600/20"
                          }`}
                        >
                          {membershipPlans.length > 0 ? (
                            membershipPlans.map((plan) => (
                              <option
                                key={plan.id}
                                value={normalizePlanValue(plan)}
                              >
                                {getPlanLabel(plan)}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="FREE">Gratis</option>
                              <option value="PRO">PRO</option>
                              <option value="ENTERPRISE">ENTERPRISE</option>
                            </>
                          )}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${paymentStatus.color}`}
                        >
                          <paymentStatus.icon className="h-3 w-3" />
                          {paymentStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 font-mono">
                        {client.patientCount || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset",
                            client.status === "ACTIVE"
                              ? "bg-green-50 text-green-700 ring-green-600/20"
                              : client.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                                : "bg-red-50 text-red-700 ring-red-600/20",
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              client.status === "ACTIVE"
                                ? "bg-green-600"
                                : client.status === "PENDING"
                                  ? "bg-amber-600"
                                  : "bg-red-600",
                            )}
                          />
                          {client.status === "ACTIVE"
                            ? "Activo"
                            : client.status === "PENDING"
                              ? "Pendiente"
                              : "Suspendido"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {client.lastLogin
                          ? new Date(client.lastLogin).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 relative actions-menu-container">
                        <button
                          ref={(el) => {
                            actionButtonRefs.current[client.id] = el;
                          }}
                          onClick={() => {
                            if (openMenuId === client.id) {
                              setOpenMenuId(null);
                              setMenuPosition(null);
                              return;
                            }

                            const button = actionButtonRefs.current[client.id];
                            setMenuPosition(button ? getMenuPosition(button) : null);
                            setOpenMenuId(client.id);
                          }}
                          className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {typeof document !== "undefined" && openMenuId && menuPosition
          ? createPortal(
              <div
                ref={menuRef}
                className="fixed w-36 rounded-xl bg-white shadow-xl ring-1 ring-black/5 z-[9999] p-1.5 border-none animate-in fade-in zoom-in-95 duration-100"
                style={{ top: menuPosition.top, left: menuPosition.left }}
              >
                {(() => {
                  const client = clients.find((item) => item.id === openMenuId);
                  if (!client) return null;

                  return (
                    <>
                      {client.status === "PENDING" && (
                        <button
                          onClick={() => {
                            void handleResendVerificationEmail(client);
                            setOpenMenuId(null);
                            setMenuPosition(null);
                          }}
                          disabled={isResendingVerification}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Reenviar correo
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedUser(client);
                          setSelectedPlan(getSelectedPlanValue(client.plan));
                          setDurationDays(30);
                          setShowConfigModal(true);
                          setOpenMenuId(null);
                          setMenuPosition(null);
                        }}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Configurar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(client);
                          setShowDeleteModal(true);
                          setOpenMenuId(null);
                          setMenuPosition(null);
                        }}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors cursor-pointer border-t border-slate-100 mt-1 pt-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </button>
                    </>
                  );
                })()}
              </div>,
              document.body,
            )
          : null}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-500">
            Mostrando {clients.length} de {totalItems} resultados
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Manual Config Modal */}
      {showConfigModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowConfigModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Configurar Acceso
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Trial personalizado para{" "}
                  <strong>
                    {selectedUser?.fullName || selectedUser?.email}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest font-black text-slate-500 mb-2">
                  Membresía a Asignar
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 py-3.5 px-4 text-base font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none bg-white shadow-sm transition-all cursor-pointer"
                >
                  {membershipPlans.length > 0 ? (
                    membershipPlans.map((plan) => (
                      <option
                        key={plan.id}
                        value={normalizePlanValue(plan)}
                        className="text-slate-900 font-bold py-2"
                      >
                        {getPlanLabel(plan)} —{" "}
                        {plan.billingPeriod === "monthly"
                          ? "Ciclo Mensual"
                          : "Ciclo Anual"}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="FREE" className="text-slate-900 font-bold">
                        Gratis (Plan Básico)
                      </option>
                      <option value="PRO" className="text-slate-900 font-bold">
                        PRO (Plan Premium)
                      </option>
                      <option
                        value="ENTERPRISE"
                        className="text-slate-900 font-bold"
                      >
                        ENTERPRISE (Plan Corporativo)
                      </option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-black text-slate-500 mb-2">
                  Días de Trial / Cortesía
                </label>
                <Input
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(e) =>
                    setDurationDays(parseInt(e.target.value) || 0)
                  }
                  className="h-12 text-lg font-black text-indigo-900 border-2 border-slate-200 focus:border-indigo-600 rounded-xl"
                  placeholder="Ej: 30"
                />
                <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Vence el:{" "}
                    {new Date(
                      new Date().setDate(new Date().getDate() + durationDays),
                    ).toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium italic">
                  * El usuario volverá al plan FREE automáticamente tras expirar
                  este periodo.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setShowConfigModal(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => void handleManualConfig()}
                isLoading={isUpdating}
              >
                Aplicar Configuración
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Unpaid Plans Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetUnpaidPlans}
        title="Resetear Planes No Pagados"
        message="Esta acción cambiará a plan FREE a todos los nutricionistas cuya suscripción haya vencido o no tengan fecha de pago. ¿Deseas continuar?"
        confirmText="Resetear Planes"
        cancelText="Cancelar"
        variant="warning"
        isLoading={isUpdating}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleSoftDelete}
        title="Eliminar Cuenta"
        message={`¿Estás seguro que deseas eliminar la cuenta de ${selectedUser?.fullName || selectedUser?.email}? El usuario no podrá volver a ingresar y su cuenta quedará marcada como eliminada.`}
        confirmText="Eliminar Cuenta"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isUpdating}
      />

      <ConfirmModal
        isOpen={showPaymentConfirmModal}
        onClose={() => setShowPaymentConfirmModal(false)}
        onConfirm={() => void handleManualConfig(true)}
        title="Registrar pago"
        message={`El plan ${getSelectedMembershipPlan()?.name || selectedPlan} es pagado. Al confirmar, se registrará como ganancia y quedará guardado en pagos para ${selectedUser?.fullName || selectedUser?.email}.`}
        confirmText="Confirmar y guardar"
        cancelText="Cancelar"
        variant="info"
        isLoading={isUpdating}
      />
    </div>
  );
}
