'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Search, Eye, CalendarDays, User, X, Plus,
    Calendar, CheckCircle2, TrendingUp, AlertCircle,
    ChevronRight, RotateCcw, Trash2, Edit2, ChevronLeft,
    Weight, Ruler, Activity, Dumbbell, Zap, Target
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Consultation, Metric, ConsultationsResponse } from '@/features/consultations';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ModuleLayout } from '@/components/shared/ModuleLayout';
import { ActionDockItem } from '@/components/ui/ActionDock';
import Cookies from 'js-cookie';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const METRIC_PRESETS = [
    { key: 'weight', label: 'Peso', unit: 'kg', icon: Weight },
    { key: 'height', label: 'Altura', unit: 'cm', icon: Ruler },
    { key: 'body_fat', label: 'Grasa Corporal', unit: '%', icon: Activity },
    { key: 'muscle_mass', label: 'Masa Muscular', unit: 'kg', icon: Dumbbell },
    { key: 'visceral_fat', label: 'Grasa Visceral', unit: 'lvl', icon: Zap },
    { key: 'waist', label: 'Cintura', unit: 'cm', icon: Target },
];

export default function ConsultationsClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const patientIdFromQuery = searchParams.get('patientId');

    const [searchTerm, setSearchTerm] = useState('');
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [patients, setPatients] = useState<{ id: string; fullName: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPatientsLoading, setIsPatientsLoading] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total: 0, page: 1, lastPage: 1 });

    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isCalendarConnected, setIsCalendarConnected] = useState(false);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [consultationToDelete, setConsultationToDelete] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        patientId: '',
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        metrics: [] as Metric[]
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const getAuthHeaders = () => {
        const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const fetchConsultations = async (retries = 3) => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(searchTerm && { search: searchTerm }),
                ...(patientIdFromQuery && { patientId: patientIdFromQuery })
            });

            const response = await fetch(`${apiUrl}/consultations?${queryParams}`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const result: ConsultationsResponse = await response.json();
                setConsultations(result.data);
                setMeta(result.meta);
            } else {
                toast.error("Error al cargar consultas");
            }
        } catch (e) {
            if (retries > 0) {
                setTimeout(() => fetchConsultations(retries - 1), 2000);
            } else {
                toast.error("Error de conexión");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPatients = async () => {
        setIsPatientsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/patients?limit=100`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const result = await response.json();
                setPatients(result.data.map((p: { id: string, fullName: string }) => ({ id: p.id, fullName: p.fullName })));
            }
        } catch (error) {
            console.error("Error fetching patients", error);
        } finally {
            setIsPatientsLoading(false);
        }
    };

    useEffect(() => {
        fetchConsultations();
    }, [page, searchTerm, patientIdFromQuery]);

    useEffect(() => {
        fetchPatients();
        if (patientIdFromQuery) {
            setFormData(prev => ({ ...prev, patientId: patientIdFromQuery }));
        }
    }, [patientIdFromQuery]);

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const method = isEditing ? 'PATCH' : 'POST';
            const url = isEditing && selectedConsultation ? `${apiUrl}/consultations/${selectedConsultation.id}` : `${apiUrl}/consultations`;

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success(isEditing ? 'Consulta actualizada' : 'Consulta registrada');
                setIsCreateModalOpen(false);
                setIsEditing(false);
                setFormData({
                    patientId: '',
                    date: new Date().toISOString().split('T')[0],
                    title: '',
                    description: '',
                    metrics: []
                });
                fetchConsultations();
            } else {
                toast.error("Error al procesar la solicitud");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    const handleDelete = async () => {
        if (!consultationToDelete) return;

        try {
            const response = await fetch(`${apiUrl}/consultations/${consultationToDelete}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                toast.success("Consulta eliminada");
                setIsDeleteModalOpen(false);
                setConsultationToDelete(null);
                fetchConsultations();
            } else {
                toast.error("Error al eliminar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    const openEditModal = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        setIsEditing(true);
        setFormData({
            patientId: consultation.patientId,
            date: new Date(consultation.date).toISOString().split('T')[0],
            title: consultation.title,
            description: consultation.description || '',
            metrics: consultation.metrics || []
        });
        setIsCreateModalOpen(true);
    };

    const addMetric = () => {
        setFormData({
            ...formData,
            metrics: [...formData.metrics, { label: '', value: '', unit: '' }]
        });
    };

    const addSmartMetric = (preset: typeof METRIC_PRESETS[0]) => {
        // Avoid duplicates in the current form
        if (formData.metrics.find(m => m.key === preset.key)) {
            toast.error(`${preset.label} ya está en la lista`);
            return;
        }

        setFormData({
            ...formData,
            metrics: [...formData.metrics, {
                key: preset.key,
                label: preset.label,
                value: '',
                unit: preset.unit
            }]
        });
        toast.success(`Métrica ${preset.label} añadida`);
    };

    const removeMetric = (index: number) => {
        const newMetrics = [...formData.metrics];
        newMetrics.splice(index, 1);
        setFormData({ ...formData, metrics: newMetrics });
    };

    const updateMetric = (index: number, field: keyof Metric, value: string) => {
        const newMetrics = [...formData.metrics];
        newMetrics[index] = { ...newMetrics[index], [field]: value };
        setFormData({ ...formData, metrics: newMetrics });
    };

    const resetForm = () => {
        if (formData.title || formData.description) {
            setIsResetConfirmOpen(true);
        } else {
            setFormData({
                patientId: '',
                date: new Date().toISOString().split('T')[0],
                title: '',
                description: '',
                metrics: []
            });
        }
    };

    const confirmResetForm = () => {
        setFormData({
            patientId: '',
            date: new Date().toISOString().split('T')[0],
            title: '',
            description: '',
            metrics: []
        });
        setIsResetConfirmOpen(false);
    };

    const actionDockItems: ActionDockItem[] = useMemo(() => [
        {
            id: 'refresh',
            icon: RotateCcw,
            label: 'Refrescar',
            variant: 'rose',
            onClick: () => fetchConsultations()
        }
    ], []);

    return (
        <ModuleLayout
            title="Mis Consultas"
            description="Sistema centralizado de seguimiento y evolución clínica de pacientes."
            rightNavItems={actionDockItems}
            className="pb-8"
        >
            <ConfirmationModal
                isOpen={isResetConfirmOpen}
                onClose={() => setIsResetConfirmOpen(false)}
                onConfirm={confirmResetForm}
                title="¿Limpiar formulario?"
                description="Se perderán los datos actuales."
                confirmText="Sí, limpiar"
                cancelText="Cancelar"
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="¿Eliminar consulta?"
                description="Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />

            <div className="space-y-6 relative animate-in fade-in duration-700">
                {/* Filters Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
                        </div>
                        <Input
                            type="search"
                            placeholder="Buscar consulta..."
                            className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                    patientId: patientIdFromQuery || '',
                                    date: new Date().toISOString().split('T')[0],
                                    title: '',
                                    description: '',
                                    metrics: []
                                });
                                setIsCreateModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-xl shadow-slate-200 active:scale-95 cursor-pointer"
                        >
                            <Plus className="w-5 h-5" />
                            Nueva Consulta
                        </button>
                    </div>
                </div>

                {/* Consultations Table */}
                <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 rounded-3xl overflow-hidden relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                            <div className="h-10 w-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                        </div>
                    )}

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Paciente</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Sesión</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {consultations.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/dashboard/pacientes/${item.patientId}`)}
                                                    className="text-sm font-black text-slate-700 italic hover:text-emerald-600 transition-colors text-left cursor-pointer"
                                                >
                                                    {item.patientName}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase">
                                                <CalendarDays className="w-4 h-4 text-emerald-500" />
                                                {new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-800 tracking-tight block max-w-xs truncate">
                                                {item.title}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setSelectedConsultation(item)}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setConsultationToDelete(item.id);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!isLoading && consultations.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-32 text-center text-slate-300 font-black uppercase tracking-widest text-xs italic">
                                            No hay consultas registradas
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {meta.lastPage > 1 && (
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Página {meta.page} de {meta.lastPage}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    variant="ghost"
                                    className="h-8 w-8 p-0 rounded-lg"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
                                    disabled={page === meta.lastPage}
                                    variant="ghost"
                                    className="h-8 w-8 p-0 rounded-lg"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create/Edit Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 my-8 flex flex-col max-h-[90vh]">
                            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">
                                        {isEditing ? 'Editar Sesión' : 'Nueva Consulta'}
                                    </h3>
                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Registra el progreso clínico</p>
                                </div>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all border border-slate-100 shadow-sm cursor-pointer"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateOrUpdate} className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Paciente</label>
                                        <select
                                            className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700 cursor-pointer appearance-none shadow-sm"
                                            value={formData.patientId}
                                            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                                            required
                                            disabled={isEditing}
                                        >
                                            <option value="">Seleccionar paciente...</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>{p.fullName}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
                                            <input
                                                type="date"
                                                className="w-full h-14 pl-14 pr-5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700 cursor-pointer shadow-sm"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título de la Sesión</label>
                                    <Input
                                        placeholder="Ej: Evaluación Inicial Antropométrica"
                                        className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold px-6 shadow-sm"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notas Clínicas</label>
                                    <textarea
                                        className="w-full p-6 rounded-[2.5rem] bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-700 resize-none min-h-[160px] leading-relaxed shadow-sm"
                                        placeholder="Registra observaciones sobre hábitos, sueño, saciedad..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                {/* Metrics Section */}
                                <div className="space-y-6 p-8 bg-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full" />

                                    <div className="flex flex-col gap-4 relative z-10">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seguimiento de Progreso</h4>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addMetric}
                                                className="text-[10px] font-black bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 border border-white/10 active:scale-95 cursor-pointer"
                                            >
                                                <Plus className="w-3 h-3" /> PERSONALIZADA
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {METRIC_PRESETS.map((preset) => (
                                                <button
                                                    key={preset.key}
                                                    type="button"
                                                    onClick={() => addSmartMetric(preset)}
                                                    className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-emerald-500/20 border border-white/5 hover:border-emerald-500/30 rounded-xl transition-all cursor-pointer group/item"
                                                >
                                                    <preset.icon className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-emerald-400" />
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover/item:text-white">{preset.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        {formData.metrics.map((metric, idx) => (
                                            <div key={idx} className="grid grid-cols-12 gap-4 items-end animate-in slide-in-from-bottom-2 duration-300">
                                                <div className="col-span-4 space-y-1">
                                                    <Input
                                                        placeholder="Peso, Grasa..."
                                                        className="h-10 rounded-xl bg-white/5 border-white/10 text-white font-bold"
                                                        value={metric.label}
                                                        onChange={(e) => updateMetric(idx, 'label', e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-4 space-y-1">
                                                    <Input
                                                        placeholder="75.5, 20..."
                                                        className="h-10 rounded-xl bg-white/5 border-white/10 text-white font-bold"
                                                        value={metric.value}
                                                        onChange={(e) => updateMetric(idx, 'value', e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-3 space-y-1">
                                                    <Input
                                                        placeholder="kg, %..."
                                                        className="h-10 rounded-xl bg-white/5 border-white/10 text-white font-bold"
                                                        value={metric.unit}
                                                        onChange={(e) => updateMetric(idx, 'unit', e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-1 pb-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMetric(idx)}
                                                        className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-8 flex justify-end gap-5">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-8 py-4 bg-white text-slate-400 font-black rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
                                    >
                                        CANCELAR
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-12 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 cursor-pointer"
                                    >
                                        {isEditing ? 'ACTUALIZAR' : 'GUARDAR CONSULTA'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Details Modal */}
                {selectedConsultation && !isEditing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="relative bg-white rounded-[4rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
                            <div className="p-12 space-y-10">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                {new Date(selectedConsultation.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter">{selectedConsultation.title}</h2>
                                        <button
                                            onClick={() => router.push(`/dashboard/pacientes/${selectedConsultation.patientId}`)}
                                            className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-emerald-600 transition-colors cursor-pointer group"
                                        >
                                            <User className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                                            {selectedConsultation.patientName}
                                        </button>
                                    </div>
                                    <button onClick={() => setSelectedConsultation(null)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Observaciones Clínicas</h4>
                                    <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 text-slate-600 font-medium leading-relaxed italic">
                                        {selectedConsultation.description || 'Sin notas registradas.'}
                                    </div>
                                </div>

                                {selectedConsultation.metrics && selectedConsultation.metrics.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Métricas Clave</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedConsultation.metrics.map((m, i) => (
                                                <div key={i} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{m.label}</p>
                                                    <p className="text-2xl font-black text-slate-900 italic">
                                                        {m.value} <span className="text-xs text-slate-300 uppercase tracking-widest ml-1">{m.unit}</span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6">
                                    <Button
                                        onClick={() => setSelectedConsultation(null)}
                                        className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-3xl shadow-2xl active:scale-95 transition-all text-xs tracking-widest uppercase"
                                    >
                                        Cerrar Expediente
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ModuleLayout>
    );
}
