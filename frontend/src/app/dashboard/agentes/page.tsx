'use client';

import {
    Bot,
    Brain,
    MessageCircle,
    TrendingUp,
    Sparkles,
    Rocket,
    Users,
    Zap,
    Lock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function AgentsPage() {
    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-10">

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Bot className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Agentes Inteligentes (IA)</h1>
                    </div>
                    <p className="text-slate-500 text-lg max-w-2xl pl-12">
                        El futuro de la nutrición clínica. Un equipo de expertos digitales trabajando 24/7 para ti y tus pacientes.
                    </p>
                </div>
                <Badge variant="outline" className="w-fit px-4 py-1.5 text-sm font-medium border-emerald-200 text-emerald-700 bg-emerald-50">
                    <Sparkles className="w-3.5 h-3.5 mr-2 inline-block" /> Próximamente
                </Badge>
            </div>

            {/* Main Value Proposition */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Agent 1: Clinical Copilot */}
                <Card className="relative overflow-hidden border-slate-200 hover:border-emerald-200 transition-all duration-300 shadow-sm hover:shadow-md group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Brain className="w-24 h-24 text-emerald-600" />
                    </div>
                    <CardHeader>
                        <Badge className="w-fit mb-2 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Para el Nutricionista</Badge>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Zap className="h-5 w-5 text-blue-500" />
                            Copiloto Clínico
                        </CardTitle>
                        <CardDescription className="text-base">
                            Tu asistente experto mientras planificas dietas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            ¿Necesitas reemplazar un alimento caro por uno económico pero con la misma proteína? Solo pregúntale. El Copiloto conoce tu base de datos de alimentos y precios al revés y al derecho.
                        </p>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 italic text-sm text-slate-500">
                            "Dame 3 alternativas al salmón, menores a $5.000 CLP, altas en Omega-3 disponibles en Jumbo."
                        </div>
                    </CardContent>
                </Card>

                {/* Agent 2: Patient Guardian */}
                <Card className="relative overflow-hidden border-slate-200 hover:border-emerald-200 transition-all duration-300 shadow-sm hover:shadow-md group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <MessageCircle className="w-24 h-24 text-emerald-600" />
                    </div>
                    <CardHeader>
                        <Badge className="w-fit mb-2 bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">Para el Paciente</Badge>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Users className="h-5 w-5 text-purple-500" />
                            Guardián del Paciente
                        </CardTitle>
                        <CardDescription className="text-base">
                            Soporte 24/7 vía WhatsApp o App.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Tus pacientes nunca más se sentirán solos. Este agente responde dudas cotidianas basándose EXCLUSIVAMENTE en el plan que tú diseñaste.
                        </p>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 italic text-sm text-slate-500">
                            "Estoy en un cumpleaños, ¿qué puedo comer del picoteo sin salirme de mis macros?"
                        </div>
                    </CardContent>
                </Card>

                {/* Agent 3: Market Analyst */}
                <Card className="relative overflow-hidden border-slate-200 hover:border-emerald-200 transition-all duration-300 shadow-sm hover:shadow-md group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-24 h-24 text-emerald-600" />
                    </div>
                    <CardHeader>
                        <Badge className="w-fit mb-2 bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">Inteligencia de Mercado</Badge>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <TrendingUp className="h-5 w-5 text-amber-500" />
                            Analista de Precios
                        </CardTitle>
                        <CardDescription className="text-base">
                            Monitoreo invisible de costos y stock.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Un agente silencioso que revisa semanalmente los precios de supermercados. Te avisa proactivamente si los costos de tus dietas suben demasiado para proteger el bolsillo de tus pacientes.
                        </p>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 italic text-sm text-slate-500">
                            "Alerta: El precio del pollo subió un 15% esta semana. Sugiero cambiar a pavo."
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Vision & Scalability Section */}
            <div className="mt-12 bg-gradient-to-r from-emerald-900 to-slate-900 rounded-2xl p-8 md:p-12 text-white overflow-hidden relative">
                {/* Abstract background shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                        <div className="space-y-4 max-w-2xl">
                            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                                <Rocket className="h-8 w-8 text-emerald-400" />
                                Escala tu consulta al siguiente nivel
                            </h2>
                            <p className="text-slate-300 text-lg leading-relaxed">
                                La IA no viene a reemplazarte, viene a potenciarte. Con estos agentes, podrás pasar de atender 50 pacientes a 200, manteniendo la misma calidad humana y cercanía, pero eliminando el trabajo repetitivo.
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                                <li className="flex items-center gap-2 text-emerald-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    Respuestas inmediatas 24/7
                                </li>
                                <li className="flex items-center gap-2 text-emerald-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    Personalización masiva
                                </li>
                                <li className="flex items-center gap-2 text-emerald-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    Optimización de costos automática
                                </li>
                                <li className="flex items-center gap-2 text-emerald-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    Democratización de la salud
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-4 min-w-[200px] w-full md:w-auto p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                            <div className="text-center">
                                <span className="text-3xl font-bold text-white">Pronto</span>
                                <p className="text-sm text-slate-300">Disponible en versión Beta</p>
                            </div>
                            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold" disabled>
                                <Lock className="w-4 h-4 mr-2" />
                                Unirse a la Espera
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
