"use client";

import content from "@/content/landing.json";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Zap,
  ShieldCheck,
  Monitor,
  Send,
  Sparkles,
  Menu,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  landingRegistrationSchema,
  type LandingRegistrationFormData,
} from "@/lib/schemas/auth";
import {
  getPasswordRequirements,
  getPasswordStrength,
} from "@/lib/password-policy";
import NutritionistCTAButton from "@/components/landing/NutritionistCTAButton";

export default function LandingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    fetchApi(`/memberships/active`)
      .then((res) => res.json())
      .then((data) => setPlans(data))
      .catch(() => {});
  }, []);

  const {
    register: registerField,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<LandingRegistrationFormData>({
    resolver: zodResolver(landingRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      message: "",
    },
  });

  const passwordValue = watch("password");
  const passwordStrength = getPasswordStrength(passwordValue || "");
  const passwordRequirements = getPasswordRequirements(passwordValue || "");


  const featuresInView = useInView({ threshold: 0.15 });
  const pricingInView = useInView({ threshold: 0.15 });
  const registrationInView = useInView({ threshold: 0.1 });

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

  const onSubmit = async (values: LandingRegistrationFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetchApi(`/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          fullName: values.fullName,
          message: values.message,
        }),
      });

      const contentType = response.headers.get("content-type");
      let responseData: { message?: string } = {};
      
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      }

      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}: No se pudo crear la cuenta.`);
      }

      toast.success(
        "¡Cuenta creada con éxito! Revisa tu correo para continuar.",
        {
          duration: 5000,
        }
      );

      reset();
      setShowPassword(false);

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Hubo un error al crear tu cuenta.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
              target: "https://nutrinet.cl/nutricionistas?search={search_term_string}",
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
            description: "Software para nutricionistas en Chile para gestionar pacientes, dietas y consultas.",
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
          <nav className="hidden items-center gap-5 lg:flex" role="navigation" aria-label="Navegación principal">
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
            <Link
              href="/nutricionistas"
              className="relative text-sm font-semibold transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-emerald-500 after:transition-all after:duration-300 hover:after:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded text-emerald-600 hover:text-emerald-700"
            >
              Ver Nutricionistas
            </Link>
            <NutritionistCTAButton />
            <a href="#registro">
              <Button className="rounded-full h-10 px-6 text-xs font-bold uppercase tracking-wider bg-[#a88aed] hover:bg-[#8f70d8] text-white transition-all duration-300 hover:scale-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88aed] focus-visible:ring-offset-2">
                Empieza Gratis
              </Button>
            </a>
          </nav>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-[#a88aed]/20 bg-white p-2 text-[#a88aed] shadow-sm transition hover:bg-[#a88aed]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88aed] focus-visible:ring-offset-2 lg:hidden"
            onClick={() => setIsMobileMenuOpen((value) => !value)}
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
                href="/nutricionistas"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Ver Nutricionistas
              </Link>
              <NutritionistCTAButton />
              <a
                href="#registro"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-[#a88aed] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#8f70d8]"
              >
                Empieza Gratis
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-44 lg:pb-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className={cn("inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-medium transition-all duration-300 hover:scale-105 sm:px-5 sm:text-sm", "bg-[#a88aed]/10 text-[#a88aed] border-[#a88aed]/30")}>
                <Sparkles className="h-4 w-4" />
                {content.hero.badge}
              </div>
              
              <div className="space-y-2">
                <h1 className="text-4xl font-black leading-none tracking-tight sm:text-5xl lg:text-8xl" style={{ WebkitTextStroke: "4px #a6c261", color: "transparent", fontWeight: 900 }}>
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
                <a href="#registro">
                  <span className="group inline-flex items-center gap-2 rounded-full bg-[#a6c261] px-7 py-3 text-base font-bold italic text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#8da84f] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a6c261] focus-visible:ring-offset-2 sm:px-10 sm:py-4 sm:text-lg">
                    {content.hero.ctaButton} 
                    <span className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">🚀</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresInView.ref} className={cn("py-16 transition-all duration-700 sm:py-20 lg:py-28", "bg-slate-50", featuresInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
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
                      "bg-white border-slate-200 shadow-md hover:border-[#a88aed]/40 hover:shadow-[#a88aed]/10"
                    )}
                  >
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3", iconBgColors[feature.iconColor as keyof typeof iconBgColors])}>
                      {Icon && <Icon className="h-6 w-6" />}
                    </div>
                    <h3 className={cn("text-lg font-bold mb-3 transition-colors duration-300", "text-indigo-900 group-hover:text-[#a88aed]")}>
                      {feature.title}
                    </h3>
                    <p className={cn("text-sm leading-relaxed", "text-slate-600")}>
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

{/* Pricing Section */}
        <section id="planes" ref={pricingInView.ref} className={cn("py-16 transition-all duration-700 lg:py-24", pricingInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="space-y-8 mb-12 text-center">
              <span className="block text-4xl font-black tracking-tight sm:text-5xl lg:text-7xl" style={{ WebkitTextStroke: "3px #a6c261", color: "transparent", fontWeight: 900 }}>
                {content.pricing.titleLine1}
              </span>
              <span className="block text-2xl font-bold text-[#a88aed] sm:text-3xl lg:text-4xl">
                {content.pricing.titleLine2} 🌱
              </span>
            </div>
            <div className="grid gap-6 lg:grid-cols-3 xl:gap-8">
              {plans.filter(p => p.isActive).map((plan, index) => {
                const isPopular = plan.isPopular;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col rounded-3xl bg-white text-center transition-all duration-500",
                      isPopular
                        ? "border-2 border-[#a88aed] shadow-[0_20px_60px_rgba(168,138,237,0.25)] lg:scale-105 z-10"
                        : "border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1"
                    )}
                  >
                    {isPopular && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-6 py-2 rounded-full shadow-lg">
                        ⭐ Recomendado
                      </div>
                    )}
                    <div className={cn("flex flex-col flex-1 p-6 sm:p-8", isPopular ? "pt-10" : "pt-6")}>
                      <div className="mb-6">
                        <h3 className={cn("text-xl font-bold mb-2", isPopular ? "text-indigo-700" : "text-slate-900")}>
                          {plan.name}
                        </h3>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-5xl font-black tracking-tight text-slate-900">
                            ${Number(plan.price).toLocaleString("es-CL")}
                          </span>
                          <span className="text-slate-500 text-sm">/mes</span>
                        </div>
                        {plan.description && (
                          <p className="mt-3 text-sm text-slate-500">{plan.description}</p>
                        )}
                      </div>

                      <ul className="mb-8 space-y-3 text-left flex-1">
                        {(Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || "[]")).map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className={cn("mt-0.5 rounded-full p-0.5", isPopular ? "bg-indigo-100" : "bg-slate-100")}>
                              <Check className={cn("h-3.5 w-3.5", isPopular ? "text-indigo-600" : "text-slate-500")} />
                            </div>
                            <span className="text-sm text-slate-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={cn(
                          "w-full cursor-pointer text-base font-semibold py-3 rounded-2xl transition-all duration-300",
                          isPopular
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900"
                        )}
                      >
                        {isPopular ? "Elegir Plan Pro" : `Elegir ${plan.name}`}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-sm text-slate-500 mt-8">
              Sin compromiso. Cancela cuando quieras. Facturación segura.
            </p>
          </div>
        </section>

        {/* Registration Form Section */}
        <section id="registro" ref={registrationInView.ref} className={cn("py-16 transition-all duration-700 sm:py-20 lg:py-24", registrationInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="space-y-6 pt-1 sm:pt-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#a88aed]/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#a88aed] shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                  Alta segura
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
              </div>

              <div className={cn("rounded-3xl border border-[#a88aed]/15 bg-white/70 p-5 shadow-[0_18px_50px_rgba(168,138,237,0.12)] backdrop-blur-sm transition-all duration-500 hover:shadow-[0_24px_60px_rgba(168,138,237,0.18)] sm:p-8 lg:p-10", "bg-[#a88aed]/10") }>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
                  <div className="space-y-2">
                    <label className={cn("text-xs font-black uppercase tracking-[0.18em]", "text-[#a88aed]")}>{content.registration.formTitle}</label>
                    <Input
                      placeholder="Juan Andrés Silva Pérez"
                      autoComplete="name"
                      className="h-12 rounded-2xl border-[#a88aed]/25 bg-white/90 px-5 transition-all duration-300 focus:border-[#a88aed] focus:shadow-md"
                      error={errors.fullName?.message}
                      {...registerField("fullName")}
                    />
                    {errors.fullName?.message && <p className="text-xs font-medium text-rose-600">{errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-xs font-black uppercase tracking-[0.18em]", "text-[#a88aed]")}>{content.registration.formEmail}</label>
                    <Input
                      type="email"
                      placeholder="juan.nutri@ejemplo.com"
                      autoComplete="email"
                      className="h-12 rounded-2xl border-[#a88aed]/25 bg-white/90 px-5 transition-all duration-300 focus:border-[#a88aed] focus:shadow-md"
                      error={errors.email?.message}
                      {...registerField("email")}
                    />
                    {errors.email?.message && <p className="text-xs font-medium text-rose-600">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-xs font-black uppercase tracking-[0.18em]", "text-[#a88aed]")}>{content.registration.formPassword}</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Crea una contraseña segura"
                        autoComplete="new-password"
                        className="h-12 rounded-2xl border-[#a88aed]/25 bg-white/90 px-5 pr-12 transition-all duration-300 focus:border-[#a88aed] focus:shadow-md"
                        error={errors.password?.message}
                        {...registerField("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#a88aed]/15 bg-white/90 text-[#a88aed] shadow-sm transition hover:border-[#a88aed]/25 hover:bg-[#a88aed]/10 hover:text-[#8f70d8]"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {passwordValue.length > 0 && (
                    <div className="rounded-2xl border border-[#a88aed]/15 bg-white/85 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Seguridad</span>
                        <span className={cn("rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]", passwordStrength.tone === "emerald" && "bg-emerald-100 text-emerald-700", passwordStrength.tone === "indigo" && "bg-indigo-100 text-indigo-700", passwordStrength.tone === "amber" && "bg-amber-100 text-amber-700", passwordStrength.tone === "rose" && "bg-rose-100 text-rose-700")}>{passwordStrength.label}</span>
                      </div>
                      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={cn("h-full rounded-full transition-all duration-300", passwordStrength.tone === "emerald" && "bg-emerald-500", passwordStrength.tone === "indigo" && "bg-indigo-500", passwordStrength.tone === "amber" && "bg-amber-500", passwordStrength.tone === "rose" && "bg-rose-500")} style={{ width: `${Math.min(100, (passwordStrength.score / 6) * 100)}%` }} />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {passwordRequirements.map((rule) => (
                          <div key={rule.key} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors", rule.met ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500")}>
                            <Check className={cn("h-3.5 w-3.5", rule.met ? "opacity-100" : "opacity-25")} />
                            {rule.label}
                          </div>
                        ))}
                      </div>
                    </div>
                    )}

                    {errors.password?.message && <p className="text-xs font-medium text-rose-600">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className={cn("text-xs font-black uppercase tracking-[0.18em]", "text-[#a88aed]")}>{content.registration.formMessage}</label>
                    <textarea
                      className={cn("min-h-28 w-full rounded-2xl border border-[#a88aed]/25 bg-white/90 p-4 text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-300 focus:border-[#a88aed] focus:outline-none focus:ring-2 focus:ring-[#a88aed]/20", errors.message && "border-rose-300 bg-rose-50 text-rose-900")}
                      placeholder="Cuéntanos un poco sobre tu consulta..."
                      {...registerField("message")}
                    />
                    {errors.message?.message && <p className="text-xs font-medium text-rose-600">{errors.message.message}</p>}
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      className={cn("h-14 w-full rounded-full text-base font-bold transition-all duration-300 hover:scale-[1.01] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88aed] focus-visible:ring-offset-2 sm:text-lg", "bg-[#a88aed] text-white shadow-lg shadow-[#a88aed]/30 hover:bg-[#8f70d8]")}
                    >
                      {content.registration.formSubmit} 🚀
                      <Send className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            <p className="mt-10 text-center text-sm italic text-[#a6c261] sm:text-base">
              {content.registration.encryptionText}
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={cn("py-16 transition-colors duration-300 lg:py-20", "bg-[#a88aed]/5")}>
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
          <div className={cn("text-sm pt-4", "text-[#a88aed]/60")}>
            {content.footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
