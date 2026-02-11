'use client';

import { useState, useMemo, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
    Search, Loader2, Filter, Star, Heart, Plus, ChevronDown, ChevronUp,
    AlertCircle, Sparkles, Info, BookOpen,
    Library, Trash2, FolderPlus, GraduationCap, Save, ArrowRight, X, Brain, CheckCircle2,
    Calendar, User, Tag as TagIcon, ListChecks, Check
} from 'lucide-react';
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
import Cookies from 'js-cookie';

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

const getUserDraftKey = () => {
    if (typeof window === 'undefined') return 'nutrisaas_diet_draft';
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.id) return `nutrisaas_diet_draft_${user.id}`;
        }
    } catch (e) { }
    return 'nutrisaas_diet_draft';
};

export default function DietClient({ initialFoods }: DietClientProps) {
    const router = useRouter();

    // -- State --
    const [dietName, setDietName] = useState('');
    const [dietTags, setDietTags] = useState<string[]>([]);
    const [activeConstraints, setActiveConstraints] = useState<string[]>([]);
    const [foodStatus, setFoodStatus] = useState<Record<string, 'base' | 'favorite' | 'removed' | 'added'>>({});
    const [manualAdditions, setManualAdditions] = useState<MarketPrice[]>([]);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showSupplementsDrawer, setShowSupplementsDrawer] = useState(false);
    const [customConstraints, setCustomConstraints] = useState<{ id: string, label: string }[]>([]);
    const [newConstraintLabel, setNewConstraintLabel] = useState('');
    const [customGroups, setCustomGroups] = useState<string[]>([]);
    const [isDeleteGroupConfirmOpen, setIsDeleteGroupConfirmOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
    const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
    const [activeGroupForAddition, setActiveGroupForAddition] = useState<string | null>(null);
    const [foodSearchQuery, setFoodSearchQuery] = useState('');
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
    const [newGroupNameInput, setNewGroupNameInput] = useState('');
    const [searchResultFoods, setSearchResultFoods] = useState<MarketPrice[]>([]);
    const [isSearchingFoods, setIsSearchingFoods] = useState(false);
    const [isApplyingPreferences, setIsApplyingPreferences] = useState(false);

    // -- Smart Add State --
    const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
    const [smartAddTab, setSmartAddTab] = useState<'favorites' | 'groups' | 'myproducts'>('favorites');
    const [smartFavorites, setSmartFavorites] = useState<any[]>([]);
    const [smartGroups, setSmartGroups] = useState<any[]>([]);
    const [smartMyProducts, setSmartMyProducts] = useState<any[]>([]);
    const [selectedFoods, setSelectedFoods] = useState<Set<string>>(new Set());
    const [isLoadingSmart, setIsLoadingSmart] = useState(false);

    // -- Food Info Modal State --
    const [isFoodInfoModalOpen, setIsFoodInfoModalOpen] = useState(false);
    const [selectedFoodForInfo, setSelectedFoodForInfo] = useState<MarketPrice | null>(null);

    // -- Import Diet Modal State --
    const [isImportDietModalOpen, setIsImportDietModalOpen] = useState(false);
    const [savedDiets, setSavedDiets] = useState<any[]>([]);
    const [isLoadingDiets, setIsLoadingDiets] = useState(false);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [dietSearchQuery, setDietSearchQuery] = useState('');

    const favoritesEnabled = true; // Always enabled by request

    const fetchAvailableTags = async () => {
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/creations/tags`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const tags = await response.json();
                setAvailableTags(tags);
            }
        } catch (e) {
            console.error("Error fetching tags", e);
        }
    };

    const fetchSavedDiets = async () => {
        setIsLoadingDiets(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/creations?type=DIET`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSavedDiets(data);
            }
        } catch (e) {
            console.error("Error fetching diets", e);
            toast.error("No se pudieron cargar las dietas guardadas");
        } finally {
            setIsLoadingDiets(false);
        }
    };

    const handleImportDiet = (diet: any) => {
        const { content } = diet;
        if (!content) {
            toast.error("Esta dieta no tiene contenido válido");
            return;
        }

        setDietName(diet.name || '');
        setDietTags(diet.tags || []);
        setActiveConstraints(content.activeConstraints || []);
        setManualAdditions(content.manualAdditions || []);
        setCustomGroups(content.customGroups || []);
        setCustomConstraints(content.customConstraints || []);

        // Actualizar estados de alimentos
        // Nota: Los alimentos base de initialFoods que no están en el borrador seguirán como 'base'
        // gracias al merge en setFoodStatus
        if (content.foodStatus) {
            setFoodStatus(prev => ({ ...prev, ...content.foodStatus }));
        }

        setIsImportDietModalOpen(false);
        setDietSearchQuery('');
        toast.success(`Dieta "${diet.name}" importada correctamente`);
    };

    // Inicializar o cargar borrador o edición
    useEffect(() => {
        fetchAvailableTags();
        const statuses: Record<string, 'base' | 'favorite' | 'removed' | 'added'> = {};
        initialFoods.forEach(f => {
            statuses[f.producto] = 'base';
        });

        const loadFromBackend = async (id: string) => {
            if (!id || id === 'undefined' || id === 'null') {
                localStorage.removeItem('currentDietEditId');
                return;
            }

            try {
                const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

                const response = await fetch(`${apiUrl}/creations/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const text = await response.text();
                    if (!text) {
                        console.warn("La respuesta del servidor está vacía para el ID:", id);
                        localStorage.removeItem('currentDietEditId');
                        return;
                    }

                    try {
                        const data = JSON.parse(text);
                        handleImportDiet(data);
                    } catch (parseError) {
                        console.error("Error parseando JSON de la creación:", parseError);
                    }
                } else {
                    console.error("Error en la respuesta del servidor:", response.status);
                    if (response.status === 404) {
                        toast.error("La dieta que intentas editar ya no existe.");
                    }
                }
            } catch (e) {
                console.error("Error loading creation to edit", e);
            } finally {
                localStorage.removeItem('currentDietEditId');
            }
        };

        const editId = localStorage.getItem('currentDietEditId');
        if (editId) {
            loadFromBackend(editId);
            return;
        }

        const savedDraft = localStorage.getItem(getUserDraftKey());
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                setDietName(draft.dietName || '');
                setDietTags(draft.dietTags || []);
                setActiveConstraints(draft.activeConstraints || []);
                setManualAdditions(draft.manualAdditions || []);
                setCustomGroups(draft.customGroups || []);
                setCustomConstraints(draft.customConstraints || []);
                setFoodStatus({ ...statuses, ...draft.foodStatus });
                return;
            } catch (e) {
                console.error("Error loading draft", e);
            }
        }
        setFoodStatus(statuses);
    }, [initialFoods]);

    // Alimentos incluidos
    const includedFoods = useMemo(() => {
        const allPotential = [...initialFoods, ...manualAdditions];

        return allPotential.filter((food, idx) => {
            if (idx < initialFoods.length) {
                const hasManualOverride = manualAdditions.some(ma => ma.producto === food.producto);
                if (hasManualOverride) return false;
            }

            const status = foodStatus[food.producto];
            if (status === 'removed') return false;

            if (manualAdditions.some(ma => ma.producto === food.producto)) {
                return true;
            }

            if (status === 'base' || status === 'favorite' || status === 'added') {
                if (status === 'base') {
                    if (activeConstraints.includes('vegetariano')) {
                        const meatGroups = ['Carnes y Vísceras', 'Pescados y Mariscos', 'Huevos'];
                        if (meatGroups.includes(food.grupo)) return false;
                    }
                    if (activeConstraints.includes('diabetico')) {
                        if (food.azucares !== undefined && food.azucares > 10) return false;
                        const sugarKeywords = ['azucar', 'dulce', 'chocolate', 'galleta', 'bebida', 'nectar', 'mermelada', 'miel'];
                        if (sugarKeywords.some(k => food.producto.toLowerCase().includes(k))) return false;
                    }
                    if (activeConstraints.includes('celiaco') || activeConstraints.includes('gluten')) {
                        const glutenGroups = ['Cereales y Derivados'];
                        const glutenKeywords = ['trigo', 'cebada', 'centeno', 'pan', 'fideos', 'galleta'];
                        if (glutenGroups.includes(food.grupo) && glutenKeywords.some(k => food.producto.toLowerCase().includes(k))) return false;
                    }
                }
                return true;
            }
            return false;
        });
    }, [initialFoods, manualAdditions, foodStatus, activeConstraints]);

    // Totales
    const totalCalories = useMemo(() => includedFoods.reduce((acc, curr) => acc + (curr.calorias || 0), 0), [includedFoods]);
    const totalProtein = useMemo(() => includedFoods.reduce((acc, curr) => acc + (curr.proteinas || 0), 0), [includedFoods]);
    const totalCarbs = useMemo(() => includedFoods.reduce((acc, curr) => acc + (curr.carbohidratos || 0), 0), [includedFoods]);
    const totalFats = useMemo(() => includedFoods.reduce((acc, curr) => acc + (curr.lipidos || 0), 0), [includedFoods]);

    const toggleConstraint = (id: string) => {
        setActiveConstraints(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const removeFood = (productName: string) => {
        setFoodStatus(prev => {
            const next: Record<string, 'base' | 'favorite' | 'removed' | 'added'> = { ...prev, [productName]: 'removed' };
            // Actualizar borrador
            try {
                const currentDraftKey = getUserDraftKey();
                const draftStr = localStorage.getItem(currentDraftKey);
                const draft = draftStr ? JSON.parse(draftStr) : {};
                localStorage.setItem(currentDraftKey, JSON.stringify({
                    ...draft,
                    foodStatus: { ...(draft.foodStatus || {}), [productName]: 'removed' }
                }));
            } catch (e) { }
            return next;
        });

        toast("Alimento eliminado de la dieta", {
            action: {
                label: "Deshacer",
                onClick: () => setFoodStatus(prev => {
                    const next = { ...prev };
                    delete next[productName];
                    return next;
                })
            }
        });
    };

    const toggleFavorite = async (food: MarketPrice) => {
        const productName = food.producto;
        const previousStatus = foodStatus[productName];
        const isCurrentlyFavorite = previousStatus === 'favorite';
        const newStatus = isCurrentlyFavorite ? (manualAdditions.some(ma => ma.producto === productName) ? 'added' : 'base') : 'favorite' as const;

        // 1. UI Local & Feedback Inmediato
        if (!isCurrentlyFavorite) {
            toast.success(`${productName} guardado en favoritos ✨`);
        } else {
            toast.info(`${productName} eliminado de favoritos`);
        }

        setFoodStatus(prev => {
            const next: Record<string, 'base' | 'favorite' | 'removed' | 'added'> = { ...prev, [productName]: newStatus };
            try {
                const currentDraftKey = getUserDraftKey();
                const draftStr = localStorage.getItem(currentDraftKey);
                const draft = draftStr ? JSON.parse(draftStr) : {};
                localStorage.setItem(currentDraftKey, JSON.stringify({
                    ...draft,
                    foodStatus: { ...(draft.foodStatus || {}), [productName]: newStatus }
                }));
            } catch (e) { }
            return next;
        });

        // 2. Persistencia Backend (En segundo plano)
        const token = Cookies.get('auth_token');
        if (token) {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
                let targetId = food.id;

                if (food.id && food.id.startsWith('base-')) {
                    const res = await fetch(`${apiUrl}/foods?search=${encodeURIComponent(productName)}&limit=1`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const results = await res.json();
                        const matching = results.find((r: any) => r.name.toLowerCase() === productName.toLowerCase());
                        if (matching) targetId = matching.id;
                    }
                }

                if (targetId && !targetId.startsWith('base-') && !targetId.startsWith('search-') && !targetId.startsWith('manual-')) {
                    await fetch(`${apiUrl}/foods/${targetId}/preferences`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ isFavorite: !isCurrentlyFavorite })
                    });
                }
            } catch (e) {
                console.error("Error toggling favorite", e);
            }
        }
    };

    const handleSave = async () => {
        if (!dietName.trim()) {
            toast.error('Por favor, asigna un nombre a la dieta.');
            return;
        }

        // Guardar estado actual en borrador
        saveAsDraft();

        const dietJson = {
            dietName,
            dietTags,
            activeConstraints,
            foodStatus,
            manualAdditions,
            customGroups,
            customConstraints,
            favoritesEnabled,
            timestamp: Date.now()
        };

        try {
            const token = Cookies.get('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

            const response = await fetch(`${apiUrl}/creations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: dietName,
                    type: 'DIET',
                    content: dietJson,
                    metadata: {
                        foodCount: includedFoods.length,
                        totalCalories: includedFoods.reduce((acc, f) => acc + (f.calorias || 0), 0),
                        activeConstraints: activeConstraints,
                        foodSummary: includedFoods.map(f => ({ name: f.producto, group: f.grupo }))
                    },
                    tags: dietTags
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar la creación');
            }

            toast.success(`Dieta "${dietName}" guardada correctamente en Mis Creaciones.`, {
                description: 'Las restricciones seleccionadas generarán contenido educativo automáticamente.',
                action: { label: 'Ir a Creaciones', onClick: () => router.push('/dashboard/creaciones') },
                duration: 5000,
            });
            fetchAvailableTags();
        } catch (error: any) {
            console.error('Error saving creation:', error);
            toast.error(error.message || 'No se pudo guardar la creación en la base de datos.');
        }
    };

    const handleContinue = () => {
        if (!dietName.trim()) {
            toast.error('Por favor, asigna un nombre a la dieta antes de continuar.');
            return;
        }
        // Guardar estado actual antes de continuar
        saveAsDraft();

        localStorage.setItem('currentDietStep', JSON.stringify({ dietName, dietTags, includedFoods }));
        toast.success("Progreso guardado localmente");
        setTimeout(() => toast.info("Módulo de Recetas próximamente..."), 1500);
    };

    const confirmDeleteGroup = () => {
        if (groupToDelete) {
            const updates: Record<string, 'removed'> = {};
            initialFoods.filter(f => f.grupo === groupToDelete).forEach(f => { updates[f.producto] = 'removed'; });
            manualAdditions.filter(f => f.grupo === groupToDelete).forEach(f => { updates[f.producto] = 'removed'; });
            setFoodStatus(prev => ({ ...prev, ...updates }));
            toast.success(`Grupo ${groupToDelete} eliminado.`);
            setIsDeleteGroupConfirmOpen(false);
            setGroupToDelete(null);
        }
    };

    const allGroupsToRender = useMemo(() => {
        const renderedGroups: Record<string, MarketPrice[]> = {};
        includedFoods.forEach(f => {
            if (!renderedGroups[f.grupo]) renderedGroups[f.grupo] = [];
            renderedGroups[f.grupo].push(f);
        });
        customGroups.forEach(g => { if (!renderedGroups[g]) renderedGroups[g] = []; });
        const finalGroups: Record<string, MarketPrice[]> = {};
        Object.entries(renderedGroups).forEach(([name, foods]) => {
            if (foods.length > 0 || customGroups.includes(name)) finalGroups[name] = foods;
        });
        return finalGroups;
    }, [includedFoods, customGroups]);

    useEffect(() => {
        if (!isAddFoodModalOpen || !foodSearchQuery.trim()) {
            setSearchResultFoods([]);
            setIsSearchingFoods(false);
            return;
        }

        const fetchFoods = async () => {
            setIsSearchingFoods(true);
            const token = Cookies.get('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
            try {
                const res = await fetch(`${apiUrl}/foods?search=${foodSearchQuery}&limit=20`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSearchResultFoods(data.map((ing: any) => ({
                        id: ing.id,
                        producto: ing.name,
                        grupo: ing.category?.name || 'Varios',
                        unidad: ing.unit || 'g',
                        precioPromedio: ing.price || 0,
                        calorias: ing.calories || 0,
                        proteinas: ing.proteins || 0,
                        carbohidratos: ing.carbs || 0,
                        lipidos: ing.lipids || 0,
                        tags: ing.tags?.map((t: any) => t.name) || []
                    })));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearchingFoods(false);
            }
        };

        const timeoutId = setTimeout(fetchFoods, 300);
        return () => clearTimeout(timeoutId);
    }, [isAddFoodModalOpen, foodSearchQuery]);

    const dietJson = useMemo(() => ({
        dietName, tags: dietTags, activeConstraints, categories: allGroupsToRender,
        summary: Object.fromEntries(Object.entries(allGroupsToRender).map(([n, f]) => [n, f.length]))
    }), [dietName, dietTags, activeConstraints, allGroupsToRender]);

    const printJson = () => {
        console.log('DIET DATA:', dietJson);
        toast.info("Datos impresos en consola.");
    };

    const resetDiet = () => {
        setDietName(''); setDietTags([]); setActiveConstraints([]); setManualAdditions([]);
        setCustomGroups([]); setCustomConstraints([]); localStorage.removeItem(getUserDraftKey());
        const st: Record<string, 'base'> = {};
        initialFoods.forEach(f => { st[f.producto] = 'base'; });
        setFoodStatus(st as any);
        toast.success("Dieta reiniciada.");
    };

    const saveAsDraft = () => {
        localStorage.setItem(getUserDraftKey(), JSON.stringify({
            dietName, dietTags, activeConstraints, foodStatus, manualAdditions,
            customGroups, customConstraints, favoritesEnabled, timestamp: Date.now()
        }));
        toast.success("Borrador guardado.");
    };

    const openAddModal = (groupName: string) => {
        setActiveGroupForAddition(groupName); setFoodSearchQuery(''); setIsAddFoodModalOpen(true);
    };

    const handleAddFromSearch = (food: MarketPrice) => {
        if (!activeGroupForAddition) return;
        setFoodStatus(prev => ({ ...prev, [food.producto]: 'added' as const }));
        const isInInitial = initialFoods.some(f => f.producto === food.producto);
        const alreadyInManual = manualAdditions.some(ma => ma.producto === food.producto && ma.grupo === activeGroupForAddition);

        if (!isInInitial && !alreadyInManual) {
            setManualAdditions(prev => [...prev, { ...food, grupo: activeGroupForAddition!, id: `search-${Date.now()}` }]);
        } else if (isInInitial) {
            const baseFood = initialFoods.find(f => f.producto === food.producto);
            if (baseFood && baseFood.grupo !== activeGroupForAddition) {
                setManualAdditions(prev => [...prev, { ...food, grupo: activeGroupForAddition!, id: `override-${Date.now()}` }]);
            }
        }
        toast.success(`${food.producto} añadido.`);
        setIsAddFoodModalOpen(false);
    };

    const handleCreateGroup = () => {
        const name = newGroupNameInput.trim();
        if (!name) return toast.error("Nombre vacío.");
        if (Object.keys(allGroupsToRender).includes(name)) return toast.error("Grupo duplicado.");
        setCustomGroups(prev => [...prev, name]); setNewGroupNameInput(''); setIsAddGroupModalOpen(false);
        setActiveGroupForAddition(name); setIsAddFoodModalOpen(true);
        toast.success(`Grupo "${name}" creado.`);
    };

    const applyNutritionistPreferences = async () => {
        setIsApplyingPreferences(true);
        const token = Cookies.get('auth_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
        try {
            // Agregamos limit=1000 para asegurar que traemos todos los alimentos configurados por el nutri
            const res = await fetch(`${apiUrl}/foods?limit=1000`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const allFoods = await res.json();

                const favorites = allFoods.filter((f: any) => f.preferences?.[0]?.isFavorite);
                const notRec = allFoods.filter((f: any) => f.preferences?.[0]?.isNotRecommended).map((f: any) => f.name);

                console.log('DEBUG - Preferencias cargadas:', {
                    totalAlimentosRecibidos: allFoods.length,
                    favoritosCount: favorites.length,
                    noRecomendadosCount: notRec.length,
                    nombresNoRecomendados: notRec
                });

                setFoodStatus(prev => {
                    const next: Record<string, 'base' | 'favorite' | 'removed' | 'added'> = { ...prev };

                    // Quitar no recomendados (con comparación insensible a mayúsculas)
                    notRec.forEach((name: string) => {
                        const nameLow = name.toLowerCase().trim();
                        const baseMatch = initialFoods.find(b => b.producto.toLowerCase().trim() === nameLow);
                        const manualMatch = manualAdditions.find(ma => ma.producto.toLowerCase().trim() === nameLow);

                        if (baseMatch) {
                            console.log(`DEBUG - Quitando de dieta base: ${baseMatch.producto} (coincide con no recomendado: ${name})`);
                            next[baseMatch.producto] = 'removed';
                        } else if (manualMatch) {
                            console.log(`DEBUG - Quitando de adiciones manuales: ${manualMatch.producto} (coincide con no recomendado: ${name})`);
                            next[manualMatch.producto] = 'removed';
                        } else {
                            console.log(`DEBUG - No recomendado "${name}" no se encontró en la dieta actual (ni base ni manual).`);
                        }
                    });

                    // Marcar favoritos existentes
                    favorites.forEach((f: any) => {
                        const favNameLow = f.name.toLowerCase().trim();
                        const baseMatch = initialFoods.find(b => b.producto.toLowerCase().trim() === favNameLow);
                        if (baseMatch) {
                            next[baseMatch.producto] = 'favorite';
                        } else {
                            const manualMatch = manualAdditions.find(ma => ma.producto.toLowerCase().trim() === favNameLow);
                            if (manualMatch) next[manualMatch.producto] = 'favorite';
                        }
                    });

                    return next;
                });

                setManualAdditions(prev => {
                    // Normalizar nombres existentes para evitar duplicados por minúsculas/mayúsculas
                    const existingNamesLower = new Set([
                        ...initialFoods.map(f => f.producto.toLowerCase().trim()),
                        ...prev.map(ma => ma.producto.toLowerCase().trim())
                    ]);

                    const notRecNamesLower = new Set(notRec.map((n: string) => n.toLowerCase().trim()));

                    const newFavs = favorites
                        .filter((f: any) => {
                            const nameLow = f.name.toLowerCase().trim();
                            // No añadir si ya existe o si es un alimento no recomendado
                            return !existingNamesLower.has(nameLow) && !notRecNamesLower.has(nameLow);
                        })
                        .map((f: any) => ({
                            id: f.id,
                            producto: f.name,
                            grupo: f.category?.name || 'Varios',
                            calorias: f.calories || 0,
                            proteinas: f.proteins || 0,
                            carbohidratos: f.carbs || 0,
                            lipidos: f.lipids || 0,
                            unidad: f.unit || 'g',
                            precioPromedio: f.price || 0,
                            tags: f.tags?.map((t: any) => t.name) || []
                        }));
                    return [...prev, ...newFavs];
                });
                toast.success("Preferencias aplicadas ✨");
            }
        } catch (e) {
            toast.error("Error al cargar preferencias.");
        } finally {
            setIsApplyingPreferences(false);
        }
    };

    const fetchSmartAddData = async () => {
        setIsLoadingSmart(true);
        const token = Cookies.get('auth_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
        try {
            // Fetch All Foods for Favorites
            const foodsRes = await fetch(`${apiUrl}/foods?limit=1000`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (foodsRes.ok) {
                const allFoods = await foodsRes.json();
                setSmartFavorites(allFoods.filter((f: any) => f.preferences?.[0]?.isFavorite));
            }

            // Fetch Groups
            const groupsRes = await fetch(`${apiUrl}/ingredient-groups`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (groupsRes.ok) {
                const groups = await groupsRes.json();
                setSmartGroups(groups);
            }
        } catch (error) {
            toast.error("Error al cargar datos para adición inteligente");
        } finally {
            setIsLoadingSmart(false);
        }
    };

    const toggleSmartSelection = (id: string) => {
        setSelectedFoods(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleGroupSelection = (groupId: string) => {
        const group = smartGroups.find(g => g.id === groupId);
        if (!group || !group.ingredients) return;

        const ingredientIds = group.ingredients
            .filter((rel: any) => rel.ingredient)
            .map((rel: any) => (rel.ingredient as any).id as string);

        setSelectedFoods(prev => {
            const next = new Set(prev);
            const allSelected = ingredientIds.every((id: string) => next.has(id));

            if (allSelected) {
                // Unselect all in this group
                ingredientIds.forEach((id: string) => next.delete(id));
            } else {
                // Select all in this group
                ingredientIds.forEach((id: string) => next.add(id));
            }
            return next;
        });
    };

    const handleSmartAddAll = () => {
        const foodsToAdd: any[] = [];
        const selectedIds = Array.from(selectedFoods);

        selectedIds.forEach((id: string) => {
            let found = smartFavorites.find(f => f.id === id);
            if (!found) {
                smartGroups.forEach(g => {
                    const groupFood = g.ingredients?.find((rel: any) => rel.ingredient?.id === id);
                    if (groupFood) found = groupFood.ingredient;
                });
            }

            if (found) {
                foodsToAdd.push({
                    producto: found.name,
                    grupo: found.category?.name || 'Varios',
                    calorias: found.calories || 0,
                    proteinas: found.proteins || 0,
                    carbohidratos: found.carbs || 0,
                    lipidos: found.lipids || 0,
                    unidad: found.unit || 'g',
                    precioPromedio: found.price || 0,
                    id: found.id || `smart-${Date.now()}-${Math.random()}`
                });
            }
        });

        if (foodsToAdd.length === 0) {
            toast.error("No hay alimentos seleccionados");
            return;
        }

        setFoodStatus(prev => {
            const next = { ...prev };
            foodsToAdd.forEach(f => { next[f.producto] = 'added'; });
            return next;
        });

        setManualAdditions(prev => {
            const existingNames = new Set([
                ...initialFoods.map(f => f.producto.toLowerCase().trim()),
                ...prev.map(ma => ma.producto.toLowerCase().trim())
            ]);

            const actuallyNew = foodsToAdd.filter(f => !existingNames.has(f.producto.toLowerCase().trim()));
            return [...prev, ...actuallyNew];
        });

        toast.success(`${foodsToAdd.length} alimentos añadidos a la dieta 🚀`);
        setIsSmartModalOpen(false);
        setSelectedFoods(new Set());
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                        <span className="bg-emerald-100 px-2 py-0.5 rounded">Etapa 1</span>
                        <span>Estrategia & Base</span>
                        <GraduationCap className="h-4 w-4 ml-2" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Diseñador de Dieta General</h1>
                    <p className="text-slate-500 font-medium">Define la estructura base y restricciones para tu paciente.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Nombre de la Dieta <span className="text-red-500">*</span></label>
                            <Input placeholder="Ej: Dieta Keto" value={dietName} onChange={e => setDietName(e.target.value)} className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Etiquetas</label>
                            <TagInput
                                value={dietTags}
                                onChange={setDietTags}
                                placeholder="Tags..."
                                suggestions={availableTags}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Library className="h-4 w-4 text-indigo-600" />
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Importar Dieta Base</label>
                        </div>
                        <Button
                            onClick={() => {
                                setIsImportDietModalOpen(true);
                                fetchSavedDiets();
                            }}
                            variant="outline"
                            className="w-full h-12 border-2 border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 font-black rounded-xl transition-all"
                        >
                            <Library className="h-5 w-5 mr-2" />
                            Cargar dieta creada anteriormente
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Dieta Base Generada
                    </h2>
                    <Button
                        onClick={applyNutritionistPreferences}
                        disabled={isApplyingPreferences}
                        className="h-10 px-6 bg-slate-900 text-white hover:bg-slate-800 border-none font-black text-sm rounded-xl gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        {isApplyingPreferences ? <Loader2 className="h-5 w-5 animate-spin" /> : <Filter className="h-5 w-5" />}
                        Añadir favoritos y quitar no recomendados
                    </Button>
                </div>

                <div className="grid gap-6">
                    {Object.entries(allGroupsToRender).map(([name, foods]) => (
                        <div key={name} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700 uppercase tracking-tight text-sm flex items-center gap-2">
                                    {name}
                                    <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-black">{foods.length}</span>
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={() => openAddModal(name)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"><Plus className="h-4 w-4" /></button>
                                    <button onClick={() => { setGroupToDelete(name); setIsDeleteGroupConfirmOpen(true); }} className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {foods.map((food, idx) => (
                                    <div key={`${food.producto}-${idx}`} className="p-4 flex items-center justify-between group hover:bg-emerald-50/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">🍽️</div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{food.producto}</p>
                                                <div className="flex gap-2 text-xs text-slate-500 font-medium items-center flex-wrap">
                                                    <span className="text-orange-600 font-bold">{food.calorias || 0} kcal</span>
                                                    <span>•</span>
                                                    <span className="text-blue-600">P: {food.proteinas || 0}g</span>
                                                    <span>•</span>
                                                    <span className="text-emerald-600">C: {food.carbohidratos || 0}g</span>
                                                    <span>•</span>
                                                    <span className="text-yellow-600">L: {food.lipidos || 0}g</span>
                                                    {(food as any).sugars > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-slate-500">Az: {(food as any).sugars}g</span>
                                                        </>
                                                    )}
                                                    {(food as any).fiber > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-slate-500">Fib: {(food as any).fiber}g</span>
                                                        </>
                                                    )}
                                                    {(food as any).sodium > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-slate-500">Na: {(food as any).sodium}mg</span>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => toggleFavorite(food)}
                                                        className={cn("flex items-center gap-1 transition-colors cursor-pointer",
                                                            foodStatus[food.producto] === 'favorite' ? "text-amber-500" : "text-slate-300 hover:text-amber-300"
                                                        )}
                                                    >
                                                        <Star className={cn("h-3 w-3", foodStatus[food.producto] === 'favorite' && "fill-current")} />
                                                        {foodStatus[food.producto] === 'favorite' && "Favorito"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedFoodForInfo(food);
                                                    setIsFoodInfoModalOpen(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl cursor-pointer transition-colors"
                                            >
                                                <Info className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => removeFood(food.producto)} className="p-2 text-slate-400 hover:text-red-500 rounded-xl cursor-pointer">
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => openAddModal(name)}
                                    className="w-full p-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                >
                                    <Plus className="h-4 w-4" />
                                    Añadir alimento a {name}
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* 
                    <button
                        onClick={() => setIsAddGroupModalOpen(true)}
                        className="w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/10 cursor-pointer"
                    >
                        + Añadir nueva categoría
                    </button>
                    */}
                </div>
            </div>

            <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 flex justify-between items-center gap-3 z-10 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                <Button
                    variant="outline"
                    className="h-12 border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-black gap-2 transition-all active:scale-95 group"
                    onClick={() => {
                        setIsSmartModalOpen(true);
                        fetchSmartAddData();
                    }}
                >
                    <div className="bg-indigo-100 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                        <Brain className="h-5 w-5" />
                    </div>
                    Añadir alimentos inteligente
                </Button>

                <div className="flex gap-3">
                    <Button variant="ghost" className="h-12 text-slate-400 font-bold" onClick={printJson}>Imprimir JSON</Button>
                    <Button variant="outline" className="h-12" onClick={saveAsDraft}>Guardar Borrador</Button>
                    <Button variant="outline" className="h-12 border-rose-200 text-rose-600" onClick={resetDiet}>Reset</Button>
                    <Button className="h-12 px-8 bg-slate-900" onClick={handleSave}>Guardar Creación</Button>
                    <Button className="h-12 px-8 bg-emerald-600" onClick={handleContinue}>Continuar <ArrowRight className="ml-2 h-5 w-5" /></Button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isDeleteGroupConfirmOpen} onClose={() => setIsDeleteGroupConfirmOpen(false)}
                onConfirm={confirmDeleteGroup} title={`¿Eliminar grupo "${groupToDelete}"?`}
                description="Esto quitará los alimentos de esta vista."
            />

            <Modal isOpen={isAddFoodModalOpen} onClose={() => setIsAddFoodModalOpen(false)} title={`Añadir a "${activeGroupForAddition}"`}>
                <div className="space-y-4">
                    <Input placeholder="Buscar..." value={foodSearchQuery} onChange={e => setFoodSearchQuery(e.target.value)} autoFocus />
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                        {isSearchingFoods ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                <p className="text-sm text-slate-400 font-medium">Buscando alimentos...</p>
                            </div>
                        ) : searchResultFoods.length > 0 ? (
                            searchResultFoods.map(f => (
                                <div key={f.id} className="w-full flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors group">
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-slate-900">{f.producto}</p>
                                        <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                                            <span className="text-orange-600 font-bold">{f.calorias || 0} kcal</span>
                                            <span>•</span>
                                            <span className="text-blue-600">P: {f.proteinas || 0}g</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFoodForInfo(f);
                                                setIsFoodInfoModalOpen(true);
                                            }}
                                            className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                                        >
                                            <Info className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleAddFromSearch(f)}
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : foodSearchQuery.trim() ? (
                            <div className="py-6 text-center">
                                <p className="text-sm text-slate-400 mb-3">No se encontraron resultados.</p>
                                <Button
                                    variant="outline"
                                    className="text-emerald-600"
                                    onClick={() => {
                                        const newItem: MarketPrice = {
                                            id: `manual-${Date.now()}`,
                                            producto: foodSearchQuery,
                                            grupo: activeGroupForAddition || 'Varios',
                                            unidad: 'unidad',
                                            precioPromedio: 0,
                                            calorias: 0,
                                            proteinas: 0,
                                            carbohidratos: 0,
                                            lipidos: 0,
                                            tags: []
                                        };
                                        setManualAdditions(prev => [...prev, newItem]);
                                        setFoodStatus(prev => ({ ...prev, [foodSearchQuery]: 'added' as const }));
                                        toast.success(`"${foodSearchQuery}" creado.`);
                                        setIsAddFoodModalOpen(false);
                                    }}
                                >
                                    Crear "{foodSearchQuery}" manualmente
                                </Button>
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <Search className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-sm text-slate-400">Escribe para buscar alimentos...</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Modal de Adición Inteligente */}
            <Modal
                isOpen={isSmartModalOpen}
                onClose={() => setIsSmartModalOpen(false)}
                title="Selección Inteligente"
                className="sm:max-w-2xl"
            >
                <div className="space-y-6">
                    {/* Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                        <button
                            onClick={() => setSmartAddTab('favorites')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                                smartAddTab === 'favorites' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Star className={cn("h-4 w-4", smartAddTab === 'favorites' && "fill-current")} />
                            Favoritos
                        </button>
                        <button
                            onClick={() => setSmartAddTab('groups')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                                smartAddTab === 'groups' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <FolderPlus className="h-4 w-4" />
                            Mis Grupos
                        </button>
                        <button
                            onClick={() => setSmartAddTab('myproducts')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                                smartAddTab === 'myproducts' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Plus className="h-4 w-4" />
                            Mis Productos
                        </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-[400px] overflow-y-auto px-1 space-y-4">
                        {isLoadingSmart ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                                <p className="text-slate-400 font-bold text-sm">Cargando tus secretos culinarios...</p>
                            </div>
                        ) : smartAddTab === 'favorites' ? (
                            smartFavorites.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {smartFavorites.map(f => (
                                        <div
                                            key={f.id}
                                            onClick={() => toggleSmartSelection(f.id)}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                                                selectedFoods.has(f.id)
                                                    ? "border-indigo-500 bg-indigo-50/50"
                                                    : "border-slate-100 bg-white hover:border-indigo-200"
                                            )}
                                        >
                                            <div className="flex-1">
                                                <p className="font-black text-slate-800 text-sm mb-1">{f.name}</p>
                                                <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-black uppercase">
                                                    {f.category?.name || 'Varios'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFoodForInfo({
                                                            id: f.id,
                                                            producto: f.name,
                                                            grupo: f.category?.name || 'Varios',
                                                            calorias: f.calories || 0,
                                                            proteinas: f.proteins || 0,
                                                            carbohidratos: f.carbs || 0,
                                                            lipidos: f.lipids || 0,
                                                            unidad: f.unit || 'g',
                                                            precioPromedio: f.price || 0,
                                                            tags: f.tags?.map((t: any) => t.name) || [],
                                                            ...(f as any)
                                                        });
                                                        setIsFoodInfoModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                                                >
                                                    <Info className="h-4 w-4" />
                                                </button>
                                                <div className={cn(
                                                    "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                    selectedFoods.has(f.id)
                                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                                        : "border-slate-200 group-hover:border-indigo-300"
                                                )}>
                                                    {selectedFoods.has(f.id) && <Plus className="h-4 w-4" />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                                    <Star className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-bold text-sm px-10">No tienes alimentos favoritos marcados aún.</p>
                                </div>
                            )
                        ) : smartAddTab === 'groups' ? (
                            smartGroups.length > 0 ? (
                                <div className="space-y-6">
                                    {smartGroups.map(group => {
                                        const groupIngredientIds = (group.ingredients as any[])?.map((rel: any) => (rel.ingredient as any)?.id as string) || [];
                                        const isAllSelected = groupIngredientIds.length > 0 && groupIngredientIds.every(id => selectedFoods.has(id));

                                        return (
                                            <div key={group.id} className="space-y-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                                <div className="flex items-center justify-between px-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{group.name}</h4>
                                                    </div>

                                                    <button
                                                        onClick={() => toggleGroupSelection(group.id)}
                                                        className={cn(
                                                            "text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-lg transition-all border shadow-sm",
                                                            isAllSelected
                                                                ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                                                                : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                                                        )}
                                                    >
                                                        {isAllSelected ? "Quitar todo el grupo" : "Seleccionar todo el grupo"}
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {group.ingredients?.map((rel: any) => (
                                                        <div
                                                            key={rel.ingredient?.id}
                                                            onClick={() => toggleSmartSelection(rel.ingredient?.id)}
                                                            className={cn(
                                                                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                                                                selectedFoods.has(rel.ingredient?.id)
                                                                    ? "border-indigo-500 bg-indigo-50/50"
                                                                    : "border-slate-100 bg-white hover:border-indigo-200"
                                                            )}
                                                        >
                                                            <div className="flex-1">
                                                                <p className="font-black text-slate-800 text-sm mb-1">{rel.ingredient?.name}</p>
                                                                <span className="text-[10px] text-slate-400 font-bold">
                                                                    {rel.amount || 100} {rel.ingredient?.unit || rel.unit || 'g'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const ing = rel.ingredient;
                                                                        setSelectedFoodForInfo({
                                                                            id: ing?.id,
                                                                            producto: ing?.name || 'Desconocido',
                                                                            grupo: ing?.category?.name || 'Varios',
                                                                            calorias: ing?.calories || 0,
                                                                            proteinas: ing?.proteins || 0,
                                                                            carbohidratos: ing?.carbs || 0,
                                                                            lipidos: ing?.lipids || 0,
                                                                            unidad: ing?.unit || 'g',
                                                                            precioPromedio: ing?.price || 0,
                                                                            tags: ing?.tags?.map((t: any) => t.name) || [],
                                                                            ...(ing as any)
                                                                        });
                                                                        setIsFoodInfoModalOpen(true);
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                                                                >
                                                                    <Info className="h-4 w-4" />
                                                                </button>
                                                                <div className={cn(
                                                                    "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                                    selectedFoods.has(rel.ingredient?.id)
                                                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                                                        : "border-slate-200 group-hover:border-indigo-300"
                                                                )}>
                                                                    {selectedFoods.has(rel.ingredient?.id) ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 text-slate-300" />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                                    <FolderPlus className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-bold text-sm px-10">No has creado grupos de ingredientes aún.</p>
                                </div>
                            )
                        ) : smartAddTab === 'myproducts' ? (
                            smartMyProducts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {smartMyProducts.map(f => (
                                        <div
                                            key={f.id}
                                            onClick={() => toggleSmartSelection(f.id)}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                                                selectedFoods.has(f.id)
                                                    ? "border-indigo-500 bg-indigo-50/50"
                                                    : "border-slate-100 bg-white hover:border-indigo-200"
                                            )}
                                        >
                                            <div className="flex-1">
                                                <p className="font-black text-slate-800 text-sm mb-1">{f.name}</p>
                                                <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-black uppercase">
                                                    Creado por ti
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFoodForInfo({
                                                            id: f.id,
                                                            producto: f.name,
                                                            grupo: f.category?.name || 'Varios',
                                                            calorias: f.calories || 0,
                                                            proteinas: f.proteins || 0,
                                                            carbohidratos: f.carbs || 0,
                                                            lipidos: f.lipids || 0,
                                                            unidad: f.unit || 'g',
                                                            precioPromedio: f.price || 0,
                                                            tags: f.tags?.map((t: any) => t.name) || [],
                                                            ...(f as any)
                                                        });
                                                        setIsFoodInfoModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                                                >
                                                    <Info className="h-4 w-4" />
                                                </button>
                                                <div className={cn(
                                                    "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                    selectedFoods.has(f.id)
                                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                                        : "border-slate-200 group-hover:border-indigo-300"
                                                )}>
                                                    {selectedFoods.has(f.id) && <Plus className="h-4 w-4" />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                                    <Plus className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-bold text-sm px-10">No has creado productos personalizados aún.</p>
                                </div>
                            )
                        ) : null}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-4">
                        <div className="text-xs">
                            <span className="text-slate-400 font-bold">Seleccionados: </span>
                            <span className="text-indigo-600 font-black">{selectedFoods.size} alimentos</span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" className="h-11 rounded-xl" onClick={() => setIsSmartModalOpen(false)}>Cancelar</Button>
                            <Button
                                className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2"
                                onClick={handleSmartAddAll}
                                disabled={selectedFoods.size === 0}
                            >
                                <CheckCircle2 className="h-5 w-5" />
                                Añadir todo(s)
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Food Info Modal - Side Panel */}
            {isFoodInfoModalOpen && selectedFoodForInfo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-start">
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={() => setIsFoodInfoModalOpen(false)}
                    />
                    <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300 z-10">
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 mb-1">{selectedFoodForInfo.producto}</h2>
                                    <p className="text-sm text-slate-500 font-medium">{selectedFoodForInfo.grupo}</p>
                                </div>
                                <button
                                    onClick={() => setIsFoodInfoModalOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Macronutrientes Principales */}
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Macronutrientes</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                        <p className="text-xs font-bold text-orange-600 mb-1">Calorías</p>
                                        <p className="text-2xl font-black text-orange-700">{selectedFoodForInfo.calorias || 0}</p>
                                        <p className="text-[10px] text-orange-500 font-medium">kcal</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-xs font-bold text-blue-600 mb-1">Proteínas</p>
                                        <p className="text-2xl font-black text-blue-700">{selectedFoodForInfo.proteinas || 0}</p>
                                        <p className="text-[10px] text-blue-500 font-medium">gramos</p>
                                    </div>
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                        <p className="text-xs font-bold text-emerald-600 mb-1">Carbohidratos</p>
                                        <p className="text-2xl font-black text-emerald-700">{selectedFoodForInfo.carbohidratos || 0}</p>
                                        <p className="text-[10px] text-emerald-500 font-medium">gramos</p>
                                    </div>
                                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                        <p className="text-xs font-bold text-yellow-600 mb-1">Lípidos</p>
                                        <p className="text-2xl font-black text-yellow-700">{selectedFoodForInfo.lipidos || 0}</p>
                                        <p className="text-[10px] text-yellow-500 font-medium">gramos</p>
                                    </div>
                                </div>
                            </div>

                            {/* Micronutrientes y Otros */}
                            {((selectedFoodForInfo as any).sugars > 0 || (selectedFoodForInfo as any).fiber > 0 || (selectedFoodForInfo as any).sodium > 0) && (
                                <div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Información Adicional</h3>
                                    <div className="space-y-2">
                                        {(selectedFoodForInfo as any).sugars > 0 && (
                                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                                <span className="text-sm font-bold text-slate-700">Azúcares</span>
                                                <span className="text-sm font-black text-slate-900">{(selectedFoodForInfo as any).sugars}g</span>
                                            </div>
                                        )}
                                        {(selectedFoodForInfo as any).fiber > 0 && (
                                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                                <span className="text-sm font-bold text-slate-700">Fibra</span>
                                                <span className="text-sm font-black text-slate-900">{(selectedFoodForInfo as any).fiber}g</span>
                                            </div>
                                        )}
                                        {(selectedFoodForInfo as any).sodium > 0 && (
                                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                                <span className="text-sm font-bold text-slate-700">Sodio</span>
                                                <span className="text-sm font-black text-slate-900">{(selectedFoodForInfo as any).sodium}mg</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Porción */}
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Porción de Referencia</h3>
                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <p className="text-sm font-bold text-indigo-600 mb-1">Unidad</p>
                                    <p className="text-lg font-black text-indigo-900">{selectedFoodForInfo.unidad || 'g'}</p>
                                </div>
                            </div>

                            {/* Precio */}
                            {selectedFoodForInfo.precioPromedio > 0 && (
                                <div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Precio Estimado</h3>
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                        <p className="text-sm font-bold text-green-600 mb-1">Precio Promedio</p>
                                        <p className="text-lg font-black text-green-900">{formatCLP(selectedFoodForInfo.precioPromedio)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {selectedFoodForInfo.tags && selectedFoodForInfo.tags.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Etiquetas</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedFoodForInfo.tags.map((tag: string, idx: number) => (
                                            <span key={idx} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Import Diet Modal */}
            <Modal
                isOpen={isImportDietModalOpen}
                onClose={() => {
                    setIsImportDietModalOpen(false);
                    setDietSearchQuery('');
                }}
                title="Importar Dieta Base"
            >
                <div className="space-y-4">
                    <Input
                        placeholder="Buscar dieta..."
                        value={dietSearchQuery}
                        onChange={e => setDietSearchQuery(e.target.value)}
                        autoFocus
                    />

                    {isLoadingDiets && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        </div>
                    )}

                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {savedDiets
                            .filter(diet =>
                                diet.name.toLowerCase().includes(dietSearchQuery.toLowerCase()) ||
                                diet.tags.some((tag: string) => tag.toLowerCase().includes(dietSearchQuery.toLowerCase()))
                            )
                            .map(diet => (
                                <div
                                    key={diet.id}
                                    onClick={() => handleImportDiet(diet)}
                                    className="p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-black text-slate-900 text-sm mb-1">{diet.name}</h3>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {diet.foodCount} alimentos • Creada el {new Date(diet.createdAt).toLocaleDateString('es-ES')}
                                            </p>
                                        </div>
                                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase">
                                            {diet.type}
                                        </span>
                                    </div>

                                    {diet.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {diet.tags.map((tag: string, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        }

                        {!isLoadingDiets && savedDiets.filter(diet =>
                            diet.name.toLowerCase().includes(dietSearchQuery.toLowerCase()) ||
                            diet.tags.some((tag: string) => tag.toLowerCase().includes(dietSearchQuery.toLowerCase()))
                        ).length === 0 && (
                                <div className="py-12 text-center">
                                    <Library className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400">
                                        {dietSearchQuery ? 'No se encontraron dietas' : 'No tienes dietas guardadas aún'}
                                    </p>
                                </div>
                            )}
                    </div>
                </div>
            </Modal>

        </div >
    );
}
