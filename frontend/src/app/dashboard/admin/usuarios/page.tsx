'use client';

import { useState, useEffect } from 'react';
import {
    UserPlus, Mail, Shield, ShieldAlert, KeyRound,
    RefreshCw, User, Users, Edit, Trash2, Save, X,
    Calendar, CheckCircle2, UserX
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

interface UserData {
    id: string;
    email: string;
    fullName?: string;
    role: 'ADMIN' | 'ADMIN_MASTER' | 'ADMIN_GENERAL' | 'NUTRITIONIST' | 'ORGANIZATION' | 'SUPPLEMENT_STORE' | 'SUPERMARKET';
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    subscriptionEndsAt: string | null;
    createdAt: string;
}

const roleLabels: Record<string, string> = {
    'ADMIN': 'Administrador',
    'ADMIN_MASTER': 'Admin Master',
    'ADMIN_GENERAL': 'Admin General',
    'NUTRITIONIST': 'Nutricionista',
    'ORGANIZATION': 'Organización',
    'SUPPLEMENT_STORE': 'Tienda de Suplementos',
    'SUPERMARKET': 'Supermercado'
};

export default function AdminUsersPage() {
    const [activeTab, setActiveTab] = useState<'create' | 'reset' | 'admins'>('admins');
    const [currentAdminRole, setCurrentAdminRole] = useState<string | null>(null);

    // State for Users List
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Selection state for modals
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'STATUS' | 'ROLE';
        targetValue: string;
    } | null>(null);

    // Create Account State
    const [creationEmail, setCreationEmail] = useState('');
    const [creationName, setCreationName] = useState('');
    const [creationRole, setCreationRole] = useState<'ADMIN_MASTER' | 'ADMIN_GENERAL' | 'NUTRITIONIST' | 'ORGANIZATION' | 'SUPPLEMENT_STORE' | 'SUPERMARKET'>('NUTRITIONIST');
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);

    // Reset Password State
    const [resetEmail, setResetEmail] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Get current user role from token
    useEffect(() => {
        const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentAdminRole(payload.role);
            } catch (e) {
                console.error('Error decoding token:', e);
            }
        }
    }, []);

    // Fetch users when on 'admins' tab
    useEffect(() => {
        if (activeTab === 'admins') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const url = `${API_URL}/users?role=ALL_ADMINS`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al cargar usuarios');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast.error('No se pudieron cargar los usuarios');
        } finally {
            setIsLoadingUsers(false);
        }
    };

    // Permission Helpers
    const isMaster = currentAdminRole === 'ADMIN_MASTER';

    const canModifyAdmins = (targetUser: UserData) => {
        const isTargetAdmin = ['ADMIN_MASTER', 'ADMIN_GENERAL', 'ADMIN'].includes(targetUser.role);
        // Only Master can touch other admins
        return isMaster || !isTargetAdmin;
    };

    // Action Helpers
    const handleStatusToggle = (user: UserData) => {
        if (!canModifyAdmins(user)) {
            toast.error('Solo un Admin Master puede desactivar cuentas administrativas');
            return;
        }
        const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        setSelectedUser(user);
        setConfirmAction({ type: 'STATUS', targetValue: nextStatus });
        setIsConfirmModalOpen(true);
    };

    const handleRoleChangeRequest = (user: UserData, nextRole: string) => {
        if (!isMaster) {
            toast.error('Solo un Admin Master puede cambiar jerarquías');
            return;
        }
        setSelectedUser(user);
        setConfirmAction({ type: 'ROLE', targetValue: nextRole });
        setIsConfirmModalOpen(true);
    };

    const executeConfirmAction = async () => {
        if (!selectedUser || !confirmAction) return;

        setIsLoadingUsers(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const payload = confirmAction.type === 'STATUS'
                ? { status: confirmAction.targetValue }
                : { role: confirmAction.targetValue };

            const response = await fetch(`${API_URL}/users/${selectedUser.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error en la actualización');
            }

            toast.success(`Usuario actualizado correctamente`);
            setIsConfirmModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Hubo un error al procesar el cambio');
        } finally {
            setIsLoadingUsers(false);
            setSelectedUser(null);
            setConfirmAction(null);
        }
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();

        const isTargetAdmin = ['ADMIN_MASTER', 'ADMIN_GENERAL', 'ADMIN'].includes(creationRole);
        if (isTargetAdmin && !isMaster) {
            toast.error('Solo un Admin Master puede crear otras cuentas administrativas');
            return;
        }

        setIsCreatingAccount(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/auth/create-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: creationEmail,
                    fullName: creationName,
                    role: creationRole
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al crear cuenta');

            setCreationEmail('');
            setCreationName('');
            toast.success('Cuenta creada correctamente y bienvenida enviada');
            setActiveTab('admins');
        } catch (error: any) {
            toast.error(error.message || 'Error al crear la cuenta');
        } finally {
            setIsCreatingAccount(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsResetting(true);

        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al restablecer contraseña');
            }

            setResetEmail('');
            toast.success('Se ha enviado un correo para restablecer la contraseña');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsResetting(false);
        }
    };


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-indigo-900">Gestión de Accesos</h1>
                <p className="text-slate-500">Administración de rol, suscripciones y estados de cuenta.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-indigo-100 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('admins')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'admins'
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-indigo-600 hover:border-indigo-200'
                        }`}
                >
                    <Shield className="h-4 w-4" />
                    Usuarios
                </button>
                <button
                    onClick={() => setActiveTab('create')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'create'
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-indigo-600 hover:border-indigo-200'
                        }`}
                >
                    <UserPlus className="h-4 w-4" />
                    Crear Cuenta
                </button>
                <button
                    onClick={() => setActiveTab('reset')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'reset'
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-indigo-600 hover:border-indigo-200'
                        }`}
                >
                    <KeyRound className="h-4 w-4" />
                    Restablecer Contraseña
                </button>
            </div>

            {activeTab === 'admins' && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Cargando usuarios...</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No hay usuarios registrados.</td></tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900">{user.fullName || user.email}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={user.role}
                                                    disabled={!isMaster}
                                                    onChange={(e) => handleRoleChangeRequest(user, e.target.value)}
                                                    className={`text-xs font-bold text-slate-900 rounded-md bg-white border-slate-200 focus:ring-indigo-500 py-1 transition-all shadow-sm ${!isMaster ? 'opacity-70 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
                                                >
                                                    {user.role === 'ADMIN' && <option value="ADMIN">Administrador (Legado)</option>}
                                                    <option value="ADMIN_MASTER">Admin Master</option>
                                                    <option value="ADMIN_GENERAL">Admin General</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.status === 'ACTIVE'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    disabled={!canModifyAdmins(user)}
                                                    onClick={() => handleStatusToggle(user)}
                                                    className={`h-8 px-3 ${!canModifyAdmins(user) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${user.status === 'ACTIVE'
                                                        ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                                                        : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                                        }`}
                                                >
                                                    {user.status === 'ACTIVE' ? (
                                                        <><UserX className="h-4 w-4 mr-2" /> Desactivar Account</>
                                                    ) : (
                                                        <><CheckCircle2 className="h-4 w-4 mr-2" /> Activar Account</>
                                                    )}
                                                </Button>
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
            {(activeTab === 'create' || activeTab === 'reset') && (
                <div className="grid gap-6 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'create' ? (
                        <div className="rounded-xl border border-indigo-200 bg-white shadow-sm h-fit">
                            <div className="border-b border-indigo-100 px-6 py-4 bg-indigo-50/30">
                                <div className="flex items-center gap-x-2">
                                    <UserPlus className="h-5 w-5 text-indigo-600" />
                                    <h2 className="font-semibold text-indigo-900">Crear Nuevo Usuario</h2>
                                </div>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleCreateAccount} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">Nombre Completo</label>
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
                                        <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">Correo Electrónico</label>
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
                                        <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">Rol Proporcionado</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Shield className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <select
                                                value={creationRole}
                                                onChange={(e) => setCreationRole(e.target.value as any)}
                                                className="block w-full rounded-md border-0 py-2.5 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            >
                                                <option value="NUTRITIONIST">Nutricionista</option>
                                                {isMaster && (
                                                    <>
                                                        <option value="ADMIN_MASTER">ADMIN MASTER (Control Total)</option>
                                                        <option value="ADMIN_GENERAL">ADMIN GENERAL (Gestión)</option>
                                                    </>
                                                )}
                                                <option value="ORGANIZATION">Organización / Clínica</option>
                                                <option value="SUPPLEMENT_STORE">Tienda de Suplementos</option>
                                                <option value="SUPERMARKET">Supermercado</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <Button type="submit" isLoading={isCreatingAccount} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                            Generar Acceso y Notificar
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
                                    <h2 className="font-semibold text-amber-900">Restablecimiento de Credenciales</h2>
                                </div>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">Correo Electrónico del Usuario</label>
                                        <Input
                                            type="email"
                                            required
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            placeholder="correo-a-recuperar@ejemplo.com"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <Button type="submit" isLoading={isResetting} className="w-full bg-amber-600 hover:bg-amber-700">
                                            Generar Nueva Contraseña y Notificar
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col justify-center h-fit">
                        <h3 className="font-semibold text-slate-800 mb-2">Protocolo de Seguridad</h3>
                        <p className="text-sm text-slate-600">
                            La creación de nuevos administradores está limitada por su rol.
                            Solo un <strong>Admin Master</strong> puede elevar otros usuarios a su mismo nivel.
                            Todos los accesos son auditados.
                        </p>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={executeConfirmAction}
                isLoading={isLoadingUsers}
                title={confirmAction?.type === 'STATUS' ? 'Cambiar Estado de Cuenta' : 'Cambiar Rol de Usuario'}
                message={`¿Estás seguro de que deseas cambiar el ${confirmAction?.type === 'STATUS' ? 'estado' : 'rol'} de ${selectedUser?.email} a ${confirmAction?.type === 'ROLE' ? roleLabels[confirmAction.targetValue] : (confirmAction?.targetValue === 'ACTIVE' ? 'Activo' : 'Inactivo')}? Esta acción tendrá efecto inmediato.`}
                variant={confirmAction?.type === 'STATUS' ? 'danger' : 'warning'}
                confirmText="Sí, actualizar"
                cancelText="Cancelar"
            />
        </div>
    );
}
