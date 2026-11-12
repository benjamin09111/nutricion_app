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
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Lista Automática de Alimentos</h2>
          <p className="text-xs text-slate-500">
            Todos los alimentos e ingredientes usados en el plan de {patientName || "el paciente"}, listados automáticamente.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIncludeCartSection(!includeCartSection)}
          className={
            "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer " +
            (includeCartSection
              ? "border-[#DDE7B8] bg-[#F0F5DF] text-[#668E20]"
              : "border-[#E9E5E7] bg-white text-slate-500 hover:bg-slate-50")
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
          {/* Disclaimer Banner */}
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 text-xs text-amber-900 shadow-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="font-medium leading-relaxed">
              <strong>Nota sobre la lista:</strong> Esta recopilación se genera automáticamente a partir de la dieta y los platos, por lo que <strong>puede contener ligeras imprecisiones</strong>. Puedes editar manualmente cualquier ingrediente haciendo clic en su botón de edición.
            </p>
          </div>

          {/* Metric Cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#E9E5E7] bg-white p-4 shadow-2xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total de Ingredientes</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{autoCartItems.length} alimentos</p>
              <p className="mt-0.5 text-xs font-medium text-[#668E20]">Recopilados automáticamente de la dieta y los platos</p>
            </div>

            <div className="rounded-2xl border border-[#E9E5E7] bg-white p-4 shadow-2xs">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Categorías</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{categories.length} grupos</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">Organizados por grupo alimenticio</p>
            </div>
          </div>

          {/* Lista Agrupada de Ingredientes */}
          {autoCartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E9E5E7] bg-slate-50/50 py-14 text-center">
              <Package className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-500">Aún no hay alimentos ni ingredientes en la dieta o los platos.</p>
              <p className="mt-1 text-[11px] text-slate-400">Vuelve a los pasos "Dieta" o "Platos" para agregarlos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => {
                const itemsInCat = autoCartItems.filter((i) => i.category === cat);

                return (
                  <div key={cat} className="overflow-hidden rounded-2xl border border-[#E9E5E7] bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b border-[#F0ECEE] bg-slate-50/60 px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Package className="h-4 w-4 text-[#86A83C]" />
                        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">{cat}</h4>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {itemsInCat.length} ítems
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {itemsInCat.map((item) => {
                        const isEditing = editingId === item.id;
                        const displayName = cleanFoodName(item.name);

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-slate-50/50"
                          >
                            {isEditing ? (
                              <div className="flex flex-1 items-center gap-2">
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEditing(item.id);
                                    if (e.key === "Escape") cancelEditing();
                                  }}
                                  autoFocus
                                  className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                                <button
                                  type="button"
                                  onClick={() => saveEditing(item.id)}
                                  title="Guardar nombre"
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  title="Cancelar"
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <p className="text-xs font-bold text-slate-900">{displayName}</p>
                                <div className="flex items-center gap-1.5">
                                  {setCartItemOverride && (
                                    <button
                                      type="button"
                                      onClick={() => startEditing(item.id, displayName)}
                                      title="Editar nombre"
                                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 opacity-75 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:opacity-100 cursor-pointer"
                                    >
                                      <Pencil className="h-3 w-3" />
                                      <span>Editar</span>
                                    </button>
                                  )}
                                  {removeCartItem && (
                                    <button
                                      type="button"
                                      onClick={() => removeCartItem(item.id)}
                                      title="Eliminar ingrediente"
                                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-500 opacity-75 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 hover:opacity-100 cursor-pointer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
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
