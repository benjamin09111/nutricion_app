'use client';

import { useState, useEffect } from 'react';
import {
    Dumbbell,
    Zap,
    Target,
    ArrowRight,
    ChevronLeft,
    Activity,
    Brain,
    Flame,
    Timer,
    CheckCircle2,
    Play,
    Bike,
    Trees,
    Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import SmartPatientHeader, { PatientData } from '@/components/layout/SmartPatientHeader';

type FitnessCategory = 'weights' | 'cardio' | 'sports' | 'lowImpact';
type CardioLevel = 'suave' | 'moderado' | 'intenso';

interface FitnessItem {
    enabled: boolean;
    minutes: number;
    freq: number;
    level?: CardioLevel;
    type?: string;
}

const DEFAULT_FITNESS_STATE: Record<FitnessCategory, FitnessItem> = {
    weights: { enabled: false, minutes: 45, freq: 3 },
    cardio: { enabled: false, minutes: 30, freq: 3, level: 'moderado' },
    sports: { enabled: false, minutes: 60, freq: 1, type: 'Fútbol' },
    lowImpact: { enabled: false, minutes: 20, freq: 2, type: 'Yoga' }
};

export default function FitnessClient() {
    const router = useRouter();
    const [patient, setPatient] = useState<PatientData | null>(null);
    const [fitnessState, setFitnessState] = useState(DEFAULT_FITNESS_STATE);

    useEffect(() => {
        const stored = localStorage.getItem('nutri_patient');
        if (stored) {
            try {
                const p = JSON.parse(stored);
                setPatient(p);
                // Pre-fill from patient data if available
                if (p.fitnessGoals) {
                    setFitnessState(prev => ({ ...prev, ...p.fitnessGoals }));
                }
            } catch (e) { console.error(e); }
        }
    }, []);

    const toggleCategory = (cat: FitnessCategory) => {
        setFitnessState(prev => ({
            ...prev,
            [cat]: { ...prev[cat], enabled: !prev[cat].enabled }
        }));
    };

    const updateCategory = (cat: FitnessCategory, field: keyof FitnessItem, value: any) => {
        setFitnessState(prev => ({
            ...prev,
            [cat]: { ...prev[cat], [field]: value }
        }));
    };

    return (
        <div className="space-y-4 pb-20 fade-in animate-in duration-700">
            <SmartPatientHeader />

            <div className="max-w-7xl mx-auto space-y-8 px-4">
                {/* Header Stage: Fitness */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-rose-600 font-black text-[10px] uppercase tracking-widest">
                            <span className="bg-rose-100 px-2 py-0.5 rounded">Fase Adicional</span>
                            <span>Fitness & Entrenamiento</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Plan de Entrenamiento</h1>
                        <p className="text-slate-500 font-medium">Sincroniza la nutrición con la actividad física para maximizar resultados.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="rounded-2xl font-bold flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 transition-all"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Ajustar Recetas
                        </Button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left Panel: Activity Selection (Dark Theme preserved) */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
                            <div className="flex items-center gap-3 text-amber-400">
                                <Activity className="h-6 w-6" />
                                <h3 className="text-xl font-black tracking-tight text-white">Configuración de Rutina</h3>
                            </div>

                            <div className="grid gap-4">
                                {/* Weights */}
                                <div
                                    className={cn(
                                        "p-6 rounded-3xl border-2 transition-all cursor-pointer group",
                                        fitnessState.weights.enabled
                                            ? "bg-rose-500/10 border-rose-500"
                                            : "bg-white/5 border-white/10 hover:border-white/20"
                                    )}
                                    onClick={() => toggleCategory('weights')}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-xl", fitnessState.weights.enabled ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-400")}>
                                                <Dumbbell className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className={cn("font-black text-lg", fitnessState.weights.enabled ? "text-white" : "text-slate-400")}>Rutina de Pesas (AI)</h4>
                                                <p className="text-xs text-slate-500 font-medium">La IA ajusta la intensidad al objetivo.</p>
                                            </div>
                                        </div>
                                        <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center", fitnessState.weights.enabled ? "bg-rose-500 border-rose-500" : "border-slate-600")}>
                                            {fitnessState.weights.enabled && <CheckCircle2 className="h-4 w-4 text-white" />}
                                        </div>
                                    </div>

                                    {fitnessState.weights.enabled && (
                                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10" onClick={e => e.stopPropagation()}>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Minutos / Sesión</label>
                                                <Input
                                                    type="number"
                                                    value={fitnessState.weights.minutes}
                                                    onChange={e => updateCategory('weights', 'minutes', parseInt(e.target.value))}
                                                    className="bg-slate-800 border-slate-700 text-white font-bold h-10 rounded-xl"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Veces / Semana</label>
                                                <Input
                                                    type="number"
                                                    value={fitnessState.weights.freq}
                                                    onChange={e => updateCategory('weights', 'freq', parseInt(e.target.value))}
                                                    className="bg-slate-800 border-slate-700 text-white font-bold h-10 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Cardio */}
                                <div
                                    className={cn(
                                        "p-6 rounded-3xl border-2 transition-all cursor-pointer group",
                                        fitnessState.cardio.enabled
                                            ? "bg-amber-500/10 border-amber-500"
                                            : "bg-white/5 border-white/10 hover:border-white/20"
                                    )}
                                    onClick={() => toggleCategory('cardio')}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-xl", fitnessState.cardio.enabled ? "bg-amber-500 text-white" : "bg-slate-800 text-slate-400")}>
                                                <Bike className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className={cn("font-black text-lg", fitnessState.cardio.enabled ? "text-white" : "text-slate-400")}>Cardio Quema-Grasa</h4>
                                                <p className="text-xs text-slate-500 font-medium">Selecciona la intensidad deseada.</p>
                                            </div>
                                        </div>
                                        <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center", fitnessState.cardio.enabled ? "bg-amber-500 border-amber-500" : "border-slate-600")}>
                                            {fitnessState.cardio.enabled && <CheckCircle2 className="h-4 w-4 text-white" />}
                                        </div>
                                    </div>

                                    {fitnessState.cardio.enabled && (
                                        <div className="space-y-4 mt-4 pt-4 border-t border-white/10" onClick={e => e.stopPropagation()}>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['suave', 'moderado', 'intenso'] as const).map(l => (
                                                    <button
                                                        key={l}
                                                        onClick={() => updateCategory('cardio', 'level', l)}
                                                        className={cn(
                                                            "py-2 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all",
                                                            fitnessState.cardio.level === l
                                                                ? "bg-amber-500 text-amber-950 border-amber-500"
                                                                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                                                        )}
                                                    >
                                                        {l}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Minutos</label>
                                                    <Input
                                                        type="number"
                                                        value={fitnessState.cardio.minutes}
                                                        onChange={e => updateCategory('cardio', 'minutes', parseInt(e.target.value))}
                                                        className="bg-slate-800 border-slate-700 text-white font-bold h-10 rounded-xl"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Frecuencia</label>
                                                    <Input
                                                        type="number"
                                                        value={fitnessState.cardio.freq}
                                                        onChange={e => updateCategory('cardio', 'freq', parseInt(e.target.value))}
                                                        className="bg-slate-800 border-slate-700 text-white font-bold h-10 rounded-xl"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sports */}
                                <div
                                    className={cn(
                                        "p-6 rounded-3xl border-2 transition-all cursor-pointer group",
                                        fitnessState.sports.enabled
                                            ? "bg-emerald-500/10 border-emerald-500"
                                            : "bg-white/5 border-white/10 hover:border-white/20"
                                    )}
                                    onClick={() => toggleCategory('sports')}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-xl", fitnessState.sports.enabled ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400")}>
                                                <Trophy className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className={cn("font-black text-lg", fitnessState.sports.enabled ? "text-white" : "text-slate-400")}>Deportes Recomendados</h4>
                                                <p className="text-xs text-slate-500 font-medium">Fútbol, Padel, Tenis, etc.</p>
                                            </div>
                                        </div>
                                        <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center", fitnessState.sports.enabled ? "bg-emerald-500 border-emerald-500" : "border-slate-600")}>
                                            {fitnessState.sports.enabled && <CheckCircle2 className="h-4 w-4 text-white" />}
                                        </div>
                                    </div>

                                    {fitnessState.sports.enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10" onClick={e => e.stopPropagation()}>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Deporte</label>
                                                <Input
                                                    value={fitnessState.sports.type}
                                                    onChange={e => updateCategory('sports', 'type', e.target.value)}
                                                    className="bg-slate-800 border-slate-700 text-white font-bold h-10 rounded-xl"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Duración</label>
                                                <Input
                                                    type="number"
                                                    value={fitnessState.sports.minutes}
                                                    onChange={e => updateCategory('sports', 'minutes', parseInt(e.target.value))}
                                                    className="bg-slate-800 border-slate-700 text-white font-bold h-10 rounded-xl"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Veces/Sem</label>
                                                <Input
                                                    type="number"
                                                    value={fitnessState.sports.freq}
                                                    onChange={e => updateCategory('sports', 'freq', parseInt(e.target.value))}
                                                    className="bg-slate-800 border-slate-700 text-white font-bold h-10 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Low Impact */}
                                <div
                                    className={cn(
                                        "p-6 rounded-3xl border-2 transition-all cursor-pointer group",
                                        fitnessState.lowImpact.enabled
                                            ? "bg-blue-500/10 border-blue-500"
                                            : "bg-white/5 border-white/10 hover:border-white/20"
                                    )}
                                    onClick={() => toggleCategory('lowImpact')}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-xl", fitnessState.lowImpact.enabled ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400")}>
                                                <Trees className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h4 className={cn("font-black text-lg", fitnessState.lowImpact.enabled ? "text-white" : "text-slate-400")}>Bajo Impacto / Relax</h4>
                                                <p className="text-xs text-slate-500 font-medium">Yoga, Caminata, Meditación.</p>
                                            </div>
                                        </div>
                                        <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center", fitnessState.lowImpact.enabled ? "bg-blue-500 border-blue-500" : "border-slate-600")}>
                                            {fitnessState.lowImpact.enabled && <CheckCircle2 className="h-4 w-4 text-white" />}
                                        </div>
                                    </div>
                                    {fitnessState.lowImpact.enabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10" onClick={e => e.stopPropagation()}>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Actividad</label>
                                                <Input
                                                    value={fitnessState.lowImpact.type}
                                                    onChange={e => updateCategory('lowImpact', 'type', e.target.value)}
                                                    className="bg-slate-800 border-slate-700 text-white font-bold h-10 rounded-xl"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Duración</label>
                                                <Input
                                                    type="number"
                                                    value={fitnessState.lowImpact.minutes}
                                                    onChange={e => updateCategory('lowImpact', 'minutes', parseInt(e.target.value))}
                                                    className="bg-slate-800 border-slate-700 text-white font-bold h-10 rounded-xl"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Veces/Sem</label>
                                                <Input
                                                    type="number"
                                                    value={fitnessState.lowImpact.freq}
                                                    onChange={e => updateCategory('lowImpact', 'freq', parseInt(e.target.value))}
                                                    className="bg-slate-800 border-slate-700 text-white font-bold h-10 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Patient Fitness Goals */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[3rem] space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600">
                                    <Target className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Metas del Paciente</h3>
                            </div>

                            <p className="text-sm text-slate-600 font-medium">Estas metas son importadas del perfil del paciente y guían el entrenamiento.</p>

                            <div className="space-y-3">
                                {(patient?.fitnessGoals ? ['Bajar 5kg de grasa corporal', 'Aumentar masa muscular', 'Mejorar resistencia'] : ['No hay metas definidas.']).map((goal, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm cursor-default">
                                        <div className="h-5 w-5 rounded-full border-2 border-emerald-200 flex items-center justify-center">
                                            <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{goal}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-emerald-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Flame className="h-4 w-4 text-orange-500" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wide">Gasto Energético Extra</p>
                                </div>
                                <p className="text-2xl font-black text-slate-800">~1,850 <span className="text-sm text-slate-400">kcal/sem</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Sticky Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:px-12">
                    <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,1)]" />
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Módulo Opcional</p>
                            <p className="text-xs font-bold text-slate-600">Puedes saltar esta fase o añadir notas para el entregable.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard/entregable')}
                            className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
                        >
                            Saltar esta etapa
                        </Button>
                        <Button
                            onClick={() => router.push('/dashboard/entregable')}
                            className="h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-2xl shadow-slate-200 transition-all hover:scale-[1.02] flex items-center gap-3"
                        >
                            CONTINUAR AL ENTREGABLE
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
