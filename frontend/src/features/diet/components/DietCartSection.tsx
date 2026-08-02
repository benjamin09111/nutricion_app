"use client";

import { useState, useMemo } from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Package,
  ArrowRight,
  Calculator,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface DietCartItem {
  id: string;
  name: string;
  category: string;
  monthlyQuantity: number;
  unit: string;
  weeklyFrequency: number;
}

interface DietCartSectionProps {
  cartItems: DietCartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<DietCartItem[]>>;
  patientName?: string | null;
  onOpenAdvancedCart: () => void;
}

export function DietCartSection({
  cartItems,
  setCartItems,
  patientName,
  onOpenAdvancedCart,
}: DietCartSectionProps) {
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Abarrotes");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("kg");

  const itemsToRender = cartItems;

  const categories = useMemo(() => {
    const set = new Set(itemsToRender.map((i) => i.category));
    return Array.from(set);
  }, [itemsToRender]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const item: DietCartItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: newItemName.trim(),
      category: newItemCategory,
      monthlyQuantity: Math.max(0.1, Number(newItemQuantity) || 1),
      unit: newItemUnit,
      weeklyFrequency: 5,
    };

    setCartItems((prev) => [...prev, item]);
    setNewItemName("");
    setNewItemQuantity(1);
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, monthlyQuantity: Math.max(0.1, qty) } : item)),
    );
  };

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
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Paso 4 de 5</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Carrito de Compras</span>
            </div>
            <h2 className="mt-1 text-xl font-black text-slate-900">Lista y Despensa de Alimentos</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Calcula los víveres requeridos para el plan mensual de {patientName || "el paciente"}.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={onOpenAdvancedCart}
          variant="outline"
          className="h-11 shrink-0 rounded-xl border-emerald-200 bg-white font-bold text-emerald-700 hover:bg-emerald-50"
        >
          <Calculator className="mr-2 h-4 w-4" />
          Carrito Avanzado
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Total de Víveres en Lista</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{itemsToRender.length} alimentos</p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">Calculados para el consumo mensual</p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Categorías de Despensa</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{categories.length} grupos</p>
          <p className="mt-1 text-xs font-semibold text-indigo-700">Cereales, carnes, lácteos, frutas y verduras</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Frecuencia de Compra</p>
          <p className="mt-2 text-2xl font-black text-slate-900">Semanal / Quincenal</p>
          <p className="mt-1 text-xs font-semibold text-amber-700">Optimizado para mantener víveres frescos</p>
        </div>
      </div>

      {/* Formulario Agregar Alimento al Carrito */}
      <form onSubmit={handleAddItem} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900">Agregar Producto a la Lista de Compras</h3>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Nombre del Alimento</label>
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Ej: Harina de almendras, Huevos..."
              className="h-10 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Categoría</label>
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Cereales y Pan">Cereales y Pan</option>
              <option value="Carnes y Huevos">Carnes y Huevos</option>
              <option value="Lácteos">Lácteos</option>
              <option value="Frutas">Frutas</option>
              <option value="Verduras">Verduras</option>
              <option value="Aceites y Semillas">Aceites y Semillas</option>
              <option value="Abarrotes">Abarrotes</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Cant. Mensual</label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.5"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                className="h-10 rounded-xl text-xs font-bold text-slate-900"
              />
              <select
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800"
              >
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="unid">unid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="h-10 rounded-xl bg-emerald-600 px-6 font-bold text-white hover:bg-emerald-700"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Agregar a la lista
          </Button>
        </div>
      </form>

      {/* Lista de Compras Agrupada */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const itemsInCat = itemsToRender.filter((i) => i.category === cat);

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
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-bold text-slate-900">{item.name}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="font-medium">Cantidad estimada mes:</span>
                        <Input
                          type="number"
                          step="0.5"
                          value={item.monthlyQuantity}
                          onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                          className="h-7 w-20 rounded-lg text-center text-xs font-bold text-slate-900"
                        />
                        <span className="font-semibold text-slate-500">{item.unit}</span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                        className="h-7 w-7 rounded-lg p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
