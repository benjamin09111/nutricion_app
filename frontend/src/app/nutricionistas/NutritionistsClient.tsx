"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, Calendar, Video, Users, ArrowRight, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { fetchApi } from "@/lib/api-base";
import { toast } from "sonner";

interface Nutritionist {
  id: string;
  slug: string;
  fullName: string;
  specialty: string | null;
  headline: string | null;
  bio: string | null;
  specialties: string[];
  consultationMode: string;
  location: string | null;
  avatarUrl: string | null;
  bookingEnabled: boolean;
  publicPhone: string | null;
  publicEmail: string | null;
  instagram: string | null;
}

const MODES = [
  { value: "", label: "Todas las modalidades" },
  { value: "online", label: "Online", icon: Video },
  { value: "presencial", label: "Presencial", icon: MapPin },
  { value: "both", label: "Online y Presencial", icon: Users },
];

export default function NutritionistsClient() {
  const [nutritionists, setNutritionists] = useState<Nutritionist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadNutritionists();
  }, []);

  const loadNutritionists = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (modeFilter) params.set("mode", modeFilter);
      if (locationFilter) params.set("location", locationFilter);

      const response = await fetchApi(`/public/nutritionists?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNutritionists(data.nutritionists || []);
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm dark:bg-slate-950/90 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo_2.webp"
              alt="nutrinet"
              width={130}
              height={40}
              className="h-auto w-[130px] object-contain"
            />
          </Link>
          <nav className="flex items-center gap-5">
            <Link
              href="/"
              className="text-sm font-semibold text-slate-600 hover:text-[#a88aed] transition-colors"
            >
              Inicio
            </Link>
            <Link href="/login">
              <Button className="rounded-full h-9 px-5 text-xs font-bold uppercase tracking-wider bg-[#a88aed] hover:bg-[#8f70d8]">
                Nutricionistas
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Encuentra a tu{" "}
            <span className="text-[#a88aed]">nutricionista</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Explora nuestro directorio de profesionales de la nutrición. 
            Compara perfiles, especialidades y agenda tu cita directamente.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
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
              <p className="text-sm text-slate-500 mb-6">
                {nutritionists.length} profesional{nutritionists.length !== 1 ? "es" : ""} encontrado{nutritionists.length !== 1 ? "s" : ""}
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {nutritionists.map((nutri) => (
                  <NutritionistCard key={nutri.id} nutritionist={nutri} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm">
            © 2024 NutriNet. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

function NutritionistCard({ nutritionist }: { nutritionist: Nutritionist }) {
  const modeLabels: Record<string, string> = {
    online: "Online",
    presencial: "Presencial",
    both: "Online y Presencial",
  };

  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-6 transition-all hover:shadow-xl hover:shadow-slate-100 hover:border-[#a88aed]/30 cursor-pointer">
      <div className="flex items-start gap-4 mb-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 text-xl font-bold overflow-hidden shrink-0">
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
          <h3 className="font-bold text-slate-900 truncate group-hover:text-[#a88aed] transition-colors">
            {nutritionist.fullName}
          </h3>
          {nutritionist.specialty && (
            <p className="text-sm text-slate-500 truncate">
              {nutritionist.specialty}
            </p>
          )}
        </div>
      </div>

      {nutritionist.headline && (
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
          {nutritionist.headline}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
          {modeLabels[nutritionist.consultationMode] || nutritionist.consultationMode}
        </span>
        {nutritionist.location && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
            <MapPin className="h-3 w-3" />
            {nutritionist.location}
          </span>
        )}
      </div>

      <Link href={`/nutricionistas/${nutritionist.slug}`}>
        <Button className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 font-medium group-hover:bg-[#a88aed] group-hover:hover:bg-[#8f70d8] transition-all cursor-pointer">
          <span>Ver perfil</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
}
