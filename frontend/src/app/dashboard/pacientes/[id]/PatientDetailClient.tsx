'use client';

import { useState, useEffect } from 'react';
import {
    User, Mail, Phone, Calendar, Ruler, Weight,
    ArrowLeft, TrendingUp, History as HistoryIcon, ClipboardList,
    Plus, Activity, Target, Zap, Dumbbell, AlertCircle,
    Edit2, Save, X as CloseIcon, ChevronRight, Eye, Trash2,
    CalendarDays
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar
} from 'recharts';
import { useRouter } from 'next/navigation';
import { Patient } from '@/features/patients';
import { Consultation, ConsultationsResponse } from '@/features/consultations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface PatientDetailClientProps {
    id: string;
}

type TabType = 'General' | 'Progreso';

export default function PatientDetailClient({ id }: PatientDetailClientProps) {
    const router = useRouter();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConsultationsLoading, setIsConsultationsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('General');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Patient>>({});

    const prepareChartData = () => {
        if (!consultations || consultations.length === 0) return [];

        return consultations
            .filter(c => c.metrics && c.metrics.length > 0)
            .map(c => {
                const data: any = {
                    date: new Date(c.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                    fullDate: new Date(c.date).toLocaleDateString(),
                };
                c.metrics?.forEach(m => {
                    if (m.key) {
                        const val = typeof m.value === 'string' ? parseFloat(m.value) : m.value;
                        if (!isNaN(val)) {
                            data[m.key] = val;
                        }
                    }
                });
                return data;
            });
    };

    const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const fetchPatient = async (retries = 3) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/patients/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setPatient(data);
            } else {
                toast.error("Paciente no encontrado");
                router.push('/dashboard/pacientes');
            }
        } catch (e) {
            if (retries > 0) {
                setTimeout(() => fetchPatient(retries - 1), 2000);
            } else {
                toast.error("Error al cargar datos del paciente");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchConsultations = async () => {
        setIsConsultationsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/consultations?patientId=${id}&limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result: ConsultationsResponse = await response.json();
                setConsultations(result.data);
            }
        } catch (error) {
            console.error("Error fetching consultations", error);
        } finally {
            setIsConsultationsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchPatient();
            fetchConsultations();
        }
    }, [id]);

    const handleEdit = () => {
        if (!patient) return;
        setEditForm(patient);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!patient || !editForm) return;

        try {
            const response = await fetch(`${apiUrl}/patients/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });

            if (response.ok) {
                const updated = await response.json();
                setPatient(updated);
                setIsEditing(false);
                toast.success("Perfil actualizado");
            } else {
                toast.error("Error al actualizar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    const updateField = (field: keyof Patient, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este paciente? Esta acción es irreversible.')) return;

        try {
            const response = await fetch(`${apiUrl}/patients/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success("Paciente eliminado correctamente");
                router.push('/dashboard/pacientes');
            } else {
                toast.error("Error al eliminar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    const toggleStatus = async () => {
        if (!patient) return;
        const newStatus = patient.status === 'Active' ? 'Inactive' : 'Active';

        try {
            const response = await fetch(`${apiUrl}/patients/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const updated = await response.json();
                setPatient(updated);
                toast.success(`Estado actualizado a ${newStatus === 'Active' ? 'Activo' : 'Inactivo'}`);
            }
        } catch (error) {
            toast.error("Error al cambiar estado");
        }
    };

    if (isLoading && !patient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="h-16 w-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Cargando expediente...</p>
            </div>
        );
    }

    if (!patient) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-24 animate-in fade-in duration-700">
            {/* Header & Back Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/dashboard/pacientes')}
                        className="group p-4 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
                                {isEditing ? (
                                    <Input
                                        value={editForm.fullName || ''}
                                        onChange={e => updateField('fullName', e.target.value)}
                                        className="bg-slate-50 border-none font-black text-4xl h-12 p-0 focus:bg-transparent"
                                    />
                                ) : patient.fullName}
                            </h1>
                            <button
                                onClick={toggleStatus}
                                className={cn(
                                    "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer hover:scale-105 active:scale-95",
                                    patient.status !== 'Inactive' ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                                )}
                            >
                                {patient.status !== 'Inactive' ? 'Activo' : 'Inactivo'}
                            </button>
                        </div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
                            EXPEDIENTE INTEGRADO <ChevronRight className="w-3 h-3" /> {patient.documentId || 'SIN ID'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    {isEditing ? (
                        <>
                            <Button
                                onClick={() => setIsEditing(false)}
                                variant="ghost"
                                className="rounded-2xl h-14 px-8 text-slate-400 font-black uppercase tracking-widest text-xs"
                            >
                                <CloseIcon className="w-5 h-5 mr-3" />
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 px-10 rounded-2xl shadow-2xl shadow-emerald-100 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <Save className="w-5 h-5 mr-3" />
                                GUARDAR CAMBIOS
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={handleEdit}
                                variant="ghost"
                                className="rounded-2xl h-14 px-8 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 font-black uppercase tracking-widest text-xs"
                            >
                                <Edit2 className="w-4 h-4 mr-3" />
                                Editar Perfil
                            </Button>
                            <Button
                                onClick={() => router.push('/dashboard/consultas?patientId=' + patient.id)}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-black h-14 px-10 rounded-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <Plus className="w-5 h-5 mr-3" />
                                NUEVA CONSULTA
                            </Button>
                            <Button
                                onClick={handleDelete}
                                variant="ghost"
                                className="rounded-2xl h-14 w-14 p-0 text-slate-300 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                                title="Eliminar Paciente"
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Peso Actual', value: patient.weight, unit: 'kg', icon: Weight, color: 'text-blue-600', bg: 'bg-blue-50', field: 'weight' },
                    { label: 'Altura', value: patient.height, unit: 'cm', icon: Ruler, color: 'text-emerald-600', bg: 'bg-emerald-50', field: 'height' },
                    { label: 'Género', value: patient.gender, icon: User, color: 'text-amber-600', bg: 'bg-amber-50', field: 'gender' },
                    { label: 'Identificador', value: patient.documentId || '---', icon: ClipboardList, color: 'text-rose-600', bg: 'bg-rose-50', field: 'documentId' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col gap-4 group hover:scale-[1.02] transition-all">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform", stat.bg)}>
                            <stat.icon className={cn("w-6 h-6", stat.color)} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{stat.label}</p>
                            <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
                                {isEditing && stat.field ? (
                                    <Input
                                        type={typeof stat.value === 'number' ? 'number' : 'text'}
                                        value={(editForm[stat.field as keyof Patient] as string | number) || ''}
                                        onChange={e => updateField(stat.field as keyof Patient, e.target.value)}
                                        className="h-8 border-none bg-slate-50 font-black p-1 text-xl"
                                    />
                                ) : (
                                    <>
                                        {stat.value}
                                        <span className="text-xs text-slate-400 font-bold uppercase">{stat.unit}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-10 border-b border-slate-100 px-6">
                {(['General', 'Progreso'] as TabType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative",
                            activeTab === tab ? "text-slate-900" : "text-slate-300 hover:text-slate-500 cursor-pointer"
                        )}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-full animate-in slide-in-from-bottom-1" />
                        )}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            {activeTab === 'General' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Clinical & Dietary */}
                    <div className="lg:col-span-8 space-y-10">
                        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
                            <div className="p-10 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4 italic">
                                    <Activity className="w-8 h-8 text-emerald-500" />
                                    Inteligencia Clínica
                                </h3>
                                <div className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                    Sincronizado
                                </div>
                            </div>

                            <div className="p-10 grid md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-3">Información de Contacto</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 group">
                                                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-emerald-50 transition-colors">
                                                    <Mail className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Email</p>
                                                    {isEditing ? (
                                                        <Input
                                                            value={editForm.email || ''}
                                                            onChange={e => updateField('email', e.target.value)}
                                                            className="h-8 border-none font-bold text-slate-800 p-0"
                                                        />
                                                    ) : <p className="font-bold text-slate-700">{patient.email}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 group">
                                                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-emerald-50 transition-colors">
                                                    <Phone className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Teléfono</p>
                                                    {isEditing ? (
                                                        <Input
                                                            value={editForm.phone || ''}
                                                            onChange={e => updateField('phone', e.target.value)}
                                                            className="h-8 border-none font-bold text-slate-800 p-0"
                                                        />
                                                    ) : <p className="font-bold text-slate-700">{patient.phone || 'No registrado'}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-5">
                                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-3">Restricciones Alimentarias</h4>
                                        <div className="flex flex-wrap gap-3">
                                            {isEditing ? (
                                                <TagInput
                                                    value={editForm.dietRestrictions as string[] || []}
                                                    onChange={tags => updateField('dietRestrictions', tags)}
                                                    className="bg-slate-50 border-none rounded-2xl p-4 font-black"
                                                    placeholder="Agregar restricción..."
                                                />
                                            ) : (
                                                <>
                                                    {Array.isArray(patient.dietRestrictions) && patient.dietRestrictions.length > 0 ? (
                                                        patient.dietRestrictions.map((r, i) => (
                                                            <span key={i} className="px-5 py-2 bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-rose-100 shadow-sm">
                                                                {r}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <div className="flex items-center gap-3 text-slate-400 p-4 bg-slate-50 rounded-2xl w-full border border-dashed border-slate-200">
                                                            <AlertCircle className="w-4 h-4" />
                                                            <span className="text-xs font-bold italic">Sin restricciones detectadas</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* New Clinical Summary Row */}
                            <div className="px-10 pb-10">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-3 flex items-center justify-between">
                                        Resumen / Observaciones Clínicas
                                        {!isEditing && (
                                            <span className="text-emerald-500 lowercase font-bold tracking-normal italic opacity-50">Solo visible para el nutricionista</span>
                                        )}
                                    </h4>
                                    {isEditing ? (
                                        <textarea
                                            value={editForm.clinicalSummary || ''}
                                            onChange={e => updateField('clinicalSummary', e.target.value)}
                                            className="w-full h-32 rounded-2xl bg-slate-50 border-none p-6 font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                                            placeholder="Ingresa notas clínicas, antecedentes importantes o evolución general..."
                                        />
                                    ) : (
                                        <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-50 min-h-[100px]">
                                            {patient.clinicalSummary ? (
                                                <p className="text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                                                    {patient.clinicalSummary}
                                                </p>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center gap-3 py-4 text-slate-300">
                                                    <ClipboardList className="w-8 h-8 opacity-20" />
                                                    <p className="text-xs font-bold italic">Sin observaciones clínicas registradas</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-6">
                                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4 italic text-shadow-sm">
                                    <HistoryIcon className="w-7 h-7 text-emerald-600" />
                                    Historial Clínico
                                </h3>
                                <button
                                    onClick={() => router.push('/dashboard/consultas')}
                                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors cursor-pointer"
                                >
                                    Ver Todo
                                </button>
                            </div>

                            <div className="space-y-4">
                                {isConsultationsLoading ? (
                                    <div className="p-20 flex justify-center">
                                        <div className="h-10 w-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
                                    </div>
                                ) : consultations.length > 0 ? (
                                    consultations.map((consultation) => (
                                        <div
                                            key={consultation.id}
                                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center justify-between group hover:scale-[1.01] transition-all cursor-pointer"
                                            onClick={() => router.push('/dashboard/consultas')}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                                                    <CalendarDays className="w-6 h-6 text-slate-300 group-hover:text-emerald-500" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                                                        {new Date(consultation.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none group-hover:text-slate-900">
                                                        {consultation.title}
                                                    </h4>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {consultation.metrics && consultation.metrics.length > 0 && (
                                                    <div className="hidden md:flex items-center gap-2">
                                                        {consultation.metrics.slice(0, 1).map((m, i) => (
                                                            <div key={i} className="px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                                                                {m.label}: {m.value}{m.unit}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="p-3 rounded-xl text-slate-300 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
                                                    <Eye className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-slate-50 rounded-[3rem] p-16 text-center border-4 border-dashed border-slate-200/50">
                                        <div className="w-20 h-20 bg-white rounded-4xl shadow-xl shadow-slate-200 flex items-center justify-center mx-auto mb-6">
                                            <Activity className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Sin registros de consulta</h4>
                                        <p className="text-slate-400 font-medium max-w-xs mx-auto mb-8">
                                            Empieza a documentar el progreso de {patient.fullName} creando su primera consulta.
                                        </p>
                                        <Button
                                            onClick={() => router.push('/dashboard/consultas?patientId=' + patient.id)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 px-8 rounded-2xl transition-all shadow-xl shadow-emerald-200/50 active:scale-95"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Iniciar Evaluación
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Health Status */}
                    <div className="lg:col-span-4 space-y-10">
                        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-300 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 blur-[60px] translate-x-1/4 -translate-y-1/4 rounded-full" />

                            <h4 className="flex items-center gap-3 font-black text-emerald-400 uppercase text-[10px] tracking-[0.2em] mb-8">
                                <Target className="w-4 h-4" />
                                Foco Nutricional
                            </h4>

                            <div className="space-y-8 relative z-10">
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Objetivo Principal</p>
                                    {isEditing ? (
                                        <Input
                                            value={editForm.nutritionalFocus || ''}
                                            onChange={e => updateField('nutritionalFocus', e.target.value)}
                                            className="bg-slate-800 border-none text-white font-black text-2xl h-12 p-2 focus:ring-1 focus:ring-emerald-500"
                                            placeholder="Ej. Déficit Calórico"
                                        />
                                    ) : (
                                        <p className="text-2xl font-black tracking-tight leading-tight italic">
                                            {patient.nutritionalFocus || 'Sin foco definido'}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 p-5 bg-white/5 rounded-4xl border border-white/10 backdrop-blur-sm group-hover:bg-white/10 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <p className="text-sm font-bold text-emerald-100 italic">
                                        {patient.status === 'Active' ? 'Seguimiento optimizado.' : 'Paciente en pausa.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-rose-600">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                                        <Dumbbell className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-lg font-black uppercase tracking-tight italic">Metas Fitness</h4>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {isEditing ? (
                                    <textarea
                                        value={editForm.fitnessGoals || ''}
                                        onChange={e => updateField('fitnessGoals', e.target.value)}
                                        className="w-full h-24 rounded-4xl bg-slate-50 border-none p-6 font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
                                        placeholder="Ej. Maratón en Septiembre, Hipertrofia tren inferior..."
                                    />
                                ) : (
                                    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                        {patient.fitnessGoals ? (
                                            <p className="text-sm font-bold text-slate-600 italic leading-relaxed text-center">
                                                {patient.fitnessGoals}
                                            </p>
                                        ) : (
                                            <p className="text-xs font-bold text-slate-400 italic text-center">No se han definido objetivos aún.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-10 animate-in zoom-in-95 duration-500">
                    {/* Progression Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Weight Chart */}
                        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50">
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 italic flex items-center gap-3">
                                        <Weight className="w-6 h-6 text-blue-500" />
                                        Evolución de Peso
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Variación en kilogramos (kg)</p>
                                </div>
                            </div>

                            <div className="h-[300px] w-full">
                                {consultations.some(c => c.metrics?.some(m => m.key === 'weight')) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={prepareChartData()}>
                                            <defs>
                                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }}
                                                domain={['auto', 'auto']}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="weight"
                                                stroke="#3b82f6"
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill="url(#colorWeight)"
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center">
                                            <Weight className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-xs font-black italic">No hay datos de peso suficientes</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Body Fat Chart */}
                        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50">
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 italic flex items-center gap-3">
                                        <Activity className="w-6 h-6 text-emerald-500" />
                                        Grasa Corporal
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Porcentaje (%)</p>
                                </div>
                            </div>

                            <div className="h-[300px] w-full">
                                {consultations.some(c => c.metrics?.some(m => m.key === 'body_fat')) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={prepareChartData()}>
                                            <defs>
                                                <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }}
                                                domain={['auto', 'auto']}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="body_fat"
                                                stroke="#10b981"
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill="url(#colorFat)"
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center">
                                            <Activity className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-xs font-black italic">No hay datos de grasa registrados</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                label: 'Último Peso',
                                value: patient.weight ? `${patient.weight} kg` : 'N/A',
                                icon: Weight,
                                color: 'text-blue-600',
                                bg: 'bg-blue-50'
                            },
                            {
                                label: 'Meta Objetivo',
                                value: patient.nutritionalFocus || 'Sin definir',
                                icon: Target,
                                color: 'text-emerald-600',
                                bg: 'bg-emerald-50'
                            },
                            {
                                label: 'Sesiones Totales',
                                value: consultations.length.toString(),
                                icon: CalendarDays,
                                color: 'text-slate-900',
                                bg: 'bg-slate-50'
                            },
                        ].map((card, i) => (
                            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center gap-6 group hover:scale-[1.02] transition-all">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg", card.bg)}>
                                    <card.icon className={cn("w-7 h-7", card.color)} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{card.label}</p>
                                    <p className="text-xl font-black text-slate-900 italic tracking-tight">{card.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
