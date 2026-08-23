"use client";

import { useMemo } from "react";
import { ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AutoCartItem } from "@/features/diet/utils/cartIngredients";

interface DietCartSectionProps {
  autoCartItems: AutoCartItem[];
  includeCartSection: boolean;
  setIncludeCartSection: (value: boolean) => void;
  patientName?: string | null;
}

export function DietCartSection({
  autoCartItems,
  includeCartSection,
  setIncludeCartSection,
  patientName,
}: DietCartSectionProps) {
  const categories = useMemo(() => {
    const set = new Set(autoCartItems.map((i) => i.category));
    return Array.from(set);
  }, [autoCartItems]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/50 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Paso 5 de 6</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Carrito de Compras</span>
              <button
                type="button"
                onClick={() => setIncludeCartSection(!includeCartSection)}
                className={
                  "inline-flex items-center justify-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest transition-colors w-fit cursor-pointer " +
                  (includeCartSection
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500")
                }
              >
                <span
                  className={
                    "h-2.5 w-2.5 rounded-full " + (includeCartSection ? "bg-emerald-500" : "bg-slate-300")
                  }
                />
                {includeCartSection ? "Sección visible" : "Ocultar sección"}
              </button>
            </div>
            <h2 className="mt-1 text-xl font-black text-slate-900">Lista Automática de Alimentos</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Todos los alimentos e ingredientes usados en el plan de {patientName || "el paciente"}, listados automáticamente.
            </p>
          </div>
        </div>
      </div>

      {!includeCartSection ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-14 text-center">
          <ShoppingCart className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-500">La sección de Carrito está oculta en el entregable.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIncludeCartSection(true)}
            className="mt-4 rounded-xl border-emerald-200 bg-white font-bold text-emerald-700 hover:bg-emerald-50"
          >
            Volver a mostrarla
          </Button>
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Total de Ingredientes</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{autoCartItems.length} alimentos</p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">Recopilados automáticamente de la dieta y los platos</p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Categorías</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{categories.length} grupos</p>
              <p className="mt-1 text-xs font-semibold text-indigo-700">Organizados por grupo alimenticio</p>
            </div>
          </div>

          {/* Lista Agrupada de Ingredientes */}
          {autoCartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-14 text-center">
              <Package className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-500">Aún no hay alimentos ni ingredientes en la dieta o los platos.</p>
              <p className="mt-1 text-xs text-slate-400">Vuelve a los pasos "Dieta" o "Platos" para agregarlos.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((cat) => {
                const itemsInCat = autoCartItems.filter((i) => i.category === cat);

                return (
                  <div key={cat} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <Package className="h-4 w-4 text-emerald-600" />
                        <h4 className="text-sm font-black text-slate-900">{cat}</h4>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {itemsInCat.length} ítems
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {itemsInCat.map((item) => (
                        <div key={item.id} className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-slate-50/50">
                          <p className="text-xs font-bold text-slate-900">{item.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
