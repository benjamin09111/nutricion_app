'use client';

import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { Search, MoreHorizontal, Building2, Pill, ShoppingCart, GraduationCap, CheckCircle2, AlertCircle, RefreshCw, Settings, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type ClientTab = 'Nutricionistas' | 'Organizaciones' | 'Suplementos fitness' | 'Supermercados';

export default function AdminClientsPage() {
    const [activeTab, setActiveTab] = useState<ClientTab>('Nutricionistas');
    const [clients, setClients] = useState<any[]>([]);
    const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [durationDays, setDurationDays] = useState<number>(30);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchMembershipPlans();
        fetchClients();
    }, [activeTab]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId && !(event.target as Element).closest('.actions-menu-container')) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    const fetchMembershipPlans = async () => {
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/memberships`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al cargar planes');
            const data = await response.json();
            setMembershipPlans(data);
        } catch (error) {
            console.error('Error fetching membership plans:', error);
        }
    };

    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            let role = 'NUTRITIONIST';

            switch (activeTab) {
                case 'Organizaciones': role = 'ORGANIZATION'; break;
                case 'Suplementos fitness': role = 'SUPPLEMENT_STORE'; break;
                case 'Supermercados': role = 'SUPERMARKET'; break;
                default: role = 'NUTRITIONIST';
            }

            const url = searchTerm
                ? `${API_URL}/users?role=${role}&search=${searchTerm}`
                : `${API_URL}/users?role=${role}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Error al cargar clientes');
            const data = await response.json();
            setClients(data);
        } catch (error) {
            console.error(error);
            toast.error('No se pudieron cargar los clientes');
            setClients([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchClients();
    };

    const handlePlanChange = (user: any, newPlan: string) => {
        setSelectedUser(user);
        setSelectedPlan(newPlan);
        setShowConfigModal(true);
    };

    const handleManualConfig = async () => {
        if (!selectedUser || !selectedPlan) return;

        setIsUpdating(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/users/${selectedUser.id}/plan`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    plan: selectedPlan,
                    days: durationDays
                })
            });

            if (!response.ok) throw new Error('Error al actualizar configuración');

            toast.success(`Configuración aplicada a ${selectedUser.fullName || selectedUser.email}`);
            setShowConfigModal(false);
            fetchClients();
        } catch (error) {
            console.error(error);
            toast.error('Error al aplicar configuración');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleResetUnpaidPlans = async () => {
        setIsUpdating(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/users/reset-unpaid-plans`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Error al resetear planes');

            const result = await response.json();
            toast.success(result.message || 'Planes reseteados correctamente');
            setShowResetModal(false);
            fetchClients();
        } catch (error) {
            console.error(error);
            toast.error('Error al resetear planes');
        } finally {
            setIsUpdating(false);
        }
    };

    const tabs: { label: ClientTab; icon: any }[] = [
        { label: 'Nutricionistas', icon: GraduationCap },
        { label: 'Organizaciones', icon: Building2 },
        { label: 'Suplementos fitness', icon: Pill },
        { label: 'Supermercados', icon: ShoppingCart },
    ];

    const getPaymentStatus = (client: any) => {
        if (!client.subscriptionEndsAt) return { label: 'Sin Pago', color: 'text-slate-500 bg-slate-100', icon: AlertCircle };
        const endDate = new Date(client.subscriptionEndsAt);
        const now = new Date();

        if (endDate > now) {
            return { label: 'Al día', color: 'text-green-700 bg-green-50', icon: CheckCircle2 };
        } else {
            return { label: 'Vencido', color: 'text-rose-700 bg-rose-50', icon: AlertCircle };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-indigo-900">Clientes</h1>
                    <p className="text-slate-500">Gestión de profesionales y partners de la plataforma.</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'Nutricionistas' && (
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
                                onClick={() => setActiveTab(tab.label)}
                                className={cn(
                                    'group inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors cursor-pointer',
                                    isActive
                                        ? 'border-indigo-600 text-indigo-700'
                                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                )}
                            >
                                <Icon className={cn('h-4 w-4', isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600')} />
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
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                    Buscar
                </Button>
            </form>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50/80 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    {activeTab === 'Nutricionistas' ? 'Profesional' :
                                        activeTab === 'Organizaciones' ? 'Organización' :
                                            activeTab === 'Suplementos fitness' ? 'Tienda' : 'Supermercado'}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Pago</th>
                                <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    {activeTab === 'Nutricionistas' ? 'Pacientes' :
                                        activeTab === 'Organizaciones' ? 'Miembros' :
                                            activeTab === 'Suplementos fitness' ? 'Productos' : 'Sucursales'}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Último Acceso</th>
                                <th className="px-6 py-3 w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-8 text-slate-500">Cargando...</td></tr>
                            ) : clients.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-8 text-slate-500">No hay clientes registrados en esta categoría.</td></tr>
                            ) : clients.map((client) => {
                                const paymentStatus = getPaymentStatus(client);
                                return (
                                    <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium uppercase">
                                                    {client.fullName?.charAt(0) || client.email.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{client.fullName || 'Sin Nombre'}</div>
                                                    <div className="text-xs text-slate-500">{client.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={client.plan || 'FREE'}
                                                onChange={(e) => handlePlanChange(client, e.target.value)}
                                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset cursor-pointer border-none outline-none ${client.plan === 'ENTERPRISE' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' :
                                                    client.plan === 'PRO' ? 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' :
                                                        'bg-slate-50 text-slate-700 ring-slate-600/20'
                                                    }`}
                                            >
                                                {membershipPlans.length > 0 ? (
                                                    membershipPlans.map((plan) => (
                                                        <option key={plan.id} value={plan.slug.toUpperCase()}>
                                                            {plan.slug.toUpperCase()}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <>
                                                        <option value="FREE">FREE</option>
                                                        <option value="PRO">PRO</option>
                                                        <option value="ENTERPRISE">ENTERPRISE</option>
                                                    </>
                                                )}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${paymentStatus.color}`}>
                                                <paymentStatus.icon className="h-3 w-3" />
                                                {paymentStatus.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-600 font-mono">
                                            {client.patientCount || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${client.status === 'ACTIVE' ? 'text-green-700' : 'text-red-700'}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${client.status === 'ACTIVE' ? 'bg-green-600' : 'bg-red-600'}`} />
                                                {client.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {new Date(client.lastLogin).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 relative actions-menu-container">
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === client.id ? null : client.id)}
                                                className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                            {openMenuId === client.id && (
                                                <div className="absolute right-0 mt-1 w-36 rounded-xl bg-white shadow-xl ring-1 ring-black/5 z-20 p-1.5 border-none animate-in fade-in zoom-in-95 duration-100">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(client);
                                                            setSelectedPlan(client.plan || 'FREE');
                                                            setDurationDays(30);
                                                            setShowConfigModal(true);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer"
                                                    >
                                                        <Settings className="h-3.5 w-3.5" />
                                                        Configurar
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manual Config Modal */}
            {showConfigModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Configurar Acceso</h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Trial personalizado para <strong>{selectedUser?.fullName || selectedUser?.email}</strong>
                                </p>
                            </div>
                            <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs uppercase tracking-widest font-black text-slate-500 mb-2">Membresía a Asignar</label>
                                <select
                                    value={selectedPlan}
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                    className="w-full rounded-xl border-2 border-slate-200 py-3.5 px-4 text-base font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none bg-white shadow-sm transition-all cursor-pointer"
                                >
                                    {membershipPlans.length > 0 ? (
                                        membershipPlans.map((plan) => (
                                            <option key={plan.id} value={plan.slug.toUpperCase()} className="text-slate-900 font-bold py-2">
                                                {plan.slug.toUpperCase()} — {plan.billingPeriod === 'monthly' ? 'Ciclo Mensual' : 'Ciclo Anual'}
                                            </option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="FREE" className="text-slate-900 font-bold">FREE (Plan Básico)</option>
                                            <option value="PRO" className="text-slate-900 font-bold">PRO (Plan Premium)</option>
                                            <option value="ENTERPRISE" className="text-slate-900 font-bold">ENTERPRISE (Plan Corporativo)</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest font-black text-slate-500 mb-2">Días de Trial / Cortesía</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={durationDays}
                                    onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
                                    className="h-12 text-lg font-black text-indigo-900 border-2 border-slate-200 focus:border-indigo-600 rounded-xl"
                                    placeholder="Ej: 30"
                                />
                                <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <p className="text-xs font-bold text-indigo-700 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Vence el: {new Date(new Date().setDate(new Date().getDate() + durationDays)).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 font-medium italic">
                                    * El usuario volverá al plan FREE automáticamente tras expirar este periodo.
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                            <Button variant="ghost" onClick={() => setShowConfigModal(false)}>Cancelar</Button>
                            <Button
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={handleManualConfig}
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
        </div>
    );
}
