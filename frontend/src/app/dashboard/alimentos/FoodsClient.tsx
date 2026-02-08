'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Star, Ban, Info, Pencil, Tag, BadgeCheck, Scale, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Ingredient } from '@/features/foods';
import { formatCLP } from '@/lib/utils/currency';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import EditFoodModal from './EditFoodModal'; // Keep for editing if needed
import { Pagination } from '@/components/ui/Pagination';
import { useRouter } from 'next/navigation';
import CreateIngredientModal from './CreateIngredientModal';
import IngredientDetailsModal from './IngredientDetailsModal';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type IngredientTab = 'Dieta base' | 'Favoritos' | 'No recomendados' | 'Con tags' | 'Mis creaciones';

interface FoodsClientProps {
    initialData: Ingredient[];
}

export default function FoodsClient({ initialData }: FoodsClientProps) {
    const router = useRouter();
    const [data, setData] = useState<Ingredient[]>(initialData);
    const [activeTab, setActiveTab] = useState<IngredientTab>('Dieta base');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [selectedTag, setSelectedTag] = useState<string>('Todos');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

    useEffect(() => {
        setData(initialData);
    }, [initialData]);

    const categories = useMemo(() => ['Todos', ...Array.from(new Set(data.map((d) => d.category)))], [data]);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        data.forEach(d => d.tags?.forEach(t => tags.add(t)));
        return ['Todos', ...Array.from(tags)];
    }, [data]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, selectedTag, activeTab]);

    const filteredIngredients = useMemo(() => {
        return data.filter((ingredient) => {
            // Tab filtering
            if (activeTab === 'Favoritos') return false; // TODO: Implement favorites check
            if (activeTab === 'No recomendados') return false; // TODO: Implement hidden check
            if (activeTab === 'Con tags' && (!ingredient.tags || ingredient.tags.length === 0)) return false;
            // "Mis creaciones" check: verify nutritionist ownership if implemented in frontend model
            if (activeTab === 'Mis creaciones' && !ingredient.nutritionistId) return false;

            const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (ingredient.brand && ingredient.brand.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = selectedCategory === 'Todos' || ingredient.category === selectedCategory;
            const matchesTag = selectedTag === 'Todos' || (ingredient.tags && ingredient.tags.includes(selectedTag));

            return matchesSearch && matchesCategory && matchesTag;
        });
    }, [data, searchTerm, selectedCategory, selectedTag, activeTab]);

    const totalPages = Math.ceil(filteredIngredients.length / itemsPerPage);
    const paginatedIngredients = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredIngredients.slice(start, start + itemsPerPage);
    }, [filteredIngredients, currentPage]);

    const tabs: IngredientTab[] = ['Dieta base', 'Favoritos', 'No recomendados', 'Con tags', 'Mis creaciones'];

    const handleEditClick = (ingredient: Ingredient) => {
        // Edit logic to be adapted for Ingredient type
        // setEditingIngredient(ingredient);
        // setIsEditModalOpen(true);
        alert("Edición en construcción");
    };

    const handleInfoClick = (ingredient: Ingredient) => {
        setSelectedIngredient(ingredient);
        setIsDetailsModalOpen(true);
    };

    const handleSaveIngredient = async (original: Ingredient, newTags: string[]) => {
        // Mock save
        alert("Guardado (simulado)");
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Tabs Switcher */}
                <div className="flex p-1 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/50 backdrop-blur-sm overflow-x-auto max-w-full">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap",
                                activeTab === tab
                                    ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/50"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <Button
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/50 rounded-xl"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Ingrediente
                </Button>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-wrap items-end gap-6">
                    <div className="flex-1 min-w-[300px] space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 text-shadow-sm">Buscar Ingrediente</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
                            </div>
                            <Input
                                type="search"
                                placeholder="Nombre, marca..."
                                className="pl-10 h-11 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="max-w-xs w-full space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 text-shadow-sm">Categoría</label>
                        <div className="relative">
                            <select
                                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-medium appearance-none"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-xs w-full space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 text-shadow-sm">Tag</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Tag className="h-4 w-4 text-slate-400" />
                            </div>
                            <select
                                className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-medium appearance-none"
                                value={selectedTag}
                                onChange={(e) => setSelectedTag(e.target.value)}
                            >
                                {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="space-y-2">
                <div className="flex justify-between items-center px-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Mostrando <span className="text-emerald-600">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-emerald-600">{Math.min(currentPage * itemsPerPage, filteredIngredients.length)}</span> de <span className="text-slate-600">{filteredIngredients.length}</span> ingredientes
                    </p>
                </div>
                <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 sm:rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 table-fixed md:table-auto">
                            <thead className="bg-slate-50/50 text-shadow-sm">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 w-1/4">Alimento / Marca</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Categoría</th>
                                    <th scope="col" className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Tags</th>
                                    <th scope="col" className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100" title="Kcal cada 100g/ml">Kcal (100g)</th>
                                    <th scope="col" className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100" title="Proteína cada 100g/ml">Prot (100g)</th>
                                    <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">$/Ref</th>
                                    <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {paginatedIngredients.length > 0 ? (
                                    paginatedIngredients.map((item, idx) => (
                                        <tr key={`${item.id}-${idx}`} className="hover:bg-emerald-50/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate block max-w-[200px]" title={item.name}>
                                                            {item.name}
                                                        </span>
                                                        {item.verified && (
                                                            <div title="Verificado por NutriSaaS">
                                                                <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {item.brand && (
                                                            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md">
                                                                {item.brand}
                                                            </span>
                                                        )}
                                                        {item.unit && item.amount ? (
                                                            <span className="text-[10px] text-slate-300 font-medium flex items-center gap-0.5">
                                                                <Scale className="w-3 h-3" />
                                                                {item.amount} {item.unit}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight bg-slate-100/50 px-2 py-1 rounded-lg border border-slate-100">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-wrap justify-center gap-1">
                                                    {item.tags && item.tags.length > 0 ? (
                                                        item.tags.slice(0, 2).map(tag => (
                                                            <span key={tag} className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                                {tag}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300">-</span>
                                                    )}
                                                    {item.tags && item.tags.length > 2 && (
                                                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">+{item.tags.length - 2}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                    {item.calories}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                                    {item.proteins}g
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black text-slate-900">
                                                        {formatCLP(item.price)}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-medium">
                                                        x {item.amount} {item.unit}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* We can re-enable Edit if it's user created */}
                                                    {/* <button
                                                        onClick={() => handleEditClick(item)}
                                                        className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all active:scale-95 cursor-pointer"
                                                        title="Editar Tags"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button> */}
                                                    <button className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all active:scale-95 cursor-pointer" title="Favorito">
                                                        <Star className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all active:scale-95 cursor-pointer"
                                                        title="Ver detalles nutricionales"
                                                        onClick={() => handleInfoClick(item)}
                                                    >
                                                        <Info className="h-4 w-4" />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95 cursor-pointer" title="No recomendar">
                                                        <Ban className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-32">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="p-4 bg-slate-50 rounded-full">
                                                    <Search className="h-8 w-8 text-slate-300" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-base font-bold text-slate-600">No se encontraron ingredientes</p>
                                                    <p className="text-sm text-slate-400">Prueba ajustando los filtros o cambia de pestaña.</p>
                                                </div>
                                                {/* <Button className="mt-4" onClick={() => {}}> Limpiar filtros </Button> */}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Footer */}
                    <div className="border-t border-slate-100 bg-slate-50/50">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            </div>

            <IngredientDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                ingredient={selectedIngredient}
            />

            <CreateIngredientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => router.refresh()}
                availableTags={allTags.filter(t => t !== 'Todos')}
            />

            {/* Editing modal commented out for now logic to be adapted 
            <EditFoodModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                food={editingIngredient}
                currentTags={editingIngredient?.tags || []}
                onSave={handleSaveIngredient}
                allAvailableTags={allTags}
            /> */}
        </div >
    );
}
