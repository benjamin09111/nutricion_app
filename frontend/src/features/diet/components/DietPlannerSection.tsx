import React from "react";
import { Sparkles, Loader2, Filter, Plus, Trash2, Pencil, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MarketPrice } from "@/features/foods";
import { formatCLP } from "@/lib/utils/currency";

interface DietPlannerSectionProps {
  allGroupsToRender: Record<string, MarketPrice[]>;
  isApplyingPreferences: boolean;
  applyNutritionistPreferences: () => Promise<void>;
  openAddModal: (groupName: string) => void;
  setGroupToDelete: (groupName: string) => void;
  setIsDeleteGroupConfirmOpen: (open: boolean) => void;
  openDraftFoodEditor: (food: MarketPrice) => void;
  setSelectedFoodForInfo: (food: MarketPrice) => void;
  setIsFoodInfoModalOpen: (open: boolean) => void;
  removeFood: (productName: string) => void;
  setIsAddGroupModalOpen: (open: boolean) => void;
  foodStatus: Record<string, string>;
}

export const DietPlannerSection: React.FC<DietPlannerSectionProps> = ({
  allGroupsToRender,
  isApplyingPreferences,
  applyNutritionistPreferences,
  openAddModal,
  setGroupToDelete,
  setIsDeleteGroupConfirmOpen,
  openDraftFoodEditor,
  setSelectedFoodForInfo,
  setIsFoodInfoModalOpen,
  removeFood,
  setIsAddGroupModalOpen,
  foodStatus,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Dieta Base Generada
        </h2>
        <Button
          onClick={applyNutritionistPreferences}
          disabled={isApplyingPreferences}
          className="h-10 px-6 bg-slate-900 text-white hover:bg-slate-800 border-none font-black text-sm rounded-xl gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          {isApplyingPreferences ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Filter className="h-5 w-5" />
          )}
          Añadir favoritos y quitar no recomendados
        </Button>
      </div>

      <div className="grid gap-6">
        {Object.entries(allGroupsToRender).map(([name, foods]) => (
          <div
            key={name}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
          >
            <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 uppercase tracking-tight text-sm flex items-center gap-2">
                {name}
                <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-black">
                  {foods.length}
                </span>
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => openAddModal(name)}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setGroupToDelete(name);
                    setIsDeleteGroupConfirmOpen(true);
                  }}
                  className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {foods.map((food, idx) => (
                <div
                  key={`${food.producto}-${idx}`}
                  className="p-4 flex flex-row items-center justify-between gap-4 group hover:bg-emerald-50/10 transition-all border-b border-slate-50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {food.producto}
                      </p>
                      {food.isDraft && (
                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-200 shrink-0">
                          Borrador
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 text-[11px] text-slate-500 font-medium items-center flex-wrap">
                      <span className="text-orange-600 font-bold">
                        {food.calorias || 0} kcal
                      </span>
                      <span>·</span>
                      <span className="text-blue-600">
                        P: {food.proteinas || 0}g
                      </span>
                      <span>·</span>
                      <span className="text-emerald-600">
                        C: {food.carbohidratos || 0}g
                      </span>
                      <span>·</span>
                      <span className="text-yellow-600">
                        L: {food.lipidos || 0}g
                      </span>
                      {food.azucares !== undefined && food.azucares > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-slate-500">
                            Az: {food.azucares}g
                          </span>
                        </>
                      )}
                      {food.fibra !== undefined && food.fibra > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-slate-500">
                            Fib: {food.fibra}g
                          </span>
                        </>
                      )}
                      {food.sodio !== undefined && food.sodio > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-slate-500">
                            Na: {food.sodio}mg
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {food.isDraft && (
                      <button
                        onClick={() => openDraftFoodEditor(food)}
                        className="flex items-center justify-center h-8 w-8 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer transition-all"
                        title="Completar información nutricional"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedFoodForInfo(food);
                        setIsFoodInfoModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 rounded-lg cursor-pointer transition-all font-black text-[10px] uppercase tracking-widest leading-none border border-slate-200/50"
                      title="Ver Detalles"
                    >
                      <Info className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Detalles</span>
                    </button>
                    <button
                      onClick={() => removeFood(food.producto)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-600 rounded-lg cursor-pointer transition-all font-black text-[10px] uppercase tracking-widest leading-none border border-rose-200/30"
                      title="Quitar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Quitar</span>
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => openAddModal(name)}
                className="w-full p-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-2 transition-colors cursor-pointer border-0 bg-transparent"
              >
                <Plus className="h-4 w-4" />
                Añadir alimento a {name}
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={() => setIsAddGroupModalOpen(true)}
          className="w-full py-6 border-2 border-dashed border-slate-200 bg-white rounded-2xl text-slate-400 font-bold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/10 cursor-pointer transition-all active:scale-[0.99]"
        >
          <Plus className="h-5 w-5 mx-auto mb-1" />
          Añadir nueva categoría personalizada
        </button>
      </div>
    </div>
  );
};
