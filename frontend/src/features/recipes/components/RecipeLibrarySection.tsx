import React from "react";
import { Search, Eye, Plus, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import {
  cn,
  Recipe,
  RecipeCatalogTab,
  SubstituteMealSection,
  RECIPE_MEAL_SECTIONS,
} from "../utils/recipe-helpers";

interface RecipeLibrarySectionProps {
  recipeSearch: string;
  setRecipeSearch: (search: string) => void;
  recipeTabCounts: { mine: number; community: number; app: number };
  recipeModalTab: RecipeCatalogTab;
  setRecipeModalTab: (tab: RecipeCatalogTab) => void;
  showMatchingOnly: boolean;
  setShowMatchingOnly: (matching: boolean) => void;
  showOnlyMyRecipes: boolean;
  setShowOnlyMyRecipes: (my: boolean) => void;
  showOnlyAddedRecipes: boolean;
  setShowOnlyAddedRecipes: (added: boolean) => void;
  recipeMealSectionFilter: string;
  setRecipeMealSectionFilter: (filter: string) => void;
  recipeLibraryPage: number;
  setRecipeLibraryPage: React.Dispatch<React.SetStateAction<number>>;
  recipeLibraryTotalPages: number;
  isLoadingRecipeLibrary: boolean;
  filteredRecipeLibrary: Recipe[];
  paginatedRecipeLibrary: Recipe[];
  draggedRecipeId: string | null;
  setDraggedRecipeId: (id: string | null) => void;
  setDraggedSlotId: (id: string | null) => void;
  setDropTargetKey: (key: string | null) => void;
  getRecipeImage: (recipe?: Recipe, mealSection?: string) => string;
  getSlotLabelFromMealSection: (mealSection: string) => string;
  previewRecipeId: string | null;
  setPreviewRecipeId: React.Dispatch<React.SetStateAction<string | null>>;
  enableSubstituteRecipes: boolean;
  isRecipeMarkedAsSubstitute: (recipe: Recipe) => boolean;
  getSubstituteSectionForRecipe: (recipe: Recipe) => SubstituteMealSection | null;
  toggleSubstituteRecipe: (recipe: Recipe, checked: boolean) => void;
  truncateText: (value: string | undefined, maxLength: number) => string;
  librarySectionRef: React.RefObject<HTMLDivElement | null>;
}

export const RecipeLibrarySection: React.FC<RecipeLibrarySectionProps> = ({
  recipeSearch,
  setRecipeSearch,
  recipeTabCounts,
  recipeModalTab,
  setRecipeModalTab,
  showMatchingOnly,
  setShowMatchingOnly,
  showOnlyMyRecipes,
  setShowOnlyMyRecipes,
  showOnlyAddedRecipes,
  setShowOnlyAddedRecipes,
  recipeMealSectionFilter,
  setRecipeMealSectionFilter,
  recipeLibraryPage,
  setRecipeLibraryPage,
  recipeLibraryTotalPages,
  isLoadingRecipeLibrary,
  filteredRecipeLibrary,
  paginatedRecipeLibrary,
  draggedRecipeId,
  setDraggedRecipeId,
  setDraggedSlotId,
  setDropTargetKey,
  getRecipeImage,
  getSlotLabelFromMealSection,
  previewRecipeId,
  setPreviewRecipeId,
  enableSubstituteRecipes,
  isRecipeMarkedAsSubstitute,
  getSubstituteSectionForRecipe,
  toggleSubstituteRecipe,
  truncateText,
  librarySectionRef,
}) => {
  return (
    <div
      ref={librarySectionRef}
      className="hidden lg:col-span-3 lg:block lg:self-start lg:sticky lg:top-24"
    >
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
              Biblioteca de platos
            </p>
            <h3 className="mt-1 text-lg font-black text-slate-900 leading-tight">
              Arrastra un plato hacia el bloque que quieras completar
            </h3>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <Input
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
              placeholder="Buscar plato o ingrediente principal..."
              className="pl-12 h-12 rounded-2xl border-slate-200 font-bold"
            />
          </div>

          <div className="hidden rounded-3xl bg-slate-100 p-2 grid grid-cols-3 gap-2">
            {[
              { id: "mine", label: "Míos", count: recipeTabCounts.mine },
              { id: "community", label: "Comunidad", count: recipeTabCounts.community },
              { id: "app", label: "App", count: recipeTabCounts.app },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRecipeModalTab(tab.id as RecipeCatalogTab)}
                className={cn(
                  "rounded-[1.15rem] px-3 py-2 text-[11px] font-black transition-all",
                  recipeModalTab === tab.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-5 whitespace-nowrap flex-wrap">
            <label className="inline-flex items-center gap-2 text-xs font-black text-slate-700">
              <input
                type="checkbox"
                checked={showMatchingOnly}
                onChange={(e) => setShowMatchingOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              Coincidencias de alimentos CON DIETA
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-black text-slate-700">
              <input
                type="checkbox"
                checked={showOnlyMyRecipes}
                onChange={(e) => setShowOnlyMyRecipes(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
              />
              Mis alimentos
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-black text-slate-700">
              <input
                type="checkbox"
                checked={showOnlyAddedRecipes}
                onChange={(e) => setShowOnlyAddedRecipes(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
              />
              Ya añadidos
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Tipo de comida
            </p>
            <select
              value={recipeMealSectionFilter}
              onChange={(e) => setRecipeMealSectionFilter(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none"
            >
              {RECIPE_MEAL_SECTIONS.map((section) => (
                <option key={section.value || "all"} value={section.value}>
                  {section.label}
                </option>
              ))}
            </select>
          </div>

          {filteredRecipeLibrary.length > 0 ? (
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setRecipeLibraryPage((prev) => Math.max(1, prev - 1))}
                disabled={recipeLibraryPage === 1}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Atrás
              </button>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                {recipeLibraryPage} / {recipeLibraryTotalPages}
              </p>
              <button
                type="button"
                onClick={() =>
                  setRecipeLibraryPage((prev) =>
                    Math.min(recipeLibraryTotalPages, prev + 1),
                  )
                }
                disabled={recipeLibraryPage === recipeLibraryTotalPages}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-1">
            {isLoadingRecipeLibrary ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : filteredRecipeLibrary.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-black text-slate-700">
                  No hay platos para este filtro.
                </p>
              </div>
            ) : (
              paginatedRecipeLibrary.map((recipe) => (
                <div
                  key={recipe.id}
                  draggable
                  onDragStart={() => {
                    setDraggedRecipeId(recipe.id);
                    setDraggedSlotId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedRecipeId(null);
                    setDropTargetKey(null);
                  }}
                  className={cn(
                    "relative rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 transition-all cursor-grab active:cursor-grabbing",
                    draggedRecipeId === recipe.id && "ring-2 ring-emerald-300 border-emerald-300 bg-emerald-50/60",
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <img
                        src={getRecipeImage(recipe)}
                        alt={recipe.title}
                        className="h-16 w-16 rounded-2xl border border-slate-200 object-cover shrink-0"
                      />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100">
                            Arrastra
                          </span>
                          {recipe.mealSection ? (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-amber-600 border border-amber-100">
                              {getSlotLabelFromMealSection(recipe.mealSection)}
                            </span>
                          ) : null}
                          <span className={cn(
                            "rounded-full bg-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-slate-500 border border-slate-100",
                            showOnlyMyRecipes && "hidden",
                          )}>
                            {recipe.source === "mine"
                              ? "Mío"
                              : recipe.source === "community"
                                ? "Comunidad"
                                : "App"}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 leading-tight truncate">
                          {recipe.title}
                        </h4>
                        <p className="text-[10px] font-semibold text-slate-500 leading-none truncate">
                          {(recipe.mainIngredients.length > 0
                            ? recipe.mainIngredients
                            : recipe.ingredients
                          )
                            .slice(0, 4)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewRecipeId((prev) => (prev === recipe.id ? null : recipe.id));
                        }}
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                        title="Ver información del plato"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-100">
                        <Plus className="h-3.5 w-3.5" />
                        <span>Añadir</span>
                      </div>
                    </div>
                  </div>

                  {enableSubstituteRecipes ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2">
                      <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isRecipeMarkedAsSubstitute(recipe)}
                          disabled={!getSubstituteSectionForRecipe(recipe)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSubstituteRecipe(recipe, e.target.checked);
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 disabled:opacity-40 cursor-pointer"
                        />
                        Sustituto
                        <span className="text-slate-400 normal-case tracking-normal font-medium">
                          {getSubstituteSectionForRecipe(recipe)
                            ? `(${getSubstituteSectionForRecipe(recipe)})`
                            : "(solo desayuno/almuerzo)"}
                        </span>
                      </label>
                    </div>
                  ) : null}

                  {previewRecipeId === recipe.id ? (
                    <div className="mt-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                            Vista rápida
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-900 leading-tight">
                            {recipe.title}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewRecipeId(null);
                          }}
                          className="rounded-xl p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                          title="Cerrar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-2 text-[11px] font-medium leading-relaxed text-slate-600">
                        {truncateText(recipe.description, 220) || "Sin descripción disponible."}
                      </p>
                      {recipe.preparation ? (
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Preparación
                          </p>
                          <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-600">
                            {truncateText(recipe.preparation, 260)}
                          </p>
                        </div>
                      ) : null}
                      {recipe.recommendedPortion ? (
                        <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                            Porción recomendada
                          </p>
                          <p className="mt-1 text-[11px] font-semibold leading-relaxed text-emerald-800">
                            {recipe.recommendedPortion}
                          </p>
                        </div>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                          {recipe.calories} kcal
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                          {recipe.protein}g prot
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                          {recipe.carbs}g cho
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                          {recipe.fats}g lip
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
