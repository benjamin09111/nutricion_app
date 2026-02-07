'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, MoreHorizontal, User, Phone, Calendar, Mail, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TagInput } from '@/components/ui/TagInput';
import { Patient } from '@/features/patients';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';
import { PatientStorage } from '@/features/patients/services/patientStorage';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type PatientTab = 'Todos' | 'Activos' | 'Inactivos';

interface PatientsClientProps {
    initialData: Patient[];
}

export default function PatientsClient({ initialData }: PatientsClientProps) {
    // Initialize DB with mocks if empty
    useEffect(() => {
        PatientStorage.initialize(initialData);
    }, [initialData]);

    const [patients, setPatients] = useState<Patient[]>([]);

    // Load from DB
    useEffect(() => {
        const stored = PatientStorage.getAll();
        setPatients(stored.length > 0 ? stored : initialData);
    }, [initialData]);

    const [activeTab, setActiveTab] = useState<PatientTab>('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();




    const filteredPatients = useMemo(() => {
        return patients.filter((patient) => {
            const matchesSearch =
                patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.email.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesTab =
                activeTab === 'Todos' ? true :
                    activeTab === 'Activos' ? patient.status === 'Active' :
                        activeTab === 'Inactivos' ? patient.status === 'Inactive' : true;

            return matchesSearch && matchesTab;
        });
    }, [patients, searchTerm, activeTab]);

    const tabs: PatientTab[] = ['Todos', 'Activos', 'Inactivos'];

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="md:flex md:items-center md:justify-between px-2">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">
                        Pacientes
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Gestiona los expedientes y progreso de tus pacientes.
                    </p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <Button
                        onClick={() => router.push('/dashboard/pacientes/new')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 px-8 rounded-2xl shadow-xl shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 group"
                    >
                        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" aria-hidden="true" />
                        NUEVO PACIENTE
                    </Button>
                </div>
            </div>
            {/* Tabs Switcher */}
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
                        {tab}
                    </button>
                ))}
            </div>

            {/* Filters Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 text-shadow-sm">Buscar Paciente</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
                            </div>
                            <Input
                                type="search"
                                placeholder="Nombre o correo electrónico..."
                                className="pl-10 h-11 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="space-y-2">
                <div className="flex justify-between items-center px-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Mostrando <span className="text-emerald-600">{filteredPatients.length}</span> pacientes
                    </p>
                </div>
                <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 sm:rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50 text-shadow-sm">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Paciente</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Contacto</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Última Visita</th>
                                    <th scope="col" className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Estado</th>
                                    <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {filteredPatients.length > 0 ? (
                                    filteredPatients.map((patient) => (
                                        <tr
                                            key={patient.id}
                                            onClick={() => router.push(`/dashboard/pacientes/${patient.id}`)}
                                            className="hover:bg-emerald-50/40 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 shrink-0">
                                                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold border-2 border-white shadow-sm">
                                                            {patient.name.charAt(0)}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                                            {patient.name}
                                                        </div>
                                                        <div className="text-sm text-slate-500 flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {patient.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                                    <Phone className="w-4 h-4 text-slate-400" />
                                                    {patient.contactInfo}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {patient.lastVisit || 'Sin visitas'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset",
                                                    patient.status === 'Active'
                                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                                        : "bg-slate-50 text-slate-600 ring-slate-500/10"
                                                )}>
                                                    {patient.status === 'Active' ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95 cursor-pointer">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-24">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="p-4 bg-slate-50 rounded-full">
                                                    <User className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-base font-bold text-slate-600">No se encontraron pacientes</p>
                                                    <p className="text-sm text-slate-400">Intenta con otro término de búsqueda.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
}
