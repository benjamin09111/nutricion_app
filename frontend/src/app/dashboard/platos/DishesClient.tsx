'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Utensils,
    ChefHat,
    Pencil,
    Trash2,
    ChevronRight,
    Flame
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
// import { CreateRecipeModal } from './CreateRecipeModal'; // To be implemented

interface Recipe {
    id: string;
    name: string;
    description?: string;
    portions: number;
    calories: number;
    proteins: number;
    carbs: number;
    lipids: number;
    isPublic: boolean;
    _count?: {
        ingredients: number;
    };
}

export function DishesClient() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        try {
            const token = Cookies.get('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al cargar recetas');
            const data = await response.json();
            setRecipes(data);
        } catch (error) {
            console.error(error);
            toast.error('No se pudieron cargar las recetas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Estás seguro de eliminar este plato?')) return;

        try {
            const token = Cookies.get('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Error al eliminar');

            setRecipes(recipes.filter(r => r.id !== id));
            toast.success('Plato eliminado');
        } catch (error) {
            toast.error('Error al eliminar el plato');
        }
    };

    const filteredRecipes = recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Utensils className="text-emerald-600" />
                        Platos y Recetas
                    </h1>
                    <p className="text-slate-500 mt-1">Crea y gestiona tus preparaciones culinarias.</p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm shadow-emerald-100"
                >
                    <Plus size={18} />
                    Nuevo Plato
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar plato..."
                        className="pl-9 bg-slate-50 border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="text-center py-12 text-slate-400">Cargando recetas...</div>
            ) : filteredRecipes.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-300">
                        <ChefHat size={24} />
                    </div>
                    <h3 className="text-slate-900 font-medium mb-1">No hay platos creados</h3>
                    <p className="text-slate-500 text-sm">Crea tu primer plato combinando ingredientes.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRecipes.map(recipe => (
                        <div
                            key={recipe.id}
                            className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden cursor-pointer"
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                            <ChefHat size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 line-clamp-1">{recipe.name}</h3>
                                            <p className="text-xs text-slate-500">{recipe._count?.ingredients || 0} ingredientes • {recipe.portions} porción(es)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Cal</div>
                                        <div className="text-xs font-bold text-slate-700">{Math.round(recipe.calories)}</div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Prot</div>
                                        <div className="text-xs font-bold text-slate-700">{Math.round(recipe.proteins)}g</div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Carb</div>
                                        <div className="text-xs font-bold text-slate-700">{Math.round(recipe.carbs)}g</div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Gras</div>
                                        <div className="text-xs font-bold text-slate-700">{Math.round(recipe.lipids)}g</div>
                                    </div>
                                </div>

                                {recipe.description && (
                                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 min-h-[2.5em]">
                                        {recipe.description}
                                    </p>
                                )}

                                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                        {Math.round(recipe.calories)} kcal/porción
                                    </span>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-emerald-600">
                                            <Pencil size={16} />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                                            onClick={(e) => handleDelete(recipe.id, e)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* <CreateRecipeModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={fetchRecipes} 
            /> */}
        </div>
    );
}
