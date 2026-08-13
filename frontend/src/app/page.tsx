"use client";

import content from "@/content/landing.json";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-base";
import {
  Check,
  Zap,
  ShieldCheck,
  Monitor,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  Target,
  Users,
  HelpCircle,
  HeartPulse,
  Star,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMembershipFeatureDisplay } from "@/features/memberships/utils/feature-format";
import { type MembershipPlan } from "@/features/memberships/services/membership.service";
import { sortPlansForLanding } from "@/features/memberships/utils/sort-plans";
import LandingContactForm from "@/components/landing/LandingContactForm";
import { RotatingWord } from "@/components/landing/RotatingWord";
import { CookieBanner } from "@/components/landing/CookieBanner";
import {
  AboutNutriNetModal,
  type AboutSectionTab,
} from "@/components/landing/AboutNutriNetModal";
import { AboutNutriNetNavExtension } from "@/components/landing/AboutNutriNetNavExtension";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";

const toMembershipPlanArray = (value: unknown): MembershipPlan[] => {
  let list: MembershipPlan[] = [];
  if (Array.isArray(value)) {
    list = value as MembershipPlan[];
  } else if (value && typeof value === "object") {
    const payload = value as { data?: unknown; plans?: unknown; items?: unknown };
    if (Array.isArray(payload.data)) list = payload.data as MembershipPlan[];
    else if (Array.isArray(payload.plans)) list = payload.plans as MembershipPlan[];
    else if (Array.isArray(payload.items)) list = payload.items as MembershipPlan[];
  }
  return list;
};

export default function LandingPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isAboutDropdownOpen, setIsAboutDropdownOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [aboutModalTab, setAboutModalTab] = useState<AboutSectionTab>("objetivos");
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchApi(`/memberships/active`)
      .then((res) => res.json())
      .then((data) => setPlans(toMembershipPlanArray(data)))
      .catch(() => {});
  }, []);

  // Close About dropdown when clicking outside header
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(e.target as Node)
      ) {
        setIsAboutDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openAboutTab = (tab: AboutSectionTab) => {
    setIsAboutDropdownOpen(false);
    setIsMobileMenuOpen(false);
    router.push(`/sobre-nutrinet?tab=${tab}`);
  };

  const { ref: featuresRef, isInView: isFeaturesInView } = useInView({
    threshold: 0.15,
  });
  const { ref: pricingRef, isInView: isPricingInView } = useInView({
    threshold: 0.15,
  });
  const { ref: registrationRef, isInView: isRegistrationInView } = useInView({
    threshold: 0.1,
  });
  const visiblePlans = plans.filter((plan) => plan.isActive || plan.isComingSoon);
  const sortedPlans = sortPlansForLanding(visiblePlans);
  const paidPlan = visiblePlans.find((plan) => Number(plan.price) > 0 && !plan.isComingSoon);

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
      <header ref={headerRef} className="fixed top-0 z-50 w-full border-b border-indigo-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Image
                src="/logo_2.webp"
                alt="nutrinet"
                width={160}
                height={50}
                className="h-auto w-[118px] object-contain transition-transform duration-300 hover:scale-105 sm:w-[148px]"
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </Link>
          </div>
          <nav
            className="hidden items-center gap-6 lg:flex"
            role="navigation"
            aria-label="Navegación principal"
          >
            {/* Sobre NutriNet Link that expands navbar */}
            <button
              type="button"
              onClick={() => setIsAboutDropdownOpen(!isAboutDropdownOpen)}
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-bold transition-all py-2 px-3 rounded-full cursor-pointer",
                isAboutDropdownOpen
                  ? "bg-[#a88aed] text-white shadow-md shadow-[#a88aed]/20"
                  : "text-[#a88aed] hover:text-[#8f70d8] hover:bg-[#a88aed]/10"
              )}
            >
              Sobre NutriNet
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isAboutDropdownOpen && "rotate-180")} />
            </button>

            <a
              href="#testimonios"
              className="text-sm font-semibold transition-colors duration-200 text-[#a88aed] hover:text-[#8f70d8]"
            >
              Testimonios
            </a>
            <a
              href="#planes"
              className="text-sm font-semibold transition-colors duration-200 text-[#a88aed] hover:text-[#8f70d8]"
            >
              Precios
            </a>
            <Link
              href="/login"
              className="text-sm font-semibold transition-colors duration-200 text-[#a88aed] hover:text-[#8f70d8]"
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

        {/* Expanded Horizontal Navbar Panel for Sobre NutriNet */}
        <AboutNutriNetNavExtension
          isOpen={isAboutDropdownOpen}
          onClose={() => setIsAboutDropdownOpen(false)}
          onSelectTab={(tab) => openAboutTab(tab)}
        />

        {/* Mobile Nav Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-indigo-100 bg-white/95 px-4 py-4 shadow-lg backdrop-blur-md lg:hidden space-y-3">
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-[#a88aed]">Sobre NutriNet</span>
                <div className="grid grid-cols-1 gap-1">
                  <button onClick={() => openAboutTab("objetivos")} className="text-left text-xs font-bold text-slate-700 py-1 flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-indigo-600" /> Objetivos y Dirección
                  </button>
                  <button onClick={() => openAboutTab("equipo")} className="text-left text-xs font-bold text-slate-700 py-1 flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-emerald-600" /> Equipo detrás de NutriNet
                  </button>
                  <button onClick={() => openAboutTab("faq")} className="text-left text-xs font-bold text-slate-700 py-1 flex items-center gap-2">
                    <HelpCircle className="h-3.5 w-3.5 text-amber-600" /> Preguntas frecuentes
                  </button>
                  <button onClick={() => openAboutTab("seguridad")} className="text-left text-xs font-bold text-slate-700 py-1 flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Seguridad de los datos
                  </button>
                  <button onClick={() => openAboutTab("salud")} className="text-left text-xs font-bold text-slate-700 py-1 flex items-center gap-2">
                    <HeartPulse className="h-3.5 w-3.5 text-rose-600" /> Salud y cuidado
                  </button>
                </div>
              </div>

              <a
                href="#testimonios"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#a88aed]/5"
              >
                Testimonios
              </a>
              <a
                href="#planes"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#a88aed]/5"
              >
                Precios
              </a>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#a88aed]/5"
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
                  className="text-3xl font-black leading-none tracking-tight sm:text-5xl lg:text-7xl xl:text-8xl min-h-[1.1em] flex items-center justify-center overflow-visible px-2"
                  style={{
                    WebkitTextStroke: "3px #a6c261",
                    color: "transparent",
                    fontWeight: 900,
                  }}
                >
                  <RotatingWord words={content.hero.titleWords || [content.hero.titleLine1]} />
                </h1>
                <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
                  <span className="text-2xl font-bold tracking-tight text-[#a88aed] sm:text-3xl lg:text-5xl">
                    {content.hero.titleLine2}
                  </span>
                </div>
              </div>

              <p className="mx-auto max-w-3xl text-base text-slate-600 sm:text-lg lg:text-xl leading-relaxed">
                {content.hero.description}
              </p>

              <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto rounded-full h-14 px-8 text-sm font-bold uppercase tracking-wider bg-[#a88aed] hover:bg-[#8f70d8] text-white transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-indigo-200">
                    {content.hero.ctaButton}
                  </Button>
                </Link>
                <a href="#testimonios" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto rounded-full h-14 px-8 text-sm font-bold text-[#a88aed] border-2 border-[#a88aed]/30 hover:border-[#a88aed] hover:bg-[#a88aed]/10 transition-all duration-300"
                  >
                    Ver Reseñas de Nutricionistas
                  </Button>
                </a>
              </div>

              {/* Trust Badges Bar */}
              <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Fichas 100% Cifradas (Ley 19.628)
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-500" /> Ahorro de 3+ Horas Diarias
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-indigo-600" /> Basado en Alimentos de Chile
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="funcionalidades"
          ref={featuresRef}
          className={cn(
            "py-16 transition-all duration-700 bg-slate-50/70 border-y border-slate-100 lg:py-24",
            isFeaturesInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8",
          )}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="space-y-4 mb-16 text-center max-w-3xl mx-auto">
              <span className="text-xs font-black uppercase tracking-wider text-[#a88aed]">Todo en un solo lugar</span>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl text-slate-900">
                Diseñado para simplificar tu consulta clínica
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                NutriNet combina automatización inteligente, precisión nutricional y seguridad de datos para que te concentres en el cuidado de tus pacientes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-[#a88aed]/40 transition-all">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 w-fit">
                  <Monitor className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Gestión de Pacientes</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ficha clínica unificada, historial antropométrico, seguimiento de exámenes y diario de alimentos en tiempo real.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-[#a88aed]/40 transition-all">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 w-fit">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Asistente IA (Naty)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Calcula aportes nutricionales, genera recetas adaptadas a restricciones clínicas y optimiza pautas en segundos.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-[#a88aed]/40 transition-all">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 w-fit">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Entregables PDF Impactantes</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Exporta documentos vectoriales profesionales con dietas, porciones, recetas y carrito de compras automático.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-[#a88aed]/40 transition-all">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 w-fit">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Seguridad Garantizada</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Encriptación de grado bancario (Ley 19.628). Tus datos y los de tus pacientes pertenecen únicamente a ti.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialsSection />

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
                      "relative flex flex-col justify-between rounded-3xl bg-white text-center transition-all duration-300 h-full",
                      sortedPlans.length === 1 && "w-full",
                      isPopular
                        ? "border-2 border-[#a88aed] shadow-xl shadow-[#a88aed]/15 z-10"
                        : "border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1",
                    )}
                  >
                    {plan.isComingSoon ? (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-6 py-2 rounded-full shadow-lg uppercase tracking-wider whitespace-nowrap">
                        🚀 Próximamente
                      </div>
                    ) : isPopular && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-6 py-2 rounded-full shadow-lg whitespace-nowrap">
                        ⭐ Más Popular
                      </div>
                    )}
                    <div className="flex flex-col flex-1 p-6 sm:p-8 pt-10">
                      <div className="mb-6">
                        <h3
                          className={cn(
                            "text-xl font-bold mb-2",
                            isPopular ? "text-indigo-700" : "text-slate-900",
                          )}
                        >
                          {plan.name}
                        </h3>
                        <div className="flex flex-col items-center justify-center min-h-[64px] gap-0.5">
                          {Number(plan.price) > 0 && Number(plan.price) < 25000 && (
                            <span className="text-xs font-semibold text-slate-400 line-through tracking-tight">
                              $25.000 / mes
                            </span>
                          )}
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
                              ${Number(plan.price).toLocaleString("es-CL")}
                            </span>
                            <span className="text-slate-500 text-xs sm:text-sm font-semibold">/mes</span>
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
                                  <X className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Check
                                    className={cn(
                                      "h-4 w-4",
                                      isPopular
                                        ? "text-[#a88aed]"
                                        : "text-slate-600",
                                    )}
                                  />
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  featureDisplay.isExcluded
                                    ? "text-slate-400 line-through"
                                    : "text-slate-700",
                                )}
                              >
                                {featureDisplay.label}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      <div className="pt-4 border-t border-slate-100">
                        {plan.isComingSoon ? (
                          <Button
                            disabled
                            className="w-full rounded-full h-12 text-sm font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                          >
                            Disponible pronto
                          </Button>
                        ) : (
                          <Link href="/login" className="w-full block">
                            <Button
                              className={cn(
                                "w-full rounded-full h-12 text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105",
                                isPopular
                                  ? "bg-[#a88aed] hover:bg-[#8f70d8] text-white shadow-lg shadow-[#a88aed]/25"
                                  : "bg-slate-900 hover:bg-slate-800 text-white",
                              )}
                            >
                              Seleccionar Plan
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section
          id="registro"
          ref={registrationRef}
          className={cn(
            "py-16 transition-all duration-700 bg-slate-50/70 border-t border-slate-100 lg:py-24",
            isRegistrationInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8",
          )}
        >
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="space-y-4 mb-12 text-center">
              <span className="text-xs font-black uppercase tracking-wider text-[#a88aed]">¿Tienes dudas o comentarios?</span>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-slate-900">
                Escríbenos directamente
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">
                Estamos aquí para responder tus preguntas y acompañarte en la digitalización de tu consulta clínica.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-lg">
              <LandingContactForm />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-950 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_2.webp"
              alt="nutrinet"
              width={140}
              height={45}
              className="h-auto w-[120px] object-contain brightness-0 invert"
            />
            <span className="text-xs text-slate-400 border-l border-slate-800 pl-3">
              Software Nutricional en Chile
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <button onClick={() => openAboutTab("seguridad")} className="hover:text-white transition-colors">
              Privacidad y Seguridad
            </button>
            <button onClick={() => openAboutTab("faq")} className="hover:text-white transition-colors">
              Preguntas Frecuentes
            </button>
            <button onClick={() => openAboutTab("objetivos")} className="hover:text-white transition-colors">
              Sobre NutriNet
            </button>
            <Link href="/terms" className="hover:text-white transition-colors">
              Términos de Servicio
            </Link>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} NutriNet Chile. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Banners */}
      <CookieBanner />
    </div>
  );
}
