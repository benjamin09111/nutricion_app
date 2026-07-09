"use client";

import content from "@/content/landing.json";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchApi } from "@/lib/api-base";
import {
  Check,
  Zap,
  ShieldCheck,
  Monitor,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMembershipFeatureDisplay } from "@/features/memberships/utils/feature-format";
import { type MembershipPlan } from "@/features/memberships/services/membership.service";
import LandingContactForm from "@/components/landing/LandingContactForm";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  useEffect(() => {
    fetchApi(`/memberships/active`)
      .then((res) => res.json())
      .then((data) => setPlans(data))
      .catch(() => {});
  }, []);

  const { ref: featuresRef, isInView: isFeaturesInView } = useInView({
    threshold: 0.15,
  });
  const { ref: pricingRef, isInView: isPricingInView } = useInView({
    threshold: 0.15,
  });
  const { ref: registrationRef, isInView: isRegistrationInView } = useInView({
    threshold: 0.1,
  });
  const visiblePlans = plans.filter((plan) => plan.isActive);
  const sortedPlans = [...visiblePlans].sort((a, b) => {
    const aFree = Number(a.price) === 0;
    const bFree = Number(b.price) === 0;

    if (aFree !== bFree) {
      return aFree ? -1 : 1;
    }

    if (a.isPopular !== b.isPopular) {
      return a.isPopular ? -1 : 1;
    }

    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a[href^='#']");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const targetId = href.slice(1);
      const targetElement = document.getElementById(targetId);
      if (!targetElement) return;

      e.preventDefault();
      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "NutriNet",
            url: "https://nutrinet.cl",
            potentialAction: {
              "@type": "SearchAction",
              target:
                "https://nutrinet.cl/nutricionistas?search={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "NutriNet",
            url: "https://nutrinet.cl",
            logo: "https://nutrinet.cl/logo_2.webp",
            areaServed: "CL",
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "NutriNet",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "Software para nutricionistas en Chile para gestionar pacientes, dietas y consultas.",
            url: "https://nutrinet.cl",
          },
        ]}
      />
      {/* Header / Nav */}
      <header className="fixed top-0 z-50 w-full border-b border-indigo-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Image
              src="/logo_2.webp"
              alt="nutrinet"
              width={160}
              height={50}
              className="h-auto w-[118px] object-contain transition-transform duration-300 hover:scale-105 sm:w-[148px]"
              priority
            />
          </div>
          <nav
            className="hidden items-center gap-5 lg:flex"
            role="navigation"
            aria-label="Navegación principal"
          >
            <a
              href="#planes"
              className="relative text-sm font-semibold transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#a88aed] after:transition-all after:duration-300 hover:after:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88aed] focus-visible:ring-offset-2 rounded text-[#a88aed] hover:text-[#8f70d8]"
            >
              Planes
            </a>
            <Link
              href="/login"
              className="relative text-sm font-semibold transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#a88aed] after:transition-all after:duration-300 hover:after:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88aed] focus-visible:ring-offset-2 rounded text-[#a88aed] hover:text-[#8f70d8]"
            >
              Inicia Sesión
            </Link>
            <Link href="/login">
              <Button className="rounded-full h-10 px-6 text-xs font-bold uppercase tracking-wider bg-[#a88aed] hover:bg-[#8f70d8] text-white transition-all duration-300 hover:scale-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88aed] focus-visible:ring-offset-2">
                Empieza Gratis
              </Button>
            </Link>
          </nav>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-[#a88aed]/20 bg-white p-2 text-[#a88aed] shadow-sm transition hover:bg-[#a88aed]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88aed] focus-visible:ring-offset-2 lg:hidden"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-indigo-100 bg-white/95 px-4 py-4 shadow-lg backdrop-blur-md lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3">
              <a
                href="#planes"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#a88aed]/20 hover:bg-[#a88aed]/5 hover:text-[#8f70d8]"
              >
                Planes
              </a>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#a88aed]/20 hover:bg-[#a88aed]/5 hover:text-[#8f70d8]"
              >
                Inicia Sesión
              </Link>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-[#a88aed] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#8f70d8]"
              >
                Empieza Gratis
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-44 lg:pb-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-medium transition-all duration-300 hover:scale-105 sm:px-5 sm:text-sm",
                  "bg-[#a88aed]/10 text-[#a88aed] border-[#a88aed]/30",
                )}
              >
                <Sparkles className="h-4 w-4" />
                {content.hero.badge}
              </div>

              <div className="space-y-2">
                <h1
                  className="text-4xl font-black leading-none tracking-tight sm:text-5xl lg:text-8xl"
                  style={{
                    WebkitTextStroke: "4px #a6c261",
                    color: "transparent",
                    fontWeight: 900,
                  }}
                >
                  {content.hero.titleLine1}
                </h1>
                <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
                  <span className="text-2xl font-bold tracking-tight text-[#a88aed] sm:text-3xl lg:text-5xl">
                    {content.hero.titleLine2}
                  </span>
                  <div className="flex gap-1">
                    <Check className="h-6 w-6 text-[#a6c261] sm:h-8 sm:w-8" />
                    <Check className="h-6 w-6 text-[#a6c261] sm:h-8 sm:w-8" />
                  </div>
                </div>
              </div>

              <p className="mx-auto max-w-2xl text-base italic leading-relaxed text-[#a88aed] sm:text-lg lg:text-xl">
                {content.hero.description}
              </p>

              <div className="pt-4">
                <Link href="/login">
                  <span className="group inline-flex items-center gap-2 rounded-full bg-[#a6c261] px-7 py-3 text-base font-bold italic text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#8da84f] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a6c261] focus-visible:ring-offset-2 sm:px-10 sm:py-4 sm:text-lg">
                    {content.hero.ctaButton}
                    <span className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                      🚀
                    </span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          ref={featuresRef}
          className={cn(
            "py-16 transition-all duration-700 sm:py-20 lg:py-28",
            "bg-slate-50",
            isFeaturesInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8",
          )}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
              {content.features.cards.map((feature, idx) => {
                const iconMap = { Zap, Monitor, ShieldCheck };
                const Icon = iconMap[feature.icon as keyof typeof iconMap];
                const iconBgColors = {
                  amber: "bg-amber-50 text-amber-600",
                  indigo: "bg-indigo-50 text-indigo-600",
                  emerald: "bg-emerald-50 text-emerald-600",
                };
                const delays = ["delay-100", "delay-200", "delay-300"];

                return (
                  <div
                    key={idx}
                    className={cn(
                      "group cursor-pointer rounded-2xl border p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl sm:p-8",
                      delays[idx],
                      "bg-white border-slate-200 shadow-md hover:border-[#a88aed]/40 hover:shadow-[#a88aed]/10",
                    )}
                  >
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                        iconBgColors[
                          feature.iconColor as keyof typeof iconBgColors
                        ],
                      )}
                    >
                      {Icon && <Icon className="h-6 w-6" />}
                    </div>
                    <h3
                      className={cn(
                        "text-lg font-bold mb-3 transition-colors duration-300",
                        "text-indigo-900 group-hover:text-[#a88aed]",
                      )}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        "text-slate-600",
                      )}
                    >
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="planes"
          ref={pricingRef}
          className={cn(
            "py-16 transition-all duration-700 lg:py-24",
            isPricingInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8",
          )}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="space-y-8 mb-12 text-center">
              <span
                className="block text-4xl font-black tracking-tight sm:text-5xl lg:text-7xl"
                style={{
                  WebkitTextStroke: "3px #a6c261",
                  color: "transparent",
                  fontWeight: 900,
                }}
              >
                {content.pricing.titleLine1}
              </span>
              <span className="block text-2xl font-bold text-[#a88aed] sm:text-3xl lg:text-4xl">
                {content.pricing.titleLine2} 🌱
              </span>
            </div>

            {/* Launch Offer Banner */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-xl">
                <Sparkles className="h-4 w-4" />
                OFERTA DE LANZAMIENTO: $19.990/mes para las primeras 20 personas (Precio regular $25.000)
              </div>
            </div>

            <div
              className={cn(
                "grid gap-6 xl:gap-8",
                sortedPlans.length === 1
                  ? "mx-auto max-w-2xl lg:grid-cols-1"
                  : sortedPlans.length === 2
                    ? "mx-auto max-w-5xl lg:grid-cols-2"
                    : "lg:grid-cols-3",
              )}
            >
              {sortedPlans.map((plan) => {
                const isPopular = plan.isPopular;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col rounded-3xl bg-white text-center transition-all duration-500",
                      sortedPlans.length === 1 && "w-full",
                      isPopular
                        ? "border-2 border-[#a88aed] shadow-[0_20px_60px_rgba(168,138,237,0.25)] lg:scale-105 z-10"
                        : "border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1",
                    )}
                  >
                    {isPopular && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-6 py-2 rounded-full shadow-lg">
                        ⭐ Más Popular
                      </div>
                    )}
                    <div
                      className={cn(
                        "flex flex-col flex-1 p-6 sm:p-8",
                        isPopular ? "pt-10" : "pt-6",
                      )}
                    >
                      <div className="mb-6">
                        <h3
                          className={cn(
                            "text-xl font-bold mb-2",
                            isPopular ? "text-indigo-700" : "text-slate-900",
                          )}
                        >
                          {plan.name}
                        </h3>
                        <div className="flex flex-col items-center justify-center gap-1">
                          {plan.slug === "pro" && (
                            <span className="text-sm font-semibold text-slate-400 line-through">
                              $25.000 / mes
                            </span>
                          )}
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-5xl font-black tracking-tight text-slate-900">
                              ${Number(plan.price).toLocaleString("es-CL")}
                            </span>
                            <span className="text-slate-500 text-sm">/mes</span>
                          </div>
                        </div>
                        {plan.description && (
                          <p className="mt-3 text-sm text-slate-500">
                            {plan.description}
                          </p>
                        )}
                      </div>

                      <ul className="mb-8 space-y-3 text-left flex-1">
                        {(Array.isArray(plan.features)
                          ? plan.features
                          : JSON.parse(plan.features || "[]")
                        ).map((feature: string, idx: number) => {
                          const featureDisplay =
                            getMembershipFeatureDisplay(feature);

                          return (
                            <li key={idx} className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "mt-0.5 rounded-full p-0.5",
                                  featureDisplay.isExcluded
                                    ? "bg-red-100"
                                    : isPopular
                                      ? "bg-indigo-100"
                                      : "bg-slate-100",
                                )}
                              >
                                {featureDisplay.isExcluded ? (
                                  <X className="h-3.5 w-3.5 text-red-500" />
                                ) : (
                                  <Check
                                    className={cn(
                                      "h-3.5 w-3.5",
                                      isPopular
                                        ? "text-indigo-600"
                                        : "text-slate-500",
                                    )}
                                  />
                                )}
                              </div>
                              <span className="text-sm text-slate-700">
                                {featureDisplay.label}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 flex flex-col items-center gap-4 text-center">
              <p className="text-sm font-medium text-slate-600">
                Inicia con Google o escríbenos si tienes dudas
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/login" className="cursor-pointer rounded-full bg-[#a88aed] px-8 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#8f70d8]">
                  Iniciar con Google
                </Link>
                <a href="#contacto" className="cursor-pointer rounded-full border border-[#a88aed]/20 bg-white px-8 py-3 text-sm font-bold text-[#a88aed] shadow-sm transition-all duration-300 hover:border-[#a88aed]/35 hover:bg-[#a88aed]/5">
                  Enviar mensaje
                </a>
              </div>
            </div>
            <p className="mt-8 text-center text-sm text-slate-500">
              Google-only para acceso. Te responderemos por correo electrónico.
            </p>
          </div>
        </section>

        {/* Access and Contact Section */}
        <section
          id="contacto"
          ref={registrationRef}
          className={cn(
            "py-16 transition-all duration-700 sm:py-20 lg:py-24",
            isRegistrationInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8",
          )}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="space-y-6 pt-1 sm:pt-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#a88aed]/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#a88aed] shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                  Acceso con Google
                </div>
                <h2 className="text-3xl font-black text-[#a88aed] sm:text-4xl lg:text-5xl">
                  {content.registration.titleLine1}
                </h2>
                <div className="flex items-start gap-3 sm:items-center">
                  <Check className="mt-1 h-7 w-7 shrink-0 text-[#a6c261] sm:mt-0 sm:h-8 sm:w-8" />
                  <p className="text-xl font-semibold text-[#a88aed] sm:text-2xl lg:text-3xl">
                    {content.registration.titleLine2}
                  </p>
                </div>
                <p className="text-lg font-semibold italic text-[#a88aed] sm:text-xl">
                  {content.registration.subtitle}
                </p>
                <div className="space-y-3 text-sm leading-relaxed text-[#a88aed] sm:text-base">
                  <p>{content.registration.paragraph1}</p>
                  <p>{content.registration.paragraph2}</p>
                  <p>{content.registration.paragraph3}</p>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link href="/login" className="cursor-pointer rounded-full bg-[#a88aed] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#8f70d8]">
                    Iniciar sesión con Google
                  </Link>
                  <a href="#contacto" className="cursor-pointer rounded-full border border-[#a88aed]/20 bg-white px-6 py-3 text-sm font-bold text-[#a88aed] shadow-sm transition-all duration-300 hover:border-[#a88aed]/35 hover:bg-[#a88aed]/5">
                    Ir al formulario
                  </a>
                </div>
              </div>

              <div
                className={cn(
                  "rounded-3xl border border-[#a88aed]/15 bg-white/70 p-5 shadow-[0_18px_50px_rgba(168,138,237,0.12)] backdrop-blur-sm transition-all duration-500 hover:shadow-[0_24px_60px_rgba(168,138,237,0.18)] sm:p-8 lg:p-10",
                  "bg-[#a88aed]/10",
                )}
              >
                <div className="mb-5 space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#a88aed] shadow-sm">
                    {content.registration.formTitle}
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-[#a88aed]">
                    Escríbenos tu pregunta
                  </h3>
                  <p className="text-sm leading-6 text-slate-600">
                    Tu mensaje se guardará en nuestro inbox y te responderemos por correo electrónico.
                  </p>
                </div>
                <LandingContactForm />
              </div>
            </div>

            <p className="mt-10 text-center text-sm italic text-[#a6c261] sm:text-base">
              {content.registration.encryptionText}
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className={cn(
          "py-16 transition-colors duration-300 lg:py-20",
          "bg-[#a88aed]/5",
        )}
      >
        <div className="mx-auto max-w-7xl space-y-6 px-4 text-center sm:px-6">
          <div className="flex items-center justify-center gap-2">
            <Image
              src="/logo_2.webp"
              alt="nutrinet"
              width={200}
              height={63}
              className="h-auto w-[150px] object-contain transition-transform duration-300 hover:scale-105 lg:w-[190px]"
            />
          </div>
          <div className="space-y-1">
            <p className={cn("text-base", "text-[#a88aed]")}>
              {content.footer.line1}
            </p>
            <p className={cn("text-base", "text-[#a88aed]")}>
              {content.footer.line2}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-[#a88aed]/75">
            <Link
              href="/privacy-policy"
              className="transition-colors hover:text-[#8f70d8]"
            >
              Política de Privacidad
            </Link>
            <span className="text-[#a88aed]/30">•</span>
            <Link
              href="/terms"
              className="transition-colors hover:text-[#8f70d8]"
            >
              Términos de Servicio
            </Link>
          </div>
          <div className={cn("text-sm pt-4", "text-[#a88aed]/60")}>
            {content.footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
