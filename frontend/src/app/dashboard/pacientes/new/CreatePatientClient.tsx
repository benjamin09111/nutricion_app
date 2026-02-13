'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Clock, Brain, Save, RotateCcw, CheckCircle2, Trash2, TrendingUp, Plus, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TagInput } from '@/components/ui/TagInput';
import { Patient } from '@/features/patients';
import { Metric } from '@/features/consultations';
import { usePatientDraft } from '@/features/patients/hooks/usePatientDraft';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { PatientStorage } from '@/features/patients/services/patientStorage';
import { cn } from '@/lib/utils';

export default function CreatePatientClient() {
    const router = useRouter();
    const { draft, updateDraft, clearDraft, isLoaded } = usePatientDraft();
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Prevent hydration mismatch by rendering nothing until loaded
    if (!isLoaded) return null;

    const handleSaveClick = () => {
        if (!draft.name || !draft.email) {
            toast.error("Por favor completa los campos obligatorios (Nombre y Email).");
            return;
        }
        setShowSaveConfirm(true);
    };

    const addMetric = () => {
        const currentMetrics = draft.initialConsultationMetrics || [];
        updateDraft({
            initialConsultationMetrics: [...currentMetrics, { label: '', value: '', unit: '' }]
        });
    };

    const removeMetric = (index: number) => {
        const newMetrics = [...(draft.initialConsultationMetrics || [])];
        newMetrics.splice(index, 1);
        updateDraft({ initialConsultationMetrics: newMetrics });
    };

    const updateMetricItem = (index: number, field: keyof Metric, value: string) => {
        const newMetrics = [...(draft.initialConsultationMetrics || [])];
        newMetrics[index] = { ...newMetrics[index], [field]: value };
        updateDraft({ initialConsultationMetrics: newMetrics });
    };

    const handleConfirmSave = async () => {
        setIsSaving(true);
        setShowSaveConfirm(false);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create or Update Patient Logic
        const patientData = {
            ...draft,
            // Ensure mandatory fields for TS even if they are in draft
            name: draft.name!,
            email: draft.email!,
            // Generate ID if not present
            id: draft.id || Math.random().toString(36).substr(2, 9),
            status: 'Active' as const,
            lastVisit: new Date().toISOString().split('T')[0]
        };

        // Save to "DB"
        // @ts-ignore - draft types are partial but we validated essentials
        PatientStorage.save(patientData);

        // Update draft with the generated ID so subsequent saves are updates
        updateDraft({ id: patientData.id });

        toast.success(draft.id ? "Datos del paciente actualizados." : "Paciente registrado correctamente.");
        setIsSaving(false);
        // We do NOT redirect. We stay here.
    };

    const handleSaveConsultation = async () => {
        // This action finishes the process
        if (!draft.id) {
            toast.error("Primero debes registrar al paciente antes de guardar la consulta.");
            return;
        }
        if (!draft.initialConsultationTitle) {
            toast.error("Debes ingresar un título para la consulta.");
            return;
        }

        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 800));

        // Save the consultation to history
        const { ConsultationStorage } = await import('@/features/consultations/services/consultationStorage');

        ConsultationStorage.save({
            id: Math.random().toString(36).substr(2, 9),
            patientId: draft.id,
            patientName: draft.name || 'Sin nombre',
            date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
            title: draft.initialConsultationTitle,
            description: draft.initialConsultationDescription || '',
            metrics: draft.initialConsultationMetrics && draft.initialConsultationMetrics.length > 0
                ? draft.initialConsultationMetrics
                : [
                    { label: 'Peso', value: draft.weight || 0, unit: 'kg' },
                    { label: 'Altura', value: draft.height || 0, unit: 'm' }
                ]
        });

        toast.success("Consulta inicial guardada y añadida al historial.");
        clearDraft(); // Now we clear
        router.push(`/dashboard/pacientes/${draft.id}`);
    };

    return (


        <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
            {/* Header / Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                            Nuevo Paciente
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                Borrador
                            </span>
                        </h1>
                        <p className="text-sm font-medium text-slate-500">
                            La información se guarda automáticamente mientras escribes.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setShowResetConfirm(true)}
                        className="h-11 px-4 text-slate-400 hover:text-red-500 hover:bg-red-50 font-bold rounded-xl transition-all gap-2"
                    >
                        <RotateCcw className="h-4 w-4" />
                        <span className="hidden sm:inline">Comenzar otra vez</span>
                    </Button>

                    <Button
                        onClick={handleSaveClick}
                        disabled={isSaving}
                        className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                    >
                        {isSaving ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="h-5 w-5" />
                        )}
                        {draft.id ? "ACTUALIZAR FICHA" : "REGISTRAR PACIENTE"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Column */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Panel 1: Personal Information */}
                    <div className="bg-white p-8 rounded-4xl shadow-sm border border-slate-200 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Información Personal</h3>
                                <p className="text-xs font-medium text-slate-400">Datos básicos de identificación.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Nombre Completo *</label>
                                <Input
                                    placeholder="Ej. Juan Pérez"
                                    className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-medium"
                                    value={draft.name}
                                    onChange={(e) => updateDraft({ name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Email *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                    <Input
                                        type="email"
                                        placeholder="juan@email.com"
                                        className="h-12 pl-10 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-medium"
                                        value={draft.email}
                                        onChange={(e) => updateDraft({ email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Teléfono</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                    <Input
                                        placeholder="+56 9..."
                                        className="h-12 pl-10 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-medium"
                                        value={draft.contactInfo}
                                        onChange={(e) => updateDraft({ contactInfo: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Género</label>
                                <select
                                    className="w-full h-12 bg-slate-50 border border-transparent rounded-xl px-4 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none cursor-pointer"
                                    value={draft.gender}
                                    onChange={(e) => updateDraft({ gender: e.target.value as any })}
                                >
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                    <option value="Other">Otro</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Fecha Nacimiento</label>
                                <Input
                                    type="date"
                                    className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-medium text-slate-600"
                                    value={draft.birthDate || ''}
                                    onChange={(e) => updateDraft({ birthDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Panel 2: Physical Metrics */}

                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Panel 3: Chronobiology */}
                    <div className="bg-white p-6 rounded-4xl shadow-sm border border-slate-200 space-y-6">
                        <div className="flex items-center gap-3 text-slate-900 mb-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            <h3 className="text-base font-black uppercase tracking-tight">Rutina Diaria</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Despertar</label>
                                    <Input
                                        type="time"
                                        className="h-10 rounded-xl bg-orange-50/50 border-orange-100 text-center font-bold text-slate-700"
                                        value={draft.wakeUpTime}
                                        onChange={(e) => updateDraft({ wakeUpTime: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dormir</label>
                                    <Input
                                        type="time"
                                        className="h-10 rounded-xl bg-indigo-50/50 border-indigo-100 text-center font-bold text-slate-700"
                                        value={draft.sleepTime}
                                        onChange={(e) => updateDraft({ sleepTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <label className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">Comidas por día</span>
                                    <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg">{draft.mealCount}</span>
                                </label>
                                <input
                                    type="range"
                                    min="2"
                                    max="6"
                                    step="1"
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                    value={draft.mealCount}
                                    onChange={(e) => updateDraft({ mealCount: parseInt(e.target.value) })}
                                />
                                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                    <span>Min (2)</span>
                                    <span>Max (6)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Panel 2 (Moved): Metrics */}
                    <div className="bg-white p-6 rounded-4xl shadow-sm border border-slate-200 space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <Brain className="h-5 w-5 text-violet-500" />
                            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Métricas</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Peso (kg)</label>
                                <Input
                                    type="number"
                                    className="h-10 rounded-xl bg-violet-50/50 border-violet-100 font-bold text-slate-700"
                                    value={draft.weight}
                                    onChange={(e) => updateDraft({ weight: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Altura (m)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="h-10 rounded-xl bg-violet-50/50 border-violet-100 font-bold text-slate-700"
                                    value={draft.height}
                                    onChange={(e) => updateDraft({ height: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-3 col-span-2 pt-2 border-t border-slate-50">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                        <AlertCircle className="h-3 w-3" />
                                        Restricciones Clínicas
                                    </label>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Impacta filtrado de alimentos</span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {['Celiaco', 'Diabético', 'Sin Lactosa', 'Hipertensión', 'Vegano', 'Vegetariano'].map(restriction => {
                                        const isSelected = draft.dietaryRestrictions?.includes(restriction);
                                        return (
                                            <button
                                                key={restriction}
                                                type="button"
                                                onClick={() => {
                                                    const current = draft.dietaryRestrictions || [];
                                                    const next = isSelected
                                                        ? current.filter(r => r !== restriction)
                                                        : [...current, restriction];
                                                    updateDraft({ dietaryRestrictions: next });
                                                }}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border-2 cursor-pointer",
                                                    isSelected
                                                        ? "bg-rose-50 border-rose-500 text-rose-700 shadow-sm"
                                                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                                )}
                                            >
                                                {restriction}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-1.5 col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Otras Restricciones / Alergias</label>
                                <div className="bg-slate-50 rounded-xl border border-slate-100 focus-within:border-emerald-500 p-1 transition-all">
                                    <TagInput
                                        value={draft.dietaryRestrictions || []}
                                        onChange={(tags) => updateDraft({ dietaryRestrictions: tags })}
                                        placeholder="Escribe y presiona Enter..."
                                        suggestions={['Sin Gluten', 'Sin Azúcar', 'Renal', 'Embarazo']}
                                        className="border-none shadow-none text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>



                </div>
            </div>

            {/* Bottom Section: First Consultation (Full Width) */}
            <div className="bg-emerald-900 text-white p-8 rounded-4xl shadow-xl shadow-emerald-900/20 relative overflow-hidden group mt-8">
                <div className="absolute top-0 right-0 p-64 bg-emerald-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-800/50 rounded-2xl border border-emerald-700/50">
                                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-black uppercase tracking-tight">Primera Consulta</h3>
                                    <span className="text-[9px] font-black bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-md uppercase border border-emerald-700">Opcional</span>
                                </div>
                                <p className="text-emerald-300/80 text-sm font-medium mt-1">
                                    Optimiza tu flujo registrando la primera sesión ahora mismo.
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-emerald-400/60 leading-relaxed">
                            Si agregas notas aquí, se creará automáticamente una consulta en el historial del paciente con la fecha de hoy.
                        </p>
                    </div>

                    <div className="lg:col-span-8 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Motivo o Título</label>
                            <Input
                                placeholder="Ej. Evaluación inicial post-parto"
                                className="h-12 rounded-2xl bg-emerald-800/50 border-emerald-700/50 text-white placeholder:text-emerald-400/50 text-base font-medium focus:bg-emerald-800 transition-all border-none focus:ring-1 focus:ring-emerald-400"
                                value={draft.initialConsultationTitle}
                                onChange={(e) => updateDraft({ initialConsultationTitle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Notas de la sesión</label>
                            <textarea
                                placeholder="Describe los hallazgos, objetivos acordados o notas rápidas de esta primera interacción..."
                                className="w-full min-h-[120px] p-4 rounded-3xl bg-emerald-800/50 border border-emerald-700/50 text-sm text-emerald-100 focus:text-white outline-none resize-none placeholder:text-emerald-400/50 focus:bg-emerald-800 transition-all focus:ring-1 focus:ring-emerald-400 shadow-inner"
                                value={draft.initialConsultationDescription}
                                onChange={(e) => updateDraft({ initialConsultationDescription: e.target.value })}
                            />
                        </div>

                        {/* Tracking Metrics Section */}
                        <div className="space-y-4 p-6 bg-emerald-800/30 rounded-[32px] border border-emerald-700/50">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    <h4 className="text-sm font-black text-emerald-100 uppercase tracking-tight">Seguimiento de Progreso</h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={addMetric}
                                    className="text-[10px] font-black bg-emerald-600 text-white px-3 py-1.5 rounded-xl hover:bg-emerald-500 transition-all flex items-center gap-1 shadow-md shadow-emerald-900/20 cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" /> AGREGAR MÉTRICA
                                </button>
                            </div>

                            {draft.initialConsultationMetrics && draft.initialConsultationMetrics.length > 0 ? (
                                <div className="space-y-3">
                                    {draft.initialConsultationMetrics.map((metric, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-3 items-end animate-in slide-in-from-left-2 duration-200">
                                            <div className="col-span-12 md:col-span-5 space-y-1">
                                                <label className="text-[9px] font-black text-emerald-400/70 uppercase ml-1">Característica</label>
                                                <Input
                                                    placeholder="Vitamina C, Peso..."
                                                    className="h-10 rounded-xl bg-emerald-900/50 border-emerald-700/50 text-emerald-50 text-xs font-bold placeholder:text-emerald-700 focus:bg-emerald-900 focus:border-emerald-500"
                                                    value={metric.label}
                                                    onChange={(e) => updateMetricItem(idx, 'label', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-7 md:col-span-4 space-y-1">
                                                <label className="text-[9px] font-black text-emerald-400/70 uppercase ml-1">Valor</label>
                                                <Input
                                                    placeholder="20, 75.5..."
                                                    className="h-10 rounded-xl bg-emerald-900/50 border-emerald-700/50 text-emerald-50 text-xs font-bold placeholder:text-emerald-700 focus:bg-emerald-900 focus:border-emerald-500"
                                                    value={metric.value}
                                                    onChange={(e) => updateMetricItem(idx, 'value', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-3 md:col-span-2 space-y-1">
                                                <label className="text-[9px] font-black text-emerald-400/70 uppercase ml-1">Unidad</label>
                                                <Input
                                                    placeholder="mg, kg..."
                                                    className="h-10 rounded-xl bg-emerald-900/50 border-emerald-700/50 text-emerald-50 text-xs font-bold placeholder:text-emerald-700 focus:bg-emerald-900 focus:border-emerald-500"
                                                    value={metric.unit || ''}
                                                    onChange={(e) => updateMetricItem(idx, 'unit', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-2 md:col-span-1 pb-1">
                                                <button
                                                    type="button"
                                                    onClick={() => removeMetric(idx)}
                                                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-900/30 rounded-xl transition-all cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center bg-emerald-800/20 rounded-2xl border border-dashed border-emerald-700/50">
                                    <AlertCircle className="w-6 h-6 text-emerald-700/50 mx-auto mb-2" />
                                    <p className="text-[10px] font-medium text-emerald-400/50">
                                        Si no añades métricas, se usarán Peso y Altura por defecto.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={handleSaveConsultation}
                                disabled={!draft.id || isSaving}
                                className={cn(
                                    "h-11 px-6 rounded-xl font-black text-sm transition-all flex items-center gap-2 border",
                                    draft.id
                                        ? "bg-white text-emerald-800 hover:bg-emerald-50 border-white shadow-lg"
                                        : "bg-emerald-800 text-emerald-500 border-emerald-700 cursor-not-allowed opacity-50"
                                )}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {draft.id ? "FINALIZAR & GUARDAR CONSULTA" : "Registra al paciente primero"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onConfirm={handleConfirmSave}
                title={draft.id ? "¿Actualizar Datos?" : "¿Registrar Paciente?"}
                description={draft.id
                    ? `Se actualizará la información del paciente ${draft.name}.`
                    : `Estás a punto de crear el expediente de ${draft.name}. El borrador seguirá activo para que puedas añadir la consulta.`
                }
                confirmText={draft.id ? "Sí, Actualizar" : "Sí, Registrar"}
                variant="primary"
            />

            <ConfirmationModal
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={() => {
                    clearDraft();
                    toast.info("Formulario reiniciado.");
                    setShowResetConfirm(false);
                }}
                title="¿Comenzar de nuevo?"
                description="Se perderá todo el progreso actual y el borrador será eliminado. Esta acción no se puede deshacer."
                confirmText="Sí, Reiniciar"
                cancelText="Mmm, mejor no"
                variant="destructive"
            />
        </div>
    );
}
