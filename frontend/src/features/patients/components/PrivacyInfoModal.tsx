"use client";

import { Modal } from "@/components/ui/Modal";
import { ShieldCheck, Lock, EyeOff, CheckCircle2 } from "lucide-react";

interface PrivacyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sections = [
  {
    icon: Lock,
    title: "Acceso exclusivo del profesional",
    body: "Toda la información clínica, fichas y pautas son visibles únicamente para ti como nutricionista a cargo. Ningún otro profesional ni personal de NutriNet tiene acceso a tus pacientes.",
  },
  {
    icon: ShieldCheck,
    title: "Aislamiento técnico por diseño",
    body: "Los administradores de la plataforma están bloqueados a nivel de sistema y base de datos para consultar fichas o registros de salud de pacientes.",
  },
  {
    icon: EyeOff,
    title: "Uso 100% clínico y confidencial",
    body: "Los datos se emplean estrictamente para tu atención nutricional. Nunca se comparten con terceros, no se venden ni se usan con fines comerciales o publicitarios.",
  },
  {
    icon: CheckCircle2,
    title: "Ley N° 21.719 — Chile",
    body: "Garantía plena de derechos ARCO (Acceso, Rectificación, Cancelación y Oposición) conforme a la legislación chilena vigente de protección de datos personales.",
  },
];

export function PrivacyInfoModal({ isOpen, onClose }: PrivacyInfoModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Datos y Privacidad Clínica"
      description="Protección técnica y legal de la información de tus pacientes"
      className="max-w-md sm:max-w-lg"
    >
      <div className="space-y-4">
        {/* Lista de pilares minimalistas */}
        <div className="space-y-2">
          {sections.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-colors"
            >
              <div className="h-8 w-8 shrink-0 rounded-lg bg-[#F0F5DF] text-[#668E20] flex items-center justify-center mt-0.5">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-800 tracking-tight">{title}</h4>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed mt-0.5">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Badge normativo Chile */}
        <div className="flex items-center gap-2 rounded-xl bg-[#F0F5DF]/70 border border-[#DDE7B8] px-3.5 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-[#668E20] shrink-0" />
          <p className="text-[11px] text-[#4D6B18] font-medium leading-tight">
            Cumplimiento normativo con la <strong>Ley N° 21.719</strong> de Protección de Datos Personales en Chile.
          </p>
        </div>

        {/* Botón de cierre minimalista */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#668E20] hover:bg-[#55771B] text-white font-semibold text-xs sm:text-sm h-10 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  );
}
