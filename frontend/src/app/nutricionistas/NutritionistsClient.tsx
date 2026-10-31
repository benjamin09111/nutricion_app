"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  MapPin,
  Calendar,
  Video,
  Users,
  ArrowRight,
  Loader2,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import NutritionistCTAButton from "@/components/landing/NutritionistCTAButton";
import { fetchApi } from "@/lib/api-base";
import { toast } from "sonner";
import type {
  PublicNutritionistsResponse,
  PublicNutritionist,
  MatchedNutritionistItem,
  MatchNutritionistsResponse,
} from "@/lib/public-nutritionists";
import { JsonLd } from "@/components/seo/JsonLd";
import NutriMatchAccordion from "./components/NutriMatchAccordion";
import TopMatchCards from "./components/TopMatchCards";

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
  const [nutritionists, setNutritionists] = useState<PublicNutritionist[]>(
    initialData.nutritionists,
  );
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(initialData.page || 1);
  const [lastPage, setLastPage] = useState(initialData.lastPage || 1);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [isAccordionOpen, setIsAccordionOpen] = useState(false); // Closed by default
  const [matchResults, setMatchResults] = useState<
    MatchedNutritionistItem[] | null
  >(null);

  const filtersRef = useRef({ search, modeFilter, locationFilter, page });
  const accordionRef = useRef<HTMLDivElement>(null);
  const directoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    filtersRef.current = { search, modeFilter, locationFilter, page };
  }, [search, modeFilter, locationFilter, page]);

  const loadNutritionists = async (targetPage = page) => {
    setIsLoading(true);
    try {
      const { search: s, modeFilter: m, locationFilter: l } =
        filtersRef.current;
      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("limit", "12");
      if (s) params.set("search", s);
      if (m) params.set("mode", m);
      if (l) params.set("location", l);

      const response = await fetchApi(
        `/public/nutritionists?${params.toString()}`,
      );
      if (response.ok) {
        const data = await response.json();
        setNutritionists(data.nutritionists || []);
        setTotal(data.total || 0);
        setPage(data.page || targetPage);
        setLastPage(data.lastPage || 1);
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
    setPage(1);
    loadNutritionists(1);
  };

  const clearFilters = () => {
    setSearch("");
    setModeFilter("");
    setLocationFilter("");
    setPage(1);
    filtersRef.current = {
      search: "",
      modeFilter: "",
      locationFilter: "",
      page: 1,
    };
    loadNutritionists(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > lastPage || newPage === page) return;
    setPage(newPage);
    loadNutritionists(newPage);
    directoryRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleMatchComplete = (response: MatchNutritionistsResponse) => {
    if (response.matches && response.matches.length > 0) {
      setMatchResults(response.matches);
      setIsAccordionOpen(false); // Collapses cleanly upon completion
      toast.success(
        `¡Encontramos ${response.matches.length} nutricionistas ideales para ti!`,
      );
      setTimeout(() => {
        accordionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } else {
      toast.info(
        "No encontramos coincidencias exactas con todos los filtros, pero puedes explorar todo el catálogo abajo.",
      );
    }
  };

  const hasActiveFilters = search || modeFilter || locationFilter;

  return (
    <div className="min-h-screen bg-white">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "NutriNet - Directorio de Nutricionistas",
            description:
              "Directorio completo de nutricionistas en Chile. Busca, compara y agenda tu consulta online o presencial.",
            url: "https://nutrinet.cl",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate:
                  "https://nutrinet.cl/nutricionistas?search={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
            publisher: {
              "@type": "Organization",
              name: "NutriNet",
              url: "https://nutrinet.cl",
              logo: "https://nutrinet.cl/logo_2.webp",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Inicio",
                item: "https://nutrinet.cl",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Nutricionistas",
                item: "https://nutrinet.cl/nutricionistas",
              },
            ],
          },
        ]}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo_2.webp"
              alt="nutrinet"
              width={110}
              height={35}
              style={{ height: "auto" }}
              className="h-auto w-[100px] sm:w-[130px] object-contain"
              priority
            />
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#a88aed] transition-colors"
            >
              Inicio
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsAccordionOpen((prev) => !prev);
                accordionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#8f70d8] hover:text-[#7952c4] transition-all bg-[#a88aed]/10 hover:bg-[#a88aed]/20 px-3.5 py-1.5 rounded-full border border-[#a88aed]/30 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#a88aed]" />
              {isAccordionOpen ? "Ocultar NutriMatch" : "Asistente NutriMatch"}
            </button>
            <Link href="/login">
              <Button className="rounded-full h-8 sm:h-9 px-3 sm:px-5 text-xs sm:text-xs font-bold uppercase tracking-wider bg-[#a88aed] hover:bg-[#8f70d8]">
                Iniciar sesión
              </Button>
            </Link>
            <NutritionistCTAButton />
          </nav>
        </div>
      </header>

      {/* Hero Section: Manual search is primary */}
      <section className="relative py-8 sm:py-12 bg-gradient-to-b from-slate-50 via-purple-50/20 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 mb-2">
            Portal de <span className="text-[#a88aed]">Nutricionistas</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mb-6">
            Busca y compara perfiles profesionales, revisa horarios de atención
            y toma hora directamente.
          </p>

          {/* PRIMARY: Manual Search Bar */}
          <div id="busqueda" className="max-w-3xl mx-auto mb-6">
            <form onSubmit={handleSearch} className="px-2 sm:px-0">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, especialidad (deportiva, digestiva...) o ciudad..."
                    className="h-13 pl-12 rounded-2xl border-slate-200 bg-white text-sm sm:text-base shadow-xs"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-13 px-8 rounded-2xl bg-[#a88aed] hover:bg-[#8f70d8] font-bold cursor-pointer text-sm"
                >
                  Buscar
                </Button>
              </div>
            </form>

            {/* Quick Filters */}
            <div className="flex flex-wrap justify-center items-center gap-2 mt-3.5">
              {MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => {
                    setModeFilter(modeFilter === mode.value ? "" : mode.value);
                    setPage(1);
                    filtersRef.current.modeFilter =
                      modeFilter === mode.value ? "" : mode.value;
                    filtersRef.current.page = 1;
                    loadNutritionists(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    modeFilter === mode.value
                      ? "bg-[#a88aed] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* INLINE ACCORDION MATCHMAKER (CLOSED BY DEFAULT) */}
          <div ref={accordionRef} className="pt-2">
            <NutriMatchAccordion
              isOpen={isAccordionOpen}
              onToggle={() => setIsAccordionOpen((prev) => !prev)}
              onMatchComplete={handleMatchComplete}
            />
          </div>

          {/* TOP 3 MATCH RESULTS (DISPLAYED WHEN USER EXECUTES MATCH) */}
          {matchResults && (
            <div className="text-left mt-6">
              <TopMatchCards
                matches={matchResults}
                onResetMatch={() => setMatchResults(null)}
              />
            </div>
          )}
        </div>
      </section>

      {/* Directory Section with Full Pagination */}
      <section id="catalogo" ref={directoryRef} className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Directorio de Profesionales
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Mostrando {nutritionists.length} de {total} profesionales
                disponibles (Página {page} de {lastPage})
              </p>
            </div>

            {!isAccordionOpen && (
              <button
                type="button"
                onClick={() => {
                  setIsAccordionOpen(true);
                  accordionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="text-xs font-bold text-[#8f70d8] hover:text-[#7952c4] flex items-center gap-1.5 self-start sm:self-auto cursor-pointer p-1"
              >
                <Sparkles className="h-3.5 w-3.5" />
                ¿Quieres una recomendación automática? Abre el asistente aquí
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#a88aed]" />
              <span className="ml-3 text-slate-500 font-medium">
                Cargando profesionales...
              </span>
            </div>
          ) : nutritionists.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                No encontramos nutricionistas con estos filtros
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Intenta con otros términos o limpia los filtros."
                  : "Aún no hay nutricionistas publicados en el directorio."}
              </p>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl cursor-pointer text-xs"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Grid of Cards */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {nutritionists.map((nutri) => (
                  <NutritionistCard key={nutri.id} nutritionist={nutri} />
                ))}
              </div>

              {/* PAGINATION CONTROLS */}
              {lastPage > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 pt-6 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 cursor-pointer h-9 px-3"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: lastPage }, (_, i) => i + 1).map(
                      (p) => {
                        const isCurrent = p === page;
                        return (
                          <button
                            key={p}
                            onClick={() => handlePageChange(p)}
                            className={`h-9 w-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isCurrent
                                ? "bg-[#a88aed] text-white shadow-xs"
                                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      },
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= lastPage}
                    onClick={() => handlePageChange(page + 1)}
                    className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 cursor-pointer h-9 px-3"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-slate-400 text-xs">
            © 2026 NutriNet. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

function NutritionistCard({
  nutritionist,
}: {
  nutritionist: PublicNutritionist;
}) {
  const modeLabels: Record<string, string> = {
    online: "Online",
    presencial: "Presencial",
    both: "Online y Presencial",
  };

  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-5 transition-all hover:shadow-xl hover:shadow-slate-100 hover:border-[#a88aed]/30 flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-3.5 mb-3.5">
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
            <h3 className="font-bold text-slate-900 text-base group-hover:text-[#a88aed] transition-colors truncate">
              {nutritionist.fullName}
            </h3>
            <p className="text-[10px] font-semibold text-[#a88aed] uppercase tracking-wider mb-0.5">
              Nutricionista
            </p>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="h-3 w-3 text-amber-400 fill-amber-400"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {nutritionist.specialty && (
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {nutritionist.specialty}
              </p>
            )}
          </div>
        </div>

        {nutritionist.headline && (
          <p className="text-xs text-slate-600 mb-3 line-clamp-2">
            {nutritionist.headline}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
            {modeLabels[nutritionist.consultationMode] ||
              nutritionist.consultationMode}
          </span>
          {nutritionist.location && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
              <MapPin className="h-3 w-3" />
              {nutritionist.location}
            </span>
          )}
        </div>

        {nutritionist.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {nutritionist.specialties.slice(0, 3).map((specialty) => (
              <span
                key={specialty}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-medium text-emerald-700"
              >
                {specialty}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
        <Link
          href={`/nutricionistas/${nutritionist.slug}#agenda`}
          className="flex-1"
        >
          <Button className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 font-medium group-hover:bg-[#a88aed] group-hover:hover:bg-[#8f70d8] transition-all cursor-pointer text-xs py-2">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span>Tomar Hora</span>
          </Button>
        </Link>
        <Link href={`/nutricionistas/${nutritionist.slug}`}>
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 text-xs px-3 py-2 cursor-pointer"
            title="Ver perfil completo"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
