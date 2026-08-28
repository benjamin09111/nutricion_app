"use client";

import {
  FileCheck,
  Download,
  Save,
  User,
  Apple,
  ChefHat,
  ShoppingCart,
  Sparkles,
  Ban,
  MessageCircleHeart,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DietFinalPlanSectionProps {
  patientName?: string | null;
  patientAge?: number | null;
  patientGender?: string | null;
  patientFocus?: string | null;
  dietName: string;
  totalFoodGroups: number;
  totalSelectedFoods: number;
  totalMeals: number;
  totalCartItems: number;
  totalResources: number;
  totalAvoidFoods: number;
  calorieTarget: number;
  onExportPdf: () => void;
  onSaveCreation: () => void;

  includeFoodTableSection: boolean;
  setIncludeFoodTableSection: (val: boolean) => void;
  includeMealsSection: boolean;
  setIncludeMealsSection: (val: boolean) => void;
  includeCartSection: boolean;
  setIncludeCartSection: (val: boolean) => void;
  includeResourcesSection: boolean;
  setIncludeResourcesSection: (val: boolean) => void;
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
  totalCartItems,
  totalResources,
  totalAvoidFoods,
  calorieTarget,
  onExportPdf,
  onSaveCreation,
  includeFoodTableSection,
  setIncludeFoodTableSection,
  includeMealsSection,
  setIncludeMealsSection,
  includeCartSection,
  setIncludeCartSection,
  includeResourcesSection,
  setIncludeResourcesSection,
  includeAvoidFoodsInPdf,
  setIncludeAvoidFoodsInPdf,
  includeIntroInPdf,
  setIncludeIntroInPdf,
  includeClosingInPdf,
  setIncludeClosingInPdf,
}: DietFinalPlanSectionProps) {
  const handleSaveAndExport = () => {
    onSaveCreation();
    onExportPdf();
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-indigo-50 p-6 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Paso Final</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Plan Final</span>
            </div>
            <h2 className="mt-1 text-xl font-black text-slate-900">Resumen y Entregable Consolidado</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Personaliza las secciones a incluir en el PDF final antes de descargar o guardar.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full xl:w-auto">
          {/* 1. Guardar y Descargar PDF */}
          <Button
            type="button"
            onClick={handleSaveAndExport}
            className="h-11 rounded-xl bg-emerald-600 px-5 font-bold text-white shadow-md hover:bg-emerald-700 w-full sm:w-auto justify-center"
          >
            <Save className="mr-1.5 h-4 w-4" />
            <Download className="mr-2 h-4 w-4" />
            Guardar y Descargar PDF
          </Button>

          {/* 2. Solo Guardar */}
          <Button
            type="button"
            variant="outline"
            onClick={onSaveCreation}
            className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 w-full sm:w-auto justify-center"
          >
            <Save className="mr-2 h-4 w-4" />
            Solo Guardar
          </Button>

          {/* 3. Solo Descargar PDF */}
          <Button
            type="button"
            variant="outline"
            onClick={onExportPdf}
            className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 w-full sm:w-auto justify-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Solo Descargar PDF
          </Button>
        </div>
      </div>

      {/* Grid de Dimensiones de la Pauta */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Dimensión 0: Portada e Introducción */}
        <div
          className={
            "space-y-4 rounded-3xl border p-6 transition-all shadow-sm " +
            (includeIntroInPdf ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50/60 opacity-75")
          }
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <FileCheck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Portada e Introducción</h3>
            </div>
            <button
              type="button"
              onClick={() => setIncludeIntroInPdf(!includeIntroInPdf)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-all cursor-pointer " +
                (includeIntroInPdf
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100")
              }
            >
              <span className={"h-2 w-2 rounded-full " + (includeIntroInPdf ? "bg-emerald-500" : "bg-slate-400")} />
              {includeIntroInPdf ? "Incluido en PDF" : "Excluido de PDF"}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Encabezado principal:</span>
              <span className="font-bold text-slate-900">{dietName || "Dieta personalizada"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Diseño y marca:</span>
              <span className="font-semibold text-slate-800">NutriNet Pro</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Paciente saludado:</span>
              <span className="font-semibold text-slate-800">{patientName || "Sin paciente"}</span>
            </div>
          </div>
        </div>

        {/* Dimensión 1: Paciente e Info General */}
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <User className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">1. Contexto del Paciente</h3>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Incluido siempre
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Paciente:</span>
              <span className="font-bold text-slate-900">{patientName || "Sin paciente asignado"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Edad / Género:</span>
              <span className="font-semibold text-slate-800">
                {patientAge ? `${patientAge} años` : "No especificado"} {patientGender ? `· ${patientGender}` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Objetivo nutricional:</span>
              <span className="font-semibold text-slate-800">{patientFocus || "Optimización de salud"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Meta calórica base:</span>
              <span className="font-bold text-emerald-700">{calorieTarget > 0 ? `${calorieTarget} kcal/día` : "Personalizada"}</span>
            </div>
          </div>
        </div>

        {/* Dimensión 2: Dieta Base */}
        <div
          className={
            "space-y-4 rounded-3xl border p-6 transition-all shadow-sm " +
            (includeFoodTableSection ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50/60 opacity-75")
          }
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Apple className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">2. Estrategia & Dieta Base</h3>
            </div>

            <button
              type="button"
              onClick={() => setIncludeFoodTableSection(!includeFoodTableSection)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-all cursor-pointer " +
                (includeFoodTableSection
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100")
              }
            >
              <span
                className={
                  "h-2 w-2 rounded-full " + (includeFoodTableSection ? "bg-emerald-500" : "bg-slate-400")
                }
              />
              {includeFoodTableSection ? "Incluido en PDF" : "Excluido de PDF"}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Nombre de la dieta:</span>
              <span className="font-bold text-slate-900">{dietName || "Dieta personalizada"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Grupos de alimento habilitados:</span>
              <span className="font-semibold text-slate-800">{totalFoodGroups} categorías</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Alimentos seleccionados:</span>
              <span className="font-bold text-indigo-600">{totalSelectedFoods} víveres permitidos</span>
            </div>
          </div>
        </div>

        {/* Dimensión 3: Recetas y Porciones */}
        <div
          className={
            "space-y-4 rounded-3xl border p-6 transition-all shadow-sm " +
            (includeMealsSection ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50/60 opacity-75")
          }
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ChefHat className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">3. Recetas y Porciones</h3>
            </div>

            <button
              type="button"
              onClick={() => setIncludeMealsSection(!includeMealsSection)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-all cursor-pointer " +
                (includeMealsSection
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100")
              }
            >
              <span
                className={
                  "h-2 w-2 rounded-full " + (includeMealsSection ? "bg-emerald-500" : "bg-slate-400")
                }
              />
              {includeMealsSection ? "Incluido en PDF" : "Excluido de PDF"}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Bloques horarios de comida:</span>
              <span className="font-bold text-slate-900">{totalMeals} comidas al día</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Guía de intercambios:</span>
              <span className="font-semibold text-slate-800">Porciones clínicas incluidas</span>
            </div>
          </div>
        </div>

        {/* Dimensión 4: Carrito de Compras */}
        <div
          className={
            "space-y-4 rounded-3xl border p-6 transition-all shadow-sm " +
            (includeCartSection ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50/60 opacity-75")
          }
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">4. Carrito de Compras</h3>
            </div>

            <button
              type="button"
              onClick={() => setIncludeCartSection(!includeCartSection)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-all cursor-pointer " +
                (includeCartSection
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100")
              }
            >
              <span
                className={
                  "h-2 w-2 rounded-full " + (includeCartSection ? "bg-emerald-500" : "bg-slate-400")
                }
              />
              {includeCartSection ? "Incluido en PDF" : "Excluido de PDF"}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Ítems en lista de compras:</span>
              <span className="font-bold text-slate-900">{totalCartItems} productos</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Organización de despensa:</span>
              <span className="font-semibold text-slate-800">Por categoría de víveres</span>
            </div>
          </div>
        </div>

        {/* Dimensión 5: Recursos Educativos */}
        <div
          className={
            "space-y-4 rounded-3xl border p-6 transition-all shadow-sm " +
            (includeResourcesSection ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50/60 opacity-75")
          }
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">5. Recursos Educativos</h3>
            </div>

            <button
              type="button"
              onClick={() => setIncludeResourcesSection(!includeResourcesSection)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-all cursor-pointer " +
                (includeResourcesSection
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100")
              }
            >
              <span
                className={
                  "h-2 w-2 rounded-full " + (includeResourcesSection ? "bg-emerald-500" : "bg-slate-400")
                }
              />
              {includeResourcesSection ? "Incluido en PDF" : "Excluido de PDF"}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Guías de apoyo seleccionadas:</span>
              <span className="font-bold text-slate-900">{totalResources} lecturas</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Material educativo:</span>
              <span className="font-semibold text-slate-800">Etiquetas, agua y variaciones</span>
            </div>
          </div>
        </div>

        {/* Dimensión 6: Alimentos a evitar */}
        <div
          className={
            "space-y-4 rounded-3xl border p-6 transition-all shadow-sm " +
            (includeAvoidFoodsInPdf ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50/60 opacity-75")
          }
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Ban className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">6. Alimentos a Evitar</h3>
            </div>

            <button
              type="button"
              onClick={() => setIncludeAvoidFoodsInPdf(!includeAvoidFoodsInPdf)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-all cursor-pointer " +
                (includeAvoidFoodsInPdf
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100")
              }
            >
              <span className={"h-2 w-2 rounded-full " + (includeAvoidFoodsInPdf ? "bg-emerald-500" : "bg-slate-400")} />
              {includeAvoidFoodsInPdf ? "Incluido en PDF" : "Excluido de PDF"}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Alimentos restringidos:</span>
              <span className="font-bold text-slate-900">{totalAvoidFoods} alimentos</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Configuración:</span>
              <span className="font-semibold text-slate-800">Definida en paso "Comidas"</span>
            </div>
          </div>
        </div>

        {/* Dimensión 7: Despedida */}
        <div
          className={
            "space-y-4 rounded-3xl border p-6 transition-all shadow-sm " +
            (includeClosingInPdf ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50/60 opacity-75")
          }
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <MessageCircleHeart className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">7. Despedida</h3>
            </div>

            <button
              type="button"
              onClick={() => setIncludeClosingInPdf(!includeClosingInPdf)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-all cursor-pointer " +
                (includeClosingInPdf
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100")
              }
            >
              <span className={"h-2 w-2 rounded-full " + (includeClosingInPdf ? "bg-emerald-500" : "bg-slate-400")} />
              {includeClosingInPdf ? "Incluido en PDF" : "Excluido de PDF"}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Mensaje de cierre:</span>
              <span className="font-semibold text-slate-800">Editable en paso "Info general"</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
