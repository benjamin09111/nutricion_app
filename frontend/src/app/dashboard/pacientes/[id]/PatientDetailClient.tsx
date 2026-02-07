'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    User, Mail, Phone, Calendar, Ruler, Weight,
    ArrowLeft, TrendingUp, History, ClipboardList,
    Plus, Activity, Target, Zap, Dumbbell, Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Patient } from '@/features/patients';
import { MOCK_PATIENTS } from '@/features/patients/mocks';
import { Consultation } from '@/features/consultations';
import { ConsultationStorage } from '@/features/consultations/services/consultationStorage';
import { PatientStorage } from '@/features/patients/services/patientStorage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';
import { Edit2, Save, X as CloseIcon } from 'lucide-react';

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
    const [activeTab, setActiveTab] = useState<TabType>('General');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Patient>>({});

    const handleEdit = () => {
        if (!patient) return;
        setEditForm(patient);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!patient || !editForm) return;

        const updatedPatient = { ...patient, ...editForm };
        PatientStorage.save(updatedPatient as Patient);
        setPatient(updatedPatient as Patient);
        setIsEditing(false);
        toast.success("Perfil actualizado correctamente");
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditForm({});
    };

    const updateField = (field: keyof Patient, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        if (!id) return;

        // Ensure storage is initialized with mocks if empty
        const currentPatients = PatientStorage.getAll();
        if (currentPatients.length === 0) {
            PatientStorage.initialize(MOCK_PATIENTS);
        }

        let p = PatientStorage.getById(id);

        // Special case: if id is '1', '2' or '3' and still not found, forced storage reset 
        // to handle cases where localStorage might be corrupted or empty
        if (!p && ['1', '2', '3'].includes(id)) {
            localStorage.removeItem('nutrisaas_patients_db');
            PatientStorage.initialize(MOCK_PATIENTS);
            p = PatientStorage.getById(id);
        }

        if (p) {
            setPatient(p);
            // Also initialize consultations if empty
            const { MOCK_CONSULTATIONS } = require('@/features/consultations/mocks');
            ConsultationStorage.initialize(MOCK_CONSULTATIONS);

            const c = ConsultationStorage.getByPatientId(id);
            setConsultations(c);
        } else {
            // Patient really doesn't exist even in mocks
            toast.error("Paciente no encontrado");
            router.push('/dashboard/pacientes');
        }
    }, [id, router]);

    const metricsHistory = useMemo(() => {
        const history: Record<string, { date: string, value: number, unit?: string }[]> = {};

        // Sort consultations by date ascending for the chart/logic
        const sortedConsultations = [...consultations].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        sortedConsultations.forEach(c => {
            c.metrics?.forEach(m => {
                if (!history[m.label]) history[m.label] = [];
                const val = typeof m.value === 'string' ? parseFloat(m.value) : m.value;
                if (!isNaN(val)) {
                    history[m.label].push({
                        date: c.date,
                        value: val,
                        unit: m.unit
                    });
                }
            });
        });

        return history;
    }, [consultations]);

    if (!patient) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Back Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-all text-slate-500 cursor-pointer border border-slate-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 leading-none">{patient.name}</h1>
                        <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Expediente del Paciente</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <>
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                className="rounded-2xl border-slate-200 text-slate-600 font-bold"
                            >
                                <CloseIcon className="w-5 h-5 mr-2" />
                                CANCELAR
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-200/50"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                GUARDAR CAMBIOS
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={handleEdit}
                                variant="outline"
                                className="rounded-2xl border-slate-200 text-slate-600 font-bold"
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                EDITAR PERFIL
                            </Button>
                            <Button
                                onClick={() => router.push('/dashboard/consultas?patientId=' + patient.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-200/50"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                NUEVA CONSULTA
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Edad', value: isEditing ? (
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    value={editForm.age || ''}
                                    onChange={(e) => updateField('age', parseInt(e.target.value))}
                                    className="w-16 h-8 text-xs font-black p-1"
                                />
                                <span className="text-[10px] font-bold text-slate-400">años</span>
                            </div>
                        ) : `${patient.age || 'N/A'} años`, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50'
                    },
                    {
                        label: 'Peso', value: isEditing ? (
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    value={editForm.weight || ''}
                                    onChange={(e) => updateField('weight', parseFloat(e.target.value))}
                                    className="w-16 h-8 text-xs font-black p-1"
                                />
                                <span className="text-[10px] font-bold text-slate-400">kg</span>
                            </div>
                        ) : `${patient.weight || 'N/A'} kg`, icon: Weight, color: 'text-emerald-600', bg: 'bg-emerald-50'
                    },
                    {
                        label: 'Altura', value: isEditing ? (
                            <div className="flex items-center gap-1">
                                <Input
                                    type="number"
                                    value={editForm.height || ''}
                                    onChange={(e) => updateField('height', parseInt(e.target.value))}
                                    className="w-16 h-8 text-xs font-black p-1"
                                />
                                <span className="text-[10px] font-bold text-slate-400">cm</span>
                            </div>
                        ) : `${patient.height || 'N/A'} cm`, icon: Ruler, color: 'text-amber-600', bg: 'bg-amber-50'
                    },
                    { label: 'IMC', value: (isEditing ? (editForm.weight && editForm.height ? (editForm.weight / Math.pow(editForm.height / 100, 2)).toFixed(1) : 'N/A') : (patient.weight && patient.height ? (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1) : 'N/A')), icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                        <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", stat.bg)}>
                            <stat.icon className={cn("w-6 h-6", stat.color)} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <div className="text-lg font-black text-slate-900">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs Selector */}
            <div className="flex p-1 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/50">
                {(['General', 'Progreso'] as TabType[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-8 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer",
                            activeTab === tab
                                ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/50"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        )}
                    >
                        {tab === 'General' ? 'Información General' : 'Progreso y Sesiones'}
                    </button>
                ))}
                <button
                    disabled
                    className="px-8 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 cursor-not-allowed text-slate-400 flex items-center gap-2"
                >
                    Exámenes
                    <Lock className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {activeTab === 'General' ? (
                    <>
                        {/* Column 1: Personal Info */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-full">
                                <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                        <ClipboardList className="w-6 h-6 text-emerald-600" />
                                        Datos Biométricos y Estilo de Vida
                                    </h3>
                                </div>
                                <div className="p-8 grid md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Contacto</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-slate-600 font-medium">
                                                    <Mail className="w-4 h-4 text-emerald-500" />
                                                    {isEditing ? (
                                                        <Input
                                                            value={editForm.email || ''}
                                                            onChange={(e) => updateField('email', e.target.value)}
                                                            className="h-8 text-sm p-1"
                                                        />
                                                    ) : patient.email}
                                                </div>
                                                <div className="flex items-center gap-3 text-slate-600 font-medium">
                                                    <Phone className="w-4 h-4 text-emerald-500" />
                                                    {isEditing ? (
                                                        <Input
                                                            value={editForm.contactInfo || ''}
                                                            onChange={(e) => updateField('contactInfo', e.target.value)}
                                                            className="h-8 text-sm p-1"
                                                        />
                                                    ) : patient.contactInfo}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Cronobiología</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 font-bold">Hora despertar:</span>
                                                    {isEditing ? (
                                                        <Input
                                                            type="time"
                                                            value={editForm.wakeUpTime || ''}
                                                            onChange={(e) => updateField('wakeUpTime', e.target.value)}
                                                            className="h-8 w-32 text-sm p-1"
                                                        />
                                                    ) : (
                                                        <span className="text-slate-900 font-black">{patient.wakeUpTime || 'No definido'}</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 font-bold">Hora dormir:</span>
                                                    {isEditing ? (
                                                        <Input
                                                            type="time"
                                                            value={editForm.sleepTime || ''}
                                                            onChange={(e) => updateField('sleepTime', e.target.value)}
                                                            className="h-8 w-32 text-sm p-1"
                                                        />
                                                    ) : (
                                                        <span className="text-slate-900 font-black">{patient.sleepTime || 'No definido'}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Objetivos Nutricionales</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase">Calorías Meta</p>
                                                    {isEditing ? (
                                                        <Input
                                                            type="number"
                                                            value={editForm.targetCalories || ''}
                                                            onChange={(e) => updateField('targetCalories', parseInt(e.target.value))}
                                                            className="h-8 text-sm p-1 mt-1"
                                                        />
                                                    ) : (
                                                        <p className="text-lg font-black text-emerald-600">{patient.targetCalories || '0'} kcal</p>
                                                    )}
                                                </div>
                                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase">Proteína Meta</p>
                                                    {isEditing ? (
                                                        <Input
                                                            type="number"
                                                            value={editForm.targetProtein || ''}
                                                            onChange={(e) => updateField('targetProtein', parseInt(e.target.value))}
                                                            className="h-8 text-sm p-1 mt-1"
                                                        />
                                                    ) : (
                                                        <p className="text-lg font-black text-emerald-600">{patient.targetProtein || '0'} g</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Preferencias</h4>
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold text-slate-400">GUSTOS:</p>
                                                {isEditing ? (
                                                    <TagInput
                                                        value={editForm.tastes || []}
                                                        onChange={(tags) => updateField('tastes', tags)}
                                                        placeholder="Agregar gusto..."
                                                    />
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {patient.tastes?.length ? patient.tastes.map(t => (
                                                            <span key={t} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">{t}</span>
                                                        )) : <span className="text-xs text-slate-400 italic">No especificado</span>}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold text-slate-400">DISGUSTOS / ALERGIAS:</p>
                                                {isEditing ? (
                                                    <TagInput
                                                        value={editForm.dislikes || []}
                                                        onChange={(tags) => updateField('dislikes', tags)}
                                                        placeholder="Agregar disgusto..."
                                                    />
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {patient.dislikes?.length ? patient.dislikes.map(t => (
                                                            <span key={t} className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg">{t}</span>
                                                        )) : <span className="text-xs text-slate-400 italic">No especificado</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Quick Links / Notes */}
                        <div className="space-y-6">
                            <div className="bg-emerald-900 rounded-[32px] p-8 text-white shadow-xl shadow-emerald-200">
                                <h4 className="flex items-center gap-2 font-black text-emerald-200 uppercase text-[10px] tracking-[0.2em] mb-4">
                                    <Target className="w-4 h-4" />
                                    Estado Nutricional
                                </h4>
                                <p className="text-xl font-black mb-6">El paciente se encuentra en fase de mantenimiento.</p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl border border-white/10">
                                        <Zap className="w-5 h-5 text-amber-400" />
                                        <p className="text-sm font-bold">Próximo control sugerido en 15 días.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Fitness Goals Section */}
                            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                                        <Dumbbell className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Objetivos de Fitness</h4>
                                </div>

                                <div className="space-y-3">
                                    {isEditing ? (
                                        <TagInput
                                            value={editForm.fitnessGoals || []}
                                            onChange={(tags) => updateField('fitnessGoals', tags)}
                                            placeholder="Agregar meta fitness..."
                                        />
                                    ) : (
                                        <>
                                            {patient.fitnessGoals && patient.fitnessGoals.length > 0 ? (
                                                patient.fitnessGoals.map((goal, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <div className="mt-1 h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                                                        <p className="text-sm font-bold text-slate-700">{goal}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-6 space-y-2">
                                                    <p className="text-xs font-medium text-slate-400 italic">No hay objetivos de fitness definidos aún.</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-xl text-[10px] font-black uppercase text-rose-600 border-rose-100 hover:bg-rose-50"
                                                        onClick={() => router.push('/dashboard/fitness')}
                                                    >
                                                        Configurar metas
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Tab Progreso: Sessions List */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Visual Progress Charts (Conceptual) */}
                            {Object.keys(metricsHistory).length > 0 && (
                                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                                        Tendencias de Progreso
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {Object.entries(metricsHistory).map(([label, data]) => (
                                            <div key={label} className="p-6 bg-slate-50/50 rounded-[28px] border border-slate-100/50">
                                                <div className="flex justify-between items-start mb-4">
                                                    <p className="font-black text-slate-900 uppercase text-xs tracking-widest">{label}</p>
                                                    {data.length > 1 && (
                                                        <span className={cn(
                                                            "text-[10px] font-black px-2 py-0.5 rounded-full",
                                                            data[data.length - 1].value > data[0].value ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                        )}>
                                                            {data[data.length - 1].value > data[0].value ? '↑ Mejora' : '↓ Descenso'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-3xl font-black text-slate-900">{data[data.length - 1].value}</span>
                                                    <span className="text-sm font-bold text-slate-400 mb-1">{data[data.length - 1].unit}</span>
                                                </div>
                                                <div className="mt-4 flex gap-1.5 h-16 items-end">
                                                    {data.map((d, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex-1 bg-emerald-400/20 rounded-t-lg transition-all hover:bg-emerald-500 group relative"
                                                            style={{ height: `${(d.value / Math.max(...data.map(x => x.value))) * 100}%` }}
                                                        >
                                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded w-max z-10 pointer-events-none">
                                                                {new Date(d.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}: {d.value} {d.unit}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Session Timeline */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-slate-900 px-2 flex items-center gap-3">
                                    <History className="w-6 h-6 text-emerald-600" />
                                    Historial de Consultas
                                </h3>
                                {consultations.length > 0 ? (
                                    <div className="space-y-4">
                                        {consultations.map((session, idx) => (
                                            <div
                                                key={session.id}
                                                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-all group relative overflow-hidden"
                                            >
                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">SESIÓN #{consultations.length - idx}</span>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                {new Date(session.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-lg font-bold text-slate-900">{session.title}</h4>
                                                    </div>
                                                    <Button variant="outline" size="sm" className="rounded-xl font-bold border-slate-200">Ver Notas</Button>
                                                </div>
                                                <p className="mt-4 text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium">
                                                    {session.description}
                                                </p>
                                                {session.metrics && session.metrics.length > 0 && (
                                                    <div className="mt-6 flex flex-wrap gap-3">
                                                        {session.metrics.map((m, i) => (
                                                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                                                                <span className="font-bold text-slate-400">{m.label}:</span>
                                                                <span className="font-black text-slate-800">{m.value} {m.unit}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-[32px] p-12 text-center border-2 border-dashed border-slate-200">
                                        <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <p className="text-lg font-bold text-slate-600">No hay sesiones registradas</p>
                                        <p className="text-sm text-slate-400">Registra una nueva consulta para empezar a ver el progreso.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Summary Column */}
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Resumen de Métricas</h4>
                                <div className="space-y-4">
                                    {Object.entries(metricsHistory).map(([label, data]) => {
                                        const last = data[data.length - 1];
                                        const first = data[0];
                                        const diff = last.value - first.value;
                                        return (
                                            <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                                <span className="text-sm font-bold text-slate-700">{label}</span>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-slate-900">{last.value} {last.unit}</p>
                                                    {data.length > 1 && (
                                                        <p className={cn(
                                                            "text-[10px] font-bold",
                                                            diff >= 0 ? "text-emerald-500" : "text-rose-500"
                                                        )}>
                                                            {diff >= 0 ? '+' : ''}{diff} desde el inicio
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {Object.keys(metricsHistory).length === 0 && (
                                        <p className="text-xs text-slate-400 italic">No hay métricas de seguimiento registradas aún.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
