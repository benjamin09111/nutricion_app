'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Search,
    Download,
    Eye,
    Trash2,
    Edit,
    FileText,
    ShoppingCart,
    ChefHat,
    Folder,

    Filter,
    UploadCloud,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { Creation, CreationType } from '@/features/creations';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CreationsClientProps {
    initialData: Creation[];
}

export default function CreationsClient({ initialData }: CreationsClientProps) {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState<CreationType | 'Todos'>('Todos');
    const [selectedTag, setSelectedTag] = useState<string>('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [localCreations, setLocalCreations] = useState<Creation[]>([]);
    const itemsPerPage = 7;

    // Modal State
    const [downloadModalOpen, setDownloadModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Creation | null>(null);

    const handleDownloadClick = (item: Creation) => {
        setSelectedItem(item);
        setDownloadModalOpen(true);
    };

    useEffect(() => {
        // Mock checking "pending drafts" or recently created items
        const raw = localStorage.getItem('currentDietStep');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                const draft: Creation = {
                    id: 'draft-1',
                    name: `${parsed.dietName} (Borrador)`,
                    type: CreationType.DIET,
                    createdAt: 'Recién creado',
                    size: 'N/A',
                    format: 'JSON',
                    tags: parsed.dietTags || ['Borrador']
                };
                setLocalCreations([draft]);
            } catch (e) { console.error('Error parsing draft', e) }
        }
    }, []);

    const allData = useMemo(() => [...localCreations, ...initialData], [localCreations, initialData]);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        allData.forEach(item => item.tags?.forEach(tag => tags.add(tag)));
        return Array.from(tags);
    }, [allData]);

    const filteredData = useMemo(() => {
        return allData.filter((item) => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = selectedType === 'Todos' || item.type === selectedType;
            const matchesTag = selectedTag === 'Todos' || (item.tags && item.tags.includes(selectedTag));
            return matchesSearch && matchesType && matchesTag;
        });
    }, [allData, searchTerm, selectedType, selectedTag]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedType, selectedTag]);

    const getTypeIcon = (type: CreationType) => {
        switch (type) {
            case CreationType.DIET: return <FileText className="w-4 h-4 text-blue-500" />;
            case CreationType.SHOPPING_LIST: return <ShoppingCart className="w-4 h-4 text-emerald-500" />;
            case CreationType.RECIPE: return <ChefHat className="w-4 h-4 text-amber-500" />;
            default: return <Folder className="w-4 h-4 text-slate-400" />;
        }
    };

    const getTypeStyles = (type: CreationType) => {
        switch (type) {
            case CreationType.DIET: return "bg-blue-50 text-blue-700 ring-blue-600/20";
            case CreationType.SHOPPING_LIST: return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
            case CreationType.RECIPE: return "bg-amber-50 text-amber-700 ring-amber-600/20";
            default: return "bg-slate-50 text-slate-600 ring-slate-500/10";
        }
    };

    const handleEdit = (item: Creation) => {
        // Mock loading data?
        // In real app, we might pass ID via query param or load state.

        switch (item.type) {
            case CreationType.DIET:
                // Pre-load logic if needed
                localStorage.setItem('currentDietEditId', item.id);
                router.push('/dashboard/dieta');
                break;
            case CreationType.SHOPPING_LIST:
                // Assuming module exists or will exist at this route
                router.push('/dashboard/lista-compras');
                break;
            case CreationType.RECIPE:
                router.push('/dashboard/recetas');
                break;
            default:
                // Fallback
                console.warn("Edit not implemented for type", item.type);
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col xl:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto flex-1">
                    {/* Search Name */}
                    <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
                        </div>
                        <Input
                            type="search"
                            placeholder="Buscar por nombre..."
                            className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filter Type */}
                    <div className="w-full md:w-48 relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Filter className="h-4 w-4 text-slate-400" />
                        </div>
                        <select
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-700 appearance-none cursor-pointer text-sm"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as any)}
                        >
                            <option value="Todos">Todos los Tipos</option>
                            <option value={CreationType.DIET}>Dietas</option>
                            <option value={CreationType.SHOPPING_LIST}>Listas de Compra</option>
                            <option value={CreationType.RECIPE}>Recetas</option>
                        </select>
                    </div>

                    {/* Filter Tags */}
                    <div className="w-full md:w-48 relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Folder className="h-4 w-4 text-slate-400" />
                        </div>
                        <select
                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-700 appearance-none cursor-pointer text-sm"
                            value={selectedTag}
                            onChange={(e) => setSelectedTag(e.target.value)}
                        >
                            <option value="Todos">Todas las Etiquetas</option>
                            {allTags.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto justify-end">
                    <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 h-11 px-6 rounded-xl">
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Subir Archivo
                    </Button>
                </div>
            </div>



            {/* Creations Table */}
            <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 sm:rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/50 text-shadow-sm">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Nombre</th>
                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Etiquetas</th>
                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Tipo</th>
                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Fecha</th>
                                <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((item) => (
                                    <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("p-2 rounded-lg bg-slate-50 border border-slate-100",
                                                    item.type === CreationType.DIET && "group-hover:bg-blue-50 group-hover:border-blue-100",
                                                    item.type === CreationType.SHOPPING_LIST && "group-hover:bg-emerald-50 group-hover:border-emerald-100",
                                                    item.type === CreationType.RECIPE && "group-hover:bg-amber-50 group-hover:border-amber-100"
                                                )}>
                                                    {getTypeIcon(item.type)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                                                    {item.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {item.tags && item.tags.length > 0 ? (
                                                    item.tags.map(tag => (
                                                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                            #{tag}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Sin etiquetas</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                                getTypeStyles(item.type)
                                            )}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
                                                {item.createdAt}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer" title="Previsualizar">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadClick(item)}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                                                    title="Descargar / Exportar"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                                <div className="w-px h-4 bg-slate-200 mx-1" />
                                                <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer" title="Eliminar">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-24">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="p-4 bg-slate-50 rounded-full">
                                                <Folder className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-base font-bold text-slate-600">No se encontraron creaciones</p>
                                                <p className="text-sm text-slate-400">Intenta ajustar los filtros de búsqueda.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500">
                        Mostrando <span className="text-slate-900">{paginatedData.length}</span> de <span className="text-slate-900">{filteredData.length}</span> resultados
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-black text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-xl">
                            Página {currentPage} de {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            {/* Download Modal - Moved inside main container */}
            {downloadModalOpen && selectedItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200 cursor-default"
                    onClick={() => setDownloadModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-slate-900 text-lg">Exportar Creación</h3>
                            <button onClick={() => setDownloadModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-slate-500">¿Cómo deseas descargar <strong>"{selectedItem.name}"</strong>?</p>

                            <div className="grid grid-cols-2 gap-3">
                                <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50 group transition-all" onClick={() => {/* Mock PDF DL */ setDownloadModalOpen(false) }}>
                                    <FileText className="h-6 w-6 text-slate-400 group-hover:text-red-500 mb-2 transition-colors" />
                                    <span className="text-xs font-bold text-slate-600 group-hover:text-red-700">PDF</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 group transition-all" onClick={() => {/* Mock Excel DL */ setDownloadModalOpen(false) }}>
                                    <FileText className="h-6 w-6 text-slate-400 group-hover:text-emerald-500 mb-2 transition-colors" />
                                    <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-700">Excel</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 group transition-all" onClick={() => {/* Mock Doc DL */ setDownloadModalOpen(false) }}>
                                    <FileText className="h-6 w-6 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                                    <span className="text-xs font-bold text-slate-600 group-hover:text-blue-700">Word</span>
                                </button>
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <Button
                                    variant="outline"
                                    className="w-full border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                                    onClick={() => {
                                        setDownloadModalOpen(false);
                                        handleEdit(selectedItem);
                                    }}
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Seguir Editando
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
