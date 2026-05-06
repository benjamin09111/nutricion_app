"use client";

import { useState, useEffect } from "react";
import { User, Lock, Save, Eye, EyeOff, Sun, Moon, Type, FileText } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authService } from "@/features/auth/services/auth.service";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { useTheme } from "@/context/ThemeContext";
import { useFont } from "@/context/FontContext";

interface UserSettings {
  professionalInstagram?: string;
  professionalPhone?: string;
  professionalEmail?: string;
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
  const { theme, setTheme } = useTheme();
  const { fontPreference, setFontPreference } = useFont();
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
      } catch (e) {
        console.error("Error loading user data", e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm font-medium">
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
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm font-medium">
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
                    className="pr-10"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
              <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                    className="pr-10"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    className="pr-10"
                    placeholder="Repite tu nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
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

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm font-medium">
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

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm font-medium">
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

    </div>
  );
}
