"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, MessageCircle, Minus, Send, Sparkles, X } from "lucide-react";

import chatContent from "@/content/nutria-chat.json";
import { useTheme } from "@/context/ThemeContext";
import { matchesPattern } from "@/lib/route-matching";
import { cn } from "@/lib/utils";

type ChatLink = {
  label: string;
  href: string;
};

type ChatRouteContent = {
  routePatterns: string[];
  moduleLabel: string;
  message: string;
  links?: ChatLink[];
};

type ChatConfig = {
  default: {
    moduleLabel: string;
    message: string;
    links?: ChatLink[];
  };
  routes: ChatRouteContent[];
};

const chatConfig = chatContent as ChatConfig;

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

const getCurrentModuleHelp = (pathname: string) => {
  const explicitMatch = chatConfig.routes.find((entry) =>
    entry.routePatterns.some((pattern) => matchesPattern(pathname, pattern)),
  );

  if (explicitMatch) {
    return explicitMatch;
  }

  return {
    moduleLabel: chatConfig.default.moduleLabel,
    message: chatConfig.default.message,
    links: chatConfig.default.links,
  };
};

export function NutriaChatWidget() {
  const pathname = usePathname();
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const normalizedPathname = pathname || "/dashboard";
  const isAllowed = normalizedPathname.startsWith("/dashboard") && !normalizedPathname.startsWith("/dashboard/admin");

  const moduleHelp = useMemo(
    () => getCurrentModuleHelp(normalizedPathname),
    [normalizedPathname],
  );

  const welcomeMessage = useMemo(
    () =>
      `¡Bienvenido! Aún estoy en beta, pero puedo ayudarte con el módulo actual: **${moduleHelp.moduleLabel}**.\n\n${moduleHelp.message}`,
    [moduleHelp],
  );

  if (!isAllowed) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <div
          className={cn(
            "pointer-events-auto flex max-h-[min(35rem,calc(100vh-8rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[2rem] border shadow-[0_30px_90px_-35px_rgba(88,28,135,0.45)]",
            isDarkMode ? "border-violet-400/20 bg-[#120c24]" : "border-violet-100 bg-white",
          )}
        >
          <div className="bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-500 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/25 bg-white/10 shadow-inner">
                  <Image src="/circle_logo.webp" alt="Nutria asistente" fill sizes="48px" className="object-cover" />
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
              "flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar",
              isDarkMode ? "bg-[#120c24]" : "bg-[#fbf8ff]",
            )}
          >
            <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 shadow-sm">
              <div className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">Primero revisa esto</div>
              <p className="font-medium">
                Si tienes una duda, visita{" "}
                <Link href="/dashboard/preguntas-frecuentes" className="font-black underline decoration-amber-400 underline-offset-2 transition hover:text-amber-950 cursor-pointer">
                  Preguntas frecuentes
                </Link>{" "}
                antes de seguir conmigo.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-violet-200/70 bg-white shadow-sm">
                 <Image src="/nutria.webp" alt="Nutria" fill sizes="40px" className="object-cover" />
              </div>
              <div className="max-w-[calc(100%-3.25rem)] rounded-[1.6rem] rounded-tl-md bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm ring-1 ring-violet-100">
                {welcomeMessage.split("\n\n").map((paragraph, index) => (
                  <p key={`${paragraph}-${index}`} className={cn(index > 0 ? "mt-3" : "", "whitespace-pre-line")}>
                    {renderInlineRichText(paragraph)}
                  </p>
                ))}

                {moduleHelp.links?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {moduleHelp.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 cursor-pointer"
                      >
                        {link.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className={cn("px-4 pb-4 pt-1", isDarkMode ? "bg-[#120c24]" : "bg-[#fbf8ff]")}>
            <div className={cn("rounded-[1.4rem] border px-3 py-3", isDarkMode ? "border-violet-400/15 bg-white/5" : "border-violet-100 bg-white")}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value=""
                  readOnly
                  placeholder="Pronto podré responderte por aquí..."
                  className={cn(
                    "h-11 flex-1 bg-transparent text-sm outline-none placeholder:font-medium",
                    isDarkMode ? "text-violet-50 placeholder:text-violet-100/45" : "text-slate-700 placeholder:text-slate-400",
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
          <Image src="/circle_logo.webp" alt="Nutria" fill sizes="40px" className="object-cover" />
        </div>
        <div className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-400 px-1 text-[10px] font-black text-slate-900">
          <MessageCircle className="h-3 w-3" />
        </div>
      </button>
    </div>
  );
}
