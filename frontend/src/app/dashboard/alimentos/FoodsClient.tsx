'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Star, Ban, Info, Pencil, Tag, BadgeCheck, Scale, Plus, Check, X, FolderPlus, Users, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Ingredient } from '@/features/foods';
import { formatCLP } from '@/lib/utils/currency';
import { cn } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { useRouter } from 'next/navigation';
import CreateIngredientModal from './CreateIngredientModal';
import IngredientDetailsModal from './IngredientDetailsModal';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import ManageTagsModal from './ManageTagsModal';
import CreateGroupModal from './CreateGroupModal';
import AddIngredientsToGroupModal from './AddIngredientsToGroupModal';

type IngredientTab = 'Dieta base' | 'Favoritos' | 'No recomendados' | 'Con tags' | 'Mis creaciones' | 'Mis grupos';

interface FoodsClientProps {
    initialData: Ingredient[];
}

export default function FoodsClient({ initialData }: FoodsClientProps) {
    const router = useRouter();
    const [data, setData] = useState<Ingredient[]>(initialData);
    const [activeTab, setActiveTab] = useState<IngredientTab>('Dieta base');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [baseTab, setBaseTab] = useState<'app' | 'community'>('app');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<any>({});

    const [selectedTag, setSelectedTag] = useState<string>('Todos');
    const [searchTerm, setSearchTerm] = useState('');

    // Group State
    const [groups, setGroups] = useState<any[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<any | null>(null);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [isAddIngredientModalOpen, setIsAddIngredientModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
    const [selectedIngredientForTags, setSelectedIngredientForTags] = useState<Ingredient | null>(null);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

    useEffect(() => {
        setData(initialData);
    }, [initialData]);

    const fetchGroups = async () => {
        const token = Cookies.get('auth_token');
        if (!token) return;
        setIsLoadingGroups(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
            const res = await fetch(`${apiUrl}/ingredient-groups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setIsLoadingGroups(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'Mis grupos') {
            fetchGroups();
        } else {
            setSelectedGroup(null);
        }
    }, [activeTab]);

    const categories = useMemo(() => ['Todos', ...Array.from(new Set(data.filter(d => d.category?.name).map((d) => d.category.name)))], [data]);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        data.forEach(d => {
            d.tags?.forEach(t => tags.add(t.name));
            d.preferences?.[0]?.tags?.forEach(t => tags.add(t.name));
        });
        return ['Todos', ...Array.from(tags)];
    }, [data]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, selectedTag, activeTab]);

    const filteredIngredients = useMemo(() => {
        return data.filter((ingredient) => {
            const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (ingredient.brand?.name && ingredient.brand.name.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCategory = selectedCategory === 'Todos' || ingredient.category?.name === selectedCategory;

            const pref = ingredient.preferences?.[0];
            const combinedTagsNames = [
                ...(ingredient.tags?.map(t => t.name) || []),
                ...(pref?.tags?.map(t => t.name) || [])
            ];
            const matchesTag = selectedTag === 'Todos' || combinedTagsNames.includes(selectedTag);

            if (!matchesSearch || !matchesCategory || !matchesTag) return false;

            switch (activeTab) {
                case 'Favoritos': return pref?.isFavorite;
                case 'No recomendados': return pref?.isNotRecommended;
                case 'Con tags': return combinedTagsNames.length > 0;
                case 'Mis creaciones': return !!ingredient.nutritionistId; // Assuming nutritionistId exists implies creation
                case 'Dieta base':
                    // if baseTab is 'app', show global items. if 'community', effectively all or a specific flag
                    const isBase = !pref?.isFavorite && !pref?.isNotRecommended;
                    if (isBase) {
                        if (baseTab === 'app') {
                            return !!ingredient.verified || !ingredient.nutritionistId;
                        } else {
                            return !ingredient.verified && !!ingredient.nutritionistId;
                        }
                    }
                    return false;
                case 'Mis grupos':
                    return false; // Groups tab handles its own view
                default: return true;
            }
        });
    }, [data, searchTerm, selectedCategory, selectedTag, activeTab, baseTab]);

    const totalPages = Math.ceil(filteredIngredients.length / itemsPerPage);
    const paginatedIngredients = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredIngredients.slice(start, start + itemsPerPage);
    }, [filteredIngredients, currentPage, itemsPerPage]);

    const tabs: IngredientTab[] = [
        'Dieta base',
        'Favoritos',
        'No recomendados',
        'Con tags',
        'Mis creaciones',
        'Mis grupos'
    ];

    const handleGroupClick = async (groupId: string) => {
        const token = Cookies.get('auth_token');
        if (!token) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
            const res = await fetch(`${apiUrl}/ingredient-groups/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const groupDetails = await res.json();
                setSelectedGroup(groupDetails);
            } else {
                toast.error('Error al cargar detalles del grupo');
            }
        } catch (error) {
            console.error('Error fetching group details:', error);
            toast.error('Error al cargar detalles del grupo');
        }
    };

    const handleDeleteGroup = async (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Estás seguro de que deseas eliminar este grupo?')) return;
        const token = Cookies.get('auth_token');
        if (!token) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
            const res = await fetch(`${apiUrl}/ingredient-groups/${groupId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Grupo eliminado correctamente');
                setGroups(prev => prev.filter(g => g.id !== groupId));
                if (selectedGroup?.id === groupId) setSelectedGroup(null);
            } else {
                toast.error('Error al eliminar el grupo');
            }
        } catch (error) {
            console.error('Error deleting group:', error);
            toast.error('Error al eliminar el grupo');
        }
    };

    const handleRemoveIngredientFromGroup = async (groupId: string, ingredientId: string) => {
        const token = Cookies.get('auth_token');
        if (!token) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
            const res = await fetch(`${apiUrl}/ingredient-groups/${groupId}/ingredients`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ingredientIds: [ingredientId] })
            });

            if (res.ok) {
                toast.success('Ingrediente eliminado del grupo');
                // Update local state
                if (selectedGroup && selectedGroup.id === groupId) {
                    const updatedIngredients = selectedGroup.ingredients?.filter((rel: any) => rel.ingredient.id !== ingredientId) || [];
                    setSelectedGroup({ ...selectedGroup, ingredients: updatedIngredients });

                    // Also update groups list count
                    setGroups(prev => prev.map(g => {
                        if (g.id === groupId) {
                            const newCount = Math.max(0, (g._count?.ingredients || 0) - 1);
                            return { ...g, _count: { ...g._count, ingredients: newCount } };
                        }
                        return g;
                    }));
                }
            } else {
                toast.error('Error al eliminar ingrediente');
            }
        } catch (error) {
            console.error('Error removing ingredient:', error);
            toast.error('Error al eliminar ingrediente');
        }
    };

    const handleDetailsClick = (ingredient: Ingredient) => {
        setSelectedIngredient(ingredient);
        setIsDetailsModalOpen(true);
    };

    const handleManageTags = (ingredient: Ingredient) => {
        setSelectedIngredientForTags(ingredient);
        setIsTagsModalOpen(true);
    };

    const handleTogglePreference = async (ingredientId: string, updates: any) => {
        const token = Cookies.get('auth_token');
        if (!token) return;

        // Optimistic Update
        const previousData = [...data];
        setData(current => current.map(item => {
            if (item.id === ingredientId) {
                const existingPref = item.preferences?.[0] || { isFavorite: false, isNotRecommended: false, tags: [] };
                return {
                    ...item,
                    preferences: [{ ...existingPref, ...updates }]
                };
            }
            return item;
        }));

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
            const response = await fetch(`${apiUrl}/foods/${ingredientId}/preferences`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData: any = {};
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { message: errorText || 'Error desconocido' };
                }
                throw new Error(errorData.message || 'Error al actualizar preferencias');
            }

            // Custom Toast Message
            let message = 'Preferencia actualizada';
            if (updates.isFavorite) message = 'Añadido a Favoritos ⭐';
            else if (updates.isNotRecommended) message = 'Marcado como No Recomendado 🚫';
            else if (updates.isFavorite === false && updates.isNotRecommended === false) message = 'Preferencia eliminada';

            toast.success(message);
        } catch (error: any) {
            console.error('Toggle preference error:', error);
            setData(previousData); // Rollback
            toast.error(error.message || 'No se pudo actualizar la preferencia');
        }
    };

    const handleStartEdit = (ingredient: Ingredient) => {
        setEditingId(ingredient.id);
        setEditValues({
            name: ingredient.name,
            brand: ingredient.brand?.name || '',
            price: ingredient.price,
            amount: ingredient.amount,
            unit: ingredient.unit,
            calories: ingredient.calories,
            proteins: ingredient.proteins,
            carbs: ingredient.carbs,
            lipids: ingredient.lipids,
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditValues({});
    };

    const handleSaveEdit = async (id: string) => {
        const token = Cookies.get('auth_token');
        if (!token) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
            const response = await fetch(`${apiUrl}/foods/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editValues)
            });

            if (!response.ok) throw new Error('Error al actualizar');

            const updatedFood = await response.json();

            // Optimistic Update
            setData(current => current.map(item =>
                item.id === id ? { ...item, ...updatedFood } : item
            ));

            toast.success('Ingrediente actualizado');
            setEditingId(null);
        } catch (error) {
            console.error('Update error:', error);
            toast.error('No se pudo actualizar el ingrediente');
        }
    };

    const handleInfoClick = (ingredient: Ingredient) => {
        setSelectedIngredient(ingredient);
        setIsDetailsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col gap-3">
                    {/* Main Tabs Switcher */}
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

                    {/* Sub-tabs for Dieta base */}
                    {activeTab === 'Dieta base' && (
                        <div className="flex gap-2 p-1 bg-slate-50 border border-slate-100 rounded-lg w-fit">
                            <button
                                onClick={() => setBaseTab('app')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                                    baseTab === 'app'
                                        ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <BadgeCheck size={14} />
                                🏢 Oficiales App
                            </button>
                            <button
                                onClick={() => setBaseTab('community')}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2",
                                    baseTab === 'community'
                                        ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <Users size={14} />
                                🌍 Comunidad Nutris
                            </button>
                        </div>
                    )}

                    {/* Source Attribution */}
                    {activeTab === 'Dieta base' && baseTab === 'app' && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                            <Info className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-medium text-emerald-700">
                                Fuente: Tabla de Composición de Alimentos INTA (2018)
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {activeTab === 'Mis grupos' ? (
                        <div className="flex gap-2">
                            {selectedGroup && (
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedGroup(null)}
                                    className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                                >
                                    <ChevronLeft size={16} />
                                    Volver
                                </Button>
                            )}
                            <Button
                                onClick={() => setIsCreateGroupModalOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm shadow-indigo-100"
                            >
                                <FolderPlus size={18} />
                                Nueva Agrupación
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    setActiveTab('Mis grupos');
                                    setIsCreateGroupModalOpen(true);
                                }}
                                variant="outline"
                                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 gap-2"
                            >
                                <FolderPlus size={18} />
                                Nueva Agrupación
                            </Button>
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm shadow-emerald-100"
                            >
                                <Plus size={18} />
                                Nuevo Ingrediente
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Switcher */}
            {activeTab === 'Mis grupos' ? (
                selectedGroup ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Group Detail Header */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                            <FolderPlus size={24} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-800">{selectedGroup.name}</h2>
                                    </div>
                                    {selectedGroup.description && (
                                        <p className="text-slate-500 max-w-2xl">{selectedGroup.description}</p>
                                    )}
                                    <div className="flex gap-2 mt-4">
                                        {selectedGroup.tags?.map((tag: any) => (
                                            <span key={tag.id} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                                #{tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 mr-2"
                                    onClick={() => setIsAddIngredientModalOpen(true)}
                                >
                                    <Plus size={16} className="mr-2" />
                                    Añadir Ingredientes
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200"
                                    onClick={(e) => handleDeleteGroup(selectedGroup.id, e)}
                                >
                                    <Trash2 size={16} className="mr-2" />
                                    Eliminar Grupo
                                </Button>
                            </div>
                        </div>

                        {/* Ingredients Table */}
                        <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 sm:rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Ingrediente</th>
                                            <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Categoría</th>
                                            <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Cantidad</th>
                                            <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {selectedGroup.ingredients && selectedGroup.ingredients.length > 0 ? (
                                            selectedGroup.ingredients.map((relation: any) => (
                                                <tr key={relation.ingredient.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="font-medium text-slate-900">{relation.ingredient.name}</span>
                                                        <span className="text-slate-400 text-xs ml-2">{relation.ingredient.brand?.name}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">
                                                        {relation.ingredient.category?.name || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-600">
                                                        {relation.amount} {relation.ingredient.unit}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleRemoveIngredientFromGroup(selectedGroup.id, relation.ingredient.id)}
                                                        >
                                                            <X size={16} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                    Este grupo no tiene ingredientes aún.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Groups Grid View */
                    isLoadingGroups ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-32 animate-pulse flex flex-col justify-between">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
                            {groups.length === 0 ? (
                                <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FolderPlus size={24} />
                                    </div>
                                    <h3 className="text-slate-900 font-medium mb-1">No tienes agrupaciones</h3>
                                    <p className="text-slate-500 text-sm mb-4">Organiza tus ingredientes en grupos personalizados.</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsCreateGroupModalOpen(true)}
                                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                    >
                                        Crear mi primera agrupación
                                    </Button>
                                </div>
                            ) : (
                                groups.map(group => (
                                    <div
                                        key={group.id}
                                        onClick={() => handleGroupClick(group.id)}
                                        className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all cursor-pointer relative group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                    <FolderPlus size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-900">{group.name}</h3>
                                                    <p className="text-xs text-slate-500">{group._count?.ingredients || 0} ingredientes</p>
                                                </div>
                                            </div>
                                        </div>
                                        {group.description && (
                                            <p className="text-xs text-slate-600 mb-3 line-clamp-2">{group.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-1 mt-auto">
                                            {group.tags?.map((tag: any) => (
                                                <span key={tag.id} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                                    #{tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )
                )
            ) : (
                <>
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
                                <SearchableSelect
                                    options={categories}
                                    value={selectedCategory}
                                    onChange={setSelectedCategory}
                                    placeholder="Filtrar por Categoría..."
                                    className="w-full"
                                />
                            </div>

                            <div className="max-w-xs w-full space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 text-shadow-sm">Tag</label>
                                <SearchableSelect
                                    options={allTags}
                                    value={selectedTag}
                                    onChange={setSelectedTag}
                                    placeholder="Filtrar por Tag..."
                                    className="w-full"
                                />
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
                                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Alimento</th>
                                            {baseTab !== 'app' && (
                                                <>
                                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Marca</th>
                                                </>
                                            )}
                                            <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Categoría</th>
                                            <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Precio</th>
                                            <th scope="col" className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 italic">
                                                Unidad {baseTab === 'app' && '(100)'}
                                            </th>
                                            {baseTab !== 'app' && (
                                                <th scope="col" className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Tags</th>
                                            )}
                                            <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedIngredients.map((ingredient) => (
                                            <tr key={ingredient.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    {editingId === ingredient.id ? (
                                                        <Input
                                                            value={editValues.name}
                                                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                                                            className="h-8 text-sm w-full"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-slate-900">{ingredient.name}</span>
                                                            {ingredient.verified && <BadgeCheck className="w-4 h-4 text-emerald-500" />}
                                                        </div>
                                                    )}
                                                </td>
                                                {baseTab !== 'app' && (
                                                    <td className="px-6 py-4 text-sm text-slate-500">
                                                        {editingId === ingredient.id ? (
                                                            <Input
                                                                value={editValues.brand}
                                                                onChange={(e) => setEditValues({ ...editValues, brand: e.target.value })}
                                                                className="h-8 text-sm w-full"
                                                            />
                                                        ) : (
                                                            ingredient.brand?.name || '-'
                                                        )}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                        {ingredient.category?.name || 'General'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right font-medium text-slate-600">
                                                    {editingId === ingredient.id ? (
                                                        <Input
                                                            type="number"
                                                            value={editValues.price}
                                                            onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                                                            className="h-8 text-sm w-20 ml-auto"
                                                        />
                                                    ) : (
                                                        `$${ingredient.price?.toLocaleString('es-CL')}`
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-center text-slate-500">
                                                    {ingredient.unit}
                                                </td>
                                                {baseTab !== 'app' && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-1 justify-center">
                                                            {(ingredient.preferences?.[0]?.tags || ingredient.tags || []).slice(0, 2).map((tag: any) => (
                                                                <span key={tag.id} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                                                                    #{tag.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {editingId === ingredient.id ? (
                                                            <>
                                                                <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(ingredient.id)} className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                                                    <Check size={16} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                                    <X size={16} />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button variant="ghost" size="icon" onClick={() => handleInfoClick(ingredient)} className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                                    <Info size={16} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => handleManageTags(ingredient)} className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                                    <Tag size={16} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => handleStartEdit(ingredient)} className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                                    <Pencil size={16} />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleTogglePreference(ingredient.id, { isFavorite: !ingredient.preferences?.[0]?.isFavorite })}
                                                                    className={cn("h-8 w-8 transition-colors", ingredient.preferences?.[0]?.isFavorite ? "text-amber-400 hover:text-amber-500 hover:bg-amber-50" : "text-slate-400 hover:text-amber-400 hover:bg-amber-50")}
                                                                >
                                                                    <Star size={16} fill={ingredient.preferences?.[0]?.isFavorite ? "currentColor" : "none"} />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleTogglePreference(ingredient.id, { isNotRecommended: !ingredient.preferences?.[0]?.isNotRecommended })}
                                                                    className={cn("h-8 w-8 transition-colors", ingredient.preferences?.[0]?.isNotRecommended ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "text-slate-400 hover:text-red-500 hover:bg-red-50")}
                                                                >
                                                                    <Ban size={16} />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-2 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Anterior
                            </Button>
                            <span className="text-sm font-medium text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                                Página {currentPage} de {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                            >
                                Siguiente
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </>
            )
            }

            {/* Modals */}
            <CreateGroupModal
                isOpen={isCreateGroupModalOpen}
                onClose={() => setIsCreateGroupModalOpen(false)}
                onGroupCreated={fetchGroups}
            />

            {
                selectedGroup && (
                    <AddIngredientsToGroupModal
                        isOpen={isAddIngredientModalOpen}
                        onClose={() => setIsAddIngredientModalOpen(false)}
                        groupId={selectedGroup.id}
                        allIngredients={data} // Pass all available ingredients
                        currentIngredientIds={selectedGroup.ingredients?.map((r: any) => r.ingredient.id) || []}
                        onIngredientsAdded={() => handleGroupClick(selectedGroup.id)} // Refresh group details
                    />
                )
            }


            {/* Details Modal */}
            {
                selectedIngredient && (
                    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity duration-300 ${isDetailsModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 scale-100">
                            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                        <Info size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">{selectedIngredient.name}</h2>
                                        <p className="text-sm text-slate-500">{selectedIngredient.brand?.name || 'Sin marca'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Categoría</p>
                                        <p className="font-semibold text-slate-700">{selectedIngredient.category?.name || '-'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Precio</p>
                                        <p className="font-semibold text-emerald-600 text-lg">${selectedIngredient.price?.toLocaleString('es-CL')}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <Scale size={16} className="text-indigo-500" />
                                        Información Nutricional (por porción)
                                    </h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                                            <p className="text-xs font-medium text-orange-600 mb-1">Calorías</p>
                                            <p className="text-lg font-black text-orange-700">{selectedIngredient.calories}</p>
                                        </div>
                                        <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <p className="text-xs font-medium text-blue-600 mb-1">Proteínas</p>
                                            <p className="text-lg font-black text-blue-700">{selectedIngredient.proteins}g</p>
                                        </div>
                                        <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <p className="text-xs font-medium text-emerald-600 mb-1">Carbos</p>
                                            <p className="text-lg font-black text-emerald-700">{selectedIngredient.carbs}g</p>
                                        </div>
                                        <div className="text-center p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                                            <p className="text-xs font-medium text-yellow-600 mb-1">Grasas</p>
                                            <p className="text-lg font-black text-yellow-700">{selectedIngredient.lipids}g</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedIngredient.tags && selectedIngredient.tags.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Etiquetas</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedIngredient.tags.map((tag: any) => (
                                                <span key={tag.id} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                                                    #{tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <Button onClick={() => setIsDetailsModalOpen(false)} className="bg-slate-900 text-white hover:bg-slate-800">
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            <ManageTagsModal
                isOpen={isTagsModalOpen}
                onClose={() => setIsTagsModalOpen(false)}
                ingredient={selectedIngredientForTags}
                availableTags={allTags.filter(t => t !== 'Todos')}
                onSuccess={(updatedTags) => {
                    if (selectedIngredientForTags) {
                        setData(current => current.map(item => {
                            if (item.id === selectedIngredientForTags.id) {
                                // Mock updated tags behavior
                                const newTags = updatedTags.map((name: string) => ({ id: name, name }));
                                return {
                                    ...item,
                                    // In a real app we might reload data, but here we just optimistically update preferences or tags
                                    // For now, let's just trigger a toast
                                };
                            }
                            return item;
                        }));
                        toast.success('Tags actualizados');
                        router.refresh();
                    }
                }}
            />

        </div >
    );
}
