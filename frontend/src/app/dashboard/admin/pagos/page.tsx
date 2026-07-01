"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { fetchApi } from "@/lib/api-base";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  amount: string;
  status: "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";
  method: string;
  paidAt: string | null;
  createdAt: string;
  metadata?: any;
  account: {
    email: string;
    plan: string;
    nutritionist?: {
      fullName: string;
    };
    subscription?: {
      plan?: {
        name: string;
        slug: string;
      };
      status: string;
    };
  };
  subscriptionEvents?: Array<{
    eventType: string;
    createdAt: string;
  }>;
}

interface Stats {
  totalLifetime: number;
  mrr: number;
  pendingCount: number;
  completedCount: number;
  activeSubscriptions: number;
  currency: string;
}

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [mockFilter, setMockFilter] = useState<string>("ALL");

  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [customAmount, setCustomAmount] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [detailPayment, setDetailPayment] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isSimulateModalOpen) fetchAuxiliaryData();
  }, [isSimulateModalOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const headers = { Authorization: `Bearer ${token}` };
      const [pRes, sRes] = await Promise.all([
        fetchApi("/payments", { headers }),
        fetchApi("/payments/stats", { headers }),
      ]);
      if (pRes.ok) setTransactions(await pRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } catch (error) {
      toast.error("Error al cargar datos de pagos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const headers = { Authorization: `Bearer ${token}` };
      const [uRes, pRes] = await Promise.all([
        fetchApi("/users?role=NUTRITIONIST,NUTRITIONIST_DEVELOPER", { headers }),
        fetchApi("/memberships", { headers }),
      ]);
      if (uRes.ok) setUsers(await uRes.json());
      if (pRes.ok) setPlans(await pRes.json());
    } catch {
      toast.error("No se pudieron cargar usuarios/planes");
    }
  };

  const filteredTransactions = transactions.filter((trx) => {
    const matchesSearch =
      trx.account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.account.nutritionist?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trx.metadata?.planName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || trx.status === statusFilter;
    const matchesMethod = methodFilter === "ALL" || trx.method === methodFilter;
    const isMock = (trx.metadata?.mock || trx.metadata?.isSimulation) as boolean;
    const matchesMock =
      mockFilter === "ALL" ||
      (mockFilter === "MOCK" && isMock) ||
      (mockFilter === "REAL" && !isMock);
    return matchesSearch && matchesStatus && matchesMethod && matchesMock;
  });

  const formatCurrency = (amount: number | string) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(
      Number(amount),
    );

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find((p) => p.id === planId);
    if (plan) setCustomAmount(plan.price);
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const res = await fetchApi("/payments/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          planId: selectedPlanId,
          amount: Number(customAmount),
          method: paymentMethod,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error simulando pago");
      }
      toast.success("Pago simulado correctamente");
      setIsSimulateModalOpen(false);
      setSelectedUserId("");
      setSelectedPlanId("");
      setCustomAmount("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error al simular pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCSV = () => {
    const rows = filteredTransactions.map((trx) => ({
      ID: trx.id,
      Nutricionista: trx.account.nutritionist?.fullName || "N/A",
      Email: trx.account.email,
      Plan: trx.metadata?.planName || trx.account.subscription?.plan?.name || "N/A",
      Metodo: trx.method,
      Monto: Number(trx.amount),
      Estado: trx.status,
      Mock: trx.metadata?.mock || trx.metadata?.isSimulation ? "Si" : "No",
      Fecha: new Date(trx.createdAt).toLocaleDateString("es-CL"),
    }));
    const header = Object.keys(rows[0] || {}).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pagos_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Reporte descargado");
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { icon: any; label: string; cls: string }> = {
      COMPLETED: {
        icon: CheckCircle2,
        label: "Exitoso",
        cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      },
      PENDING: {
        icon: Clock,
        label: "Pendiente",
        cls: "bg-amber-50 text-amber-700 ring-amber-600/20",
      },
      FAILED: {
        icon: XCircle,
        label: "Fallido",
        cls: "bg-rose-50 text-rose-700 ring-rose-600/20",
      },
      REFUNDED: {
        icon: XCircle,
        label: "Reembolsado",
        cls: "bg-purple-50 text-purple-700 ring-purple-600/20",
      },
    };
    const s = map[status] || map.PENDING;
    const Icon = s.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.cls}`}
      >
        <Icon className="h-3 w-3" /> {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-indigo-900">
            Pagos y Transacciones
          </h1>
          <p className="text-slate-500">
            Monitoreo real de ingresos y estado de facturación.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setIsSimulateModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Simular Pago
          </Button>
          <Button
            onClick={exportCSV}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "MRR", value: stats ? formatCurrency(stats.mrr) : "$0", icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Total", value: stats ? formatCurrency(stats.totalLifetime) : "$0", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Completados", value: stats?.completedCount ?? 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pendientes", value: stats?.pendingCount ?? 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Suscripciones", value: stats?.activeSubscriptions ?? 0, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center mb-2`}>
                <Icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{item.label}</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-3 items-center">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, email o plan..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white text-xs font-medium px-3 py-2 text-slate-700"
          >
            <option value="ALL">Todos los estados</option>
            <option value="COMPLETED">Exitosos</option>
            <option value="PENDING">Pendientes</option>
            <option value="FAILED">Fallidos</option>
            <option value="REFUNDED">Reembolsados</option>
          </select>
          <select
            value={mockFilter}
            onChange={(e) => setMockFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white text-xs font-medium px-3 py-2 text-slate-700"
          >
            <option value="ALL">Mock y Reales</option>
            <option value="MOCK">Solo Mock</option>
            <option value="REAL">Solo Reales</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nutricionista</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Cargando transacciones...</td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No se encontraron transacciones.</td></tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const isMock = trx.metadata?.mock || trx.metadata?.isSimulation;
                  const planName = trx.metadata?.planName || trx.account.subscription?.plan?.name;
                  const planSlug = trx.metadata?.planSlug || trx.account.subscription?.plan?.slug;
                  const type = trx.metadata?.source || trx.metadata?.type || (trx.subscriptionEvents?.[0]?.eventType) || "PAGO";

                  return (
                    <tr
                      key={trx.id}
                      className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                      onClick={() => setDetailPayment(trx)}
                    >
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                        {trx.id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 text-xs">
                          {trx.account.nutritionist?.fullName || "N/A"}
                        </div>
                        <div className="text-[10px] text-slate-500">{trx.account.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {planName ? (
                          <span className="text-xs font-bold text-slate-700 capitalize">{planName}</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase">
                          {trx.method}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 capitalize">
                            {typeof type === "string" ? type.replace(/_/g, " ").toLowerCase() : "—"}
                          </span>
                          {isMock && (
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 ring-1 ring-amber-200">
                              MOCK
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 text-xs">
                        {formatCurrency(trx.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px] text-nowrap">
                        {new Date(trx.createdAt).toLocaleDateString("es-CL", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">{statusBadge(trx.status)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailPayment}
        onClose={() => setDetailPayment(null)}
        title="Detalle de Transacción"
      >
        {detailPayment && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-black uppercase text-slate-400">Monto</p>
                <p className="text-sm font-bold text-slate-900">{formatCurrency(detailPayment.amount)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-black uppercase text-slate-400">Estado</p>
                {statusBadge(detailPayment.status)}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-black uppercase text-slate-400">Método</p>
                <p className="text-xs font-bold text-slate-700">{detailPayment.method}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-black uppercase text-slate-400">Plan</p>
                <p className="text-xs font-bold text-slate-700">
                  {detailPayment.metadata?.planName || detailPayment.account.subscription?.plan?.name || "N/A"}
                </p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Metadata</p>
              <pre className="text-[10px] text-slate-600 font-mono whitespace-pre-wrap">
                {JSON.stringify(detailPayment.metadata || {}, null, 2)}
              </pre>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] font-black uppercase text-slate-400">Usuario</p>
              <p className="text-xs font-medium text-slate-900">{detailPayment.account.nutritionist?.fullName || "N/A"}</p>
              <p className="text-[10px] text-slate-500">{detailPayment.account.email}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Simulate Modal */}
      <Modal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        title="Simular Transacción"
      >
        <form onSubmit={handleSimulatePayment} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nutricionista</label>
            <select
              className="w-full text-sm rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
            >
              <option value="">Seleccionar Nutricionista...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nutritionist?.fullName || u.email} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
            <select
              className="w-full text-sm rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm"
              value={selectedPlanId}
              onChange={(e) => handlePlanChange(e.target.value)}
              required
            >
              <option value="">Seleccionar Plan...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${Number(p.price).toLocaleString("es-CL")}/mes
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monto (CLP)</label>
            <Input
              type="number"
              value={customAmount === "" ? "" : customAmount}
              onChange={(e) =>
                setCustomAmount(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="Monto en CLP"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Método de pago</label>
            <select
              className="w-full text-sm rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="BANK_TRANSFER">Transferencia Bancaria</option>
              <option value="FLOW">Flow</option>
              <option value="MANUAL">Manual</option>
              <option value="WEBPAY">Webpay</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1 h-12 rounded-xl"
              onClick={() => setIsSimulateModalOpen(false)}
              type="button"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              Simular Pago
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
