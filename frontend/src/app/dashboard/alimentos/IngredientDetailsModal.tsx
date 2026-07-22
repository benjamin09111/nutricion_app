import { Tag, BarChart2, Scale, Info } from "lucide-react";
import { Ingredient } from "@/features/foods";
import { formatCLP } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

interface IngredientDetails extends Ingredient {
  cholesterol?: number;
  potassium?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
}

interface IngredientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: IngredientDetails | null;
}

export default function IngredientDetailsModal({ isOpen, onClose, ingredient }: IngredientDetailsModalProps) {
  if (!ingredient) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="sm:max-w-4xl p-0">
      <div className="relative">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700">
                <Info className="h-3 w-3" />
                Detalles del alimento
              </div>
              <div>
                <h3 className="truncate text-2xl font-semibold tracking-tight text-slate-900">{ingredient.name}</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {ingredient.brand?.name || "Marca genérica"} · {ingredient.category?.name || "Varios"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700">Precio ref.</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCLP(ingredient.price)}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Por {ingredient.amount} {ingredient.unit}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Porción base</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Scale className="h-5 w-5 text-slate-400" />
                    <p className="text-lg font-semibold text-slate-800">
                      {ingredient.amount} <span className="text-sm font-medium text-slate-500">{ingredient.unit}</span>
                    </p>
                  </div>
                </div>
              </div>

              {(() => {
                const combinedTags = [...(ingredient.tags || []), ...(ingredient.preferences?.[0]?.tags || [])];
                if (combinedTags.length === 0) return null;

                return (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-indigo-500" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Etiquetas vinculadas
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {combinedTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {ingredient.ingredients && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Lista de ingredientes</p>
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                    {ingredient.ingredients}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-indigo-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Información nutricional
                  </span>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 shadow-sm">
                  por 100g/ml
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { label: "Energía", value: `${ingredient.calories} kcal`, color: "text-amber-600" },
                  { label: "Proteínas", value: `${ingredient.proteins} g`, color: "text-blue-600" },
                  { label: "Carbohidratos", value: `${ingredient.carbs} g`, color: "text-emerald-600" },
                  { label: "Grasas totales", value: `${ingredient.lipids} g`, color: "text-red-600" },
                  { label: "Azúcares", value: `${ingredient.sugars || 0} g` },
                  { label: "Fibra", value: `${ingredient.fiber || 0} g` },
                  { label: "Sodio", value: `${ingredient.sodium || 0} mg` },
                  { label: "Colesterol", value: `${ingredient.cholesterol || 0} mg` },
                  { label: "Potasio", value: `${ingredient.potassium || 0} mg` },
                  { label: "Vitamina A", value: `${ingredient.vitaminA || 0} mcg` },
                  { label: "Vitamina C", value: `${ingredient.vitaminC || 0} mg` },
                  { label: "Calcio", value: `${ingredient.calcium || 0} mg` },
                  { label: "Hierro", value: `${ingredient.iron || 0} mg` },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl border border-white/70 bg-white px-3 py-2.5 shadow-sm"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-tight text-slate-500">{row.label}</span>
                    <span className={cn("text-sm font-semibold", row.color || "text-slate-900")}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
            >
              Cerrar detalles
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
