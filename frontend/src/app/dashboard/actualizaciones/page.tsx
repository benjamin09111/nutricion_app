"use client";

import React from "react";
import {
    Sparkles,
    Bot,
    Dumbbell,
    Zap,
    ChevronRight,
    MessageSquare,
    ShieldCheck,
    Globe,
    Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const updates = [
    {
        category: "Agentes & IA",
        icon: Bot,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
        items: [
            {
                title: "Chatbots de Acompañamiento",
                description: "Asistentes virtuales 24/7 para tus pacientes via WhatsApp para resolver dudas rápidas sobre su dieta.",
                status: "En desarrollo",
            },
            {
                title: "Análisis Predictivo de Progreso",
                description: "IA que predice estancamientos y sugiere ajustes automáticos basados en la curva de peso.",
                status: "Próximamente",
            }
        ]
    },
    {
        category: "Zona FITNESS Especializada",
        icon: Dumbbell,
        color: "text-rose-600",
        bg: "bg-rose-50",
        items: [
            {
                title: "Generador de Rutinas Inteligentes",
                description: "Integración total entre el gasto energético del entrenamiento y la ingesta calórica de la dieta.",
                status: "Planificado",
            },
            {
                title: "Biblioteca de Ejercicios en Video",
                description: "Más de 500 ejercicios con técnica correcta para incluir en los entregables.",
                status: "Próximamente",
            }
        ]
    },
    {
        category: "Inteligencia Artificial Pro",
        icon: Zap,
        color: "text-amber-600",
        bg: "bg-amber-50",
        items: [
            {
                title: "Soporte de IA Clínico",
                description: "Consultas rápidas sobre patologías y contraindicaciones alimentarias basadas en papers científicos.",
                status: "Próximamente",
            },
            {
                title: "Escaneo de Comidas por Foto",
                description: "Tus pacientes podrán subir fotos de sus platos y la IA estimará macros automáticamente.",
                status: "Investigación",
            }
        ]
    },
    {
        category: "Ecosistema & Alianzas",
        icon: Globe,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        items: [
            {
                title: "Compra en un Clic",
                description: "Integración con supermercados líderes para convertir la lista de compras en un pedido real.",
                status: "En negociación",
            },
            {
                title: "Store de Suplementos",
                description: "Prescribe suplementos y permite que tus pacientes los compren directamente con descuentos.",
                status: "Planificado",
            }
        ]
    }
];

export default function UpdatesPage() {
    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Hero Section */}
            <div className="bg-white border-b border-slate-200 pt-12 pb-16">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest mb-6">
                        <Rocket className="h-4 w-4" />
                        Hoja de Ruta NutriSaaS
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                        El futuro de la Nutrición <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600">
                            se construye hoy
                        </span>
                    </h1>
                    <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
                        Estamos trabajando constantemente para darte las herramientas más potentes del mercado.
                        Aquí puedes ver lo que viene en camino.
                    </p>
                </div>
            </div>

            {/* Grid of Updates */}
            <div className="max-w-5xl mx-auto px-4 -mt-8">
                <div className="grid md:grid-cols-2 gap-6">
                    {updates.map((group) => (
                        <div key={group.category} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 hover:shadow-xl hover:border-indigo-200 transition-all group">
                            <div className="flex items-center gap-4 mb-8">
                                <div className={cn("p-3 rounded-2xl", group.bg)}>
                                    <group.icon className={cn("h-6 w-6", group.color)} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                    {group.category}
                                </h3>
                            </div>

                            <div className="space-y-6">
                                {group.items.map((item) => (
                                    <div key={item.title} className="relative pl-6 border-l-2 border-slate-100 hover:border-indigo-300 transition-colors">
                                        <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-200 group-hover:bg-indigo-400" />
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-black text-slate-800 text-sm">
                                                {item.title}
                                            </h4>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                                                item.status === "En desarrollo" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                    item.status === "Próximamente" ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                                                        "bg-slate-50 text-slate-500 border-slate-100"
                                            )}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Call to Action */}
                <div className="mt-16 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[3rem] p-12 text-center text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full -ml-32 -mb-32 blur-3xl" />

                    <MessageSquare className="h-12 w-12 mx-auto mb-6 text-indigo-200" />
                    <h2 className="text-3xl font-black mb-4">¿Tienes una idea brillante?</h2>
                    <p className="text-indigo-100 max-w-xl mx-auto mb-8 font-medium">
                        La mayoría de nuestras mejores funciones nacen de las sugerencias de nuestros nutricionistas.
                        ¡Escríbenos y ayúdanos a priorizar el próximo módulo!
                    </p>
                    <Link
                        href="/dashboard/feedback"
                        className="inline-flex items-center gap-2 bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all active:scale-95 shadow-lg"
                    >
                        Enviar sugerencia
                        <ChevronRight className="h-5 w-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
