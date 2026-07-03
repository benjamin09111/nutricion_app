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

  const normalizePlanKeyValue = (value?: string | null) => {
    const normalized = String(value || "").trim().toLowerCase();

    if (!normalized) return "FREE";
    if (normalized.includes("free") || normalized.includes("gratis")) return "FREE";
    if (normalized.includes("pro") || normalized.includes("premium")) return "PRO";
    if (normalized.includes("enterprise")) return "ENTERPRISE";
    if (normalized.includes("iniciante") || normalized.includes("starter")) return "INICIANTE";

    return normalized.toUpperCase();
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

    const normalized = normalizePlanKeyValue(clientPlan);
    const matchingPlan = membershipPlans.find(
      (plan) => normalizePlanValue(plan) === normalized,
    );

    return matchingPlan ? normalizePlanValue(matchingPlan) : getFreePlanValue(membershipPlans);
  };

  const getPlanByValue = (planValue?: string | null) =>
    membershipPlans.find((plan) => normalizePlanValue(plan) === normalizePlanKeyValue(planValue)) || null;

  const getPlanLabelByValue = (planValue?: string | null) => {
    const plan = getPlanByValue(planValue);
    if (plan) return getPlanLabel(plan);

    return normalizePlanKeyValue(planValue) === "FREE"
      ? "Gratis"
      : String(planValue || "Sin plan");
  };

  const getSelectedMembershipPlan = () =>
    membershipPlans.find((plan) => normalizePlanValue(plan) === selectedPlan) || null;

  const selectedMembershipPlan = getPlanByValue(selectedPlan);
  const currentUserPlanValue = getSelectedPlanValue(selectedUser?.plan);
  const currentMembershipPlan = getPlanByValue(selectedUser?.plan);
  const isSelectedPlanUnchanged = selectedPlan === currentUserPlanValue;

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

  const handleManualConfig = async (
    recordPayment = false,
    force = false,
    planOverride?: string,
  ) => {
    if (!selectedUser || !selectedPlan) return;

    const targetPlan = planOverride || selectedPlan;
    const currentPlanValue = getSelectedPlanValue(selectedUser.plan);
    if (!force && targetPlan === currentPlanValue) {
      toast.error("Ese usuario ya tiene ese plan");
      return;
    }

    const membershipPlan = getPlanByValue(targetPlan);
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
          plan: targetPlan,
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

  const handleForceFreePlan = async () => {
    if (!selectedUser) return;

    const freePlanValue = getFreePlanValue(membershipPlans);
    setSelectedPlan(freePlanValue);
    await handleManualConfig(false, true, freePlanValue);
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
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(client);
                            setSelectedPlan(getSelectedPlanValue(client.plan));
                            setDurationDays(30);
                            setShowConfigModal(true);
                            setOpenMenuId(null);
                            setMenuPosition(null);
                          }}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset transition-colors cursor-pointer",
                            normalizePlanKeyValue(client.plan) === "PRO"
                              ? "bg-indigo-50 text-indigo-700 ring-indigo-200 hover:bg-indigo-100"
                              : normalizePlanKeyValue(client.plan) === "ENTERPRISE"
                                ? "bg-purple-50 text-purple-700 ring-purple-200 hover:bg-purple-100"
                                : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-slate-100",
                          )}
                          aria-label="Cambiar plan"
                        >
                          <span>{getPlanLabelByValue(client.plan)}</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-current/60">
                            Cambiar
                          </span>
                        </button>
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
            className="flex w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200 max-h-[calc(100dvh-4rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5 sm:px-8">
              <div className="space-y-1">
                <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-700">
                  Configurar acceso
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Cambiar plan
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedUser?.fullName || selectedUser?.email}
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
              <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
                <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                        Plan actual
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900">
                        {currentMembershipPlan?.name || "Sin plan"}
                      </h3>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                      Actual
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">Plan vigente</p>
                        <p className="mt-1 text-2xl font-black text-slate-900">
                          {getPlanLabelByValue(selectedUser?.plan)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                          Estado
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {selectedUser?.status || "Activo"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Días de cortesía
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-900">
                          {durationDays}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Vence el
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {new Date(
                            new Date().setDate(new Date().getDate() + durationDays),
                          ).toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
                    Si eliges el mismo plan actual, no se aplicarán cambios.
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                        Nuevo plan
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900">
                        Selecciona una membresía
                      </h3>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700">
                      {selectedMembershipPlan?.name || "Selecciona"}
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {membershipPlans.length > 0 ? (
                      membershipPlans.map((plan) => {
                        const value = normalizePlanValue(plan);
                        const isSelected = selectedPlan === value;
                        const isCurrent = currentUserPlanValue === value;

                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlan(value)}
                            className={cn(
                              "rounded-2xl border-2 p-4 text-left transition-all cursor-pointer",
                              isSelected
                                ? "border-indigo-600 bg-indigo-50 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-black text-slate-900">{plan.name}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {getPlanLabel(plan)} · {plan.billingPeriod === "monthly" ? "Mensual" : "Anual"}
                                </p>
                              </div>
                              {isSelected && <CheckCircle2 className="h-5 w-5 text-indigo-600" />}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {isCurrent && (
                                <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                                  Plan actual
                                </span>
                              )}
                              {plan.price === 0 && (
                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                                  Gratuito
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        No hay planes activos disponibles.
                      </div>
                    )}
                  </div>

                  <div className="mt-5 space-y-2">
                    <label className="block text-xs uppercase tracking-widest font-black text-slate-500">
                      Días de Trial / Cortesía
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={durationDays}
                      onChange={(e) =>
                        setDurationDays(parseInt(e.target.value) || 0)
                      }
                      className="h-12 rounded-2xl border-slate-200 text-base font-bold text-slate-900 focus:border-indigo-600"
                      placeholder="30"
                    />
                  </div>
                </section>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="text-xs text-slate-500">
                * El usuario volverá al plan FREE automáticamente tras expirar este periodo.
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={() => setShowConfigModal(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  onClick={() => void handleForceFreePlan()}
                  isLoading={isUpdating}
                >
                  Forzar plan gratis
                </Button>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => void handleManualConfig()}
                  isLoading={isUpdating}
                  disabled={isSelectedPlanUnchanged}
                >
                  Aplicar Configuración
                </Button>
              </div>
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
