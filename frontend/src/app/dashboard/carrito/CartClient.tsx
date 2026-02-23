'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
import Cookies from 'js-cookie';
import {
    ShoppingCart,
    ArrowRight,
    ChevronLeft,
    Users,
    Lock,
    TrendingUp,
    Trash2,
    Plus,
    Calculator,
    Zap,
    Scale,
    Calendar,
    DollarSign,
    Info,
    AlertTriangle,
    Sparkles,
    Loader2,
    Save,
    FileCode,
    RotateCcw,
    Library,
    User,
    UserPlus,
    BookOpen,
    Search,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatCLP } from '@/lib/utils/currency';
import { useAdmin } from '@/context/AdminContext';
import { ModuleLayout } from '@/components/shared/ModuleLayout';
import { ModuleFooter } from '@/components/shared/ModuleFooter';
import { ActionDockItem } from '@/components/ui/ActionDock';

interface CartItem {
    id: string;
    producto: string;
    grupo: string;
    cantidadMes: number; // en kg o unidades
    frecuenciaSemanal: number;
    porcionGramos: number;
    carbohidratosPor100g: number;
    grasasPor100g: number;
    caloriasPor100g: number;
    proteinaPor100g: number;
    precioPorUnidad: number;
    unidad: string;
}

const MOCK_CART_ITEMS: CartItem[] = [
    {
        id: '1',
        producto: 'Pechuga de Pollo',
        grupo: 'Carnes',
        cantidadMes: 3,
        frecuenciaSemanal: 4,
        porcionGramos: 150,
        caloriasPor100g: 165,
        proteinaPor100g: 31,
        carbohidratosPor100g: 0,
        grasasPor100g: 3.6,
        precioPorUnidad: 5500,
        unidad: 'kg'
    },
    {
        id: '2',
        producto: 'Arroz Grado 1',
        grupo: 'Cereales',
        cantidadMes: 2,
        frecuenciaSemanal: 5,
        porcionGramos: 100,
        caloriasPor100g: 130,
        proteinaPor100g: 2.7,
        carbohidratosPor100g: 28,
        grasasPor100g: 0.3,
        precioPorUnidad: 1200,
        unidad: 'kg'
    },
    {
        id: '3',
        producto: 'Manzanas',
        grupo: 'Frutas',
        cantidadMes: 4,
        frecuenciaSemanal: 7,
        porcionGramos: 120,
        caloriasPor100g: 52,
        proteinaPor100g: 0.3,
        carbohidratosPor100g: 14,
        grasasPor100g: 0.2,
        precioPorUnidad: 1500,
        unidad: 'kg'
    },
];

export default function CartClient() {
    const router = useRouter();
    const { role } = useAdmin();
    const [items, setItems] = useState<CartItem[]>(MOCK_CART_ITEMS);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [selectedMarket] = useState('Lider/Jumbo (Chile)');
    const [timeView, setTimeView] = useState<'dia' | 'semana' | 'mes'>('semana');
    const [isReferenceOpen, setIsReferenceOpen] = useState(false);
    const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
    const [foodSearchQuery, setFoodSearchQuery] = useState('');
    const [searchResultFoods, setSearchResultFoods] = useState<any[]>([]);
    const [isSearchingFoods, setIsSearchingFoods] = useState(false);

    // -- Import Patient Modal State --
    const [isImportPatientModalOpen, setIsImportPatientModalOpen] = useState(false);
    const [patients, setPatients] = useState<any[]>([]);
    const [isLoadingPatients, setIsLoadingPatients] = useState(false);
    const [patientSearchQuery, setPatientSearchQuery] = useState('');

    // -- Persistence: Draft Load/Save --
    useEffect(() => {
        const storedDraft = localStorage.getItem('nutri_active_draft');
        if (storedDraft) {
            try {
                const draft = JSON.parse(storedDraft);
                if (draft.cart && draft.cart.items) {
                    setItems(draft.cart.items);
                } else {
                    // Fallback to currentDietStep if no draft items
                    const storedDiet = localStorage.getItem('currentDietStep');
                    if (storedDiet) {
                        const dietData = JSON.parse(storedDiet);
                        const { includedFoods } = dietData;
                        if (includedFoods && Array.isArray(includedFoods)) {
                            const cartItems: CartItem[] = includedFoods.map((f: any) => ({
                                id: f.id || `food-${Math.random()}`,
                                producto: f.producto,
                                grupo: f.grupo,
                                cantidadMes: 0,
                                frecuenciaSemanal: 3,
                                porcionGramos: 100,
                                carbohidratosPor100g: f.carbohidratos || 0,
                                grasasPor100g: f.lipidos || 0,
                                caloriasPor100g: f.calorias || 0,
                                proteinaPor100g: f.proteinas || 0,
                                precioPorUnidad: f.precioPromedio || 1000,
                                unidad: f.unidad || 'kg'
                            }));
                            const calculatedItems = cartItems.map(item => ({
                                ...item,
                                cantidadMes: Number(((item.porcionGramos * item.frecuenciaSemanal * 4) / 1000).toFixed(2))
                            }));
                            setItems(calculatedItems);
                        }
                    }
                }
            } catch (e) {
                console.error("Error loading cart draft", e);
            }
        }

        const storedPatient = localStorage.getItem('nutri_patient');
        if (storedPatient) {
            try {
                setSelectedPatient(JSON.parse(storedPatient));
            } catch (e) {
                console.error("Failed to parse stored patient", e);
            }
        }
    }, []);

    // Auto-save to draft on changes
    useEffect(() => {
        const storedDraft = localStorage.getItem('nutri_active_draft');
        let draft = storedDraft ? JSON.parse(storedDraft) : {};

        draft.cart = {
            items,
            selectedMarket,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('nutri_active_draft', JSON.stringify(draft));
    }, [items, selectedMarket]);

    // Totals logic
    const totals = useMemo(() => {
        let calories = 0;
        let protein = 0;
        let carbs = 0;
        let fats = 0;

        items.forEach(item => {
            // Calculamos lo ingerido por día promedio basado en la frecuencia semanal
            // (gramos_porcion * frecuencia) / 7
            const gramosDia = (item.porcionGramos * item.frecuenciaSemanal) / 7;

            calories += (gramosDia * item.caloriasPor100g) / 100;
            protein += (gramosDia * item.proteinaPor100g) / 100;
            carbs += (gramosDia * item.carbohidratosPor100g) / 100;
            fats += (gramosDia * item.grasasPor100g) / 100;
        });

        const scale = (val: number) => Math.round(val * (timeView === 'dia' ? 1 : timeView === 'semana' ? 7 : 30));

        return {
            calories: scale(calories),
            protein: scale(protein),
            carbs: scale(carbs),
            fats: scale(fats),
        };
    }, [items, timeView]);

    const calculateExchangePortions = (item: CartItem) => {
        const { carbohidratosPor100g, proteinaPor100g, grasasPor100g, porcionGramos, grupo } = item;
        const totalCarbs = (carbohidratosPor100g * porcionGramos) / 100;
        const totalProt = (proteinaPor100g * porcionGramos) / 100;
        const totalFat = (grasasPor100g * porcionGramos) / 100;

        const g = grupo.toLowerCase();

        // Estándar UDD/INTA Chile (Basado en el aporte predominante)
        if (g.includes('cereal') || g.includes('pan') || g.includes('legumbre') || g.includes('tubérculo')) {
            return { val: (totalCarbs / 30).toFixed(1), label: 'Porc.' }; // 30g CHO
        }
        if (g.includes('fruta')) {
            return { val: (totalCarbs / 15).toFixed(1), label: 'Porc.' }; // 15g CHO
        }
        if (g.includes('verdura')) {
            const factor = g.includes('libre') ? 2.5 : 5;
            return { val: (totalCarbs / factor).toFixed(1), label: 'Porc.' }; // 5g o 2.5g CHO
        }
        if (g.includes('carne') || g.includes('huevo') || g.includes('pescado') || g.includes('proteína')) {
            return { val: (totalProt / 11).toFixed(1), label: 'Porc.' }; // 11g PRO
        }
        if (g.includes('lácteo') || g.includes('leche') || g.includes('yogur')) {
            return { val: (totalProt / 8).toFixed(1), label: 'Porc.' }; // Promedio PRO para lácteos
        }
        if (g.includes('grasa') || g.includes('aceite') || g.includes('frutos secos')) {
            return { val: (totalFat / 20).toFixed(1), label: 'Porc.' }; // 20g Lípidos (Bloque UDD)
        }
        if (g.includes('azúcar') || g.includes('miel') || g.includes('mermelada')) {
            return { val: (totalCarbs / 5).toFixed(1), label: 'Porc.' }; // 5g CHO
        }

        // Fallback dinámico si no hay grupo claro
        if (totalCarbs > totalProt && totalCarbs > totalFat) return { val: (totalCarbs / 30).toFixed(1), label: 'Porc.' };
        if (totalProt > totalCarbs && totalProt > totalFat) return { val: (totalProt / 11).toFixed(1), label: 'Porc.' };
        return { val: (totalFat / 20).toFixed(1), label: 'Porc.' };
    };

    const groupedItems = useMemo(() => {
        const groups: Record<string, (CartItem & { exchange: { val: string, label: string } })[]> = {};
        items.forEach(item => {
            if (!groups[item.grupo]) groups[item.grupo] = [];
            groups[item.grupo].push({
                ...item,
                exchange: calculateExchangePortions(item)
            });
        });
        return groups;
    }, [items]);

    const handleQuantityChange = (id: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, cantidadMes: numValue } : item
        ));
    };

    const handleFrequencyChange = (id: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const newFreq = numValue;
                const newQty = Number(((item.porcionGramos * newFreq * 4) / 1000).toFixed(2));
                return { ...item, frecuenciaSemanal: newFreq, cantidadMes: newQty };
            }
            return item;
        }));
    };

    const handlePortionChange = (id: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const newPortion = numValue;
                const newQty = Number(((newPortion * item.frecuenciaSemanal * 4) / 1000).toFixed(2));
                return { ...item, porcionGramos: newPortion, cantidadMes: newQty };
            }
            return item;
        }));
    };

    const fetchPatients = async () => {
        setIsLoadingPatients(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/patients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPatients(data.data || []);
            }
        } catch (e) {
            console.error("Error fetching patients", e);
        } finally {
            setIsLoadingPatients(false);
        }
    };

    const handleSelectPatient = (patient: any) => {
        setSelectedPatient(patient);
        localStorage.setItem('nutri_patient', JSON.stringify(patient));

        // Sync metadata to global draft
        const storedDraft = localStorage.getItem('nutri_active_draft');
        let draft = storedDraft ? JSON.parse(storedDraft) : {};

        const restrictions = Array.isArray(patient.dietRestrictions) ? patient.dietRestrictions : [];
        const validRestrictions = restrictions.filter((r: string) => r && r.trim() !== '');

        draft.patientMeta = {
            id: patient.id,
            fullName: patient.fullName,
            restrictions: validRestrictions,
            nutritionalFocus: patient.nutritionalFocus,
            fitnessGoals: patient.fitnessGoals,
            birthDate: patient.birthDate,
            weight: patient.weight,
            height: patient.height,
            gender: patient.gender,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('nutri_active_draft', JSON.stringify(draft));

        toast.success(`Paciente vinculado: ${patient.fullName}`);
        setIsImportPatientModalOpen(false);
        setPatientSearchQuery('');
    };

    const handlePatientLoad = () => {
        setIsImportPatientModalOpen(true);
        fetchPatients();
    };

    const handleUnlinkPatient = () => {
        setSelectedPatient(null);
        localStorage.removeItem('nutri_patient');
        toast.info("Paciente desvinculado de esta sesión");
    };

    const removeItem = (id: string) => {
        const itemToRemove = items.find(i => i.id === id);
        setItems(prev => prev.filter(i => i.id !== id));
        toast.info(`${itemToRemove?.producto} eliminado del carrito.`);
    };

    const handleAddFoodFromSearch = (food: any) => {
        const newItem: CartItem = {
            id: `manual-${Date.now()}`,
            producto: food.name || food.producto,
            grupo: food.category?.name || food.grupo || 'Varios',
            cantidadMes: 0,
            frecuenciaSemanal: 1,
            porcionGramos: 100,
            carbohidratosPor100g: food.carbs || 0,
            grasasPor100g: food.lipids || 0,
            caloriasPor100g: food.calories || 0,
            proteinaPor100g: food.proteins || 0,
            precioPorUnidad: food.price || 0,
            unidad: food.unit || 'kg'
        };

        // Calculate monthly quantity
        newItem.cantidadMes = Number(((newItem.porcionGramos * newItem.frecuenciaSemanal * 4) / 1000).toFixed(2));

        setItems(prev => [...prev, newItem]);
        setIsAddFoodModalOpen(false);
        setFoodSearchQuery('');
        toast.success(`${newItem.producto} añadido al carrito.`);
    };

    // Search effect (reused from DietClient)
    useEffect(() => {
        if (!isAddFoodModalOpen || !foodSearchQuery.trim()) {
            setSearchResultFoods([]);
            setIsSearchingFoods(false);
            return;
        }

        const fetchFoods = async (retries = 2) => {
            setIsSearchingFoods(true);
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
            try {
                const res = await fetch(`${apiUrl}/foods?search=${foodSearchQuery}&limit=10`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSearchResultFoods(data);
                }
            } catch (e) {
                if (retries > 0) {
                    setTimeout(() => fetchFoods(retries - 1), 1000);
                } else {
                    console.warn("Error buscando alimentos (backend no disponible)");
                }
            } finally {
                setIsSearchingFoods(false);
            }
        };

        const timeoutId = setTimeout(fetchFoods, 300);
        return () => clearTimeout(timeoutId);
    }, [isAddFoodModalOpen, foodSearchQuery]);

    const saveCartToStorage = (updatedItems?: CartItem[]) => {
        const cartData = {
            items: updatedItems || items,
            totals,
            selectedPatient,
            timestamp: Date.now()
        };
        localStorage.setItem('currentCartStep', JSON.stringify(cartData));
    };

    const handleFinalize = () => {
        saveCartToStorage();
        toast.success("Carrito finalizado. Generando recetas...");
        setTimeout(() => router.push('/dashboard/recetas'), 1000);
    };


    const printJson = () => {
        console.group('📊 CART / CARRO DATA');
        console.log('Items en Carrito:', items);
        console.log('Totales Calculados:', totals);
        if (selectedPatient) console.log('Paciente Vinculado:', selectedPatient);
        console.groupEnd();
        toast.info("JSON del carrito impreso en consola.");
    };

    const clearCart = () => {
        setItems([]);
        localStorage.removeItem('nutrition_app_cart');
        toast.info("Carrito vaciado.");
    };

    const actionDockItems: ActionDockItem[] = useMemo(() => [
        {
            id: 'import-diet',
            icon: Library,
            label: 'Importar Dieta',
            variant: 'indigo',
            onClick: () => toast.info("Funcionalidad próximamente...")
        },
        {
            id: 'link-patient',
            icon: User,
            label: 'Importar Paciente',
            variant: 'emerald',
            onClick: () => toast.info("Módulo de importación de pacientes próximamente...")
        },
        { id: 'sep-1', icon: Library, label: '', onClick: () => { }, isSeparator: true },
        {
            id: 'eval-ai',
            icon: Sparkles,
            label: 'Evaluar con IA',
            variant: 'amber',
            onClick: () => toast.info("Módulo de IA próximamente... Análisis clínico en desarrollo 🧠")
        },
        { id: 'sep-2', icon: Library, label: '', onClick: () => { }, isSeparator: true },
        {
            id: 'save-draft',
            icon: Save,
            label: 'Guardar Borrador',
            variant: 'slate',
            onClick: () => {
                saveCartToStorage();
                toast.success("Borrador guardado");
            }
        },
        {
            id: 'export-json',
            icon: FileCode,
            label: 'Imprimir JSON',
            variant: 'slate',
            onClick: printJson
        },
        {
            id: 'reset',
            icon: RotateCcw,
            label: 'Reiniciar Todo',
            variant: 'rose',
            onClick: clearCart
        }
    ], [saveCartToStorage, printJson, clearCart]);

    return (
        <ModuleLayout
            title="Carrito & Cuantificador"
            description="Transforma la estrategia en una lista de compras exacta."
            step={{ number: 2, label: "Cantidades & Compras", icon: ShoppingCart, color: "text-indigo-600" }}
            rightNavItems={actionDockItems}
            footer={
                <ModuleFooter>
                    <div className="flex items-center gap-8">
                        {/* Time View Selector in Footer */}
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                            {(['dia', 'semana', 'mes'] as const).map((view) => (
                                <button
                                    key={view}
                                    onClick={() => setTimeView(view)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        timeView === view
                                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {view === 'dia' ? 'D' : view === 'semana' ? 'S' : 'M'}
                                </button>
                            ))}
                        </div>

                        {/* Nutritional Summary */}
                        <div className="flex items-center gap-6">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Proteínas Totales</p>
                                <p className="text-xl font-black text-emerald-600 flex items-baseline gap-1">
                                    {totals.protein}
                                    <span className="text-[10px] text-slate-400 uppercase">g</span>
                                    <span className="text-[9px] text-slate-300 font-medium lowercase ml-1">
                                        / {timeView === 'dia' ? 'día' : timeView === 'semana' ? 'semana' : 'mes'}
                                    </span>
                                </p>
                            </div>
                            <div className="w-px h-8 bg-slate-200" />
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Calorías Totales</p>
                                <p className="text-xl font-black text-amber-600 flex items-baseline gap-1">
                                    {totals.calories}
                                    <span className="text-[10px] text-slate-400 uppercase">kcal</span>
                                    <span className="text-[9px] text-slate-300 font-medium lowercase ml-1">
                                        / {timeView === 'dia' ? 'día' : timeView === 'semana' ? 'semana' : 'mes'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            variant="ghost"
                            className="h-12 text-emerald-600 font-black gap-2 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-100 rounded-xl"
                            onClick={handlePatientLoad}
                        >
                            <UserPlus className="h-5 w-5" />
                            {selectedPatient ? (selectedPatient.fullName || selectedPatient.name) : "Asignar a un paciente"}
                        </Button>
                        <Button className="h-12 px-8 bg-slate-900" onClick={() => saveCartToStorage()}>Guardar Creación</Button>
                        <Button
                            className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xl shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-95"
                            onClick={handleFinalize}
                        >
                            Continuar
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </ModuleFooter>
            }
        >
            {selectedPatient && (
                <div className="mb-6 animate-in slide-in-from-top duration-300">
                    <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center border border-emerald-200">
                                <User className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Paciente Vinculado</p>
                                <h3 className="text-xl font-black text-slate-900 italic leading-none">{selectedPatient.fullName || selectedPatient.name}</h3>
                            </div>
                        </div>
                        <button
                            onClick={handleUnlinkPatient}
                            className="bg-white/50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200/50 hover:border-rose-200 transition-all cursor-pointer"
                        >
                            Cambiar o Desvincular
                        </button>
                    </div>
                </div>
            )}

            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-2 text-sm font-bold group"
                    >
                        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Volver a Dieta Base
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Time view selector moved to footer for standard layout */}
                </div>
            </div>


            {/* Exchange Portions Guide Banner */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-4 flex gap-4 items-start shadow-sm mb-6">
                <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                    <Info className="h-5 w-5" />
                </div>
                <div>
                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight mb-1">Calculadora de Intercambios (Estándar UDD/INTA Chile)</h4>
                    <p className="text-xs text-indigo-700/80 font-medium leading-relaxed mb-1">
                        Traduce automáticamente los gramos a "Porciones de Intercambio". Este cálculo es específico para el estándar chileno de la pirámide alimentaria.
                    </p>
                    <p className="text-[10px] text-indigo-600/60 font-medium leading-relaxed mb-4">
                        <strong>Lógica UDD:</strong> Cereales y Pan (30g CHO) • Carnes y Proteínas (11g PRO) • Frutas (15g CHO) • Verduras (5g CHO) • Grasas (20g LIP).
                    </p>
                    <div className="flex flex-wrap items-center gap-4 border-t border-indigo-100 pt-3">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            <span className="text-[10px] font-black text-slate-600 uppercase">🟡 Cereales/Pan (~30g CHO)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black text-slate-600 uppercase">🟢 Proteínas (~11g PRO)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-black text-slate-600 uppercase">🔴 Grasas/Aceites (~20g LIP)</span>
                        </div>

                        <div className="ml-auto">
                            <button
                                onClick={() => setIsReferenceOpen(true)}
                                className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:text-indigo-800 transition-colors"
                            >
                                <BookOpen className="h-3 w-3" />
                                Ver manual de referencia UDD
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Shopping List / Quantification Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Alimento</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Compra Mes</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Frecuencia / Pauta</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {Object.entries(groupedItems).map(([groupName, groupItems]) => (
                                <Fragment key={groupName}>
                                    <tr className="bg-slate-50/80">
                                        <td colSpan={4} className="px-6 py-2">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <div className="h-1 w-1 rounded-full bg-indigo-400" />
                                                {groupName}
                                                <span className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 lowercase tracking-normal font-bold">
                                                    {groupItems.length} items
                                                </span>
                                            </h4>
                                        </td>
                                    </tr>
                                    {groupItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-lg shadow-sm border border-slate-200/50 capitalize">
                                                        {item.producto.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm leading-none mb-1">{item.producto}</p>
                                                        <span className="text-[10px] uppercase font-bold text-slate-400">{item.grupo}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="relative w-24">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.cantidadMes}
                                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                            className="h-10 pr-8 text-center font-bold border-slate-200 rounded-xl bg-slate-50/50"
                                                            readOnly
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 pointer-events-none uppercase">
                                                            {item.unidad}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-4">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase">Freq. Semanal</label>
                                                        <div className="flex items-center gap-1 bg-emerald-50 rounded-xl px-2 border border-emerald-100">
                                                            <Input
                                                                type="number"
                                                                value={item.frecuenciaSemanal}
                                                                onChange={(e) => handleFrequencyChange(item.id, e.target.value)}
                                                                className="h-8 w-12 p-0 text-center bg-transparent border-none font-black text-emerald-700 text-xs focus-visible:ring-0"
                                                            />
                                                            <span className="text-[10px] font-black text-emerald-600">x</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-center gap-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase">Porción (g)</label>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1 bg-blue-50 rounded-xl px-2 border border-blue-100">
                                                                <Input
                                                                    type="number"
                                                                    value={item.porcionGramos}
                                                                    onChange={(e) => handlePortionChange(item.id, e.target.value)}
                                                                    className="h-8 w-14 p-0 text-center bg-transparent border-none font-black text-blue-700 text-xs focus-visible:ring-0"
                                                                />
                                                            </div>
                                                            <div className={cn(
                                                                "px-1.5 py-0.5 rounded-lg border text-[9px] font-black flex items-center gap-1 min-w-[55px] justify-center shadow-sm whitespace-nowrap",
                                                                item.grupo.toLowerCase().includes('cereal') || item.grupo.toLowerCase().includes('fruta') || item.grupo.toLowerCase().includes('verdura') ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                                    item.grupo.toLowerCase().includes('carne') || item.grupo.toLowerCase().includes('huevo') || item.grupo.toLowerCase().includes('pescado') ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                        item.grupo.toLowerCase().includes('grasa') || item.grupo.toLowerCase().includes('aceite') || item.grupo.toLowerCase().includes('frutos secos') ? "bg-rose-50 text-rose-700 border-rose-100" :
                                                                            "bg-indigo-50 text-indigo-700 border-indigo-100"
                                                            )}>
                                                                {item.exchange.val} <span className="opacity-50 text-[8px]">{item.exchange.label}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={() => setIsAddFoodModalOpen(true)}
                        className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        Agregar alimento adicional al carrito
                    </button>
                </div>
            </div>

            {/* Smart Optimization Bar / Comparison */}
            <div className="bg-emerald-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-200">
                <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                    <Calculator className="h-40 w-40 rotate-12" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 max-w-xl">
                        <div className="flex items-center gap-2">
                            <div className="bg-amber-400 p-1.5 rounded-lg">
                                <Zap className="h-4 w-4 text-amber-900 fill-current" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-amber-400">Optimizador Inteligente</span>
                        </div>
                        <h2 className="text-2xl font-black leading-tight">¿Falta proteína en el plan?</h2>
                        <p className="text-emerald-100 text-sm font-medium leading-relaxed">
                            Detectamos que para el perfil de <strong>{selectedPatient?.name || 'Nuevo Paciente'}</strong>, aún faltan cubrir cerca de 45g de proteína diaria. Tienes dos opciones de costo-beneficio:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl hover:bg-white/20 transition-all cursor-pointer group">
                                <p className="text-[10px] font-black text-emerald-300 uppercase mb-2">Opción Natural</p>
                                <p className="font-bold text-sm mb-1">+500g Pollo / semana</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-white">$4.500 CLP (Est)</span>
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/40 p-4 rounded-2xl hover:bg-amber-500/20 transition-all cursor-pointer group relative">
                                <div className="absolute -top-2 -right-2 bg-amber-500 text-amber-950 text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg">RECOMENDADO</div>
                                <p className="text-[10px] font-black text-amber-400 uppercase mb-2">Opción Suplemento</p>
                                <p className="font-bold text-sm mb-1">+1 Scoop Whey / día</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-white">$2.800 CLP (Est)</span>
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 text-slate-900 w-full md:w-80 shadow-2xl flex flex-col items-center gap-6">
                        <div className="text-center space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen Nutricional ({timeView})</p>
                            <h3 className="text-3xl font-black text-emerald-600">
                                {totals.calories}
                                <span className="text-sm text-slate-400 font-bold ml-1">kcal</span>
                            </h3>
                        </div>

                        <div className="w-full space-y-4">
                            {/* Protein */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                                    <span>Proteína</span>
                                    <span>{totals.protein}g / {(selectedPatient?.targetProtein || 160) * (timeView === 'dia' ? 1 : timeView === 'semana' ? 7 : 30)}g</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                    <div
                                        className={cn("h-full transition-all duration-1000", (totals.protein >= ((selectedPatient?.targetProtein || 160) * (timeView === 'dia' ? 1 : timeView === 'semana' ? 7 : 30))) ? "bg-emerald-500" : "bg-amber-500")}
                                        style={{ width: `${Math.min(100, (totals.protein) / ((selectedPatient?.targetProtein || 160) * (timeView === 'dia' ? 1 : timeView === 'semana' ? 7 : 30)) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Carbs */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                                    <span>Carbohidratos</span>
                                    <span>{totals.carbs}g / {(selectedPatient?.targetCarbs || 300) * (timeView === 'dia' ? 1 : timeView === 'semana' ? 7 : 30)}g</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                    <div
                                        className={cn("h-full transition-all duration-1000", (totals.carbs >= ((selectedPatient?.targetCarbs || 300) * (timeView === 'dia' ? 1 : timeView === 'semana' ? 7 : 30))) ? "bg-blue-500" : "bg-blue-300")}
                                        style={{ width: `${Math.min(100, (totals.carbs) / ((selectedPatient?.targetCarbs || 300) * (timeView === 'dia' ? 1 : timeView === 'semana' ? 7 : 30)) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Fats */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                                    <span>Grasas</span>
                                    <span>{totals.fats}g / {(selectedPatient?.targetFats || 80) * (timeView === 'dia' ? 1 : timeView === 'semana' ? 7 : 30)}g</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                    <div
                                        className={cn("h-full transition-all duration-1000", (totals.fats >= ((selectedPatient?.targetFats || 80) * (timeView === 'dia' ? 1 : timeView === 'semana' ? 7 : 30))) ? "bg-purple-500" : "bg-purple-300")}
                                        style={{ width: `${Math.min(100, (totals.fats) / ((selectedPatient?.targetFats || 80) * (timeView === 'dia' ? 1 : timeView === 'semana' ? 7 : 30)) * 100)}%` }}
                                    />
                                </div>
                            </div>

                        </div>

                        <Button
                            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-200 uppercase tracking-widest text-xs"
                            onClick={handleFinalize} // Stage 3!
                        >
                            Finalizar Carrito
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Reference Modal - UDD Standards */}
            <Modal
                isOpen={isReferenceOpen}
                onClose={() => setIsReferenceOpen(false)}
                title="Manual de Porciones de Intercambio (UDD)"
                className="max-w-2xl"
            >
                <div className="max-h-[70vh] overflow-y-auto space-y-6 text-slate-600 pr-2 custom-scrollbar">
                    <section>
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            1. Panes, Cereales, Tubérculos y Leguminosas
                        </h4>
                        <p className="text-[10px] mb-2 font-bold text-slate-400">Aporte: 140 Kcal, 30g CHO, 3g PRO, 1g LIP.</p>
                        <ul className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <li>• <b>Pan Marraqueta/Hallulla:</b> 50g (1/2 unidad)</li>
                            <li>• <b>Arroz/Pastas cocidos:</b> 100-110g (3/4 a 1 taza)</li>
                            <li>• <b>Avena:</b> 6 cucharadas</li>
                            <li>• <b>Papa:</b> 150g (1 unidad)</li>
                            <li>• <b>Legumbres frescas (Habas/Arvejas):</b> 150-180g (1 taza)</li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            2. Carnes y Proteínas
                        </h4>
                        <p className="text-[10px] mb-2 font-bold text-slate-400">Aporte Bajo en Grasa: 65 Kcal, 11g PRO, 2g LIP.</p>
                        <ul className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <li>• <b>Vacuno/Pollo/Pavo/Cerdo magro:</b> 50g (6x6x1 cm)</li>
                            <li>• <b>Pescados blancos:</b> 80g</li>
                            <li>• <b>Huevo:</b> 1 unidad entera o 3 claras (100g)</li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-200" />
                            3. Frutas
                        </h4>
                        <p className="text-[10px] mb-2 font-bold text-slate-400">Aporte: 65 Kcal, 15g CHO, 1g PRO.</p>
                        <ul className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <li>• <b>Manzana/Pera:</b> 1 unidad chica</li>
                            <li>• <b>Plátano:</b> 1/2 unidad</li>
                            <li>• <b>Arándanos/Frutillas:</b> 1/2 a 1 taza</li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            4. Aceites y Alimentos Ricos en Lípidos
                        </h4>
                        <p className="text-[10px] mb-2 font-bold text-slate-400">Aporte (Bloque UDD): 180 Kcal, 20g LIP.</p>
                        <ul className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <li>• <b>Aceites:</b> 20ml (4 cucharaditas)</li>
                            <li>• <b>Palta:</b> 90g (3 cucharadas)</li>
                            <li>• <b>Nueces/Almendras:</b> 25-30g (5-26 unidades)</li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            5. Lácteos Descremados
                        </h4>
                        <p className="text-[10px] mb-2 font-bold text-slate-400">Aporte: 70 Kcal, 9g CHO, 8g PRO.</p>
                        <ul className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <li>• <b>Leche líquida:</b> 1 taza</li>
                            <li>• <b>Leche en polvo:</b> 2 cucharadas colmadas</li>
                            <li>• <b>Yogurt descremado:</b> 1 unidad</li>
                        </ul>
                    </section>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <p className="text-[10px] text-indigo-700 font-bold leading-tight italic">
                            * Información extraída de la Tabla de Composición de Alimentos UDD. El sistema utiliza estos valores para normalizar las porciones clínicas.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Add Food Modal */}
            <Modal
                isOpen={isAddFoodModalOpen}
                onClose={() => setIsAddFoodModalOpen(false)}
                title="Añadir alimento adicional"
                className="max-w-md"
            >
                <div className="space-y-4 pt-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar en la base de datos..."
                            value={foodSearchQuery}
                            onChange={(e) => setFoodSearchQuery(e.target.value)}
                            className="pl-10 h-11 rounded-xl"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {isSearchingFoods ? (
                            <div className="py-8 flex flex-col items-center gap-2">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                <p className="text-xs text-slate-400 font-bold">Buscando...</p>
                            </div>
                        ) : searchResultFoods.length > 0 ? (
                            searchResultFoods.map((food) => (
                                <div
                                    key={food.id}
                                    onClick={() => handleAddFoodFromSearch(food)}
                                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-black text-slate-800 text-sm leading-tight">{food.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{food.category?.name || 'Varios'}</p>
                                        </div>
                                        <Plus className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                                    </div>
                                </div>
                            ))
                        ) : foodSearchQuery.trim() ? (
                            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-xs text-slate-400 font-medium">No se encontraron resultados.</p>
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-xs text-slate-400 font-medium italic">Escribe para buscar alimentos...</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Import Patient Modal */}
            <Modal
                isOpen={isImportPatientModalOpen}
                onClose={() => {
                    setIsImportPatientModalOpen(false);
                    setPatientSearchQuery('');
                }}
                title="Vincular Paciente"
            >
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por nombre o email..."
                            value={patientSearchQuery}
                            onChange={e => setPatientSearchQuery(e.target.value)}
                            className="pl-11 h-12 rounded-xl border-slate-200 focus:border-indigo-500"
                            autoFocus
                        />
                    </div>

                    {isLoadingPatients && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        </div>
                    )}

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 text-left">
                        {patients
                            .filter(patient =>
                                patient.fullName.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
                                (patient.email && patient.email.toLowerCase().includes(patientSearchQuery.toLowerCase()))
                            )
                            .map(patient => (
                                <div
                                    key={patient.id}
                                    onClick={() => handleSelectPatient(patient)}
                                    className="p-4 border-2 border-slate-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer group flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 group-hover:bg-emerald-100 group-hover:border-emerald-200 transition-colors">
                                            <User className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-sm">{patient.fullName}</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                                {patient.email || 'Sin email'} • {patient.weight ? `${patient.weight}kg` : 'Peso no reg.'}
                                            </p>
                                        </div>
                                    </div>
                                    {patient.dietRestrictions && Array.isArray(patient.dietRestrictions) && patient.dietRestrictions.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3 text-rose-400" />
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">{patient.dietRestrictions.length}</span>
                                        </div>
                                    )}
                                </div>
                            ))
                        }

                        {!isLoadingPatients && patients.length === 0 && (
                            <div className="py-12 text-center">
                                <p className="text-sm text-slate-400 font-bold">
                                    No se encontraron pacientes registrados.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

        </ModuleLayout>
    );
}
