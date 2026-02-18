'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    ChefHat,
    GraduationCap,
    Zap,
    ArrowRight,
    ChevronLeft,
    Plus,
    Calendar,
    Clock,
    RotateCcw,
    Sparkles,
    Loader2,
    Dumbbell,
    Flame,
    Settings2,
    CheckCircle2,
    Info,
    Search,
    Filter,
    ArrowUpDown,
    Coffee,
    Sun,
    Moon,
    X,
    MoreHorizontal,
    Trash2,
    Target,
    Droplet,
    Layers,
    Save,
    FileCode,
    Library,
    User,
    UserPlus,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ActionDockItem } from '@/components/ui/ActionDock';
import { Modal } from '@/components/ui/Modal';
import { ModuleLayout } from '@/components/shared/ModuleLayout';
import { ModuleFooter } from '@/components/shared/ModuleFooter';
import { useAdmin } from '@/context/AdminContext';
import Cookies from 'js-cookie';

// -- Mock Types --

interface Recipe {
    id: string;
    title: string;
    description: string;
    complexity: 'simple' | 'elaborada';
    protein: number;
    calories: number;
    carbs: number;
    fats: number;
    ingredients: string[];
    image?: string;
}

interface MealSlot {
    id: string;
    time: string;
    type: 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'extra';
    label: string;
    recipe?: Recipe;
}

const MOCK_RECIPES: Recipe[] = [
    {
        id: 'r1',
        title: 'Bowl de Pollo y Arroz Primavera',
        description: 'Pollo a la plancha con arroz integral y vegetales salteados.',
        complexity: 'simple',
        protein: 35,
        calories: 450,
        carbs: 45,
        fats: 12,
        ingredients: ['Pechuga de Pollo', 'Arroz', 'Zanahoria', 'Arvejas']
    },
    {
        id: 'r2',
        title: 'Risotto de Champiñones Proteico',
        description: 'Arroz cremoso con champiñones y trozos de pollo marinado.',
        complexity: 'elaborada',
        protein: 38,
        calories: 520,
        carbs: 55,
        fats: 15,
        ingredients: ['Arroz', 'Pollo', 'Champiñones', 'Cebolla', 'Vino Blanco']
    },
    {
        id: 'r3',
        title: 'Tostadas con Huevo y Palta',
        description: 'Pan integral tostado con huevo y palta machacada.',
        complexity: 'simple',
        protein: 15,
        calories: 320,
        carbs: 25,
        fats: 18,
        ingredients: ['Pan', 'Huevo', 'Palta']
    }
];

const DEFAULT_SLOTS: MealSlot[] = [
    { id: '1', time: '08:00', type: 'desayuno', label: 'Desayuno', recipe: MOCK_RECIPES[2] },
    { id: '2', time: '13:00', type: 'almuerzo', label: 'Almuerzo' },
    { id: '3', time: '17:00', type: 'merienda', label: 'Merienda' },
    { id: '4', time: '21:00', type: 'cena', label: 'Cena' },
];

export default function RecipesClient() {
    const router = useRouter();
    const { role } = useAdmin();

    // -- State --
    const [mealCount, setMealCount] = useState(4);
    const [complexityPreference, setComplexityPreference] = useState<'simple' | 'elaborada'>('simple');
    const [isGenerating, setIsGenerating] = useState(false);

    // Day Management
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const [currentDay, setCurrentDay] = useState('Lunes');

    // Week Slots State: Stores slots for each day independently
    const [weekSlots, setWeekSlots] = useState<Record<string, MealSlot[]>>(() => {
        const initial: Record<string, MealSlot[]> = {};
        days.forEach(day => {
            // Clone default slots to avoid reference issues
            initial[day] = JSON.parse(JSON.stringify(DEFAULT_SLOTS));
        });
        return initial;
    });

    // Helper to get current slots
    const currentSlots = weekSlots[currentDay] || [];

    // Setter wrapper
    const setCurrentSlots = (newSlots: MealSlot[] | ((prev: MealSlot[]) => MealSlot[])) => {
        setWeekSlots(prev => ({
            ...prev,
            [currentDay]: typeof newSlots === 'function' ? newSlots(prev[currentDay]) : newSlots
        }));
    };

    // Chronobiology State
    const [wakeUpTime, setWakeUpTime] = useState('07:30');
    const [sleepTime, setSleepTime] = useState('23:00');
    const [patientInfo, setPatientInfo] = useState<any>({ name: 'Juan Pérez' });

    // Nutritional Targets (Editable)
    const [targetProtein, setTargetProtein] = useState(180);
    const [targetCalories, setTargetCalories] = useState(2400);
    const [targetCarbs, setTargetCarbs] = useState(250);
    const [targetFats, setTargetFats] = useState(70);

    const [showSwapModal, setShowSwapModal] = useState(false);
    const [activeSwapSlot, setActiveSwapSlot] = useState<string | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

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
                if (draft.recipes) {
                    if (draft.recipes.weekSlots) setWeekSlots(draft.recipes.weekSlots);
                    if (draft.recipes.targets) {
                        setTargetProtein(draft.recipes.targets.protein);
                        setTargetCalories(draft.recipes.targets.calories);
                        setTargetCarbs(draft.recipes.targets.carbs);
                        setTargetFats(draft.recipes.targets.fats);
                    }
                    if (draft.recipes.chronobiology) {
                        setWakeUpTime(draft.recipes.chronobiology.wakeUpTime);
                        setSleepTime(draft.recipes.chronobiology.sleepTime);
                    }
                }
            } catch (e) {
                console.error("Error loading recipes draft", e);
            }
        }

        // Load stored patient
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

        draft.recipes = {
            weekSlots,
            targets: {
                protein: targetProtein,
                calories: targetCalories,
                carbs: targetCarbs,
                fats: targetFats
            },
            chronobiology: {
                wakeUpTime,
                sleepTime
            },
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('nutri_active_draft', JSON.stringify(draft));
    }, [weekSlots, targetProtein, targetCalories, targetCarbs, targetFats, wakeUpTime, sleepTime]);

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


    // AI Generation Simulation
    const handleGenerateAI = () => {
        setIsGenerating(true);
        toast.success(`Optimizando plan para ${currentDay} con OpenAI...`, {
            description: `Buscando la mayor diversidad de combinaciones para alcanzar ${targetProtein}g de proteína y ${targetCalories} kcal diarias.`,
            duration: 3500
        });

        setTimeout(() => {
            const newSlots = currentSlots.map(slot => ({
                ...slot,
                recipe: MOCK_RECIPES[Math.floor(Math.random() * MOCK_RECIPES.length)]
            }));
            setCurrentSlots(newSlots);
            setIsGenerating(false);
            toast.success(`¡Plan del ${currentDay} generado con éxito!`);
        }, 2500);
    };

    const handleMealCountChange = (count: number) => {
        setMealCount(count);
        // Reset or adjust slots based on count
        const newSlots: MealSlot[] = Array.from({ length: count }).map((_, i) => ({
            id: String(i + 1),
            time: i === 0 ? '08:00' : i === 1 ? '13:00' : i === 2 ? '17:00' : i === 3 ? '21:00' : '23:00',
            type: i === 0 ? 'desayuno' : i === 1 ? 'almuerzo' : i === 2 ? 'merienda' : i === 3 ? 'cena' : 'extra',
            label: `Comida ${i + 1}`,
        }));
        setCurrentSlots(newSlots);
    };

    const handleTimeChange = (id: string, newTime: string) => {
        setCurrentSlots(prev => prev.map(slot => slot.id === id ? { ...slot, time: newTime } : slot));
    };

    // Derived Totals for the day
    const dayTotals = useMemo(() => {
        return currentSlots.reduce((acc, slot) => ({
            protein: acc.protein + (slot.recipe?.protein || 0),
            calories: acc.calories + (slot.recipe?.calories || 0),
            carbs: acc.carbs + (slot.recipe?.carbs || 0),
            fats: acc.fats + (slot.recipe?.fats || 0)
        }), { protein: 0, calories: 0, carbs: 0, fats: 0 });
    }, [currentSlots]);


    // Distribute times automatically based on wake/sleep
    const redistributeMealTimes = () => {
        const [wakeH, wakeM] = wakeUpTime.split(':').map(Number);
        const [sleepH, sleepM] = sleepTime.split(':').map(Number);

        const totalMinutes = (sleepH * 60 + sleepM) - (wakeH * 60 + wakeM);
        const interval = Math.floor(totalMinutes / (currentSlots.length)); // Simple distribution

        const newSlots = currentSlots.map((slot, i) => {
            const slotMin = (wakeH * 60 + wakeM) + (interval * i) + 30; // 30 min after wake for 1st meal
            const h = Math.floor(slotMin / 60);
            const m = slotMin % 60;
            return {
                ...slot,
                time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
            };
        });
        setCurrentSlots(newSlots);
        toast.info("Tiempos de comida reacomodados automáticamente.");
    };

    const printJson = () => {
        console.group('📊 RECIPES GENERATION DATA');
        console.log('Slots Semanales:', weekSlots);
        console.log('Metas Nutricionales:', { targetProtein, targetCalories, targetCarbs, targetFats });
        console.groupEnd();
        toast.info("JSON de recetas impreso en consola.");
    };

    const resetRecipes = () => {
        const initial: Record<string, MealSlot[]> = {};
        days.forEach(day => {
            initial[day] = JSON.parse(JSON.stringify(DEFAULT_SLOTS));
        });
        setWeekSlots(initial);
        toast.info("Plan semanal reiniciado.");
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
            onClick: () => toast.success("Borrador guardado localmente")
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
            onClick: resetRecipes
        }
    ], [printJson, resetRecipes]);

    return (
        <>
            <ModuleLayout
                title="Estructura de Comidas"
                description="Convierte tu lista de compras en un plan de alimentación práctico."
                step={{ number: 3, label: "Planes & Recetas (AI)", icon: GraduationCap, color: "text-emerald-600" }}
                rightNavItems={actionDockItems}
                footer={
                    <ModuleFooter>
                        <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status del Plan</p>
                                <p className="text-xs font-bold text-slate-600">Balance del lunes óptimo y coherente con el carrito.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                className="h-12 text-emerald-600 font-black gap-2 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-100 rounded-xl"
                                onClick={handlePatientLoad}
                            >
                                <UserPlus className="h-4 w-4" />
                                {selectedPatient ? (selectedPatient.fullName || selectedPatient.name) : "Asignar a un paciente"}
                            </Button>

                            <Button
                                className="h-12 px-8 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 uppercase tracking-widest text-xs"
                                onClick={() => toast.success("Creación guardada exitosamente")}
                            >
                                Guardar Creación
                            </Button>

                            <Button
                                onClick={() => router.push('/dashboard/entregable')}
                                className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-2xl shadow-emerald-200 transition-all hover:scale-[1.02] flex items-center gap-3 uppercase tracking-widest text-xs"
                            >
                                CONTINUAR
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </ModuleFooter>
                }
            >
                {selectedPatient && (
                    <div className="mb-6 animate-in slide-in-from-top duration-300 mx-auto max-w-5xl">
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

                <div className="space-y-8 mt-6">
                    {/* Header Actions */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-100">
                        <div /> {/* Spacer to push action to right */}
                        <div className="flex items-center gap-4 ml-auto">
                            <Button
                                variant="outline"
                                onClick={() => router.back()}
                                className="rounded-2xl font-bold flex items-center gap-2 border-slate-200"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Ajustar Carrito
                            </Button>
                            <Button
                                onClick={handleGenerateAI}
                                disabled={isGenerating}
                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black shadow-xl flex items-center gap-2 px-8 h-12"
                            >
                                {isGenerating ? (
                                    <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Zap className="h-5 w-5 fill-amber-400 text-amber-400" />
                                )}
                                Auto-Generar {currentDay}
                            </Button>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8 items-start">
                        {/* Left Panel: Daily Schedule / Calendar */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Meal Slots Waterfall */}
                            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700">
                                {currentSlots.map((slot) => (
                                    <div key={slot.id} className="group relative flex gap-6">
                                        {/* Time marker */}
                                        <div className="flex flex-col items-center gap-2 pt-2">
                                            <div className="relative group/time">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/time:text-emerald-600 transition-colors cursor-pointer">
                                                    {slot.time}
                                                </span>
                                                <input
                                                    type="time"
                                                    value={slot.time}
                                                    onChange={(e) => handleTimeChange(slot.id, e.target.value)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                            </div>
                                            <div className="w-[2px] h-full bg-slate-100 group-last:bg-transparent" />
                                        </div>

                                        {/* Slot Card */}
                                        <div className={cn(
                                            "flex-1 p-6 rounded-[2.5rem] border transition-all relative overflow-hidden",
                                            slot.recipe
                                                ? "bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300"
                                                : "bg-slate-50 border-dashed border-slate-300"
                                        )}>
                                            {!slot.recipe ? (
                                                <div className="flex items-center justify-between h-20">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-slate-200/50 flex items-center justify-center">
                                                            {slot.type === 'desayuno' ? <Coffee className="h-6 w-6 text-slate-300" /> : <Sun className="h-6 w-6 text-slate-300" />}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs leading-none mb-1">{slot.label}</h4>
                                                            <p className="text-sm font-medium text-slate-300 italic">Pendiente por generar...</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        className="text-emerald-600 hover:bg-emerald-50 rounded-xl font-black text-xs uppercase"
                                                        onClick={() => {
                                                            setActiveSwapSlot(slot.id);
                                                            setShowSwapModal(true);
                                                        }}
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Asignar Plato
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col md:flex-row gap-6">
                                                    <div className="h-32 w-full md:w-32 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center text-3xl shadow-inner relative group-hover:scale-105 transition-transform">
                                                        {slot.type === 'desayuno' ? '🥣' : '🍲'}
                                                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em]">{slot.label}</span>
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                                                        slot.recipe.complexity === 'simple' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-purple-50 text-purple-600 border-purple-100"
                                                                    )}>
                                                                        {slot.recipe.complexity}
                                                                    </span>
                                                                </div>
                                                                <h4 className="text-xl font-black text-slate-900 leading-tight">{slot.recipe.title}</h4>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveSwapSlot(slot.id);
                                                                        setShowSwapModal(true);
                                                                    }}
                                                                    className="p-2.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                                                                    title="Cambiar receta"
                                                                >
                                                                    <RotateCcw className="h-4 w-4" />
                                                                </button>
                                                                <button className="p-2.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all cursor-pointer">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">{slot.recipe.description}</p>

                                                        <div className="flex flex-wrap gap-4 pt-2">
                                                            <div className="flex items-center gap-1.5 transition-all">
                                                                <Dumbbell className="h-3.5 w-3.5 text-slate-400" />
                                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{slot.recipe.protein}g Prot</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 transition-all">
                                                                <Flame className="h-3.5 w-3.5 text-slate-400" />
                                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{slot.recipe.calories} kcal</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 transition-all">
                                                                <Layers className="h-3.5 w-3.5 text-slate-400" />
                                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{slot.recipe.carbs}g Cho</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 transition-all">
                                                                <Droplet className="h-3.5 w-3.5 text-slate-400" />
                                                                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{slot.recipe.fats}g Lip</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel: Configuration / Sidebar */}
                        <div className="lg:col-span-4 space-y-6 sticky top-24">
                            {/* Summary Card - Standardized Sidebar Summary */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                                <div className="relative z-10 space-y-6">
                                    <div className="text-center space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance del día ({currentDay})</p>
                                        <h3 className="text-3xl font-black text-slate-900">
                                            {dayTotals.calories}
                                            <span className="text-sm text-slate-400 font-bold ml-1 uppercase tracking-widest">kcal</span>
                                        </h3>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Protein Progress */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <span>Proteína</span>
                                                <span className="text-emerald-600">{dayTotals.protein}g / {targetProtein}g</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full transition-all duration-1000 bg-emerald-500")}
                                                    style={{ width: `${Math.min(100, (dayTotals.protein / targetProtein) * 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Carbs Progress */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <span>Carbohidratos</span>
                                                <span className="text-blue-600">{dayTotals.carbs}g / {targetCarbs}g</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 transition-all duration-1000"
                                                    style={{ width: `${Math.min(100, (dayTotals.carbs / targetCarbs) * 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Fats Progress */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <span>Grasas</span>
                                                <span className="text-purple-600">{dayTotals.fats}g / {targetFats}g</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-500 transition-all duration-1000"
                                                    style={{ width: `${Math.min(100, (dayTotals.fats / targetFats) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Configuration Controls */}
                            <section className="bg-white rounded-4xl border border-slate-200 p-8 space-y-8 shadow-sm">
                                <div className="space-y-4">
                                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest leading-none flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-emerald-600" />
                                        Seleccionar Día
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {days.map(day => (
                                            <button
                                                key={day}
                                                onClick={() => setCurrentDay(day)}
                                                className={cn(
                                                    "px-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    currentDay === day
                                                        ? "bg-slate-900 text-white shadow-lg"
                                                        : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                                )}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4 border-t border-slate-100">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Comidas al día?</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[3, 4, 5, 6].map(num => (
                                                <button
                                                    key={num}
                                                    onClick={() => handleMealCountChange(num)}
                                                    className={cn(
                                                        "py-3 rounded-2xl text-sm font-black border transition-all",
                                                        mealCount === num
                                                            ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100"
                                                            : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300"
                                                    )}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4 bg-slate-100/50 p-6 rounded-3xl border border-slate-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="h-4 w-4 text-emerald-600" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cronobiología</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase">Despierta</label>
                                                <Input
                                                    type="time"
                                                    value={wakeUpTime}
                                                    onChange={e => setWakeUpTime(e.target.value)}
                                                    className="h-10 rounded-xl text-xs font-bold"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase">Duerme</label>
                                                <Input
                                                    type="time"
                                                    value={sleepTime}
                                                    onChange={e => setSleepTime(e.target.value)}
                                                    className="h-10 rounded-xl text-xs font-bold"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full h-10 rounded-xl text-[10px] font-black uppercase border-emerald-200 text-emerald-600"
                                            onClick={redistributeMealTimes}
                                        >
                                            Recalcular Horarios
                                        </Button>
                                    </div>
                                </div>
                            </section>

                        </div>
                    </div>
                </div>

                {/* Modals moved inside main container for proper layout context */}
                {showSwapModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setShowSwapModal(false)}
                    >
                        <div
                            className="bg-white rounded-4xl w-full max-w-2xl shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                                        <RotateCcw className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Intercambiar Receta</h3>
                                        <p className="text-xs font-medium text-slate-500 tracking-widest uppercase">Explora opciones equivalentes para este slot.</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowSwapModal(false)} className="p-3 hover:bg-white rounded-2xl transition-colors text-slate-400">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                    <Input placeholder="Buscar por ingrediente o nombre..." className="pl-12 h-14 rounded-3xl border-slate-200 font-bold" />
                                </div>

                                <div className="grid gap-4">
                                    {MOCK_RECIPES.map(r => (
                                        <div
                                            key={r.id}
                                            className="p-5 border border-slate-100 bg-slate-50 rounded-3xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group cursor-pointer flex items-center justify-between"
                                            onClick={() => {
                                                setCurrentSlots(prev => prev.map(s => s.id === activeSwapSlot ? { ...s, recipe: r } : s));
                                                setShowSwapModal(false);
                                                toast.success(`Receta cambiada a ${r.title}`);
                                            }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-2xl shadow-sm">
                                                    🥗
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-slate-900 leading-none mb-1">{r.title}</h5>
                                                    <div className="flex gap-2">
                                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">{r.protein}g Proteína</span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">•</span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{r.complexity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <Button variant="ghost" className="font-bold text-slate-500 rounded-2xl hover:bg-white" onClick={() => setShowSwapModal(false)}>Cancelar</Button>
                                <Button className="bg-slate-900 text-white font-black rounded-2xl px-10 h-12 shadow-xl shadow-slate-200">Guardar Cambios</Button>
                            </div>
                        </div>
                    </div>
                )}

            </ModuleLayout>

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
        </>
    );
}
