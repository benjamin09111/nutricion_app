"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Library,
  CheckCircle2,
  FileText,
  Droplet,
  Droplets,
  RefreshCw,
  Brain,
  HelpCircle,
  Activity,
  ShieldAlert,
  Milk,
  HeartPulse,
  Leaf,
  Stethoscope,
  Search,
  Sparkles,
  Check,
  X,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/Input";

export interface ResourceOption {
  id: string;
  title: string;
  category: string;
  description: string;
  iconName: string;
  relatedConstraints?: string[];
  recommendationReason?: string;
  defaultSelected?: boolean;
}

export const DIET_RESOURCES_CATALOG: ResourceOption[] = [
  {
    id: "gluten_free",
    title: "Protocolo Gluten-Free y Contaminación Cruzada",
    category: "Restricción Clínica",
    description: "Pauta completa para evitar trazas de gluten, lectura de sellos 'Libre de Gluten' y sustitutos seguros de cereales.",
    iconName: "ShieldAlert",
    relatedConstraints: ["sin_gluten", "celiaco", "celíaco", "gluten"],
    recommendationReason: "Recomendado por Restricción: Sin Gluten / Enfermedad Celíaca",
  },
  {
    id: "lactose_free",
    title: "Guía de Alimentos Libres de Lactosa & Calcio Biodisponible",
    category: "Restricción Clínica",
    description: "Opciones lácteas deslactosadas, bebidas vegetales fortificadas y fuentes sintéticas y naturales de calcio.",
    iconName: "Milk",
    relatedConstraints: ["sin_lactosa", "lactosa", "intolerancia_lactosa"],
    recommendationReason: "Recomendado por Restricción: Intolerancia a la Lactosa",
  },
  {
    id: "glycemic_control",
    title: "Manejo de Glicemia & Carga Glicémica en Diabetes / RI",
    category: "Salud Metabólica",
    description: "Estrategias para mitigar picos de glucosa postprandial, secuencia de ingesta de alimentos y fibra viscosa.",
    iconName: "Activity",
    relatedConstraints: ["diabetico", "diabetes", "resistencia_insulina", "insulina", "baja_azucar"],
    recommendationReason: "Recomendado por Patología: Diabetes / Resistencia a la Insulina",
  },
  {
    id: "sodium_reduction",
    title: "Reducción de Sodio & Salud Cardiovascular",
    category: "Salud Cardiovascular",
    description: "Sustitutos de la sal común con sazonadores naturales, especias aromáticas y lectura de miligramos de sodio en conservas.",
    iconName: "HeartPulse",
    relatedConstraints: ["hipertension", "hipertensio", "hipertensión", "baja_sodio", "cardiovascular"],
    recommendationReason: "Recomendado por Patología: Hipertensión / Salud Cardiovascular",
  },
  {
    id: "plant_based_protein",
    title: "Proteínas Vegetales Complejas & Suplementación B12",
    category: "Nutrición Vegetariana",
    description: "Combinación de legumbres y cereales para lograr aminoagramas completos y pautas de vitamina B12.",
    iconName: "Leaf",
    relatedConstraints: ["vegetariano", "vegano", "basado_en_plantas"],
    recommendationReason: "Recomendado por Estilo de Vida: Vegetariano / Vegano",
  },
  {
    id: "low_fodmap",
    title: "Protocolo Low FODMAP para SII / Colon Irritable",
    category: "Salud Digestiva",
    description: "Identificación de carbohidratos fermentables de cadena corta y fases de reintroducción gradual.",
    iconName: "Stethoscope",
    relatedConstraints: ["fodmap", "colon_irritable", "sii", "inflamacion_intestinal"],
    recommendationReason: "Recomendado por Patología: Colon Irritable / Síndrome de Intestino Irritable",
  },
  {
    id: "purine_control",
    title: "Control de Purinas & Ácido Úrico (Gota)",
    category: "Salud Metabólica",
    description: "Recomendaciones para moderar carnes rojas y mariscos, optimizando el consumo de agua e infusiones.",
    iconName: "Droplets",
    relatedConstraints: ["gota", "acido_urico", "hiperuricemia"],
    recommendationReason: "Recomendado por Patología: Gota / Hiperuricemia",
  },
  {
    id: "labels",
    title: "Guía de Lectura de Etiquetas Nutricionales",
    category: "Educación Nutricional",
    description: "Cómo interpretar ingredientes, porciones y sellos de advertencia 'Alto en'.",
    iconName: "FileText",
    defaultSelected: true,
  },
  {
    id: "hydration",
    title: "Hábitos de Hidratación y Descanso Reparador",
    category: "Estilo de Vida",
    description: "Protocolo diario de consumo de agua y pautas para la higiene del sueño.",
    iconName: "Droplet",
    defaultSelected: true,
  },
  {
    id: "substitutes",
    title: "Guía de Sustituciones y Variaciones de Alimentos",
    category: "Práctico",
    description: "Equivalencias sencillas para reemplazar alimentos según disponibilidad en el mercado.",
    iconName: "RefreshCw",
    defaultSelected: true,
  },
  {
    id: "hunger",
    title: "Hambre Real vs. Hambre Emocional",
    category: "Conducta Alimentaria",
    description: "Criterios para identificar el impulso de comer y gestionar la saciedad.",
    iconName: "Brain",
    defaultSelected: false,
  },
  {
    id: "myths",
    title: "Mitos y Realidades en Nutrición",
    category: "Mitos Nutricionales",
    description: "Aclaración científica sobre ayunos, carbohidratos de noche y superalimentos.",
    iconName: "HelpCircle",
    defaultSelected: false,
  },
];

const ICON_MAP: Record<string, any> = {
  FileText,
  Droplet,
  Droplets,
  RefreshCw,
  Brain,
  HelpCircle,
  Activity,
  ShieldAlert,
  Milk,
  HeartPulse,
  Leaf,
  Stethoscope,
};

const CONSTRAINT_LABEL_MAP: Record<string, string> = {
  sin_gluten: "Sin Gluten / Celíaco",
  celiaco: "Enfermedad Celíaca",
  sin_lactosa: "Sin Lactosa / Intolerancia",
  diabetico: "Diabetes / Resistencia a la Insulina",
  diabetes: "Diabetes Mellitus",
  resistencia_insulina: "Resistencia a la Insulina",
  hipertension: "Hipertensión / Bajo Sodio",
  vegetariano: "Vegetariano / Plant-Based",
  vegano: "Vegano",
  fodmap: "FODMAP / Colon Irritable",
  colon_irritable: "Colon Irritable / SII",
  gota: "Gota / Hiperuricemia",
  hipocalorica: "Hipocalórica",
  hiperproteica: "Hiperproteica",
  renal: "Insuficiencia Renal",
};

function cleanString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatConstraintLabel(raw: string): string {
  const normalized = raw.toLowerCase().trim();
  if (CONSTRAINT_LABEL_MAP[normalized]) {
    return CONSTRAINT_LABEL_MAP[normalized];
  }
  return raw.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

interface DietResourcesSectionProps {
  selectedResourceIds: string[];
  setSelectedResourceIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  includeResourcesSection: boolean;
  setIncludeResourcesSection: (val: boolean) => void;
  patientName?: string | null;
  activeConstraints?: string[];
  patientRestrictions?: string[];
}

export function DietResourcesSection({
  selectedResourceIds,
  setSelectedResourceIds,
  includeResourcesSection,
  setIncludeResourcesSection,
  patientName,
  activeConstraints = [],
  patientRestrictions = [],
}: DietResourcesSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Restricciones clínicas activas combinadas
  const allActiveConstraints = useMemo(() => {
    const list = [...activeConstraints, ...patientRestrictions].filter(Boolean);
    return Array.from(new Set(list));
  }, [activeConstraints, patientRestrictions]);

  // Identificar recursos recomendados automáticamente por restricción
  const recommendedResourceIds = useMemo(() => {
    if (allActiveConstraints.length === 0) return [];
    const cleanedActive = allActiveConstraints.map(cleanString);

    return DIET_RESOURCES_CATALOG.filter((res) => {
      if (!res.relatedConstraints) return false;
      return res.relatedConstraints.some((rel) => {
        const cleanedRel = cleanString(rel);
        return cleanedActive.some(
          (act) => act.includes(cleanedRel) || cleanedRel.includes(act)
        );
      });
    }).map((res) => res.id);
  }, [allActiveConstraints]);

  // Auto-seleccionar recursos recomendados por patología/restricción
  useEffect(() => {
    if (recommendedResourceIds.length === 0) return;

    setSelectedResourceIds((prev) => {
      const mergedSet = new Set([...prev, ...recommendedResourceIds]);
      if (
        mergedSet.size === prev.length &&
        prev.every((id) => mergedSet.has(id))
      ) {
        return prev;
      }
      return Array.from(mergedSet);
    });
  }, [recommendedResourceIds, setSelectedResourceIds]);

  // Lista de categorías únicas para filtros
  const categories = useMemo(() => {
    const set = new Set(DIET_RESOURCES_CATALOG.map((r) => r.category));
    return ["all", "recommended", ...Array.from(set)];
  }, []);

  // Filtrar catálogo por búsqueda y categoría
  const filteredCatalog = useMemo(() => {
    return DIET_RESOURCES_CATALOG.filter((resource) => {
      const isRecommended = recommendedResourceIds.includes(resource.id);
      
      if (selectedCategory === "recommended" && !isRecommended) {
        return false;
      }
      if (selectedCategory !== "all" && selectedCategory !== "recommended" && resource.category !== selectedCategory) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        resource.title.toLowerCase().includes(q) ||
        resource.category.toLowerCase().includes(q) ||
        resource.description.toLowerCase().includes(q) ||
        (resource.recommendationReason && resource.recommendationReason.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory, recommendedResourceIds]);

  const toggleResource = (id: string) => {
    setSelectedResourceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedResourceIds(DIET_RESOURCES_CATALOG.map((r) => r.id));
  };

  const clearAll = () => {
    setSelectedResourceIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-white to-purple-50/60 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <Library className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Paso 6</span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-800">Recursos y Guías</span>
            </div>
            <h2 className="mt-1 text-xl font-black text-slate-900">Recursos y Material Educativo</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Selecciona o busca las guías clínicas y lecturas de apoyo que se adjuntarán a la pauta para {patientName || "el paciente"}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIncludeResourcesSection(!includeResourcesSection)}
            className={
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all cursor-pointer " +
              (includeResourcesSection
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200")
            }
          >
            <span className={"h-2.5 w-2.5 rounded-full " + (includeResourcesSection ? "bg-emerald-500" : "bg-slate-400")} />
            {includeResourcesSection ? "Incluido en PDF" : "Excluido de PDF"}
          </button>
        </div>
      </div>

      {/* Restricciones Clínicas Detectadas del Paso 1 */}
      {allActiveConstraints.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-black text-indigo-950 mr-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <span>Restricciones clínicas seleccionadas en Paso 1 ({allActiveConstraints.length}):</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {allActiveConstraints.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-extrabold text-indigo-900 shadow-2xs"
              >
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                {formatConstraintLabel(item)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Banner de Recomendación Automática por Restricción */}
      {recommendedResourceIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-emerald-950 text-sm">
              ✨ {recommendedResourceIds.length} Recurso(s) recomendado(s) automáticamente
            </h4>
            <p className="mt-0.5 text-emerald-800">
              El sistema identificó las restricciones activas en la pauta y pre-seleccionó las guías especializadas correspondientes.
            </p>
          </div>
        </div>
      )}

      {/* Buscador de Recursos & Filtros de Categoría */}
      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar recurso por título, patología (ej: celíaco, diabetes, hipertensión, lactosa)..."
            className="h-11 pl-10 pr-4 rounded-xl border-slate-200 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Categorías / Pill Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={
              "rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer " +
              (selectedCategory === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200")
            }
          >
            Todos ({DIET_RESOURCES_CATALOG.length})
          </button>

          {recommendedResourceIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedCategory("recommended")}
              className={
                "rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 " +
                (selectedCategory === "recommended"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200")
              }
            >
              <Sparkles className="h-3.5 w-3.5" />
              Recomendados ({recommendedResourceIds.length})
            </button>
          )}

          {categories
            .filter((c) => c !== "all" && c !== "recommended")
            .map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={
                  "rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer " +
                  (selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                }
              >
                {cat}
              </button>
            ))}
        </div>
      </div>

      {/* Control Quick Actions Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">
            Catálogo de Recursos de Apoyo ({filteredCatalog.length})
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-bold">
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-indigo-700 font-extrabold border border-indigo-100">
            {selectedResourceIds.length} seleccionados
          </span>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={selectAll}
            className="text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            Seleccionar todos
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            Desmarcar todos
          </button>
        </div>
      </div>

      {/* Resource Cards Grid */}
      {filteredCatalog.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <Search className="h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron recursos</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            No hay lecturas que coincidan con &quot;{searchQuery}&quot;. Intenta con otro término o limpia la búsqueda.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-4 text-xs font-bold text-indigo-600 hover:underline"
          >
            Ver todos los recursos
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCatalog.map((resource) => {
            const isSelected = selectedResourceIds.includes(resource.id);
            const isRecommended = recommendedResourceIds.includes(resource.id);
            const IconComponent = ICON_MAP[resource.iconName] || FileText;

            return (
              <div
                key={resource.id}
                onClick={() => toggleResource(resource.id)}
                className={
                  "group relative cursor-pointer rounded-3xl border p-5 transition-all shadow-sm flex flex-col justify-between select-none " +
                  (isRecommended && isSelected
                    ? "border-emerald-300 bg-gradient-to-b from-emerald-50/60 to-white ring-2 ring-emerald-500/20"
                    : isSelected
                    ? "border-indigo-300 bg-gradient-to-b from-indigo-50/40 to-white ring-2 ring-indigo-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 opacity-75 hover:opacity-100")
                }
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={
                        "flex h-9 w-9 items-center justify-center rounded-xl transition-colors " +
                        (isRecommended
                          ? "bg-emerald-100 text-emerald-700"
                          : isSelected
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-500")
                      }
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <div
                      className={
                        "flex h-6 w-6 items-center justify-center rounded-full transition-all " +
                        (isSelected
                          ? isRecommended
                            ? "bg-emerald-600 text-white"
                            : "bg-indigo-600 text-white"
                          : "border border-slate-300 bg-white text-transparent group-hover:border-slate-400")
                      }
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Recommendations Badge */}
                  {isRecommended && (
                    <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      <span>{resource.recommendationReason}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {resource.category}
                    </span>
                    <h3 className="mt-0.5 text-sm font-black text-slate-900 leading-snug">
                      {resource.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      {resource.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">
                    {isSelected ? "Incluido en entregable" : "Haz clic para agregar"}
                  </span>
                  <span
                    className={
                      "text-xs font-bold " +
                      (isSelected
                        ? isRecommended
                          ? "text-emerald-700"
                          : "text-indigo-600"
                        : "text-slate-400")
                    }
                  >
                    {isSelected ? "Seleccionado" : "+ Agregar"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
