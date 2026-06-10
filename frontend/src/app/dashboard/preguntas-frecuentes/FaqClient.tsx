"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ChevronDown, ArrowRight, HelpCircle, Sparkles } from "lucide-react";

import faqData from "@/content/faq.json";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type FAQLink = {
  label: string;
  href: string;
};

type FAQItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
  links: FAQLink[];
};

const faqs = faqData as FAQItem[];

const categoryOrder = ["Todos", ...Array.from(new Set(faqs.map((faq) => faq.category)))];

export function FaqClient() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [openFaqId, setOpenFaqId] = useState(faqs[0]?.id ?? "");

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return faqs.filter((faq) => {
      const matchesCategory = selectedCategory === "Todos" || faq.category === selectedCategory;
      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  const hasFilters = search.trim().length > 0 || selectedCategory !== "Todos";

  return (
    <section className="space-y-6 pb-10">
      <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 shadow-[0_24px_80px_-40px_rgba(79,70,229,0.35)]">
        <CardContent className="p-0">
          <div className="grid gap-8 p-6 md:grid-cols-[1.35fr_0.95fr] md:p-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success" className="border-emerald-200 bg-emerald-100 text-emerald-800">
                  Centro de ayuda
                </Badge>
                <Badge variant="outline" className="border-indigo-200 bg-white text-indigo-700">
                  Respuestas rápidas
                </Badge>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Preguntas frecuentes
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Hola, soy Nutria. Aquí encuentras respuestas claras, directas y con accesos
                  concretos para que no tengas que adivinar dónde hacer cada cosa dentro de NutriNet.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Preguntas</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{faqs.length}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Categorías</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{categoryOrder.length - 1}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Ruta más usada</p>
                  <Link href="/dashboard/dieta" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-indigo-700 transition hover:text-indigo-800 cursor-pointer">
                    Ir a Dieta <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-indigo-100/50 backdrop-blur">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/40 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-indigo-200/40 blur-3xl" />

              <div className="relative flex h-full flex-col items-center justify-center gap-5 text-center">
                <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg ring-1 ring-indigo-100">
                  <Image src="/nutria.webp" alt="Nutria de NutriNet" fill className="object-cover" priority />
                </div>
                <div className="space-y-2">
                  <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-emerald-800">
                    <Sparkles className="h-3.5 w-3.5" />
                    Te acompaño
                  </p>
                  <p className="text-lg font-black text-slate-900">Hola, soy Nutria. Te ayudo a encontrar la respuesta correcta sin rodeos.</p>
                  <p className="text-sm leading-6 text-slate-600">
                    Si algo te genera duda, empieza por el buscador o abre la categoría que más se parece a tu pregunta.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link href="/dashboard/feedback" className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer">
                    <HelpCircle className="h-4 w-4" />
                    Pedir ayuda
                  </Link>
                  <Link href="/dashboard/actualizaciones" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer">
                    Ver novedades
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-5 p-6 md:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">Busca por palabra o filtra por categoría</h2>
              <p className="mt-1 text-sm text-slate-500">Escribe una duda y te mostraré las respuestas más cercanas al instante.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                {filteredFaqs.length} resultados
              </Badge>
              {hasFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("Todos");
                  }}
                  className="h-9 rounded-full px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Busca una pregunta, módulo o tema..."
              className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categoryOrder.map((category) => {
              const active = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
                    active
                      ? "border-indigo-200 bg-indigo-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700",
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;

            return (
              <Card key={faq.id} className={cn("overflow-hidden border-slate-200 transition-shadow", isOpen && "shadow-md shadow-indigo-100/40") }>
                <button
                  type="button"
                  onClick={() => setOpenFaqId(isOpen ? "" : faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${faq.id}`}
                  className={cn(
                    "flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors cursor-pointer sm:px-6",
                    isOpen ? "bg-indigo-50/60" : "hover:bg-slate-50",
                  )}
                >
                  <div className="space-y-2">
                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-500">
                      {faq.category}
                    </Badge>
                    <h3 className="text-base font-bold leading-6 text-slate-900 sm:text-lg">{faq.question}</h3>
                  </div>

                  <span
                    className={cn(
                      "mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-transform duration-200",
                      isOpen && "rotate-180 text-indigo-600",
                    )}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>

                {isOpen && (
                  <div id={`faq-panel-${faq.id}`} className="border-t border-slate-100 bg-white px-5 py-5 sm:px-6">
                    <p className="max-w-4xl text-sm leading-7 text-slate-600 sm:text-[0.95rem]">{faq.answer}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {faq.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 cursor-pointer"
                        >
                          {link.label}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <Card className="border-dashed border-slate-200 bg-slate-50/80">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                <Search className="h-7 w-7 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">No encontré coincidencias</h3>
                <p className="max-w-lg text-sm text-slate-500">
                  Prueba con otra palabra o limpia los filtros para ver todas las preguntas disponibles.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("Todos");
                  }}
                  className="rounded-full"
                >
                  Limpiar filtros
                </Button>
                <Link
                  href="/dashboard/feedback"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
                >
                  Escribir a Nutria
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
