"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
    Heart,
    RotateCcw,
    ChevronDown,
    PencilLine,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { MetricTagInput } from "@/components/ui/metric-tag-input";
import { TagInput } from "@/components/ui/TagInput";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { DEFAULT_METRICS } from "@/lib/constants";
import { Metric } from "@/features/consultations";
import { Patient } from "@/features/patients";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { fetchApi, getApiUrl } from "@/lib/api-base";
import { formatRut } from "@/lib/rut-utils";

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
    const [isPatientPanelOpen, setIsPatientPanelOpen] = useState(false);
    const [isPatientInfoEditing, setIsPatientInfoEditing] = useState(false);
    const [hasClearedPatientSelection, setHasClearedPatientSelection] = useState(false);

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
        fullName: "",
        email: "",
        phone: "",
        documentId: "",
        gender: "",
        height: "",
        weight: "",
        nutritionalFocus: "",
        fitnessGoals: "",
        likes: "",
        clinicalSummary: "",
        dietRestrictions: [] as string[],
        tags: [] as string[],
    });

    const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    });

    const draftKey = useMemo(() => {
        const key = formData.patientId ? `consultation_draft_${formData.patientId}` : "";
        return key;
    }, [formData.patientId]);

    const [isDraftSaving, setIsDraftSaving] = useState(false);
    const [lastDraftSaved, setLastDraftSaved] = useState<string | null>(null);
    const isInitialLoad = useRef(true);

    // Load draft on patient selection
    useEffect(() => {
        if (!draftKey || id) return;
        try {
            const stored = localStorage.getItem(draftKey);
            if (stored) {
                const draft = JSON.parse(stored);
                setFormData(prev => ({ ...prev, ...draft }));
                isInitialLoad.current = false;
            }
        } catch { /* ignore */ }
    }, [draftKey, id]);

    // Auto-save draft with debounce
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!draftKey || isInitialLoad.current) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

        saveTimerRef.current = setTimeout(() => {
            try {
                const draft = {
                    title: formData.title,
                    description: formData.description,
                    metrics: formData.metrics,
                    date: formData.date,
                };
                localStorage.setItem(draftKey, JSON.stringify(draft));
                setIsDraftSaving(true);
                setLastDraftSaved(new Date().toLocaleTimeString());
                setTimeout(() => setIsDraftSaving(false), 800);
            } catch { /* ignore */ }
        }, 1500);

        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [formData.title, formData.description, formData.date, JSON.stringify(formData.metrics), draftKey]);

    const clearDraft = useCallback(() => {
        if (draftKey) {
            localStorage.removeItem(draftKey);
        }
        setLastDraftSaved(null);
        setIsDraftSaving(false);
        isInitialLoad.current = true;
    }, [draftKey]);

    // Mark first load complete after initial data is set
    useEffect(() => {
        const timer = setTimeout(() => { isInitialLoad.current = false; }, 500);
        return () => clearTimeout(timer);
    }, []);

    // Fetch initial data
    useEffect(() => {
        fetchPatients();
        if (id) {
            fetchConsultation();
        }
    }, [id]);

    // Force sync patientId from query when creating new if it changes
    useEffect(() => {
        if (patientIdFromQuery && !id && !hasClearedPatientSelection) {
            setFormData(prev => ({ ...prev, patientId: patientIdFromQuery }));
        }
    }, [patientIdFromQuery, id, hasClearedPatientSelection]);

    // Fetch patient data when patient changes
    useEffect(() => {
        if (formData.patientId) {
            fetchPatientData(formData.patientId);
        } else {
            setPatientData(null);
            setIsPatientPanelOpen(false);
            setIsPatientInfoEditing(false);
            setPatientForm({
                fullName: "",
                email: "",
                phone: "",
                documentId: "",
                gender: "",
                height: "",
                weight: "",
                nutritionalFocus: "",
                fitnessGoals: "",
                likes: "",
                clinicalSummary: "",
                dietRestrictions: [],
                tags: [],
            });
        }
    }, [formData.patientId]);

    const fetchPatients = async () => {
        setIsPatientsLoading(true);
        try {
            const response = await fetchApi(`/patients?limit=1000`, {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const result = await response.json();
                setPatients((result.data as Array<{ id: string; fullName: string }>).map((p) => ({ id: p.id, fullName: p.fullName })));
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
            const response = await fetchApi(`/patients/${pId}`, {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data: Patient = await response.json();
                setPatientData(data);
                setIsPatientPanelOpen(false);
                setIsPatientInfoEditing(false);
                // Only autocomplete if we are creating a new consultation
                // or if the form is currently empty for these fields
                setPatientForm({
                    fullName: data.fullName || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    documentId: data.documentId || "",
                    gender: data.gender || "",
                    height: data.height ? String(data.height) : "",
                    weight: data.weight ? String(data.weight) : "",
                    nutritionalFocus: data.nutritionalFocus || "",
                    fitnessGoals: data.fitnessGoals || "",
                    likes: data.likes || "",
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
            const response = await fetchApi(`/consultations/${id}`, {
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

    const hasSelectedPatient = Boolean(formData.patientId);
    const showPatientMetrics = hasSelectedPatient && Boolean(patientData);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.patientId) {
            toast.error("Seleccione un paciente");
            return;
        }

        // Validate metrics: Must have values if they have a label
        const incompleteMetrics = formData.metrics.filter(m => m.label.trim() !== "" && (m.value === undefined || m.value === null || m.value.toString().trim() === ""));
        if (incompleteMetrics.length > 0) {
            toast.error(`La métrica "${incompleteMetrics[0].label}" debe tener un valor.`);
            return;
        }

        // Filter out completely empty metrics
        const finalMetrics = formData.metrics.filter(m => m.label.trim() !== "" && m.value !== undefined && m.value !== null && m.value.toString().trim() !== "");

        setIsSaving(true);
        try {
            // 1. Save Consultation
            const consultationMethod = id ? "PATCH" : "POST";
            const consultationUrl = id ? `/consultations/${id}` : "/consultations";
            const consultationPayload = {
                ...formData,
                metrics: finalMetrics.map(m => ({
                    ...m,
                    key: normalizeMetricKey(m.label, m.key)
                }))
            };

            const cResponse = await fetchApi(consultationUrl, {
                method: consultationMethod,
                headers: getAuthHeaders(),
                body: JSON.stringify(consultationPayload),
            });

            if (!cResponse.ok) throw new Error("Error saving consultation");

            // 2. Update Patient Record (Clinical info)
            // Check if data changed to avoid redundant requests
            const patientPayload = {
                fullName: patientForm.fullName.trim() || patientData?.fullName || "",
                email: patientForm.email.trim() || null,
                phone: patientForm.phone.trim() || null,
                documentId: patientForm.documentId.trim() || null,
                gender: patientForm.gender.trim() || null,
                // Anthropometry should come from metrics in the consultation flow.
                // We intentionally do not overwrite height/weight from this panel.
                height: undefined,
                weight: undefined,
                nutritionalFocus: patientForm.nutritionalFocus.trim() || null,
                fitnessGoals: patientForm.fitnessGoals.trim() || null,
                likes: patientForm.likes.trim() || null,
                clinicalSummary: patientForm.clinicalSummary.trim() || null,
                dietRestrictions: patientForm.dietRestrictions,
                tags: patientForm.tags,
            };

            const pResponse = await fetchApi(`/patients/${formData.patientId}`, {
                method: "PATCH",
                headers: getAuthHeaders(),
                body: JSON.stringify(patientPayload),
            });

            if (!pResponse.ok) throw new Error("Error updating patient profile");

            toast.success(id ? "Consulta y perfil actualizados" : "Consulta registrada con éxito");
            clearDraft();
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

    const handleReset = () => {
        if (id) {
            router.back();
            return;
        }

        setHasClearedPatientSelection(true);
        clearDraft();
        setFormData({
            patientId: "",
            date: new Date().toISOString().split("T")[0],
            title: "",
            description: "",
            metrics: [],
        });
        setPatientData(null);
        setIsPatientPanelOpen(false);
        setIsPatientInfoEditing(false);
        setPatientForm({
            fullName: "",
            email: "",
            phone: "",
            documentId: "",
            gender: "",
            height: "",
            weight: "",
            nutritionalFocus: "",
            fitnessGoals: "",
            likes: "",
            clinicalSummary: "",
            dietRestrictions: [],
            tags: [],
        });
        toast.info("Formulario reiniciado");
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
            <form onSubmit={handleSave}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8 lg:mb-10 px-1 lg:px-0">
                    <div className="flex items-start gap-4 lg:gap-6 min-w-0">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="p-3 lg:p-4 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 shadow-sm cursor-pointer shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-xl lg:text-3xl font-semibold text-slate-900 uppercase tracking-tight">
                                {id ? "Editar Sesión" : "Nueva Consulta Clínica"}
                            </h1>
                            <p className="mt-2 text-xs lg:text-sm font-normal text-slate-500 max-w-2xl leading-relaxed">
                                {id
                                    ? "Actualiza los registros de la visita."
                                    : "Registra una nueva sesión con un cliente nuevo o ya registrado."}
                            </p>
                            {hasSelectedPatient && !id && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className={cn(
                                        "flex items-center gap-1.5 text-[11px] font-semibold transition-all duration-500",
                                        isDraftSaving ? "text-indigo-600" : lastDraftSaved ? "text-slate-400" : "text-slate-300",
                                    )}>
                                        <div className={cn(
                                            "h-1.5 w-1.5 rounded-full transition-colors",
                                            isDraftSaving ? "bg-indigo-500 animate-pulse" : lastDraftSaved ? "bg-indigo-400" : "bg-slate-300",
                                        )} />
                                        {isDraftSaving ? "Guardando borrador..." : lastDraftSaved ? `Borrador ${lastDraftSaved}` : "Borrador pendiente"}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:hidden w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleReset}
                            className="flex-1 sm:flex-none h-11 px-5 rounded-2xl text-slate-400 font-semibold hover:bg-slate-100 transition-all uppercase text-[10px] tracking-widest border border-slate-100"
                        >
                            Reiniciar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="flex-[2] sm:flex-none h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all active:scale-95 group flex items-center justify-center gap-3"
                        >
                            {isSaving ? (
                                <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                                    <span>Guardar</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 xl:flex flex-col gap-4">
                    <div className="bg-white/80 backdrop-blur-xl p-3 rounded-3xl border border-slate-200 shadow-2xl flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-all flex items-center justify-center group relative"
                            title="Reiniciar formulario"
                        >
                            <RotateCcw className="w-6 h-6 group-hover:rotate-[-45deg] transition-transform duration-300" />
                            <span className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-semibold uppercase px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap tracking-wider">
                                Reiniciar
                            </span>
                        </button>

                        <div className="h-px bg-slate-100 mx-2" />

                        <button
                            type="submit"
                            disabled={isSaving}
                            className={cn(
                                "w-14 h-14 rounded-2xl transition-all flex items-center justify-center group relative shadow-lg shadow-emerald-200/50",
                                isSaving ? "bg-slate-100" : "bg-emerald-600 hover:bg-emerald-700 text-white",
                            )}
                            title={id ? "Actualizar consulta" : "Guardar consulta"}
                        >
                            {isSaving ? (
                                <span className="w-6 h-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                            ) : (
                                <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            )}
                            <span className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-semibold uppercase px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap tracking-wider">
                                Guardar
                            </span>
                        </button>
                    </div>
                </div>

                <nav className="fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 xl:flex flex-col gap-3">
                    <div className="rounded-[2rem] border border-slate-200 bg-white/85 backdrop-blur-xl shadow-xl px-4 py-4 min-w-[220px]">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 mb-3">
                            Índice rápido
                        </p>
                        <div className="flex flex-col gap-2 text-sm">
                            <a href="#consulta-detalles" className="group flex items-center gap-3 rounded-2xl px-3 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                                <span className="text-slate-300 group-hover:text-indigo-500 font-black">---</span>
                                <span>Detalles de la consulta</span>
                            </a>
                            <a href="#consulta-metricas" className="group flex items-center gap-3 rounded-2xl px-3 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                                <span className="text-slate-300 group-hover:text-indigo-500 font-black">---</span>
                                <span>Métricas</span>
                            </a>
                            <a href="#consulta-paciente" className="group flex items-center gap-3 rounded-2xl px-3 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                                <span className="text-slate-300 group-hover:text-indigo-500 font-black">---</span>
                                <span>Información del paciente</span>
                            </a>
                        </div>
                    </div>
                </nav>

                <div className="grid grid-cols-1 gap-6 lg:gap-8">
                    <div className="flex flex-col gap-6">
                        {/* Basic Info Card */}
                        <div id="consulta-detalles" className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-5 lg:p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                <ClipboardList className="w-6 h-6 text-indigo-500" />
                                Detalles de la Sesión
                            </h3>
                        </div>
                        <div className="p-4 lg:p-5 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                                        Paciente
                                    </label>
                                    <SearchableSelect
                                        options={patients.map((p) => ({ value: p.id, label: p.fullName }))}
                                        value={formData.patientId}
                                        onChange={(val) => setFormData({ ...formData, patientId: val })}
                                        placeholder="Seleccionar paciente..."
                                        isLoading={isPatientsLoading}
                                        triggerClassName={cn(
                                            "h-14 rounded-2xl bg-white border-slate-200 shadow-sm transition-all",
                                            !formData.patientId && "ring-2 ring-emerald-500/20 animate-pulse shadow-emerald-100/60",
                                        )}
                                        disabled={!!id}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                                        Fecha de la Sesión
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-indigo-500 group-focus-within:bg-indigo-500 group-focus-within:text-white transition-all duration-300 pointer-events-none">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <input
                                            type="date"
                                            disabled={!hasSelectedPatient}
                                            className="w-full h-14 pl-14 pr-5 rounded-2xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700 cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                                    Título de la Sesión <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    className="h-12 bg-white border-slate-200 rounded-2xl font-bold text-base"
                                    placeholder="Ej: Control Mensual - Ajuste de Macros"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    disabled={!hasSelectedPatient}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                                    Observaciones / Notas Clínicas <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    disabled={!hasSelectedPatient}
                                    className="w-full h-32 rounded-3xl bg-white border border-slate-200 p-4 font-medium text-slate-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none shadow-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                                    placeholder="Describe la evolución, cambios en el estilo de vida, adherencia al plan..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div id="consulta-metricas" className={showPatientMetrics ? "bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden" : "hidden"}>
                            <div className="p-4 lg:p-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between gap-3">
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                    <Activity className="w-6 h-6 text-indigo-500" />
                                    Métricas y biometría
                                </h3>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase">
                                    Máx. 3 visibles
                                </span>
                            </div>
                            <div className="p-4 lg:p-5 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                                        Añadir métricas rápidas
                                    </label>
                                    <MetricTagInput
                                        value={formData.metrics}
                                        registeredKeys={registeredMetricKeys}
                                        placeholder="Busca: Peso, Cintura, % Grasa..."
                                        onChange={(newMetrics) =>
                                            setFormData({
                                                ...formData,
                                                metrics: newMetrics.map((metric) => ({
                                                    ...metric,
                                                    value:
                                                        metric.value === undefined || metric.value === null
                                                            ? ""
                                                            : metric.value,
                                                })),
                                            })
                                        }
                                    />
                                </div>

                                <div className="max-h-[16rem] overflow-y-auto pr-1 space-y-3 overscroll-contain">
                                    {formData.metrics.length > 0 ? (
                                        formData.metrics.map((m, idx) => (
                                            <div
                                                key={idx}
                                                className="flex flex-col md:grid md:grid-cols-12 gap-3 items-start md:items-end bg-slate-50 p-4 rounded-3xl border border-slate-100 group hover:border-emerald-200 transition-all"
                                            >
                                                <div className="w-full md:col-span-5 space-y-1.5">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Concepto</label>
                                                    <Input
                                                        placeholder="Métrica..."
                                                        value={m.label || ""}
                                                        onChange={(e) => updateMetric(idx, "label", e.target.value)}
                                                        className="bg-white h-12 rounded-xl"
                                                        disabled={!hasSelectedPatient}
                                                    />
                                                </div>
                                                <div className="w-full md:col-span-3 space-y-1.5">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Valor</label>
                                                    <Input
                                                        placeholder="0.0"
                                                        value={m.value || ""}
                                                        onChange={(e) => updateMetric(idx, "value", e.target.value)}
                                                        className="bg-white h-12 rounded-xl font-bold text-center"
                                                        disabled={!hasSelectedPatient}
                                                    />
                                                </div>
                                                <div className="w-full md:col-span-3 space-y-1.5">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Unidad</label>
                                                    <Input
                                                        placeholder="kg, %, cm..."
                                                        value={m.unit || ""}
                                                        onChange={(e) => updateMetric(idx, "unit", e.target.value)}
                                                        className="bg-white h-12 rounded-xl text-slate-500 font-bold"
                                                        disabled={!hasSelectedPatient}
                                                    />
                                                </div>
                                                <div className="w-full md:col-span-1 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMetric(idx)}
                                                        disabled={!hasSelectedPatient}
                                                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all h-fit disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : null}
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setFormData({
                                            ...formData,
                                            metrics: [...formData.metrics, { label: "", value: "", unit: "" }],
                                        })
                                    }
                                    disabled={!hasSelectedPatient}
                                    className="w-full h-12 rounded-2xl border-slate-200 text-slate-400 hover:text-slate-600 border-dashed disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <PlusCircle className="w-5 h-5 mr-2" />
                                    Añadir métrica manualmente
                                </Button>
                            </div>
                        </div>
                        {patientData ? (
                        <details
                            id="consulta-paciente"
                            open={isPatientPanelOpen}
                            onToggle={(e) => setIsPatientPanelOpen(e.currentTarget.open)}
                            className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
                        >
                            <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none p-4 lg:p-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                        <User className="w-6 h-6 text-indigo-500" />
                                        {patientData.fullName}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest text-emerald-700 bg-emerald-50">
                                        Paciente asignado
                                    </span>
                                    <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-200", isPatientPanelOpen && "rotate-180")} />
                                </div>
                            </summary>
                            <div className="p-4 lg:p-5">
                                <>
                                    <div className={cn(
                                        "mb-4 rounded-[24px] border px-4 py-4 transition-all",
                                        isPatientInfoEditing
                                            ? "border-emerald-200 bg-emerald-50/50 shadow-lg shadow-emerald-100/60"
                                            : "border-slate-100 bg-slate-50/70",
                                    )}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                                    {isPatientInfoEditing ? "Modo edición activo" : "Ficha rápida del paciente"}
                                                </p>
                                                <p className="hidden">
                                                    {isPatientInfoEditing
                                                        ? "Aquí puedes ajustar toda la información del paciente antes de guardar la consulta."
                                                        : "Consulta lo esencial y entra a edición solo si necesitas cambiar algo."}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsPatientInfoEditing((prev) => !prev)}
                                                className={cn(
                                                    "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                                    isPatientInfoEditing
                                                        ? "border border-emerald-200 bg-white text-slate-700"
                                                        : "bg-slate-900 text-white",
                                                )}
                                            >
                                                {isPatientInfoEditing ? <X className="h-4 w-4" /> : <PencilLine className="h-4 w-4" />}
                                                {isPatientInfoEditing ? "Salir" : "Editar"}
                                            </button>
                                        </div>
                                    </div>

                                    {isPatientInfoEditing ? (
                                    <details
                                        open={isPatientPanelOpen}
                                        onToggle={(e) => setIsPatientPanelOpen(e.currentTarget.open)}
                                        className="bg-slate-50/50 rounded-[28px] border border-slate-100 overflow-hidden"
                                    >
                                        <summary className="hidden">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                                                    <User className="w-6 h-6 text-indigo-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-base font-bold text-slate-900 truncate">{patientData.fullName}</h4>
                                                    <p className="mt-1 text-xs font-medium text-slate-500 truncate">
                                                        {formatRut(patientData.documentId || "") || "RUT no registrado"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                                    Activo
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Editar rápido
                                                </span>
                                            </div>
                                        </summary>
                                        <div className="border-t border-slate-100 bg-white p-4 lg:p-5 space-y-4">
                                            <section className="space-y-3">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                                    Información personal del paciente
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <Input
                                                        className="h-11 rounded-2xl border-slate-200 font-semibold"
                                                        placeholder="Nombre completo"
                                                        value={patientForm.fullName}
                                                        onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                                                    />
                                                    <Input
                                                        className="h-11 rounded-2xl border-slate-200 font-semibold"
                                                        placeholder="RUT"
                                                        value={patientForm.documentId}
                                                        onChange={(e) => setPatientForm({ ...patientForm, documentId: formatRut(e.target.value) })}
                                                    />
                                                    <Input
                                                        className="h-11 rounded-2xl border-slate-200 font-semibold md:col-span-2"
                                                        placeholder="Correo"
                                                        value={patientForm.email}
                                                        onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                                                    />
                                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 md:col-span-2">
                                                        <Input
                                                            className="h-11 rounded-2xl border-slate-200 font-semibold sm:col-span-2"
                                                            placeholder="Teléfono"
                                                            value={patientForm.phone}
                                                            onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                                                        />
                                                        <select
                                                            value={patientForm.gender}
                                                            onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                                                            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                                        >
                                                            <option value="">Sexo biológico</option>
                                                            <option value="Masculino">Masculino</option>
                                                            <option value="Femenino">Femenino</option>
                                                            <option value="Otro">Otro</option>
                                                        </select>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            className="h-11 rounded-2xl border-slate-200 font-semibold"
                                                            placeholder="Estatura (cm)"
                                                            value={patientForm.height}
                                                            onChange={(e) => setPatientForm({ ...patientForm, height: e.target.value })}
                                                        />
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.1"
                                                        className="h-11 rounded-2xl border-slate-200 font-semibold md:col-span-2"
                                                        placeholder="Peso (kg)"
                                                        value={patientForm.weight}
                                                        onChange={(e) => setPatientForm({ ...patientForm, weight: e.target.value })}
                                                    />
                                                </div>
                                            </section>

                                            <section className="space-y-2">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                                    Resumen clínico del paciente
                                                </p>
                                                <textarea
                                                    className="w-full h-24 rounded-2xl border border-slate-200 bg-white p-3.5 text-sm font-medium text-slate-700 outline-none transition-all resize-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                                    placeholder="Resumen del estado clínico del paciente..."
                                                    value={patientForm.clinicalSummary}
                                                    onChange={(e) => setPatientForm({ ...patientForm, clinicalSummary: e.target.value })}
                                                />
                                            </section>

                                            <section className="space-y-3">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                                    Preferencias y contexto
                                                </p>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-rose-500 ml-1">Restricciones</label>
                                                    <TagInput
                                                        value={patientForm.dietRestrictions}
                                                        onChange={(tags) => setPatientForm({ ...patientForm, dietRestrictions: tags })}
                                                        fetchSuggestionsUrl={`${getApiUrl()}/tags`}
                                                        className="bg-white border border-slate-200 rounded-2xl min-h-[56px] p-2"
                                                        placeholder="Ej: Celiaquía, Diabetes..."
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Foco nutricional</label>
                                                    <Input
                                                        className="h-11 rounded-2xl border-slate-200 font-semibold"
                                                        placeholder="Ej: Déficit calórico"
                                                        value={patientForm.nutritionalFocus}
                                                        onChange={(e) => setPatientForm({ ...patientForm, nutritionalFocus: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Metas fitness</label>
                                                    <textarea
                                                        className="w-full h-20 rounded-2xl border border-slate-200 bg-white p-3.5 text-sm font-medium text-slate-700 outline-none transition-all resize-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                                        placeholder="Ej: Correr 10k, mejorar fuerza..."
                                                        value={patientForm.fitnessGoals}
                                                        onChange={(e) => setPatientForm({ ...patientForm, fitnessGoals: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Gustos</label>
                                                    <textarea
                                                        className="w-full h-20 rounded-2xl border border-slate-200 bg-white p-3.5 text-sm font-medium text-slate-700 outline-none transition-all resize-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                                        placeholder="Ej: Le gusta el chocolate, evita el brócoli..."
                                                        value={patientForm.likes}
                                                        onChange={(e) => setPatientForm({ ...patientForm, likes: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Etiquetas</label>
                                                    <TagInput
                                                        value={patientForm.tags}
                                                        onChange={(tags) => setPatientForm({ ...patientForm, tags })}
                                                        fetchSuggestionsUrl={`${getApiUrl()}/tags`}
                                                        className="bg-white border border-slate-200 rounded-2xl min-h-[56px] p-2"
                                                        placeholder="Ej: #Deportista, #Vegano..."
                                                    />
                                                </div>
                                            </section>
                                            <div className="hidden grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correo</p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-800 truncate">{patientData.email || "No registrado"}</p>
                                                </div>
                                                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teléfono</p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-800">{patientData.phone || "No registrado"}</p>
                                                </div>
                                            </div>

                                            <div className="hidden grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Estatura</label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            className="h-11 bg-white border-slate-200 rounded-2xl font-bold"
                                                            placeholder="Ej: 168"
                                                            value={patientForm.height}
                                                            onChange={(e) => setPatientForm({ ...patientForm, height: e.target.value })}
                                                        />
                                                        <span className="shrink-0 rounded-xl bg-white px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">cm</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Foco nutricional</label>
                                                    <Input
                                                        className="h-11 bg-white border-slate-200 rounded-2xl font-semibold"
                                                        placeholder="Ej: Déficit calórico"
                                                        value={patientForm.nutritionalFocus}
                                                        onChange={(e) => setPatientForm({ ...patientForm, nutritionalFocus: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="hidden grid-cols-1 gap-3">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Metas fitness</label>
                                                    <textarea
                                                        className="w-full h-20 rounded-2xl bg-white border border-slate-200 p-3.5 font-medium text-slate-700 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all resize-none text-sm"
                                                        placeholder="Ej: Correr 10k, mejorar fuerza..."
                                                        value={patientForm.fitnessGoals}
                                                        onChange={(e) => setPatientForm({ ...patientForm, fitnessGoals: e.target.value })}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Gustos y preferencias</label>
                                                    <textarea
                                                        className="w-full h-24 rounded-2xl bg-white border border-slate-200 p-4 font-medium text-slate-700 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all resize-none text-sm"
                                                        placeholder="Ej: No le gusta el brócoli, ama el chocolate..."
                                                        value={patientForm.likes}
                                                        onChange={(e) => setPatientForm({ ...patientForm, likes: e.target.value })}
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Restricciones de salud</label>
                                                    <TagInput
                                                        value={patientForm.dietRestrictions}
                                                        onChange={(tags) => setPatientForm({ ...patientForm, dietRestrictions: tags })}
                                                        fetchSuggestionsUrl={`${getApiUrl()}/tags`}
                                                        className="bg-white border border-slate-200 rounded-2xl min-h-[56px] p-2"
                                                        placeholder="Ej: Celiaquía, Diabetes..."
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Etiquetas</label>
                                                    <TagInput
                                                        value={patientForm.tags}
                                                        onChange={(tags) => setPatientForm({ ...patientForm, tags: tags })}
                                                        fetchSuggestionsUrl={`${getApiUrl()}/tags`}
                                                        className="bg-white border border-slate-200 rounded-2xl min-h-[56px] p-2"
                                                        placeholder="Ej: #Deportista, #Vegano..."
                                                    />
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Resumen clínico</label>
                                                    <textarea
                                                        className="w-full h-20 rounded-2xl bg-white border border-slate-200 p-3.5 font-medium text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none text-sm"
                                                        placeholder="Resumen del estado clínico del paciente..."
                                                        value={patientForm.clinicalSummary}
                                                        onChange={(e) => setPatientForm({ ...patientForm, clinicalSummary: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </details>
                                    ) : (
                                        <div className="space-y-4">
                                            <section className="rounded-[24px] border border-slate-100 bg-white p-4">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                                    Información personal del paciente
                                                </p>
                                                <div className="mt-3 space-y-2">
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                        <p className="text-base font-bold text-slate-900">{patientForm.fullName || patientData.fullName}</p>
                                                        <span className="text-sm font-medium text-slate-500">
                                                            {formatRut(patientForm.documentId || patientData.documentId || "") || "RUT no registrado"}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-600">
                                                        {patientForm.email || patientData.email || "Correo no registrado"}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                                            {patientForm.gender || patientData.gender || "Sexo no registrado"}
                                                        </span>
                                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                                            {patientForm.height || patientData.height ? `${patientForm.height || patientData.height} cm` : "Estatura no registrada"}
                                                        </span>
                                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                                            {patientForm.weight || patientData.weight ? `${patientForm.weight || patientData.weight} kg` : "Peso no registrado"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </section>

                                            <section className="rounded-[24px] border border-slate-100 bg-white p-4">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                                    Resumen clínico del paciente
                                                </p>
                                                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                                                    {patientForm.clinicalSummary || patientData.clinicalSummary || "Sin resumen clínico registrado."}
                                                </p>
                                            </section>

                                            <section className="rounded-[24px] border border-slate-100 bg-white p-4 space-y-4">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                                    Preferencias y contexto
                                                </p>

                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                                                        Restricciones
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {(patientForm.dietRestrictions.length > 0 ? patientForm.dietRestrictions : patientData.dietRestrictions || []).length > 0 ? (
                                                            (patientForm.dietRestrictions.length > 0 ? patientForm.dietRestrictions : patientData.dietRestrictions || []).map((item) => (
                                                                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                                                    {item}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <p className="text-sm text-slate-500">Sin restricciones registradas.</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Foco nutricional</p>
                                                        <p className="mt-1 text-sm text-slate-700">{patientForm.nutritionalFocus || patientData.nutritionalFocus || "No definido"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Metas fitness</p>
                                                        <p className="mt-1 text-sm text-slate-700">{patientForm.fitnessGoals || patientData.fitnessGoals || "No definidas"}</p>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Gustos</p>
                                                        <p className="mt-1 text-sm text-slate-700">{patientForm.likes || patientData.likes || "Sin gustos registrados"}</p>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Etiquetas</p>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {(patientForm.tags.length > 0 ? patientForm.tags : patientData.tags || []).length > 0 ? (
                                                                (patientForm.tags.length > 0 ? patientForm.tags : patientData.tags || []).map((item) => (
                                                                    <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                                                        {item}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <p className="text-sm text-slate-500">Sin etiquetas registradas.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    )}
                                </>
                            </div>
                        </details>
                        ) : (
                        <div
                            id="consulta-paciente"
                            className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden"
                        >
                            <div className="p-4 lg:p-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between gap-3">
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                    <User className="w-6 h-6 text-indigo-500" />
                                    Selecciona un paciente
                                </h3>
                                <Button
                                    type="button"
                                    onClick={() => router.push("/dashboard/pacientes/new")}
                                    className="h-10 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Crear paciente manualmente
                                </Button>
                            </div>
                        </div>
                        )}

                    </div>
                </div> {/* End Grid */}
            </form>
        </div>
    );
}
