'use client';

import { useState } from 'react';
import {
    Library,
    Plus,
    Search,
    FileText,
    Sparkles,
    Tag,
    ChevronRight,
    Upload,
    Megaphone,
    Filter,
    BookOpen,
    Info,
    Lock,
    Save,
    X,
    LayoutTemplate
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Resource {
    id: string;
    title: string;
    type: 'condition' | 'restriction' | 'general'; // Renamed from category
    tags: string[];
    content: string;
    source: 'ai' | 'user' | 'system';
    lastUpdated?: string;
}

const MOCK_RESOURCES: Resource[] = [
    {
        id: '1',
        title: 'Recomendaciones Diabetes Tipo 2',
        type: 'condition',
        tags: ['Diabetes', 'Insulino Resistencia'],
        content: 'La diabetes requiere un control estricto de los carbohidratos complejos. Se recomienda priorizar índice glucémico bajo...',
        source: 'user',
        lastUpdated: 'Hace 2 días'
    },
    {
        id: '4',
        title: 'Lista de Sustitutos Veganos',
        type: 'restriction',
        tags: ['Vegano', 'Proteína Vegetal'],
        content: 'Para reemplazar huevo: 1 cda semillas de chía + 3 cdas agua. Para reemplazar carne: Lentejas, Tempeh, Seitán...',
        source: 'system',
        lastUpdated: 'Hace 1 semana'
    },
    {
        id: '5',
        title: 'Higiene del Sueño',
        type: 'general',
        tags: ['Sueño', 'Cortisol', 'Hábitos'],
        content: '1. Evitar pantallas 1 hora antes de dormir. 2. Mantener habitación a 20°C. 3. Suplementación con Magnesio si es indicado...',
        source: 'ai',
        lastUpdated: 'Hace 2 semanas'
    }
];

export default function RecursosPage() {
    const [activeTab, setActiveTab] = useState<'biblioteca' | 'tono' | 'marketing'>('biblioteca');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<'all' | 'condition' | 'restriction' | 'general'>('all');

    // Tone State
    const [toneText, setToneText] = useState("Soy una nutricionista clínica empática pero firme. Hablo con lenguaje profesional pero accesible. Uso emojis moderados 🌿. Priorizo la educación sobre la restricción.");
    const [isSavingTone, setIsSavingTone] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Partial<Resource>>({ type: 'condition', source: 'user', tags: [] });

    // Filter Logic
    const filteredResources = MOCK_RESOURCES.filter(r => {
        const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = selectedType === 'all' || r.type === selectedType;
        return matchesSearch && matchesType;
    });

    const handleSaveTone = () => {
        setIsSavingTone(true);
        setTimeout(() => {
            setIsSavingTone(false);
            toast.success("Tono de voz actualizado correctamente");
        }, 800);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Library className="h-10 w-10 text-emerald-600" />
                        Centro de Recursos
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl">
                        Gestiona los bloques de contenido que se incluirán en tus entregables.
                        Asocia información a patologías y restricciones para automatizar tus pautas.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => {
                            setEditingResource({ type: 'condition', source: 'user', tags: [] });
                            setIsModalOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 flex items-center gap-2 h-12"
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Contenido
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 w-full md:w-fit overflow-x-auto">
                {[
                    { id: 'biblioteca', label: 'Biblioteca de Contenido', icon: Library },
                    { id: 'tono', label: 'Voz de Marca', icon: Sparkles },
                    { id: 'marketing', label: 'Marketing', icon: Megaphone, locked: true }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => !tab.locked && setActiveTab(tab.id as any)}
                        disabled={tab.locked}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap relative",
                            activeTab === tab.id
                                ? "bg-white text-emerald-600 shadow-sm border border-emerald-100"
                                : "text-slate-400 hover:text-slate-600",
                            tab.locked && "opacity-60 cursor-not-allowed hover:text-slate-400"
                        )}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                        {tab.locked && <Lock className="h-3 w-3 ml-1 text-slate-300" />}
                    </button>
                ))}
            </div>

            {/* MAIN CONTENT AREA */}
            {activeTab === 'biblioteca' && (
                <div className="space-y-6">
                    {/* Library Filters */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Buscar por patología, tag o título..."
                                className="pl-12 h-11 rounded-xl border-slate-200 focus:ring-emerald-500 bg-slate-50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                            {[
                                { id: 'all', label: 'Todo' },
                                { id: 'condition', label: 'Patologías' },
                                { id: 'restriction', label: 'Restricciones' },
                                { id: 'general', label: 'Educación General' },
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setSelectedType(filter.id as any)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap border",
                                        selectedType === filter.id
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                    )}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Resources Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Info Banner */}
                        <div className="md:col-span-2 lg:col-span-3 bg-emerald-50/50 border border-emerald-100 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6">
                            <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                <Sparkles className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div className="space-y-1 flex-1">
                                <h3 className="font-bold text-emerald-900">Automatización de Contenido</h3>
                                <p className="text-sm text-emerald-700/80">
                                    Si asignas un paciente con tags (ej: "Diabético"), el sistema buscará automáticamente recursos con ese tag aquí y los sugerirá en el entregable.
                                    Si no existe contenido, verás la opción "Generar con IA" directamente en el módulo de entregable.
                                </p>
                            </div>
                        </div>

                        {filteredResources.map((resource) => (
                            <div key={resource.id} className="bg-white border border-slate-200 rounded-[32px] p-6 hover:shadow-xl hover:border-emerald-200 transition-all group flex flex-col h-full">
                                <div className="space-y-4 flex-1">
                                    <div className="flex justify-between items-start">
                                        <div className={cn(
                                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                            resource.type === 'condition' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                resource.type === 'restriction' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                    "bg-blue-50 text-blue-600 border-blue-100"
                                        )}>
                                            {resource.type === 'condition' ? 'Patología' :
                                                resource.type === 'restriction' ? 'Restricción' : 'General'}
                                        </div>
                                        {resource.source === 'ai' && (
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold">IA Generado</span>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 leading-tight mb-2 group-hover:text-emerald-700 transition-colors">
                                            {resource.title}
                                        </h4>
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {resource.tags.map(tag => (
                                                <span key={tag} className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">#{tag}</span>
                                            ))}
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-4 leading-relaxed font-medium">
                                            {resource.content}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-xs text-slate-300 font-bold">{resource.lastUpdated}</span>
                                    <button
                                        className="flex items-center gap-1 text-xs font-black text-slate-900 hover:text-emerald-600 transition-colors uppercase tracking-widest group/btn"
                                        onClick={() => {
                                            setEditingResource(resource);
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        Editar Contenido
                                        <ChevronRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* New Item Card */}
                        <button
                            onClick={() => {
                                setEditingResource({ type: 'condition', source: 'user', tags: [] });
                                setIsModalOpen(true);
                            }}
                            className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-6 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50/10 transition-all group min-h-[300px] cursor-pointer"
                        >
                            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                <Plus className="h-8 w-8 text-current" />
                            </div>
                            <span className="font-black text-xs uppercase tracking-widest text-current">Añadir Nuevo Recurso</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Tone of Voice Tab */}
            {activeTab === 'tono' && (
                <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 bg-purple-100 rounded-2xl flex items-center justify-center shrink-0">
                                <Sparkles className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-slate-900">Personalidad y Tono de la IA</h2>
                                <p className="text-sm text-slate-500 font-medium">
                                    Define cómo quieres que la IA redacte los contenidos generados automáticamente si faltan en tu biblioteca.
                                    Esto afecta a textos de correos, mensajes y secciones del entregable.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Instrucciones de Personalidad</label>
                            <textarea
                                className="w-full min-h-[200px] p-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-purple-500 focus:bg-white text-slate-700 leading-relaxed font-medium transition-all outline-none resize-none shadow-inner"
                                value={toneText}
                                onChange={(e) => setToneText(e.target.value)}
                                placeholder="Ej: Usa un tono profesional pero cercano, enfocado en educación nutricional basada en evidencia. Evita términos alarmistas..."
                            />
                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setToneText("Soy una nutricionista clínica empática pero firme. Hablo con lenguaje profesional pero accesible. Uso emojis moderados 🌿. Priorizo la educación sobre la restricción.")}
                                    className="text-slate-400 hover:text-slate-600 rounded-xl"
                                >
                                    Restaurar Default
                                </Button>
                                <Button
                                    onClick={handleSaveTone}
                                    disabled={isSavingTone}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl px-6"
                                >
                                    {isSavingTone ? "Guardando..." : "Guardar Personalidad"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 flex items-center gap-4">
                        <Info className="h-5 w-5 text-purple-600 shrink-0" />
                        <p className="text-xs font-bold text-purple-800">
                            Tip: Intenta incluir ejemplos de cómo te gustaría que suenen los párrafos. La IA imitará este estilo en todas sus generaciones.
                        </p>
                    </div>
                </div>
            )}

            {/* Locked Marketing Tab */}
            {activeTab === 'marketing' && (
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                    <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center">
                        <Lock className="h-10 w-10 text-slate-300" />
                    </div>
                    <div className="max-w-md space-y-2">
                        <h2 className="text-2xl font-black text-slate-900">Módulo de Marketing</h2>
                        <p className="text-slate-500 font-medium">
                            Próximamente podrás gestionar campañas, plantillas de redes sociales y branding automático desde aquí.
                        </p>
                    </div>
                    <span className="px-4 py-2 bg-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest rounded-full">
                        Próximamente - Fase 3
                    </span>
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="fixed inset-0" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-[32px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900">
                                {editingResource.id ? 'Editar Recurso' : 'Nuevo Bloque de Contenido'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Contenido</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'condition', label: 'Patología Clínica', desc: 'Diabetes, Hipertensión...', color: 'rose' },
                                        { id: 'restriction', label: 'Restricción / Dieta', desc: 'Vegano, Celiaco...', color: 'amber' },
                                        { id: 'general', label: 'Info General', desc: 'Educación, Hábitos, FAQs', color: 'blue' },
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setEditingResource(prev => ({ ...prev, type: type.id as any }))}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden",
                                                editingResource.type === type.id
                                                    ? `border-${type.color}-500 bg-${type.color}-50`
                                                    : "border-slate-100 hover:border-slate-200 bg-white"
                                            )}
                                        >
                                            <p className={cn("font-black text-sm mb-1", editingResource.type === type.id ? `text-${type.color}-700` : "text-slate-700")}>
                                                {type.label}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold">{type.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Título</label>
                                <Input
                                    className="font-bold text-lg h-14 rounded-2xl bg-slate-50 border-slate-200"
                                    placeholder="Ej: Recomendaciones Celiacos"
                                    defaultValue={editingResource.title}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tags Asociados (Trigger Automático)</label>
                                <Input
                                    className="font-medium h-12 rounded-xl bg-slate-50 border-slate-200"
                                    placeholder="Escribe tags separados por coma... (ej: Diabetes, Azúcar)"
                                    defaultValue={editingResource.tags?.join(', ')}
                                />
                                <p className="text-[10px] text-slate-400 font-medium ml-1">
                                    * Si un paciente tiene uno de estos tags, este contenido se sugerirá automáticamente en su entregable.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Contenido del Bloque</label>
                                <textarea
                                    className="w-full min-h-[200px] p-5 rounded-2xl bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-slate-700 leading-relaxed font-medium transition-all outline-none resize-none"
                                    placeholder="Escribe aquí el contenido educativo, recomendaciones o lista de sustitutos..."
                                    defaultValue={editingResource.content}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
                            <Button variant="ghost" className="rounded-xl font-bold text-slate-500" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button className="bg-slate-900 text-white rounded-xl font-black px-8">
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Contenido
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
