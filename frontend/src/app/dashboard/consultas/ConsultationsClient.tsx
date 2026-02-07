'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Search, Eye, CalendarDays, User, X, Plus,
    Calendar, CheckCircle2, TrendingUp, AlertCircle,
    ChevronRight, RotateCcw, Trash2
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Consultation, Metric } from '@/features/consultations';
import { ConsultationStorage } from '@/features/consultations/services/consultationStorage';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ConsultationsClientProps {
    initialData: Consultation[];
    patients: { id: string; name: string }[];
}

export default function ConsultationsClient({ initialData, patients }: ConsultationsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const patientIdFromQuery = searchParams.get('patientId');

    const [searchTerm, setSearchTerm] = useState('');
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCalendarConnected, setIsCalendarConnected] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        patientId: '',
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        metrics: [] as Metric[]
    });

    // Initialize consultations and handle draft/query
    useEffect(() => {
        const stored = ConsultationStorage.getAll();
        setConsultations(stored.length > 0 ? stored : initialData);

        const draft = ConsultationStorage.getDraft();
        if (draft) {
            setFormData(prev => ({ ...prev, ...draft }));
            // If there's a draft, maybe open the modal? 
            // Only if it's explicitly wanted. User said "save as draft" when going to create patient.
        }

        if (patientIdFromQuery) {
            setFormData(prev => ({ ...prev, patientId: patientIdFromQuery }));
            setIsCreateModalOpen(true);
        }
    }, [initialData, patientIdFromQuery]);

    const filteredData = useMemo(() => {
        return consultations.filter((item) => {
            return (item.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
                (item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
        });
    }, [consultations, searchTerm]);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const patient = patients.find(p => p.id === formData.patientId);
        if (!patient) return;

        const newConsultation: Consultation = {
            id: Math.random().toString(36).substr(2, 9),
            patientId: formData.patientId,
            patientName: patient.name,
            date: formData.date, // ISO format from input type="date"
            title: formData.title,
            description: formData.description,
            metrics: formData.metrics
        };

        ConsultationStorage.save(newConsultation);
        setConsultations([newConsultation, ...consultations]);
        ConsultationStorage.clearDraft();

        setIsCreateModalOpen(false);
        setFormData({
            patientId: '',
            date: new Date().toISOString().split('T')[0],
            title: '',
            description: '',
            metrics: []
        });
        toast.success('Consulta registrada con éxito');
    };

    const addMetric = () => {
        setFormData({
            ...formData,
            metrics: [...formData.metrics, { label: '', value: '', unit: '' }]
        });
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

    const saveDraftAndRedirect = () => {
        ConsultationStorage.saveDraft(formData);
        router.push('/dashboard/pacientes/new');
    };

    const resetForm = () => {
        if (confirm('¿Estás seguro de que quieres borrar el borrador y comenzar de nuevo?')) {
            ConsultationStorage.clearDraft();
            setFormData({
                patientId: '',
                date: new Date().toISOString().split('T')[0],
                title: '',
                description: '',
                metrics: []
            });
            toast.info('Borrador eliminado');
        }
    };

    const toggleCalendar = () => {
        setIsCalendarConnected(!isCalendarConnected);
    };

    return (
        <div className="space-y-6 relative">
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <Input
                        type="search"
                        placeholder="Buscar por paciente o título..."
                        className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200/50 active:scale-95 cursor-pointer"
                    >
                        <Plus className="w-5 h-5" />
                        Nueva Consulta
                    </button>

                    {!isCalendarConnected ? (
                        <button
                            onClick={toggleCalendar}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm cursor-pointer border border-slate-200 shadow-sm"
                        >
                            <svg className="w-4 h-4" aria-hidden="true" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Conectar Calendar
                        </button>
                    ) : (
                        <button
                            onClick={toggleCalendar}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl transition-all text-sm cursor-pointer border border-emerald-100"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Calendar Conectado
                        </button>
                    )}
                </div>
            </div>

            {/* Consultations Table */}
            <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 sm:rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/50 text-shadow-sm">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Paciente</th>
                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Fecha</th>
                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Título de la Sesión</th>
                                <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {filteredData.length > 0 ? (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div
                                                className="flex items-center gap-3 cursor-pointer"
                                                onClick={() => router.push(`/dashboard/pacientes/${item.patientId}`)}
                                            >
                                                <div className="p-2 rounded-full bg-slate-50 border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                                                    <User className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors uppercase tracking-tight">
                                                    {item.patientName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="w-4 h-4 text-slate-300" />
                                                <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
                                                    {new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <span className="text-sm font-bold text-slate-600 truncate block" title={item.title}>
                                                {item.title}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedConsultation(item)}
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                                                title="Ver Detalle"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-24">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="p-4 bg-slate-50 rounded-full">
                                                <CalendarDays className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-base font-bold text-slate-600">No hay consultas registradas</p>
                                                <p className="text-sm text-slate-400">Tus sesiones historiales aparecerán aquí.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Consultation Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
                    <div className="fixed inset-0" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 my-8">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Nueva Consulta</h3>
                                <p className="text-sm text-slate-500 font-medium">Registra el progreso y detalles de la sesión</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={resetForm}
                                    title="Comenzar de nuevo"
                                    className="p-2.5 bg-white rounded-2xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all border border-slate-200 shadow-sm cursor-pointer"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-2.5 bg-white rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paciente</label>
                                    <div className="space-y-2">
                                        <select
                                            className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700 cursor-pointer"
                                            value={formData.patientId}
                                            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                                            required
                                        >
                                            <option value="">Seleccionar paciente...</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        {!formData.patientId && (
                                            <button
                                                type="button"
                                                onClick={saveDraftAndRedirect}
                                                className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1 hover:underline ml-1 cursor-pointer"
                                            >
                                                <Plus className="w-3 h-3" /> ¿Paciente nuevo? Créalo aquí
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Consulta</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <Calendar className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="date"
                                            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700 cursor-pointer"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título de la Sesión</label>
                                <Input
                                    placeholder="Ej: Evaluación Inicial Antropométrica"
                                    className="h-12 rounded-2xl bg-slate-50 border-slate-200 font-bold"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-shadow-sm">Notas Clínicas</label>
                                <textarea
                                    className="w-full p-5 rounded-3xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-700 resize-none min-h-[120px] leading-relaxed"
                                    placeholder="Registra observaciones sobre hábitos, sueño, saciedad o cualquier detalle clínico relevante..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Tracking Metrics Section */}
                            <div className="space-y-4 p-6 bg-emerald-50/50 rounded-[32px] border border-emerald-100/50">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Seguimiento de Progreso</h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addMetric}
                                        className="text-[10px] font-black bg-emerald-600 text-white px-3 py-1.5 rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-md shadow-emerald-200 cursor-pointer"
                                    >
                                        <Plus className="w-3 h-3" /> AGREGAR MÉTRICA
                                    </button>
                                </div>

                                {formData.metrics.length > 0 ? (
                                    <div className="space-y-3">
                                        {formData.metrics.map((metric, idx) => (
                                            <div key={idx} className="grid grid-cols-12 gap-3 items-end animate-in slide-in-from-left-2 duration-200">
                                                <div className="col-span-12 md:col-span-5 space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Característica</label>
                                                    <Input
                                                        placeholder="Vitamina C, Peso, Grasa..."
                                                        className="h-10 rounded-xl bg-white border-slate-200 text-xs font-bold"
                                                        value={metric.label}
                                                        onChange={(e) => updateMetric(idx, 'label', e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-7 md:col-span-4 space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Valor</label>
                                                    <Input
                                                        placeholder="20, 75.5..."
                                                        className="h-10 rounded-xl bg-white border-slate-200 text-xs font-bold"
                                                        value={metric.value}
                                                        onChange={(e) => updateMetric(idx, 'value', e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-3 md:col-span-2 space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Unidad</label>
                                                    <Input
                                                        placeholder="mg, kg, %"
                                                        className="h-10 rounded-xl bg-white border-slate-200 text-xs font-bold"
                                                        value={metric.unit}
                                                        onChange={(e) => updateMetric(idx, 'unit', e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-span-2 md:col-span-1 pb-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMetric(idx)}
                                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center bg-white/50 rounded-2xl border border-dashed border-emerald-200/50">
                                        <AlertCircle className="w-8 h-8 text-emerald-200 mx-auto mb-2" />
                                        <p className="text-xs font-medium text-slate-400">Agrega métricas para graficar el progreso del paciente sesión a sesión.</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-8 py-3 bg-white text-slate-700 font-black rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-10 py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 cursor-pointer disabled:opacity-50"
                                    disabled={!formData.patientId || !formData.title}
                                >
                                    GUARDAR CONSULTA
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal Overlay */}
            {selectedConsultation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="fixed inset-0" onClick={() => setSelectedConsultation(null)} />
                    <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                        {new Date(selectedConsultation.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Detalle de Sesión</h3>
                                <div className="flex items-center gap-2 mt-2 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                                    <User className="w-3 h-3" />
                                    {selectedConsultation.patientName}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedConsultation(null)}
                                className="p-3 bg-white rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Motivo / Título
                                </label>
                                <p className="text-2xl font-black text-slate-900 leading-tight">
                                    {selectedConsultation.title}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Notas Clínicas
                                </label>
                                <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                    {selectedConsultation.description}
                                </div>
                            </div>

                            {selectedConsultation.metrics && selectedConsultation.metrics.length > 0 && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Métricas de Seguimiento
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedConsultation.metrics.map((m, i) => (
                                            <div key={i} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50 flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase">{m.label}</span>
                                                <span className="text-xl font-black text-emerald-700">{m.value} <span className="text-sm text-emerald-500/70">{m.unit}</span></span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <Button
                                onClick={() => router.push(`/dashboard/pacientes/${selectedConsultation.patientId}`)}
                                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-black rounded-2xl px-6"
                            >
                                IR AL PACIENTE <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                            <button
                                onClick={() => setSelectedConsultation(null)}
                                className="px-10 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95 cursor-pointer"
                            >
                                CERRAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
