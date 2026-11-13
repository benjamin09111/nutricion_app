"use client";

import React, { useState, useMemo } from "react";
import {
  Utensils,
  Download,
  Save,
  RotateCcw,
  Filter,
  FileCode,
  Loader2,
  Sparkles,
  ChefHat,
  Beef,
  Wheat,
  Droplets,
  Scale,
  Tag as TagIcon,
  AlertCircle,
  Apple,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { TagInput } from "@/components/ui/TagInput";
import { ActionDockItem } from "@/components/ui/ActionDock";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleUsageBadges } from "@/components/shared/ModuleUsageBadges";
import { MarketPrice } from "@/features/foods";
import { useDietState } from "@/features/diet/hooks/useDietState";
import { DietPlannerSection } from "@/features/diet/components/DietPlannerSection";
import { DietModals } from "@/features/diet/components/DietModals";
import { buildFoodInfoPreview } from "@/features/diet/utils/diet-helpers";
import { downloadDietPdf } from "@/features/pdf/pdfExport";
import { saveCreation } from "@/lib/workflow";
import { toast } from "sonner";
import { FreemiumUpgradeModal } from "@/components/memberships/FreemiumUpgradeModal";
import { FoodReferenceBook } from "@/components/foods/FoodReferenceBook";
import { formatCLP } from "@/lib/utils/currency";

interface DietasClientProps {
  initialFoods: MarketPrice[];
}

export default function DietasClient({ initialFoods }: DietasClientProps) {
  const state = useDietState({ initialFoods, startEmpty: true });
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isFoodReferenceBookOpen, setIsFoodReferenceBookOpen] = useState(false);

  // Compute total foods count across categories
  const totalFoodsCount = useMemo(() => {
    return Object.values(state.allGroupsToRender).reduce(
      (acc, foods) => acc + foods.length,
      0,
    );
  }, [state.allGroupsToRender]);

  // Real-time macro calculations
  const totals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;
    let price = 0;

    Object.values(state.allGroupsToRender).forEach((foods) => {
      foods.forEach((food) => {
        calories += Number(food.calorias) || 0;
        protein += Number(food.proteinas) || 0;
        carbs += Number(food.carbohidratos) || 0;
        fats += Number(food.lipidos) || 0;
        price += Number(food.precioPromedio) || 0;
      });
    });

    return {
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fats: Math.round(fats * 10) / 10,
      price: Math.round(price),
    };
  }, [state.allGroupsToRender]);

  // Handle Save Creation (JSON to Creaciones)
  const handleSaveCreation = async () => {
    if (!state.dietName.trim()) {
      toast.error("Ingresa un nombre para la dieta antes de guardar.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: state.dietName.trim(),
        type: "DIET" as const,
        content: {
          dietName: state.dietName.trim(),
          dietTags: state.dietTags,
          groups: state.allGroupsToRender,
          totals,
          patientName: "tú persona",
        },
        metadata: {
          patientName: "tú persona",
        },
        tags: state.dietTags.length > 0 ? state.dietTags : ["Dieta General"],
      };
      const res = await saveCreation(payload);
      if (res?.wasUpdated) {
        toast.success(`Dieta "${state.dietName}" actualizada correctamente en Creaciones.`);
      } else if (res?.wasCreated === false) {
        toast.info(`La dieta "${state.dietName}" ya se encuentra guardada en Creaciones sin cambios pendientes.`);
      } else {
        toast.success(`Dieta "${state.dietName}" guardada en Creaciones.`);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("creation-saved"));
      }
    } catch (err: any) {
      toast.error(err?.message || "No se pudo guardar la dieta.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle PDF Export
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const foodsList = Object.values(state.allGroupsToRender).flat();
      await downloadDietPdf({
        dietName: state.dietName.trim() || "Dieta General Base",
        dietTags: state.dietTags,
        patientName: "tú persona",
        foods: foodsList,
        generatedAt: new Date().toLocaleDateString("es-CL"),
      });
      toast.success("PDF descargado correctamente.");
    } catch (err: any) {
      console.error("Error al exportar PDF de dieta:", err);
      const msg = (err?.message || "").toLowerCase();
      if (
        err?.status === 403 ||
        msg.includes("límite") ||
        msg.includes("cuota") ||
        msg.includes("plan") ||
        msg.includes("free")
      ) {
        setIsUpgradeModalOpen(true);
      } else {
        toast.error(err?.message || "Error al generar el PDF de la dieta.");
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle Save & PDF Combined Action
  const handleSaveAndPdf = async () => {
    await handleSaveCreation();
    await handleExportPdf();
  };

  // Handle direct JSON download
  const handleDownloadJson = () => {
    const jsonContent = {
      name: state.dietName.trim() || "Dieta General Base",
      type: "DIET",
      version: "1.0",
      patientName: "tú persona",
      createdAt: new Date().toISOString(),
      tags: state.dietTags,
      totals,
      groups: state.allGroupsToRender,
    };
    const blob = new Blob([JSON.stringify(jsonContent, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = (state.dietName || "dieta_base")
      .replace(/\s+/g, "_")
      .replace(/[^\w-]/g, "");
    link.download = `${safeName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Archivo JSON exportado correctamente.");
  };

  // Handle Importing Creation into current workspace
  const handleImportCreationLocal = (creation: any) => {
    if (creation?.content?.groups) {
      state.setCustomGroups(creation.content.groups);
    }
    if (creation?.content?.dietName || creation?.name) {
      state.setDietName(creation.content?.dietName || creation.name);
    }
    state.setIsImportCreationModalOpen(false);
    toast.success(`Dieta "${creation.name}" importada exitosamente.`);
  };

  // Action Dock buttons: Reiniciar, Importar otra DIETA creada, Guardar, Descargar
  const actionItems: ActionDockItem[] = useMemo(
    () => [
      {
        id: "reset",
        icon: RotateCcw,
        label: "Reiniciar",
        description: "Reiniciar borrador y limpiar alimentos",
        variant: "rose",
        onClick: () => state.setIsResetConfirmOpen(true),
      },
      {
        id: "import",
        icon: Filter,
        label: "Importar dieta creada",
        description: "Cargar una dieta previamente guardada",
        variant: "emerald",
        onClick: () => setIsUpgradeModalOpen(true),
      },
      {
        id: "food-reference-book",
        icon: Apple,
        label: "Manual de alimentos",
        description: "Tabla oficial de porciones e información nutricional",
        variant: "amber",
        onClick: () => setIsFoodReferenceBookOpen(true),
      },
      {
        id: "save",
        icon: isSaving ? Loader2 : Save,
        label: isSaving ? "Guardando..." : "Guardar",
        description: "Guardar en Creaciones",
        variant: "emerald",
        disabled: isSaving,
        onClick: () => void handleSaveCreation(),
      },
      {
        id: "pdf",
        icon: isExportingPdf ? Loader2 : Download,
        label: isExportingPdf ? "Exportando..." : "Descargar",
        description: "Descargar pauta en PDF",
        variant: "emerald",
        disabled: isExportingPdf,
        onClick: () => void handleExportPdf(),
      },
    ],
    [state, isSaving, isExportingPdf],
  );

  return (
    <>
      <ModuleLayout
        title="Dietas Generales"
        description={
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#668E20] -mt-0.5 mb-0.5">
              <Utensils className="w-4 h-4 text-[#86A83C]" />
              <span className="tracking-wider uppercase text-[10px] font-bold">Planificación y Estrategia Dietética</span>
            </div>
            <p className="text-sm sm:text-[15px] text-[#626573] leading-relaxed">
              Crea plantillas alimenticias generales clasificadas por categorías y alimentos. Calcula aportes nutricionales globales y guarda en creaciones para reutilizar.
            </p>
          </div>
        }
        rightContent={<ModuleUsageBadges />}
        rightNavItems={state.isHydrating ? [] : actionItems}
        rightNavDesktopBreakpoint="lg"
        className="max-w-[68rem]"
      >
        {state.isHydrating ? (
          <div className="flex min-h-[24rem] items-center justify-center rounded-2xl border border-[#E9E5E7] bg-white p-8 shadow-2xs">
            <div className="flex items-center gap-3 text-sm font-semibold text-[#626573]">
              <Loader2 className="h-5 w-5 animate-spin text-[#86A83C]" />
              Cargando diseñador de dietas...
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header: Title, Constraints & Actions (Unboxed Layout) */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-end">
                {/* Diet Name */}
                <div className="lg:col-span-5 space-y-1.5">
                  <label className="text-xs font-semibold text-[#20212B] flex items-center gap-1">
                    Nombre de la Dieta <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={state.dietName}
                    onChange={(e) => state.setDietName(e.target.value)}
                    placeholder="Ej. Dieta Normocalórica Base - 1800 kcal"
                    className="h-10 rounded-xl border-[#E9E5E7] bg-white text-sm text-[#20212B] font-normal focus:border-[#86A83C] shadow-2xs"
                  />
                </div>

                {/* Restricción Clínica Input */}
                <div className="lg:col-span-4 space-y-1.5">
                  <label className="text-xs font-semibold text-[#20212B] flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    Restricción / Foco Nutricional
                  </label>
                  <TagInput
                    value={state.activeConstraints}
                    onChange={(newTags) => state.setActiveConstraints(newTags)}
                    placeholder="Sin gluten, intolerancia..."
                    suggestions={state.availableConstraintTags}
                    disableDelete={true}
                    openDirection="down"
                    className="h-10 rounded-xl border-[#E9E5E7] bg-white text-xs shadow-2xs"
                  />
                </div>

                {/* Action Buttons */}
                <div className="lg:col-span-3 flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={state.applyBaseFoods}
                    className="h-10 px-3.5 border border-[#E9E5E7] bg-white text-[#20212B] hover:border-[#86A83C] hover:bg-[#F0F5DF] hover:text-[#668E20] font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  >
                    <ChefHat className="h-4 w-4 text-[#86A83C]" />
                    <span>Ingredientes base</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveCreation()}
                    disabled={isSaving}
                    className="h-10 px-4 bg-[#86A83C] hover:bg-[#78A82F] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>Guardar Dieta</span>
                  </button>
                </div>
              </div>

              {/* Tag Badges (Clean inline chips) */}
              {state.dietTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-medium text-[#848792] flex items-center gap-1">
                    <TagIcon className="h-3.5 w-3.5" /> Etiquetas:
                  </span>
                  {state.dietTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-[#626573] text-xs font-medium rounded-full border border-slate-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() =>
                          state.setDietTags((prev) => prev.filter((t) => t !== tag))
                        }
                        className="hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Macro Calculations Summary Bar (Minimalist Horizontal Bar) */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E9E5E7] bg-white px-5 py-3.5 shadow-2xs">
              <div className="flex items-center gap-5 sm:gap-7 flex-wrap">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-[#86A83C]" />
                  <span className="text-xs text-[#626573] font-medium">Energía:</span>
                  <span className="text-sm font-bold text-[#20212B]">{totals.calories} <span className="text-xs font-normal text-[#848792]">kcal</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Beef className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-[#626573] font-medium">Proteínas:</span>
                  <span className="text-sm font-bold text-blue-700">{totals.protein} <span className="text-xs font-normal text-[#848792]">g</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Wheat className="h-4 w-4 text-[#86A83C]" />
                  <span className="text-xs text-[#626573] font-medium">Carbohidratos:</span>
                  <span className="text-sm font-bold text-[#668E20]">{totals.carbs} <span className="text-xs font-normal text-[#848792]">g</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-[#626573] font-medium">Lípidos:</span>
                  <span className="text-sm font-bold text-amber-700">{totals.fats} <span className="text-xs font-normal text-[#848792]">g</span></span>
                </div>
              </div>
              <span className="text-xs text-[#848792] font-medium">
                {totalFoodsCount} alimentos seleccionados
              </span>
            </div>

            {/* Diet Categories & Food Builder Section */}
            <div className="space-y-4">
              <DietPlannerSection
                allGroupsToRender={state.allGroupsToRender}
                openAddModal={state.openAddModal}
                setGroupToDelete={state.setGroupToDelete}
                setIsDeleteGroupConfirmOpen={state.setIsDeleteGroupConfirmOpen}
                openDraftFoodEditor={state.openDraftFoodEditor}
                setSelectedFoodForInfo={state.setSelectedFoodForInfo}
                setIsFoodInfoModalOpen={state.setIsFoodInfoModalOpen}
                removeFood={state.removeFood}
                setIsAddGroupModalOpen={state.setIsAddGroupModalOpen}
                initialFoods={state.initialFoods || initialFoods}
                addFoodToGroup={state.addFoodToGroup}
                handleCreateGroupByName={state.handleCreateGroupByName}
              />
            </div>
          </div>
        )}
      </ModuleLayout>

      {/* Shared Modals */}
      <DietModals
        isResetConfirmOpen={state.isResetConfirmOpen}
        setIsResetConfirmOpen={state.setIsResetConfirmOpen}
        resetDiet={state.resetDiet}
        isExportConfirmOpen={state.isExportConfirmOpen}
        setIsExportConfirmOpen={state.setIsExportConfirmOpen}
        performExportPdf={state.performExportPdf}
        isContinueDraftWarningOpen={state.isContinueDraftWarningOpen}
        setIsContinueDraftWarningOpen={state.setIsContinueDraftWarningOpen}
        continueToRecipes={async () => {}}
        pendingTagCreation={state.pendingTagCreation}
        setPendingTagCreation={state.setPendingTagCreation}
        createGlobalTag={state.createGlobalTag}
        isDeleteGroupConfirmOpen={state.isDeleteGroupConfirmOpen}
        setIsDeleteGroupConfirmOpen={state.setIsDeleteGroupConfirmOpen}
        confirmDeleteGroup={state.confirmDeleteGroup}
        groupToDelete={state.groupToDelete}
        isAddFoodModalOpen={state.isAddFoodModalOpen}
        setIsAddFoodModalOpen={state.setIsAddFoodModalOpen}
        activeGroupForAddition={state.activeGroupForAddition}
        foodSearchQuery={state.foodSearchQuery}
        setFoodSearchQuery={state.setFoodSearchQuery}
        isSearchingFoods={state.isSearchingFoods}
        searchResultFoods={state.searchResultFoods}
        setSelectedFoodForInfo={state.setSelectedFoodForInfo}
        setIsFoodInfoModalOpen={state.setIsFoodInfoModalOpen}
        handleAddFromSearch={state.handleAddFromSearch}
        isCreatingManualFood={state.isCreatingManualFood}
        handleCreateManualFood={state.handleCreateManualFood}
        isSmartModalOpen={state.isSmartModalOpen}
        setIsSmartModalOpen={state.setIsSmartModalOpen}
        smartAddTab={state.smartAddTab}
        setSmartAddTab={state.setSmartAddTab}
        smartSearchQuery={state.smartSearchQuery}
        setSmartSearchQuery={state.setSmartSearchQuery}
        isLoadingSmart={state.isLoadingSmart}
        smartFavorites={state.smartFavorites}
        smartGroups={state.smartGroups}
        smartMyProducts={state.smartMyProducts}
        smartSearchResults={state.smartSearchResults}
        isSearchingInSmart={state.isSearchingInSmart}
        selectedFoods={state.selectedFoods}
        toggleSmartSelection={state.toggleSmartSelection}
        toggleGroupSelection={state.toggleGroupSelection}
        smartInfoFood={state.smartInfoFood}
        setSmartInfoFood={state.setSmartInfoFood}
        handleSmartAddAll={state.handleSmartAddAll}
        buildFoodInfoPreview={buildFoodInfoPreview}
        isFoodInfoModalOpen={state.isFoodInfoModalOpen}
        selectedFoodForInfo={state.selectedFoodForInfo}
        isVerificationModalOpen={state.isVerificationModalOpen}
        setIsVerificationModalOpen={state.setIsVerificationModalOpen}
        verificationResult={state.verificationResult}
        isImportPatientModalOpen={state.isImportPatientModalOpen}
        setIsImportPatientModalOpen={state.setIsImportPatientModalOpen}
        patientSearchQuery={state.patientSearchQuery}
        setPatientSearchQuery={state.setPatientSearchQuery}
        isLoadingPatients={state.isLoadingPatients}
        filteredPatients={state.filteredPatients}
        patientsError={state.patientsError}
        setPatientsError={state.setPatientsError}
        handleSelectPatient={state.handleSelectPatient}
        patients={state.patients}
        isImportCreationModalOpen={state.isImportCreationModalOpen}
        setIsImportCreationModalOpen={state.setIsImportCreationModalOpen}
        handleImportCreation={handleImportCreationLocal}
        isAddGroupModalOpen={state.isAddGroupModalOpen}
        setIsAddGroupModalOpen={state.setIsAddGroupModalOpen}
        newGroupNameInput={state.newGroupNameInput}
        setNewGroupNameInput={state.setNewGroupNameInput}
        handleCreateGroup={state.handleCreateGroup}
        allGroupsToRender={state.allGroupsToRender}
        isDraftFoodEditorOpen={state.isDraftFoodEditorOpen}
        setIsDraftFoodEditorOpen={state.setIsDraftFoodEditorOpen}
        draftFoodToEdit={state.draftFoodToEdit}
        draftFoodValues={state.draftFoodValues}
        setDraftFoodValues={state.setDraftFoodValues}
        handleSaveDraftFood={state.handleSaveDraftFood}
        isSavingDraftFood={state.isSavingDraftFood}
        isSaveCreationModalOpen={state.isSaveCreationModalOpen}
        setIsSaveCreationModalOpen={state.setIsSaveCreationModalOpen}
        creationDescription={state.creationDescription}
        setCreationDescription={state.setCreationDescription}
        handleSaveWithDescription={state.handleSaveWithDescription}
      />

      <FreemiumUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        description="La importación de pautas y plantillas de dietas anteriores es una función exclusiva para usuarios con un plan de pago (Pro/Premium). ¡Actualiza tu plan para reutilizar tus creaciones guardadas y ahorrar tiempo en cada consulta!"
      />

      <FoodReferenceBook
        isOpen={isFoodReferenceBookOpen}
        onClose={() => setIsFoodReferenceBookOpen(false)}
      />
    </>
  );
}
