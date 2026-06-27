import React from "react";
import {
  Search,
  Loader2,
  Star,
  FolderPlus,
  Plus,
  X,
  AlertCircle,
  User,
  UserPlus,
  Check,
  CheckCircle2,
  Info,
} from "lucide-react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { Modal } from "@/components/ui/Modal";
import { SaveCreationModal } from "@/components/ui/SaveCreationModal";
import { ImportCreationModal } from "@/components/shared/ImportCreationModal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatCLP } from "@/lib/utils/currency";
import { MarketPrice } from "@/features/foods";
import {
  DietPatient,
  DietVerificationResult,
} from "../utils/diet-helpers";

interface DietModalsProps {
  // Confirmations
  isResetConfirmOpen: boolean;
  setIsResetConfirmOpen: (open: boolean) => void;
  resetDiet: () => void;

  isExportConfirmOpen: boolean;
  setIsExportConfirmOpen: (open: boolean) => void;
  performExportPdf: () => Promise<void>;

  isContinueDraftWarningOpen: boolean;
  setIsContinueDraftWarningOpen: (open: boolean) => void;
  continueToRecipes: () => Promise<void>;

  pendingTagCreation: { name: string; type: "classification" | "constraint" } | null;
  setPendingTagCreation: (tag: { name: string; type: "classification" | "constraint" } | null) => void;
  createGlobalTag: (name: string) => Promise<void>;

  isDeleteGroupConfirmOpen: boolean;
  setIsDeleteGroupConfirmOpen: (open: boolean) => void;
  confirmDeleteGroup: () => void;
  groupToDelete: string | null;

  // Add Food Modal
  isAddFoodModalOpen: boolean;
  setIsAddFoodModalOpen: (open: boolean) => void;
  activeGroupForAddition: string | null;
  foodSearchQuery: string;
  setFoodSearchQuery: (query: string) => void;
  isSearchingFoods: boolean;
  searchResultFoods: MarketPrice[];
  setSelectedFoodForInfo: (food: MarketPrice) => void;
  setIsFoodInfoModalOpen: (open: boolean) => void;
  handleAddFromSearch: (food: MarketPrice) => void;
  isCreatingManualFood: boolean;
  handleCreateManualFood: () => void;

  // Smart Add Modal
  isSmartModalOpen: boolean;
  setIsSmartModalOpen: (open: boolean) => void;
  smartAddTab: "favorites" | "groups" | "myproducts" | "search";
  setSmartAddTab: (tab: "favorites" | "groups" | "myproducts" | "search") => void;
  smartSearchQuery: string;
  setSmartSearchQuery: (query: string) => void;
  isLoadingSmart: boolean;
  smartFavorites: any[];
  smartGroups: any[];
  smartMyProducts: any[];
  smartSearchResults: any[];
  isSearchingInSmart: boolean;
  selectedFoods: Set<string>;
  toggleSmartSelection: (id: string) => void;
  toggleGroupSelection: (groupId: string) => void;
  smartInfoFood: MarketPrice | null;
  setSmartInfoFood: React.Dispatch<React.SetStateAction<MarketPrice | null>>;
  handleSmartAddAll: () => void;
  buildFoodInfoPreview: (food: any) => MarketPrice;

  // Food Info Modal (Side Panel)
  isFoodInfoModalOpen: boolean;
  selectedFoodForInfo: MarketPrice | null;

  // Verification Modal
  isVerificationModalOpen: boolean;
  setIsVerificationModalOpen: (open: boolean) => void;
  verificationResult: DietVerificationResult | null;

  // Import Patient Modal
  isImportPatientModalOpen: boolean;
  setIsImportPatientModalOpen: (open: boolean) => void;
  patientSearchQuery: string;
  setPatientSearchQuery: (query: string) => void;
  isLoadingPatients: boolean;
  filteredPatients: DietPatient[];
  patientsError: string | null;
  setPatientsError: (err: string | null) => void;
  handleSelectPatient: (patient: DietPatient) => Promise<void>;
  patients: DietPatient[];

  // Import Creation Modal
  isImportCreationModalOpen: boolean;
  setIsImportCreationModalOpen: (open: boolean) => void;
  handleImportCreation: (creation: any) => void;

  // Create Group Modal
  isAddGroupModalOpen: boolean;
  setIsAddGroupModalOpen: (open: boolean) => void;
  newGroupNameInput: string;
  setNewGroupNameInput: (name: string) => void;
  handleCreateGroup: () => void;
  allGroupsToRender: Record<string, MarketPrice[]>;

  // Draft Food Editor Modal
  isDraftFoodEditorOpen: boolean;
  setIsDraftFoodEditorOpen: (open: boolean) => void;
  draftFoodToEdit: MarketPrice | null;
  draftFoodValues: {
    amount: number;
    unit: string;
    calories: number;
    proteins: number;
    carbs: number;
    lipids: number;
    azucares: number;
    fibra: number;
    sodio: number;
  };
  setDraftFoodValues: React.Dispatch<
    React.SetStateAction<{
      amount: number;
      unit: string;
      calories: number;
      proteins: number;
      carbs: number;
      lipids: number;
      azucares: number;
      fibra: number;
      sodio: number;
    }>
  >;
  handleSaveDraftFood: () => Promise<void>;
  isSavingDraftFood: boolean;

  // Save Creation Modal
  isSaveCreationModalOpen: boolean;
  setIsSaveCreationModalOpen: (open: boolean) => void;
  creationDescription: string;
  setCreationDescription: (desc: string) => void;
  handleSaveWithDescription: () => Promise<void>;
}

export const DietModals: React.FC<DietModalsProps> = ({
  isResetConfirmOpen,
  setIsResetConfirmOpen,
  resetDiet,
  isExportConfirmOpen,
  setIsExportConfirmOpen,
  performExportPdf,
  isContinueDraftWarningOpen,
  setIsContinueDraftWarningOpen,
  continueToRecipes,
  pendingTagCreation,
  setPendingTagCreation,
  createGlobalTag,
  isDeleteGroupConfirmOpen,
  setIsDeleteGroupConfirmOpen,
  confirmDeleteGroup,
  groupToDelete,

  isAddFoodModalOpen,
  setIsAddFoodModalOpen,
  activeGroupForAddition,
  foodSearchQuery,
  setFoodSearchQuery,
  isSearchingFoods,
  searchResultFoods,
  setSelectedFoodForInfo,
  setIsFoodInfoModalOpen,
  handleAddFromSearch,
  isCreatingManualFood,
  handleCreateManualFood,

  isSmartModalOpen,
  setIsSmartModalOpen,
  smartAddTab,
  setSmartAddTab,
  smartSearchQuery,
  setSmartSearchQuery,
  isLoadingSmart,
  smartFavorites,
  smartGroups,
  smartMyProducts,
  smartSearchResults,
  isSearchingInSmart,
  selectedFoods,
  toggleSmartSelection,
  toggleGroupSelection,
  smartInfoFood,
  setSmartInfoFood,
  handleSmartAddAll,
  buildFoodInfoPreview,

  isFoodInfoModalOpen,
  selectedFoodForInfo,

  isVerificationModalOpen,
  setIsVerificationModalOpen,
  verificationResult,

  isImportPatientModalOpen,
  setIsImportPatientModalOpen,
  patientSearchQuery,
  setPatientSearchQuery,
  isLoadingPatients,
  filteredPatients,
  patientsError,
  setPatientsError,
  handleSelectPatient,
  patients,

  isImportCreationModalOpen,
  setIsImportCreationModalOpen,
  handleImportCreation,

  isAddGroupModalOpen,
  setIsAddGroupModalOpen,
  newGroupNameInput,
  setNewGroupNameInput,
  handleCreateGroup,
  allGroupsToRender,

  isDraftFoodEditorOpen,
  setIsDraftFoodEditorOpen,
  draftFoodToEdit,
  draftFoodValues,
  setDraftFoodValues,
  handleSaveDraftFood,
  isSavingDraftFood,

  isSaveCreationModalOpen,
  setIsSaveCreationModalOpen,
  creationDescription,
  setCreationDescription,
  handleSaveWithDescription,
}) => {
  const renderSmartInfoTrigger = (food: any, groupLabel?: string) => {
    const infoFood = buildFoodInfoPreview(food);
    const isOpen = smartInfoFood?.id === infoFood.id;

    return (
      <div
        className="relative"
        onMouseEnter={() => setSmartInfoFood(infoFood)}
        onMouseLeave={() => setSmartInfoFood(null)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSmartInfoFood((current) =>
              current?.id === infoFood.id ? null : infoFood,
            );
          }}
          onFocus={() => setSmartInfoFood(infoFood)}
          onBlur={() =>
            setSmartInfoFood((current) =>
              current?.id === infoFood.id ? null : current,
            )
          }
          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors border-0 bg-transparent"
        >
          <AlertCircle className="h-4 w-4" />
        </button>
        {isOpen && (
          <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-300/30 text-left">
            <p className="text-xs font-black text-slate-900">{infoFood.producto}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              {groupLabel || infoFood.grupo}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <span>{infoFood.calorias || 0} kcal</span>
              <span>P: {infoFood.proteinas || 0}g</span>
              <span>C: {infoFood.carbohidratos || 0}g</span>
              <span>L: {infoFood.lipidos || 0}g</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetDiet}
        title="¿Reiniciar dieta?"
        description="Se borrará todo el avance local de este módulo y volverás a empezar desde cero."
        confirmText="Sí, reiniciar"
        variant="destructive"
      />
      <ConfirmationModal
        isOpen={isExportConfirmOpen}
        onClose={() => setIsExportConfirmOpen(false)}
        onConfirm={() => {
          setIsExportConfirmOpen(false);
          void performExportPdf();
        }}
        title="¿Exportar PDF ahora?"
        description="Todavía no hiciste cambios en ingredientes. Si fue un clic accidental, puedes volver atrás antes de generar el PDF."
        confirmText="Sí, exportar"
      />
      <ConfirmationModal
        isOpen={isContinueDraftWarningOpen}
        onClose={() => setIsContinueDraftWarningOpen(false)}
        onConfirm={() => {
          setIsContinueDraftWarningOpen(false);
          void continueToRecipes();
        }}
        title="Hay alimentos con información pendiente"
        description="Todavía tienes alimentos creados como borrador, sin sus características nutricionales completas. Si continúas ahora, los cálculos de la siguiente etapa pueden quedar imprecisos."
        confirmText="Continuar igual"
      />
      <ConfirmationModal
        isOpen={!!pendingTagCreation}
        onClose={() => setPendingTagCreation(null)}
        onConfirm={() => {
          if (pendingTagCreation) {
            void createGlobalTag(pendingTagCreation.name);
          }
          setPendingTagCreation(null);
        }}
        title="¿Crear también en Detalles?"
        description={
          pendingTagCreation
            ? pendingTagCreation.type === "classification"
              ? `El tag "${pendingTagCreation.name}" se agregó a esta dieta, pero todavía no existe en Detalles. ¿Quieres crearlo también como etiqueta de clasificación global?`
              : `La restricción "${pendingTagCreation.name}" se agregó a esta dieta, pero todavía no existe en Detalles. ¿Quieres crearla también como restricción global?`
            : ""
        }
        confirmText="Sí, crear en Detalles"
        cancelText="No, solo usar aquí"
      />
      <ConfirmationModal
        isOpen={isDeleteGroupConfirmOpen}
        onClose={() => setIsDeleteGroupConfirmOpen(false)}
        onConfirm={confirmDeleteGroup}
        title={`¿Eliminar grupo "${groupToDelete}"?`}
        description="Esto quitará los alimentos de esta vista."
      />

      <Modal
        isOpen={isAddFoodModalOpen}
        onClose={() => setIsAddFoodModalOpen(false)}
        title={`Añadir a "${activeGroupForAddition}"`}
      >
        <div className="space-y-4 text-left">
          <Input
            placeholder="Buscar..."
            value={foodSearchQuery}
            onChange={(e) => setFoodSearchQuery(e.target.value)}
            autoFocus
          />
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {isSearchingFoods ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm text-slate-400 font-medium">Buscando alimentos...</p>
              </div>
            ) : searchResultFoods.length > 0 ? (
              searchResultFoods.map((f) => (
                <div
                  key={f.id}
                  className="w-full flex flex-col p-4 hover:bg-slate-50 rounded-2xl border border-slate-100/50 hover:border-emerald-200 transition-all group gap-4"
                >
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="font-bold text-sm text-slate-900 leading-tight">
                        {f.producto}
                      </p>
                      <div className="flex gap-2 text-xs text-slate-500 mt-1 font-medium">
                        <span className="text-orange-600 font-bold">{f.calorias || 0} kcal</span>
                        <span>·</span>
                        <span className="text-blue-600">P: {f.proteinas || 0}g</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFoodForInfo(f);
                        setIsFoodInfoModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border-0 bg-transparent"
                      title="Ver información"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                    <Button
                      onClick={() => handleAddFromSearch(f)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm shadow-emerald-100 h-9"
                    >
                      <Plus className="h-4 w-4" />
                      Añadir
                    </Button>
                  </div>
                </div>
              ))
            ) : foodSearchQuery.trim() ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-400 mb-3">No se encontraron resultados.</p>
                <Button
                  variant="outline"
                  className="text-emerald-600 h-10 rounded-xl"
                  disabled={isCreatingManualFood}
                  onClick={handleCreateManualFood}
                >
                  {isCreatingManualFood
                    ? "Creando borrador..."
                    : `Crear "${foodSearchQuery}" como borrador`}
                </Button>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Search className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Escribe para buscar alimentos...</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de Adición Inteligente */}
      <Modal
        isOpen={isSmartModalOpen}
        onClose={() => setIsSmartModalOpen(false)}
        title="Selección Inteligente 🧠"
        className="sm:max-w-2xl"
      >
        <div className="space-y-6 text-left">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setSmartAddTab("favorites")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-0",
                smartAddTab === "favorites"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  smartAddTab === "favorites" && "fill-current",
                )}
              />
              Favoritos
            </button>
            <button
              onClick={() => setSmartAddTab("groups")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-0",
                smartAddTab === "groups"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <FolderPlus className="h-4 w-4" />
              Mis Grupos
            </button>
            <button
              onClick={() => setSmartAddTab("myproducts")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-0",
                smartAddTab === "myproducts"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Plus className="h-4 w-4" />
              Mis Productos
            </button>
            <button
              onClick={() => setSmartAddTab("search")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-0",
                smartAddTab === "search"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </div>

          {smartAddTab === "search" && (
            <div className="px-1">
              <Input
                placeholder="Buscar en toda la base de datos..."
                value={smartSearchQuery}
                onChange={(e) => setSmartSearchQuery(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:border-indigo-500"
                autoFocus
              />
            </div>
          )}

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto px-1 space-y-4 custom-scrollbar">
            {isLoadingSmart ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-slate-400 font-bold text-sm">Cargando tus secretos culinarios...</p>
              </div>
            ) : smartAddTab === "favorites" ? (
              smartFavorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {smartFavorites.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => toggleSmartSelection(f.id)}
                      className={cn(
                        "p-5 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col gap-4 group relative overflow-hidden",
                        selectedFoods.has(f.id)
                          ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                          : "border-slate-100 bg-white hover:border-emerald-200",
                      )}
                    >
                      {selectedFoods.has(f.id) && (
                        <div className="absolute top-4 right-4 bg-emerald-600 text-white rounded-full p-1 shadow-lg ring-4 ring-emerald-50">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex flex-col gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800 text-sm mb-1 truncate">
                            {f.name}
                          </p>
                          <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg font-black uppercase tracking-tight">
                            {f.category?.name || "Varios"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 border-t border-slate-100/50 pt-3">
                        {renderSmartInfoTrigger(f)}
                        <div
                          className={cn(
                            "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all",
                            selectedFoods.has(f.id)
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-200 group-hover:border-emerald-300",
                          )}
                        >
                          {selectedFoods.has(f.id) && <Check className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                  <Star className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm px-10">
                    No tienes alimentos favoritos marcados aún.
                  </p>
                </div>
              )
            ) : smartAddTab === "groups" ? (
              smartGroups.length > 0 ? (
                <div className="space-y-6">
                  {smartGroups.map((group) => {
                    const groupIngredientIds =
                      (group.ingredients as any[])?.map(
                        (rel: any) => (rel.ingredient as any)?.id as string,
                      ) || [];
                    const isAllSelected =
                      groupIngredientIds.length > 0 &&
                      groupIngredientIds.every((id) => selectedFoods.has(id));

                    return (
                      <div
                        key={group.id}
                        className="space-y-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100"
                      >
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                              {group.name}
                            </h4>
                          </div>
                          <button
                            onClick={() => toggleGroupSelection(group.id)}
                            className={cn(
                              "text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-lg transition-all border shadow-sm cursor-pointer",
                              isAllSelected
                                ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                                : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700",
                            )}
                          >
                            {isAllSelected ? "Quitar todo el grupo" : "Seleccionar todo el grupo"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {group.ingredients?.map((rel: any) => (
                            <div
                              key={rel.ingredient?.id}
                              onClick={() => toggleSmartSelection(rel.ingredient?.id)}
                              className={cn(
                                "p-5 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col gap-4 group relative overflow-hidden",
                                selectedFoods.has(rel.ingredient?.id)
                                  ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                                  : "border-slate-100 bg-white hover:border-emerald-200",
                              )}
                            >
                              {selectedFoods.has(rel.ingredient?.id) && (
                                <div className="absolute top-4 right-4 bg-emerald-600 text-white rounded-full p-1 shadow-lg ring-4 ring-emerald-50">
                                  <Check className="h-4 w-4" />
                                </div>
                              )}
                              <div className="flex flex-col gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-black text-slate-800 text-sm mb-1 truncate">
                                    {rel.ingredient?.name}
                                  </p>
                                  <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg font-black uppercase tracking-tight">
                                    {rel.amount || 100} {rel.ingredient?.unit || rel.unit || "g"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-end gap-2 border-t border-slate-100/50 pt-3">
                                {renderSmartInfoTrigger(rel.ingredient)}
                                <div
                                  className={cn(
                                    "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all",
                                    selectedFoods.has(rel.ingredient?.id)
                                      ? "bg-emerald-600 border-emerald-600 text-white"
                                      : "border-slate-200 group-hover:border-emerald-300",
                                  )}
                                >
                                  {selectedFoods.has(rel.ingredient?.id) ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Plus className="h-4 w-4 text-slate-300" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                  <FolderPlus className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm px-10">
                    No has creado grupos de ingredientes aún.
                  </p>
                </div>
              )
            ) : smartAddTab === "myproducts" ? (
              smartMyProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {smartMyProducts.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => toggleSmartSelection(f.id)}
                      className={cn(
                        "p-5 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col gap-4 group relative overflow-hidden",
                        selectedFoods.has(f.id)
                          ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                          : "border-slate-100 bg-white hover:border-emerald-200",
                      )}
                    >
                      {selectedFoods.has(f.id) && (
                        <div className="absolute top-4 right-4 bg-emerald-600 text-white rounded-full p-1 shadow-lg ring-4 ring-emerald-50">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex flex-col gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800 text-sm mb-1 truncate">
                            {f.name}
                          </p>
                          <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg font-black uppercase tracking-tight">
                            Creado por ti
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 border-t border-slate-100/50 pt-3">
                        {renderSmartInfoTrigger(f, "Creado por ti")}
                        <div
                          className={cn(
                            "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all",
                            selectedFoods.has(f.id)
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-200 group-hover:border-emerald-300",
                          )}
                        >
                          {selectedFoods.has(f.id) && <Check className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                  <Plus className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm px-10">
                    No has creado productos personalizados aún.
                  </p>
                </div>
              )
            ) : smartAddTab === "search" ? (
              isSearchingInSmart ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                  <p className="text-slate-400 font-bold text-sm">Escaneando base de datos...</p>
                </div>
              ) : smartSearchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {smartSearchResults.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => toggleSmartSelection(f.id)}
                      className={cn(
                        "p-5 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col gap-4 group relative overflow-hidden",
                        selectedFoods.has(f.id)
                          ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                          : "border-slate-100 bg-white hover:border-emerald-200",
                      )}
                    >
                      {selectedFoods.has(f.id) && (
                        <div className="absolute top-4 right-4 bg-emerald-600 text-white rounded-full p-1 shadow-lg ring-4 ring-emerald-50">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex flex-col gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800 text-sm mb-1 truncate">
                            {f.name}
                          </p>
                          <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg font-black uppercase tracking-tight">
                            {f.category?.name || "Varios"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 border-t border-slate-100/50 pt-3">
                        {renderSmartInfoTrigger(f)}
                        <div
                          className={cn(
                            "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all",
                            selectedFoods.has(f.id)
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-200 group-hover:border-emerald-300",
                          )}
                        >
                          {selectedFoods.has(f.id) && <Check className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : smartSearchQuery.trim() ? (
                <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                  <Search className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm px-10">
                    No se encontraron productos para &ldquo;{smartSearchQuery}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                  <Search className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm px-10">
                    Escribe algo para buscar en toda la base de datos...
                  </p>
                </div>
              )
            ) : null}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-4">
            <div className="text-xs">
              <span className="text-slate-400 font-bold">Seleccionados: </span>
              <span className="text-indigo-600 font-black">{selectedFoods.size} alimentos</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="h-11 rounded-xl"
                onClick={() => setIsSmartModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2"
                onClick={handleSmartAddAll}
                disabled={selectedFoods.size === 0}
              >
                <CheckCircle2 className="h-5 w-5" />
                Añadir todo(s)
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Food Info Modal - Side Panel */}
      {isFoodInfoModalOpen && selectedFoodForInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-start text-left">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsFoodInfoModalOpen(false)}
          />
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300 z-10">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1">
                    {selectedFoodForInfo.producto}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">{selectedFoodForInfo.grupo}</p>
                </div>
                <button
                  onClick={() => setIsFoodInfoModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors border-0 bg-transparent"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Macronutrientes Principales */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                  Macronutrientes
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <p className="text-xs font-bold text-orange-600 mb-1">Calorías</p>
                    <p className="text-2xl font-black text-orange-700">
                      {selectedFoodForInfo.calorias || 0}
                    </p>
                    <p className="text-[10px] text-orange-500 font-medium">kcal</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-600 mb-1">Proteínas</p>
                    <p className="text-2xl font-black text-blue-700">
                      {selectedFoodForInfo.proteinas || 0}
                    </p>
                    <p className="text-[10px] text-blue-500 font-medium">gramos</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-600 mb-1">Carbohidratos</p>
                    <p className="text-2xl font-black text-emerald-700">
                      {selectedFoodForInfo.carbohidratos || 0}
                    </p>
                    <p className="text-[10px] text-emerald-500 font-medium">gramos</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                    <p className="text-xs font-bold text-yellow-600 mb-1">Lípidos</p>
                    <p className="text-2xl font-black text-yellow-700">
                      {selectedFoodForInfo.lipidos || 0}
                    </p>
                    <p className="text-[10px] text-yellow-500 font-medium">gramos</p>
                  </div>
                </div>
              </div>

              {/* Micronutrientes y Otros */}
              {(Number(selectedFoodForInfo.azucares ?? 0) > 0 ||
                Number(selectedFoodForInfo.fibra ?? 0) > 0 ||
                Number(selectedFoodForInfo.sodio ?? 0) > 0) && (
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                    Información Adicional
                  </h3>
                  <div className="space-y-2">
                    {Number(selectedFoodForInfo.azucares ?? 0) > 0 && (
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-bold text-slate-700">Azúcares</span>
                        <span className="text-sm font-black text-slate-900">
                          {selectedFoodForInfo.azucares}g
                        </span>
                      </div>
                    )}
                    {Number(selectedFoodForInfo.fibra ?? 0) > 0 && (
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-bold text-slate-700">Fibra</span>
                        <span className="text-sm font-black text-slate-900">
                          {selectedFoodForInfo.fibra}g
                        </span>
                      </div>
                    )}
                    {Number(selectedFoodForInfo.sodio ?? 0) > 0 && (
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-bold text-slate-700">Sodio</span>
                        <span className="text-sm font-black text-slate-900">
                          {selectedFoodForInfo.sodio}mg
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Unidad */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                  Unidad de Medida
                </h3>
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-sm font-bold text-indigo-600 mb-1">Unidad</p>
                  <p className="text-lg font-black text-indigo-900">
                    {selectedFoodForInfo.unidad || "g"}
                  </p>
                </div>
              </div>

              {/* Precio */}
              {selectedFoodForInfo.precioPromedio > 0 && (
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                    Precio Estimado
                  </h3>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-sm font-bold text-green-600 mb-1">Precio Promedio</p>
                    <p className="text-lg font-black text-green-900">
                      {formatCLP(selectedFoodForInfo.precioPromedio)}
                    </p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedFoodForInfo.tags && selectedFoodForInfo.tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                    Etiquetas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFoodForInfo.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      <Modal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        title="Validación de Restricciones"
      >
        <div className="space-y-4 text-left">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Resumen</p>
            <p className="text-sm font-bold text-slate-800 mt-1">
              {verificationResult?.summary || "Sin resultado disponible."}
            </p>
            {verificationResult && (
              <p className="text-xs text-slate-500 mt-2">
                Motor: {verificationResult.source.toUpperCase()} | Alimentos:{" "}
                {verificationResult.checkedFoods} | Restricciones:{" "}
                {verificationResult.checkedRestrictions}
              </p>
            )}
          </div>

          {verificationResult?.conflicts?.length ? (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {verificationResult.conflicts.map((conflict, index) => (
                <div
                  key={`${conflict.foodId}-${conflict.restriction}-${index}`}
                  className="p-3 rounded-xl border border-rose-200 bg-rose-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-rose-700">{conflict.foodName}</p>
                    <span
                      className={cn(
                        "text-[10px] font-black uppercase px-2 py-1 rounded",
                        conflict.severity === "high"
                          ? "bg-rose-200 text-rose-700"
                          : conflict.severity === "medium"
                            ? "bg-amber-200 text-amber-700"
                            : "bg-blue-200 text-blue-700",
                      )}
                    >
                      {conflict.severity}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    Restricción: {conflict.restriction}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{conflict.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
              <p className="text-sm font-black text-emerald-700">
                Todo OK: no se detectaron incompatibilidades directas.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Import Patient Modal */}
      <Modal
        isOpen={isImportPatientModalOpen}
        onClose={() => {
          setIsImportPatientModalOpen(false);
          setPatientSearchQuery("");
          setPatientsError(null);
        }}
        title="Vincular Paciente"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, email o Rut/ID..."
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
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => void handleSelectPatient(patient)}
                className="p-4 border-2 border-slate-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 group-hover:bg-emerald-100 group-hover:border-emerald-200 transition-colors">
                    <User className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{patient.fullName}</h3>
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

            {!isLoadingPatients && patientsError && (
              <div className="py-12 text-center">
                <AlertCircle className="h-10 w-10 text-rose-300 mx-auto mb-3" />
                <p className="text-sm text-rose-500 font-bold">No pudimos cargar tus pacientes.</p>
                <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">{patientsError}</p>
              </div>
            )}

            {!isLoadingPatients && !patientsError && filteredPatients.length === 0 && (
              <div className="py-12 text-center">
                <UserPlus className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-bold">
                  {patientSearchQuery.trim()
                    ? "No encontrábamos pacientes con ese criterio."
                    : "No se encontraron pacientes registrados."}
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ImportCreationModal
        isOpen={isImportCreationModalOpen}
        onClose={() => setIsImportCreationModalOpen(false)}
        onImport={handleImportCreation}
        defaultType="DIET"
      />

      {/* Create Group Modal */}
      <Modal
        isOpen={isAddGroupModalOpen}
        onClose={() => {
          setIsAddGroupModalOpen(false);
          setNewGroupNameInput("");
        }}
        title="Nueva Categoría"
      >
        <div className="space-y-5 text-left">
          <p className="text-sm text-slate-500">
            Crea una categoría personalizada para organizar alimentos específicos en tu plan.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Nombre de la Categoría
            </label>
            <Input
              placeholder="Ej: Snacks, Bebidas, Suplementos..."
              value={newGroupNameInput}
              onChange={(e) => setNewGroupNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateGroup();
              }}
              autoFocus
              className="h-12 rounded-xl border-slate-200 focus:border-emerald-500"
            />
            {newGroupNameInput.trim() &&
              Object.keys(allGroupsToRender)
                .map((g) => g.toLowerCase())
                .includes(newGroupNameInput.trim().toLowerCase()) && (
                <p className="text-xs text-rose-500 font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Ya existe una categoría con ese nombre.
                </p>
              )}
          </div>

          {Object.keys(allGroupsToRender).length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                Categorías actuales
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(allGroupsToRender).map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-bold border border-slate-200"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-xl font-black"
              onClick={handleCreateGroup}
              disabled={
                !newGroupNameInput.trim() ||
                Object.keys(allGroupsToRender)
                  .map((g) => g.toLowerCase())
                  .includes(newGroupNameInput.trim().toLowerCase())
              }
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Crear Categoría
            </Button>
            <Button
              variant="outline"
              className="h-11 px-4 rounded-xl border-slate-200"
              onClick={() => {
                setIsAddGroupModalOpen(false);
                setNewGroupNameInput("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Draft Food Editor Modal */}
      <Modal
        isOpen={isDraftFoodEditorOpen}
        onClose={() => setIsDraftFoodEditorOpen(false)}
        title={`Completar "${draftFoodToEdit?.producto || "alimento"}"`}
      >
        <div className="space-y-4 text-left">
          <p className="text-sm text-slate-500">
            Completa la información nutricional base para que los cálculos de las siguientes etapas
            sean correctos.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Cantidad base
              </label>
              <Input
                type="number"
                value={draftFoodValues.amount}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    amount: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Unidad
              </label>
              <Input
                value={draftFoodValues.unit}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    unit: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Calorías
              </label>
              <Input
                type="number"
                value={draftFoodValues.calories}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    calories: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Proteínas
              </label>
              <Input
                type="number"
                value={draftFoodValues.proteins}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    proteins: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Carbohidratos
              </label>
              <Input
                type="number"
                value={draftFoodValues.carbs}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    carbs: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Lípidos
              </label>
              <Input
                type="number"
                value={draftFoodValues.lipids}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    lipids: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Azúcares
              </label>
              <Input
                type="number"
                value={draftFoodValues.azucares}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    azucares: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Fibra
              </label>
              <Input
                type="number"
                value={draftFoodValues.fibra}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    fibra: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Sodio
              </label>
              <Input
                type="number"
                value={draftFoodValues.sodio}
                onChange={(e) =>
                  setDraftFoodValues((prev) => ({
                    ...prev,
                    sodio: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border-slate-200 h-10 rounded-xl"
              onClick={() => setIsDraftFoodEditorOpen(false)}
              disabled={isSavingDraftFood}
            >
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 rounded-xl"
              onClick={handleSaveDraftFood}
              disabled={isSavingDraftFood}
            >
              {isSavingDraftFood ? "Guardando..." : "Guardar información"}
            </Button>
          </div>
        </div>
      </Modal>

      <SaveCreationModal
        isOpen={isSaveCreationModalOpen}
        onClose={() => setIsSaveCreationModalOpen(false)}
        onConfirm={handleSaveWithDescription}
        description={creationDescription}
        onDescriptionChange={setCreationDescription}
        title="Guardar dieta"
        subtitle="Añade una breve descripción para reconocer esta dieta dentro de Mis creaciones."
      />
    </>
  );
};
