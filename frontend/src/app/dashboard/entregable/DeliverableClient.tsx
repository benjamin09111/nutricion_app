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
    Calendar,
    Save,
    Image as ImageIcon,
    Pencil,
    Layout,
    Palette,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SmartPatientHeader from '@/components/layout/SmartPatientHeader';
import { PremiumGuard } from '@/components/common/PremiumGuard';

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
    const [selectedSections, setSelectedSections] = useState<string[]>(
        DELIVERABLE_SECTIONS.filter(s => s.defaultSelected).map(s => s.id)
    );
    const [includeLogo, setIncludeLogo] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // AI Review State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);

    // Simulate AI Review Process
    useEffect(() => {
        if (isReviewModalOpen) {
            setIsReviewing(true);
            const timer = setTimeout(() => {
                setIsReviewing(false);
            }, 3000); // 3 seconds fake analysis
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

    return (
        <div className="max-w-5xl mx-auto pb-32 animate-in fade-in duration-700 space-y-4">
            <SmartPatientHeader />

            <div className="space-y-4">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8 mb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                            <span className="bg-emerald-100 px-2 py-0.5 rounded">Etapa 4</span>
                            <span>Personalización & Entrega</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Configurar Entregable</h1>
                        <p className="text-slate-500 font-medium">Selecciona los módulos que incluirá el PDF final para tu paciente.</p>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "h-10 w-10 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer",
                                includeLogo ? "bg-white border-emerald-500 text-emerald-500" : "bg-slate-100 border-slate-200 text-slate-400"
                            )} onClick={() => setIncludeLogo(!includeLogo)}>
                                <ImageIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-700">Logo Profesional (Opcional)</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Tu marca en el PDF</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Template Info Banner */}
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-4 mb-8 flex items-start sm:items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                        <Palette className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-slate-700">
                            <span className="font-bold text-slate-900">Plantilla por defecto:</span> NutriSaaS Standard.
                            Si deseas un diseño personalizado, puedes <span className="font-semibold text-violet-700 cursor-pointer hover:underline">conectar con Canva</span> para sincronizar tus propias plantillas.
                        </p>
                    </div>
                    <div className="hidden sm:block">
                        <Button variant="ghost" size="sm" className="text-violet-700 hover:bg-violet-100 hover:text-violet-800 font-bold text-xs">
                            Conectar Canva
                        </Button>
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

                {/* Fixed Footbar */}
                <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
                    <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                        <div className="hidden md:flex flex-col">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulos Seleccionados</p>
                            <p className="text-sm font-black text-slate-900">{selectedSections.length} de {DELIVERABLE_SECTIONS.length}</p>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                variant="outline"
                                onClick={() => toast.info("Generando vista previa temporal...")}
                                className="flex-1 md:flex-none rounded-2xl font-bold flex items-center justify-center gap-2 border-slate-200 h-14 px-8 hover:bg-slate-50 transition-all active:scale-95 text-slate-600 min-w-[160px]"
                            >
                                <Eye className="h-4 w-4" />
                                Vista previa
                            </Button>
                            <PremiumGuard feature="canGenerateDiet">
                                <Button
                                    variant="outline"
                                    onClick={handleSaveToCreations}
                                    disabled={isSaving}
                                    className="flex-1 md:flex-none rounded-2xl font-bold flex items-center justify-center gap-2 border-slate-200 h-14 px-8 hover:bg-slate-50 transition-all active:scale-95 text-slate-600 min-w-[200px]"
                                >
                                    {isSaving ? (
                                        <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Guardar en mis creaciones
                                </Button>
                            </PremiumGuard>
                            <Button
                                onClick={() => setIsReviewModalOpen(true)}
                                className="flex-1 md:flex-none bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-2xl font-black shadow-xl shadow-amber-100 flex items-center justify-center gap-2 px-6 h-14 transition-all active:scale-95"
                            >
                                <Brain className="h-5 w-5" />
                                Revisar con IA
                            </Button>
                            <PremiumGuard feature="canExportPDF">
                                <Button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 px-12 h-14 transition-all active:scale-95 min-w-[220px]"
                                >
                                    {isExporting ? (
                                        <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Download className="h-5 w-5" />
                                    )}
                                    Exportar PDF
                                </Button>
                            </PremiumGuard>
                        </div>
                    </div>
                </div>

                {/* Floating indicator for 'Manual preview' - subtle */}
                <div className="mt-20 flex justify-center">
                    <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 rounded-full border border-emerald-100 text-emerald-700">
                        <Sparkles className="h-4 w-4 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center">
                            El PDF se generará con la plantilla oficial de NutriSaaS
                        </span>
                    </div>
                </div>

                {/* AI Review Modal */}
                {isReviewModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
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
        </div>
    );
}
