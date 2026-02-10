'use client';

import { useState, useMemo, useEffect } from 'react';
import { Save, ArrowRight, X, Heart, Plus, ChevronDown, ChevronUp, AlertCircle, Sparkles, Info, Zap, Dumbbell, Users, BookOpen, Library, Trash2, FolderPlus, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';
import { MarketPrice, FoodGroup } from '@/features/foods';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatCLP } from '@/lib/utils/currency';

interface DietClientProps {
    initialFoods: MarketPrice[];
}

const DEFAULT_CONSTRAINTS = [
    { id: 'diabetico', label: 'Diabético' },
    { id: 'hipertension', label: 'Hipertensión' },
    { id: 'vegetariano', label: 'Vegetariano' },
    { id: 'celiaco', label: 'Celiaco' },
    { id: 'gluten', label: 'Sin Gluten' },
];

export default function DietClient({ initialFoods }: DietClientProps) {
    const router = useRouter();

    // -- State --
    const [dietName, setDietName] = useState('');
    const [dietTags, setDietTags] = useState<string[]>([]);

    // Constraints
    const [activeConstraints, setActiveConstraints] = useState<string[]>([]);

    // Status Map: Key = Food ID/Product Name, Value = 'base' | 'favorite' | 'removed' | 'added'
    const [foodStatus, setFoodStatus] = useState<Record<string, 'base' | 'favorite' | 'removed' | 'added'>>({});

    const [manualAdditions, setManualAdditions] = useState<MarketPrice[]>([]); // New items not in initial list
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showSupplementsDrawer, setShowSupplementsDrawer] = useState(false);
    const [customConstraints, setCustomConstraints] = useState<{ id: string, label: string }[]>([]);
    const [newConstraintLabel, setNewConstraintLabel] = useState('');
    const [customGroups, setCustomGroups] = useState<string[]>([]); // Track manually created empty groups
    const [isDeleteGroupConfirmOpen, setIsDeleteGroupConfirmOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

    // Derived available tags from foods (excluding generic ones if needed)
    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        initialFoods.forEach(f => f.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).map(t => ({ id: t.toLowerCase(), label: t })); // Simple mapping
    }, [initialFoods]);

    // Merge default constraints with found tags
    const allConstraints = useMemo(() => {
        // Avoid duplicates
        const defaults = DEFAULT_CONSTRAINTS;
        const dynamic = availableTags.filter(t => !defaults.find(d => d.id === t.id));
        return [...defaults, ...dynamic, ...customConstraints];
    }, [availableTags, customConstraints]);

    // Favorites Logic
    // Favorites Logic
    const [favoritesEnabled, setFavoritesEnabled] = useState(true);
    // Initialize base status
    useEffect(() => {
        const statuses: Record<string, 'base' | 'favorite' | 'removed' | 'added'> = {};

        // 1. Identify Base Foods (e.g. from initial list derivation)
        // Re-use derivation logic here or simplify? 
        // For simple sync, let's mark the 'initial' included ones as 'base'

        // Mock favorites from initial data
        const initialFavs = initialFoods.slice(0, 3).map(f => f.producto);

        // Calculate initial "Base" set based on logic (Group top 4)
        const grouped: Record<string, number> = {};
        initialFoods.forEach(f => {
            if (!grouped[f.grupo]) grouped[f.grupo] = 0;
            if (grouped[f.grupo] < 4) {
                statuses[f.producto] = 'base';
                grouped[f.grupo]++;
            }
        });

        // Apply Favorites
        initialFavs.forEach(fav => {
            statuses[fav] = 'favorite'; // Overwrite base if it was base
        });

        setFoodStatus(prev => ({ ...prev, ...statuses }));
    }, [initialFoods]);

    // -- Derived Diet List --
    // -- Derived Diet List --
    const includedFoods = useMemo(() => {
        // Pool of all potential foods: Initial + Manual Additions
        const allPotential = [...initialFoods, ...manualAdditions];

        return allPotential.filter(food => {
            const status = foodStatus[food.producto];

            // 1. If Explicitly Removed, exclude
            if (status === 'removed') return false;

            // 2. If Manual Addition, include (unless removed)
            // (We handle manualAdditions status usually as 'added' or 'base')
            if (manualAdditions.find(ma => ma.producto === food.producto)) {
                return true;
            }

            // 3. Logic for 'Base' or 'Favorite'
            // If it is marked as 'base' or 'favorite' or 'added', we consider it...
            if (status === 'base' || status === 'favorite' || status === 'added') {
                // ...BUT we still apply Constraints unless it's a Favorite?

                // Toggle Logic Check
                if (status === 'favorite' && !favoritesEnabled) {
                    return false;
                }

                // usually favorites override constraints slightly or are exempt. 
                // But let's check constraints for Base items.
                if (status === 'base') {
                    // Check Constraints for Base items
                    if (activeConstraints.includes('vegetariano')) {
                        const meatGroups = [FoodGroup.BOVINA, FoodGroup.CERDO_AVE_CORDERO];
                        if (meatGroups.includes(food.grupo as FoodGroup)) return false;
                    }
                    if (activeConstraints.includes('diabetico')) {
                        const sugarKeywords = ['azucar', 'dulce', 'chocolate', 'galleta', 'bebida', 'nectar', 'mermelada'];
                        if (sugarKeywords.some(k => food.producto.toLowerCase().includes(k))) return false;
                    }
                }

                return true;
            }

            return false; // Not in any active status
        });
    }, [initialFoods, manualAdditions, foodStatus, activeConstraints, favoritesEnabled]);

    // -- Totals Calculation --
    const totalCalories = useMemo(() => {
        return includedFoods.reduce((acc, curr) => acc + (curr.calorias || 0), 0);
    }, [includedFoods]);

    const totalProtein = useMemo(() => {
        // Mock protein calculation if not available (approx 15% of cals / 4)
        return includedFoods.reduce((acc, curr) => acc + (curr.proteinas || Math.floor((curr.calorias || 0) * 0.08)), 0);
    }, [includedFoods]);


    // -- Handlers --

    const toggleConstraint = (id: string) => {
        setActiveConstraints(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const removeFood = (productName: string) => {
        setFoodStatus(prev => ({ ...prev, [productName]: 'removed' }));

        toast("Alimento eliminado de la dieta", {
            action: {
                label: "Deshacer",
                onClick: () => setFoodStatus(prev => {
                    const next = { ...prev };
                    delete next[productName]; // Revert to whatever it was before (undefined -> gone, or original base)
                    // If it was base, we might need to restore 'base'. 
                    // Simplified: If we delete, it goes back to 'default' state, derived from logic again?
                    // Better: We rely on the fact that if it's not 'removed', the derivation logic picks it up again IF it meets criteria.
                    return next;
                })
            }
        });
    };

    const toggleFavorite = (productName: string) => {
        setFoodStatus(prev => {
            const current = prev[productName];
            // Toggle Logic: 
            // If favorite -> go back to 'base' (if it was base?) or 'added'?
            // Simplified: If favorite -> 'base' (assuming it was base). If not -> 'favorite'.

            if (current === 'favorite') {
                return { ...prev, [productName]: 'base' }; // Downgrade to base
            } else {
                return { ...prev, [productName]: 'favorite' }; // Upgrade to favorite
            }
        });
    };

    const handleSave = () => {
        if (!dietName.trim()) {
            toast.error('Por favor, asigna un nombre a la dieta.');
            return;
        }

        // Ideally Save to Backend
        console.log('Saving Diet:', { dietName, dietTags, includedFoods, activeConstraints });

        // Show Success UI
        toast.success(`Dieta "${dietName}" guardada correctamente.`, {
            description: 'Las restricciones seleccionadas generarán contenido educativo automáticamente.',
            action: {
                label: 'Ir a Creaciones',
                onClick: () => router.push('/dashboard/creaciones')
            },
            duration: 5000,
        });
    };

    const handleContinue = () => {
        if (!dietName.trim()) {
            toast.error('Por favor, asigna un nombre a la dieta antes de continuar.');
            return;
        }
        // Save to LocalStorage for next step
        localStorage.setItem('currentDietStep', JSON.stringify({ dietName, dietTags, includedFoods }));

        toast.success("Progreso guardado localmente", {
            description: "Redirigiendo al generador de recetas...",
        });

        // Simulate delay then redirect
        setTimeout(() => {
            // router.push('/dashboard/recetas'); // Placeholder next step
            toast.info("Módulo de Recetas próximamente...");
        }, 1500);
    };

    // Confirm Delete Group Logic
    const confirmDeleteGroup = () => {
        if (groupToDelete) {
            // Mark all foods in this group as removed
            const updates: Record<string, 'removed'> = {};
            initialFoods.filter(f => f.grupo === groupToDelete).forEach(f => {
                updates[f.producto] = 'removed';
            });
            manualAdditions.filter(f => f.grupo === groupToDelete).forEach(f => {
                updates[f.producto] = 'removed';
            });
            setFoodStatus(prev => ({ ...prev, ...updates }));
            toast.success(`Grupo ${groupToDelete} eliminado.`);
            setIsDeleteGroupConfirmOpen(false);
            setGroupToDelete(null);
        }
    };

    // Grouping for Display
    const displayedGroups = useMemo(() => {
        const groups: Record<string, MarketPrice[]> = {};

        let foodsToDisplay = includedFoods;

        // Sorting: Favorites first? Not explicitly asked but good UX.
        // Grouping
        foodsToDisplay.forEach(f => {
            if (!groups[f.grupo]) groups[f.grupo] = [];
            groups[f.grupo].push(f);
        });

        return groups;
    }, [includedFoods]);

    // Derived: Final Groups List (Regular Groups with content + Empty Custom Groups)
    // We want to show custom groups even if they are empty so the user can add items to them.
    const allGroupsToRender = useMemo(() => {
        const renderedGroups = { ...displayedGroups };
        customGroups.forEach(g => {
            if (!renderedGroups[g]) {
                renderedGroups[g] = []; // Initialize empty
            }
        });
        return renderedGroups;
    }, [displayedGroups, customGroups]);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                        <span className="bg-emerald-100 px-2 py-0.5 rounded">Etapa 1</span>
                        <span>Estrategia & Base</span>
                        <GraduationCap className="h-4 w-4 ml-2 cursor-pointer hover:text-emerald-800 transition-colors" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Diseñador de Dieta General</h1>
                    <p className="text-slate-500 font-medium">Define la estructura base y restricciones para tu paciente.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Nombre de la Dieta <span className="text-red-500">*</span></label>
                            <Input
                                placeholder="Ej: Dieta Keto para Juan"
                                value={dietName}
                                onChange={e => setDietName(e.target.value)}
                                className="h-11 border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Etiquetas (Opcional)</label>
                            <TagInput
                                value={dietTags}
                                onChange={setDietTags}
                                placeholder="Ej: Fitness, Bajo en Carbos..."
                            />
                        </div>
                    </div>

                    {/* Constraints Bar */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-emerald-600" />
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Restricciones & Condiciones</label>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {allConstraints.map(constraint => {
                                const isActive = activeConstraints.includes(constraint.id);
                                return (
                                    <button
                                        key={constraint.id}
                                        onClick={() => toggleConstraint(constraint.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all active:scale-95 cursor-pointer",
                                            isActive
                                                ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                            isActive ? "border-white bg-white/20" : "border-slate-300"
                                        )}>
                                            {isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        {constraint.label}
                                        {isActive && (
                                            <div className="ml-1 p-0.5 bg-white/20 rounded-md" title="Contenido educativo vinculado">
                                                <BookOpen className="h-3 w-3" />
                                            </div>
                                        )}
                                    </button>
                                )
                            })}

                            {/* Input to add custom constraint */}
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Nueva restricción..."
                                    className="h-10 w-40 text-xs border-slate-200"
                                    value={newConstraintLabel}
                                    onChange={(e) => setNewConstraintLabel(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newConstraintLabel.trim()) {
                                            const id = newConstraintLabel.toLowerCase().replace(/\s+/g, '-');
                                            if (!allConstraints.find(c => c.id === id)) {
                                                setCustomConstraints(prev => [...prev, { id, label: newConstraintLabel }]);
                                                setActiveConstraints(prev => [...prev, id]);
                                                setNewConstraintLabel('');
                                                toast.success(`Restricción "${newConstraintLabel}" creada.`);
                                            } else {
                                                toast.error("Esta restricción ya existe.");
                                            }
                                        }
                                    }}
                                />
                                <button
                                    className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"
                                    onClick={() => {
                                        if (newConstraintLabel.trim()) {
                                            const id = newConstraintLabel.toLowerCase().replace(/\s+/g, '-');
                                            setCustomConstraints(prev => [...prev, { id, label: newConstraintLabel }]);
                                            setActiveConstraints(prev => [...prev, id]);
                                            setNewConstraintLabel('');
                                        }
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 font-medium ml-1 flex items-center gap-1">
                            <Library className="h-3 w-3" />
                            * Las restricciones marcadas incluirán automáticamente una sección educativa en el entregable final.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Dieta Base Generada
                        <span className="ml-2 text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full border border-slate-200 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Fuente: INTA (2018)
                        </span>
                    </h2>
                    <button
                        onClick={() => setFavoritesEnabled(!favoritesEnabled)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer",
                            favoritesEnabled ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                    >
                        <Heart className={cn("h-4 w-4", favoritesEnabled && "fill-current")} />
                        {favoritesEnabled ? "Favoritos Incluidos" : "Incluir Favoritos"}
                    </button>
                    <button
                        onClick={() => setShowSupplementsDrawer(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                        <Zap className="h-4 w-4 fill-current" />
                        Potenciadores
                    </button>
                </div>

                <div className="grid gap-6">
                    {Object.entries(allGroupsToRender).map(([groupName, foods]) => (
                        <div key={groupName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center group/header">
                                <h3 className="font-bold text-slate-700 uppercase tracking-tight text-sm flex items-center gap-2">
                                    {groupName}
                                    <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-black">{foods.length}</span>
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            const name = prompt("Nombre del alimento a agregar (Simulación):");
                                            if (name) {
                                                const newItem: MarketPrice = {
                                                    id: `manual-${Date.now()}`,
                                                    producto: name,
                                                    grupo: groupName,
                                                    unidad: 'unidad',
                                                    precioMinimo: 0,
                                                    precioMaximo: 0,
                                                    precioPromedio: 0,
                                                    region: 'Metropolitana',
                                                    sector: 'Centro',
                                                    tipoPuntoMonitoreo: 'Supermercado',
                                                    anio: '2025',
                                                    mes: '01',
                                                    semana: '01',
                                                    fechaInicio: '',
                                                    fechaTermino: ''
                                                };
                                                setManualAdditions(prev => [...prev, newItem]);
                                                setFoodStatus(prev => ({ ...prev, [name]: 'added' }));
                                                toast.success(`${name} agregado a la sección ${groupName}`);
                                            }
                                        }}
                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                        title="Agregar alimento rápido"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setGroupToDelete(groupName);
                                            setIsDeleteGroupConfirmOpen(true);
                                        }}
                                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="Eliminar grupo completo"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {foods.map((food, idx) => (
                                    <div key={`${food.producto}-${idx}`} className="p-4 flex items-center justify-between group hover:bg-emerald-50/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                                                {/* Simple emoji mapping based on group could go here, or just generic */}
                                                🍽️
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{food.producto}</p>
                                                <div className="flex gap-2 text-xs text-slate-400 font-medium items-center">
                                                    {foodStatus[food.producto] === 'base' && <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">Base</span>}
                                                    {foodStatus[food.producto] === 'added' && <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">Agregado</span>}

                                                    <span>{food.calorias || 0} kcal</span>
                                                    <span>•</span>
                                                    <span>{formatCLP(food.precioPromedio)}</span>

                                                    <button
                                                        onClick={() => toggleFavorite(food.producto)}
                                                        className={cn("flex items-center gap-0.5 transition-colors cursor-pointer",
                                                            foodStatus[food.producto] === 'favorite' ? "text-red-500" : "text-slate-300 hover:text-red-300"
                                                        )}
                                                        title={foodStatus[food.producto] === 'favorite' ? "Quitar de favoritos" : "Marcar como favorito"}
                                                    >
                                                        <Heart className={cn("h-3 w-3", foodStatus[food.producto] === 'favorite' && "fill-current")} />
                                                        {foodStatus[food.producto] === 'favorite' && "Favorito"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFood(food.producto)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                            title="Quitar de la dieta"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                                <div className="p-3 bg-slate-50/50 text-center">
                                    <button
                                        onClick={() => {
                                            const name = prompt("Nombre del alimento a agregar (Simulación):");
                                            if (name) {
                                                const newItem: MarketPrice = {
                                                    id: `manual-${Date.now()}`,
                                                    producto: name,
                                                    grupo: groupName, // Add to current group
                                                    unidad: 'unidad',
                                                    precioMinimo: 0,
                                                    precioMaximo: 0,
                                                    precioPromedio: 0,
                                                    region: 'Metropolitana',
                                                    sector: 'Centro',
                                                    tipoPuntoMonitoreo: 'Supermercado',
                                                    anio: '2025',
                                                    mes: '01',
                                                    semana: '01',
                                                    fechaInicio: '',
                                                    fechaTermino: ''
                                                };
                                                setManualAdditions(prev => [...prev, newItem]);
                                                toast.success(`${name} agregado a la sección ${groupName}`);
                                            }
                                        }}
                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1 mx-auto py-1 px-3 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                                    >
                                        <Plus className="h-3 w-3" /> Agregar alimento a esta sección
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Group Button */}
                    <button
                        onClick={() => {
                            const name = prompt("Nombre del nuevo grupo de alimentos:");
                            if (name && name.trim()) {
                                if (customGroups.includes(name) || Object.keys(displayedGroups).includes(name)) {
                                    toast.error("Este grupo ya existe.");
                                } else {
                                    setCustomGroups(prev => [...prev, name]);
                                    toast.success(`Grupo "${name}" creado.`);
                                }
                            }
                        }}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/10 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                    >
                        <div className="p-2 bg-slate-50 rounded-full group-hover:bg-emerald-100 transition-colors">
                            <FolderPlus className="h-5 w-5" />
                        </div>
                        Crear Nuevo Grupo de Alimentos
                    </button>

                    {Object.keys(displayedGroups).length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                            <p className="text-slate-400 font-medium">No hay alimentos en la dieta.</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setFoodStatus({})}
                            >
                                Restaurar Dieta Base
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-slate-50/90 backdrop-blur-md border-t border-slate-200 p-4 -mx-4 md:-mx-8 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 z-10 transition-colors">

                {/* Stats Left */}
                <div className="flex items-center gap-6 text-sm font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">Proteínas totales:</span>
                        <span className="font-bold text-slate-800">{totalProtein}g</span>
                    </div>
                    <div className="w-px h-4 bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">Calorías totales:</span>
                        <span className="font-bold text-slate-800">{totalCalories} kcal</span>
                    </div>
                    <button
                        onClick={() => setShowInfoModal(true)}
                        className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                        <Info className="h-4 w-4" />
                    </button>
                </div>

                {/* Buttons Right */}
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/creaciones" className="hidden" id="creations-link" />

                    <Button
                        variant="ghost"
                        className="h-12 px-6 font-bold text-slate-600 hover:text-slate-900"
                        onClick={() => {/* Cancel logic */ }}
                    >
                        Cancelar
                    </Button>

                    <Button
                        className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200"
                        onClick={handleSave}
                    >
                        <Save className="mr-2 h-5 w-5" />
                        Guardar Creación
                    </Button>

                    <Button
                        className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200"
                        onClick={handleContinue}
                    >
                        Continuar
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Info Modal */}
            {
                showInfoModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200 cursor-default"
                        onClick={() => setShowInfoModal(false)}
                    >
                        <div
                            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Info className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-slate-900">Recomendaciones Mock</h3>
                                </div>
                                <button onClick={() => setShowInfoModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                    <span className="text-sm font-medium text-slate-600">Proteínas Recomendadas</span>
                                    <span className="text-sm font-bold text-slate-900">140g - 160g</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                    <span className="text-sm font-medium text-slate-600">Calorías Recomendadas</span>
                                    <span className="text-sm font-bold text-slate-900">2200 - 2500 kcal</span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 text-center pt-2">Valores referenciales basados en perfil promedio.</p>
                            <Button
                                className="w-full bg-slate-900 text-white font-bold rounded-xl"
                                onClick={() => setShowInfoModal(false)}
                            >
                                Entendido
                            </Button>
                        </div>
                    </div>
                )
            }

            {/* Supplements Power Drawer (Right Sidebar Mock) */}
            {
                showSupplementsDrawer && (
                    <div
                        className="fixed inset-0 z-50 flex justify-end bg-black/10 backdrop-blur-[1px] cursor-default"
                        onClick={() => setShowSupplementsDrawer(false)}
                    >
                        <div
                            className="w-96 bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col cursor-default"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                        <Zap className="h-5 w-5 fill-current" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 leading-tight">Potenciadores</h3>
                                        <p className="text-xs text-slate-500 font-medium">Suplementos & Vitaminas</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowSupplementsDrawer(false)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Suggestions Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                                        <Sparkles className="h-3 w-3" />
                                        Sugerido por IA
                                    </div>
                                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl relative overflow-hidden group hover:border-blue-200 transition-all cursor-move">
                                        <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-bl-xl">
                                            Alta Pureza
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-blue-50 flex items-center justify-center">
                                                <Dumbbell className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">Whey Protein Isolate</h4>
                                                <p className="text-xs text-slate-500 mb-1">Optimum Nutrition • Vainilla</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-blue-700">Premium Isolate</span>
                                                    <span className="text-[10px] text-slate-400 border border-slate-200 px-1 rounded">Partner</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-800 text-sm">Categorías</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Proteínas', 'Vitaminas', 'Creatina', 'Pre-Workout'].map(cat => (
                                            <div key={cat} className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-center cursor-pointer transition-colors">
                                                <span className="text-xs font-bold text-slate-600">{cat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-400">
                                Arrastra los items a tu pauta diaria
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteGroupConfirmOpen}
                onClose={() => setIsDeleteGroupConfirmOpen(false)}
                onConfirm={confirmDeleteGroup}
                title={`¿Eliminar grupo "${groupToDelete}"?`}
                description="Se eliminarán todos los alimentos de este grupo de la vista actual."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
            />
        </div >
    );
}
