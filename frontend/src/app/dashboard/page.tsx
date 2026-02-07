import Link from "next/link";
import { Users, FileText, ArrowRight, Activity } from "lucide-react";

const stats = [
    { name: 'Pacientes Activos', stat: '71', icon: Users, change: '+12%', changeType: 'increase' },
    { name: 'Dietas Generadas', stat: '58.16%', icon: Activity, change: '+2.1%', changeType: 'increase' },
    { name: 'Planes Pendientes', stat: '4', icon: FileText, change: '-3', changeType: 'decrease' },
];

export default function DashboardPage() {
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
                {stats.map((item) => (
                    <div
                        key={item.name}
                        className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6 border border-slate-100"
                    >
                        <dt>
                            <div className="absolute rounded-md bg-emerald-500 p-3">
                                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                            </div>
                            <p className="ml-16 truncate text-sm font-medium text-slate-500">{item.name}</p>
                        </dt>
                        <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
                            <p className="text-2xl font-semibold text-slate-900">{item.stat}</p>
                            <p
                                className={`ml-2 flex items-baseline text-sm font-semibold ${item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                                    }`}
                            >
                                {item.change}
                            </p>
                        </dd>
                    </div>
                ))}
            </dl>

            {/* Recent Activity / Patients Placeholder */}
            <div className="mt-8">
                <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4">Pacientes Recientes</h3>
                <div className="overflow-hidden rounded-md border border-gray-200 bg-white shadow">
                    <ul role="list" className="divide-y divide-gray-200">
                        {[1, 2, 3].map((i) => (
                            <li key={i} className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-x-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                        P{i}
                                    </div>
                                    <div className="flex-auto">
                                        <div className="font-semibold text-slate-900">Paciente Ejemplo {i}</div>
                                        <div className="text-xs text-slate-500">Última consulta: Hace 2 días</div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-400" />
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="bg-slate-50 gap-x-3 px-6 py-4 text-sm font-semibold text-slate-900 border-t border-gray-200 hover:bg-slate-100 cursor-pointer text-center">
                        Ver todos los pacientes
                    </div>
                </div>
            </div>
        </div>
    );
}
