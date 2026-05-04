"use client";

import content from "@/content/landing.json";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Zap,
  ShieldCheck,
  Monitor,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api-base";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";

export default function LandingPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
  });

  const featuresInView = useInView({ threshold: 0.15 });
  const pricingInView = useInView({ threshold: 0.15 });
  const registrationInView = useInView({ threshold: 0.1 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetchApi(`/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      const responseData = data as { message?: string };

      if (!response.ok) {
        throw new Error(responseData.message || "Error al enviar solicitud");
      }

      toast.success(
        "¡Solicitud enviada! Te contactaremos vía correo electrónico.",
      );
      setFormData({
        fullName: "",
        email: "",
        message: "",
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Hubo un error al enviar tu solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("min-h-screen", isDarkMode ? "bg-slate-950 text-emerald-50" : "bg-white text-slate-900")}>
      {/* Header / Nav */}
      <header className={cn("fixed top-0 z-50 w-full border-b backdrop-blur-md transition-all duration-300", isDarkMode ? "bg-slate-950/80 border-emerald-400/10" : "bg-white/80 border-indigo-100")}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="nutrinet"
              width={160}
              height={50}
              className="h-auto w-[130px] sm:w-[150px] object-contain transition-transform duration-300 hover:scale-105"
              priority
            />
          </div>
          <nav className="flex items-center gap-5" role="navigation" aria-label="Navegación principal">
            <a
              href="#planes"
              className={cn("relative text-sm font-semibold transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#a88aed] after:transition-all after:duration-300 hover:after:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88aed] focus-visible:ring-offset-2 rounded", isDarkMode ? "text-emerald-100/70 hover:text-emerald-50" : "text-[#a88aed] hover:text-[#8f70d8]")}
            >
              Planes
            </a>
            <Link
              href="/login"
              className={cn("relative text-sm font-semibold transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#a88aed] after:transition-all after:duration-300 hover:after:w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88aed] focus-visible:ring-offset-2 rounded", isDarkMode ? "text-emerald-100/70 hover:text-emerald-50" : "text-[#a88aed] hover:text-[#8f70d8]")}
            >
              Inicia Sesión
            </Link>
            <button type="button" onClick={toggleTheme} className={cn("inline-flex h-10 items-center gap-2 rounded-full border-2 px-4 text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88aed] focus-visible:ring-offset-2", isDarkMode ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-50 hover:bg-emerald-500/18" : "border-[#a88aed]/40 bg-white text-[#a88aed] hover:border-[#a88aed] hover:bg-[#a88aed]/5")} aria-label={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
              {isDarkMode ? "Light" : "Dark"}
            </button>
            <a href="#registro">
              <Button className={cn("rounded-full h-10 px-6 text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88aed] focus-visible:ring-offset-2", isDarkMode ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950" : "bg-[#a88aed] hover:bg-[#8f70d8] text-white")}>
                Empieza Gratis
              </Button>
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className={cn("inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium border-2 transition-all duration-300 hover:scale-105", isDarkMode ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-50" : "bg-[#a88aed]/10 text-[#a88aed] border-[#a88aed]/30")}>
                <Sparkles className="h-4 w-4" />
                {content.hero.badge}
              </div>
              
              <div className="space-y-2">
                <h1 className="text-6xl lg:text-8xl font-black tracking-tight leading-none" style={{ WebkitTextStroke: "4px #a6c261", color: "transparent", fontWeight: 900 }}>
                  {content.hero.titleLine1}
                </h1>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl lg:text-5xl font-bold tracking-tight text-[#a88aed]">
                    {content.hero.titleLine2}
                  </span>
                  <div className="flex gap-1">
                    <Check className="h-8 w-8 text-[#a6c261]" />
                    <Check className="h-8 w-8 text-[#a6c261]" />
                  </div>
                </div>
              </div>

              <p className="text-lg lg:text-xl italic max-w-2xl mx-auto leading-relaxed text-[#a88aed]">
                {content.hero.description}
              </p>

              <div className="pt-4">
                <a href="#registro">
                  <span className="group inline-flex items-center gap-2 px-10 py-4 rounded-full text-lg font-bold italic cursor-pointer transition-all duration-300 bg-[#a6c261] text-white hover:bg-[#8da84f] shadow-xl hover:shadow-2xl hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a6c261] focus-visible:ring-offset-2">
                    {content.hero.ctaButton} 
                    <span className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">🚀</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresInView.ref} className={cn("py-20 lg:py-28 transition-all duration-700", isDarkMode ? "bg-slate-900/30" : "bg-slate-50", featuresInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {content.features.cards.map((feature, idx) => {
                const iconMap = { Zap, Monitor, ShieldCheck };
                const Icon = iconMap[feature.icon as keyof typeof iconMap];
                const iconBgColors = {
                  amber: isDarkMode ? "bg-amber-500/20 text-amber-400" : "bg-amber-50 text-amber-600",
                  indigo: isDarkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600",
                  emerald: isDarkMode ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600",
                };
                const delays = ["delay-100", "delay-200", "delay-300"];

                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-8 rounded-2xl border transition-all duration-500 hover:-translate-y-2 hover:shadow-xl group cursor-pointer",
                      delays[idx],
                      isDarkMode
                        ? "bg-slate-900 border-emerald-400/10 shadow-lg hover:border-emerald-400/30"
                        : "bg-white border-slate-200 shadow-md hover:border-[#a88aed]/40 hover:shadow-[#a88aed]/10"
                    )}
                  >
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3", iconBgColors[feature.iconColor as keyof typeof iconBgColors])}>
                      {Icon && <Icon className="h-6 w-6" />}
                    </div>
                    <h3 className={cn("text-lg font-bold mb-3 transition-colors duration-300", isDarkMode ? "text-indigo-400 group-hover:text-indigo-300" : "text-indigo-900 group-hover:text-[#a88aed]")}>
                      {feature.title}
                    </h3>
                    <p className={cn("text-sm leading-relaxed", isDarkMode ? "text-emerald-100/60" : "text-slate-600")}>
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="planes" ref={pricingInView.ref} className={cn("py-16 lg:py-24 transition-all duration-700", pricingInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="max-w-5xl mx-auto px-6">
            <div className={cn("rounded-[2rem] border-2 p-12 lg:p-16 text-center transition-all duration-500 hover:shadow-xl", isDarkMode ? "bg-slate-900/50 border-indigo-500/30 hover:border-indigo-400/50" : "bg-white border-[#a88aed]/30 hover:border-[#a88aed]/50 hover:shadow-[#a88aed]/10")}>
              <div className="space-y-2 mb-8">
                <span className="block text-5xl lg:text-7xl font-black tracking-tight" style={{ WebkitTextStroke: "3px #a6c261", color: "transparent", fontWeight: 900 }}>
                  {content.pricing.titleLine1}
                </span>
                <span className="block text-3xl lg:text-4xl font-bold text-[#a88aed]">
                  {content.pricing.titleLine2} 🌱
                </span>
              </div>
              <p className="text-lg lg:text-xl italic mb-6 max-w-2xl mx-auto text-[#a88aed]">
                {content.pricing.paragraph1}
              </p>
              <p className="text-lg lg:text-xl italic max-w-2xl mx-auto text-[#a88aed]">
                {content.pricing.paragraph2}
              </p>
            </div>
          </div>
        </section>

        {/* Registration Form Section */}
        <section id="registro" ref={registrationInView.ref} className={cn("py-16 lg:py-24 transition-all duration-700", registrationInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              {/* Left side - Text content */}
              <div className="space-y-6 pt-4">
                <h2 className="text-4xl lg:text-5xl font-black text-[#a88aed]">
                  {content.registration.titleLine1}
                </h2>
                <div className="flex items-center gap-3">
                  <Check className="h-8 w-8 text-[#a6c261]" />
                  <p className="text-2xl lg:text-3xl font-semibold text-[#a88aed]">
                    {content.registration.titleLine2}
                  </p>
                </div>
                <p className="text-xl font-semibold italic text-[#a88aed]">
                  {content.registration.subtitle}
                </p>
                <p className="text-base leading-relaxed text-[#a88aed]">
                  {content.registration.paragraph1}
                </p>
                <p className="text-base leading-relaxed text-[#a88aed]">
                  {content.registration.paragraph2}
                </p>
                <p className="text-base leading-relaxed text-[#a88aed]">
                  {content.registration.paragraph3}
                </p>
              </div>

              {/* Right side - Form on purple card */}
              <div className={cn("rounded-3xl p-8 lg:p-10 transition-all duration-500 hover:shadow-xl", isDarkMode ? "bg-indigo-900/40" : "bg-[#a88aed]/15 hover:shadow-[#a88aed]/20")}>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className={cn("text-sm font-bold uppercase tracking-wide", isDarkMode ? "text-indigo-300" : "text-[#a88aed]")}>
                      {content.registration.formTitle}
                    </label>
                    <Input
                      required
                      placeholder="Juan Andrés Silva Pérez"
                      className={cn("rounded-full h-12 px-5 transition-all duration-300 focus:shadow-md", isDarkMode ? "border-indigo-400/20 bg-slate-900/60" : "border-[#a88aed]/30 bg-white/80 focus:border-[#a88aed] focus:ring-[#a88aed]/20")}
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fullName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-sm font-bold uppercase tracking-wide", isDarkMode ? "text-indigo-300" : "text-[#a88aed]")}>
                      {content.registration.formEmail}
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="juan.nutri@ejemplo.com"
                      className={cn("rounded-full h-12 px-5 transition-all duration-300 focus:shadow-md", isDarkMode ? "border-indigo-400/20 bg-slate-900/60" : "border-[#a88aed]/30 bg-white/80 focus:border-[#a88aed] focus:ring-[#a88aed]/20")}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-sm font-bold uppercase tracking-wide", isDarkMode ? "text-indigo-300" : "text-[#a88aed]")}>
                      {content.registration.formMessage}
                    </label>
                    <textarea
                      className={cn("w-full h-28 rounded-2xl p-4 text-sm resize-none transition-all duration-300 focus:shadow-md", isDarkMode ? "bg-slate-900/60 border-indigo-400/20 text-emerald-50 placeholder:text-emerald-100/30 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20" : "bg-white/80 border-[#a88aed]/30 text-slate-700 placeholder:text-slate-400 focus:border-[#a88aed] focus:ring-2 focus:ring-[#a88aed]/20")}
                      placeholder="Cuéntanos un poco sobre tu consulta..."
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          message: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="pt-2">
                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      className={cn("w-full h-14 rounded-full text-lg font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88aed] focus-visible:ring-offset-2", isDarkMode ? "bg-indigo-500 hover:bg-indigo-400 text-white" : "bg-[#a88aed] hover:bg-[#8f70d8] text-white shadow-lg shadow-[#a88aed]/30")}
                    >
                      {content.registration.formSubmit} 🚀
                      <Send className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Encryption text */}
            <p className="text-center text-base italic mt-10 text-[#a6c261]">
              {content.registration.encryptionText}
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={cn("py-16 lg:py-20 transition-colors duration-300", isDarkMode ? "bg-slate-900/50" : "bg-[#a88aed]/5")}>
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <Image
              src="/logo.png"
              alt="nutrinet"
              width={200}
              height={63}
              className="h-auto w-[160px] lg:w-[190px] object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="space-y-1">
            <p className={cn("text-base", isDarkMode ? "text-indigo-300/70" : "text-[#a88aed]")}>
              {content.footer.line1}
            </p>
            <p className={cn("text-base", isDarkMode ? "text-indigo-300/70" : "text-[#a88aed]")}>
              {content.footer.line2}
            </p>
          </div>
          <div className={cn("text-sm pt-4", isDarkMode ? "text-indigo-300/50" : "text-[#a88aed]/60")}>
            {content.footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
