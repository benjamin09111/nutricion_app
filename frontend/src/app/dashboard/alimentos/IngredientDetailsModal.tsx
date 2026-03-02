import { X, Tag, BarChart2, Scale, Info } from "lucide-react";
import { Ingredient } from "@/features/foods";
import { formatCLP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

interface IngredientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
}

export default function IngredientDetailsModal({
  isOpen,
  onClose,
  ingredient,
}: IngredientDetailsModalProps) {
  if (!ingredient) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="sm:max-w-4xl p-0" // p-0 to keep custom header padding
    >
      <div className="relative">
        {/* Header / Hero Section */}
        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest bg-emerald-50 w-fit px-2 py-0.5 rounded-lg">
                <Info className="h-3 w-3" />
                Detalles del Ingrediente
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {ingredient.name}
              </h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">
                {ingredient.brand?.name || "Marca Genérica"} •{" "}
                <span className="text-slate-500">
                  {ingredient.category?.name || "Varios"}
                </span>
              </p>
            </div>
            <button
              type="button"
              className="p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
              onClick={onClose}
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Column 1: General Info & Tags */}
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100/50 group hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 items-center flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Precio Ref
                  </div>
                  <p className="text-3xl font-black text-slate-900 leading-none">
                    {formatCLP(ingredient.price)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase italic">
                    Por {ingredient.amount}
                    {ingredient.unit}
                  </p>
                </div>
                <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100/50 group hover:shadow-lg hover:shadow-slate-500/5 transition-all">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 items-center flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    Porción Base
                  </div>
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-slate-400" />
                    <p className="text-xl font-black text-slate-700">
                      {ingredient.amount}{" "}
                      <span className="text-sm font-bold lowercase text-slate-400">
                        {ingredient.unit}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              {(() => {
                const combinedTags = [
                  ...(ingredient.tags || []),
                  ...(ingredient.preferences?.[0]?.tags || []),
                ];
                if (combinedTags.length === 0) return null;

                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-emerald-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Etiquetas vinculadas
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {combinedTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-100 hover:border-emerald-200 transition-colors"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Composite Ingredients */}
              {ingredient.ingredients && (
                <div className="space-y-3">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-4 h-px bg-slate-200" />
                    Lista de Ingredientes
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed bg-slate-50/30 p-5 rounded-3xl border border-dashed border-slate-200 italic font-medium">
                    {ingredient.ingredients}
                  </p>
                </div>
              )}
            </div>

            {/* Column 2: Nutritional Facts */}
            <div className="bg-slate-50/40 p-6 rounded-3xl border border-slate-100 h-fit">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-emerald-500" />
                  Información Nutricional
                </div>
                <span className="text-[9px] lowercase font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                  por 100g/ml
                </span>
              </h4>

              <div className="space-y-1">
                {[
                  {
                    label: "Energía",
                    value: `${ingredient.calories} kcal`,
                    bold: true,
                    color: "text-amber-600",
                  },
                  {
                    label: "Proteínas",
                    value: `${ingredient.proteins} g`,
                    bold: true,
                    color: "text-blue-600",
                  },
                  {
                    label: "Carbohidratos",
                    value: `${ingredient.carbs} g`,
                    bold: true,
                    color: "text-emerald-600",
                  },
                  {
                    label: "Grasas Totales",
                    value: `${ingredient.lipids} g`,
                    bold: true,
                    color: "text-red-600",
                  },
                  {
                    label: "Azúcares",
                    value: `${ingredient.sugars || 0} g`,
                    indent: true,
                  },
                  { label: "Fibra", value: `${ingredient.fiber || 0} g` },
                  { label: "Sodio", value: `${ingredient.sodium || 0} mg` },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex justify-between items-center py-2.5 px-4 rounded-xl transition-colors",
                      row.bold
                        ? "bg-white shadow-sm ring-1 ring-slate-100"
                        : "hover:bg-slate-200/40",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-tight",
                        row.indent ? "pl-6 text-slate-400" : "text-slate-500",
                      )}
                    >
                      {row.label}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-black tracking-tight",
                        row.color || "text-slate-900",
                      )}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer / Actions */}
          <div className="mt-12 flex justify-end">
            <button
              type="button"
              className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 text-xs uppercase tracking-widest cursor-pointer"
              onClick={onClose}
            >
              Cerrar Detalles
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
