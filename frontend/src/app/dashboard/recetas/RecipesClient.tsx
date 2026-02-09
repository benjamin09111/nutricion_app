'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    ChefHat,
    Zap,
    ArrowRight,
    ChevronLeft,
    Plus,
    Calendar,
    Clock,
    RotateCcw,
    Sparkles,
    Dumbbell,
    Flame,
    UtensilsCrossed,
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
    Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { JokerStorage, EmergencyJoker } from '@/features/recipes/services/jokerStorage';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import SmartPatientHeader from '@/components/layout/SmartPatientHeader';

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

    // Joker State
    const [jokers, setJokers] = useState<EmergencyJoker[]>([]);
    const [isAddJokerModalOpen, setIsAddJokerModalOpen] = useState(false);
    const [newJokerTitle, setNewJokerTitle] = useState('');
    const [isDeleteJokerModalOpen, setIsDeleteJokerModalOpen] = useState(false);
    const [jokerToDelete, setJokerToDelete] = useState<string | null>(null);

    useEffect(() => {
        // Init and Load Jokers
        JokerStorage.initialize();
        setJokers(JokerStorage.getAll());
    }, []);

    const handleAddJoker = () => {
        if (!newJokerTitle.trim()) {
            toast.error("El nombre del comodín no puede estar vacío");
            return;
        }
        const newJoker: EmergencyJoker = {
            id: Math.random().toString(36).substr(2, 9),
            title: newJokerTitle
        };
        JokerStorage.save(newJoker);
        setJokers(JokerStorage.getAll());
        setNewJokerTitle('');
        setIsAddJokerModalOpen(false);
        toast.success("Comodín creado exitosamente.");
    };

    const handleDeleteJoker = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setJokerToDelete(id);
        setIsDeleteJokerModalOpen(true);
    };

    const confirmDeleteJoker = () => {
        if (jokerToDelete) {
            JokerStorage.delete(jokerToDelete);
            setJokers(JokerStorage.getAll());
            toast.info("Comodín eliminado.");
            setJokerToDelete(null);
            setIsDeleteJokerModalOpen(false);
        }
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

    return (
        <div className="space-y-4 animate-in fade-in duration-700 pb-20">
            <SmartPatientHeader />

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Stage 3 */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                            <span className="bg-emerald-100 px-2 py-0.5 rounded">Etapa 3</span>
                            <span>Planes & Recetas (AI)</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Estructura de Comidas</h1>
                        <p className="text-slate-500 font-medium">Convierte tu lista de compras en un plan de alimentación práctico.</p>
                    </div>

                    <div className="flex items-center gap-4">
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

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left Panel: Configuration */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Controls Card */}
                        <section className="bg-white rounded-4xl border border-slate-200 p-8 space-y-8 shadow-sm">

                            {/* Day Selector Navigation (Moved for better flow but kept connected visually) */}
                            <div className="space-y-4">
                                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest leading-none flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-emerald-600" />
                                    Día de la Semana
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
                                <div className="flex items-center gap-2">
                                    <Settings2 className="h-5 w-5 text-emerald-600" />
                                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest leading-none">Configuración del Día</h3>
                                </div>

                                {/* Meal Count */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">¿Cuántas comidas?</label>
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

                                {/* Chronobiology Controls */}
                                <div className="space-y-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
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
                                                className="h-10 rounded-xl text-xs font-bold border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase">Duerme</label>
                                            <Input
                                                type="time"
                                                value={sleepTime}
                                                onChange={e => setSleepTime(e.target.value)}
                                                className="h-10 rounded-xl text-xs font-bold border-slate-200"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 rounded-xl text-[10px] font-black uppercase border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                        onClick={redistributeMealTimes}
                                    >
                                        Recalcular Horarios
                                    </Button>
                                </div>
                            </div>
                        </section>

                        {/* Emergency Jokers section */}
                        <section className="bg-amber-50 rounded-4xl p-8 border border-amber-100 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-amber-700">
                                    <UtensilsCrossed className="h-5 w-5" />
                                    <h3 className="text-sm font-black uppercase tracking-widest leading-none">Comodines</h3>
                                </div>
                                <button
                                    onClick={() => setIsAddJokerModalOpen(true)}
                                    className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="text-[11px] font-medium text-amber-800 leading-relaxed italic">
                                Tus opciones rápidas guardadas para cuando el paciente no alcanza a cocinar.
                            </p>
                            <div className="space-y-3 pt-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                {jokers.map((joker) => (
                                    <div key={joker.id} className="bg-white p-3 rounded-2xl border border-amber-200 flex items-center justify-between group hover:border-amber-500 transition-all cursor-pointer">
                                        <span className="text-xs font-bold text-slate-700">{joker.title}</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => handleDeleteJoker(joker.id, e)}
                                                className="h-6 w-6 rounded-full flex items-center justify-center text-amber-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                            <div className="h-6 w-6 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                                <Plus className="h-3 w-3" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {jokers.length === 0 && (
                                    <div className="text-center py-4 text-xs text-amber-400 font-medium">
                                        No hay comodines. ¡Crea uno!
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Panel: Daily Schedule / Calendar */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* NEW: Prominent Daily Balance Header */}
                        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                <Target className="h-40 w-40" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-2xl font-black mb-1">Balance de {currentDay}</h3>
                                    <p className="text-slate-400 text-sm font-medium">Resumen de macronutrientes dinámico.</p>
                                </div>

                                <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                                    {/* Calories */}
                                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl min-w-[100px] border border-white/10">
                                        <div className="flex items-center gap-2 mb-2 text-amber-400">
                                            <Flame className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Kcal</span>
                                        </div>
                                        <p className="text-xl font-black">{dayTotals.calories}</p>
                                        <p className="text-[10px] text-slate-400">/ {targetCalories}</p>
                                        <div className="h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, (dayTotals.calories / targetCalories) * 100)}%` }} />
                                        </div>
                                    </div>

                                    {/* Protein */}
                                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl min-w-[100px] border border-white/10">
                                        <div className="flex items-center gap-2 mb-2 text-emerald-400">
                                            <Dumbbell className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Prot</span>
                                        </div>
                                        <p className="text-xl font-black">{dayTotals.protein}g</p>
                                        <p className="text-[10px] text-slate-400">/ {targetProtein}g</p>
                                        <div className="h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, (dayTotals.protein / targetProtein) * 100)}%` }} />
                                        </div>
                                    </div>

                                    {/* Carbs */}
                                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl min-w-[100px] border border-white/10">
                                        <div className="flex items-center gap-2 mb-2 text-blue-400">
                                            <Layers className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Carb</span>
                                        </div>
                                        <p className="text-xl font-black">{dayTotals.carbs}g</p>
                                        <p className="text-[10px] text-slate-400">/ {targetCarbs}g</p>
                                        <div className="h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-blue-400" style={{ width: `${Math.min(100, (dayTotals.carbs / targetCarbs) * 100)}%` }} />
                                        </div>
                                    </div>

                                    {/* Fats */}
                                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl min-w-[100px] border border-white/10">
                                        <div className="flex items-center gap-2 mb-2 text-purple-400">
                                            <Droplet className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Grasas</span>
                                        </div>
                                        <p className="text-xl font-black">{dayTotals.fats}g</p>
                                        <p className="text-[10px] text-slate-400">/ {targetFats}g</p>
                                        <div className="h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-purple-400" style={{ width: `${Math.min(100, (dayTotals.fats / targetFats) * 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


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
                                                        <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                                                            <Dumbbell className="h-3.5 w-3.5 text-emerald-600" />
                                                            <span className="text-xs font-black text-slate-700">{slot.recipe.protein}g Proteína</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                                                            <Flame className="h-3.5 w-3.5 text-amber-500" />
                                                            <span className="text-xs font-black text-slate-700">{slot.recipe.calories} kcal</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                                                            <Layers className="h-3.5 w-3.5 text-blue-500" />
                                                            <span className="text-xs font-black text-slate-700">{slot.recipe.carbs}g Carbs</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                                                            <Droplet className="h-3.5 w-3.5 text-purple-500" />
                                                            <span className="text-xs font-black text-slate-700">{slot.recipe.fats}g Grasas</span>
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
                </div>

                {/* Swap Recipe Modal Mock */}
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

                {/* Add Joker Modal */}
                {isAddJokerModalOpen && (
                    <div
                        className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsAddJokerModalOpen(false)}
                    >
                        <div
                            className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-6 space-y-4"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black text-slate-900">Nuevo Comodín</h3>
                                <button onClick={() => setIsAddJokerModalOpen(false)}><X className="h-5 w-5 text-slate-400" /></button>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre del Plato / Snack</label>
                                <Input
                                    autoFocus
                                    placeholder="Ej. Yogurt con Frutas"
                                    className="h-12 rounded-xl border-slate-200 font-bold"
                                    value={newJokerTitle}
                                    onChange={(e) => setNewJokerTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddJoker();
                                    }}
                                />
                            </div>
                            <Button
                                onClick={handleAddJoker}
                                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-lg shadow-amber-200"
                            >
                                CREAR COMODÍN
                            </Button>
                        </div>
                    </div>
                )}

                {/* Bottom Sticky Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:px-12">
                    <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status del Plan</p>
                            <p className="text-xs font-bold text-slate-600">Balance del lunes óptimo y coherente con el carrito.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-slate-50"
                        >
                            Guardar PDF Borrador
                        </Button>
                        <Button
                            onClick={() => router.push('/dashboard/fitness')}
                            className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-2xl shadow-emerald-200 transition-all hover:scale-[1.02] flex items-center gap-3"
                        >
                            CONTINUAR A FITNESS
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <ConfirmationModal
                    isOpen={isDeleteJokerModalOpen}
                    onClose={() => setIsDeleteJokerModalOpen(false)}
                    onConfirm={confirmDeleteJoker}
                    title="¿Borrar este comodín?"
                    description="Esta acción eliminará el comodín de tu lista de opciones rápidas."
                    confirmText="Borrar"
                    cancelText="Cancelar"
                    variant="destructive"
                />
            </div>
        </div>
    );
}
