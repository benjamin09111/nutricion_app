'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Save,
    Info,
    Sparkles,
    Search,
    Bot,
    ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { ModuleLayout } from '@/components/shared/ModuleLayout';
import { ModuleFooter } from '@/components/shared/ModuleFooter';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface SubstituteEntry {
    id: string;
    original: string;
    substitute: string;
    notes?: string;
}

export function SubstitutesClient() {
    const router = useRouter();
    const [substitutes, setSubstitutes] = useState<SubstituteEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSubstitutes();
    }, []);

    const fetchSubstitutes = async (retries = 3) => {
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/substitutes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data && data.content) {
                    setSubstitutes(data.content);
                }
            }
        } catch (e) {
            if (retries > 0) {
                setTimeout(() => fetchSubstitutes(retries - 1), 2000);
            } else {
                console.warn("Backend no disponible para cargar sustitutos aún.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        setSubstitutes([...substitutes, {
            id: Math.random().toString(36).substr(2, 9),
            original: '',
            substitute: ''
        }]);
    };

    const handleRemove = (id: string) => {
        setSubstitutes(substitutes.filter(s => s.id !== id));
    };

    const handleChange = (id: string, field: keyof SubstituteEntry, value: string) => {
        setSubstitutes(substitutes.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/substitutes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: substitutes })
            });

            if (response.ok) {
                toast.success("Conocimiento guardado correctamente. Tu IA ya conoce estos cambios.");
            } else {
                toast.error("Error al guardar los sustitutos.");
            }
        } catch (e) {
            toast.error("Error de conexión al guardar.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ModuleLayout
            title="Base de Sustitutos"
            description="Indica sustitutos comunes para entrenar a tu asistente y automatizar respuestas."
            step={{ number: 1, label: "Conocimiento IA", icon: Bot, color: "text-indigo-600" }}
            footer={
                <ModuleFooter>
                    <div className="flex items-center gap-2 text-slate-400">
                        <Info className="h-4 w-4" />
                        <p className="text-xs font-medium">Esta información alimenta al Chatbot de tus pacientes.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="h-12 text-slate-500 font-bold gap-2 hover:bg-slate-100 rounded-xl px-6"
                        >
                            <ChevronLeft className="h-5 w-5" />
                            Regresar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl px-10 h-12 shadow-xl shadow-indigo-100 flex items-center gap-2"
                        >
                            {isSaving ? "GUARDANDO..." : "GUARDAR CONOCIMIENTO"}
                            <Save className="h-5 w-5" />
                        </Button>
                    </div>
                </ModuleFooter>
            }
        >
            <div className="max-w-4xl mx-auto space-y-8 mt-6">
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex items-start gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-indigo-200">
                        <Bot className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-1">Entrenamiento Prioritario</h3>
                        <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                            Los sustitutos que definas aquí serán la fuente de verdad principal para el Chatbot.
                            Si un paciente tiene dudas sobre qué alimentos intercambiar, la IA responderá basándose en estas reglas.
                        </p>
                    </div>
                </div>

                <div className="space-y-4 pb-20">
                    <div className="flex items-center justify-between px-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lista de Sustituciones</h4>
                        <Button variant="ghost" className="text-indigo-600 font-bold text-xs gap-2 hover:bg-indigo-50" onClick={handleAdd}>
                            <Plus className="h-4 w-4" />
                            Añadir Regla
                        </Button>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alimento Original</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sustituto Recomendado</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Uso/Notas</th>
                                    <th className="px-6 py-4 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {substitutes.map((item) => (
                                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-2">
                                            <Input
                                                placeholder="Ej: Pollo"
                                                value={item.original}
                                                onChange={(e) => handleChange(item.id, 'original', e.target.value)}
                                                className="h-10 border-transparent bg-transparent hover:border-slate-200 focus:bg-white rounded-xl font-bold text-sm"
                                            />
                                        </td>
                                        <td className="px-6 py-2">
                                            <Input
                                                placeholder="Ej: Pavo o Tofu"
                                                value={item.substitute}
                                                onChange={(e) => handleChange(item.id, 'substitute', e.target.value)}
                                                className="h-10 border-transparent bg-transparent hover:border-slate-200 focus:bg-white rounded-xl font-bold text-sm"
                                            />
                                        </td>
                                        <td className="px-6 py-2">
                                            <Input
                                                placeholder="Misma porción"
                                                value={item.notes}
                                                onChange={(e) => handleChange(item.id, 'notes', e.target.value)}
                                                className="h-10 border-transparent bg-transparent hover:border-slate-200 focus:bg-white rounded-xl text-xs"
                                            />
                                        </td>
                                        <td className="px-6 py-2 text-right">
                                            <button
                                                onClick={() => handleRemove(item.id)}
                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {substitutes.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center space-y-3">
                                            <div className="bg-slate-50 h-12 w-12 rounded-2xl flex items-center justify-center mx-auto">
                                                <Search className="h-6 w-6 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-slate-900">No hay reglas definidas</p>
                                                <p className="text-xs text-slate-500">Define tus sustitutos frecuentes para mejorar la IA.</p>
                                            </div>
                                            <Button onClick={handleAdd} variant="outline" className="mt-4 rounded-xl font-bold">Crear mi primera regla</Button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ModuleLayout>
    );
}
