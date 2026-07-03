"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Search,
  CheckCircle2,
  XCircle,
  CircleX,
  Clock,
  DollarSign,
  Filter,
  RefreshCw,
  Trash2,
  TicketPercent,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { fetchApi } from "@/lib/api-base";

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [detailPayment, setDetailPayment] = useState<Transaction | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Transaction | null>(null);
  const [paymentToApprove, setPaymentToApprove] = useState<Transaction | null>(null);
  const [paymentToReject, setPaymentToReject] = useState<Transaction | null>(null);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);
  const [isApprovingPayment, setIsApprovingPayment] = useState(false);
  const [isRejectingPayment, setIsRejectingPayment] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    setIsDeletingPayment(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/payments/${paymentToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Error al eliminar pago");
      }

      toast.success("Registro de pago eliminado");
      setPaymentToDelete(null);
      setDetailPayment(null);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar pago");
    } finally {
      setIsDeletingPayment(false);
    }
  };

  const handleApprovePayment = async () => {
    if (!paymentToApprove) return;

    setIsApprovingPayment(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/payments/${paymentToApprove.id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Error al aprobar pago");
      }

      toast.success("Pago aprobado y activado correctamente");
      setPaymentToApprove(null);
      setDetailPayment(null);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al aprobar pago");
    } finally {
      setIsApprovingPayment(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!paymentToReject) return;

    setIsRejectingPayment(true);
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/payments/${paymentToReject.id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Error al rechazar pago");
      }

      toast.success("Pago rechazado y notificado al usuario");
      setPaymentToReject(null);
      setDetailPayment(null);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al rechazar pago");
    } finally {
      setIsRejectingPayment(false);
    }
  };

  const exportAccounting = async () => {
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi("/payments/export-accounting", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("No se pudo generar el reporte");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const filenameMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
      const filename =
        filenameMatch?.[1] ||
        `nutrinet_contabilidad_${new Date().toISOString().split("T")[0]}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Reporte contable descargado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al exportar contabilidad");
    }
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
          <Button onClick={exportAccounting} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
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
                <th className="px-4 py-3">Nutricionista</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-center">Acción</th>
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
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {trx.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPaymentToApprove(trx);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                                aria-label="Aprobar pago"
                              >
                                <TicketPercent className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPaymentToReject(trx);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                                aria-label="Rechazar pago"
                              >
                                <CircleX className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentToDelete(trx);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                            aria-label="Eliminar registro"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
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
            {(() => {
              const metadata = detailPayment.metadata || {};
              const discountCode = metadata.discountCode || metadata.discount?.code;
              const discountPercent = metadata.discountPercent || metadata.discount?.discountPercent;
              const fullPrice = metadata.fullPrice ?? detailPayment.amount;
              const proratedCredit = metadata.proratedCredit ?? 0;
              const chargedAmount = metadata.chargedAmount ?? detailPayment.amount;
              const source = metadata.source || metadata.provider || metadata.type || "N/A";

              return (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-slate-400">Monto final</p>
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(chargedAmount)}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-slate-400">Estado</p>
                      {statusBadge(detailPayment.status)}
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-slate-400">Plan</p>
                      <p className="text-xs font-bold text-slate-700">
                        {metadata.planName || detailPayment.account.subscription?.plan?.name || "N/A"}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-slate-400">Método</p>
                      <p className="text-xs font-bold text-slate-700">{detailPayment.method}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-slate-400">Precio base</p>
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(fullPrice)}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-slate-400">Crédito proporcional</p>
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(proratedCredit)}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-slate-400">Usuario</p>
                    <p className="text-xs font-medium text-slate-900">{detailPayment.account.nutritionist?.fullName || "N/A"}</p>
                    <p className="text-[10px] text-slate-500">{detailPayment.account.email}</p>
                  </div>

                  {discountCode && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase text-amber-600">Cupón usado</p>
                          <p className="text-base font-bold text-slate-900">{discountCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-amber-600">Descuento</p>
                          <p className="text-base font-bold text-slate-900">{discountPercent ? `${discountPercent}%` : "—"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700">Origen: </span>
                    {source}
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="font-bold text-slate-700">Solicitado: </span>
                    {new Date(detailPayment.createdAt).toLocaleString("es-CL", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDeletePayment}
        title="Eliminar registro de pago"
        message={`¿Deseas eliminar el pago de ${paymentToDelete?.account.nutritionist?.fullName || paymentToDelete?.account.email || "este registro"}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingPayment}
        size="lg"
      />

      <ConfirmModal
        isOpen={!!paymentToApprove}
        onClose={() => setPaymentToApprove(null)}
        onConfirm={handleApprovePayment}
        title="Aprobar pago"
        message={`¿Deseas aprobar el pago de ${paymentToApprove?.account.nutritionist?.fullName || paymentToApprove?.account.email || "este registro"}? Se activará la suscripción y se marcará como completado.`}
        confirmText="Aprobar"
        cancelText="Cancelar"
        variant="info"
        isLoading={isApprovingPayment}
      />

      <ConfirmModal
        isOpen={!!paymentToReject}
        onClose={() => setPaymentToReject(null)}
        onConfirm={handleRejectPayment}
        title="Rechazar pago"
        message={`¿Deseas rechazar el pago de ${paymentToReject?.account.nutritionist?.fullName || paymentToReject?.account.email || "este registro"}? Se notificará al usuario por correo.`}
        confirmText="Rechazar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isRejectingPayment}
      />

    </div>
  );
}
