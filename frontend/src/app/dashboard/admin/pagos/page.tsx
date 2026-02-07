'use client';

import { useState, useEffect } from 'react';
import { Download, Search, CheckCircle2, XCircle, Clock, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';

interface Transaction {
    id: string;
    amount: string;
    status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
    method: string;
    paidAt: string | null;
    createdAt: string;
    account: {
        email: string;
        nutritionist?: {
            fullName: string;
        }
    }
}

interface Stats {
    totalLifetime: number;
    mrr: number;
    currency: string;
}

export default function AdminPaymentsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Simulation Modal State
    const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);

    // Simulation Form State
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
    const [customAmount, setCustomAmount] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (isSimulateModalOpen) {
            fetchAuxiliaryData();
        }
    }, [isSimulateModalOpen]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [pRes, sRes] = await Promise.all([
                fetch(`${API_URL}/payments`, { headers }),
                fetch(`${API_URL}/payments/stats`, { headers })
            ]);

            if (pRes.ok) setTransactions(await pRes.json());
            if (sRes.ok) setStats(await sRes.json());

        } catch (error) {
            console.error('Error fetching payments:', error);
            toast.error('Error al cargar datos de pagos');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAuxiliaryData = async () => {
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [uRes, pRes] = await Promise.all([
                fetch(`${API_URL}/users?role=NUTRITIONIST`, { headers }),
                fetch(`${API_URL}/memberships`, { headers })
            ]);

            if (uRes.ok) setUsers(await uRes.json());
            if (pRes.ok) setPlans(await pRes.json());
        } catch (error) {
            console.error('Error loading aux data', error);
            toast.error('No se pudieron cargar usuarios/planes');
        }
    };

    const filteredTransactions = transactions.filter(trx =>
        trx.account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trx.account.nutritionist?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trx.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
        }).format(Number(amount));
    };

    const handlePlanChange = (planId: string) => {
        setSelectedPlanId(planId);
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            setCustomAmount(plan.price);
        }
    };

    const handleSimulatePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const res = await fetch(`${API_URL}/payments/simulate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: selectedUserId,
                    planId: selectedPlanId,
                    amount: Number(customAmount),
                    method: paymentMethod
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Error simulando pago');
            }

            toast.success('Pago simulado correctamente');
            setIsSimulateModalOpen(false);
            fetchData(); // Refresh table

            // Reset form
            setSelectedUserId('');
            setSelectedPlanId('');
            setCustomAmount('');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al simular pago');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-indigo-900">Pagos y Transacciones</h1>
                    <p className="text-slate-500">Monitoreo real de ingresos y estado de facturación.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setIsSimulateModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                        <DollarSign className="h-4 w-4" />
                        Simular Pago
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        <Download className="h-4 w-4" />
                        Descargar Reporte
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="h-16 w-16 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">MRR (Ingresos Mes Actual)</h3>
                    <p className="text-2xl font-bold text-indigo-900 mt-2">
                        {stats ? formatCurrency(stats.mrr) : '$0'}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Ingresos Totales</h3>
                    <p className="text-2xl font-bold text-emerald-600 mt-2">
                        {stats ? formatCurrency(stats.totalLifetime) : '$0'}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock className="h-16 w-16 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-500">Transacciones Totales</h3>
                    <p className="text-2xl font-bold text-amber-600 mt-2">
                        {transactions.length}
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex gap-4">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por usuario, email o ID..."
                            className="pl-9 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="px-6 py-4">ID Transacción</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Método</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Monto</th>
                                <th className="px-6 py-4">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">Cargando transacciones...</td></tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-500">No se encontraron transacciones.</td></tr>
                            ) : (
                                filteredTransactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-slate-500 text-[11px]">
                                            {trx.id.split('-')[0]}...
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">
                                                {trx.account.nutritionist?.fullName || 'N/A'}
                                            </div>
                                            <div className="text-xs text-slate-500">{trx.account.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase">
                                                {trx.method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs text-nowrap">
                                            {new Date(trx.createdAt).toLocaleDateString('es-CL', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            {formatCurrency(trx.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {trx.status === 'COMPLETED' && (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                                    <CheckCircle2 className="h-3 w-3" /> Exitoso
                                                </span>
                                            )}
                                            {trx.status === 'PENDING' && (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                                    <Clock className="h-3 w-3" /> Pendiente
                                                </span>
                                            )}
                                            {trx.status === 'FAILED' && (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">
                                                    <XCircle className="h-3 w-3" /> Fallido
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Simulation Modal */}
            {/* Simulation Modal */}
            <Modal
                isOpen={isSimulateModalOpen}
                onClose={() => setIsSimulateModalOpen(false)}
                title="Simular Transacción"
            >
                <form onSubmit={handleSimulatePayment} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nutricionista</label>
                        <select
                            className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 bg-white border text-slate-900"
                            value={selectedUserId}
                            onChange={e => setSelectedUserId(e.target.value)}
                            required
                        >
                            <option value="">Seleccionar Nutricionista...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.fullName} ({u.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Plan de Membresía</label>
                        <select
                            className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 bg-white border text-slate-900"
                            value={selectedPlanId}
                            onChange={e => handlePlanChange(e.target.value)}
                            required
                        >
                            <option value="">Seleccionar Plan...</option>
                            {plans.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} - ${p.price}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Monto (Auto/Manual)</label>
                            <Input
                                type="number"
                                value={customAmount}
                                onChange={e => setCustomAmount(Number(e.target.value))}
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Método</label>
                            <select
                                className="w-full text-sm rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 bg-white border text-slate-900"
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                            >
                                <option value="BANK_TRANSFER">Transferencia</option>
                                <option value="MANUAL">Efectivo / Manual</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsSimulateModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" isLoading={isSubmitting}>
                            Confirmar Pago
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
