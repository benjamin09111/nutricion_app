"use client";

import { useState, useMemo } from "react";
import { ShoppingCart, Package, Pencil, Check, X, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AutoCartItem } from "@/features/diet/utils/cartIngredients";
import { cleanFoodName } from "@/features/diet/utils/cartIngredients";

interface DietCartSectionProps {
  autoCartItems: AutoCartItem[];
  includeCartSection: boolean;
  setIncludeCartSection: (value: boolean) => void;
  patientName?: string | null;
  setCartItemOverride?: (id: string, newName: string) => void;
  removeCartItem?: (id: string) => void;
}

export function DietCartSection({
  autoCartItems,
  includeCartSection,
  setIncludeCartSection,
  patientName,
  setCartItemOverride,
  removeCartItem,
}: DietCartSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  const categories = useMemo(() => {
    const set = new Set(autoCartItems.map((i) => i.category));
    return Array.from(set);
  }, [autoCartItems]);

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingText(currentName);
  };

  const saveEditing = (id: string) => {
    const trimmed = editingText.trim();
    if (trimmed && setCartItemOverride) {
      setCartItemOverride(id, trimmed);
    }
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#20212B]">Lista Automática de Alimentos</h2>
          <p className="text-xs text-[#626573]">
            Todos los alimentos e ingredientes usados en el plan de {patientName || "el paciente"}, listados automáticamente.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIncludeCartSection(!includeCartSection)}
          className={
            "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer " +
            (includeCartSection
              ? "border-[#DDE7B8] bg-[#F0F5DF] text-[#668E20]"
              : "border-[#E9E5E7] bg-white text-[#626573] hover:bg-slate-50")
          }
        >
          <span
            className={
              "h-2 w-2 rounded-full " + (includeCartSection ? "bg-[#86A83C]" : "bg-slate-300")
            }
          />
          {includeCartSection ? "Sección visible en PDF" : "Ocultar en PDF"}
        </button>
      </div>

      {!includeCartSection ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E9E5E7] bg-slate-50/50 py-14 text-center">
          <ShoppingCart className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm font-medium text-[#626573]">La sección de Carrito está oculta en el entregable.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIncludeCartSection(true)}
            className="mt-4 rounded-xl border-[#DDE7B8] bg-[#F0F5DF] font-semibold text-[#668E20] hover:bg-[#E8EFCB]"
          >
            Volver a mostrarla
          </Button>
        </div>
      ) : (
        <>
          {/* Disclaimer Banner */}
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-2xs">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="font-medium leading-relaxed">
              <strong>Nota sobre la lista:</strong> Esta recopilación se genera automáticamente a partir de la dieta y los platos, por lo que <strong>puede contener ligeras imprecisiones</strong>. Puedes editar manualmente cualquier ingrediente haciendo clic en su botón de edición.
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#E9E5E7] bg-white p-4 shadow-2xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">Total Alimentos</p>
              <p className="mt-1 text-2xl font-extrabold text-[#20212B]">{autoCartItems.length}</p>
              <p className="mt-0.5 text-xs font-medium text-[#668E20]">Recopilados de la pauta</p>
            </div>

            <div className="rounded-2xl border border-[#E9E5E7] bg-white p-4 shadow-2xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">Cantidad Total</p>
              <p className="mt-1 text-2xl font-extrabold text-[#20212B]">{autoCartItems.length} <span className="text-xs font-normal text-slate-400">unid.</span></p>
              <p className="mt-0.5 text-xs font-normal text-[#626573]">1 unidad base por ítem</p>
            </div>

            <div className="rounded-2xl border border-[#E9E5E7] bg-white p-4 shadow-2xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">Dinero Estimado</p>
              <p className="mt-1 text-2xl font-extrabold text-[#20212B]">-</p>
              <p className="mt-0.5 text-xs font-normal text-[#626573]">Cotización no disp. (Demo)</p>
            </div>

            <div className="rounded-2xl border border-[#E9E5E7] bg-white p-4 shadow-2xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#626573]">Categorías</p>
              <p className="mt-1 text-2xl font-extrabold text-[#20212B]">{categories.length} <span className="text-xs font-normal text-slate-400">grupos</span></p>
              <p className="mt-0.5 text-xs font-normal text-[#626573]">Por grupo alimenticio</p>
            </div>
          </div>

          {/* Lista Agrupada de Ingredientes */}
          {autoCartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E9E5E7] bg-slate-50/50 py-14 text-center">
              <Package className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-medium text-[#626573]">Aún no hay alimentos ni ingredientes en la dieta o los platos.</p>
              <p className="mt-1 text-[11px] text-slate-400">Vuelve a los pasos "Dieta" o "Platos" para agregarlos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => {
                const itemsInCat = autoCartItems.filter((i) => i.category === cat);

                return (
                  <div key={cat} className="overflow-hidden rounded-2xl border border-[#E9E5E7] bg-white shadow-2xs">
                    {/* Encabezado de la Categoría */}
                    <div className="flex items-center justify-between border-b border-[#F0ECEE] bg-slate-50/70 px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Package className="h-4 w-4 text-[#86A83C]" />
                        <h4 className="text-xs font-bold uppercase tracking-wide text-[#20212B]">{cat}</h4>
                        <span className="rounded-full bg-white border border-[#E9E5E7] px-2 py-0.5 text-[10px] font-semibold text-[#626573]">
                          {itemsInCat.length} ítems
                        </span>
                      </div>
                    </div>

                    {/* Cabecera de Columnas */}
                    <div className="grid grid-cols-[1fr_80px_100px_70px] sm:grid-cols-[1fr_90px_110px_70px] items-center gap-3 border-b border-[#F0ECEE] bg-[#FAF9F9] px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#626573]">
                      <span>Alimento / Ingrediente</span>
                      <span className="text-center">Cantidad</span>
                      <span className="text-center">Dinero est.</span>
                      <span className="text-center">Acción</span>
                    </div>

                    {/* Filas */}
                    <div className="divide-y divide-slate-100">
                      {itemsInCat.map((item) => {
                        const isEditing = editingId === item.id;
                        const displayName = cleanFoodName(item.name);

                        return (
                          <div
                            key={item.id}
                            className="grid grid-cols-[1fr_80px_100px_70px] sm:grid-cols-[1fr_90px_110px_70px] items-center gap-3 px-5 py-2.5 transition-colors hover:bg-slate-50/50"
                          >
                            {/* Alimento */}
                            <div className="min-w-0 pr-2">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveEditing(item.id);
                                      if (e.key === "Escape") cancelEditing();
                                    }}
                                    autoFocus
                                    className="w-full rounded-xl border border-[#E9E5E7] bg-white px-2.5 py-1 text-xs font-normal text-[#20212B] shadow-2xs focus:border-[#86A83C] focus:outline-none focus:ring-1 focus:ring-[#86A83C]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => saveEditing(item.id)}
                                    title="Guardar nombre"
                                    aria-label="Guardar nombre"
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#86A83C] text-white shadow-2xs hover:bg-[#78A82F] transition-colors cursor-pointer"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditing}
                                    title="Cancelar"
                                    aria-label="Cancelar"
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E9E5E7] bg-white text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <p className="truncate text-xs font-medium text-[#20212B]" title={displayName}>
                                  {displayName}
                                </p>
                              )}
                            </div>

                            {/* Cantidad (Demo: 1) */}
                            <div className="text-center">
                              <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-[#20212B]">
                                1
                              </span>
                            </div>

                            {/* Dinero Estimado (Demo: -) */}
                            <div className="text-center">
                              <span className="inline-flex items-center justify-center text-xs font-medium text-slate-400">
                                -
                              </span>
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center justify-center gap-1">
                              {!isEditing && (
                                <>
                                  {setCartItemOverride && (
                                    <button
                                      type="button"
                                      onClick={() => startEditing(item.id, displayName)}
                                      title="Editar ingrediente"
                                      aria-label="Editar ingrediente"
                                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E9E5E7] bg-white text-slate-500 hover:border-[#86A83C] hover:bg-[#F0F5DF] hover:text-[#668E20] transition-all cursor-pointer"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                  )}
                                  {removeCartItem && (
                                    <button
                                      type="button"
                                      onClick={() => removeCartItem(item.id)}
                                      title="Eliminar ingrediente"
                                      aria-label="Eliminar ingrediente"
                                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E9E5E7] bg-white text-rose-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
