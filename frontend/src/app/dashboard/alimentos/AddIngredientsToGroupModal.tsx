'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Ingredient } from '@/features/foods';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { Modal } from '@/components/ui/Modal';

interface AddIngredientsToGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    allIngredients: Ingredient[];
    currentIngredientIds: string[];
    onIngredientsAdded: () => void;
}

export default function AddIngredientsToGroupModal({
    isOpen,
    onClose,
    groupId,
    allIngredients,
    currentIngredientIds,
    onIngredientsAdded
}: AddIngredientsToGroupModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentIdsSet = useMemo(() => new Set(currentIngredientIds), [currentIngredientIds]);

    const filteredIngredients = useMemo(() => {
        if (!searchTerm && allIngredients.length > 200) {
            // If no search and many items, just show the first 50 to avoid heavy filter
            return allIngredients
                .filter(ing => !currentIdsSet.has(ing.id))
                .slice(0, 50);
        }

        const term = searchTerm.toLowerCase();
        return allIngredients.filter(ing => {
            const isAlreadyInGroup = currentIdsSet.has(ing.id);
            if (isAlreadyInGroup) return false;

            const nameMatch = ing.name.toLowerCase().includes(term);
            const brandMatch = ing.brand?.name?.toLowerCase().includes(term);

            return nameMatch || brandMatch;
        }).slice(0, 50);
    }, [allIngredients, currentIdsSet, searchTerm]);

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleAdd = async () => {
        if (selectedIds.size === 0) return;
        setIsSubmitting(true);
        const token = Cookies.get('auth_token');
        if (!token) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
            const res = await fetch(`${apiUrl}/ingredient-groups/${groupId}/ingredients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ingredientIds: Array.from(selectedIds) })
            });

            if (res.ok) {
                toast.success(`${selectedIds.size} ingredientes añadidos`);
                onIngredientsAdded();
                handleClose();
            } else {
                toast.error('Error al añadir ingredientes');
            }
        } catch (error) {
            console.error('Error adding ingredients:', error);
            toast.error('Error al añadir ingredientes');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSearchTerm('');
        setSelectedIds(new Set());
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Añadir Ingredientes"
            className="max-w-lg"
        >
            <div className="flex flex-col h-[70vh]">
                {/* Search */}
                <div className="pb-4 border-b border-slate-100">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Buscar ingrediente..."
                            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto py-4 scrollbar-thumb-slate-200 scrollbar-track-transparent scrollbar-thin">
                    {filteredIngredients.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-sm">
                            {searchTerm ? 'No se encontraron ingredientes.' : 'Escribe para buscar...'}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredIngredients.map(ing => {
                                const isSelected = selectedIds.has(ing.id);
                                return (
                                    <div
                                        key={ing.id}
                                        onClick={() => handleToggleSelect(ing.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                                    >
                                        <div>
                                            <div className="font-medium text-slate-900 text-sm">{ing.name}</div>
                                            <div className="text-xs text-slate-500">{ing.brand?.name || 'Sin marca'} • {ing.category?.name || 'General'}</div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm text-slate-500 font-medium">
                        {selectedIds.size} seleccionados
                    </span>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAdd}
                            disabled={selectedIds.size === 0 || isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                            Añadir
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
