import React from "react";
import { Search, RotateCcw, X, ArrowRight, Loader2, User, AlertCircle } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { SaveCreationModal } from "@/components/shared/SaveCreationModal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import {
  cn,
  Recipe,
  RecipeCatalogTab,
  RECIPE_MEAL_SECTIONS,
} from "../utils/recipe-helpers";

interface RecipeModalsProps {
  // Swap Modal
  showSwapModal: boolean;
  setShowSwapModal: (show: boolean) => void;
  recipeSearch: string;
  setRecipeSearch: (search: string) => void;
  recipeModalTab: RecipeCatalogTab;
  setRecipeModalTab: (tab: RecipeCatalogTab) => void;
  recipeTabCounts: { mine: number; community: number; app: number };
  showMatchingOnly: boolean;
  setShowMatchingOnly: (matching: boolean) => void;
  sourceFoods: string[];
  recipeMealSectionFilter: string;
  setRecipeMealSectionFilter: (filter: string) => void;
  isLoadingRecipeLibrary: boolean;
  filteredRecipeLibrary: Recipe[];
  assignRecipeToActiveSlot: (recipe: Recipe) => void;

  // Quick Meal Modal
  showQuickMealModal: boolean;
  setShowQuickMealModal: (show: boolean) => void;
  quickMealTarget: { day: string; slotId: string } | null;
  setQuickMealTarget: (target: { day: string; slotId: string } | null) => void;
  quickMealDraft: {
    title: string;
    description: string;
    recommendedPortion: string;
    preparation: string;
    calories: string;
    protein: string;
    carbs: string;
    fats: string;
  };
  setQuickMealDraft: React.Dispatch<
    React.SetStateAction<{
      title: string;
      description: string;
      recommendedPortion: string;
      preparation: string;
      calories: string;
      protein: string;
      carbs: string;
      fats: string;
    }>
  >;
  submitQuickMeal: () => void;

  // Add/Edit Block Modal
  showAddBlockModal: boolean;
  setShowAddBlockModal: (show: boolean) => void;
  editingMealBlockId: string | null;
  setEditingMealBlockId: (id: string | null) => void;
  availableMealSectionsForEditing: any[];
  availableMealSectionsToAdd: any[];
  handleUpdateMealBlock: (mealSection: string) => void;
  handleAddMealBlock: (mealSection: string) => void;

  // Import Patient Modal
  isImportPatientModalOpen: boolean;
  setIsImportPatientModalOpen: (open: boolean) => void;
  patientSearchQuery: string;
  setPatientSearchQuery: (query: string) => void;
  isLoadingPatients: boolean;
  patients: any[];
  handleSelectPatient: (patient: any) => void;

  // Save Creation Modal
  isSaveCreationModalOpen: boolean;
  setIsSaveCreationModalOpen: (open: boolean) => void;
  creationDescription: string;
  setCreationDescription: (desc: string) => void;
  readWorkflowDraft: () => any;
  buildRecipesModule: () => any;
  selectedPatient: any;
  buildPatientMeta: (patient: any) => any;
  persistRecipesCreation: (desc?: string) => Promise<any>;
}

export const RecipeModals: React.FC<RecipeModalsProps> = ({
  showSwapModal,
  setShowSwapModal,
  recipeSearch,
  setRecipeSearch,
  recipeModalTab,
  setRecipeModalTab,
  recipeTabCounts,
  showMatchingOnly,
  setShowMatchingOnly,
  sourceFoods,
  recipeMealSectionFilter,
  setRecipeMealSectionFilter,
  isLoadingRecipeLibrary,
  filteredRecipeLibrary,
  assignRecipeToActiveSlot,

  showQuickMealModal,
  setShowQuickMealModal,
  quickMealTarget,
  setQuickMealTarget,
  quickMealDraft,
  setQuickMealDraft,
  submitQuickMeal,

  showAddBlockModal,
  setShowAddBlockModal,
  editingMealBlockId,
  setEditingMealBlockId,
  availableMealSectionsForEditing,
  availableMealSectionsToAdd,
  handleUpdateMealBlock,
  handleAddMealBlock,

  isImportPatientModalOpen,
  setIsImportPatientModalOpen,
  patientSearchQuery,
  setPatientSearchQuery,
  isLoadingPatients,
  patients,
  handleSelectPatient,

  isSaveCreationModalOpen,
  setIsSaveCreationModalOpen,
  creationDescription,
  setCreationDescription,
  readWorkflowDraft,
  buildRecipesModule,
  selectedPatient,
  buildPatientMeta,
  persistRecipesCreation,
}) => {
  return (
    <>
      {/* Swap Modal */}
      {showSwapModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setShowSwapModal(false)}
        >
          <div
            className="bg-white rounded-4xl w-full max-w-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <RotateCcw className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none mb-1">
                    Ajustar bloque
                  </h3>
                  <p className="text-xs font-medium text-slate-500 tracking-widest uppercase">
                    Agrega o cambia alimentos dentro de este bloque del día.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSwapModal(false)}
                className="p-3 hover:bg-white rounded-2xl transition-colors text-slate-400"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <Input
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  placeholder="Buscar plato o ingrediente principal..."
                  className="pl-12 h-14 rounded-3xl border-slate-200 font-bold"
                />
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="rounded-3xl bg-slate-100 p-2 grid grid-cols-3 gap-2 flex-1">
                  {[
                    { id: "mine", label: "Míos", count: recipeTabCounts.mine },
                    {
                      id: "community",
                      label: "Comunidad",
                      count: recipeTabCounts.community,
                    },
                    { id: "app", label: "Aplicación", count: recipeTabCounts.app },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRecipeModalTab(tab.id as RecipeCatalogTab)}
                      className={cn(
                        "rounded-[1.35rem] px-4 py-3 text-sm font-black transition-all",
                        recipeModalTab === tab.id
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700",
                      )}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                <label className="inline-flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMatchingOnly}
                    onChange={(e) => setShowMatchingOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-emerald-300 text-emerald-600 cursor-pointer"
                  />
                  Coincidencias de alimentos
                </label>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-4 text-xs font-bold text-slate-500">
                {showMatchingOnly
                  ? sourceFoods.length > 0
                    ? "Mostrando solo platos cuyos ingredientes principales coinciden con los alimentos cargados en la dieta."
                    : "Activa la dieta o el carrito primero para detectar coincidencias por ingredientes principales."
                  : "Viendo todos los platos disponibles en esta pestaña."}
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Tipo de comida
                </p>
                <div className="flex flex-wrap gap-2">
                  {RECIPE_MEAL_SECTIONS.map((section) => (
                    <button
                      key={section.value || "all"}
                      type="button"
                      onClick={() => setRecipeMealSectionFilter(section.value)}
                      className={cn(
                        "rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all",
                        recipeMealSectionFilter === section.value
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                      )}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingRecipeLibrary ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : filteredRecipeLibrary.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <p className="text-base font-black text-slate-700">
                    No encontramos platos en esta vista.
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Ajusta la búsqueda, cambia de pestaña o desactiva el filtro de coincidencias.
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4">
                {filteredRecipeLibrary.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 border border-slate-100 bg-slate-50 rounded-3xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group cursor-pointer flex items-center justify-between"
                    onClick={() => assignRecipeToActiveSlot(r)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-2xl shadow-sm">
                        🍳
                      </div>
                      <div>
                        <h5 className="font-black text-slate-900 leading-none mb-1">
                          {r.title}
                        </h5>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                            {r.protein}g Proteína
                          </span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            ·
                          </span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            {r.complexity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button
                variant="ghost"
                className="font-bold text-slate-500 rounded-2xl hover:bg-white"
                onClick={() => setShowSwapModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Meal Modal */}
      <Modal
        isOpen={showQuickMealModal}
        onClose={() => {
          setShowQuickMealModal(false);
          setQuickMealTarget(null);
        }}
        title="Crear comida rápida"
      >
        <div className="space-y-4 text-left">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-600">
            Completa lo mínimo para asignar una comida al bloque actual.
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Nombre *
            </label>
            <Input
              value={quickMealDraft.title}
              onChange={(e) =>
                setQuickMealDraft((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Ej: Arroz con pollo"
              className="h-11 rounded-2xl border-slate-200 font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Descripción
            </label>
            <Textarea
              value={quickMealDraft.description}
              onChange={(e) =>
                setQuickMealDraft((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Descripción breve (opcional)"
              className="min-h-[84px] rounded-2xl border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              value={quickMealDraft.recommendedPortion}
              onChange={(e) =>
                setQuickMealDraft((prev) => ({
                  ...prev,
                  recommendedPortion: e.target.value,
                }))
              }
              placeholder="Porción (opcional)"
              className="h-10 rounded-xl border-slate-200 text-xs"
            />
            <Input
              value={quickMealDraft.preparation}
              onChange={(e) =>
                setQuickMealDraft((prev) => ({ ...prev, preparation: e.target.value }))
              }
              placeholder="Preparación (opcional)"
              className="h-10 rounded-xl border-slate-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min={0}
              value={quickMealDraft.calories}
              onChange={(e) =>
                setQuickMealDraft((prev) => ({ ...prev, calories: e.target.value }))
              }
              placeholder="kcal"
              className="h-10 rounded-xl border-slate-200 text-xs"
            />
            <Input
              type="number"
              min={0}
              value={quickMealDraft.protein}
              onChange={(e) =>
                setQuickMealDraft((prev) => ({ ...prev, protein: e.target.value }))
              }
              placeholder="prot (g)"
              className="h-10 rounded-xl border-slate-200 text-xs"
            />
            <Input
              type="number"
              min={0}
              value={quickMealDraft.carbs}
              onChange={(e) =>
                setQuickMealDraft((prev) => ({ ...prev, carbs: e.target.value }))
              }
              placeholder="cho (g)"
              className="h-10 rounded-xl border-slate-200 text-xs"
            />
            <Input
              type="number"
              min={0}
              value={quickMealDraft.fats}
              onChange={(e) =>
                setQuickMealDraft((prev) => ({ ...prev, fats: e.target.value }))
              }
              placeholder="lip (g)"
              className="h-10 rounded-xl border-slate-200 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              className="rounded-2xl font-bold"
              onClick={() => {
                setShowQuickMealModal(false);
                setQuickMealTarget(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={submitQuickMeal}
            >
              Guardar comida rápida
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Block Modal */}
      <Modal
        isOpen={showAddBlockModal}
        onClose={() => {
          setShowAddBlockModal(false);
          setEditingMealBlockId(null);
        }}
        title={editingMealBlockId ? "Editar bloque de comida" : "Agregar bloque de comida"}
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-slate-500">
            Elige qué tipo de bloque quieres sumar a toda la semana.
          </p>

          <div className="grid gap-3">
            {(editingMealBlockId
              ? availableMealSectionsForEditing
              : availableMealSectionsToAdd
            ).map((section) => (
              <button
                key={section.value}
                type="button"
                onClick={() =>
                  editingMealBlockId
                    ? handleUpdateMealBlock(section.value)
                    : handleAddMealBlock(section.value)
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left font-black text-slate-700 transition-all hover:border-emerald-300 hover:bg-emerald-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <span>{section.label}</span>
                  {"isCurrent" in section && section.isCurrent ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Actual
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>

          {(editingMealBlockId
            ? availableMealSectionsForEditing.length === 0
            : availableMealSectionsToAdd.length === 0) ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-bold text-slate-500">
              No hay más tipos disponibles para agregar con la estructura actual.
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Import Patient Modal */}
      <Modal
        isOpen={isImportPatientModalOpen}
        onClose={() => {
          setIsImportPatientModalOpen(false);
          setPatientSearchQuery("");
        }}
        title="Vincular Paciente"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-xl border-slate-200 focus:border-indigo-500"
              autoFocus
            />
          </div>

          {isLoadingPatients && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          )}

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 text-left">
            {patients
              .filter(
                (patient) =>
                  patient.fullName
                    .toLowerCase()
                    .includes(patientSearchQuery.toLowerCase()) ||
                  (patient.email &&
                    patient.email
                      .toLowerCase()
                      .includes(patientSearchQuery.toLowerCase())),
              )
              .map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className="p-4 border-2 border-slate-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 group-hover:bg-emerald-100 group-hover:border-emerald-200 transition-colors">
                      <User className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">
                        {patient.fullName}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                        {patient.email || "Sin email"} ·{" "}
                        {patient.weight ? `${patient.weight}kg` : "Peso no reg."}
                      </p>
                    </div>
                  </div>
                  {patient.dietRestrictions &&
                    Array.isArray(patient.dietRestrictions) &&
                    patient.dietRestrictions.length > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-rose-400" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">
                          {patient.dietRestrictions.length}
                        </span>
                      </div>
                    )}
                </div>
              ))}

            {!isLoadingPatients && patients.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-400 font-bold">
                  No se encontraron pacientes registrados.
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Save Creation Modal */}
      <SaveCreationModal
        isOpen={isSaveCreationModalOpen}
        onClose={() => setIsSaveCreationModalOpen(false)}
        onConfirm={async () => {
          const draft = readWorkflowDraft();
          draft.recipes = buildRecipesModule();
          if (selectedPatient) {
            draft.patientMeta = buildPatientMeta(selectedPatient);
          }
          localStorage.setItem("nutri_active_draft", JSON.stringify(draft));
          try {
            await persistRecipesCreation(creationDescription);
            toast.success("Recetas guardadas correctamente.");
            setIsSaveCreationModalOpen(false);
            setCreationDescription("");
          } catch (error: any) {
            toast.error(error?.message || "No se pudieron guardar las recetas.");
          }
        }}
        description={creationDescription}
        onDescriptionChange={setCreationDescription}
        title="Guardar recetas"
        subtitle="Añade una breve descripción para reconocer estas recetas más tarde."
      />
    </>
  );
};
