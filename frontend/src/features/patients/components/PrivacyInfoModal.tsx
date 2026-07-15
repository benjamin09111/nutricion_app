"use client";

import { Modal } from "@/components/ui/Modal";
import {
  ShieldCheck,
  Lock,
  Eye,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PrivacyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sections = [
  {
    icon: Lock,
    iconClass: "text-indigo-600 bg-indigo-50",
    title: "Acceso exclusivo del nutricionista",
    body: "Toda la información de tus pacientes — nombre, datos de contacto, historial clínico y planes nutricionales — solo es visible para ti como nutricionista a cargo. Ningún otro profesional, ni siquiera el equipo de NutriNet, puede ver o acceder a estos datos.",
  },
  {
    icon: ShieldCheck,
    iconClass: "text-emerald-600 bg-emerald-50",
    title: "Seguridad y privacidad técnica",
    body: "Los administradores de la plataforma están bloqueados por diseño a nivel de sistema para acceder a los endpoints de pacientes. Esto no es solo una política: es una restricción técnica implementada en el código y verificada en cada solicitud.",
  },
  {
    icon: Eye,
    iconClass: "text-violet-600 bg-violet-50",
    title: "Uso de los datos",
    body: "Los datos de tus pacientes se utilizan exclusivamente para prestarte el servicio como nutricionista: crear planes, hacer seguimiento y gestionar consultas. No se comparten con terceros, no se usan con fines publicitarios ni se ceden a ninguna otra entidad.",
  },
  {
    icon: AlertCircle,
    iconClass: "text-amber-600 bg-amber-50",
    title: "Ley N° 21.719 — Chile",
    body: "NutriNet cumple con la nueva Ley de Protección de Datos Personales de Chile (Ley N° 21.719), publicada en diciembre de 2024 y con entrada en vigor plena en 2026. Esta ley otorga a los titulares de datos derechos de acceso, rectificación, cancelación y oposición (derechos ARCO), y exige que el tratamiento de datos sea proporcional, informado y con finalidad específica.",
  },
];

export function PrivacyInfoModal({ isOpen, onClose }: PrivacyInfoModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Protección y Privacidad"
      className="max-w-xl"
    >
      {/* Header visual */}
      <div className="flex flex-col items-center text-center gap-3 mb-6 pb-6 border-b border-slate-100">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Tus pacientes, solo tuyos
          </h3>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            La información de tus pacientes está protegida por diseño técnico y
            por la ley chilena de protección de datos.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map(({ icon: Icon, iconClass, title, body }) => (
          <div key={title} className="flex gap-3">
            <div
              className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${iconClass}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{title}</p>
              <p className="text-sm text-slate-500 leading-relaxed mt-0.5">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance badge */}
      <div className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <p className="text-xs text-emerald-700 font-medium">
          NutriNet cumple con la Ley N° 21.719 de Protección de Datos Personales
          de Chile.
        </p>
      </div>

      {/* Action */}
      <div className="mt-5">
        <Button
          onClick={onClose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-10 rounded-xl transition-all"
        >
          Entendido
        </Button>
      </div>
    </Modal>
  );
}
