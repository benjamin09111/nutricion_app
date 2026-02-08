'use client';

import { Fragment, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, Loader2, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TagInput } from '@/components/ui/TagInput';
import Cookies from 'js-cookie';

const ingredientSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    brand: z.string().optional(),
    category: z.string().min(1, 'La categoría es obligatoria'),
    price: z.number().min(0).optional(),
    unit: z.string().min(1, 'La unidad es obligatoria'),
    amount: z.number().min(0.1, 'La cantidad base debe ser mayor a 0'),
    calories: z.number().min(0, 'Las calorías no pueden ser negativas'),
    proteins: z.number().min(0),
    lipids: z.number().min(0),
    carbs: z.number().min(0),
    sugars: z.number().min(0).optional(),
    fiber: z.number().min(0).optional(),
    sodium: z.number().min(0).optional(),
    tags: z.array(z.string()).optional(),
});

type IngredientFormValues = z.infer<typeof ingredientSchema>;

interface CreateIngredientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    availableTags?: string[];
}

const CATEGORIES = [
    'Lácteos y derivados', 'Carnes y derivados', 'Pescados y mariscos',
    'Huevos', 'Legumbres', 'Verduras y hortalizas', 'Frutas',
    'Cereales y derivados', 'Aceites y grasas', 'Azúcares y dulces',
    'Bebidas', 'Salsas y condimentos', 'Platos preparados', 'Suplementos', 'Otros'
];

export default function CreateIngredientModal({ isOpen, onClose, onSuccess, availableTags = [] }: CreateIngredientModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<IngredientFormValues>({
        resolver: zodResolver(ingredientSchema),
        defaultValues: {
            amount: 100,
            unit: 'g',
            proteins: 0,
            lipids: 0,
            carbs: 0,
            tags: [],
        }
    });

    const onSubmit = async (data: IngredientFormValues) => {
        setIsSubmitting(true);
        try {
            const token = Cookies.get('token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

            const response = await fetch(`${apiUrl}/foods`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...data,
                    isPublic: true, // Force public as per requirement
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear ingrediente');
            }

            toast.success('Ingrediente creado correctamente y añadido a favoritos.');
            reset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating ingredient:', error);
            toast.error(error instanceof Error ? error.message : 'Error al conectar con el servidor');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <DialogPanel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-slate-100 flex flex-col max-h-[90vh]">

                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
                                    <div>
                                        <DialogTitle as="h3" className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                                <Plus className="h-5 w-5" />
                                            </div>
                                            Nuevo Ingrediente
                                        </DialogTitle>
                                        <p className="text-sm text-slate-500 mt-1 pl-11">
                                            Se creará como público y se añadirá a tus favoritos automáticamente.
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Body - Scrollable */}
                                <div className="p-6 overflow-y-auto flex-1">
                                    <form id="create-ingredient-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                                        {/* Basic Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="col-span-2 md:col-span-1 space-y-2">
                                                <label className="text-sm font-medium text-slate-700">Nombre del Producto *</label>
                                                <input
                                                    {...register('name')}
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                                    placeholder="Ej: Pan Integral"
                                                />
                                                {errors.name && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.name.message}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">Marca (Opcional)</label>
                                                <input
                                                    {...register('brand')}
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                                    placeholder="Ej: Ideal"
                                                />
                                            </div>

                                            <div className="col-span-2 md:col-span-1 space-y-2">
                                                <label className="text-sm font-medium text-slate-700">Categoría *</label>
                                                <select
                                                    {...register('category')}
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {CATEGORIES.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                                {errors.category && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.category.message}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">Precio Referencial ($)</label>
                                                <input
                                                    type="number"
                                                    {...register('price', { valueAsNumber: true })}
                                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Portions */}
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Porción Base</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase">Cantidad Base *</label>
                                                    <input
                                                        type="number"
                                                        {...register('amount', { valueAsNumber: true })}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm"
                                                        placeholder="100"
                                                    />
                                                    {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase">Unidad *</label>
                                                    <select
                                                        {...register('unit')}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm bg-white"
                                                    >
                                                        <option value="g">Gramos (g)</option>
                                                        <option value="ml">Mililitros (ml)</option>
                                                        <option value="unidad">Unidad (u)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 italic">
                                                * Todos los valores nutricionales deben ser ingresados en base a esta cantidad (ej: por cada 100g).
                                            </p>
                                        </div>

                                        {/* Macros */}
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Información Nutricional</h4>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Calorías (kcal) *</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        {...register('calories', { valueAsNumber: true })}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:border-orange-500 focus:ring-orange-500/20"
                                                        placeholder="0"
                                                    />
                                                    {errors.calories && <p className="text-xs text-red-500">{errors.calories.message}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Proteínas (g) *</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        {...register('proteins', { valueAsNumber: true })}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:border-blue-500 focus:ring-blue-500/20"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Carbohidratos (g) *</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        {...register('carbs', { valueAsNumber: true })}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:border-yellow-500 focus:ring-yellow-500/20"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Grasas Totales (g) *</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        {...register('lipids', { valueAsNumber: true })}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:border-red-500 focus:ring-red-500/20"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>

                                            {/* Micros (Optional grid) */}
                                            <div className="grid grid-cols-3 gap-4 pt-2">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-slate-500">Azúcares (g)</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        {...register('sugars', { valueAsNumber: true })}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs"
                                                        placeholder="Opcional"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-slate-500">Fibra (g)</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        {...register('fiber', { valueAsNumber: true })}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs"
                                                        placeholder="Opcional"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-slate-500">Sodio (mg)</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        {...register('sodium', { valueAsNumber: true })}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-xs"
                                                        placeholder="Opcional"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">Etiquetas (Tags)</label>
                                            <Controller
                                                name="tags"
                                                control={control}
                                                render={({ field }) => (
                                                    <TagInput
                                                        placeholder="Escribe y presiona enter (ej: VEGANO, KETO)"
                                                        value={field.value || []}
                                                        onChange={(newTags) => field.onChange(newTags)}
                                                        suggestions={availableTags}
                                                    />
                                                )}
                                            />
                                            <p className="text-xs text-slate-400">Ayuda a filtrar ingredientes rápidamente.</p>
                                        </div>

                                    </form>
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 sticky bottom-0 z-10">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        form="create-ingredient-form"
                                        disabled={isSubmitting}
                                        className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Creando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Guardar Ingrediente
                                            </>
                                        )}
                                    </button>
                                </div>

                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
