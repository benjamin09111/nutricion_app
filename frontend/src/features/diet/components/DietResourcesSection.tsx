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
  ShieldCheck,
  BookOpen,
  Milk,
  HeartPulse,
  Leaf,
  Stethoscope,
  Search,
  Check,
  X,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#20212B]">Recursos y Material Educativo</h2>
          <p className="text-xs text-[#626573]">
            Selecciona las guías clínicas y lecturas de apoyo que se adjuntarán a la pauta para {patientName || "el paciente"}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIncludeResourcesSection(!includeResourcesSection)}
          className={
            "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer " +
            (includeResourcesSection
              ? "border-[#DDE7B8] bg-[#F0F5DF] text-[#668E20]"
              : "border-[#E9E5E7] bg-white text-[#626573] hover:bg-slate-50")
          }
        >
          <span className={"h-2 w-2 rounded-full " + (includeResourcesSection ? "bg-[#86A83C]" : "bg-slate-300")} />
          {includeResourcesSection ? "Incluido en PDF" : "Excluido de PDF"}
        </button>
      </div>

      {/* Restricciones Clínicas Detectadas del Paso 1 */}
      {allActiveConstraints.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-[#E9E5E7] bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#20212B] mr-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0F5DF] text-[#668E20]">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <span>Restricciones clínicas activas ({allActiveConstraints.length}):</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {allActiveConstraints.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#DDE7B8] bg-[#F0F5DF] px-2.5 py-1 text-xs font-semibold text-[#668E20]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#86A83C]" />
                {formatConstraintLabel(item)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Banner de Recomendación Automática por Restricción Clínica */}
      {recommendedResourceIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#DDE7B8] bg-[#F0F5DF] p-4 text-xs shadow-2xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#86A83C] text-white shadow-2xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-[#20212B] text-xs sm:text-sm">
              {recommendedResourceIds.length} recurso(s) sugerido(s) por condición clínica
            </h4>
            <p className="mt-0.5 text-xs text-[#626573]">
              Se pre-seleccionaron automáticamente las guías asociadas a las patologías y restricciones detectadas en la pauta.
            </p>
          </div>
        </div>
      )}

      {/* Buscador de Recursos & Filtros de Categoría */}
      <div className="space-y-3 rounded-2xl border border-[#E9E5E7] bg-white p-4 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar recurso por título, patología (ej: celíaco, diabetes, hipertensión, lactosa)..."
            className="h-10 pl-10 pr-4 rounded-xl border-[#E9E5E7] text-xs font-normal text-[#20212B] focus:border-[#86A83C] focus:ring-1 focus:ring-[#86A83C]"
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
            className={cn(
              "rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
              selectedCategory === "all"
                ? "bg-[#20212B] text-white shadow-2xs"
                : "border border-[#E9E5E7] bg-white text-[#626573] hover:border-[#86A83C] hover:bg-[#F0F5DF] hover:text-[#668E20]"
            )}
          >
            Todos ({DIET_RESOURCES_CATALOG.length})
          </button>

          {recommendedResourceIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedCategory("recommended")}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
                selectedCategory === "recommended"
                  ? "bg-[#20212B] text-white shadow-2xs"
                  : "border border-[#DDE7B8] bg-[#F0F5DF] text-[#668E20] hover:bg-[#E8EFCB]"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Sugeridos ({recommendedResourceIds.length})
            </button>
          )}

          {categories
            .filter((c) => c !== "all" && c !== "recommended")
            .map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                  selectedCategory === cat
                    ? "bg-[#20212B] text-white shadow-2xs"
                    : "border border-[#E9E5E7] bg-white text-[#626573] hover:border-[#86A83C] hover:bg-[#F0F5DF] hover:text-[#668E20]"
                )}
              >
                {cat}
              </button>
            ))}
        </div>
      </div>

      {/* Control Quick Actions Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#20212B]">
            Catálogo de Recursos de Apoyo ({filteredCatalog.length})
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-semibold">
          <span className="rounded-full bg-[#F0F5DF] px-2.5 py-0.5 text-[#668E20] font-semibold border border-[#DDE7B8]">
            {selectedResourceIds.length} seleccionados
          </span>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={selectAll}
            className="text-[#668E20] hover:text-[#86A83C] transition-colors cursor-pointer"
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
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#E9E5E7] bg-white p-12 text-center shadow-2xs">
          <Search className="h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-[#20212B]">No se encontraron recursos</h3>
          <p className="mt-1 text-xs text-[#626573] max-w-sm">
            No hay lecturas que coincidan con &quot;{searchQuery}&quot;. Intenta con otro término o limpia la búsqueda.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-4 text-xs font-semibold text-[#668E20] hover:underline cursor-pointer"
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
                className={cn(
                  "group relative cursor-pointer rounded-2xl border p-4.5 transition-all shadow-2xs flex flex-col justify-between select-none",
                  isSelected
                    ? "border-[#86A83C] bg-white shadow-sm ring-1 ring-[#86A83C]/30"
                    : "border-[#E9E5E7] bg-white hover:border-slate-300 opacity-90 hover:opacity-100"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                        isSelected || isRecommended
                          ? "bg-[#F0F5DF] text-[#668E20]"
                          : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
                      )}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full transition-all",
                        isSelected
                          ? "bg-[#86A83C] text-white shadow-2xs"
                          : "border border-slate-300 bg-white text-transparent group-hover:border-slate-400"
                      )}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Recommendations Badge */}
                  {isRecommended && (
                    <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-[#DDE7B8] bg-[#F0F5DF] px-2.5 py-0.5 text-[10px] font-medium text-[#668E20]">
                      <ShieldCheck className="h-3 w-3 text-[#86A83C]" />
                      <span>{resource.recommendationReason}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">
                      {resource.category}
                    </span>
                    <h3 className="mt-0.5 text-sm font-semibold text-[#20212B] leading-snug">
                      {resource.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-[#626573] font-normal leading-relaxed">
                      {resource.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-normal text-slate-400">
                    {isSelected ? "Incluido en la pauta" : "Haz clic para agregar"}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isSelected ? "text-[#668E20]" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  >
                    {isSelected ? "✓ Seleccionado" : "+ Agregar"}
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
