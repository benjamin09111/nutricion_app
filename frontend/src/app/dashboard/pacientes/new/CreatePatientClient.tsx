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

            // Clean payload to match precisely backend CreatePatientDto
            const payload: any = {
                fullName: draft.fullName,
                email: draft.email || undefined,
                phone: draft.phone || undefined,
                documentId: draft.documentId || undefined,
                birthDate: draft.birthDate ? new Date(draft.birthDate).toISOString() : undefined,
                gender: draft.gender || undefined,
                height: draft.height ? Number(draft.height) : undefined,
                weight: draft.weight ? Number(draft.weight) : undefined,
                dietRestrictions: draft.dietRestrictions || [],
                clinicalSummary: draft.clinicalSummary || undefined,
                nutritionalFocus: draft.nutritionalFocus || undefined,
                fitnessGoals: draft.fitnessGoals || undefined,
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
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
                    className="group flex items-center gap-2 hover:bg-slate-100/50 rounded-xl px-4 py-2 transition-all"
                >
                    <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                    <span className="text-sm font-medium text-slate-500 group-hover:text-slate-800 transition-colors">Volver</span>
                </Button>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setShowResetConfirm(true)}
                        className="h-10 px-4 text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-medium rounded-xl transition-all gap-2 text-sm"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reiniciar
                    </Button>

                    <Button
                        onClick={handleSaveClick}
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-10 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2"
                    >
                        {isSaving ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        <span>
                            {draft.id ? "Actualizar Ficha" : "Registrar Paciente"}
                        </span>
                    </Button>
                </div>
            </div>

            {/* Main Branding */}
            <div className="bg-slate-900 rounded-2xl p-8 relative overflow-hidden shadow-lg border border-slate-800">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -translate-y-1/2 translate-x-1/2 rounded-full" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 blur-[60px] translate-y-1/2 -translate-x-1/2 rounded-full" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-inner border border-emerald-400/20">
                        <User className="h-8 w-8 text-emerald-50" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
                            Nueva Identidad Clínica
                        </h1>
                        <p className="text-emerald-100/70 text-sm max-w-lg">
                            Crea un perfil detallado para un seguimiento nutricional estructurado.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Panel 1: Personal Identification */}
                <div className="lg:col-span-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 px-1 border-b border-slate-100 pb-4">
                        <User className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-semibold text-slate-800">Perfil de Identidad</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Nombre Completo del Paciente *</label>
                            <Input
                                placeholder="Ej. Valentina Morales Lagos"
                                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                value={draft.fullName}
                                onChange={(e) => updateDraft({ fullName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Correo Electrónico *</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                <Input
                                    type="email"
                                    placeholder="valen@email.com"
                                    className="h-11 pl-10 rounded-xl bg-slate-50/50 border-slate-200 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                    value={draft.email}
                                    onChange={(e) => updateDraft({ email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Teléfono de Contacto</label>
                            <div className="relative group">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                <Input
                                    placeholder="+56 9 1234 5678"
                                    className="h-11 pl-10 rounded-xl bg-slate-50/50 border-slate-200 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                    value={draft.phone}
                                    onChange={(e) => updateDraft({ phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Documento de Identidad (Id)</label>
                            <Input
                                placeholder="12.345.678-9"
                                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                value={draft.documentId}
                                onChange={(e) => updateDraft({ documentId: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Fecha de Nacimiento</label>
                            <Input
                                type="date"
                                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-700"
                                value={draft.birthDate || ''}
                                onChange={(e) => updateDraft({ birthDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Sexo biológico</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Masculino', 'Femenino', 'Otro'].map(g => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => updateDraft({ gender: g })}
                                        className={cn(
                                            "h-10 rounded-lg text-sm font-medium transition-all border",
                                            draft.gender === g
                                                ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                                        )}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2 pt-6 border-t border-slate-100">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Propuesta de Foco Nutricional</label>
                            <Input
                                placeholder="Ej. Pérdida de grasa / Recomposición corporal"
                                className="h-11 rounded-xl bg-white border-slate-200 text-sm font-medium placeholder:text-slate-400 focus:bg-emerald-50 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                value={draft.nutritionalFocus || ''}
                                onChange={(e) => updateDraft({ nutritionalFocus: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500 ml-1">Metas Fitness / Deporte</label>
                            <Input
                                placeholder="Ej. Media maratón en 3 meses"
                                className="h-11 rounded-xl bg-white border-slate-200 text-sm font-medium placeholder:text-slate-400 focus:bg-blue-50 focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                value={draft.fitnessGoals || ''}
                                onChange={(e) => updateDraft({ fitnessGoals: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Left Column: Anthropometry & Clinical */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Panel 2: Physical Parameters */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                            <h2 className="text-base font-semibold text-slate-800">Antropometría</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 ml-1">Peso Actual (kg)</label>
                                <Input
                                    type="number"
                                    className="h-11 rounded-xl bg-slate-50/50 border-slate-200 text-base font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20 transition-all text-center"
                                    value={draft.weight}
                                    onChange={(e) => updateDraft({ weight: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 ml-1">Altura (cm)</label>
                                <Input
                                    type="number"
                                    className="h-11 rounded-xl bg-slate-50/50 border-slate-200 text-base font-medium text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20 transition-all text-center"
                                    value={draft.height}
                                    onChange={(e) => updateDraft({ height: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Panel 3: Restrictions */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                            <AlertCircle className="w-5 h-5 text-rose-500" />
                            <h2 className="text-base font-semibold text-slate-800">Restricciones</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 ml-1">Patologías / Exclusiones</label>
                                <div className="bg-white rounded-xl p-1 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                                    <TagInput
                                        value={draft.dietRestrictions || []}
                                        onChange={(tags) => updateDraft({ dietRestrictions: tags })}
                                        placeholder="Ej: Diabetes, Celiaco..."
                                        className="border-none shadow-none text-sm font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Panel 4: Clinical Notes */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                            <h2 className="text-base font-semibold text-slate-800">Observaciones</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 ml-1">Notas Clínicas Iniciales</label>
                                <textarea
                                    className="w-full h-28 rounded-xl bg-slate-50/50 border border-slate-200 p-4 text-sm font-medium text-slate-700 focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                                    placeholder="Antecedentes, motivo de consulta..."
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
