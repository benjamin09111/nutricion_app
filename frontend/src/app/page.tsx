"use client";

import content from "@/content/landing.json";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-base";
import {
  Check,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  Target,
  Users,
  HelpCircle,
  HeartPulse,
  Star,
  Sparkles,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMembershipFeatureDisplay } from "@/features/memberships/utils/feature-format";
import { type MembershipPlan } from "@/features/memberships/services/membership.service";
import { sortPlansForLanding } from "@/features/memberships/utils/sort-plans";
import { CookieBanner } from "@/components/landing/CookieBanner";
import {
  type AboutSectionTab,
} from "@/components/landing/AboutNutriNetModal";
import { AboutNutriNetNavExtension } from "@/components/landing/AboutNutriNetNavExtension";
import { useLandingTracker } from "@/hooks/useLandingTracker";
import { HeroSection } from "@/components/landing/HeroSection";
import { BetaLeadCaptureSection } from "@/components/landing/BetaLeadCaptureSection";
import { DemoRoleSelectorModal } from "@/components/landing/DemoRoleSelectorModal";

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
  const { sessionId, trackEvent } = useLandingTracker();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isAboutDropdownOpen, setIsAboutDropdownOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const handleExploreFeaturesClick = () => {
    trackEvent("EXPLORE_FEATURES_CLICK");
    const targetElement = document.getElementById("planes");
    if (targetElement) {
      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const handleLeadSubmitted = (leadData: { fullName: string; email: string; practiceArea: string }) => {
    trackEvent("LEAD_CONVERSION_SUCCESS", { practiceArea: leadData.practiceArea });
  };

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

  const { ref: pricingRef, isInView: isPricingInView } = useInView({
    threshold: 0.15,
  });
  const visiblePlans = plans.filter((plan) => plan.isActive || plan.isComingSoon);
  const sortedPlans = sortPlansForLanding(visiblePlans);

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
                style={{ height: "auto" }}
                priority
              />
            </Link>
          </div>
          <nav
            className="hidden items-center gap-6 lg:flex"
            role="navigation"
            aria-label="Navegación principal"
          >
            {/* Sobre NutriNet en texto normal/oscuro */}
            <button
              type="button"
              onClick={() => setIsAboutDropdownOpen(!isAboutDropdownOpen)}
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-semibold transition-all py-1.5 px-3 rounded-xl cursor-pointer",
                isAboutDropdownOpen
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              Sobre NutriNet
              <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform duration-200", isAboutDropdownOpen && "rotate-180")} />
            </button>

            <a
              href="#planes"
              className="text-sm font-semibold transition-colors duration-200 text-slate-700 hover:text-slate-900"
            >
              Funcionalidades
            </a>
            <a
              href="#planes"
              className="text-sm font-semibold transition-colors duration-200 text-slate-700 hover:text-slate-900"
            >
              Precios
            </a>
            <Link
              href="/login"
              className="text-sm font-semibold transition-colors duration-200 text-slate-700 hover:text-slate-900"
            >
              Iniciar sesión
            </Link>
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="rounded-full h-10 px-5 text-xs font-bold uppercase tracking-wider bg-[#86A83C] hover:bg-[#78A82F] text-white transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-[#86A83C]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86A83C] focus-visible:ring-offset-2 cursor-pointer flex items-center justify-center"
            >
              PROBAR NUTRINET
            </button>
          </nav>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-xs transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88aed] focus-visible:ring-offset-2 lg:hidden"
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
                <span className="text-[10px] font-black uppercase text-slate-600">Sobre NutriNet</span>
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
                href="#planes"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Funcionalidades
              </a>
              <a
                href="#planes"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Precios
              </a>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Iniciar sesión
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsDemoModalOpen(true);
                }}
                className="inline-flex items-center justify-center rounded-full bg-[#86A83C] hover:bg-[#78A82F] px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-sm shadow-[#86A83C]/25 transition cursor-pointer"
              >
                PROBAR NUTRINET
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* 1. HERO SECTION */}
        <HeroSection
          onExploreFeaturesClick={handleExploreFeaturesClick}
          onProbarNutriNetClick={() => setIsDemoModalOpen(true)}
        />

        {/* 2. PLANES (Pricing Section) */}
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
                {content.pricing.titleLine2}
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
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                        <Rocket className="h-3.5 w-3.5 text-white" />
                        <span>Próximamente</span>
                      </div>
                    ) : isPopular && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 fill-white text-white" />
                        <span>Más Popular</span>
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
                                  "mt-0.5 rounded-full p-0.5 shrink-0",
                                  featureDisplay.isNew
                                    ? "bg-amber-100 border border-amber-300"
                                    : featureDisplay.isExcluded
                                      ? "bg-red-100"
                                      : isPopular
                                        ? "bg-indigo-100"
                                        : "bg-slate-100",
                                )}
                              >
                                {featureDisplay.isNew ? (
                                  <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
                                ) : featureDisplay.isExcluded ? (
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={cn(
                                    "text-sm font-medium",
                                    featureDisplay.isExcluded
                                      ? "text-slate-400 line-through"
                                      : featureDisplay.isNew
                                        ? "text-slate-900 font-bold"
                                        : "text-slate-700",
                                  )}
                                >
                                  {featureDisplay.label}
                                </span>
                              </div>
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

        {/* 3. ¿TE INTERESA NUTRINET? (Apoyo a Jump Chile & Descuento de Lanzamiento) */}
        <BetaLeadCaptureSection
          sessionId={sessionId}
          onLeadSubmitted={handleLeadSubmitted}
        />
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
              style={{ width: "auto", height: "auto" }}
              className="h-auto w-[120px] object-contain brightness-0 invert"
            />
            <span className="text-xs text-slate-400 border-l border-slate-800 pl-3">
              Software Nutricional en Chile
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <button onClick={() => openAboutTab("seguridad")} className="hover:text-white transition-colors cursor-pointer">
              Privacidad y Seguridad
            </button>
            <button onClick={() => openAboutTab("faq")} className="hover:text-white transition-colors cursor-pointer">
              Preguntas Frecuentes
            </button>
            <button onClick={() => openAboutTab("objetivos")} className="hover:text-white transition-colors cursor-pointer">
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

      {/* Banners & Widgets */}
      <CookieBanner />
      <DemoRoleSelectorModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
}
