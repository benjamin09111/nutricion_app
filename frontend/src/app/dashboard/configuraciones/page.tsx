"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Lock, Save, Eye, EyeOff, Sun, Moon, Type, FileText, Globe, MapPin, Phone, Mail, Calendar, Check, Crown, Clock, AlertCircle, BadgeCheck, TestTube, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { authService } from "@/features/auth/services/auth.service";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { useTheme } from "@/context/ThemeContext";
import { useFont } from "@/context/FontContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { membershipService } from "@/features/memberships/services/membership.service";
import { usePaymentMode } from "@/hooks/usePaymentMode";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { cn } from "@/lib/utils";
import { getPasswordRequirements, getPasswordStrength } from "@/lib/password-policy";

interface UserSettings {
  professionalInstagram?: string;
  professionalPhone?: string;
  professionalEmail?: string;
  publicProfileEnabled?: boolean;
  publicSlug?: string;
  headline?: string;
  bio?: string;
  consultationMode?: string;
  location?: string;
  publicPhone?: string;
  publicEmail?: string;
  bookingEnabled?: boolean;
  showPublicPhone?: boolean;
  showPublicEmail?: boolean;
  showInstagram?: boolean;
  showLinkedin?: boolean;
  showSchedule?: boolean;
  conditionsTreated?: string;
  patientTypes?: string;
  prices?: string;
  officeAddress?: string;
  paymentMethods?: string;
  acceptedInsurance?: string;
  linkedin?: string;
  country?: string;
}

const LEGAL_SECTIONS = [
  {
    title: "Terminos y Condiciones de Uso Beta",
    content: [
      "Ultima actualizacion: [FECHA]",
      "Bienvenido/a a NutriNet. Estos Terminos y Condiciones regulan el acceso y uso de la plataforma NutriNet, una herramienta digital orientada a profesionales de la nutricion y dietetica para apoyo en gestion de pacientes, planificacion alimentaria, recetas, porciones, carrito y generacion de documentos.",
      "Al registrarte, acceder o utilizar NutriNet, aceptas estos Terminos. Si no estas de acuerdo, no debes usar la plataforma.",
      "1. Naturaleza del servicio. NutriNet es una plataforma de software en modalidad beta destinada a apoyar el trabajo de nutricionistas y otros profesionales autorizados del area de la salud. NutriNet no reemplaza el juicio clinico, la evaluacion profesional ni la responsabilidad del usuario respecto de las decisiones que adopte en la atencion de sus pacientes.",
      "2. Requisitos de uso. El uso de NutriNet esta permitido unicamente a personas mayores de edad que actuen en el ejercicio de su actividad profesional o empresarial, o con autorizacion suficiente para ello.",
      "3. Uso beta. NutriNet se encuentra en fase beta. El usuario entiende y acepta que ciertas funciones pueden presentar errores, caidas, inconsistencias o cambios; el servicio puede ser modificado, limitado, suspendido o interrumpido total o parcialmente; algunas funcionalidades pueden estar en desarrollo, prueba o retiro; y no se garantiza disponibilidad continua ni ausencia de fallas.",
      "4. Responsabilidad profesional del usuario. El usuario es el unico responsable de la atencion clinica que presta, de la informacion que ingresa en la plataforma, de la revision y aprobacion final de recetas, porciones, indicaciones, calculos y entregables, y de la verificacion de alergias, restricciones, patologias, interacciones, requerimientos nutricionales y demas antecedentes clinicos relevantes.",
      "5. Datos de pacientes. El usuario solo podra ingresar datos personales o sensibles de pacientes cuando cuente con una base legal suficiente para ello, incluyendo, cuando corresponda, consentimiento del titular, autorizacion contractual, mandato, relacion asistencial u otra causal legalmente valida.",
      "6. Herramientas de inteligencia artificial. NutriNet puede incorporar funcionalidades de inteligencia artificial para generar, sugerir, resumir, estructurar o reformular informacion. Las salidas de IA son automaticas y pueden contener errores, omisiones o sesgos; toda salida generada por IA debe ser revisada antes de ser usada; la IA no constituye diagnostico, prescripcion medica ni indicacion clinica autonoma; y NutriNet no garantiza que el contenido generado por IA sea exacto, completo o adecuado para un caso particular.",
      "7. Conductas prohibidas. Se prohibe al usuario ingresar informacion falsa, engañosa o no autorizada; vulnerar la seguridad de la plataforma; intentar acceder a cuentas, datos o sistemas ajenos; usar la plataforma para fines ilicitos, fraudulentos o abusivos; copiar, revender, sublicenciar o explotar comercialmente la plataforma sin autorizacion; o subir contenido que infrinja derechos de terceros.",
      "8. Seguridad. NutriNet adopta medidas razonables de seguridad tecnicas y organizativas. Sin perjuicio de ello, ningun sistema es completamente infalible, por lo que el usuario reconoce la existencia de riesgos inherentes a los entornos digitales.",
      "9. Propiedad intelectual. La plataforma, su diseño, codigo, bases estructurales, marca, textos, flujos, interfaces y demas elementos protegibles pertenecen a NutriNet o a sus licenciantes.",
      "10. Suspension o terminacion. NutriNet podra suspender o terminar cuentas, accesos o funciones cuando exista incumplimiento de estos Terminos; se detecte uso abusivo, fraudulento o inseguro; o sea necesario por razones tecnicas, legales, de seguridad o de operacion.",
      "11. Limitacion de responsabilidad. En la maxima medida permitida por la ley, NutriNet no sera responsable por decisiones clinicas tomadas por el usuario; errores de ingreso de datos; daños derivados del uso de contenido no revisado por el profesional; interrupciones, indisponibilidades o perdida de funcionalidad propia de una beta; lucro cesante, perdida de oportunidades, daño reputacional o perjuicios indirectos.",
      "12. Modificaciones. NutriNet podra modificar estos Terminos. La nueva version sera informada en la plataforma y podra requerirse una nueva aceptacion.",
      "13. Ley aplicable y jurisdiccion. Estos Terminos se regiran por las leyes de la Republica de Chile. Toda controversia se sometera a los tribunales ordinarios de justicia con competencia en Chile, salvo norma imperativa en contrario.",
      "14. Contacto. Para consultas legales, privacidad o soporte: Correo: [EMAIL]. Responsable: [NOMBRE O RAZON SOCIAL].",
    ],
  },
  {
    title: "Politica de Privacidad",
    content: [
      "Ultima actualizacion: [FECHA]",
      "Esta Politica de Privacidad explica como NutriNet recopila, utiliza, almacena y protege datos personales tratados a traves de la plataforma.",
      "1. Responsable de contacto. Responsable de la plataforma: [NOMBRE O RAZON SOCIAL]. Correo de contacto: [EMAIL]. Domicilio o referencia de contacto: [DIRECCION / CIUDAD].",
      "2. Que datos tratamos. Podemos tratar datos de identificacion del usuario profesional; datos de contacto; datos de acceso, autenticacion y uso; datos de pacientes ingresados por el usuario; datos de salud, antecedentes nutricionales, restricciones alimentarias, habitos, objetivos, recetas, calculos, observaciones y documentos asociados; y registros tecnicos, logs y eventos de seguridad.",
      "3. Datos sensibles. NutriNet puede tratar datos sensibles, incluidos datos relativos a la salud, cuando son ingresados por usuarios profesionales para fines asistenciales o vinculados a la atencion nutricional.",
      "4. Finalidades del tratamiento. Tratamos datos para permitir el funcionamiento de la plataforma; gestionar cuentas y autenticacion; almacenar, organizar y mostrar informacion clinica o nutricional; generar recetas, porciones, calculos, PDFs y otras herramientas de apoyo; habilitar funciones automatizadas e inteligencia artificial; mantener seguridad, trazabilidad y soporte; mejorar el servicio, detectar errores y prevenir abuso; y cumplir obligaciones legales o requerimientos validos de autoridad competente.",
      "5. Base de tratamiento. Respecto del usuario profesional, el tratamiento se basa en la ejecucion de la relacion de uso de la plataforma, medidas precontractuales, cumplimiento de obligaciones legales e intereses legitimos compatibles con la operacion y seguridad del servicio. Respecto de datos de pacientes ingresados por el usuario, el usuario declara y garantiza que cuenta con base legal suficiente para dicho tratamiento.",
      "6. Uso de inteligencia artificial. Si se utilizan funciones de IA, ciertos datos ingresados pueden ser procesados para generar respuestas, recetas, porciones, estructuras o textos; se procurara aplicar principios de minimizacion y uso limitado a la finalidad informada; y las salidas deben ser revisadas por el profesional antes de su utilizacion clinica.",
      "7. Comparticion de datos. NutriNet no vende datos personales. Los datos podran compartirse unicamente cuando sea necesario con proveedores tecnologicos o de infraestructura; servicios de autenticacion, almacenamiento, monitoreo o procesamiento; proveedores que apoyen funciones de IA; y autoridades o tribunales cuando exista obligacion legal o requerimiento valido.",
      "8. Conservacion. Los datos seran conservados por el tiempo necesario para cumplir las finalidades informadas, dar continuidad al servicio, cumplir obligaciones legales, resguardar seguridad, atender requerimientos o resolver controversias.",
      "9. Seguridad. NutriNet adopta medidas razonables de seguridad administrativas, tecnicas y organizativas para proteger los datos contra acceso no autorizado, perdida, alteracion o divulgacion indebida.",
      "10. Derechos. El titular de datos podra ejercer los derechos que le reconozca la normativa aplicable, incluyendo acceso, rectificacion, actualizacion, supresion, oposicion u otros que correspondan.",
      "11. Incidentes de seguridad. En caso de incidentes de seguridad que afecten datos personales, NutriNet evaluara las medidas de contencion, investigacion, mitigacion y comunicacion que resulten procedentes conforme a la ley y a la gravedad del incidente.",
      "12. Cambios a esta politica. NutriNet podra modificar esta Politica de Privacidad. La version vigente sera publicada en la plataforma.",
      "13. Contacto. Correo: [EMAIL]. Responsable: [NOMBRE O RAZON SOCIAL].",
    ],
  },
  {
    title: "Anexo de Tratamiento de Datos",
    content: [
      "Ultima actualizacion: [FECHA]",
      "Este Anexo forma parte de los Terminos y Condiciones de NutriNet y regula el tratamiento de datos personales que el usuario profesional ingresa en la plataforma respecto de sus pacientes.",
      "1. Roles. Para efectos de este Anexo, el Usuario Profesional actua como responsable respecto de los datos personales de sus pacientes que decide ingresar, consultar, modificar o eliminar en la plataforma; y NutriNet actua como encargado u operador tecnologico, tratando dichos datos por cuenta del Usuario Profesional y conforme a las funcionalidades del servicio.",
      "2. Objeto. NutriNet tratara datos personales unicamente para alojar y procesar la informacion; permitir al Usuario Profesional usar la plataforma; ejecutar calculos, recetas, porciones, exportaciones y demas funciones contratadas o habilitadas; y mantener soporte, seguridad, trazabilidad y continuidad operacional.",
      "3. Instrucciones del usuario. El Usuario Profesional instruye a NutriNet a tratar los datos personales conforme a la configuracion y uso que realice dentro de la plataforma, las acciones que ejecute al cargar, editar, exportar o eliminar informacion, y las funcionalidades estandar del servicio.",
      "4. Obligaciones del Usuario Profesional. El Usuario Profesional declara y garantiza que cuenta con legitimacion suficiente para tratar y cargar datos de pacientes; informara y obtendra consentimientos cuando la ley asi lo exija; no ingresara datos innecesarios o excesivos; sera responsable de la exactitud, pertinencia y actualizacion de la informacion; y mantendra confidenciales sus credenciales de acceso.",
      "5. Obligaciones de NutriNet. NutriNet se obliga a tratar los datos conforme a este Anexo y a la operacion del servicio; adoptar medidas razonables de seguridad; limitar el acceso interno a personal o terceros que lo requieran para prestar el servicio; resguardar confidencialidad; y asistir razonablemente al Usuario Profesional en materias operativas vinculadas a datos y seguridad.",
      "6. Subencargados o proveedores. NutriNet podra utilizar proveedores tecnologicos para infraestructura, almacenamiento, procesamiento, monitoreo, autenticacion o funciones de IA, siempre que ello sea razonablemente necesario para la prestacion del servicio y bajo medidas de resguardo apropiadas.",
      "7. Confidencialidad. Toda persona que acceda a datos personales en el contexto de la prestacion del servicio debera quedar sujeta a deberes de confidencialidad.",
      "8. Seguridad e incidentes. NutriNet implementara medidas razonables para proteger la informacion y notificara al Usuario Profesional, dentro de un plazo razonable, incidentes de seguridad relevantes que afecten datos personales tratados por cuenta de este, en la medida en que la ley o la naturaleza del incidente lo hagan procedente.",
      "9. Terminacion. Al terminar la relacion, NutriNet podra eliminar, bloquear, devolver o anonimizar datos segun la configuracion del servicio, los plazos legales aplicables, necesidades de respaldo, seguridad o defensa juridica.",
      "10. Prevalencia. En caso de conflicto entre este Anexo y otros textos del servicio, prevalecera la interpretacion que otorgue mayor proteccion a los datos personales, sin contrariar la ley.",
    ],
  },
  {
    title: "Aviso de IA y Responsabilidad Profesional",
    content: [
      "NutriNet incorpora funciones automatizadas e inteligencia artificial para asistir al profesional en tareas como generacion de recetas, sugerencias de porciones, estructuracion de planes, textos, resumenes y documentos.",
      "Al usar estas funciones, el usuario acepta expresamente que las respuestas y sugerencias generadas por IA son orientativas y pueden contener errores, omisiones, imprecisiones o sesgos; la IA no reemplaza el criterio profesional, la evaluacion clinica individual, la entrevista nutricional, la revision de antecedentes ni la validacion final del profesional; toda recomendacion, receta, porcion, calculo, texto, material educativo o documento generado con apoyo de IA debe ser revisado, ajustado y aprobado por el usuario antes de su uso o entrega a pacientes; NutriNet no garantiza que el contenido generado por IA sea exacto, completo, actualizado o adecuado para un caso clinico especifico; y el usuario es el unico responsable de la decision final de utilizar, modificar o descartar cualquier contenido sugerido por la plataforma.",
    ],
  },
];

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "membership">("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordStrength = getPasswordStrength(newPassword);
  const passwordRequirements = getPasswordRequirements(newPassword);

  const [userData, setUserData] = useState<{
    email: string;
    fullName?: string;
    settings?: UserSettings;
  } | null>(null);

  const [professionalInstagram, setProfessionalInstagram] = useState("");
  const [professionalPhone, setProfessionalPhone] = useState("");
  const [professionalEmail, setProfessionalEmail] = useState("");
  const [isSavingProfessionalContact, setIsSavingProfessionalContact] =
    useState(false);

  const [publicProfileEnabled, setPublicProfileEnabled] = useState(false);
  const [publicSlug, setPublicSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [consultationMode, setConsultationMode] = useState("online");
  const [location, setLocation] = useState("");
  const [publicPhone, setPublicPhone] = useState("");
  const [publicEmail, setPublicEmail] = useState("");
  const [bookingEnabled, setBookingEnabled] = useState(true);
const [showPublicPhone, setShowPublicPhone] = useState(false);
  const [showPublicEmail, setShowPublicEmail] = useState(true);
  const [showInstagram, setShowInstagram] = useState(false);
  const [showLinkedin, setShowLinkedin] = useState(false);
  const [showSchedule, setShowSchedule] = useState(true);
  const [conditionsTreated, setConditionsTreated] = useState("");
  const [patientTypes, setPatientTypes] = useState("");
  const [prices, setPrices] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [paymentMethods, setPaymentMethods] = useState("");
  const [acceptedInsurance, setAcceptedInsurance] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [country, setCountry] = useState("Chile");
  const [isSavingPublicProfile, setIsSavingPublicProfile] = useState(false);
  const [publishedPublicSlug, setPublishedPublicSlug] = useState("");
  const [highlightProfile, setHighlightProfile] = useState(false);
  const { theme, setTheme } = useTheme();
  const { fontPreference, setFontPreference } = useFont();
  const {
    planName,
    currentPlan,
    subscriptionEndsAt,
    daysRemaining,
    cancelAtPeriodEnd,
    status: subscriptionStatus,
    refreshSubscription,
  } = useSubscription();
  const { mode, toggle: togglePaymentMode } = usePaymentMode();
  const [isCanceling, setIsCanceling] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const settings = (user.nutritionist?.settings || {}) as UserSettings;
        setUserData({
          email: user.email,
          fullName: user.nutritionist?.fullName || "Profesional",
          settings,
        });
        setProfessionalInstagram(settings.professionalInstagram || "");
        setProfessionalPhone(settings.professionalPhone || "");
        setProfessionalEmail(settings.professionalEmail || "");

        setPublicProfileEnabled(settings.publicProfileEnabled || false);
        setPublicSlug(settings.publicSlug || "");
        setPublishedPublicSlug(settings.publicSlug || "");
        setHeadline(settings.headline || "");
        setBio(settings.bio || "");
        setConsultationMode(settings.consultationMode || "online");
        setLocation(settings.location || "");
        setPublicPhone(settings.publicPhone || "");
        setPublicEmail(settings.publicEmail || "");
        setBookingEnabled(settings.bookingEnabled !== false);
        setShowPublicPhone(settings.showPublicPhone === true);
        setShowPublicEmail(settings.showPublicEmail !== false);
        setShowInstagram(settings.showInstagram === true);
        setShowLinkedin(settings.showLinkedin === true);
        setShowSchedule(settings.showSchedule !== false);
        setConditionsTreated(settings.conditionsTreated || "");
        setPatientTypes(settings.patientTypes || "");
        setPrices(settings.prices || "");
        setOfficeAddress(settings.officeAddress || "");
        setPaymentMethods(settings.paymentMethods || "");
        setAcceptedInsurance(settings.acceptedInsurance || "");
        setLinkedin(settings.linkedin || "");
        setCountry(settings.country || "Chile");
      } catch (e) {
        console.error("Error loading user data", e);
      }
    }
  }, []);

  useEffect(() => {
    const scrollToProfile = () => {
      if (window.location.hash !== "#public-profile-section") return;
      setActiveTab("profile");
      const el = document.getElementById("public-profile-section");
      if (!el) return;
      window.scrollTo({ top: 0, behavior: "instant" });
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const offset = rect.top + window.scrollY - 100;
        window.scrollTo({ top: offset, behavior: "smooth" });
        setHighlightProfile(true);
        setTimeout(() => setHighlightProfile(false), 2500);
      });
    };
    scrollToProfile();
    window.addEventListener("hashchange", scrollToProfile);
    return () => window.removeEventListener("hashchange", scrollToProfile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    const unmetRequirements = passwordRequirements.filter((rule) => !rule.met);
    if (unmetRequirements.length > 0) {
      toast.error(unmetRequirements[0]?.label || "La nueva contraseña no cumple la política de seguridad");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }

    setIsLoading(true);
    try {
      await authService.updatePassword({
        currentPassword,
        newPassword,
      });
      toast.success("Contraseña actualizada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al actualizar la contraseña";
      toast.error(message || "Error al actualizar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfessionalContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfessionalContact(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetchApi(`/users/me/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          professionalInstagram: professionalInstagram.trim(),
          professionalPhone: professionalPhone.trim(),
          professionalEmail: professionalEmail.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el contacto profesional");
      }

      toast.success("Contacto profesional guardado correctamente");

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.nutritionist) {
          user.nutritionist.settings = {
            ...user.nutritionist.settings,
            professionalInstagram: professionalInstagram.trim(),
            professionalPhone: professionalPhone.trim(),
            professionalEmail: professionalEmail.trim(),
          };
          localStorage.setItem("user", JSON.stringify(user));
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Hubo un error";
      toast.error(message || "Hubo un error");
    } finally {
      setIsSavingProfessionalContact(false);
    }
  };

  const handleSavePublicProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPublicProfile(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetchApi(`/users/me/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          publicProfileEnabled,
          publicSlug: publicSlug.trim() || undefined,
          headline: headline.trim(),
bio: bio.trim(),
          consultationMode,
          location: location.trim(),
          publicPhone: publicPhone.trim(),
          publicEmail: publicEmail.trim(),
          bookingEnabled,
          showPublicPhone,
          showPublicEmail,
          showInstagram,
          showSchedule,
          conditionsTreated: conditionsTreated.trim(),
          patientTypes: patientTypes.trim(),
          prices: prices.trim(),
          officeAddress: officeAddress.trim(),
          paymentMethods: paymentMethods.trim(),
          acceptedInsurance: acceptedInsurance.trim(),
          linkedin: linkedin.trim(),
          country: country.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el perfil público");
      }

      const updatedNutritionist = await response.json().catch(() => null);

      const resolvedSlug =
        (updatedNutritionist?.publicSlug as string | undefined)?.trim() ||
        publicSlug.trim() ||
        "";

      setPublicProfileEnabled(Boolean(updatedNutritionist?.publicProfileEnabled ?? publicProfileEnabled));
      setPublishedPublicSlug(resolvedSlug);

      toast.success("Perfil público guardado correctamente");

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.nutritionist) {
          user.nutritionist.settings = {
            ...user.nutritionist.settings,
            publicProfileEnabled: Boolean(updatedNutritionist?.publicProfileEnabled ?? publicProfileEnabled),
            publicSlug: resolvedSlug || undefined,
            headline: headline.trim(),
            bio: bio.trim(),
            consultationMode,
            location: location.trim(),
            publicPhone: publicPhone.trim(),
            publicEmail: publicEmail.trim(),
            bookingEnabled,
            showPublicPhone,
            showPublicEmail,
            showInstagram,
            professionalInstagram: professionalInstagram.trim(),
          };
          localStorage.setItem("user", JSON.stringify(user));
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Hubo un error";
      toast.error(message || "Hubo un error");
    } finally {
      setIsSavingPublicProfile(false);
    }
  };

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

      <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
            activeTab === "profile"
              ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Mi perfil
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("account")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
            activeTab === "account"
              ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Cuenta
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("membership")}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
            activeTab === "membership"
              ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Membresía
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <div className={`rounded-xl border border-slate-200 bg-white shadow-sm font-medium ${activeTab === "profile" ? "" : "hidden"}`}>
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-x-2">
              <User className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold text-slate-900">
                Información del Perfil
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-x-4 mb-6 font-bold">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 border border-emerald-200 text-2xl font-bold">
                {userData?.fullName?.charAt(0) || "U"}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {userData?.fullName || "Cargando..."}
                </h3>
                <p className="text-sm font-medium text-slate-500">
                  {userData?.email || "..."}
                </p>
                <div className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  Perfil Profesional
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 caps-lock">
                  Nombre en Pantalla
                </label>
                <Input
                  type="text"
                  disabled
                  value={userData?.fullName || ""}
                  className="bg-slate-50 cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 caps-lock">
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  disabled
                  value={userData?.email || ""}
                  className="bg-slate-50 cursor-not-allowed font-medium"
                />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400 italic">
              * Para cambiar tu nombre o correo, contacta con soporte
              administrativo.
            </p>

            <form onSubmit={handleSaveProfessionalContact} className="mt-6 space-y-4">
              <div className="grid gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Instagram (Portada Entregable)
                </label>
                  <Input
                    type="text"
                    value={professionalInstagram}
                    onChange={(e) => setProfessionalInstagram(e.target.value)}
                    placeholder="@tuusuario"
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Número de Celular (Portada Entregable)
                  </label>
                  <Input
                    type="text"
                    value={professionalPhone}
                    onChange={(e) => setProfessionalPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    maxLength={40}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Correo de Contacto (Portada Entregable)
                  </label>
                  <Input
                    type="email"
                    value={professionalEmail}
                    onChange={(e) => setProfessionalEmail(e.target.value)}
                    placeholder="contacto@tudominio.cl"
                    maxLength={120}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={isSavingProfessionalContact}
                  className="flex items-center gap-2 font-bold"
                >
                  {!isSavingProfessionalContact && <Save className="h-4 w-4" />}
                  Guardar Contacto Profesional
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Security Settings */}
        <div className={`rounded-xl border border-slate-200 bg-white shadow-sm font-medium ${activeTab === "account" ? "" : "hidden"}`}>
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-x-2">
              <Lock className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold text-slate-900">
                Seguridad y Acceso
              </h2>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    className="pr-11"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
              <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-400 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                    aria-label={showCurrentPassword ? "Ocultar contraseña actual" : "Ver contraseña actual"}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    className="pr-11"
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-400 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                    aria-label={showNewPassword ? "Ocultar nueva contraseña" : "Ver nueva contraseña"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {newPassword.length > 0 && (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Seguridad
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                        passwordStrength.tone === "emerald"
                          ? "bg-emerald-100 text-emerald-700"
                          : passwordStrength.tone === "indigo"
                            ? "bg-indigo-100 text-indigo-700"
                            : passwordStrength.tone === "amber"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="mb-4 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.tone === "emerald"
                          ? "bg-emerald-500"
                          : passwordStrength.tone === "indigo"
                            ? "bg-indigo-500"
                            : passwordStrength.tone === "amber"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (passwordStrength.score / 6) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {passwordRequirements.map((rule) => (
                      <div
                        key={rule.key}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                          rule.met
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        <Check
                          className={`h-3.5 w-3.5 ${rule.met ? "opacity-100" : "opacity-25"}`}
                        />
                        {rule.label}
                      </div>
                    ))}
                  </div>
                </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    className="pr-11"
                    placeholder="Repite tu nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-400 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                    aria-label={showConfirmPassword ? "Ocultar confirmación" : "Ver confirmación"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full flex items-center gap-2 font-bold"
                >
                  {!isLoading && <Save className="h-4 w-4" />}
                  Guardar Nueva Contraseña
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

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

      <div
        className={`rounded-xl border border-slate-200 bg-white shadow-sm font-medium transition-all duration-700 ${activeTab === "profile" ? "" : "hidden"} ${
          highlightProfile
            ? "ring-4 ring-emerald-400/50 ring-offset-4 ring-offset-white shadow-xl shadow-emerald-200/60 scale-[1.02]"
            : ""
        }`}
        id="public-profile-section"
      >
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-2">
              <Globe className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold text-slate-900">
                Perfil Público
              </h2>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Permite que otros usuarios te encuentren y soliciten citas desde el directorio de nutricionistas.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className={`rounded-2xl border p-5 ${publicProfileEnabled ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {publicProfileEnabled ? "Tu perfil ya es público" : "Activa tu perfil público"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {publicProfileEnabled
                    ? "Ya apareces en el directorio y puedes recibir solicitudes."
                    : "Haz visible tu perfil para que te encuentren desde Google y el directorio."}
                </p>
                {isSavingPublicProfile && (
                  <p className="mt-2 text-sm font-semibold text-emerald-700">Publicando perfil...</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPublicProfileEnabled(!publicProfileEnabled)}
                className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition-all ${
                  publicProfileEnabled
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {publicProfileEnabled ? "Perfil público activo" : "Hacer perfil público"}
              </button>
            </div>
            {publicProfileEnabled && publishedPublicSlug && !isSavingPublicProfile && (
              <div className="mt-4">
                <Link
                  href={`/nutricionistas/${publishedPublicSlug}`}
                  className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-50"
                >
                  Visitar mi perfil público
                </Link>
              </div>
            )}
          </div>

          <form onSubmit={handleSavePublicProfile} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    URL pública (slug)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">nutrinet.cl/nutricionistas/</span>
                    <Input
                      type="text"
                      value={publicSlug}
                      onChange={(e) => setPublicSlug(e.target.value)}
                      placeholder="tu-nombre"
                      className="flex-1"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Deja vacío para generar automáticamente
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Frase corta (headline)
                  </label>
                  <Input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Nutricionista clínica especializada en..."
                    maxLength={100}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Bio / Descripción
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuéntales a los pacientes sobre tu enfoque profesional, tu experiencia y cómo les puedes ayudar..."
                  className="w-full min-h-[120px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-slate-400">
                  {bio.length}/500 caracteres
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Modalidad de atención
                  </label>
                  <select
                    value={consultationMode}
                    onChange={(e) => setConsultationMode(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="online">Online</option>
                    <option value="presencial">Presencial</option>
                    <option value="both">Online y Presencial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Ubicación (ciudad/comuna)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Santiago, Chile"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4">
                  Información de contacto pública
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">Teléfono</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="text"
                        value={publicPhone}
                        onChange={(e) => setPublicPhone(e.target.value)}
                        placeholder="+56 9 1234 5678"
                        className="h-8 w-40 text-xs"
                      />
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <span className="text-[10px] font-medium text-slate-500">Mostrar</span>
                        <div
                          className={`relative w-9 h-5 rounded-full transition-colors ${showPublicPhone ? "bg-emerald-500" : "bg-slate-300"}`}
                          onClick={() => setShowPublicPhone(!showPublicPhone)}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showPublicPhone ? "left-4.5" : "left-0.5"}`} />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">Email</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="email"
                        value={publicEmail}
                        onChange={(e) => setPublicEmail(e.target.value)}
                        placeholder="contacto@tuemail.cl"
                        className="h-8 w-40 text-xs"
                      />
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <span className="text-[10px] font-medium text-slate-500">Mostrar</span>
                        <div
                          className={`relative w-9 h-5 rounded-full transition-colors ${showPublicEmail ? "bg-emerald-500" : "bg-slate-300"}`}
                          onClick={() => setShowPublicEmail(!showPublicEmail)}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showPublicEmail ? "left-4.5" : "left-0.5"}`} />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-base">📷</span>
                      <span className="text-sm font-medium text-slate-700">Instagram</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="text"
                        value={professionalInstagram}
                        onChange={(e) => setProfessionalInstagram(e.target.value)}
                        placeholder="@tuusuario"
                        className="h-8 w-40 text-xs"
                      />
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <span className="text-[10px] font-medium text-slate-500">Mostrar</span>
                        <div
                          className={`relative w-9 h-5 rounded-full transition-colors ${showInstagram ? "bg-emerald-500" : "bg-slate-300"}`}
                          onClick={() => setShowInstagram(!showInstagram)}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showInstagram ? "left-4.5" : "left-0.5"}`} />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-base">💼</span>
                      <span className="text-sm font-medium text-slate-700">LinkedIn</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="text"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="linkedin.com/in/tu-perfil"
                        className="h-8 w-40 text-xs"
                      />
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <span className="text-[10px] font-medium text-slate-500">Mostrar</span>
                        <div
                          className={`relative w-9 h-5 rounded-full transition-colors ${showLinkedin ? "bg-emerald-500" : "bg-slate-300"}`}
                          onClick={() => setShowLinkedin(!showLinkedin)}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showLinkedin ? "left-4.5" : "left-0.5"}`} />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">Horario en portal</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <span className="text-[10px] font-medium text-slate-500">Mostrar</span>
                        <div
                          className={`relative w-9 h-5 rounded-full transition-colors ${showSchedule ? "bg-emerald-500" : "bg-slate-300"}`}
                          onClick={() => setShowSchedule(!showSchedule)}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showSchedule ? "left-4.5" : "left-0.5"}`} />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4">
                  Información adicional del perfil público
                </h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider">Enfermedades o temas tratados</label>
                    <Input
                      value={conditionsTreated}
                      onChange={(e) => setConditionsTreated(e.target.value)}
                      placeholder="Ej: Obesidad, diabetes, estrés, nutrición deportiva"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider">Tipos de pacientes</label>
                    <Input
                      value={patientTypes}
                      onChange={(e) => setPatientTypes(e.target.value)}
                      placeholder="Ej: Adultos, niños, athletes, embarazadas"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider">Precios y servicios</label>
                    <Textarea
                      value={prices}
                      onChange={(e) => setPrices(e.target.value)}
                      placeholder="Ej: Consulta online $40.000 | Primera consulta $60.000"
                      rows={2}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider">Dirección de consultorio</label>
                    <Input
                      value={officeAddress}
                      onChange={(e) => setOfficeAddress(e.target.value)}
                      placeholder="Ej: Av. Providencia 1234, oficina 502, Providencia, Santiago"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider">Formas de pago</label>
                    <Input
                      value={paymentMethods}
                      onChange={(e) => setPaymentMethods(e.target.value)}
                      placeholder="Ej: Efectivo, transferencia, debitocrédito"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider">Seguros aceptados</label>
                    <Input
                      value={acceptedInsurance}
                      onChange={(e) => setAcceptedInsurance(e.target.value)}
                      placeholder="Ej: Consalud, Banmédica,此地"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider">País</label>
                    <Input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Ej: Chile"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Permitir solicitar citas</p>
                      <p className="text-xs text-slate-500">
                        {bookingEnabled
                          ? "Los usuarios podrán pedir hora desde tu perfil público"
                          : "Los usuarios podrán enviarte un mensaje directo y lo verás en tu módulo de citas"}
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        bookingEnabled ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                      onClick={() => setBookingEnabled(!bookingEnabled)}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          bookingEnabled ? "left-6" : "left-0.5"
                        }`}
                      />
                    </div>
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  isLoading={isSavingPublicProfile}
                  className="flex items-center gap-2 font-bold"
                >
                  {!isSavingPublicProfile && <Save className="h-4 w-4" />}
                  Guardar Perfil Público
                </Button>
              </div>
            </form>
          </div>
      </div>

      <div className={`rounded-xl border border-slate-200 bg-white shadow-sm font-medium ${activeTab === "account" ? "" : "hidden"}`}>
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-x-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold text-slate-900">
              Terminos y Condiciones
            </h2>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Referencia legal y operativa para el uso beta de NutriNet.
          </p>
        </div>
        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Este contenido es una base de trabajo interna para la beta. Reemplaza
            los campos entre corchetes antes de publicarlo de forma definitiva.
          </div>

          {LEGAL_SECTIONS.map((section) => (
            <section
              key={section.title}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5"
            >
              <h3 className="text-base font-bold text-slate-900">
                {section.title}
              </h3>
              <div className="mt-3 space-y-3">
                {section.content.map((paragraph, index) => (
                  <p
                    key={`${section.title}-${index}`}
                    className="text-sm leading-6 text-slate-600"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Membresía Tab */}
      <div className={`space-y-6 ${activeTab === "membership" ? "" : "hidden"}`}>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-x-2 mb-6">
            <Crown className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900">Membresía y Planes</h2>
          </div>

          {currentPlan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <BadgeCheck className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-bold text-slate-900">
                        {currentPlan.name}
                      </p>
                      {subscriptionStatus === "ACTIVE" && !cancelAtPeriodEnd && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                          Activo
                        </span>
                      )}
                      {cancelAtPeriodEnd && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                          Cancela al vencer
                        </span>
                      )}
                      {subscriptionStatus === "PAST_DUE" && (
                        <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-200">
                          Expirado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      ${currentPlan.price.toLocaleString("es-CL")}/mes
                    </p>
                  </div>
                </div>
                {currentPlan.price > 0 && daysRemaining !== null && daysRemaining > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600 font-medium">
                      {daysRemaining} días restantes
                    </span>
                  </div>
                )}
              </div>

              {subscriptionEndsAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Fecha de activación
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {subscriptionEndsAt.toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Mode Toggle */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Modo de pago</p>
                    <p className="text-xs text-slate-500">
                      {mode === "mock"
                        ? "Prueba: los pagos se aprueban automáticamente"
                        : "Real: pagos procesados por Mercado Pago"}
                    </p>
                  </div>
                  <button
                    onClick={togglePaymentMode}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer",
                      mode === "real"
                        ? "bg-emerald-600"
                        : "bg-slate-300",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
                        mode === "real" ? "translate-x-5" : "translate-x-0",
                      )}
                    />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {!cancelAtPeriodEnd && currentPlan.price > 0 && (
                  <button
                    onClick={() => setIsCancelConfirmOpen(true)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancelar al vencimiento
                  </button>
                )}
                {cancelAtPeriodEnd && (
                  <button
                    onClick={async () => {
                      setIsResuming(true);
                      try {
                        await membershipService.resumeSubscription();
                        toast.success("Plan reanudado correctamente");
                        await refreshSubscription();
                      } catch (e: any) {
                        toast.error(e?.message || "Error al reanudar plan");
                      } finally {
                        setIsResuming(false);
                      }
                    }}
                    disabled={isResuming}
                    className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    {isResuming ? "Reanudando..." : "Reanudar plan"}
                  </button>
                )}
                <button
                  onClick={async () => {
                    setIsChangingPlan(true);
                    setIsLoadingPlans(true);
                    try {
                      const plans = await membershipService.getActivePlans();
                      setAvailablePlans(plans.filter((p) => p.id !== currentPlan?.id));
                    } catch {
                      toast.error("No se pudieron cargar los planes");
                    } finally {
                      setIsLoadingPlans(false);
                    }
                  }}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cambiar plan
                </button>
              </div>

              {isChangingPlan && (
                <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">
                    Planes disponibles
                  </h4>
                  {currentPlan && Number(currentPlan.price) > 0 && daysRemaining && daysRemaining > 0 && (
                    <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-sm text-emerald-800">
                      Tienes {daysRemaining} días restantes de tu plan actual (
                      {currentPlan.name}). Al cambiar, se te descontará
                      aproximadamente $
                      {Math.round(
                        (Number(currentPlan.price) / 30) * daysRemaining
                      ).toLocaleString("es-CL")}{" "}
                      del precio del nuevo plan.
                    </div>
                  )}
                  {isLoadingPlans ? (
                    <p className="text-sm text-slate-500">Cargando planes...</p>
                  ) : availablePlans.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No hay otros planes disponibles.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {availablePlans.map((plan) => (
                        <div
                          key={plan.id}
                          className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {plan.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              ${Number(plan.price).toLocaleString("es-CL")}/mes
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              setUpgradingPlanId(plan.id);
                              try {
                                if (Number(plan.price) === 0) {
                                  await membershipService.selectFreePlan(plan.id);
                                  toast.success(`Cambiado a ${plan.name}`);
                                } else if (mode === "real") {
                                  const result = await membershipService.createPreference(plan.id);
                                  if (result.init_point) {
                                    window.location.href = result.init_point;
                                    return;
                                  }
                                  throw new Error("No se obtuvo link de pago");
                                } else {
                                  const result = await membershipService.checkout(plan.id);
                                  if (result.proratedCredit && result.proratedCredit > 0) {
                                    toast.success(
                                      `Plan ${plan.name} activado. Se descontaron $${result.proratedCredit.toLocaleString("es-CL")} por los días no usados de tu plan anterior.`,
                                      { duration: 6000 }
                                    );
                                  } else {
                                    toast.success(`Plan ${plan.name} activado`);
                                  }
                                }
                                await refreshSubscription();
                                setIsChangingPlan(false);
                              } catch (e: any) {
                                toast.error(e?.message || "Error al cambiar plan");
                              } finally {
                                setUpgradingPlanId(null);
                              }
                            }}
                            disabled={upgradingPlanId === plan.id}
                            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {upgradingPlanId === plan.id
                              ? "..."
                              : Number(plan.price) === 0
                                ? "Gratis"
                                : "Elegir"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">
                No tienes un plan activo.
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Selecciona un plan para comenzar.
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={async () => {
          setIsCanceling(true);
          try {
            await membershipService.cancelSubscription();
            toast.success("Tu plan se cancelará al final del período actual");
            await refreshSubscription();
          } catch (e: any) {
            toast.error(e?.message || "Error al cancelar");
          } finally {
            setIsCanceling(false);
            setIsCancelConfirmOpen(false);
          }
        }}
        title="Cancelar plan"
        description="Tu plan se cancelará al final del período actual. Seguirás teniendo acceso hasta esa fecha. Puedes reanudar tu plan en cualquier momento antes de que termine."
        confirmText="Sí, cancelar al vencimiento"
        cancelText="Volver"
        isLoading={isCanceling}
      />

    </div>
  );
}
