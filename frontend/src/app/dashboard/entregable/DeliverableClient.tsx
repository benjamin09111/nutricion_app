'use client';

import { useState, useEffect } from 'react';
import {
    ClipboardCheck,
    Download,
    Eye,
    CheckCircle2,
    QrCode,
    Sparkles,
    FileText,
    ShoppingCart,
    Clock,
    User,
    Activity,
    Brain,
    Apple,
    HelpCircle,
    Info,
    Save,
    Image as ImageIcon,
    Pencil,
    Layout,
    Palette,
    X,
    ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ModuleLayout } from '@/components/shared/ModuleLayout';
import { ModuleFooter } from '@/components/shared/ModuleFooter';
import { ActionDockItem } from '@/components/ui/ActionDock';
import { PremiumGuard } from '@/components/common/PremiumGuard';
import { useAdmin } from '@/context/AdminContext';
import { useRouter } from 'next/navigation';

interface SectionItem {
    id: string;
    label: string;
    description: string;
    icon: any;
    defaultSelected: boolean;
    category: 'core' | 'info';
    editable?: boolean;
}

const DELIVERABLE_SECTIONS: SectionItem[] = [
    { id: 'cover', label: 'Portada del Entregable', description: 'Personaliza la primera página del mini-libro.', icon: Layout, defaultSelected: true, category: 'core', editable: true },
    { id: 'shoppingList', label: 'Lista de Supermercado', description: 'Listado completo de alimentos y cantidades.', icon: ShoppingCart, defaultSelected: true, category: 'core' },
    { id: 'patientInfo', label: 'Información sobre el Paciente', description: 'Datos clave, objetivos y medidas actuales.', icon: User, defaultSelected: true, category: 'core' },
    { id: 'qrCode', label: 'QR Lista de Compras', description: 'Acceso rápido para cargar el carrito en retail.', icon: QrCode, defaultSelected: true, category: 'core' },
    { id: 'recipes', label: 'Recetas, Horarios y Platos', description: 'Distribución diaria y preparación de comidas.', icon: Clock, defaultSelected: true, category: 'core' },
    { id: 'hormonalIntel', label: 'Inteligencia Hormonal', description: 'Ajustes según fase del ciclo menstrual.', icon: Sparkles, defaultSelected: true, category: 'core' },
    { id: 'pathologyInfo', label: 'Información sobre Patologías', description: 'Guía específica sobre restricciones seleccionadas.', icon: Info, defaultSelected: false, category: 'info' },
    { id: 'exercises', label: 'Ejercicios Sugeridos', description: 'Rutina complementaria para el plan.', icon: Activity, defaultSelected: false, category: 'info' },
    { id: 'myths', label: 'Mitos vs Realidad', description: 'Aclaración de conceptos nutricionales comunes.', icon: HelpCircle, defaultSelected: false, category: 'info' },
    { id: 'faq', label: 'Preguntas Frecuentes', description: 'Respuestas a dudas habituales del paciente.', icon: HelpCircle, defaultSelected: false, category: 'info' },
    { id: 'substitutes', label: 'Sustitutos Comunes', description: 'Opciones para variar el plan sin comprometerlo.', icon: Apple, defaultSelected: false, category: 'info' },
    { id: 'psychology', label: 'Aspectos Psicológicos', description: 'Manejo de la relación con la comida.', icon: Brain, defaultSelected: false, category: 'info' },
    { id: 'habits', label: 'Checklist de Hábitos', description: 'Seguimiento diario de rutinas saludables.', icon: ClipboardCheck, defaultSelected: false, category: 'info' },
    { id: 'hungerReal', label: 'Hambre Real vs Capricho', description: 'Guía para identificar hambre emocional.', icon: Brain, defaultSelected: false, category: 'info' },
];

export default function DeliverableClient() {
    const router = useRouter();
    const { role } = useAdmin();
    const [selectedSections, setSelectedSections] = useState<string[]>(
        DELIVERABLE_SECTIONS.filter(s => s.defaultSelected).map(s => s.id)
    );
    const [includeLogo, setIncludeLogo] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    // Load project draft on mount
    useEffect(() => {
        const storedDraft = localStorage.getItem('nutri_active_draft');
        if (storedDraft) {
            try {
                const draft = JSON.parse(storedDraft);
                if (draft.deliverable) {
                    if (draft.deliverable.selectedSections) setSelectedSections(draft.deliverable.selectedSections);
                    if (draft.deliverable.includeLogo !== undefined) setIncludeLogo(draft.deliverable.includeLogo);
                }
            } catch (e) {
                console.error("Error loading project draft", e);
            }
        }
    }, []);

    // Auto-save deliverable config to draft
    useEffect(() => {
        const storedDraft = localStorage.getItem('nutri_active_draft');
        let draft = storedDraft ? JSON.parse(storedDraft) : {};

        draft.deliverable = {
            selectedSections,
            includeLogo,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('nutri_active_draft', JSON.stringify(draft));
    }, [selectedSections, includeLogo]);

    // AI Review State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);

    // Load stored patient
    useEffect(() => {
        const storedPatient = localStorage.getItem('nutri_patient');
        if (storedPatient) {
            try {
                setSelectedPatient(JSON.parse(storedPatient));
            } catch (e) {
                console.error("Failed to parse stored patient", e);
            }
        }

        if (isReviewModalOpen) {
            setIsReviewing(true);
            const timer = setTimeout(() => {
                setIsReviewing(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isReviewModalOpen]);

    const toggleSection = (id: string) => {
        setSelectedSections(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleExport = () => {
        setIsExporting(true);
        const promise = new Promise((resolve) => setTimeout(resolve, 2000));

        toast.promise(
            promise,
            {
                loading: 'Generando PDF profesional...',
                success: 'PDF exportado exitosamente.',
                error: 'Error al generar el PDF.',
            }
        );

        promise.then(() => setIsExporting(false));
    };

    const handleSaveToCreations = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Guardado en mis creaciones correctamente.");
        }, 1000);
    };

    const handleEditSection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        toast.info(`Abriendo editor de ${id}...`);
    };

    const printJson = () => {
        const storedDraft = localStorage.getItem('nutri_active_draft');
        console.group('📊 PROJECT DRAFT JSON (STAGE 1-4)');
        console.log(storedDraft ? JSON.parse(storedDraft) : "No draft found");
        console.groupEnd();
        toast.info("JSON completo del proyecto impreso en consola.");
    };

    const handlePatientLoad = () => {
        const patientData = {
            name: 'Juan Pérez',
            age: 34,
            weight: 88,
            height: 1.82,
            targetProtein: 180,
            targetCarbs: 300,
            targetFats: 80,
            targetCalories: 2600
        };

        setSelectedPatient(patientData);
        localStorage.setItem('nutri_patient', JSON.stringify(patientData));
        window.dispatchEvent(new Event('patient-updated'));
        toast.success("Perfil de Juan Pérez cargado.");
    };

    const actionDockItems: ActionDockItem[] = [
        {
            id: 'preview',
            icon: Eye,
            label: 'Vista Previa',
            variant: 'slate',
            onClick: () => toast.info("Generando vista previa temporal...")
        },
        {
            id: 'save-creations',
            icon: Save,
            label: 'Guardar Creación',
            variant: 'slate',
            onClick: handleSaveToCreations
        },
        {
            id: 'review-ia',
            icon: Brain,
            label: 'Analizar con IA',
            variant: 'amber',
            onClick: () => setIsReviewModalOpen(true)
        },
        {
            id: 'print-json',
            icon: FileText,
            label: 'Imprimir JSON',
            variant: 'slate',
            onClick: printJson
        }
    ];

    return (
        <ModuleLayout
            title="Personalización & Entrega"
            description="Configura el entregable final para tu paciente."
            step={{ number: 4, label: "Entregable PDF", icon: ClipboardCheck, color: "text-slate-600" }}
            rightNavItems={actionDockItems}
            className="max-w-5xl"
            footer={
                <ModuleFooter>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="h-12 px-6 border-slate-200 text-slate-600 font-bold rounded-2xl flex items-center gap-2 hover:bg-slate-50 transition-all"
                            onClick={handlePatientLoad}
                        >
                            <User className="h-4 w-4" />
                            {selectedPatient ? selectedPatient.name : "Asignar a un paciente"}
                        </Button>

                        <Button
                            className="h-12 px-8 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 uppercase tracking-widest text-xs flex items-center gap-2"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Download className="h-4 w-4" />}
                            EXPORTAR PDF
                        </Button>
                    </div>
                </ModuleFooter>
            }
        >
            <div className="space-y-12 mt-8">
                {/* Custom Options */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer",
                                includeLogo ? "bg-white border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10" : "bg-slate-50 border-slate-200 text-slate-400"
                            )} onClick={() => setIncludeLogo(!includeLogo)}>
                                <ImageIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase text-slate-900">Logo del Nutricionista</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Incluir marca personal</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                                <Palette className="h-6 w-6 text-violet-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xs font-black uppercase text-slate-900">Plantilla Visual</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Standard NutriSaaS</p>
                            </div>
                            <Button variant="ghost" className="text-[10px] font-black text-violet-600 uppercase hover:bg-violet-50 px-3 h-8">Cambiar</Button>
                        </div>
                    </div>
                </div>

                {/* Main Selection Grid */}
                <div className="space-y-12">
                    {/* Core Modules (Checked by default) */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <FileText className="h-5 w-5 text-emerald-600" />
                            </div>
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Contenido Esencial</h3>
                        </div>

                        <div className="flex flex-col gap-3">
                            {DELIVERABLE_SECTIONS.filter(s => s.category === 'core').map((section) => (
                                <div
                                    key={section.id}
                                    onClick={() => toggleSection(section.id)}
                                    className={cn(
                                        "p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 group",
                                        selectedSections.includes(section.id)
                                            ? "bg-white border-emerald-500 shadow-lg shadow-emerald-500/5"
                                            : "bg-slate-50 border-slate-100 hover:border-slate-200 opacity-60"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                        selectedSections.includes(section.id) ? "bg-emerald-500 text-white" : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm"
                                    )}>
                                        <section.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight">{section.label}</h4>
                                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{section.description}</p>
                                    </div>

                                    {section.editable && selectedSections.includes(section.id) && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => handleEditSection(e, section.id)}
                                            className="h-8 px-3 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-bold text-[10px] uppercase flex items-center gap-2"
                                        >
                                            <Pencil className="h-3 w-3" />
                                            Editar
                                        </Button>
                                    )}

                                    <div className={cn(
                                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        selectedSections.includes(section.id) ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200"
                                    )}>
                                        {selectedSections.includes(section.id) && <CheckCircle2 className="h-4 w-4 fill-white" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Info / Resource Modules (Unchecked by default) */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Sparkles className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Educación & Recursos Sugeridos</h3>
                        </div>

                        <div className="flex flex-col gap-3">
                            {DELIVERABLE_SECTIONS.filter(s => s.category === 'info').map((section) => (
                                <div
                                    key={section.id}
                                    onClick={() => toggleSection(section.id)}
                                    className={cn(
                                        "p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 group",
                                        selectedSections.includes(section.id)
                                            ? "bg-white border-blue-500 shadow-lg shadow-blue-500/5"
                                            : "bg-slate-50 border-slate-100 hover:border-slate-200 opacity-60"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                        selectedSections.includes(section.id) ? "bg-blue-500 text-white" : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm border border-slate-100"
                                    )}>
                                        <section.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">{section.label}</h4>
                                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">{section.description}</p>
                                    </div>
                                    <div className={cn(
                                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        selectedSections.includes(section.id) ? "border-blue-500 bg-blue-500 text-white" : "border-slate-200"
                                    )}>
                                        {selectedSections.includes(section.id) && <CheckCircle2 className="h-4 w-4 fill-white" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Floating indicator for 'Manual preview' - subtle */}
                <div className="mt-20 flex justify-center pb-12">
                    <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 rounded-full border border-emerald-100 text-emerald-700">
                        <Sparkles className="h-4 w-4 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center">
                            El PDF se generará con la plantilla oficial de NutriSaaS
                        </span>
                    </div>
                </div>

                {/* AI Review Modal */}
                {isReviewModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-4xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-amber-100 rounded-2xl shadow-sm border border-amber-200">
                                        <Brain className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Análisis Inteligente del Plan</h3>
                                        <p className="text-xs font-medium text-slate-500 tracking-widest uppercase">Validando coherencia entre Etapas 1, 2 y 3.</p>
                                    </div>
                                </div>
                                {!isReviewing && (
                                    <button onClick={() => setIsReviewModalOpen(false)} className="p-3 hover:bg-white rounded-2xl transition-colors text-slate-400">
                                        <X className="h-6 w-6" />
                                    </button>
                                )}
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                                {isReviewing ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                        <div className="relative">
                                            <div className="h-20 w-20 border-4 border-slate-100 border-t-amber-500 rounded-full animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Brain className="h-8 w-8 text-amber-500 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="text-center space-y-2">
                                            <h4 className="text-lg font-black text-slate-800">Analizando el "JSON Gigante"...</h4>
                                            <p className="text-sm text-slate-500 max-w-xs mx-auto">Revisando alérgenos, compatibilidad de recetas y micronutrientes.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex gap-4">
                                            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-800 text-sm">Validación General Exitosa</h5>
                                                <p className="text-xs text-slate-600 mt-1">El plan cumple con el 95% de los requerimientos calóricos y proteicos del paciente.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Observaciones Detectadas</h5>

                                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-4">
                                                <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                                    <Activity className="h-4 w-4 text-amber-600" />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-slate-800 text-sm">Alerta de Lactosa</h5>
                                                    <p className="text-xs text-slate-600 mt-1">
                                                        El paciente tiene indicado "Intolerancia Leve", pero la receta <strong>'Risotto de Champiñones'</strong> contiene Queso Parmesano.
                                                        <span className="block mt-2 font-bold text-amber-700 cursor-pointer hover:underline">Sugerencia: Cambiar por opción vegana o sin lactosa.</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-4">
                                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                                    <Info className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-slate-800 text-sm">Déficit de Fibra</h5>
                                                    <p className="text-xs text-slate-600 mt-1">
                                                        El consumo de fibra estimado es de 15g/día. Se recomienda llegar a 25g. Considera agregar más verduras en la Cena.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!isReviewing && (
                                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                    <Button variant="ghost" className="font-bold text-slate-500 rounded-2xl hover:bg-white" onClick={() => setIsReviewModalOpen(false)}>Cerrar</Button>
                                    <Button className="bg-slate-900 text-white font-black rounded-2xl px-8 h-12 shadow-xl shadow-slate-200" onClick={() => setIsReviewModalOpen(false)}>Entendido</Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ModuleLayout>
    );
}
