import ConsultationsClient from './ConsultationsClient';

export default function ConsultationsPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div>
                    <p className="text-emerald-600 font-black uppercase text-[10px] tracking-[0.3em] mb-2 drop-shadow-sm">
                        Clinical Intelligence
                    </p>
                    <h2 className="text-5xl font-black tracking-tighter text-slate-900 md:text-6xl italic">
                        Mis Consultas
                    </h2>
                    <p className="mt-4 text-slate-400 font-bold max-w-md uppercase text-[10px] tracking-widest leading-relaxed">
                        Sistema centralizado de seguimiento y evolución clínica de pacientes.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Live Sync</span>
                    </div>
                </div>
            </div>

            <ConsultationsClient />
        </div>
    );
}
