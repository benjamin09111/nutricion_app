'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Star, Ban, Info, Pencil, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MarketPrice } from '@/features/foods';
import { formatCLP } from '@/lib/utils/currency';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import EditFoodModal from './EditFoodModal';
import { Pagination } from '@/components/ui/Pagination';
import { useRouter } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type FoodTab = 'Dieta base' | 'Favoritos' | 'No recomendados' | 'Con tags' | 'Creados';

interface FoodsClientProps {
    initialData: MarketPrice[];
}

export default function FoodsClient({ initialData }: FoodsClientProps) {
    const router = useRouter(); // To refresh if needed, though we update local state
    const [data, setData] = useState<MarketPrice[]>(initialData);
    const [activeTab, setActiveTab] = useState<FoodTab>('Dieta base');
    const [selectedGrupo, setSelectedGrupo] = useState('Todos');
    const [selectedTag, setSelectedTag] = useState<string>('Todos');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingFood, setEditingFood] = useState<MarketPrice | null>(null);

    // Update local state when initialData changes (e.g. revalidation)
    useEffect(() => {
        setData(initialData);
    }, [initialData]);

    const grupos = useMemo(() => ['Todos', ...Array.from(new Set(data.map((d) => d.grupo)))], [data]);

    // Derive all available tags from the dataset
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        data.forEach(d => d.tags?.forEach(t => tags.add(t)));
        return ['Todos', ...Array.from(tags)];
    }, [data]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedGrupo, selectedTag, activeTab]);

    // Local filtering (full list)
    const filteredFoods = useMemo(() => {
        return data.filter((food) => {
            // Tab filtering
            if (activeTab === 'Favoritos') return false; // Mock
            if (activeTab === 'No recomendados') return false; // Mock
            if (activeTab === 'Con tags' && (!food.tags || food.tags.length === 0)) return false;
            if (activeTab === 'Creados' && !food.isUserCreated) return false;

            const matchesSearch = food.producto.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesGrupo = selectedGrupo === 'Todos' || food.grupo === selectedGrupo;
            // Tag filtering
            const matchesTag = selectedTag === 'Todos' || (food.tags && food.tags.includes(selectedTag));

            return matchesSearch && matchesGrupo && matchesTag;
        });
    }, [data, searchTerm, selectedGrupo, selectedTag, activeTab]);

    const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);
    const paginatedFoods = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredFoods.slice(start, start + itemsPerPage);
    }, [filteredFoods, currentPage]);

    const tabs: FoodTab[] = ['Dieta base', 'Favoritos', 'No recomendados', 'Con tags', 'Creados'];

    const handleEditClick = (food: MarketPrice) => {
        setEditingFood(food);
        setIsEditModalOpen(true);
    };

    const handleSaveFood = async (originalFood: MarketPrice, newTags: string[]) => {
        try {
            const url = `${process.env.NEXT_PUBLIC_API_URL}/foods`;
            const method = originalFood.id ? 'PATCH' : 'POST';
            const endpoint = originalFood.id ? `${url}/${originalFood.id}` : url;

            const payload = {
                name: originalFood.producto,
                category: originalFood.grupo,
                calories: originalFood.calorias || 0,
                proteins: originalFood.proteinas || 0,
                carbs: 0,
                fats: 0,
                tags: newTags,
                // Only include other fields if creating
                ...(!originalFood.id ? {
                    brand: 'Generico',
                    isPublic: true
                } : {})
            };

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save food');

            const savedFood = await res.json();

            // Update local state
            setData(prev => prev.map(f =>
                f.producto === originalFood.producto
                    ? { ...f, tags: savedFood.tags, id: savedFood.id }
                    : f
            ));

        } catch (error) {
            console.error(error);
            alert('Error al guardar el alimento. Intente nuevamente.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Tabs Switcher */}
            <div className="flex p-1 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/50 backdrop-blur-sm">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer",
                            activeTab === tab
                                ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/50"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Filters Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-wrap items-end gap-6">
                    <div className="flex-1 min-w-[300px] space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 text-shadow-sm">Buscar Producto</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
                            </div>
                            <Input
                                type="search"
                                placeholder="Escribe el nombre del alimento..."
                                className="pl-10 h-11 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="max-w-xs w-full space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 text-shadow-sm">Filtrar por Grupo</label>
                        <select
                            className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-medium"
                            value={selectedGrupo}
                            onChange={(e) => setSelectedGrupo(e.target.value)}
                        >
                            {grupos.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    <div className="max-w-xs w-full space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 text-shadow-sm">Filtrar por Tag</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Tag className="h-4 w-4 text-slate-400" />
                            </div>
                            <select
                                className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer font-medium"
                                value={selectedTag}
                                onChange={(e) => setSelectedTag(e.target.value)}
                            >
                                {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>


                </div>
            </div>

            {/* Table Section */}
            <div className="space-y-2">
                <div className="flex justify-between items-center px-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Mostrando <span className="text-emerald-600">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-emerald-600">{Math.min(currentPage * itemsPerPage, filteredFoods.length)}</span> de <span className="text-slate-600">{filteredFoods.length}</span> resultados
                    </p>
                </div>
                <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 sm:rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 table-fixed md:table-auto">
                            <thead className="bg-slate-50/50 text-shadow-sm">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Producto</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Grupo</th>
                                    <th scope="col" className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Tags</th>
                                    <th scope="col" className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Calorías</th>
                                    <th scope="col" className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Proteína</th>
                                    <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Precio Promedio</th>
                                    <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 bg-white">
                                {paginatedFoods.length > 0 ? (
                                    paginatedFoods.map((price, idx) => (
                                        <tr key={`${price.producto}-${idx}`} className="hover:bg-emerald-50/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate block" title={price.producto}>
                                                    {price.producto}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{price.grupo}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-wrap justify-center gap-1">
                                                    {price.tags && price.tags.length > 0 ? (
                                                        price.tags.slice(0, 2).map(tag => (
                                                            <span key={tag} className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                                                {tag}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300">-</span>
                                                    )}
                                                    {price.tags && price.tags.length > 2 && (
                                                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">+{price.tags.length - 2}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-400">
                                                    {price.calorias && price.calorias > 0 ? price.calorias : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-400">
                                                    {price.proteinas && price.proteinas > 0 ? price.proteinas : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg flex items-center gap-1 justify-end">
                                                    {formatCLP(price.precioPromedio)}
                                                    <span className="text-[10px] text-slate-400 font-medium lowercase">
                                                        {price.unidad && price.unidad.startsWith('$') ? price.unidad.replace('$', '') : price.unidad}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleEditClick(price)}
                                                        className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all active:scale-95 cursor-pointer"
                                                        title="Editar Tags"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all active:scale-95 cursor-pointer" title="Favorito">
                                                        <Star className="h-4 w-4" />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all active:scale-95 cursor-pointer" title="Información">
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
                                                    <p className="text-base font-bold text-slate-600">No se encontraron resultados</p>
                                                    <p className="text-sm text-slate-400">Prueba ajustando los filtros o cambia de pestaña.</p>
                                                </div>
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

            <EditFoodModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                food={editingFood}
                currentTags={editingFood?.tags || []}
                onSave={handleSaveFood}
                allAvailableTags={allTags}
            />
        </div >
    );
}
