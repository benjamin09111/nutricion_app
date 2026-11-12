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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Resumen y Entregable Consolidado</h2>
          <p className="text-xs text-slate-500">
            Personaliza las secciones a incluir en el PDF final antes de descargar o guardar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={handleSaveAndExport}
            className="h-10 rounded-xl bg-[#86A83C] px-4 text-xs font-bold text-white shadow-2xs hover:bg-[#78A82F] cursor-pointer"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Guardar y Descargar PDF
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onSaveCreation}
            className="h-10 rounded-xl border-[#E9E5E7] bg-white px-3.5 text-xs font-semibold text-slate-700 hover:border-[#86A83C] hover:bg-[#F0F5DF] hover:text-[#668E20] shadow-2xs cursor-pointer"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Solo Guardar
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onExportPdf}
            className="h-10 rounded-xl border-[#E9E5E7] bg-white px-3.5 text-xs font-semibold text-slate-700 hover:border-[#86A83C] hover:bg-[#F0F5DF] hover:text-[#668E20] shadow-2xs cursor-pointer"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Solo Descargar PDF
          </Button>
        </div>
      </div>

      {/* Grid de Dimensiones de la Pauta */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Dimensión 0: Portada e Introducción */}
        <div
          className={
            "space-y-4 rounded-2xl border p-5 transition-all shadow-2xs " +
            (includeIntroInPdf ? "border-[#E9E5E7] bg-white" : "border-dashed border-[#E9E5E7] bg-slate-50/60 opacity-75")
          }
        >
          <div className="flex items-center justify-between border-b border-[#F0ECEE] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <FileCheck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Portada e Introducción</h3>
            </div>
            <button
              type="button"
              onClick={() => setIncludeIntroInPdf(!includeIntroInPdf)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer " +
                (includeIntroInPdf
                  ? "border-[#DDE7B8] bg-[#F0F5DF] text-[#668E20] hover:bg-[#E8EFCB]"
                  : "border-[#E9E5E7] bg-white text-slate-500 hover:bg-slate-50")
              }
            >
              <span className={"h-1.5 w-1.5 rounded-full " + (includeIntroInPdf ? "bg-[#86A83C]" : "bg-slate-400")} />
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
        <div className="space-y-4 rounded-2xl border border-[#E9E5E7] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#F0ECEE] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                <User className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">1. Contexto del Paciente</h3>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DDE7B8] bg-[#F0F5DF] px-2.5 py-0.5 text-[11px] font-bold text-[#668E20]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#86A83C]" />
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
              <span className="font-bold text-[#668E20]">{calorieTarget > 0 ? `${calorieTarget} kcal/día` : "Personalizada"}</span>
            </div>
          </div>
        </div>

        {/* Dimensión 2: Dieta Base */}
        <div
          className={
            "space-y-4 rounded-2xl border p-5 transition-all shadow-2xs " +
            (includeFoodTableSection ? "border-[#E9E5E7] bg-white" : "border-dashed border-[#E9E5E7] bg-slate-50/60 opacity-75")
          }
        >
          <div className="flex items-center justify-between border-b border-[#F0ECEE] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                <Apple className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">2. Estrategia & Dieta Base</h3>
            </div>

            <button
              type="button"
              onClick={() => setIncludeFoodTableSection(!includeFoodTableSection)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer " +
                (includeFoodTableSection
                  ? "border-[#DDE7B8] bg-[#F0F5DF] text-[#668E20] hover:bg-[#E8EFCB]"
                  : "border-[#E9E5E7] bg-white text-slate-500 hover:bg-slate-50")
              }
            >
              <span
                className={
                  "h-1.5 w-1.5 rounded-full " + (includeFoodTableSection ? "bg-[#86A83C]" : "bg-slate-400")
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
              <span className="font-bold text-[#668E20]">{totalSelectedFoods} víveres permitidos</span>
            </div>
          </div>
        </div>

        {/* Dimensión 3: Recetas y Porciones */}
        <div
          className={
            "space-y-4 rounded-2xl border p-5 transition-all shadow-2xs " +
            (includeMealsSection ? "border-[#E9E5E7] bg-white" : "border-dashed border-[#E9E5E7] bg-slate-50/60 opacity-75")
          }
        >
          <div className="flex items-center justify-between border-b border-[#F0ECEE] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ChefHat className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">3. Recetas y Porciones</h3>
            </div>

            <button
              type="button"
              onClick={() => setIncludeMealsSection(!includeMealsSection)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer " +
                (includeMealsSection
                  ? "border-[#DDE7B8] bg-[#F0F5DF] text-[#668E20] hover:bg-[#E8EFCB]"
                  : "border-[#E9E5E7] bg-white text-slate-500 hover:bg-slate-50")
              }
            >
              <span
                className={
                  "h-1.5 w-1.5 rounded-full " + (includeMealsSection ? "bg-[#86A83C]" : "bg-slate-400")
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
            "space-y-4 rounded-2xl border p-5 transition-all shadow-2xs " +
            (includeCartSection ? "border-[#E9E5E7] bg-white" : "border-dashed border-[#E9E5E7] bg-slate-50/60 opacity-75")
          }
        >
          <div className="flex items-center justify-between border-b border-[#F0ECEE] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">4. Carrito de Compras</h3>
            </div>

            <button
              type="button"
              onClick={() => setIncludeCartSection(!includeCartSection)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer " +
                (includeCartSection
                  ? "border-[#DDE7B8] bg-[#F0F5DF] text-[#668E20] hover:bg-[#E8EFCB]"
                  : "border-[#E9E5E7] bg-white text-slate-500 hover:bg-slate-50")
              }
            >
              <span
                className={
                  "h-1.5 w-1.5 rounded-full " + (includeCartSection ? "bg-[#86A83C]" : "bg-slate-400")
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
            "space-y-4 rounded-2xl border p-5 transition-all shadow-2xs " +
            (includeResourcesSection ? "border-[#E9E5E7] bg-white" : "border-dashed border-[#E9E5E7] bg-slate-50/60 opacity-75")
          }
        >
          <div className="flex items-center justify-between border-b border-[#F0ECEE] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">5. Recursos Educativos</h3>
            </div>

            <button
              type="button"
              onClick={() => setIncludeResourcesSection(!includeResourcesSection)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer " +
                (includeResourcesSection
                  ? "border-[#DDE7B8] bg-[#F0F5DF] text-[#668E20] hover:bg-[#E8EFCB]"
                  : "border-[#E9E5E7] bg-white text-slate-500 hover:bg-slate-50")
              }
            >
              <span
                className={
                  "h-1.5 w-1.5 rounded-full " + (includeResourcesSection ? "bg-[#86A83C]" : "bg-slate-400")
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
            "space-y-4 rounded-2xl border p-5 transition-all shadow-2xs " +
            (includeAvoidFoodsInPdf ? "border-[#E9E5E7] bg-white" : "border-dashed border-[#E9E5E7] bg-slate-50/60 opacity-75")
          }
        >
          <div className="flex items-center justify-between border-b border-[#F0ECEE] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Ban className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">6. Alimentos a Evitar</h3>
            </div>

            <button
              type="button"
              onClick={() => setIncludeAvoidFoodsInPdf(!includeAvoidFoodsInPdf)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer " +
                (includeAvoidFoodsInPdf
                  ? "border-[#DDE7B8] bg-[#F0F5DF] text-[#668E20] hover:bg-[#E8EFCB]"
                  : "border-[#E9E5E7] bg-white text-slate-500 hover:bg-slate-50")
              }
            >
              <span className={"h-1.5 w-1.5 rounded-full " + (includeAvoidFoodsInPdf ? "bg-[#86A83C]" : "bg-slate-400")} />
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
            "space-y-4 rounded-2xl border p-5 transition-all shadow-2xs " +
            (includeClosingInPdf ? "border-[#E9E5E7] bg-white" : "border-dashed border-[#E9E5E7] bg-slate-50/60 opacity-75")
          }
        >
          <div className="flex items-center justify-between border-b border-[#F0ECEE] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                <MessageCircleHeart className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">7. Despedida</h3>
            </div>

            <button
              type="button"
              onClick={() => setIncludeClosingInPdf(!includeClosingInPdf)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer " +
                (includeClosingInPdf
                  ? "border-[#DDE7B8] bg-[#F0F5DF] text-[#668E20] hover:bg-[#E8EFCB]"
                  : "border-[#E9E5E7] bg-white text-slate-500 hover:bg-slate-50")
              }
            >
              <span className={"h-1.5 w-1.5 rounded-full " + (includeClosingInPdf ? "bg-[#86A83C]" : "bg-slate-400")} />
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
