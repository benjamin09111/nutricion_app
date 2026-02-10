'use client';

import { useState, useMemo, useEffect } from 'react';
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
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatCLP } from '@/lib/utils/currency';
import { useAdmin } from '@/context/AdminContext';

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
    const [selectedMarket, setSelectedMarket] = useState('General (Precios Promedio)');
    const [timeView, setTimeView] = useState<'dia' | 'semana' | 'mes'>('semana');

    // Load persisted patient on mount
    useEffect(() => {
        const stored = localStorage.getItem('nutri_patient');
        if (stored) {
            try {
                setSelectedPatient(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse stored patient", e);
            }
        }
    }, []);

    // Totals logic
    const totals = useMemo(() => {
        let calories = 0;
        let protein = 0;
        let carbs = 0;
        let fats = 0;
        let cost = 0;

        items.forEach(item => {
            // Calculamos lo ingerido por día promedio basado en la frecuencia semanal
            // (gramos_porcion * frecuencia) / 7
            const gramosDia = (item.porcionGramos * item.frecuenciaSemanal) / 7;

            calories += (gramosDia * item.caloriasPor100g) / 100;
            protein += (gramosDia * item.proteinaPor100g) / 100;
            carbs += (gramosDia * item.carbohidratosPor100g) / 100;
            fats += (gramosDia * item.grasasPor100g) / 100;
            cost += item.cantidadMes * item.precioPorUnidad;
        });

        const multiplier = timeView === 'dia' ? 1 : timeView === 'semana' ? 7 : 30;
        // Simple scaling, though monthly cost is usually fixed sum
        const scale = (val: number) => Math.round(val * (timeView === 'dia' ? 1 : timeView === 'semana' ? 7 : 30));

        return {
            calories: scale(calories),
            protein: scale(protein),
            carbs: scale(carbs),
            fats: scale(fats),
            cost: timeView === 'mes' ? cost : (cost / 4) * (timeView === 'semana' ? 1 : 0.14) // very rough scaling
        };
    }, [items, timeView]);

    const handleQuantityChange = (id: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, cantidadMes: numValue } : item
        ));
    };

    const handlePatientLoad = () => {
        const patientData = {
            name: 'Juan Pérez',
            age: 34,
            weight: 88,
            height: 1.82,
            targetProtein: 180,
            targetCarbs: 300,
            targetFats: 80,
            targetCalories: 2600,
            fitnessGoals: {
                weights: { enabled: true, minutes: 60, freq: 4 },
                cardio: { enabled: true, level: 'moderado', minutes: 30, freq: 3 }, // levels: suave, moderado, intenso
                sports: { enabled: false, type: 'Fútbol', minutes: 90, freq: 1 },
                lowImpact: { enabled: true, type: 'Caminata', minutes: 45, freq: 2 }
            }
        };

        setSelectedPatient(patientData);
        localStorage.setItem('nutri_patient', JSON.stringify(patientData));
        window.dispatchEvent(new Event('patient-updated'));

        toast.success("Perfil de Juan Pérez cargado. Los objetivos han sido actualizados.");
    };

    const printJson = () => {
        console.group('📊 CART / CARRO DATA');
        console.log('Items en Carrito:', items);
        console.log('Totales Calculados:', totals);
        if (selectedPatient) console.log('Paciente Vinculado:', selectedPatient);
        console.groupEnd();
        toast.info("JSON del carrito impreso en consola.");
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-2 text-sm font-bold group"
                    >
                        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Volver a Dieta Base
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Carrito & Cuantificador</h1>
                    <p className="text-slate-500 font-medium">Transforma la estrategia en una lista de compras exacta.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white p-1 rounded-2xl border border-slate-200 flex shadow-sm">
                        {(['dia', 'semana', 'mes'] as const).map((view) => (
                            <button
                                key={view}
                                onClick={() => setTimeView(view)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    timeView === view
                                        ? "bg-slate-900 text-white shadow-lg"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                {view}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Context Bar */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Patient Selector */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 leading-tight">Perfil del Paciente</h3>
                                <p className="text-xs text-slate-500">Base para cuantificación nutricional</p>
                            </div>
                        </div>
                        {!selectedPatient && (
                            <Button variant="outline" size="sm" onClick={handlePatientLoad} className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50">
                                Vincular Paciente
                            </Button>
                        )}
                    </div>
                    {selectedPatient ? (
                        <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-4 animate-in fade-in duration-500">
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Nombre</p>
                                <p className="text-sm font-bold text-slate-800">{selectedPatient.name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Peso / Altura</p>
                                <p className="text-sm font-bold text-slate-800">{selectedPatient.weight}kg / {selectedPatient.height}m</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Target Proteico</p>
                                <p className="text-sm font-bold text-emerald-600">{selectedPatient.targetProtein}g / día</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-400 italic py-2">
                            <TrendingUp className="h-4 w-4" />
                            Carga un paciente para ver recomendaciones de porciones.
                        </div>
                    )}
                </div>

                {/* Market Selector (LOCKED) */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-xl animate-in zoom-in-95">
                            <Lock className="h-3 w-3" />
                            Próximamente: Integración Retail
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <ShoppingCart className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 leading-tight">Mercado de Referencia</h3>
                            <p className="text-xs text-slate-500">Precios basados en {selectedMarket}</p>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 opacity-60">
                        {['Lider', 'Jumbo', 'Unimarc', 'Feria Libre'].map(m => (
                            <span key={m} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-400">{m}</span>
                        ))}
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
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Gasto Estimado</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {items.map((item) => (
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
                                                    value={item.cantidadMes}
                                                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                    className="h-10 pr-8 text-center font-bold border-slate-200 rounded-xl focus:ring-emerald-500"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 pointer-events-none uppercase">
                                                    {item.unidad}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex gap-1">
                                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-black border border-emerald-100">
                                                    {item.frecuenciaSemanal}x sem
                                                </span>
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-black border border-blue-100">
                                                    {item.porcionGramos}g
                                                </span>
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-medium">Recomendado: {(item.cantidadMes / 4 / item.frecuenciaSemanal * 1000).toFixed(0)}g / porción</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <p className="font-black text-slate-800 text-sm">
                                            {formatCLP(item.cantidadMes * item.precioPorUnidad)}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold">{formatCLP(item.precioPorUnidad)} / {item.unidad}</p>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <button className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest hover:text-emerald-700 transition-colors cursor-pointer">
                        <Plus className="h-4 w-4" />
                        Agregar alimento adicional al carrito
                    </button>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Costo Total Mensual</p>
                            <p className="text-xl font-black text-slate-900">{formatCLP(items.reduce((acc, i) => acc + i.cantidadMes * i.precioPorUnidad, 0))}</p>
                        </div>
                    </div>
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
                                <p className="font-bold text-lg mb-1">+500g Pollo / semana</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-black text-white">$4.500 CLP</span>
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/40 p-4 rounded-2xl hover:bg-amber-500/20 transition-all cursor-pointer group relative">
                                <div className="absolute -top-2 -right-2 bg-amber-500 text-amber-950 text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg">RECOMENDADO</div>
                                <p className="text-[10px] font-black text-amber-400 uppercase mb-2">Opción Suplemento</p>
                                <p className="font-bold text-lg mb-1">+1 Scoop Whey / día</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-black text-white">$2.800 CLP</span>
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

                            <div className="grid grid-cols-1 pt-2">
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Costo Est. ({timeView})</p>
                                    <p className="text-sm font-black text-emerald-600">{formatCLP(totals.cost)}</p>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-200 uppercase tracking-widest text-xs"
                            onClick={() => router.push('/dashboard/recetas')} // Stage 3!
                        >
                            Finalizar Carrito
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 p-4 md:px-8 flex items-center justify-between z-20">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-bold font-italic">Semáforo: Falta Vitamina B12 y Zinc</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="text-slate-500 font-bold hover:bg-slate-100 rounded-xl">
                        Guardar Borrador
                    </Button>

                    <Button
                        variant="outline"
                        className="text-slate-500 font-bold hover:bg-slate-100 rounded-xl px-4 h-10 border-slate-200"
                        onClick={printJson}
                    >
                        Imprimir JSON (Carrito)
                    </Button>

                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-8 shadow-lg shadow-emerald-200">
                        Generar Recetas Automáticas
                        <Zap className="ml-2 h-4 w-4 fill-current" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
