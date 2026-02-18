"use client";

import content from '@/content/landing.json';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  Leaf,
  Zap,
  ShieldCheck,
  Monitor,
  ChevronRight,
  Star,
  Sparkles,
  Send,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export default function LandingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    message: ''
  });
  const [nutriCount, setNutriCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async (retries = 3) => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/users/count/nutritionists`);
        if (res.ok) {
          const data = await res.json();
          setNutriCount(data.count);
        }
      } catch (error) {
        // En desarrollo, el backend puede tardar unos segundos en arrancar
        if (retries > 0) {
          setTimeout(() => fetchCount(retries - 1), 2000);
        } else {
          console.warn('Backend no disponible para el contador de nutricionistas aún.');
        }
      }
    };
    fetchCount();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar solicitud');
      }

      toast.success('¡Solicitud enviada! Te contactaremos vía correo electrónico.');
      setFormData({
        fullName: '',
        email: '',
        message: ''
      });
    } catch (error: any) {
      toast.error(error.message || 'Hubo un error al enviar tu solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header / Nav */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-indigo-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-900 to-indigo-600">
              NutriSaaS
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#planes" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              Planes
            </a>
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              Iniciar Sesión
            </Link>
            <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-full h-11 px-8">
              Empieza Gratis
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-linear-to-b from-indigo-50/50 to-transparent -z-10" />
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-bold border border-indigo-100 mb-4">
                <Sparkles className="h-4 w-4" />
                {content.hero.badge}
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-indigo-950 leading-[1.1]">
                {content.hero.titleLine1} <br />
                <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-emerald-500">
                  {content.hero.titleLine2}
                </span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                {content.hero.description}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <a href="#registro">
                  <Button className="h-14 px-10 rounded-full text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 group">
                    {content.hero.ctaButton}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200" />
                    ))}
                  </div>
                  <span>
                    {nutriCount !== null
                      ? (nutriCount > 999 ? '+999' : nutriCount)
                      : '+100'} {content.hero.trustText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {content.features.map((feature, idx) => {
                const iconMap = { Zap, Monitor, ShieldCheck };
                const Icon = iconMap[feature.icon as keyof typeof iconMap];
                const colorClasses = {
                  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
                  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
                  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' }
                }[feature.color] || { bg: 'bg-slate-50', text: 'text-slate-600' };

                return (
                  <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                    <div className={`h-14 w-14 rounded-2xl ${colorClasses.bg} flex items-center justify-center ${colorClasses.text} mb-6`}>
                      {Icon && <Icon className="h-8 w-8" />}
                    </div>
                    <h3 className="text-xl font-bold text-indigo-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="planes" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-4xl font-bold text-indigo-950">{content.pricing.title}</h2>
              <p className="text-lg text-slate-600">
                {content.pricing.subtitle}
              </p>
            </div>

            <PricingSection />
          </div>
        </section>

        {/* Registration Form Section */}
        <section id="registro" className="py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-indigo-900 rounded-[3rem] overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-indigo-800 to-transparent opacity-50" />
              <div className="relative z-10 grid lg:grid-cols-2">
                <div className="p-12 lg:p-20 text-white space-y-8">
                  <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                    {content.registration.titleLine1} <br />
                    <span className="text-indigo-400">{content.registration.titleLine2}</span>
                  </h2>
                  <p className="text-lg text-indigo-100/80 leading-relaxed">
                    {content.registration.description}
                  </p>
                  <ul className="space-y-4">
                    {content.registration.benefits.map((text, i) => (
                      <li key={i} className="flex items-center gap-3 text-indigo-100">
                        <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-8 lg:p-12">
                  <div className="bg-white rounded-4xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nombre Completo <span className="text-red-500">*</span></label>
                        <Input
                          required
                          placeholder="Ej: Juan Andrés Silva Pérez"
                          className="rounded-xl border-slate-200"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 text-slate-700">
                        <label className="text-sm font-bold">Correo Profesional <span className="text-red-500">*</span></label>
                        <Input
                          type="email"
                          required
                          placeholder="nutri@ejemplo.cl"
                          className="rounded-xl border-slate-200"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <p className="text-[10px] text-slate-400 font-medium ml-1">
                          Lo usarás para iniciar sesión.
                        </p>
                      </div>
                      <div className="space-y-2 text-slate-700">
                        <label className="text-sm font-bold">¿Tienes alguna duda o comentario? <span className="text-slate-400 font-normal">(Opcional)</span></label>
                        <textarea
                          className="w-full h-24 rounded-xl border-slate-200 p-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          placeholder="Cuéntanos un poco sobre tu consulta..."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        />
                      </div>
                      <div className="pt-2">
                        <Button
                          type="submit"
                          isLoading={isSubmitting}
                          className="w-full h-14 rounded-xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200 text-lg font-bold"
                        >
                          Enviar Solicitud de Acceso
                          <Send className="ml-2 h-5 w-5" />
                        </Button>
                        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                          <ShieldCheck className="h-3 w-3 text-emerald-500" />
                          <span>Tu información profesional está protegida por encriptación de grado bancario.</span>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-indigo-900">NutriSaaS</span>
          </div>
          <p className="text-slate-500 text-sm italic">
            {content.footer.quote}
          </p>
          <div className="text-slate-400 text-xs pt-8">
            {content.footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}

function PricingSection() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async (retries = 3) => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/memberships/active`);
        if (res.ok) {
          const data = await res.json();
          setPlans(data);
          setIsLoading(false);
          return;
        }
        throw new Error('Response not ok');
      } catch (error) {
        if (retries > 0) {
          // Reintentar cada 2 segundos si el backend no responde (startup)
          setTimeout(() => fetchPlans(retries - 1), 2000);
        } else {
          console.warn('No se pudieron cargar los planes. El backend podría estar caído.');
          setIsLoading(false);
        }
      }
    };

    fetchPlans();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`relative p-8 rounded-[2.5rem] border ${plan.isPopular
            ? 'border-indigo-600 shadow-2xl shadow-indigo-100 ring-4 ring-indigo-50'
            : 'border-slate-200 shadow-sm'
            } bg-white transition-all hover:-translate-y-1 duration-300`}
        >
          {plan.isPopular && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest shadow-lg">
              Más Popular
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-indigo-950">{plan.name}</h3>
              <p className="text-slate-500 text-sm mt-1">{plan.description}</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-indigo-950">
                ${Number(plan.price).toLocaleString('es-CL')}
              </span>
              <span className="text-slate-500 font-medium">/ {plan.billingPeriod === 'monthly' ? 'mes' : 'año'}</span>
            </div>

            <ul className="space-y-4 py-6">
              {plan.features.map((feature: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-600">
                  <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${plan.isPopular ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <a href="#registro" className="block text-center">
              <Button
                variant={plan.isPopular ? 'default' : 'outline'}
                className={`w-full h-12 rounded-2xl text-sm font-bold transition-all ${plan.isPopular
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 text-white'
                  : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                  }`}
              >
                {plan.price === "0" || Number(plan.price) === 0 ? 'Empezar Gratis' : 'Elegir Plan ' + plan.name}
              </Button>
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
