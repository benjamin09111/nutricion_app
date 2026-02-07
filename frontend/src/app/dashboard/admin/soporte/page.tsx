'use client';

import { useState, useEffect } from 'react';
import { Mail, MessageCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

interface SupportRequest {
    id: string;
    email: string;
    message: string | null;
    type: 'PASSWORD_RESET' | 'CONTACT' | 'OTHER';
    status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
    createdAt: string;
}

export default function AdminSupportPage() {
    const [requests, setRequests] = useState<SupportRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/support`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al cargar solicitudes');
            const data = await response.json();
            setRequests(data);
        } catch (error) {
            console.error(error);
            toast.error('Error cargando solicitudes de soporte');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolve = async (id: string) => {
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/support/${id}/resolve`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Error al resolver');

            toast.success('Solicitud marcada como resuelta');
            fetchRequests();
        } catch (error) {
            toast.error('No se pudo actualizar el estado');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-indigo-900">Centro de Soporte</h1>
                <p className="text-slate-500">Solicitudes de contacto y recuperación de cuenta.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Usuario / Correo</th>
                                <th className="px-6 py-3">Mensaje</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Cargando...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No hay solicitudes pendientes.</td></tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${req.type === 'PASSWORD_RESET'
                                                    ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                                                    : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                                                }`}>
                                                {req.type === 'PASSWORD_RESET' ? 'Recuperar Clave' : 'Contacto'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{req.email}</td>
                                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={req.message || ''}>
                                            {req.message || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.status === 'RESOLVED' ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                                                    <CheckCircle className="h-3 w-3" /> Resuelto
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-semibold">
                                                    <Clock className="h-3 w-3" /> Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status !== 'RESOLVED' && (
                                                <button
                                                    onClick={() => handleResolve(req.id)}
                                                    className="text-indigo-600 hover:text-indigo-900 text-xs font-semibold"
                                                >
                                                    Marcar Resuelto
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
