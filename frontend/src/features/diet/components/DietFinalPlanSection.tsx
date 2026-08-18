"use client";

import {
  FileCheck,
  Download,
  Save,
  User,
  Apple,
  ChefHat,
  ShoppingCart,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
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
  calorieTarget: number;
  onExportPdf: () => void;
  onSaveCreation: () => void;
  onContinueToDeliverable: () => void;
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
  calorieTarget,
  onExportPdf,
  onSaveCreation,
  onContinueToDeliverable,
}: DietFinalPlanSectionProps) {
  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-indigo-50 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
              La estrategia nutricional para {patientName || "el paciente"} está estructurada en sus 4 dimensiones.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            type="button"
            onClick={onExportPdf}
            className="h-11 rounded-xl bg-emerald-600 px-5 font-bold text-white shadow-md hover:bg-emerald-700 w-full sm:w-auto justify-center"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onSaveCreation}
            className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 w-full sm:w-auto justify-center"
          >
            <Save className="mr-2 h-4 w-4" />
            Guardar Pauta
          </Button>
        </div>
      </div>

      {/* Grid de 4 Dimensiones de la Pauta */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Dimensión 1: Paciente e Info General */}
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <User className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">1. Contexto del Paciente</h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">Verificado</span>
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
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Apple className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">2. Estrategia & Dieta Base</h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">Configurada</span>
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
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ChefHat className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">3. Recetas y Porciones</h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">Estructurado</span>
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
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">4. Carrito de Compras</h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">Calculado</span>
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
      </div>

      {/* Botón Acción Principal */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-indigo-100 bg-indigo-50/60 p-6 sm:flex-row">
        <div>
          <h3 className="text-base font-black text-slate-900">¿Listo para entregar o ajustar detalles?</h3>
          <p className="mt-0.5 text-xs text-slate-600">
            Puedes descargar el PDF inmediatamente o ir al módulo de Entregables para personalizar formatos.
          </p>
        </div>

        <Button
          type="button"
          onClick={onContinueToDeliverable}
          className="h-11 rounded-xl bg-indigo-600 px-6 font-bold text-white shadow-md hover:bg-indigo-700"
        >
          Continuar a Entregables
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
