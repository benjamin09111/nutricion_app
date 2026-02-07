'use client';

import { useState, useEffect } from 'react';
import {
    Mail,
    Phone,
    BadgeCheck,
    Clock,
    CheckCircle2,
    XCircle,
    Search,
    Calendar,
    MessageSquare,
    User,
    UserCheck,
    AlertCircle,
    FileText,
    ThumbsUp,
    ThumbsDown,
    ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

type RequestStatus = 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED';

interface RegistrationRequest {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    professionalId: string | null;
    specialty: string | null;
    message: string | null;
    status: RequestStatus;
    adminNotes: string | null;
    createdAt: string;
}

export default function PeticionesPage() {
    const [requests, setRequests] = useState<RegistrationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [activeTab, setActiveTab] = useState<RequestStatus | 'ALL_ACCEPTED'>('PENDING');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al cargar peticiones');
            const data = await response.json();
            setRequests(data);
        } catch (error) {
            console.error(error);
            toast.error('No se pudieron cargar las peticiones');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (status: RequestStatus) => {
        if (!selectedRequest) return;
        setIsUpdating(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const response = await fetch(`${API_URL}/requests/${selectedRequest.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, adminNotes })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar estado');
            }

            let successMsg = 'Estado actualizado';
            if (status === 'ACCEPTED' || status === 'APPROVED') {
                successMsg = '¡Cuenta aceptada! Se ha creado el usuario y enviado las credenciales.';
            } else if (status === 'REJECTED') {
                successMsg = 'Petición rechazada';
            }

            toast.success(successMsg);
            setSelectedRequest(null);
            setAdminNotes('');
            fetchRequests();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al procesar la solicitud');
        } finally {
            setIsUpdating(false);
        }
    };

    const tabs = [
        { id: 'PENDING', label: 'Pendientes', icon: Clock },
        { id: 'ALL_ACCEPTED', label: 'Aceptadas', icon: ThumbsUp },
        { id: 'REJECTED', label: 'Rechazadas', icon: XCircle },
    ];

    const isAccepted = (status: string) => status === 'ACCEPTED' || status === 'APPROVED';

    const getRequestsByTab = () => {
        if (activeTab === 'ALL_ACCEPTED') {
            return requests.filter(req => isAccepted(req.status));
        }
        return requests.filter(req => req.status === activeTab);
    };

    const filteredRequests = getRequestsByTab().filter(req =>
        req.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-indigo-900">Peticiones de Registro</h1>
                    <p className="text-slate-500">Gestiona las solicitudes de nuevos profesionales que desean unirse a la plataforma.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nombre o email..."
                        className="pl-10 w-full sm:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as any);
                            setSelectedRequest(null);
                        }}
                        className={cn(
                            "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer",
                            activeTab === tab.id
                                ? "border-indigo-600 text-indigo-700 bg-indigo-50/20"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        )}
                    >
                        <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-indigo-600" : "text-slate-400")} />
                        {tab.label}
                        <span className={cn(
                            "ml-1.5 px-2 py-0.5 rounded-full text-[10px]",
                            activeTab === tab.id ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                        )}>
                            {tab.id === 'ALL_ACCEPTED'
                                ? requests.filter(r => isAccepted(r.status)).length
                                : requests.filter(r => r.status === tab.id).length}
                        </span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    {isLoading ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                            <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            Cargando peticiones...
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No se encontraron peticiones en esta categoría.</p>
                            <p className="text-sm opacity-70">Asegúrate de revisar otras pestañas o cambiar los términos de búsqueda.</p>
                        </div>
                    ) : (
                        filteredRequests.map((request) => (
                            <div
                                key={request.id}
                                onClick={() => {
                                    setSelectedRequest(request);
                                    setAdminNotes(request.adminNotes || '');
                                }}
                                className={cn(
                                    "group p-5 rounded-xl border transition-all cursor-pointer",
                                    selectedRequest?.id === request.id
                                        ? 'border-indigo-600 bg-indigo-50/30'
                                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900">{request.fullName}</h3>
                                            {request.professionalId && (
                                                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                                                    SIS: {request.professionalId}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {request.email}
                                            </div>
                                            {request.phone && (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {request.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400 flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </div>
                                        {isAccepted(request.status) && (
                                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Cuenta Activa
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail Section */}
                <div className="lg:col-span-1">
                    {selectedRequest ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-xl sticky top-6 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-slate-50 border-b border-slate-100 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                                        <User className="h-7 w-7" />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] uppercase font-bold px-3 py-1 rounded-full border",
                                        selectedRequest.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            selectedRequest.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    )}>
                                        {selectedRequest.status === 'PENDING' ? 'Pendiente' :
                                            selectedRequest.status === 'REJECTED' ? 'Rechazada' : 'Aceptada'}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedRequest.fullName}</h2>
                                <p className="text-sm text-slate-500 font-medium">{selectedRequest.specialty || 'Profesional de la Salud'}</p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <Mail className="h-5 w-5 text-indigo-500" />
                                            <div className="text-sm">
                                                <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Email</p>
                                                <p className="text-slate-900 font-medium">{selectedRequest.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <Phone className="h-5 w-5 text-indigo-500" />
                                            <div className="text-sm">
                                                <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Teléfono</p>
                                                <p className="text-slate-900 font-medium">{selectedRequest.phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                                            <BadgeCheck className="h-5 w-5 text-indigo-600" />
                                            <div className="text-sm flex-1">
                                                <p className="text-xs text-indigo-500 uppercase font-black tracking-tight">Registro (SIS)</p>
                                                <p className="text-indigo-900 font-mono font-bold">{selectedRequest.professionalId || 'Sin ID registrado'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-900 text-white shadow-lg border-l-4 border-indigo-500">
                                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                                <BadgeCheck className="h-6 w-6 text-indigo-400" />
                                            </div>
                                            <div className="text-sm flex-1">
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5 font-black">Validación Profesional</p>
                                                <p className="text-slate-200 text-xs leading-tight">Usa el nombre para verificar en la Superintendencia.</p>
                                            </div>
                                            <a
                                                href="https://rnpi.superdesalud.gob.cl/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                                                title="Validar en Superintendencia de Salud"
                                            >
                                                Validar
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>

                                    {selectedRequest.message && (
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
                                            <MessageSquare className="h-4 w-4 text-indigo-400 absolute -top-2 -left-2 bg-white rounded-full p-0.5" />
                                            <p className="text-sm text-slate-600 italic leading-relaxed">"{selectedRequest.message}"</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div>
                                        <label className="text-xs uppercase font-bold text-slate-500 block mb-2 tracking-wider">Notas Administrativas</label>
                                        <textarea
                                            className="w-full min-h-[100px] rounded-xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 placeholder:text-slate-300 font-medium"
                                            placeholder="Ej: Verificado en el SIS, pendiente confirmación telefónica..."
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {selectedRequest.status === 'PENDING' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    variant="outline"
                                                    className="text-rose-600 hover:bg-rose-50 border-rose-200 h-12 font-bold"
                                                    onClick={() => handleUpdateStatus('REJECTED')}
                                                    isLoading={isUpdating}
                                                >
                                                    <ThumbsDown className="h-4 w-4 mr-2" />
                                                    Rechazar
                                                </Button>
                                                <Button
                                                    className="bg-indigo-600 hover:bg-indigo-700 h-12 font-bold shadow-lg shadow-indigo-200"
                                                    onClick={() => handleUpdateStatus('ACCEPTED')}
                                                    isLoading={isUpdating}
                                                >
                                                    <ThumbsUp className="h-4 w-4 mr-2" />
                                                    Aceptar
                                                </Button>
                                            </div>
                                        )}

                                        {selectedRequest.status === 'REJECTED' && (
                                            <Button
                                                variant="outline"
                                                className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-12 font-bold"
                                                onClick={() => handleUpdateStatus('PENDING')}
                                                isLoading={isUpdating}
                                            >
                                                <Clock className="h-4 w-4 mr-2" />
                                                Reactivar Solicitud
                                            </Button>
                                        )}

                                        {isAccepted(selectedRequest.status) && (
                                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col gap-2">
                                                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                                                    <CheckCircle2 className="h-5 w-5" />
                                                    <span>Solicitud Aceptada</span>
                                                </div>
                                                <p className="text-xs text-emerald-600 font-medium">
                                                    La cuenta para este profesional ya ha sido generada y las credenciales fueron enviadas a su correo electrónico.
                                                </p>
                                                <div className="mt-2 pt-2 border-t border-emerald-100 flex justify-between items-center">
                                                    <span className="text-[10px] text-emerald-500 uppercase font-black">Plan Inicial: FREE</span>
                                                    <FileText className="h-4 w-4 text-emerald-400" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50/50 rounded-xl border-2 border-slate-200 border-dashed p-12 text-center text-slate-400 h-[500px] flex flex-col justify-center gap-4">
                            <div className="h-20 w-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
                                <UserCheck className="h-10 w-10 opacity-20" />
                            </div>
                            <div>
                                <h3 className="text-slate-900 font-bold">Sin selección</h3>
                                <p className="text-sm max-w-[200px] mx-auto mt-1">Elige una petición del listado para gestionar su acceso.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
