"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, Calendar, Video, Users, ArrowRight, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { fetchApi } from "@/lib/api-base";
import { toast } from "sonner";
import type { PublicNutritionistsResponse, PublicNutritionist } from "@/lib/public-nutritionists";
import { JsonLd } from "@/components/seo/JsonLd";

const MODES = [
  { value: "", label: "Todas las modalidades" },
  { value: "online", label: "Online", icon: Video },
  { value: "presencial", label: "Presencial", icon: MapPin },
  { value: "both", label: "Online y Presencial", icon: Users },
];

export default function NutritionistsClient({
  initialData,
}: {
  initialData: PublicNutritionistsResponse;
}) {
  const [nutritionists, setNutritionists] = useState<PublicNutritionist[]>(initialData.nutritionists);
  const [total, setTotal] = useState(initialData.total);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("");
const [locationFilter, setLocationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const filtersRef = useRef({ search: "", modeFilter: "", locationFilter: "" });

  useEffect(() => {
    filtersRef.current = { search, modeFilter, locationFilter };
  }, [search, modeFilter, locationFilter]);

  const loadNutritionists = async () => {
    setIsLoading(true);
    try {
const { search: s, modeFilter: m, locationFilter: l } = filtersRef.current;
      const params = new URLSearchParams();
      if (s) params.set("search", s);
      if (m) params.set("mode", m);
      if (l) params.set("location", l);

      const response = await fetchApi(`/public/nutritionists?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNutritionists(data.nutritionists || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error loading nutritionists", error);
      toast.error("No se pudo cargar el directorio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadNutritionists();
  };

  const clearFilters = () => {
    setSearch("");
    setModeFilter("");
    setLocationFilter("");
    loadNutritionists();
  };

  const hasActiveFilters = search || modeFilter || locationFilter;

  return (
    <div className="min-h-screen bg-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Directorio de nutricionistas en Chile",
          url: "https://nutrinet.cl/nutricionistas",
          numberOfItems: total,
          itemListElement: nutritionists.map((nutritionist, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `https://nutrinet.cl/nutricionistas/${nutritionist.slug}`,
            name: nutritionist.fullName,
          })),
        }}
      />
{/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo_2.webp"
              alt="nutrinet"
              width={110}
              height={35}
              className="h-auto w-[100px] sm:w-[130px] object-contain"
            />
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#a88aed] transition-colors"
            >
              Inicio
            </Link>
            <Link href="/login">
              <Button className="rounded-full h-8 sm:h-9 px-3 sm:px-5 text-xs sm:text-xs font-bold uppercase tracking-wider bg-[#a88aed] hover:bg-[#8f70d8]">
                Nutricionistas
              </Button>
            </Link>
          </nav>
        </div>
      </header>

{/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Encuentra a tu{" "}
            <span className="text-[#a88aed]">nutricionista</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-6 sm:mb-8">
            Explora nutricionistas en Chile, compara perfiles, especialidades y agenda tu cita online o presencial.
          </p>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl mx-auto mb-6 sm:mb-8">
            NutriNet reúne perfiles públicos de nutricionistas con foco en atención clínica, deportiva, digestiva y control de peso.
          </p>

          {/* Search Bar */}
<form onSubmit={handleSearch} className="max-w-3xl mx-auto px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, especialidad..."
                  className="h-14 pl-12 rounded-2xl border-slate-200 bg-white text-base"
                />
              </div>
              <Button
                type="submit"
                className="h-14 px-8 rounded-2xl bg-[#a88aed] hover:bg-[#8f70d8] font-bold"
              >
                Buscar
              </Button>
            </div>
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {MODES.slice(1).map((mode) => (
              <button
                key={mode.value}
                onClick={() => {
                  setModeFilter(modeFilter === mode.value ? "" : mode.value);
                  setTimeout(loadNutritionists, 0);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  modeFilter === mode.value
                    ? "bg-[#a88aed] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {mode.label}
              </button>
            ))}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-1 cursor-pointer"
              >
                <X className="h-3 w-3" />
                Limpiar
              </button>
            )}
          </div>
        </div>
      </section>

<section className="py-8 sm:py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 p-4">Nutricionistas online en Chile</div>
            <div className="rounded-2xl border border-slate-200 p-4">Consulta nutricional presencial</div>
            <div className="rounded-2xl border border-slate-200 p-4">Especialistas en nutrición clínica y deportiva</div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#a88aed]" />
              <span className="ml-3 text-slate-500 font-medium">Cargando profesionales...</span>
            </div>
          ) : nutritionists.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No encontramos nutricionistas
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Intenta con otros filtros o términos de búsqueda."
                  : "Aún no hay nutricionistas publicados en el directorio."}
              </p>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="mt-6 rounded-full cursor-pointer"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
<p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">
                {total} profesional{total !== 1 ? "es" : ""} encontrado{total !== 1 ? "s" : ""}
              </p>
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {nutritionists.map((nutri) => (
                  <NutritionistCard key={nutri.id} nutritionist={nutri} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

<section className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-3">¿Qué nutricionista estás buscando?</h2>
            <p className="text-sm text-slate-600 max-w-3xl">
              Usa el directorio para encontrar nutricionistas en Chile por modalidad, ubicación o especialidad. Es ideal si buscas atención online, control de peso, nutrición deportiva o acompañamiento clínico.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900 mb-2">Para pacientes</h3>
              <p className="text-sm text-slate-600">Encuentra un nutricionista cerca de ti o agenda una consulta online según tu necesidad.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900 mb-2">Para nutricionistas</h3>
              <p className="text-sm text-slate-600">Publica tu perfil profesional y gana visibilidad en búsquedas relacionadas con nutrición en Chile.</p>
            </div>
          </div>
        </div>
      </section>

{/* Footer */}
      <footer className="bg-slate-900 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-slate-400 text-sm">
            © 2026 NutriNet. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

function NutritionistCard({ nutritionist }: { nutritionist: PublicNutritionist }) {
  const modeLabels: Record<string, string> = {
    online: "Online",
    presencial: "Presencial",
    both: "Online y Presencial",
  };

  return (
    <div className="group rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 transition-all hover:shadow-xl hover:shadow-slate-100 hover:border-[#a88aed]/30 cursor-pointer">
      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="h-16 sm:h-20 w-16 sm:w-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 text-xl sm:text-2xl font-bold overflow-hidden shrink-0">
          {nutritionist.avatarUrl ? (
            <img
              src={nutritionist.avatarUrl}
              alt={nutritionist.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            nutritionist.fullName.charAt(0)
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate group-hover:text-[#a88aed] transition-colors">
            {nutritionist.fullName}
          </h3>
          <p className="text-[10px] sm:text-xs font-semibold text-[#a88aed] uppercase tracking-wider mb-0.5 sm:mb-1">
            Nutricionista
          </p>
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          {nutritionist.specialty && (
            <p className="text-xs sm:text-sm text-slate-500 truncate mt-0.5 sm:mt-1">
              {nutritionist.specialty}
            </p>
          )}
        </div>
      </div>

      {nutritionist.headline && (
        <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4 line-clamp-2">
          {nutritionist.headline}
        </p>
      )}

<div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-slate-100 text-[10px] sm:text-xs font-medium text-slate-600">
            {modeLabels[nutritionist.consultationMode] || nutritionist.consultationMode}
          </span>
          {nutritionist.location && (
          <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-slate-100 text-[10px] sm:text-xs font-medium text-slate-600">
            <MapPin className="h-3 w-3" />
            {nutritionist.location}
          </span>
        )}
        </div>

        {nutritionist.specialties.length > 0 && (
<div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {nutritionist.specialties.slice(0, 4).map((specialty) => (
              <span key={specialty} className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-emerald-50 text-[10px] sm:text-xs font-medium text-emerald-700">
                {specialty}
              </span>
            ))}
          </div>
        )}

      <Link href={`/nutricionistas/${nutritionist.slug}`}>
        <Button className="w-full rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-slate-800 font-medium group-hover:bg-[#a88aed] group-hover:hover:bg-[#8f70d8] transition-all cursor-pointer text-sm py-2.5 sm:py-3">
          <span>Ver perfil</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
}
