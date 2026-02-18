'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, User, Calendar, Mail, Plus, FileCode, RotateCcw, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Patient, PatientsResponse } from '@/features/patients';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';
import { ModuleLayout } from '@/components/shared/ModuleLayout';
import { ActionDockItem } from '@/components/ui/ActionDock';
import Cookies from 'js-cookie';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type PatientTab = 'Todos' | 'Activos' | 'Inactivos';

export default function PatientsClient() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({
        total: 0,
        filteredTotal: 0,
        activeCount: 0,
        inactiveCount: 0,
        lastPage: 1
    });
    const [activeTab, setActiveTab] = useState<PatientTab>('Todos');
    const router = useRouter();

    const fetchPatients = async (retries = 3) => {
        setIsLoading(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(searchTerm && { search: searchTerm }),
                ...(activeTab !== 'Todos' && { status: activeTab })
            });

            const response = await fetch(`${apiUrl}/patients?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result: PatientsResponse = await response.json();
                setPatients(result.data);
                setMeta(result.meta);
            }
        } catch (e) {
            if (retries > 0) {
                setTimeout(() => fetchPatients(retries - 1), 2000);
            } else {
                console.warn("Backend no disponible para cargar pacientes.");
                toast.error("Error al conectar con el servidor");
            }
        } finally {
            if (retries === 0) setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPatients();
        }, searchTerm ? 400 : 0);
        return () => clearTimeout(timer);
    }, [searchTerm, page, activeTab]);

    const printJson = () => {
        console.group('📊 PATIENTS DATA');
        console.log('Pacientes:', patients);
        console.groupEnd();
        toast.info("JSON de pacientes impreso en consola.");
    };

    const filteredPatients = patients;

    const tabs: PatientTab[] = ['Todos', 'Activos', 'Inactivos'];

    const resetPatients = () => {
        setSearchTerm('');
        setPage(1);
        fetchPatients();
        toast.info("Lista de pacientes reiniciada.");
    };

    const actionDockItems: ActionDockItem[] = useMemo(() => [
        {
            id: 'export-json',
            icon: FileCode,
            label: 'Imprimir JSON',
            variant: 'slate',
            onClick: printJson
        },
        {
            id: 'reset',
            icon: RotateCcw,
            label: 'Refrescar',
            variant: 'rose',
            onClick: () => fetchPatients()
        }
    ], [patients]);

    return (
        <ModuleLayout
            title="Mis Pacientes"
            description="Gestiona los expedientes y progreso de tus pacientes de forma profesional."
            rightNavItems={actionDockItems}
            className="pb-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex p-1 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/50 backdrop-blur-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer",
                                activeTab === tab
                                    ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/50"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                            )}
                        >
                            {tab === 'Todos' && `Todos (${meta.total})`}
                            {tab === 'Activos' && `Activos (${meta.activeCount})`}
                            {tab === 'Inactivos' && `Inactivos (${meta.inactiveCount})`}
                        </button>
                    ))}
                </div>

                <Button
                    onClick={() => router.push('/dashboard/pacientes/new')}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black h-14 px-8 rounded-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3 group border-b-4 border-slate-700 active:border-b-0"
                >
                    <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform" aria-hidden="true" />
                    NUEVO PACIENTE
                </Button>
            </div>

            <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-linear-to-r from-emerald-500/20 to-blue-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white p-2 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-2">
                    <div className="pl-4">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                        type="search"
                        placeholder="Buscar por nombre, correo o documento..."
                        className="border-none bg-transparent h-12 text-lg focus-visible:ring-0 placeholder:text-slate-300 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {isLoading && (
                        <div className="pr-4">
                            <RotateCcw className="h-5 w-5 text-emerald-500 animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <User className="h-3 w-3" />
                        Total: <span className="text-emerald-600 font-black">{meta.total}</span> pacientes registrados
                    </p>
                </div>

                <div className="bg-white shadow-2xl shadow-slate-200/50 border border-slate-200 sm:rounded-[2.5rem] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidad del Paciente</th>
                                    <th scope="col" className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento / Id</th>
                                    <th scope="col" className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Clínico</th>
                                    <th scope="col" className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ver</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {isLoading && patients.length === 0 ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-8 py-6 h-20 bg-slate-50/30" />
                                        </tr>
                                    ))
                                ) : filteredPatients.length > 0 ? (
                                    filteredPatients.map((patient) => (
                                        <tr
                                            key={patient.id}
                                            onClick={() => router.push(`/dashboard/pacientes/${patient.id}`)}
                                            className="hover:bg-linear-to-r hover:from-slate-50 hover:to-white transition-all group cursor-pointer"
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center">
                                                    <div className="h-12 w-12 shrink-0">
                                                        <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-emerald-50 to-emerald-100 flex items-center justify-center text-emerald-600 font-black border border-emerald-200 shadow-sm group-hover:scale-110 transition-transform">
                                                            {patient.fullName.charAt(0)}
                                                        </div>
                                                    </div>
                                                    <div className="ml-5">
                                                        <div className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-none mb-1">
                                                            {patient.fullName}
                                                        </div>
                                                        <div className="text-xs text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                                            <Mail className="w-3 h-3" />
                                                            {patient.email || 'Sin correo'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                                                    {patient.documentId || '---'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center rounded-2xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset",
                                                    patient.status !== 'Inactive'
                                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                                        : "bg-slate-50 text-slate-500 ring-slate-500/10"
                                                )}>
                                                    <div className={cn("h-2 w-2 rounded-full mr-2", patient.status !== 'Inactive' ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                                                    {patient.status !== 'Inactive' ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="p-3 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all active:scale-90 cursor-pointer">
                                                    <ArrowRight className="h-6 w-6" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-24 bg-slate-50/50">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="h-20 w-20 bg-white rounded-4xl shadow-xl shadow-slate-200 flex items-center justify-center border border-slate-100">
                                                    <User className="h-10 w-10 text-slate-200" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-lg font-black text-slate-900 uppercase tracking-widest">Silencio clínico</p>
                                                    <p className="text-sm text-slate-400 font-medium">No hay pacientes que coincidan con la búsqueda.</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    className="font-black text-xs text-emerald-600 uppercase tracking-widest"
                                                    onClick={resetPatients}
                                                >
                                                    Limpiar filtros
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {meta.lastPage > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                        <Button
                            variant="outline"
                            className="rounded-xl font-bold h-10 w-10 p-0"
                            disabled={page === 1}
                            onClick={() => setPage(prev => prev - 1)}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest mx-4">
                            Página {page} de {meta.lastPage}
                        </span>
                        <Button
                            variant="outline"
                            className="rounded-xl font-bold h-10 w-10 p-0"
                            disabled={page === meta.lastPage}
                            onClick={() => setPage(prev => prev + 1)}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                )}
            </div>
        </ModuleLayout>
    );
}
