'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
    FileText,
    Plus,
    Search,
    Filter,
    Pencil,
    Trash2,
    CheckCircle2,
    Sparkles,
    Brain,
    Activity,
    Lightbulb,
    HelpCircle,
    X,
    Save,
    Layout,
    ExternalLink,
    ChevronDown,
    MoreVertical,
    Upload,
    Globe,
    User as UserIcon,
    Loader2,
    Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ModuleLayout } from '@/components/shared/ModuleLayout';
import { useAdmin } from '@/context/AdminContext';
import Cookies from 'js-cookie';

interface Resource {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    images: string[];
    isPublic: boolean;
    isDefault?: boolean;
    nutritionistId?: string | null;
}

const CATEGORIES = [
    { id: 'all', label: 'Todos', icon: Layout },
    { id: 'mitos', label: 'Mitos vs Realidad', icon: HelpCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 'habitos', label: 'Checklist de Hábitos', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'emocional', label: 'Nutrición Emocional', icon: Brain, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'consejos', label: 'Consejos Prácticos', icon: Lightbulb, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'ejercicios', label: 'Actividad Física', icon: Activity, color: 'text-violet-500', bg: 'bg-violet-50' },
];

export function ResourcesClient() {
    const { isAdmin } = useAdmin();
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const DEFAULT_CONSTRAINTS = ['Diabético', 'Hipertensión', 'Vegetariano', 'Celiaco', 'Sin Gluten'];

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'consejos',
        tags: [] as string[],
        images: [] as string[],
        isPublic: false,
        isGlobal: false
    });

    const fetchResources = async (retries = 3) => {
        setIsLoading(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

            const response = await fetch(`${apiUrl}/resources`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setResources(data);
            }
        } catch (error) {
            if (retries > 0) {
                setTimeout(() => fetchResources(retries - 1), 2000);
            } else {
                console.warn('Backend no disponible para cargar recursos aún.');
            }
        } finally {
            if (retries === 0) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/tags`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const tagsData = await response.json();
                const backendTags = tagsData.map((t: any) => t.name);
                setAvailableTags(Array.from(new Set([...DEFAULT_CONSTRAINTS, ...backendTags])));
            } else {
                setAvailableTags(DEFAULT_CONSTRAINTS);
            }
        } catch (error) {
            console.error('Error fetching tags', error);
            setAvailableTags(DEFAULT_CONSTRAINTS);
        }
    };

    const filteredResources = useMemo(() => {
        return resources.filter(res => {
            const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                res.content.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'all' || res.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [resources, searchQuery, activeCategory]);

    const handleOpenModal = (resource?: Resource) => {
        if (resource) {
            setEditingResource(resource);
            setFormData({
                title: resource.title,
                content: resource.content,
                category: resource.category,
                tags: resource.tags || [],
                images: resource.images || [],
                isPublic: resource.isPublic || false,
                isGlobal: resource.nutritionistId === null
            });
        } else {
            setEditingResource(null);
            setFormData({
                title: '',
                content: '',
                category: 'consejos',
                tags: [],
                images: [],
                isPublic: false,
                isGlobal: isAdmin
            });
        }
        setIsModalOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

            const uploadForm = new FormData();
            uploadForm.append('file', file);

            const response = await fetch(`${apiUrl}/uploads/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: uploadForm
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, data.url]
                }));
                toast.success('Imagen subida correctamente');
            } else {
                toast.error('Error al subir la imagen');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Error al subir la imagen');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            toast.error('Por favor completa el título y el contenido');
            return;
        }

        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

            const method = editingResource ? 'PATCH' : 'POST';
            const url = editingResource
                ? `${apiUrl}/resources/${editingResource.id}`
                : `${apiUrl}/resources`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success(editingResource ? 'Recurso actualizado' : 'Recurso creado');
                setIsModalOpen(false);
                fetchResources();
            } else {
                toast.error('Error al guardar el recurso');
            }
        } catch (error) {
            console.error('Error saving resource:', error);
            toast.error('Error al guardar el recurso');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este recurso?')) return;

        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

            const response = await fetch(`${apiUrl}/resources/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Recurso eliminado');
                fetchResources();
            }
        } catch (error) {
            console.error('Error deleting resource:', error);
            toast.error('Error al eliminar el recurso');
        }
    };

    return (
        <ModuleLayout
            title="Biblioteca de Recursos"
            description="Gestiona los contenidos educativos para tus pacientes."
            rightNavItems={[
                {
                    id: 'add',
                    icon: Plus,
                    label: 'Nuevo Recurso',
                    variant: 'emerald',
                    onClick: () => handleOpenModal()
                }
            ]}
        >
            <div className="space-y-6 mt-6 pb-20">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        <Input
                            placeholder="Buscar recursos..."
                            className="h-12 pl-12 rounded-2xl border-slate-200 bg-white/50 backdrop-blur-sm focus:bg-white transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                                    activeCategory === cat.id
                                        ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200"
                                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                                )}
                            >
                                <cat.icon className={cn("h-4 w-4", activeCategory === cat.id ? "text-white" : cat.color)} />
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Resources Grid - Original style */}
                {isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-48 rounded-3xl bg-slate-50 animate-pulse border border-slate-100" />
                        ))}
                    </div>
                ) : filteredResources.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredResources.map(resource => {
                            const catInfo = CATEGORIES.find(c => c.id === resource.category) || CATEGORIES[4];
                            const isGlobal = resource.nutritionistId === null;

                            return (
                                <div
                                    key={resource.id}
                                    className="group relative bg-white border border-slate-100 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col h-full"
                                >
                                    <div className="p-6 flex-1 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className={cn("p-3 rounded-2xl", catInfo.bg)}>
                                                <catInfo.icon className={cn("h-5 w-5", catInfo.color)} />
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(resource)}
                                                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-colors"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(resource.id)}
                                                    className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                {isGlobal && (
                                                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                                                        <Globe className="h-2 w-2" /> Global
                                                    </span>
                                                )}
                                                <h3 className="font-black text-slate-900 leading-tight">
                                                    {resource.title}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                                                {resource.content.replace(/[#*`]/g, '')}
                                            </p>
                                        </div>

                                        <div className="pt-4 flex flex-wrap gap-2">
                                            {resource.tags?.map(tag => (
                                                <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                                    #{tag}
                                                </span>
                                            ))}
                                            {resource.isPublic && !isGlobal && (
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-1 rounded-md flex items-center gap-1">
                                                    <Sparkles className="h-3 w-3" /> Público
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {catInfo.label}
                                            </span>
                                            {resource.images?.length > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                                    <ImageIcon className="h-3 w-3" /> {resource.images.length}
                                                </div>
                                            )}
                                        </div>
                                        <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 hover:underline">
                                            Ver más <ExternalLink className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
                            <FileText className="h-10 w-10 text-slate-300" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-black text-slate-900">No hay recursos actualmente</h3>
                            <p className="text-sm text-slate-500 max-w-xs">No hemos encontrado nada, intenta ajustar la búsqueda o añade uno nuevo al sistema.</p>
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-2xl font-bold border-slate-200"
                            onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                        >
                            Limpiar filtros
                        </Button>
                    </div>
                )}
            </div>

            {/* Modal for Add/Edit - Simple style but with Image Upload button */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingResource ? 'Editar Recurso' : 'Nuevo Recurso'}
                className="max-w-3xl"
            >
                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título</label>
                            <Input
                                placeholder="Ej: La verdad sobre el ayuno intermitente"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="rounded-xl border-slate-200 h-11 text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                            <select
                                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Image Upload Button & Preview */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Biblioteca de Imágenes</label>
                        <div className="flex flex-wrap gap-3">
                            {formData.images.map((img, idx) => (
                                <div key={idx} className="relative h-16 w-16 rounded-xl overflow-hidden border border-slate-200 group">
                                    <img src={img} className="h-full w-full object-cover" />
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                                        className="absolute top-1 right-1 p-0.5 bg-white/90 rounded-lg text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="h-16 w-16 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all"
                            >
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                <span className="text-[8px] font-black uppercase mt-1">Añadir</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Etiquetas / Restricciones Asociadas</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.tags?.map((tag, index) => (
                                <span key={index} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                                    {tag}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => {
                                        setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) });
                                    }} />
                                </span>
                            ))}
                        </div>
                        <datalist id="available-constraints">
                            {availableTags.map(tag => (
                                <option key={tag} value={tag} />
                            ))}
                        </datalist>
                        <Input
                            list="available-constraints"
                            placeholder="Escribe o selecciona resticción y presiona Enter (ej: Diabético)"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const value = (e.target as HTMLInputElement).value.trim();
                                    if (value && !formData.tags.includes(value)) {
                                        setFormData({ ...formData, tags: [...formData.tags, value] });
                                        (e.target as HTMLInputElement).value = '';
                                    }
                                }
                            }}
                            className="rounded-xl border-slate-200 h-11 text-slate-900"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenido (Markdown)</label>
                        <textarea
                            className="w-full h-48 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all outline-none resize-none leading-relaxed"
                            placeholder="Escribe aquí el contenido educativo..."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-blue-600" />
                                </div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase">Público</h4>
                            </div>
                            <button
                                onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                                className={cn(
                                    "w-10 h-5 rounded-full transition-all relative",
                                    formData.isPublic ? "bg-emerald-500" : "bg-slate-300"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-all",
                                    formData.isPublic ? "translate-x-5" : ""
                                )} />
                            </button>
                        </div>

                        {isAdmin && (
                            <div className="flex-1 flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <Globe className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <h4 className="text-[10px] font-black text-slate-900 uppercase">Global</h4>
                                </div>
                                <button
                                    onClick={() => setFormData({ ...formData, isGlobal: !formData.isGlobal })}
                                    className={cn(
                                        "w-10 h-5 rounded-full transition-all relative",
                                        formData.isGlobal ? "bg-emerald-600" : "bg-slate-300"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-all",
                                        formData.isGlobal ? "translate-x-5" : ""
                                    )} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button variant="ghost" className="rounded-xl font-bold text-slate-400" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button className="bg-slate-900 text-white rounded-xl font-black px-8 gap-2 shadow-lg shadow-slate-200" onClick={handleSave}>
                            <Save className="h-4 w-4" />
                            Guardar
                        </Button>
                    </div>
                </div>
            </Modal>
        </ModuleLayout>
    );
}
