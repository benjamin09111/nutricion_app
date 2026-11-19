"use client";

import {
  FileCheck,
  Download,
  Save,
  User,
  ChefHat,
  ShoppingCart,
  BookOpen,
  Ban,
  MessageCircleHeart,
  Eye,
  Lock,
  Clock,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isGuestMode } from "@/lib/demo-local-api";
import { cn } from "@/lib/utils";

interface DietFinalPlanSectionProps {
  patientName?: string | null;
  patientAge?: number | null;
  patientGender?: string | null;
  patientFocus?: string | null;
  dietName: string;
  totalFoodGroups: number;
  totalSelectedFoods: number;
  totalMeals: number;
  totalRecipes?: number;
  totalCartItems: number;
  totalResources: number;
  totalAvoidFoods: number;
  calorieTarget: number;
  onExportPdf: () => void;
  onPreviewPdf: () => void;
  onSaveCreation: () => void;
  isExportingPdf?: boolean;
  isGeneratingPreview?: boolean;

  includeFoodTableSection?: boolean;
  setIncludeFoodTableSection?: (val: boolean) => void;
  includeRecipesSection?: boolean;
  setIncludeRecipesSection?: (val: boolean) => void;
  includeMealsSection: boolean;
  setIncludeMealsSection: (val: boolean) => void;
  includeCartSection: boolean;
  setIncludeCartSection: (val: boolean) => void;
  includeResourcesSection: boolean;
  setIncludeResourcesSection: (val: boolean) => void;
  includeExchangeGuideInPdf?: boolean;
  setIncludeExchangeGuideInPdf?: (val: boolean) => void;
  includeAvoidFoodsInPdf: boolean;
  setIncludeAvoidFoodsInPdf: (val: boolean) => void;
  includeIntroInPdf: boolean;
  setIncludeIntroInPdf: (val: boolean) => void;
  includeClosingInPdf: boolean;
  setIncludeClosingInPdf: (val: boolean) => void;
}

export function DietFinalPlanSection({
  patientName,
  patientAge,
  patientGender,
  patientFocus,
  dietName,
  totalFoodGroups,
  totalSelectedFoods,
  totalMeals,
  totalRecipes = 0,
  totalCartItems,
  totalResources,
  totalAvoidFoods,
  calorieTarget,
  onExportPdf,
  onPreviewPdf,
  onSaveCreation,
  isExportingPdf = false,
  isGeneratingPreview = false,
  includeFoodTableSection,
  setIncludeFoodTableSection,
  includeRecipesSection = true,
  setIncludeRecipesSection,
  includeMealsSection,
  setIncludeMealsSection,
  includeCartSection,
  setIncludeCartSection,
  includeResourcesSection,
  setIncludeResourcesSection,
  includeExchangeGuideInPdf = true,
  setIncludeExchangeGuideInPdf,
  includeAvoidFoodsInPdf,
  setIncludeAvoidFoodsInPdf,
  includeIntroInPdf,
  setIncludeIntroInPdf,
  includeClosingInPdf,
  setIncludeClosingInPdf,
}: DietFinalPlanSectionProps) {
  const isGuest = isGuestMode();

  const handleSaveAndExport = () => {
    onSaveCreation();
    onExportPdf();
  };

  const sectionsList = [
    {
      id: "intro",
      title: "Portada y Saludo Inicial",
      subtitle: "Identificación del paciente, fecha y mensaje de bienvenida",
      icon: FileCheck,
      iconColor: "text-slate-700 bg-slate-100",
      isActive: includeIntroInPdf,
      toggle: () => setIncludeIntroInPdf(!includeIntroInPdf),
    },
    {
      id: "meals",
      title: "Tabla de Comidas y Horarios",
      subtitle: `${totalMeals} tiempos de comida distribuidos con porciones e indicaciones`,
      icon: Clock,
      iconColor: "text-amber-700 bg-amber-50",
      isActive: includeMealsSection,
      toggle: () => setIncludeMealsSection(!includeMealsSection),
    },
    {
      id: "recipes",
      title: "Recetario y Platos Sugeridos",
      subtitle: `${totalRecipes} preparaciones creadas con ingredientes, porciones y macros`,
      icon: ChefHat,
      iconColor: "text-[#668E20] bg-[#F0F5DF]",
      isActive: includeRecipesSection,
      toggle: () => setIncludeRecipesSection?.(!includeRecipesSection),
    },
    {
      id: "avoid",
      title: "Alimentos a Evitar",
      subtitle: `${totalAvoidFoods} alimentos restringidos, alérgenos o sensibilidades`,
      icon: Ban,
      iconColor: "text-rose-700 bg-rose-50",
      isActive: includeAvoidFoodsInPdf,
      toggle: () => setIncludeAvoidFoodsInPdf(!includeAvoidFoodsInPdf),
    },
    {
      id: "cart",
      title: "Lista de Compras (Carrito)",
      subtitle: `${totalCartItems} productos agrupados para facilitar la despensa del paciente`,
      icon: ShoppingCart,
      iconColor: "text-[#668E20] bg-[#F0F5DF]",
      isActive: includeCartSection,
      toggle: () => setIncludeCartSection(!includeCartSection),
    },
    {
      id: "resources",
      title: "Guías y Recursos Educativos",
      subtitle: `${totalResources} lecturas clínicas y material de educación nutricional`,
      icon: BookOpen,
      iconColor: "text-[#668E20] bg-[#F0F5DF]",
      isActive: includeResourcesSection,
      toggle: () => setIncludeResourcesSection(!includeResourcesSection),
    },
    {
      id: "portions",
      title: "Guía Práctica de Porciones",
      subtitle: "Equivalencias visuales de porciones e intercambios nutricionales",
      icon: Scale,
      iconColor: "text-teal-700 bg-teal-50",
      isActive: includeExchangeGuideInPdf,
      toggle: () => setIncludeExchangeGuideInPdf?.(!includeExchangeGuideInPdf),
    },
    {
      id: "closing",
      title: "Mensaje de Despedida",
      subtitle: "Cierre motivacional y datos de contacto profesional",
      icon: MessageCircleHeart,
      iconColor: "text-[#668E20] bg-[#F0F5DF]",
      isActive: includeClosingInPdf,
      toggle: () => setIncludeClosingInPdf(!includeClosingInPdf),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera y Botones de Acción */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#20212B]">Resumen y Entregable Consolidado</h2>
          <p className="text-xs text-[#626573]">
            Revisa el resumen ejecutivo y personaliza qué secciones imprimir en el PDF.
          </p>
        </div>

        {/* Botones de acción unificados con los otros módulos */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isGuest ? (
            <>
              {/* Bloqueado en demo */}
              <Button
                type="button"
                disabled
                title="Guardar creaciones está inhabilitado en la demo"
                className="h-10 cursor-not-allowed rounded-xl bg-slate-100 px-4 text-xs font-semibold text-slate-400 border border-[#E9E5E7] shadow-none disabled:opacity-100"
              >
                <Lock className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                Guardar y Descargar PDF (Bloqueado)
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onPreviewPdf}
                disabled={isGeneratingPreview}
                className="h-10 rounded-xl border-[#DDE7B8] bg-[#F0F5DF] px-4 text-xs font-semibold text-[#668E20] hover:bg-[#E8EFCB] shadow-2xs transition-colors cursor-pointer"
              >
                <Eye className="mr-1.5 h-3.5 w-3.5 text-[#86A83C]" />
                {isGeneratingPreview ? "Generando vista..." : "Vista previa"}
              </Button>

              <Button
                type="button"
                onClick={onExportPdf}
                disabled={isExportingPdf}
                className="h-10 rounded-xl bg-[#86A83C] px-4 text-xs font-semibold text-white shadow-2xs hover:bg-[#78A82F] transition-colors cursor-pointer"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                {isExportingPdf ? "Descargando..." : "Descargar PDF"}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                onClick={handleSaveAndExport}
                disabled={isExportingPdf}
                className="h-10 rounded-xl bg-[#86A83C] px-4 text-xs font-semibold text-white shadow-2xs hover:bg-[#78A82F] transition-colors cursor-pointer"
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Guardar y Descargar PDF
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onPreviewPdf}
                disabled={isGeneratingPreview}
                className="h-10 rounded-xl border-[#DDE7B8] bg-[#F0F5DF] px-4 text-xs font-semibold text-[#668E20] hover:bg-[#E8EFCB] shadow-2xs transition-colors cursor-pointer"
              >
                <Eye className="mr-1.5 h-3.5 w-3.5 text-[#86A83C]" />
                {isGeneratingPreview ? "Generando vista..." : "Vista previa"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onExportPdf}
                disabled={isExportingPdf}
                className="h-10 rounded-xl border-[#E9E5E7] bg-white px-3.5 text-xs font-semibold text-[#20212B] hover:border-[#86A83C] hover:bg-[#F0F5DF] hover:text-[#668E20] shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="mr-1.5 h-3.5 w-3.5 text-[#626573]" />
                {isExportingPdf ? "Descargando..." : "Descargar PDF"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onSaveCreation}
                className="h-10 rounded-xl border-[#E9E5E7] bg-white px-3.5 text-xs font-semibold text-[#626573] hover:border-[#86A83C] hover:bg-[#F0F5DF] hover:text-[#668E20] shadow-2xs transition-colors cursor-pointer"
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Guardar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Ficha Resumen Ejecutivo del Plan */}
      <div className="rounded-2xl border border-[#E9E5E7] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F0ECEE] pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86A83C]">
              Pauta Nutricional Consolidada
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-[#20212B]">
              {dietName || "Dieta Personalizada"}
            </h3>
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-[#626573]">
              <div className="flex items-center gap-1.5 font-semibold text-[#20212B]">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>{patientName || "Sin paciente asignado"}</span>
              </div>
              {patientAge && <span>· {patientAge} años</span>}
              {patientGender && <span>· {patientGender}</span>}
              {patientFocus && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  {patientFocus}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#DDE7B8] bg-[#F0F5DF] px-4 py-2.5 text-left sm:text-right shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#668E20]">Meta Calórica Base</span>
            <p className="text-base font-bold text-[#20212B]">
              {calorieTarget > 0 ? `${calorieTarget} kcal/día` : "Personalizada"}
            </p>
          </div>
        </div>

        {/* 4 Métricas Clave del Plan */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#E9E5E7] bg-[#FAF9F9] p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">Dieta Base</span>
            <p className="mt-0.5 text-lg font-bold text-[#20212B]">{totalSelectedFoods} víveres</p>
            <p className="text-[11px] text-[#626573]">{totalFoodGroups} categorías activas</p>
          </div>

          <div className="rounded-xl border border-[#E9E5E7] bg-[#FAF9F9] p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">Horarios y Comidas</span>
            <p className="mt-0.5 text-lg font-bold text-[#20212B]">{totalMeals} tiempos</p>
            <p className="text-[11px] text-[#626573]">Con porciones clínicas</p>
          </div>

          <div className="rounded-xl border border-[#E9E5E7] bg-[#FAF9F9] p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">Lista de Compras</span>
            <p className="mt-0.5 text-lg font-bold text-[#20212B]">{totalCartItems} productos</p>
            <p className="text-[11px] text-[#626573]">Carrito consolidado</p>
          </div>

          <div className="rounded-xl border border-[#E9E5E7] bg-[#FAF9F9] p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">Recursos Clínicos</span>
            <p className="mt-0.5 text-lg font-bold text-[#20212B]">{totalResources} guías</p>
            <p className="text-[11px] text-[#626573]">Material educativo</p>
          </div>
        </div>
      </div>

      {/* Lista Limpia de Inclusión de Secciones en el PDF */}
      <div className="rounded-2xl border border-[#E9E5E7] bg-white p-5 sm:p-6 shadow-2xs space-y-3">
        <div className="border-b border-[#F0ECEE] pb-3">
          <h4 className="text-sm font-bold text-[#20212B]">Secciones del Entregable PDF</h4>
          <p className="text-xs text-[#626573]">
            Haz clic en cualquier interruptor para incluir o excluir ese apartado del documento impreso.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {sectionsList.map((sec) => {
            const Icon = sec.icon;

            return (
              <div key={sec.id} className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", sec.iconColor)}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#20212B] truncate">{sec.title}</p>
                    <p className="text-[11px] text-[#626573] truncate">{sec.subtitle}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={sec.toggle}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0",
                    sec.isActive
                      ? "border-[#DDE7B8] bg-[#F0F5DF] text-[#668E20] hover:bg-[#E8EFCB]"
                      : "border-[#E9E5E7] bg-slate-50 text-slate-400 hover:bg-slate-100"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", sec.isActive ? "bg-[#86A83C]" : "bg-slate-300")} />
                  {sec.isActive ? "Incluido en PDF" : "Oculto"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
