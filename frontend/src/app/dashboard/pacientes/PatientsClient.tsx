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
            setIsLoading(false);
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
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-10 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Nuevo Paciente
                </Button>
            </div>

            <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2">
                    <div className="pl-4">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                        type="search"
                        placeholder="Buscar por nombre, correo o documento..."
                        className="border-none bg-transparent h-10 text-sm focus-visible:ring-0 placeholder:text-slate-400 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {isLoading && (
                        <div className="pr-4">
                            <RotateCcw className="h-4 w-4 text-emerald-500 animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Total: <span className="text-emerald-600 font-semibold">{meta.total}</span> pacientes registrados
                    </p>
                </div>

                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Identidad del Paciente</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Documento / Id</th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado Clínico</th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ver</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {isLoading ? (
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
                                            className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 shrink-0">
                                                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-semibold border border-emerald-100 shadow-sm">
                                                            {patient.fullName.charAt(0)}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-semibold text-slate-900 leading-none mb-1">
                                                            {patient.fullName}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                                            <Mail className="w-3 h-3 text-slate-400" />
                                                            {patient.email || 'Sin correo'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center text-sm font-medium text-slate-600">
                                                    {patient.documentId || '---'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                    patient.status !== 'Inactive'
                                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                                        : "bg-slate-50 text-slate-600 ring-slate-500/10"
                                                )}>
                                                    {patient.status !== 'Inactive' ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer">
                                                    <ArrowRight className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-20 bg-slate-50/50">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-200">
                                                    <User className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-base font-semibold text-slate-700">Sin pacientes registrados</p>
                                                    <p className="text-sm text-slate-500">No hay pacientes que coincidan con la búsqueda.</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    className="font-medium text-sm text-emerald-600 hover:text-emerald-700"
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
                            className="rounded-lg font-medium h-9 w-9 p-0"
                            disabled={page === 1}
                            onClick={() => setPage(prev => prev - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium text-slate-600 mx-4">
                            Página {page} de {meta.lastPage}
                        </span>
                        <Button
                            variant="outline"
                            className="rounded-lg font-medium h-9 w-9 p-0"
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
