"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { User, Lock, Crown, Save, Sun, Moon, Type, Calendar, Pencil, Globe } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { useTheme } from "@/context/ThemeContext";
import { useFont } from "@/context/FontContext";
import { formatRut } from "@/lib/rut-utils";
import { MembershipPlanSection } from "./MembershipPlanSection";
import { getCurrentUser, setCurrentUser } from "@/lib/current-user";

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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "membership">("profile");

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
  const { theme, setTheme } = useTheme();
  const { fontPreference, setFontPreference } = useFont();
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
              Modo visual
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
                  theme === "light"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>
                  <span className="block text-sm font-semibold">Claro</span>
                  <span className="block text-xs text-slate-500">
                    Más luminoso y limpio
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
                  theme === "dark"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>
                  <span className="block text-sm font-semibold">Oscuro</span>
                  <span className="block text-xs text-slate-500">
                    Ideal para baja luz
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-6">
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
        <MembershipPlanSection />
      </div>
    </div>
  );
}
