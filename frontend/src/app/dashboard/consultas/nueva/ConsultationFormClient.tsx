"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    User,
    Activity,
    Plus,
    Trash2,
    Save,
    CheckCircle2,
    Trash,
    PlusCircle,
    TrendingUp,
    Target,
    Dumbbell,
    ClipboardList,
    Mail,
    Phone,
    Hash,
    Tags,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { MetricTagInput } from "@/components/ui/MetricTagInput";
import { TagInput } from "@/components/ui/TagInput";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { DEFAULT_METRICS } from "@/lib/constants";
import { Metric } from "@/features/consultations";
import { Patient } from "@/features/patients";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const METRIC_KEY_MAP: Record<string, string> = {
    peso: "weight",
    weight: "weight",
    kg: "weight",
    grasa: "body_fat",
    grasa_corporal: "body_fat",
    body_fat: "body_fat",
    "%_grasa": "body_fat",
    altura: "height",
    height: "height",
    cm: "height",
    masa_muscular: "muscle_mass",
    muscle_mass: "muscle_mass",
    grasa_visceral: "visceral_fat",
    visceral_fat: "visceral_fat",
    cintura: "waist",
    waist: "waist",
};

const normalizeMetricKey = (label: string = "", key?: string) => {
    if (key && METRIC_KEY_MAP[key.toLowerCase()])
        return METRIC_KEY_MAP[key.toLowerCase()];
    const normalizedLabel = label.trim().toLowerCase().replace(/\s+/g, "_");
    return METRIC_KEY_MAP[normalizedLabel] || key || normalizedLabel;
};

interface ConsultationFormProps {
    id?: string; // If present, we are editing
}

export default function ConsultationFormClient({ id }: ConsultationFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const patientIdFromQuery = searchParams.get("patientId");

    const [isLoading, setIsLoading] = useState(false);
    const [isPatientsLoading, setIsPatientsLoading] = useState(false);
    const [isPatientDataLoading, setIsPatientDataLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [patients, setPatients] = useState<{ id: string; fullName: string }[]>([]);
    const [patientData, setPatientData] = useState<Patient | null>(null);

    // Form State - Consultation
    const [formData, setFormData] = useState({
        patientId: patientIdFromQuery || "",
        date: new Date().toISOString().split("T")[0],
        title: "",
        description: "",
        metrics: [] as Metric[],
    });

    // Form State - Patient Clinical Info (to be updated)
    const [patientForm, setPatientForm] = useState({
        nutritionalFocus: "",
        fitnessGoals: "",
        clinicalSummary: "",
        dietRestrictions: [] as string[],
        tags: [] as string[],
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    });

    // Fetch initial data
    useEffect(() => {
        fetchPatients();
        if (id) {
            fetchConsultation();
        }
    }, [id]);

    // Force sync patientId from query when creating new if it changes
    useEffect(() => {
        if (patientIdFromQuery && !id) {
            setFormData(prev => ({ ...prev, patientId: patientIdFromQuery }));
        }
    }, [patientIdFromQuery, id]);

    // Fetch patient data when patient changes
    useEffect(() => {
        if (formData.patientId) {
            fetchPatientData(formData.patientId);
        } else {
            setPatientData(null);
            setPatientForm({
                nutritionalFocus: "",
                fitnessGoals: "",
                clinicalSummary: "",
                dietRestrictions: [],
                tags: [],
            });
        }
    }, [formData.patientId]);

    const fetchPatients = async () => {
        setIsPatientsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/patients?limit=1000`, {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const result = await response.json();
                setPatients(result.data.map((p: any) => ({ id: p.id, fullName: p.fullName })));
            }
        } catch (error) {
            console.error("Error fetching patients", error);
        } finally {
            setIsPatientsLoading(false);
        }
    };

    const fetchPatientData = async (pId: string) => {
        setIsPatientDataLoading(true);
        try {
            const response = await fetch(`${apiUrl}/patients/${pId}`, {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data: Patient = await response.json();
                setPatientData(data);
                // Only autocomplete if we are creating a new consultation
                // or if the form is currently empty for these fields
                setPatientForm({
                    nutritionalFocus: data.nutritionalFocus || "",
                    fitnessGoals: data.fitnessGoals || "",
                    clinicalSummary: data.clinicalSummary || "",
                    dietRestrictions: data.dietRestrictions || [],
                    tags: data.tags || [],
                });
            }
        } catch (error) {
            console.error("Error fetching patient data", error);
        } finally {
            setIsPatientDataLoading(false);
        }
    };

    const fetchConsultation = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/consultations/${id}`, {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                setFormData({
                    patientId: data.patientId,
                    date: new Date(data.date).toISOString().split("T")[0],
                    title: data.title,
                    description: data.description || "",
                    metrics: data.metrics || [],
                });
            }
        } catch (error) {
            toast.error("Error al cargar la consulta");
            router.push("/dashboard/consultas");
        } finally {
            setIsLoading(false);
        }
    };

    const registeredMetricKeys = useMemo(() => {
        return DEFAULT_METRICS.map(m => m.key);
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.patientId) {
            toast.error("Seleccione un paciente");
            return;
        }

        setIsSaving(true);
        try {
            // 1. Save Consultation
            const consultationMethod = id ? "PATCH" : "POST";
            const consultationUrl = id ? `${apiUrl}/consultations/${id}` : `${apiUrl}/consultations`;
            const consultationPayload = {
                ...formData,
                metrics: formData.metrics.map(m => ({
                    ...m,
                    key: normalizeMetricKey(m.label, m.key)
                }))
            };

            const cResponse = await fetch(consultationUrl, {
                method: consultationMethod,
                headers: getAuthHeaders(),
                body: JSON.stringify(consultationPayload),
            });

            if (!cResponse.ok) throw new Error("Error saving consultation");

            // 2. Update Patient Record (Clinical info)
            // Check if data changed to avoid redundant requests
            const pResponse = await fetch(`${apiUrl}/patients/${formData.patientId}`, {
                method: "PATCH",
                headers: getAuthHeaders(),
                body: JSON.stringify(patientForm),
            });

            if (!pResponse.ok) throw new Error("Error updating patient profile");

            toast.success(id ? "Consulta y perfil actualizados" : "Consulta registrada con éxito");
            router.push(patientIdFromQuery ? `/dashboard/pacientes/${formData.patientId}` : "/dashboard/consultas");
        } catch (error) {
            toast.error("Hubo un error al procesar la solicitud");
        } finally {
            setIsSaving(false);
        }
    };

    const updateMetric = (index: number, field: keyof Metric, value: string) => {
        const newMetrics = [...formData.metrics];
        newMetrics[index] = { ...newMetrics[index], [field]: value };
        setFormData({ ...formData, metrics: newMetrics });
    };

    const removeMetric = (index: number) => {
        const newMetrics = [...formData.metrics];
        newMetrics.splice(index, 1);
        setFormData({ ...formData, metrics: newMetrics });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="h-16 w-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-semibold text-xs">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="p-4 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 shadow-sm cursor-pointer"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                            {id ? "Editar Sesión" : "Nueva Consulta Clínica"}
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {id ? "Actualiza los registros de la visita" : "Registra la evolución y ajustes del tratamiento"}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Column: Consultation Main Data */}
                <div className="space-y-10">
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                <ClipboardList className="w-6 h-6 text-emerald-500" />
                                Detalles de la Sesión
                            </h3>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Paciente
                                    </label>
                                    <SearchableSelect
                                        options={patients.map((p) => ({ value: p.id, label: p.fullName }))}
                                        value={formData.patientId}
                                        onChange={(val) => setFormData({ ...formData, patientId: val })}
                                        placeholder="Seleccionar paciente..."
                                        isLoading={isPatientsLoading}
                                        triggerClassName="h-14 rounded-2xl bg-white border-slate-200 shadow-sm"
                                        disabled={!!id || !!patientIdFromQuery}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Fecha de la Visita
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                                        <input
                                            type="date"
                                            className="w-full h-14 pl-14 pr-5 rounded-2xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700 cursor-pointer shadow-sm"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Título de la Sesión
                                </label>
                                <Input
                                    className="h-14 bg-white border-slate-200 rounded-2xl font-bold text-lg"
                                    placeholder="Ej: Control Mensual - Ajuste de Macros"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Observaciones / Notas Clínicas
                                </label>
                                <textarea
                                    className="w-full h-40 rounded-3xl bg-white border border-slate-200 p-6 font-medium text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none shadow-sm"
                                    placeholder="Describe la evolución, cambios en el estilo de vida, adherencia al plan..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Metrics Card */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                <Activity className="w-6 h-6 text-emerald-500" />
                                Métricas y Biometría
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase">
                                    Datos Evolutivos
                                </span>
                            </div>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="mb-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                    Añadir Métricas Rápidas
                                </label>
                                <MetricTagInput
                                    value={formData.metrics}
                                    registeredKeys={registeredMetricKeys}
                                    placeholder="Busca: Peso, Cintura, % Grasa..."
                                    onChange={(newMetrics) => setFormData({ ...formData, metrics: newMetrics })}
                                />
                            </div>

                            <div className="space-y-4">
                                {formData.metrics.length > 0 ? (
                                    formData.metrics.map((m, idx) => (
                                        <div
                                            key={idx}
                                            className="grid grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-emerald-200 transition-all"
                                        >
                                            <div className="col-span-5 space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                    Concepto
                                                </label>
                                                <Input
                                                    placeholder="Métrica..."
                                                    value={m.label}
                                                    onChange={(e) => updateMetric(idx, "label", e.target.value)}
                                                    className="bg-white h-12 rounded-xl"
                                                />
                                            </div>
                                            <div className="col-span-3 space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                    Valor
                                                </label>
                                                <Input
                                                    placeholder="0.0"
                                                    value={m.value}
                                                    onChange={(e) => updateMetric(idx, "value", e.target.value)}
                                                    className="bg-white h-12 rounded-xl font-bold text-center"
                                                />
                                            </div>
                                            <div className="col-span-3 space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                    Unidad
                                                </label>
                                                <Input
                                                    placeholder="kg, %, cm..."
                                                    value={m.unit}
                                                    onChange={(e) => updateMetric(idx, "unit", e.target.value)}
                                                    className="bg-white h-12 rounded-xl"
                                                />
                                            </div>
                                            <div className="col-span-1 pb-1">
                                                <button
                                                    type="button"
                                                    onClick={() => removeMetric(idx)}
                                                    className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                        <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            No hay métricas añadidas a esta sesión
                                        </p>
                                    </div>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setFormData({
                                        ...formData,
                                        metrics: [...formData.metrics, { label: "", value: "", unit: "" }]
                                    })}
                                    className="w-full h-14 rounded-2xl border-slate-200 text-slate-400 hover:text-slate-600 border-dashed"
                                >
                                    <PlusCircle className="w-5 h-5 mr-2" />
                                    AÑADIR MÉTRICA MANUALMENTE
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Patient Profile Update */}
                <div className="space-y-10">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50 text-slate-900 flex-shrink-0">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <User className="w-6 h-6 text-emerald-500" />
                                Perfil del Paciente
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Actualización de expediente
                            </p>
                        </div>
                        <div className="p-8 space-y-10 flex-1">
                            {/* Nutritional Focus */}
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-3 font-black text-slate-900 text-[10px] uppercase tracking-widest">
                                    <Target className="w-4 h-4 text-emerald-500" />
                                    Foco Nutricional
                                </h4>
                                <Input
                                    className="bg-slate-50 border-none text-slate-800 font-bold text-lg h-14 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10"
                                    placeholder="Ej: Déficit Calórico"
                                    value={patientForm.nutritionalFocus}
                                    onChange={(e) => setPatientForm({ ...patientForm, nutritionalFocus: e.target.value })}
                                />
                            </div>

                            {/* Fitness Goals */}
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-3 font-black text-slate-900 text-[10px] uppercase tracking-widest">
                                    <Dumbbell className="w-4 h-4 text-rose-500" />
                                    Metas Fitness
                                </h4>
                                <textarea
                                    className="w-full h-32 rounded-2xl bg-slate-50 border-none p-4 font-medium text-slate-700 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all resize-none text-sm"
                                    placeholder="Ej: Correr 10k, mejorar fuerza..."
                                    value={patientForm.fitnessGoals}
                                    onChange={(e) => setPatientForm({ ...patientForm, fitnessGoals: e.target.value })}
                                />
                            </div>

                            {/* Dietary Restrictions */}
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-3 font-black text-slate-900 text-[10px] uppercase tracking-widest">
                                    <Activity className="w-4 h-4 text-rose-500" />
                                    Restricciones de Salud
                                </h4>
                                <TagInput
                                    value={patientForm.dietRestrictions}
                                    onChange={(tags) => setPatientForm({ ...patientForm, dietRestrictions: tags })}
                                    fetchSuggestionsUrl={`${apiUrl}/tags`}
                                    className="bg-slate-50 border-none rounded-2xl min-h-[56px] p-2"
                                    placeholder="Ej: Celiaquía, Diabetes..."
                                />
                            </div>

                            {/* Classification Tags */}
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-3 font-black text-slate-900 text-[10px] uppercase tracking-widest">
                                    <Hash className="w-4 h-4 text-emerald-500" />
                                    Etiquetas de Clasificación
                                </h4>
                                <TagInput
                                    value={patientForm.tags}
                                    onChange={(tags) => setPatientForm({ ...patientForm, tags: tags })}
                                    fetchSuggestionsUrl={`${apiUrl}/tags`}
                                    className="bg-slate-50 border-none rounded-2xl min-h-[56px] p-2"
                                    placeholder="Ej: #Deportista, #Vegano..."
                                />
                            </div>

                            {/* Clinical Summary */}
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-3 font-black text-slate-900 text-[10px] uppercase tracking-widest">
                                    <ClipboardList className="w-4 h-4 text-blue-500" />
                                    Resumen Clínico
                                </h4>
                                <textarea
                                    className="w-full h-32 rounded-2xl bg-slate-50 border-none p-4 font-medium text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none text-sm"
                                    placeholder="Resumen del estado clínico del paciente..."
                                    value={patientForm.clinicalSummary}
                                    onChange={(e) => setPatientForm({ ...patientForm, clinicalSummary: e.target.value })}
                                />
                            </div>

                            {/* Patient Quick Info (Read Only) */}
                            {patientData && (
                                <div className="pt-6 border-t border-slate-100 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{patientData.fullName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{patientData.birthDate ? `${new Date().getFullYear() - new Date(patientData.birthDate).getFullYear()} años` : 'Edad no reg.'}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 px-1">
                                        <div className="flex items-center gap-2 group/info">
                                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover/info:bg-emerald-50 transition-colors">
                                                <Mail className="w-3.5 h-3.5 text-slate-300 group-hover/info:text-emerald-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Correo</p>
                                                <p className="text-xs font-bold text-slate-700 truncate">{patientData.email || 'No reg.'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 group/info">
                                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover/info:bg-blue-50 transition-colors">
                                                <Phone className="w-3.5 h-3.5 text-slate-300 group-hover/info:text-blue-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Teléfono</p>
                                                <p className="text-xs font-bold text-slate-700">{patientData.phone || 'No reg.'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Unified Action Buttons Footer */}
                <div className="lg:col-span-2 pt-10 flex flex-col md:flex-row items-center justify-center gap-6">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        className="w-full md:w-64 h-16 rounded-[24px] text-slate-400 font-bold hover:bg-slate-100 transition-all uppercase text-xs tracking-widest order-2 md:order-1"
                    >
                        CANCELAR
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="w-full md:w-96 h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all active:scale-95 group order-1 md:order-2"
                    >
                        {isSaving ? (
                            <div className="h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                                GUARDAR CONSULTA COMPLETA
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
