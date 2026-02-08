import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TagInput } from '@/components/ui/TagInput';
import { Ingredient } from '@/features/foods';

interface EditFoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    food: Ingredient | null;
    currentTags: string[];
    onSave: (food: Ingredient, tags: string[]) => Promise<void>;
    allAvailableTags: string[]; // For suggestions
}

export default function EditFoodModal({
    isOpen,
    onClose,
    food,
    currentTags,
    onSave,
    allAvailableTags
}: EditFoodModalProps) {
    const [tags, setTags] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTags(currentTags);
        }
    }, [isOpen, currentTags]);

    if (!isOpen || !food) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(food, tags);
            onClose();
        } catch (error) {
            console.error("Failed to save tags", error);
            // Ideally handle error notification here
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 overflow-hidden animate-in zoom-in-95 duration-200 sm:scale-100">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-black text-slate-800">Editar Ingrediente</h3>
                        <p className="text-sm text-slate-500 font-medium">{food.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="block text-xs font-bold text-slate-400 uppercase">Categoría</span>
                                <span className="font-bold text-slate-700">{food.category}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="block text-xs font-bold text-slate-400 uppercase">Calorías</span>
                                <span className="font-bold text-slate-700">{food.calories || '-'}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 block">
                                Etiquetas (Tags)
                            </label>
                            <p className="text-xs text-slate-500 mb-2">
                                Clasifica este alimento para facilitar su búsqueda (ej: Diabetes, Hipertensión).
                            </p>
                            <TagInput
                                value={tags}
                                onChange={setTags}
                                suggestions={allAvailableTags}
                                placeholder="Escribe un tag y presiona Enter..."
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 bg-slate-50 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
