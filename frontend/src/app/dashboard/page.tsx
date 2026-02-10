'use client';

import Link from "next/link";
import { Users, FileText, ArrowRight, Activity, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Interface for API response
interface DashboardStats {
    stats: Array<{
        name: string;
        stat: string;
        icon: string;
        change: string;
        changeType: 'increase' | 'decrease' | 'neutral';
    }>;
    recentPatients: Array<{
        id: string;
        fullName: string;
        email: string;
        updatedAt: string;
    }>;
}

const iconMap: Record<string, any> = {
    'Users': Users,
    'FileText': FileText,
    'Activity': Activity,
};

export default function DashboardPage() {
    const [data, setData] = useState<DashboardStats>({
        stats: [
            { name: 'Pacientes Activos', stat: '0', icon: 'Users', change: '-', changeType: 'neutral' },
            { name: 'Recetas Creadas', stat: '0', icon: 'FileText', change: '-', changeType: 'neutral' },
            { name: 'Ingredientes Propios', stat: '0', icon: 'Activity', change: '-', changeType: 'neutral' },
        ],
        recentPatients: []
    });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error('Sesión no válida');
                    return;
                }

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                const response = await fetch(`${apiUrl}/dashboard/stats`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                console.log('Dashboard Data:', result);
                setData(result);
            } catch (error) {
                console.error('Fetch Stats Error:', error);
                toast.error('No se pudo cargar la información del panel (Ver consola)');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div>
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Panel Principal
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Resumen de tu actividad clínica y pacientes recientes.
                    </p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <Link
                        href="/dashboard/dieta"
                        className="ml-3 inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                        Nueva Planificación
                    </Link>
                </div>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data?.stats.map((item) => {
                    const Icon = iconMap[item.icon] || Activity;
                    return (
                        <div
                            key={item.name}
                            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6 border border-slate-100"
                        >
                            <dt>
                                <div className="absolute rounded-md bg-emerald-500 p-3">
                                    <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                                </div>
                                <p className="ml-16 truncate text-sm font-medium text-slate-500">{item.name}</p>
                            </dt>
                            <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
                                <p className="text-2xl font-semibold text-slate-900">{item.stat}</p>
                                <p
                                    className={`ml-2 flex items-baseline text-sm font-semibold ${item.changeType === 'increase' ? 'text-green-600' :
                                        item.changeType === 'decrease' ? 'text-red-600' : 'text-slate-500'
                                        }`}
                                >
                                    {item.change}
                                </p>
                            </dd>
                        </div>
                    );
                })}
            </dl>

            <div className="mt-8">
                <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">Pacientes Recientes</h3>
                <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow">
                    <ul role="list" className="divide-y divide-gray-200">
                        {data?.recentPatients.length === 0 ? (
                            <li className="px-6 py-12 text-center text-slate-500">
                                No hay pacientes recientes.
                            </li>
                        ) : (
                            data?.recentPatients.map((patient) => (
                                <li
                                    key={patient.id}
                                    className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/dashboard/pacientes/${patient.id}`)}
                                >
                                    <div className="flex items-center gap-x-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold uppercase">
                                            {patient.fullName.substring(0, 2)}
                                        </div>
                                        <div className="flex-auto">
                                            <div className="font-semibold text-slate-900">{patient.fullName}</div>
                                            <div className="text-xs text-slate-500">
                                                Actualizado: {new Date(patient.updatedAt).toLocaleDateString('es-CL', {
                                                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-400" />
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                    <div className="bg-slate-50 gap-x-3 px-6 py-4 text-sm font-semibold text-slate-900 border-t border-gray-200 hover:bg-slate-100 cursor-pointer text-center">
                        <Link href="/dashboard/pacientes">Ver todos los pacientes</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
