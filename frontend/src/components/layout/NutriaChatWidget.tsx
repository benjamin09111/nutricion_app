"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { MessageCircle, Minus, Send, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getTutorialRegistryEntryForPath } from "@/lib/tutorials";
import { useTheme } from "@/context/ThemeContext";

const NUTRIA_ROUTE_MESSAGES: Array<{
  pattern: string;
  moduleLabel: string;
  message: string;
}> = [
  {
    pattern: "/dashboard/rapido/recetas",
    moduleLabel: "Recetas rápidas",
    message:
      "Aquí iré guiándote para reunir alimentos, indicaciones y recetas breves sin perderte entre tantas opciones.",
  },
  {
    pattern: "/dashboard/rapido",
    moduleLabel: "Entregable rápido",
    message:
      "Aquí te ayudaré a entender cómo construir un entregable express claro, útil y listo para compartir con tu paciente.",
  },
  {
    pattern: "/dashboard/pacientes/:id",
    moduleLabel: "Ficha del paciente",
    message:
      "Esta es la vista de paciente, puedes:\n\n- Ver la información del paciente e incluso cálculos automáticos como **IMC**.\n\n- **Pestaña general**: información del paciente, puedes editarla en el menú lateral derecho.\n\n- **Pestaña consultas**: puedes crear y ver consultas asociadas a este paciente. Una consulta es un registro de una consulta realizada.\n\n- **Pestaña creaciones**: cualquier receta o documento asignado a este paciente aparecerá aquí.\n\n- **Pestaña progreso**: puedes ver la evolución del paciente de distintas métricas, añadiendo manualmente o registrándolas en cada consulta. Puedes descargarlo para compartirlo con el paciente.\n\n- Arriba, verás el botón de **Portal paciente**. Esto permite generar un link para compartir con el paciente, creando un espacio de comunicación entre ambos. Aquí puedes ver lo que el paciente escribe, las preguntas que te deja, responderlas, y compartirle documentos, entre otros. Se activará la pestaña de acompañamiento cuando le compartas el link y el paciente entre con el código que se le envía.\n\n- Más abajo, puedes marcar como **inactivo** a un paciente, el cual ya has dejado de atender o quieres 'olvidar'.",
  },
  {
    pattern: "/dashboard/pacientes",
    moduleLabel: "Pacientes",
    message:
      "Aquí te iré orientando para gestionar tu listado de pacientes, encontrarlos rápido y entrar al expediente correcto sin perder tiempo.",
  },
  {
    pattern: "/dashboard/consultas/nueva",
    moduleLabel: "Nueva consulta",
    message:
      "Aquí podré acompañarte paso a paso para registrar una consulta nueva y dejar lista la información clínica importante.",
  },
  {
    pattern: "/dashboard/consultas",
    moduleLabel: "Consultas",
    message:
      "Aquí te ayudaré a entender cómo revisar, ordenar y reutilizar mejor tus consultas clínicas.",
  },
  {
    pattern: "/dashboard/recetas",
    moduleLabel: "Recetas y porciones",
    message:
      "Aquí podré explicarte cómo usar recetas, porciones y planificación para avanzar más rápido dentro del flujo clínico.",
  },
  {
    pattern: "/dashboard/citas",
    moduleLabel: "Citas",
    message:
      "En esta vista puedes:\n\n- Modificar tus horarios laborales en cualquier momento.\n- Crear una cita haciendo clic sobre un bloque libre.\n- Conectar Google Calendar para coordinar notificaciones.\n- Revisar las pestañas de citas.\n- Partir con horario por defecto de 8:00 a 16:00.\n- Pasa el cursor o haz clic encima de cada acción para ver qué hace.",
  },
  {
    pattern: "/dashboard/carrito",
    moduleLabel: "Carrito",
    message:
      "Aquí te ayudaré a entender cómo convertir recetas y planificación en una compra clara, práctica y fácil de ajustar.",
  },
  {
    pattern: "/dashboard/entregable",
    moduleLabel: "Entregable",
    message:
      "Aquí podré orientarte para revisar, personalizar y dejar más pulido el material final que compartes con tu paciente.",
  },
  {
    pattern: "/dashboard/alimentos",
    moduleLabel: "Alimentos",
    message:
      "En esta vista puedes ver los alimentos de la **Tabla de composición de alimentos INTA (2018)**. Puedes revisar la información de cada uno, además de marcarlos como **favoritos** (para recomendarlos en tus dietas), como **no recomendados** (para no recomendar ciertos alimentos en tus dietas), añadirles **tags** y crear ingredientes por si quieres utilizarlos. Además de ver ingredientes creados por otros nutricionistas. Sí, los ingredientes que crees, se comparten entre todos.",
  },
  {
    pattern: "/dashboard/herramientas/porciones-intercambio",
    moduleLabel: "Información de cálculos",
    message:
      "Aquí puedes revisar la **información y tablas de referencia** sobre porciones de intercambio, fundamentales para estandarizar tus cálculos nutricionales.",
  },
  {
    pattern: "/dashboard/herramientas/calculos",
    moduleLabel: "Calculadora clínica",
    message:
      "Esta es una **Mini calculadora clínica**. Sirve para validar rápido cuántos intercambios representa un alimento real.",
  },
  {
    pattern: "/dashboard/configuraciones",
    moduleLabel: "Configuraciones",
    message:
      "Aquí te ayudaré a ubicar tus preferencias, ajustes de cuenta y otras opciones importantes para dejar NutriNet a tu gusto.",
  },
  {
    pattern: "/dashboard/alimentos/grupos",
    moduleLabel: "Grupos de ingredientes",
    message:
      "Aquí puedes crear **grupos de ingredientes** y reutilizarlos cuando sea útil; todo depende de tu propio orden y organización. Seleccionarás ingredientes y crearás grupos personalizados. Más adelante, tenemos pensado la idea de agrupar **Recetas y Platos**.",
  },
  {
    pattern: "/dashboard/detalles",
    moduleLabel: "Detalles",
    message:
      "En esta vista, puedes crear configuraciones para reutilizarlas en distintos módulos de la página, principalmente por temas de orden y para no repetir datos entre nutricionistas.\n\n- **Crear restricciones**: incluimos algunas, pero puedes crear restricciones clínicas adicionales para enriquecer tu contenido.\n\n- **Etiquetas**: para reutilizar tus tags en la página. Por ejemplo 'Barato', puedes colocar este tag en varios lugares.\n\n- **Métricas**: son las métricas que queremos monitorear y ver el progreso en los pacientes. He añadido las principales, pero si se te ocurre otra, ¡prueba crearla!",
  },
];

const normalizePath = (pathname: string) =>
  pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

const matchesPattern = (pathname: string, pattern: string) => {
  const normalizedPath = normalizePath(pathname);
  const normalizedPattern = normalizePath(pattern);

  if (normalizedPattern.includes(":")) {
    const pathSegments = normalizedPath.split("/").filter(Boolean);
    const patternSegments = normalizedPattern.split("/").filter(Boolean);

    if (pathSegments.length !== patternSegments.length) {
      return false;
    }

    return patternSegments.every((segment, index) => {
      if (segment.startsWith(":")) {
        return pathSegments[index]?.length > 0;
      }

      return pathSegments[index] === segment;
    });
  }

  if (normalizedPattern.endsWith("/*")) {
    const prefix = normalizedPattern.slice(0, -2);
    return (
      normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
    );
  }

  return normalizedPath === normalizedPattern;
};

const getCurrentModuleHelp = (pathname: string) => {
  const explicitMatch = NUTRIA_ROUTE_MESSAGES.find((entry) =>
    matchesPattern(pathname, entry.pattern),
  );

  if (explicitMatch) {
    return explicitMatch;
  }

  const registryEntry = getTutorialRegistryEntryForPath(pathname);
  if (registryEntry) {
    return {
      moduleLabel: registryEntry.label,
      message: `Aquí podré ayudarte con el módulo actual: **${registryEntry.label}**. Más adelante te iré explicando mejor cada parte de esta vista.`,
    };
  }

  return {
    moduleLabel: "Dashboard",
    message:
      "En esta vista, puedes ver un resumen y atajos rápidos dentro de la plataforma, estadísticas simples, pues es una página principal.",
  };
};

const renderInlineRichText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-black text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
};

export function NutriaChatWidget() {
  const pathname = usePathname();
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);


  const moduleHelp = useMemo(
    () => getCurrentModuleHelp(pathname || "/dashboard"),
    [pathname],
  );

  const welcomeMessage = useMemo(
    () =>
      `¡Bienvenido! Aún están trabajando en mí, pero puedo ayudarte con el módulo actual: **${moduleHelp.moduleLabel}**.\n\n${moduleHelp.message}`,
    [moduleHelp],
  );

  const allowedPatterns = [
    "/dashboard",
    "/dashboard/pacientes/:id",
    "/dashboard/alimentos",
    "/dashboard/alimentos/grupos",
    "/dashboard/citas",
    "/dashboard/detalles",
    "/dashboard/herramientas/calculos",
    "/dashboard/herramientas/porciones-intercambio",
  ];
  const isAllowed = allowedPatterns.some((pattern) =>
    matchesPattern(pathname || "", pattern),
  );

  if (!isAllowed) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <div
          className={cn(
            "pointer-events-auto w-[min(24rem,calc(100vw-1.5rem))] max-h-[min(35rem,calc(100vh-8rem))] overflow-hidden rounded-[2rem] border shadow-[0_30px_90px_-35px_rgba(88,28,135,0.45)] flex flex-col",
            isDarkMode
              ? "border-violet-400/20 bg-[#120c24]"
              : "border-violet-100 bg-white",
          )}
        >
          <div className="bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/25 bg-white/10 shadow-inner">
                  <Image
                    src="/circle_logo.webp"
                    alt="Nutria asistente"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-black tracking-wide">Nutria</p>
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em]">
                    <Sparkles className="h-3 w-3" />
                    Beta asistida
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                  aria-label="Minimizar chat"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                  aria-label="Cerrar chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar",
              isDarkMode ? "bg-[#120c24]" : "bg-[#fbf8ff]",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-violet-200/70 bg-white shadow-sm">
                <Image
                  src="/nutria.webp"
                  alt="Nutria"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="max-w-[calc(100%-3.25rem)] rounded-[1.6rem] rounded-tl-md bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm ring-1 ring-violet-100">
                {welcomeMessage.split("\n\n").map((paragraph, index) => (
                  <p
                    key={`${paragraph}-${index}`}
                    className={cn(index > 0 ? "mt-3" : "", "whitespace-pre-line")}
                  >
                    {renderInlineRichText(paragraph)}
                  </p>
                ))}
              </div>
            </div>

          </div>

          <div
            className={cn(
              "px-4 pb-4 pt-1",
              isDarkMode ? "bg-[#120c24]" : "bg-[#fbf8ff]",
            )}
          >
            <div
              className={cn(
                "rounded-[1.4rem] border px-3 py-3",
                isDarkMode
                  ? "border-violet-400/15 bg-white/5"
                  : "border-violet-100 bg-white",
              )}
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value=""
                  readOnly
                  placeholder="Pronto podré responderte por aquí..."
                  className={cn(
                    "h-11 flex-1 bg-transparent text-sm outline-none placeholder:font-medium",
                    isDarkMode
                      ? "text-violet-50 placeholder:text-violet-100/45"
                      : "text-slate-700 placeholder:text-slate-400",
                  )}
                />
                <button
                  type="button"
                  disabled
                  className="inline-flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-full bg-violet-200 text-white opacity-80"
                  aria-label="Enviar mensaje"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="pointer-events-auto relative inline-flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 shadow-[0_22px_40px_-20px_rgba(126,34,206,0.75)] transition-transform hover:scale-[1.04] active:scale-95"
        aria-label={isOpen ? "Cerrar chat de Nutria" : "Abrir chat de Nutria"}
      >
        <div className="absolute inset-[3px] overflow-hidden rounded-full border border-white/25">
          <Image
            src="/circle_logo.webp"
            alt="Nutria"
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-400 px-1 text-[10px] font-black text-slate-900">
          <MessageCircle className="h-3 w-3" />
        </div>
      </button>
    </div>
  );
}
