import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { X, Tag, BarChart2, Scale, Info } from 'lucide-react';
import { Ingredient } from '@/features/foods';
import { formatCLP } from '@/lib/utils/currency';

interface IngredientDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    ingredient: Ingredient | null;
}

export default function IngredientDetailsModal({ isOpen, onClose, ingredient }: IngredientDetailsModalProps) {
    if (!ingredient) return null;

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
                            <DialogPanel className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border border-slate-100">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-hidden"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Cerrar</span>
                                        <X className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start w-full">
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                        <DialogTitle as="h3" className="text-xl font-black leading-6 text-slate-900 flex items-center gap-2">
                                            <Info className="h-6 w-6 text-emerald-600" />
                                            {ingredient.name}
                                        </DialogTitle>
                                        <div className="mt-2">
                                            <p className="text-sm text-slate-500 font-medium">
                                                {ingredient.brand || 'Marca genérica'} • {ingredient.category}
                                            </p>
                                        </div>

                                        {/* Main Info Grid */}
                                        <div className="mt-6 grid grid-cols-2 gap-4">
                                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Precio Referencia</p>
                                                <p className="text-2xl font-black text-slate-900">{formatCLP(ingredient.price)}</p>
                                                <p className="text-xs text-slate-400 mt-1">Por {ingredient.amount} {ingredient.unit}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Porción Base</p>
                                                <p className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                                    <Scale className="h-5 w-5 text-slate-400" />
                                                    {ingredient.amount} {ingredient.unit}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Nutritional Facts Table */}
                                        <div className="mt-6">
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <BarChart2 className="h-4 w-4 text-slate-400" />
                                                Información Nutricional
                                                <span className="text-[10px] lowercase font-medium text-slate-400 ml-1">(por 100g/ml)</span>
                                            </h4>

                                            <div className="bg-white border boundary-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                <table className="min-w-full divide-y divide-slate-100">
                                                    <tbody className="divide-y divide-slate-50 bg-white">
                                                        <tr className="bg-slate-50/50">
                                                            <td className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Energía</td>
                                                            <td className="px-4 py-3 text-sm font-black text-slate-900 text-right">{ingredient.calories} kcal</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="px-4 py-3 text-xs font-medium text-slate-500">Proteínas</td>
                                                            <td className="px-4 py-3 text-sm font-bold text-slate-700 text-right">{ingredient.proteins} g</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="px-4 py-3 text-xs font-medium text-slate-500">Grasas Totales</td>
                                                            <td className="px-4 py-3 text-sm font-bold text-slate-700 text-right">{ingredient.lipids} g</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="px-4 py-3 text-xs font-medium text-slate-500">Hidratos de Carbono</td>
                                                            <td className="px-4 py-3 text-sm font-bold text-slate-700 text-right">{ingredient.carbs} g</td>
                                                        </tr>
                                                        {ingredient.sugars !== undefined && (
                                                            <tr>
                                                                <td className="px-4 py-3 text-xs font-medium text-slate-400 pl-8">Azúcares Totales</td>
                                                                <td className="px-4 py-3 text-sm font-medium text-slate-500 text-right">{ingredient.sugars} g</td>
                                                            </tr>
                                                        )}
                                                        {ingredient.fiber !== undefined && (
                                                            <tr>
                                                                <td className="px-4 py-3 text-xs font-medium text-slate-500">Fibra Dietética</td>
                                                                <td className="px-4 py-3 text-sm font-bold text-slate-700 text-right">{ingredient.fiber} g</td>
                                                            </tr>
                                                        )}
                                                        {ingredient.sodium !== undefined && (
                                                            <tr>
                                                                <td className="px-4 py-3 text-xs font-medium text-slate-500">Sodio</td>
                                                                <td className="px-4 py-3 text-sm font-bold text-slate-700 text-right">{ingredient.sodium} mg</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        {ingredient.tags && ingredient.tags.length > 0 && (
                                            <div className="mt-6 pt-4 border-t border-slate-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Tag className="h-4 w-4 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tags</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {ingredient.tags.map(tag => (
                                                        <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Ingredients List */}
                                        {ingredient.ingredients && (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ingredientes</p>
                                                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                                    {ingredient.ingredients}
                                                </p>
                                            </div>
                                        )}

                                    </div>
                                </div>
                                <div className="mt-8 sm:flex sm:flex-row-reverse w-full">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 sm:ml-3 sm:w-auto transition-colors"
                                        onClick={onClose}
                                    >
                                        Cerrar
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
