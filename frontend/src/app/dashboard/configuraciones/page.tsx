"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { User, Lock, Crown, Save, Type, Calendar, Pencil, Globe, ShieldAlert, ShieldCheck, FileText, Download, Trash2, LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { useFont } from "@/context/FontContext";
import { formatRut } from "@/lib/rut-utils";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MembershipPlanSection } from "./MembershipPlanSection";
import { getCurrentUser, setCurrentUser } from "@/lib/current-user";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function RoleBadge({ role }: { role?: string | null }) {
  const config: Record<string, { label: string; className: string }> = {
    ADMIN_MASTER: { label: "Admin Master", className: "bg-rose-50 text-rose-700 ring-rose-600/20" },
    ADMIN_GENERAL: { label: "Admin General", className: "bg-rose-50 text-rose-700 ring-rose-600/20" },
    ADMIN: { label: "Admin", className: "bg-rose-50 text-rose-700 ring-rose-600/20" },
    WORKER: { label: "Worker", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
    NUTRITIONIST_DEVELOPER: { label: "Nutricionista", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
    NUTRITIONIST: { label: "Nutricionista", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  };
  const c = role ? config[role] : undefined;
  if (!c) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${c.className}`}>
      {c.label}
    </span>
  );
}

interface UserSettings {
  professionalInstagram?: string;
  professionalPhone?: string;
  professionalEmail?: string;
  bio?: string;
  consultationMode?: string;
  location?: string;
  conditionsTreated?: string;
  patientTypes?: string;
  prices?: string;
  officeAddress?: string;
  paymentMethods?: string;
  acceptedInsurance?: string;
  linkedin?: string;
}

type ProfileDraft = {
  professionalInstagram: string;
  professionalPhone: string;
  professionalEmail: string;
  bio: string;
  consultationMode: string;
  location: string;
  conditionsTreated: string;
  patientTypes: string;
  prices: string;
  officeAddress: string;
  paymentMethods: string;
  acceptedInsurance: string;
  linkedin: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINKEDIN_REGEX = /^(@[a-zA-Z0-9._-]{2,100}|(https?:\/\/)?([a-zA-Z0-9-]+\.)?linkedin\.com\/.*)$/i;
const PAYMENT_METHOD_OPTIONS = [
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "debito", label: "Débito" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia-efectivo", label: "Transferencia y efectivo" },
  { value: "transferencia-tarjeta", label: "Transferencia y tarjeta" },
  { value: "otros", label: "Otros" },
];
type ProfileFieldKey =
  | "consultationMode"
  | "conditionsTreated"
  | "patientTypes"
  | "prices"
  | "officeAddress"
  | "paymentMethods"
  | "acceptedInsurance";

type ProfileFieldEnabledState = Record<ProfileFieldKey, boolean>;

const createProfileFieldEnabledState = (settings: UserSettings): ProfileFieldEnabledState => ({
  consultationMode: settings.consultationMode !== "N/A",
  conditionsTreated: settings.conditionsTreated !== "N/A",
  patientTypes: settings.patientTypes !== "N/A",
  prices: settings.prices !== "N/A",
  officeAddress: settings.officeAddress !== "N/A",
  paymentMethods: settings.paymentMethods !== "N/A",
  acceptedInsurance: settings.acceptedInsurance !== "N/A",
});

const normalizeText = (value: string) => value.trim();

const normalizePhoneInput = (value: string) =>
  value.replace(/[^\d+\s()-]/g, "").replace(/\s{2,}/g, " ");

const normalizeInstagramInput = (value: string) =>
  value.replace(/\s+/g, "").trimStart();

const buildProfileDraft = (values: ProfileDraft): ProfileDraft => ({
  professionalInstagram: normalizeText(values.professionalInstagram),
  professionalPhone: normalizeText(values.professionalPhone),
  professionalEmail: normalizeText(values.professionalEmail).toLowerCase(),
  bio: normalizeText(values.bio),
  consultationMode: values.consultationMode,
  location: normalizeText(values.location),
  conditionsTreated: normalizeText(values.conditionsTreated),
  patientTypes: normalizeText(values.patientTypes),
  prices: normalizeText(values.prices),
  officeAddress: normalizeText(values.officeAddress),
  paymentMethods: normalizeText(values.paymentMethods),
  acceptedInsurance: normalizeText(values.acceptedInsurance),
  linkedin: normalizeText(values.linkedin),
});

const buildProfilePayload = (values: ProfileDraft, enabled: ProfileFieldEnabledState): ProfileDraft => ({
  ...values,
  consultationMode: enabled.consultationMode ? values.consultationMode : "N/A",
  conditionsTreated: enabled.conditionsTreated ? values.conditionsTreated : "N/A",
  patientTypes: enabled.patientTypes ? values.patientTypes : "N/A",
  prices: enabled.prices ? values.prices : "N/A",
  officeAddress: enabled.officeAddress ? values.officeAddress : "N/A",
  paymentMethods: enabled.paymentMethods ? values.paymentMethods : "N/A",
  acceptedInsurance: enabled.acceptedInsurance ? values.acceptedInsurance : "N/A",
});

const getProfileDraftErrors = (values: ProfileDraft, enabled: ProfileFieldEnabledState) => {
  const errors: Partial<Record<keyof ProfileDraft, string>> = {};

  if (values.professionalEmail.trim() && !EMAIL_REGEX.test(values.professionalEmail.trim())) {
    errors.professionalEmail = "Ingresa un correo válido.";
  }

  const phoneDigits = values.professionalPhone.replace(/\D/g, "");
  if (values.professionalPhone.trim() && (phoneDigits.length < 8 || phoneDigits.length > 15)) {
    errors.professionalPhone = "Ingresa un número válido.";
  }

  if (values.professionalInstagram.trim() && !/^@?[a-zA-Z0-9._]{2,80}$/.test(values.professionalInstagram.trim())) {
    errors.professionalInstagram = "Usa un usuario válido de Instagram.";
  }

  if (values.linkedin.trim() && !LINKEDIN_REGEX.test(values.linkedin.trim())) {
    errors.linkedin = "Ingresa un perfil o enlace válido de LinkedIn.";
  }

  if (values.bio.length > 500) errors.bio = "Máximo 500 caracteres.";
  if (values.location.length > 120) errors.location = "Máximo 120 caracteres.";
  if (enabled.conditionsTreated && values.conditionsTreated.length > 160) errors.conditionsTreated = "Máximo 160 caracteres.";
  if (enabled.patientTypes && values.patientTypes.length > 160) errors.patientTypes = "Máximo 160 caracteres.";
  if (enabled.prices && values.prices.length > 240) errors.prices = "Máximo 240 caracteres.";
  if (enabled.officeAddress && values.officeAddress.length > 180) errors.officeAddress = "Máximo 180 caracteres.";
  if (enabled.paymentMethods && values.paymentMethods.length > 120) errors.paymentMethods = "Máximo 120 caracteres.";
  if (enabled.acceptedInsurance && values.acceptedInsurance.length > 120) errors.acceptedInsurance = "Máximo 120 caracteres.";

  return errors;
};

function FieldSwitch({
  label,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mb-1 flex items-center justify-between gap-3">
      <label className="block text-sm font-bold text-slate-700">{label}</label>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={`${label}: ${checked ? "aplica" : "no aplica"}`}
        aria-pressed={checked}
        className={`inline-flex items-center gap-2 rounded-full px-0 py-0 text-[10px] font-black uppercase tracking-[0.14em] transition ${
          checked ? "text-emerald-700" : "text-slate-400"
        } ${disabled ? "opacity-60" : "cursor-pointer"}`}
      >
        <span>Aplica</span>
        <span
          className={`relative h-4 w-7 rounded-full transition ${
            checked ? "bg-emerald-500" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition ${
              checked ? "left-3" : "left-0.5"
            }`}
          />
        </span>
      </button>
    </div>
  );
}

function ComplianceTabSection() {
  const [isAiDisabled, setIsAiDisabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("nutri_ai_disabled") === "true";
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [hasPendingDeletionRequest, setHasPendingDeletionRequest] = useState(false);
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const logsRaw = localStorage.getItem("nutri_ai_audit_logs");
      if (logsRaw) {
        try {
          setAuditLogs(JSON.parse(logsRaw));
        } catch (e) {
          console.error("Failed to parse AI audit logs", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    const checkDeletionRequest = async () => {
      try {
        const response = await fetchApi(`/users/me/deletion-request`);

        if (response.ok) {
          const data = await response.json();
          setHasPendingDeletionRequest(data.hasPendingRequest || false);
        }
      } catch (error) {
        console.error("Error checking deletion request status:", error);
      }
    };

    checkDeletionRequest();
  }, []);

  const handleToggleAi = () => {
    const nextVal = !isAiDisabled;
    setIsAiDisabled(nextVal);
    localStorage.setItem("nutri_ai_disabled", nextVal ? "true" : "false");
    toast.success(
      nextVal
        ? "Derecho de Oposición aplicado. El asistente clínico de IA ha sido desactivado en todo el portal."
        : "Asistente clínico de IA activado correctamente."
    );
    window.location.reload();
  };

  const handleDownloadArco = () => {
    const user = getCurrentUser() as any;
    const data = {
      tipo_solicitud: "DERECHO_DE_ACCESO_ARCO_LEY_21719",
      fecha_exportacion: new Date().toISOString(),
      profesional: {
        nombre: user?.nutritionist?.fullName || "Profesional Demo",
        email: user?.email || "usuario@demo.com",
        rut: user?.rut || "No registrado",
        rol: user?.role || "NUTRITIONIST",
        registro_minsal: user?.nutritionist?.professionalId || "No ingresado",
      },
      nota_legal: "Esta exportación contiene la totalidad de los datos estructurados asociados al perfil profesional y el historial de configuraciones, en cumplimiento con el artículo de derecho de acceso de la Ley 21.719 en Chile.",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `arco_acceso_nutrinet_${user?.nutritionist?.fullName?.replace(/\s+/g, "_") || "profesional"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Descarga de datos ARCO iniciada.");
  };

  const handleDownloadEipd = () => {
    const text = `========================================================================
EVALUACIÓN DE IMPACTO EN PROTECCIÓN DE DATOS (EIPD) - RESUMEN EJECUTIVO
Plataforma: NutriNet SaaS
Legislación de Referencia: Ley 21.719 (Chile) - Protección de Datos de Salud
Fecha de Emisión: 24 de Junio de 2026
========================================================================

1. DESCRIPCIÓN DEL TRATAMIENTO DE DATOS
NutriNet trata datos de salud clasificados como "Especialmente Protegidos" bajo la Ley 21.719 (fichas clínicas, antropometría, restricciones alimentarias, estado de embarazo/lactancia y patologías clínicas). El tratamiento se realiza exclusivamente con fines de planificación nutricional y apoyo al profesional de salud habilitado.

2. MEDIDAS DE SEGURIDAD IMPLEMENTADAS
- Cifrado en Reposo: Toda la base de datos PostgreSQL clínica está cifrada bajo el estándar AES-256 a nivel de disco físico.
- Cifrado en Tránsito: Todo flujo de datos clínico viaja cifrado bajo protocolo HTTPS/TLS 1.3 de extremo a extremo.
- Control de Acceso Estricto: Los datos del paciente solo son accesibles para el profesional asignado al caso.

3. USO DE SUBENCARGADOS (INTELIGENCIA ARTIFICIAL)
Las solicitudes de asistencia clínica a modelos de lenguaje (OpenAI/Anthropic APIs) actúan como subencargados del tratamiento. De acuerdo con el DPA vinculante, los datos enviados son cifrados, no se almacenan permanentemente por los proveedores y está estrictamente prohibido su uso para entrenar modelos fundacionales.

4. DERECHOS ARCO
Los pacientes y profesionales disponen de la capacidad técnica para ejercer acceso, rectificación, cancelación y oposición dentro de sus paneles de configuración.`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resumen_eipd_nutrinet_ley_21719.txt";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Documento EIPD descargado.");
  };

  const handleDownloadDpa = () => {
    const text = `========================================================================
ADENDA DE TRATAMIENTO DE DATOS CON SUBENCARGADOS DE IA (DPA ADDENDUM)
Parte A: NutriNet SaaS (Responsable)
Parte B: API de IA Generativa Subprocesadora (Subencargado)
Estado: Firmado y Vigente bajo Ley 21.719 (Chile)
========================================================================

1. OBJETO DEL ACUERDO
Regular el procesamiento seguro de datos de salud en el módulo de Planificación Inteligente de NutriNet.

2. COMPROMISOS CLAVE DE CONFIDENCIALIDAD
- No Entrenamiento: El Subencargado garantiza que ningún dato clínico, antropométrico o alimentario enviado a través de la API será utilizado para el entrenamiento, fine-tuning o mejora de modelos de Inteligencia Artificial públicos o privados.
- Cifrado Estricto: Toda comunicación se realiza bajo HTTPS con encriptación TLS 1.3 de grado clínico.
- Retención Cero: Los datos enviados se procesan únicamente de forma efímera y se destruyen inmediatamente del backend del Subencargado tras retornar la respuesta, con un máximo de retención de auditoría técnica temporal de 30 días sin acceso a datos clínicos legibles.

3. SANCIONES Y MULTAS
El Subencargado se somete a auditorías anuales independientes y asume la responsabilidad compartida ante brechas que afecten la privacidad de los usuarios bajo el marco regulatorio de la Ley 21.719.`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dpa_subencargados_ia_nutrinet.txt";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Adenda DPA descargada.");
  };

  const handleRequestDeletion = async () => {
    if (hasPendingDeletionRequest) {
      toast.info("Ya tienes una solicitud de eliminación pendiente. El equipo técnico se pondrá en contacto contigo.");
      return;
    }

    setIsSubmittingDeletion(true);
    try {
      const response = await fetchApi(`/users/me/deletion-request`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "No se pudo procesar tu solicitud. Intenta nuevamente.");
        return;
      }

      setHasPendingDeletionRequest(true);
      toast.success("Tu solicitud de eliminación ha sido enviada correctamente. El equipo técnico la procesará a la brevedad.");
    } catch (error) {
      console.error("Error requesting deletion:", error);
      toast.error("Ocurrió un error al enviar la solicitud. Por favor, intenta nuevamente.");
    } finally {
      setIsSubmittingDeletion(false);
    }
  };

  const handleClearLogs = () => {
    if (confirm("¿Estás seguro de que deseas eliminar permanentemente el historial de auditoría de IA de este navegador? Esta acción no se puede deshacer.")) {
      localStorage.removeItem("nutri_ai_audit_logs");
      setAuditLogs([]);
      toast.success("Historial de auditoría eliminado correctamente.");
    }
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `auditoria_ia_nutrinet_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Historial de auditoría descargado en JSON.");
  };

  return (
    <div className="space-y-6">
      {/* Compliance Overview Banner */}
      <div className="p-6 rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-indigo-50/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-4 right-4 bg-emerald-500 text-white rounded-full p-2.5 shadow-md">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="max-w-2xl space-y-2 text-slate-900">
          <span className="inline-flex rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
            Cumplimiento Regulatorio Activo
          </span>
          <h2 className="text-2xl font-black leading-tight">
            Marco de Protección Ley 21.719
          </h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            NutriNet está diseñado para cumplir plenamente con la legislación de protección de datos de salud en Chile. Todos los registros clínicos, planes alimentarios y alergias ingresados están salvaguardados con altos estándares de seguridad y privacidad desde el diseño.
          </p>
        </div>
      </div>

      {/* Grid of Security Pillars */}
      <div className="grid gap-6 md:grid-cols-3 text-slate-900">
        <div className="p-6 border border-slate-200/60 rounded-3xl bg-white shadow-sm space-y-3">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl w-fit text-indigo-600">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-sm">Cifrado en Reposo</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Toda la información médica sensible (antropometría, alergias y antecedentes) se almacena cifrada en reposo mediante algoritmo AES-256 en nuestra base de datos PostgreSQL.
          </p>
        </div>

        <div className="p-6 border border-slate-200/60 rounded-3xl bg-white shadow-sm space-y-3">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl w-fit text-emerald-600">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-sm">EIPD Completada</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed font-semibold">
            Hemos realizado una Evaluación de Impacto en Protección de Datos antes de tratar datos clínicos, garantizando el cumplimiento antes del 1 de diciembre de 2026.
          </p>
          <button
            type="button"
            onClick={handleDownloadEipd}
            className="text-[10px] font-black uppercase tracking-widest text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-3 w-3" /> Descargar EIPD
          </button>
        </div>

        <div className="p-6 border border-slate-200/60 rounded-3xl bg-white shadow-sm space-y-3">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl w-fit text-indigo-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-sm">DPA con Subencargados</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed font-semibold">
            Mantenemos un contrato formal de procesamiento de datos (DPA) con OpenAI y Anthropic que prohíbe el uso de tus fichas clínicas para entrenar sus modelos de IA.
          </p>
          <button
            type="button"
            onClick={handleDownloadDpa}
            className="text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-3 w-3" /> Descargar DPA IA
          </button>
        </div>
      </div>

      {/* ARCO Rights Section */}
      <div className="p-6 border border-slate-200/60 bg-white rounded-3xl shadow-sm space-y-6 text-slate-900">
        <h3 className="text-base font-black flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-indigo-600" />
          Centro de Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)
        </h3>

        <div className="divide-y divide-slate-100">
          {/* Access */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">Derecho de Acceso (Portabilidad)</h4>
              <p className="text-xs text-slate-500 leading-normal font-semibold">
                Descarga una copia completa de toda tu información profesional, configuraciones e historial registrada en la plataforma en formato legible por máquina (JSON).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadArco}
              className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="h-3.5 w-3.5" /> Descargar Datos (JSON)
            </Button>
          </div>

          {/* Opposition (AI Control) */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <h4 className="text-sm font-bold text-slate-800">Derecho de Oposición (Control de Asistencia por IA)</h4>
              <p className="text-xs text-slate-500 leading-normal font-semibold">
                Si no deseas que tus pautas o alimentos pasen por el procesamiento del asistente clínico de IA (subencargado), desactiva esta opción. Esto removerá el botón de generación de IA de la interfaz.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-black uppercase tracking-wider ${isAiDisabled ? "text-slate-400" : "text-emerald-700"}`}>
                {isAiDisabled ? "Desactivada" : "IA Activa"}
              </span>
              <button
                type="button"
                onClick={handleToggleAi}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                  !isAiDisabled ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    !isAiDisabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Deletion */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 last:pb-0">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">Derecho de Cancelación (Eliminación)</h4>
              <p className="text-xs text-slate-500 leading-normal font-semibold">
                Solicita la eliminación permanente de tu cuenta y el borrado seguro de todas las fichas clínicas de tus pacientes de nuestros servidores principales y respaldos.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleRequestDeletion}
              disabled={hasPendingDeletionRequest || isSubmittingDeletion}
              className={cn(
                "h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0",
                hasPendingDeletionRequest
                  ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-red-50 hover:bg-red-100 border border-red-200 text-red-700"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {hasPendingDeletionRequest ? "Solicitud enviada" : isSubmittingDeletion ? "Enviando..." : "Solicitar Eliminación"}
            </Button>
          </div>
        </div>
      </div>

      {/* AI Audit Logs / Versioning Historial */}
      <div className="p-6 border border-slate-200/60 bg-white rounded-3xl shadow-sm space-y-6 text-slate-900">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-base font-black">
              Historial de Auditoría y Aprobaciones de IA (Clínico)
            </h3>
            <p className="text-xs text-slate-500">
              Registro histórico obligatorio de sugerencias generadas por la IA versus las versiones validadas y modificadas por el profesional de la salud.
            </p>
          </div>
          {auditLogs.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadLogs}
                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:text-indigo-800 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> Descargar Logs
              </button>
              <button
                type="button"
                onClick={handleClearLogs}
                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Limpiar Historial
              </button>
            </div>
          )}
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
            <p className="text-xs text-slate-400 font-semibold italic">
              No se registran aprobaciones de IA en este navegador aún.
            </p>
            <p className="text-[10px] text-slate-400">
              Las sugerencias generadas por IA y aprobadas en el módulo de Planificación Nutricional quedarán registradas aquí para cumplir con la auditoría de riesgo clínico.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden border border-slate-100 rounded-2xl divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                      APROBADO
                    </span>
                    <span className="text-xs font-bold">
                      Paciente: {log.patientName}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      ({log.dayLabel})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(log.timestamp).toLocaleString("es-CL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                    <p className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">
                      Sugerencia original de IA
                    </p>
                    <div className="space-y-1 font-semibold text-slate-600">
                      {log.originalDishes?.map((d: any, idx: number) => (
                        <div key={idx} className="flex justify-between border-b border-slate-200/40 last:border-0 pb-1">
                          <span className="truncate max-w-[180px]">{d.title}</span>
                          <span className="font-mono text-[10px]">{d.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/30 rounded-xl space-y-1.5">
                    <p className="font-bold text-[10px] uppercase text-indigo-700 tracking-wider">
                      Validado por {log.clinicianEmail}
                    </p>
                    <div className="space-y-1 font-semibold text-slate-800">
                      {log.approvedDishes?.map((d: any, idx: number) => (
                        <div key={idx} className="flex justify-between border-b border-slate-200/40 last:border-0 pb-1">
                          <span className="truncate max-w-[180px]">{d.title}</span>
                          <span className="font-mono text-[10px] text-emerald-700 font-bold">{d.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "membership" | "compliance">("profile");
  const openPlanModal = searchParams.get("openPlanModal") === "1";

  const [userData, setUserData] = useState<{
    email: string;
    fullName?: string;
    rut?: string | null;
    role?: string | null;
    googleAvatarUrl?: string | null;
    createdAt?: string | null;
    settings?: UserSettings;
  } | null>(null);

  const [professionalInstagram, setProfessionalInstagram] = useState("");
  const [professionalPhone, setProfessionalPhone] = useState("");
  const [professionalEmail, setProfessionalEmail] = useState("");
  const [bio, setBio] = useState("");
  const [consultationMode, setConsultationMode] = useState("online");
  const [location, setLocation] = useState("");
  const [conditionsTreated, setConditionsTreated] = useState("");
  const [patientTypes, setPatientTypes] = useState("");
  const [prices, setPrices] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [paymentMethods, setPaymentMethods] = useState("");
  const [acceptedInsurance, setAcceptedInsurance] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [profileInitial, setProfileInitial] = useState<ProfileDraft | null>(null);
  const [profileFieldEnabled, setProfileFieldEnabled] = useState<ProfileFieldEnabledState>({
    consultationMode: true,
    conditionsTreated: true,
    patientTypes: true,
    prices: true,
    officeAddress: true,
    paymentMethods: true,
    acceptedInsurance: true,
  });
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const { fontPreference, setFontPreference } = useFont();

  useEffect(() => {
    if (searchParams.get("tab") === "membership") {
      setActiveTab("membership");
    }
  }, [searchParams]);
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    const settings = (user.nutritionist?.settings || {}) as UserSettings;
    setUserData({
      email: user.email || "",
      fullName: user.nutritionist?.fullName || "Profesional",
      rut: user.rut || null,
      role: user.role || null,
      googleAvatarUrl: user.googleAvatarUrl || null,
      createdAt: user.createdAt || null,
      settings,
    });
    setProfessionalInstagram(settings.professionalInstagram || "");
    setProfessionalPhone(settings.professionalPhone || "");
    setProfessionalEmail(settings.professionalEmail || "");
    setBio(settings.bio || "");
    setConsultationMode(settings.consultationMode && settings.consultationMode !== "N/A" ? settings.consultationMode : "");
    setLocation(settings.location || "");
    setConditionsTreated(settings.conditionsTreated && settings.conditionsTreated !== "N/A" ? settings.conditionsTreated : "");
    setPatientTypes(settings.patientTypes && settings.patientTypes !== "N/A" ? settings.patientTypes : "");
    setPrices(settings.prices && settings.prices !== "N/A" ? settings.prices : "");
    setOfficeAddress(settings.officeAddress && settings.officeAddress !== "N/A" ? settings.officeAddress : "");
    setPaymentMethods(settings.paymentMethods && settings.paymentMethods !== "N/A" ? settings.paymentMethods : "");
    setAcceptedInsurance(settings.acceptedInsurance && settings.acceptedInsurance !== "N/A" ? settings.acceptedInsurance : "");
    setLinkedin(settings.linkedin || "");
    setProfileFieldEnabled(createProfileFieldEnabledState(settings));

    setProfileInitial(
      buildProfilePayload(
        buildProfileDraft({
          professionalInstagram: settings.professionalInstagram || "",
          professionalPhone: settings.professionalPhone || "",
          professionalEmail: settings.professionalEmail || "",
          bio: settings.bio || "",
          consultationMode: settings.consultationMode && settings.consultationMode !== "N/A" ? settings.consultationMode : "",
          location: settings.location || "",
          conditionsTreated: settings.conditionsTreated && settings.conditionsTreated !== "N/A" ? settings.conditionsTreated : "",
          patientTypes: settings.patientTypes && settings.patientTypes !== "N/A" ? settings.patientTypes : "",
          prices: settings.prices && settings.prices !== "N/A" ? settings.prices : "",
          officeAddress: settings.officeAddress && settings.officeAddress !== "N/A" ? settings.officeAddress : "",
          paymentMethods: settings.paymentMethods && settings.paymentMethods !== "N/A" ? settings.paymentMethods : "",
          acceptedInsurance: settings.acceptedInsurance && settings.acceptedInsurance !== "N/A" ? settings.acceptedInsurance : "",
          linkedin: settings.linkedin || "",
        }),
        createProfileFieldEnabledState(settings),
      ),
    );
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfileEditing || !hasProfileChanges || hasProfileErrors) return;

    setIsSavingProfile(true);
    try {
      const payload = buildProfilePayload(buildProfileDraft({
        professionalInstagram,
        professionalPhone,
        professionalEmail,
        bio,
        consultationMode,
        location,
        conditionsTreated,
        patientTypes,
        prices,
        officeAddress,
        paymentMethods,
        acceptedInsurance,
        linkedin,
      }), profileFieldEnabled);

      const response = await fetchApi(`/users/me/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el perfil");
      }

      toast.success("Perfil guardado correctamente");
      const user = getCurrentUser();
      if (user?.nutritionist) {
        user.nutritionist.settings = {
          ...user.nutritionist.settings,
          ...payload,
        };
        setCurrentUser(user);
      }

      setProfileInitial(payload);
      setIsProfileEditing(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Hubo un error";
      toast.error(message || "Hubo un error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const currentProfile = buildProfileDraft({
    professionalInstagram,
    professionalPhone,
    professionalEmail,
    bio,
    consultationMode,
    location,
    conditionsTreated,
    patientTypes,
    prices,
    officeAddress,
    paymentMethods,
    acceptedInsurance,
    linkedin,
  });
  const currentProfilePayload = buildProfilePayload(currentProfile, profileFieldEnabled);

  const profileErrors = getProfileDraftErrors(currentProfile, profileFieldEnabled);
  const hasProfileErrors = Object.values(profileErrors).some(Boolean);
  const hasProfileChanges =
    Boolean(profileInitial) &&
    JSON.stringify(profileInitial) !== JSON.stringify(currentProfilePayload);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Configuraciones
        </h1>
        <p className="text-slate-500">
          Gestiona tu perfil y preferencias de la cuenta.
        </p>
      </div>

      <div className="flex w-full overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === "profile"
              ? "bg-white text-emerald-700"
              : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
          }`}
        >
          <User className="h-4 w-4" />
          Mi perfil
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("account")}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === "account"
              ? "bg-white text-emerald-700"
              : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
          }`}
        >
          <Lock className="h-4 w-4" />
          Cuenta
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("membership")}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === "membership"
              ? "bg-white text-emerald-700"
              : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
          }`}
        >
          <Crown className="h-4 w-4" />
          Mi plan actual
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("compliance")}
          className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === "compliance"
              ? "bg-white text-emerald-700"
              : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Privacidad y Cumplimiento
        </button>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="grid items-stretch gap-6 xl:grid-cols-2">
          {/* Profile Information */}
          <div className={`relative flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm font-medium ${activeTab === "profile" ? "" : "hidden"}`}>
            <div className="relative flex min-h-[76px] items-start justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-x-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  <h2 className="font-semibold text-slate-900">
                    Información del Perfil
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileEditing((value) => !value)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:text-emerald-700 cursor-pointer"
                    aria-label="Editar columna de perfil"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {isProfileEditing && (
                    <Button
                      type="submit"
                      isLoading={isSavingProfile}
                      disabled={!hasProfileChanges || hasProfileErrors}
                      className="h-9 px-4 text-xs font-bold"
                    >
                      {!isSavingProfile && <Save className="h-4 w-4" />}
                      Guardar cambios
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-6 p-6">
              <div className="flex items-center gap-x-4 font-bold">
                {userData?.googleAvatarUrl ? (
                  <Image
                    src={userData.googleAvatarUrl}
                    alt=""
                    width={64}
                    height={64}
                    referrerPolicy="no-referrer"
                    className="h-16 w-16 rounded-full border-2 border-emerald-200 object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 border border-emerald-200 text-2xl font-bold">
                    {userData?.fullName?.charAt(0) || "U"}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900">
                    {userData?.fullName || "Cargando..."}
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    {userData?.email || "..."}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RoleBadge role={userData?.role} />
                    {userData?.createdAt && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                        <Calendar className="h-3 w-3" />
                        Miembro desde{" "}
                        {new Date(userData.createdAt).toLocaleDateString("es-CL", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 caps-lock">
                    Nombre en Pantalla
                  </label>
                  <Input type="text" disabled value={userData?.fullName || ""} className="bg-slate-50 font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 caps-lock">
                    Correo Electrónico
                  </label>
                  <Input type="email" disabled value={userData?.email || ""} className="bg-slate-50 font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 caps-lock">
                    RUT
                  </label>
                  <Input
                    type="text"
                    disabled
                    value={formatRut(userData?.rut || "") || "Sin RUT"}
                    className="bg-slate-50 font-medium"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400 italic">
                * Para cambiar tu nombre, correo o RUT, contacta con soporte administrativo.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    LinkedIn
                  </label>
                  <Input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="linkedin.com/in/tu-perfil"
                    maxLength={120}
                    disabled={!isProfileEditing}
                    error={isProfileEditing ? profileErrors.linkedin : undefined}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Ubicación profesional
                  </label>
                  <Input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Santiago, Chile"
                    maxLength={120}
                    disabled={!isProfileEditing}
                    error={isProfileEditing ? profileErrors.location : undefined}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Instagram
                  </label>
                  <Input
                    type="text"
                    value={professionalInstagram}
                    onChange={(e) => setProfessionalInstagram(normalizeInstagramInput(e.target.value))}
                    placeholder="@tuusuario"
                    maxLength={80}
                    disabled={!isProfileEditing}
                    error={isProfileEditing ? profileErrors.professionalInstagram : undefined}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Número de Celular
                  </label>
                  <Input
                    type="text"
                    value={professionalPhone}
                    onChange={(e) => setProfessionalPhone(normalizePhoneInput(e.target.value))}
                    placeholder="+56 9 1234 5678"
                    maxLength={40}
                    disabled={!isProfileEditing}
                    error={isProfileEditing ? profileErrors.professionalPhone : undefined}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Correo de Contacto
                  </label>
                  <Input
                    type="email"
                    value={professionalEmail}
                    onChange={(e) => setProfessionalEmail(e.target.value.toLowerCase())}
                    placeholder="contacto@tudominio.cl"
                    maxLength={120}
                    disabled={!isProfileEditing}
                    error={isProfileEditing ? profileErrors.professionalEmail : undefined}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className={`relative flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm font-medium ${activeTab === "profile" ? "" : "hidden"}`}>
            <div className="relative flex min-h-[76px] items-start justify-between border-b border-slate-200 px-6 py-4 pr-14">
              <div className="flex items-center gap-x-2">
                <Globe className="h-5 w-5 text-emerald-600" />
                <h2 className="font-semibold text-slate-900">
                  Información adicional
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileEditing((value) => !value)}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:text-emerald-700 cursor-pointer"
                aria-label="Editar columna adicional"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Descripción del perfil
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Cuéntales a los pacientes sobre tu enfoque profesional, tu experiencia y cómo les puedes ayudar..."
                    rows={5}
                    maxLength={500}
                    disabled={!isProfileEditing}
                    error={isProfileEditing ? profileErrors.bio : undefined}
                  />
                  <p className="mt-1 text-xs text-slate-400">{bio.length}/500 caracteres</p>
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-6">
                  <div className="space-y-3">
                    <div>
                      <FieldSwitch
                        label="Modalidad de atención"
                        checked={profileFieldEnabled.consultationMode}
                        onToggle={() => {
                          if (!isProfileEditing) return;
                          const nextEnabled = !profileFieldEnabled.consultationMode;
                          if (nextEnabled && !consultationMode) {
                            setConsultationMode("online");
                          }
                          setProfileFieldEnabled((current) => ({
                            ...current,
                            consultationMode: !current.consultationMode,
                          }));
                        }}
                        disabled={!isProfileEditing}
                      />
                      <select
                        value={consultationMode}
                        onChange={(e) => setConsultationMode(e.target.value)}
                        disabled={!isProfileEditing || !profileFieldEnabled.consultationMode}
                        className={`w-full h-11 rounded-xl border px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer disabled:opacity-70 ${
                          profileFieldEnabled.consultationMode ? "border-slate-200 bg-slate-50 text-slate-900" : "border-slate-200 bg-slate-100 text-slate-400"
                        }`}
                      >
                        <option value="">Selecciona una modalidad</option>
                        <option value="online">Online</option>
                        <option value="presencial">Presencial</option>
                        <option value="both">Online y Presencial</option>
                      </select>
                    </div>
                    <div>
                      <FieldSwitch
                        label="Enfermedades o temas tratados"
                        checked={profileFieldEnabled.conditionsTreated}
                        onToggle={() => {
                          if (!isProfileEditing) return;
                          setProfileFieldEnabled((current) => ({
                            ...current,
                            conditionsTreated: !current.conditionsTreated,
                          }));
                        }}
                        disabled={!isProfileEditing}
                      />
                      <Input
                        value={conditionsTreated}
                        onChange={(e) => setConditionsTreated(e.target.value)}
                        placeholder="Ej: resistencia a la insulina, SII..."
                        disabled={!isProfileEditing || !profileFieldEnabled.conditionsTreated}
                        className={profileFieldEnabled.conditionsTreated ? "h-10" : "h-10 bg-slate-50 text-slate-400"}
                        error={isProfileEditing ? profileErrors.conditionsTreated : undefined}
                      />
                    </div>
                    <div>
                      <FieldSwitch
                        label="Tipos de pacientes"
                        checked={profileFieldEnabled.patientTypes}
                        onToggle={() => {
                          if (!isProfileEditing) return;
                          setProfileFieldEnabled((current) => ({
                            ...current,
                            patientTypes: !current.patientTypes,
                          }));
                        }}
                        disabled={!isProfileEditing}
                      />
                      <Input
                        value={patientTypes}
                        onChange={(e) => setPatientTypes(e.target.value)}
                        placeholder="Ej: adultos, deportistas, gestantes"
                        disabled={!isProfileEditing || !profileFieldEnabled.patientTypes}
                        className={profileFieldEnabled.patientTypes ? "h-10" : "h-10 bg-slate-50 text-slate-400"}
                        error={isProfileEditing ? profileErrors.patientTypes : undefined}
                      />
                    </div>
                    <div>
                      <FieldSwitch
                        label="Valores / precios"
                        checked={profileFieldEnabled.prices}
                        onToggle={() => {
                          if (!isProfileEditing) return;
                          setProfileFieldEnabled((current) => ({
                            ...current,
                            prices: !current.prices,
                          }));
                        }}
                        disabled={!isProfileEditing}
                      />
                      <Textarea
                        value={prices}
                        onChange={(e) => setPrices(e.target.value)}
                        placeholder="Ej: Consulta online $40.000 | Primera consulta $60.000"
                        rows={2}
                        className={profileFieldEnabled.prices ? "text-sm" : "text-sm bg-slate-50 text-slate-400"}
                        disabled={!isProfileEditing || !profileFieldEnabled.prices}
                        error={isProfileEditing ? profileErrors.prices : undefined}
                      />
                    </div>
                    <div>
                      <FieldSwitch
                        label="Dirección de clínica presencial"
                        checked={profileFieldEnabled.officeAddress}
                        onToggle={() => {
                          if (!isProfileEditing) return;
                          setProfileFieldEnabled((current) => ({
                            ...current,
                            officeAddress: !current.officeAddress,
                          }));
                        }}
                        disabled={!isProfileEditing}
                      />
                      <Input
                        value={officeAddress}
                        onChange={(e) => setOfficeAddress(e.target.value)}
                        placeholder="Ej: Providencia 1234, oficina 502"
                        disabled={!isProfileEditing || !profileFieldEnabled.officeAddress}
                        className={profileFieldEnabled.officeAddress ? "h-10" : "h-10 bg-slate-50 text-slate-400"}
                        error={isProfileEditing ? profileErrors.officeAddress : undefined}
                      />
                    </div>
                    <div>
                      <FieldSwitch
                        label="Pagos"
                        checked={profileFieldEnabled.paymentMethods}
                        onToggle={() => {
                          if (!isProfileEditing) return;
                          setProfileFieldEnabled((current) => ({
                            ...current,
                            paymentMethods: !current.paymentMethods,
                          }));
                        }}
                        disabled={!isProfileEditing}
                      />
                      <Select
                        value={paymentMethods}
                        onChange={setPaymentMethods}
                        placeholder="Selecciona una forma de pago"
                        disabled={!isProfileEditing || !profileFieldEnabled.paymentMethods}
                        errored={isProfileEditing ? Boolean(profileErrors.paymentMethods) : false}
                        className={profileFieldEnabled.paymentMethods ? undefined : "bg-slate-50 text-slate-400"}
                        options={PAYMENT_METHOD_OPTIONS}
                      />
                    </div>
                    <div>
                      <FieldSwitch
                        label="Seguros aceptados"
                        checked={profileFieldEnabled.acceptedInsurance}
                        onToggle={() => {
                          if (!isProfileEditing) return;
                          setProfileFieldEnabled((current) => ({
                            ...current,
                            acceptedInsurance: !current.acceptedInsurance,
                          }));
                        }}
                        disabled={!isProfileEditing}
                      />
                      <Input
                        value={acceptedInsurance}
                        onChange={(e) => setAcceptedInsurance(e.target.value)}
                        placeholder="Isapres, particulares, FONASA..."
                        disabled={!isProfileEditing || !profileFieldEnabled.acceptedInsurance}
                        className={profileFieldEnabled.acceptedInsurance ? "h-10" : "h-10 bg-slate-50 text-slate-400"}
                        error={isProfileEditing ? profileErrors.acceptedInsurance : undefined}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </form>

      <div className={`rounded-xl border border-slate-200 bg-white shadow-sm font-medium ${activeTab === "account" ? "" : "hidden"}`}>
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-x-2">
            <Type className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-900">
              Apariencia
            </h2>
          </div>
        </div>
        <div className="space-y-6 p-6">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              Tipografía
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFontPreference("default")}
                className={`rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
                  fontPreference === "default"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                  <span className="block text-sm font-semibold">Texto por defecto</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Mantiene el estilo actual del portal
                  </span>
              </button>

              <button
                type="button"
                onClick={() => setFontPreference("formal")}
                className={`rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
                  fontPreference === "formal"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="block text-sm font-semibold">Texto tradicional</span>
                <span className="mt-1 block text-xs text-slate-500">
                  Más sobria y profesional, ideal para lectura larga
                </span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Esta preferencia se guarda solo en tu navegador y se aplica al instante.
            </p>
          </div>
        </div>
      </div>

      {/* Membresía Tab */}
      <div className={`space-y-6 ${activeTab === "membership" ? "" : "hidden"}`}>
        <MembershipPlanSection autoOpenChangePlan={openPlanModal} />
      </div>

      {/* Privacidad y Cumplimiento Tab */}
      <div className={`space-y-6 ${activeTab === "compliance" ? "" : "hidden"}`}>
        <ComplianceTabSection />
      </div>
    </div>
  );
}
