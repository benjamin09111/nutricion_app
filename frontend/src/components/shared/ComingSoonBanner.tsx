import { Rocket, Star, Utensils, Users, Megaphone } from "lucide-react";

interface ComingSoonBannerProps {
  title?: string;
  description?: string;
  features?: { icon: React.ElementType; label: string }[];
  badge?: string;
}

const DEFAULT_FEATURES = [
  { icon: Utensils, label: "Registro de comidas y valores nutricionales del paciente" },
  { icon: Star, label: "Sistema de puntos y recompensas por cumplir la pauta" },
  { icon: Users, label: "Portal privado integrado con el espacio del nutricionista" },
  { icon: Megaphone, label: "Comunicación directa nutricionista ↔ paciente" },
];

export function ComingSoonBanner({
  title = "Plataforma para Pacientes — Próximamente",
  description = "Estamos construyendo un espacio dedicado para que tus pacientes registren sus comidas, visualicen sus valores nutricionales y acumulen puntos al seguir su pauta alimentaria. Todo integrado directamente con tu plataforma de nutricionista.",
  features = DEFAULT_FEATURES,
  badge = "Funcionalidad Futura",
}: ComingSoonBannerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] px-4 py-12 text-center animate-in fade-in duration-500">
      {/* Glow blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <div className="relative max-w-xl mx-auto space-y-6">
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-indigo-600">
          <Rocket className="h-3 w-3" />
          {badge}
        </span>

        {/* Illustration */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-200">
              <Rocket className="h-9 w-9 text-white" />
            </div>
            {/* Orbiting dots */}
            <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white shadow-sm animate-bounce" />
            <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full bg-violet-400 border-2 border-white shadow-sm animate-bounce [animation-delay:200ms]" />
          </div>
        </div>

        {/* Title & description */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 leading-tight">{title}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-start gap-2.5 rounded-xl bg-white border border-slate-100 shadow-sm px-3.5 py-2.5"
            >
              <div className="mt-0.5 h-6 w-6 shrink-0 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Icon className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <span className="text-xs font-medium text-slate-600 leading-relaxed">{label}</span>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-[11px] text-slate-400 font-medium">
          Esta funcionalidad está en desarrollo y estará disponible en una próxima versión de NutriNet.
        </p>
      </div>
    </div>
  );
}
