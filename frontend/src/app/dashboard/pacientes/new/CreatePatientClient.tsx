'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Save, RotateCcw, AlertCircle, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TagInput } from '@/components/ui/TagInput';
import { Patient } from '@/features/patients';
import { usePatientDraft } from '@/features/patients/hooks/usePatientDraft';
import { toast } from 'sonner';
import { useState } from 'react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { cn } from '@/lib/utils';
import Cookies from 'js-cookie';

export default function CreatePatientClient() {
    const router = useRouter();
    const { draft, updateDraft, clearDraft, isLoaded } = usePatientDraft();
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    if (!isLoaded) return null;

    const handleSaveClick = () => {
        if (!draft.fullName || !draft.email) {
            toast.error("Por favor completa los campos obligatorios (Nombre y Email).");
            return;
        }
        setShowSaveConfirm(true);
    };

    const handleConfirmSave = async () => {
        setIsSaving(true);
        setShowSaveConfirm(false);

        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

            const method = draft.id ? 'PATCH' : 'POST';
            const url = draft.id ? `${apiUrl}/patients/${draft.id}` : `${apiUrl}/patients`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(draft)
            });

            if (response.ok) {
                const savedPatient = await response.json();
                toast.success(draft.id ? "Expediente actualizado." : "Paciente registrado con éxito.");
                clearDraft();
                router.push(`/dashboard/pacientes/${savedPatient.id}`);
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Error al guardar el paciente");
            }
        } catch (error) {
            console.error("Save Patient Error:", error);
            toast.error("Error de conexión con el servidor");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-24 animate-in fade-in duration-700">
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="group flex items-center gap-2 hover:bg-slate-100 rounded-2xl px-4 py-6 transition-all"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                    <span className="text-sm font-black text-slate-400 group-hover:text-slate-900 uppercase tracking-widest transition-colors">Volver</span>
                </Button>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setShowResetConfirm(true)}
                        className="h-12 px-6 text-slate-400 hover:text-rose-500 hover:bg-rose-50 font-black rounded-2xl transition-all gap-2 uppercase text-[10px] tracking-widest"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reiniciar
                    </Button>

                    <Button
                        onClick={handleSaveClick}
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 px-10 rounded-2xl shadow-2xl shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3 group"
                    >
                        {isSaving ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="h-5 w-5" />
                        )}
                        <span className="uppercase tracking-tighter text-lg">
                            {draft.id ? "Actualizar Ficha" : "Registrar Paciente"}
                        </span>
                    </Button>
                </div>
            </div>

            {/* Main Branding */}
            <div className="bg-slate-900 rounded-[3rem] p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-[80px] translate-y-1/2 -translate-x-1/2 rounded-full" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                    <div className="h-24 w-24 rounded-3xl bg-linear-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                        <User className="h-12 w-12 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 italic">
                            Nueva Identidad Clínica
                        </h1>
                        <p className="text-emerald-100/60 font-medium text-lg max-w-lg leading-tight uppercase tracking-widest text-[10px]">
                            Crea un perfil detallado para un seguimiento nutricional de alto impacto.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Panel 1: Personal Identification */}
                <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-1 rounded-full bg-emerald-500" />
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Perfil de Identidad</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nombre Completo del Paciente *</label>
                            <Input
                                placeholder="Ej. Valentina Morales Lagos"
                                className="h-14 rounded-2xl bg-slate-50 border-none text-lg font-bold placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                value={draft.fullName}
                                onChange={(e) => updateDraft({ fullName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Correo Electrónico *</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    type="email"
                                    placeholder="valen@email.com"
                                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                    value={draft.email}
                                    onChange={(e) => updateDraft({ email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Teléfono de Contacto</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    placeholder="+56 9 1234 5678"
                                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-none font-bold placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                    value={draft.phone}
                                    onChange={(e) => updateDraft({ phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Documento de Identidad (Id)</label>
                            <Input
                                placeholder="12.345.678-9"
                                className="h-14 rounded-2xl bg-slate-50 border-none font-bold placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                value={draft.documentId}
                                onChange={(e) => updateDraft({ documentId: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Fecha de Nacimiento</label>
                            <Input
                                type="date"
                                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                value={draft.birthDate || ''}
                                onChange={(e) => updateDraft({ birthDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Sexo biológico</label>
                            <div className="grid grid-cols-3 gap-4">
                                {['Masculino', 'Femenino', 'Otro'].map(g => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => updateDraft({ gender: g })}
                                        className={cn(
                                            "h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2",
                                            draft.gender === g
                                                ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-100"
                                                : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                                        )}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 md:col-span-2 pt-8 border-t border-slate-50">
                            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] ml-2">Propuesta de Foco Nutricional</label>
                            <Input
                                placeholder="Ej. Pérdida de grasa / Recomposición corporal"
                                className="h-14 rounded-2xl bg-emerald-50/30 border-none font-bold placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                value={draft.nutritionalFocus || ''}
                                onChange={(e) => updateDraft({ nutritionalFocus: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] ml-2">Metas Fitness / Deporte</label>
                            <Input
                                placeholder="Ej. Media maratón en 3 meses"
                                className="h-14 rounded-2xl bg-rose-50/30 border-none font-bold placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-rose-500/20 transition-all"
                                value={draft.fitnessGoals || ''}
                                onChange={(e) => updateDraft({ fitnessGoals: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Left Column: Anthropometry & Clinical */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Panel 2: Physical Parameters */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-1 rounded-full bg-blue-500" />
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Antropometría</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Peso Actual (kg)</label>
                                <Input
                                    type="number"
                                    className="h-14 rounded-2xl bg-blue-50/50 border-none text-xl font-black text-blue-700 placeholder:text-blue-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-center"
                                    value={draft.weight}
                                    onChange={(e) => updateDraft({ weight: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Altura (cm)</label>
                                <Input
                                    type="number"
                                    className="h-14 rounded-2xl bg-blue-50/50 border-none text-xl font-black text-blue-700 placeholder:text-blue-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all text-center"
                                    value={draft.height}
                                    onChange={(e) => updateDraft({ height: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Panel 3: Restrictions */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-1 rounded-full bg-rose-500" />
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Restricciones</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                    <AlertCircle className="h-3 w-3" />
                                    Patologías / Exclusiones
                                </label>
                                <div className="bg-rose-50/50 rounded-2xl p-2 border border-rose-100">
                                    <TagInput
                                        value={draft.dietRestrictions || []}
                                        onChange={(tags) => updateDraft({ dietRestrictions: tags })}
                                        placeholder="Diabetes, Celiaco..."
                                        className="border-none shadow-none bg-transparent font-bold text-rose-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Panel 4: Clinical Notes */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-1 rounded-full bg-slate-900" />
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Observaciones</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Notas Clínicas Iniciales</label>
                                <textarea
                                    className="w-full h-32 rounded-2xl bg-slate-50 border-none p-6 font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-slate-500/10 transition-all resize-none"
                                    placeholder="Antecedentes, motivo de consulta, etc..."
                                    value={draft.clinicalSummary || ''}
                                    onChange={(e) => updateDraft({ clinicalSummary: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onConfirm={handleConfirmSave}
                title={draft.id ? "¿Actualizar Expediente?" : "¿Crear Ficha Clínica?"}
                description={draft.id
                    ? `Los cambios en el expediente de ${draft.fullName} se guardarán permanentemente.`
                    : `Estás a punto de registrar a ${draft.fullName}. Esto habilitará la creación de planes nutricionales para este paciente.`
                }
                confirmText={draft.id ? "Sí, Actualizar" : "Crear Expediente"}
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
                title="¿Deseas vaciar el formulario?"
                description="Toda la información ingresada en este borrador se eliminará permanentemente."
                confirmText="Vaciar Borrador"
                cancelText="Mantener info"
                variant="destructive"
            />
        </div>
    );
}
