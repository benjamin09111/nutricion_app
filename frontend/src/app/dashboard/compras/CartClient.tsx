'use client';

import { useState, useMemo } from 'react';
import {
    ShoppingCart,
    GraduationCap,
    ArrowRight,
    ChevronLeft,
    Users,
    Lock,
    Zap,
    Trash2,
    Plus,
    Calculator,
    Dumbbell,
    Scale,
    AlertTriangle,
    Target,
    ArrowUpDown,
    Info,
    CheckCircle2,
    DollarSign,
    Box,
    X,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatCLP } from '@/lib/utils/currency';

// -- Types --

interface CartItem {
    id: string;
    producto: string;
    grupo: string;
    cantidadMes: number; // Final quantity to buy per month (kg/units)
    frecuenciaSemanal: number; // How many times a week they eat this
    porcionGramos: number; // Grams per serving
    caloriasPor100g: number;
    proteinaPor100g: number;
    vitaminaAPor100g: number; // Mock micronutrient
    precioPorUnidad: number;
    unidad: string;
}

const MOCK_CART_ITEMS: CartItem[] = [
    {
        id: '1',
        producto: 'Pechuga de Pollo',
        grupo: 'Carnes',
        cantidadMes: 4.2,
        frecuenciaSemanal: 4,
        porcionGramos: 150,
        caloriasPor100g: 165,
        proteinaPor100g: 31,
        vitaminaAPor100g: 0,
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
        vitaminaAPor100g: 0,
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
        vitaminaAPor100g: 54,
        precioPorUnidad: 1800,
        unidad: 'kg'
    },
];

export default function CartClient() {
    const router = useRouter();

    // -- State --
    const [items, setItems] = useState<CartItem[]>(MOCK_CART_ITEMS);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [timeView, setTimeView] = useState<'dia' | 'semana' | 'mes'>('semana');
    const [isRetailIntegrationOpen, setIsRetailIntegrationOpen] = useState(false);
    const [showMarketLockModal, setShowMarketLockModal] = useState(false);
    const [isPatientSelectorOpen, setIsPatientSelectorOpen] = useState(false);
    const [patientSearchTerm, setPatientSearchTerm] = useState('');

    const MOCK_PATIENTS = [
        {
            id: '1',
            name: 'Juan Pérez',
            age: 34,
            weight: 88,
            height: 1.82,
            targetProtein: 180,
            targetCalories: 2600,
            wakeUpTime: '07:30',
            sleepTime: '23:00',
            conditions: ['Diabético'],
            tags: ['Diabético', 'Alto Gasto']
        },
        {
            id: '2',
            name: 'Ana Silva',
            age: 29,
            weight: 62,
            height: 1.65,
            targetProtein: 120,
            targetCalories: 1800,
            wakeUpTime: '06:30',
            sleepTime: '22:30',
            conditions: ['Sin Gluten'],
            tags: ['Sin Gluten', 'Vegana']
        },
        {
            id: '3',
            name: 'Carlos Ruiz',
            age: 45,
            weight: 95,
            height: 1.78,
            targetProtein: 160,
            targetCalories: 2400,
            wakeUpTime: '08:00',
            sleepTime: '00:00',
            conditions: [],
            tags: ['Hipertrofia']
        }
    ];

    const filteredPatients = MOCK_PATIENTS.filter(p =>
        p.name.toLowerCase().includes(patientSearchTerm.toLowerCase())
    );

    // -- Derived Calculations --
    const nutritionalTotals = useMemo(() => {
        let calories = 0;
        let protein = 0;
        let vitaminA = 0;
        let totalCost = 0;

        items.forEach(item => {
            // Grams consumed per day average: (portion * frequency) / 7
            const dailyGrams = (item.porcionGramos * item.frecuenciaSemanal) / 7;

            calories += (dailyGrams * item.caloriasPor100g) / 100;
            protein += (dailyGrams * item.proteinaPor100g) / 100;
            vitaminA += (dailyGrams * item.vitaminaAPor100g) / 100;
            totalCost += item.cantidadMes * item.precioPorUnidad;
        });

        // Scale based on view
        const scale = timeView === 'dia' ? 1 : timeView === 'semana' ? 7 : 30;

        return {
            calories: Math.round(calories * scale),
            protein: Math.round(protein * scale),
            vitaminA: Math.round(vitaminA * scale),
            cost: timeView === 'mes' ? totalCost : (totalCost / 30) * scale,
            dailyProtein: Math.round(protein),
            dailyCalories: Math.round(calories)
        };
    }, [items, timeView]);

    // -- Handlers --

    const handlePatientLoad = () => {
        setIsPatientSelectorOpen(true);
    };

    const selectPatient = (patient: any) => {
        setSelectedPatient({
            ...patient,
            sex: 'Masculino', // Defaulting for mock
            tastes: ['Pollo', 'Arroz', 'Manzanas'],
            dislikes: ['Lentejas', 'Pescado Blanco'],
        });
        setIsPatientSelectorOpen(false);
        toast.success(`Perfil de ${patient.name} cargado correctamente.`);
    };

    const updateQuantity = (id: string, newQty: number) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, cantidadMes: Math.max(0, newQty) } : item
        ));
    };

    const updateFrecuency = (id: string, newFreq: number) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, frecuenciaSemanal: Math.max(0, newFreq) } : item
        ));
    };

    // -- Views --

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Stage 2 */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                        <span className="bg-emerald-100 px-2 py-0.5 rounded">Etapa 2</span>
                        <span>Cuantificador & Carrito</span>
                        <GraduationCap className="h-4 w-4 ml-2 cursor-pointer hover:text-emerald-800 transition-colors" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Personalización del Plan</h1>
                    <p className="text-slate-500 font-medium">Ajusta cantidades, frecuencias y verifica la viabilidad nutricional para tu paciente.</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    {(['dia', 'semana', 'mes'] as const).map((view) => (
                        <button
                            key={view}
                            onClick={() => setTimeView(view)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                timeView === view
                                    ? "bg-slate-900 text-white shadow-xl scale-[1.02]"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            Vista {view}
                        </button>
                    ))}
                </div>
            </div>

            {/* Context & Intelligent Sidebar Grid */}
            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left Column: Configuration */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Patient Card */}
                    <section className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden group">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                                        <Users className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">Perfil del Paciente</h2>
                                        <p className="text-sm font-medium text-slate-500">Datos cargados desde el CRM</p>
                                    </div>
                                </div>
                                <Button
                                    variant={selectedPatient ? "outline" : "default"}
                                    onClick={handlePatientLoad}
                                    className={cn(
                                        "rounded-2xl font-bold transition-all",
                                        selectedPatient ? "border-slate-200 text-slate-500" : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100"
                                    )}
                                >
                                    {selectedPatient ? "Cambiar Paciente" : "Cargar Paciente"}
                                </Button>
                            </div>

                            {selectedPatient ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 animate-in slide-in-from-top-4 duration-500">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidad</p>
                                        <p className="font-bold text-slate-800">{selectedPatient.name}, {selectedPatient.age} años</p>
                                        <div className="flex gap-1">
                                            {selectedPatient.conditions.map((c: string) => (
                                                <span key={c} className="text-[9px] font-black bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Antropometría</p>
                                        <p className="font-bold text-slate-800">{selectedPatient.weight}kg / {selectedPatient.height}m</p>
                                        <p className="text-[10px] text-slate-400 font-bold">IMC: 26.5 (Sobrepeso)</p>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gustos y Disgustos</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedPatient.tastes.map((t: string) => (
                                                <span key={t} className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">❤️ {t}</span>
                                            ))}
                                            {selectedPatient.dislikes.map((d: string) => (
                                                <span key={d} className="text-[9px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">🚫 {d}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <Users className="h-10 w-10 text-slate-300 mb-2" />
                                    <p className="text-slate-400 font-bold text-sm">Vincula un paciente para automatizar porciones y restricciones.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Main Quantifier Table */}
                    <section className="bg-white rounded-4xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <ShoppingCart className="h-6 w-6 text-emerald-600" />
                                Lista de Cuantificación
                            </h2>
                            <div className="relative">
                                <div
                                    onClick={() => setShowMarketLockModal(!showMarketLockModal)}
                                    className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl text-amber-700 border border-amber-100 hover:bg-amber-100 hover:border-amber-200 transition-all cursor-pointer group/lock active:scale-95"
                                >
                                    <Lock className="h-4 w-4 group-hover/lock:rotate-12 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Precios Basados en Promedio Mercado (Chile)</span>
                                </div>

                                {showMarketLockModal && (
                                    <>
                                        {/* Modal Backdrop for click-outside closing */}
                                        <div
                                            className="fixed inset-0 z-40 bg-transparent"
                                            onClick={() => setShowMarketLockModal(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-64 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 border border-white/10">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-amber-500 p-1.5 rounded-lg shrink-0">
                                                    <Info className="h-4 w-4 text-amber-950" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-bold text-xs leading-tight">Próxima Funcionalidad</p>
                                                    <p className="text-[10px] text-slate-300 leading-relaxed">
                                                        En un futuro podrás basarte en productos y precios de supermercados específicos (Lider, Jumbo, etc.) para una precisión total.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="absolute -top-1 right-8 w-3 h-3 bg-slate-900 border-l border-t border-white/10 rotate-45" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                                        <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Freq. Semanal</th>
                                        <th className="px-8 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Compra Mes</th>
                                        <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Gasto Est.</th>
                                        <th className="px-8 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {items.map((item) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-xl shadow-sm">
                                                        {item.grupo === 'Carnes' ? '🍗' : item.grupo === 'Cereales' ? '🍚' : '🍎'}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 leading-tight">{item.producto}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.grupo}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => updateFrecuency(item.id, item.frecuenciaSemanal - 1)}
                                                        className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 cursor-pointer"
                                                    >-</button>
                                                    <span className="w-10 text-center font-black text-slate-700">{item.frecuenciaSemanal}</span>
                                                    <button
                                                        onClick={() => updateFrecuency(item.id, item.frecuenciaSemanal + 1)}
                                                        className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 cursor-pointer"
                                                    >+</button>
                                                </div>
                                                <p className="text-[9px] text-center text-slate-400 font-bold mt-1 tracking-tighter uppercase whitespace-nowrap">Veces por semana</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="relative mx-auto w-28">
                                                    <input
                                                        type="number"
                                                        value={item.cantidadMes}
                                                        onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value))}
                                                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-center font-black text-slate-800 focus:ring-2 focus:ring-emerald-500 transition-all"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">{item.unidad}</span>
                                                </div>
                                                <p className="text-[9px] text-center text-slate-400 font-bold mt-1 truncate">~{(item.cantidadMes / 4 / (item.frecuenciaSemanal || 1) * 1000).toFixed(0)}g por porción</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <p className="font-black text-slate-900">{formatCLP(item.cantidadMes * item.precioPorUnidad)}</p>
                                                <button className="text-[9px] font-black text-blue-600 hover:underline uppercase tracking-widest flex items-center gap-1 ml-auto">
                                                    <ArrowUpDown className="h-2 w-2" />
                                                    Intercambiables
                                                </button>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                            <button className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest hover:text-emerald-700 transition-colors group cursor-pointer">
                                <Plus className="h-4 w-4 transform group-hover:rotate-90 transition-transform" />
                                Agregar Alimento / Fitness Product
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversión Mensual Est.</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatCLP(items.reduce((acc, i) => acc + i.cantidadMes * i.precioPorUnidad, 0))}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Intelligence & Semaphore */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Nutritional Resume (Semaphore) */}
                    <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                            <Target className="h-40 w-40" />
                        </div>

                        <div className="relative z-10 space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-black tracking-tight uppercase">Dashboard Nutricional</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Vista {timeView}</p>
                                </div>
                                <div className="p-3 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <Calculator className="h-5 w-5 text-emerald-400" />
                                </div>
                            </div>

                            {/* Semaphore Progress Circles */}
                            <div className="flex justify-around py-4">
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <div className={cn(
                                        "h-24 w-24 rounded-full border-[6px] flex flex-col items-center justify-center transition-all duration-1000",
                                        (nutritionalTotals.dailyProtein >= (selectedPatient?.targetProtein || 160)) ? "border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse"
                                    )}>
                                        <span className="text-2xl font-black leading-none">{nutritionalTotals.protein}g</span>
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Proteína</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 tracking-tight">Meta: {selectedPatient?.targetProtein || 160}g</p>
                                </div>

                                <div className="flex flex-col items-center gap-2 text-center">
                                    <div className="h-24 w-24 rounded-full border-[6px] border-blue-500/30 text-blue-400 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black leading-none">{nutritionalTotals.calories}</span>
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Kcal</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 tracking-tight">Meta: {selectedPatient?.targetCalories || 2400}</p>
                                </div>
                            </div>

                            <div className="space-y-4 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Box className="h-4 w-4 text-emerald-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Micronutrientes</span>
                                    </div>
                                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded">Alerta</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-slate-400">Vitamina A</span>
                                        <span>{nutritionalTotals.vitaminA} UI <span className="text-red-400 text-[10px] ml-1">(-30%)</span></span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 w-[60%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Intelligent Cost-Benefit Suggestion */}
                    <section className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100 space-y-6">
                        <div className="flex items-center gap-2 text-emerald-700">
                            <Zap className="h-5 w-5 fill-current" />
                            <h3 className="text-sm font-black uppercase tracking-widest">Optimizador Costo-Macro</h3>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm font-bold text-emerald-800 leading-snug">
                                Faltan {Math.max(0, (selectedPatient?.targetProtein || 160) - nutritionalTotals.dailyProtein)}g de proteína diaria. ¿Cómo los cubrimos?
                            </p>

                            <div className="space-y-3">
                                <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm hover:border-emerald-600 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Opción Natural</span>
                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Sostenible</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <p className="font-black text-slate-800">+120g Pollo / comida</p>
                                        <p className="text-sm font-black text-slate-900">+ $5.200 <span className="text-[10px] text-slate-400 font-bold tracking-tight">/ mes</span></p>
                                    </div>
                                </div>

                                <div className="p-4 bg-white rounded-2xl border-2 border-amber-500 shadow-xl shadow-amber-100 relative cursor-pointer group">
                                    <div className="absolute -top-3 left-4 bg-amber-500 text-amber-950 text-[9px] font-black px-3 py-1 rounded-full">MÁS EFICIENTE</div>
                                    <div className="flex justify-between items-start mb-2 pt-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suplementación</span>
                                        <Zap className="h-3 w-3 text-amber-500 fill-current" />
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <p className="font-black text-slate-800">+1 Scoop Whey / día</p>
                                        <p className="text-sm font-black text-slate-900">+ $3.100 <span className="text-[10px] text-slate-400 font-bold tracking-tight">/ mes</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Products to Avoid Section */}
            {selectedPatient && (
                <section className="bg-red-50/50 rounded-[2.5rem] border border-red-100 p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-red-700">
                            <AlertTriangle className="h-6 w-6" />
                            <h3 className="text-xl font-black uppercase tracking-tight">Productos a Evitar</h3>
                        </div>
                        <span className="text-[10px] font-black bg-red-100 text-red-600 px-3 py-1 rounded-full uppercase tracking-widest">Basado en sus restricciones</span>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedPatient.conditions.includes('Diabético') && (
                            <div className="bg-white p-4 rounded-3xl border border-red-100 shadow-sm flex items-start gap-4">
                                <div className="h-10 w-10 bg-red-50 rounded-2xl flex items-center justify-center text-xl">🍭</div>
                                <div>
                                    <p className="font-black text-slate-900 text-sm leading-none mb-1">Azúcares & Refrescos</p>
                                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Alto Índice Glucémico</p>
                                </div>
                            </div>
                        )}
                        {selectedPatient.conditions.some((c: string) => c.toLowerCase().includes('gluten') || c.toLowerCase() === 'celiaco') && (
                            <div className="bg-white p-4 rounded-3xl border border-red-100 shadow-sm flex items-start gap-4">
                                <div className="h-10 w-10 bg-red-50 rounded-2xl flex items-center justify-center text-xl">🌾</div>
                                <div>
                                    <p className="font-black text-slate-900 text-sm leading-none mb-1">Harinas de Trigo/Avena</p>
                                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Contiene Gluten</p>
                                </div>
                            </div>
                        )}
                        <div className="bg-white p-4 rounded-3xl border border-red-100 shadow-sm flex items-start gap-4">
                            <div className="h-10 w-10 bg-red-50 rounded-2xl flex items-center justify-center text-xl">🍔</div>
                            <div>
                                <p className="font-black text-slate-900 text-sm leading-none mb-1">Ultra-procesados</p>
                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Grasas Trans & Sodio</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Sticky Actions Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:px-12">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Semáforo de Adherencia</p>
                            <p className="text-xs font-bold text-slate-600 italic">Déficit crítico en Vitamina A y Zinc detectado.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-slate-50"
                    >
                        Guardar Borrador
                    </Button>
                    <Button
                        onClick={() => {
                            toast.success("Iniciando generación automática con OpenAI...", {
                                description: "Este proceso puede tardar unos segundos.",
                                duration: 3000
                            });
                            setTimeout(() => {
                                router.push('/dashboard/recetas');
                            }, 2000);
                        }}
                        className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-2xl shadow-emerald-200 transition-all hover:scale-[1.02] flex items-center gap-3"
                    >
                        <Zap className="h-5 w-5 fill-current" />
                        GENERAR RECETAS (AI)
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            {/* Patient Selector Modal */}
            {isPatientSelectorOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="fixed inset-0" onClick={() => setIsPatientSelectorOpen(false)} />
                    <div className="relative bg-white w-full max-w-2xl rounded-4xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Seleccionar Paciente</h3>
                                    <p className="text-sm font-medium text-slate-500">Busca y selecciona un paciente del CRM.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsPatientSelectorOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    placeholder="Buscar por nombre..."
                                    className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-inner"
                                    value={patientSearchTerm}
                                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredPatients.map(patient => (
                                    <div
                                        key={patient.id}
                                        onClick={() => selectPatient(patient)}
                                        className="p-5 rounded-3xl border border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold group-hover:bg-blue-200 group-hover:text-blue-700 transition-colors">
                                                {patient.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors">{patient.name}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{patient.age} años</span>
                                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{patient.weight}kg / {patient.height}m</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                                            {patient.tags.map(tag => (
                                                <span key={tag} className="text-[9px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
