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
import { Button } from "@/components/ui/Button";
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
        variant: "indigo",
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
        variant: "indigo",
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
        description="Crea plantillas alimenticias generales clasificadas por categorías y alimentos. Calcula aportes nutricionales globales y guarda en formato JSON o PDF para reutilizar en entregables."
        step={{
          number: 1,
          label: "Diseñador de Dieta",
          icon: Utensils,
          color: "text-emerald-600",
        }}
        rightContent={<ModuleUsageBadges />}
        rightNavItems={state.isHydrating ? [] : actionItems}
        rightNavDesktopBreakpoint="lg"
        className="max-w-[68rem]"
      >
        {state.isHydrating ? (
          <div className="flex min-h-[24rem] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              Cargando diseñador de dietas...
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header: Title & Info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nombre de la Dieta
                  </label>
                  <Input
                    value={state.dietName}
                    onChange={(e) => state.setDietName(e.target.value)}
                    placeholder="Ej. Dieta Normocalórica Base - 1800 kcal"
                    className="h-11 font-bold text-slate-900 text-lg border-slate-200 focus:border-emerald-500 rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5 md:pt-0 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={state.applyBaseFoods}
                    className="h-11 px-4 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl gap-2 shadow-xs cursor-pointer"
                  >
                    <ChefHat className="h-4 w-4 text-emerald-600" />
                    Aplicar ingredientes base
                  </Button>
                  <Button
                    onClick={() => void handleSaveCreation()}
                    disabled={isSaving}
                    className="h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 shadow-sm"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Guardar Dieta
                  </Button>
                </div>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <TagIcon className="h-3.5 w-3.5" /> Etiquetas:
                </span>
                {state.dietTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        state.setDietTags((prev) => prev.filter((t) => t !== tag))
                      }
                      className="hover:text-rose-600 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <span className="text-xs text-slate-400 italic">
                  ({totalFoodsCount} alimentos seleccionados)
                </span>
              </div>

              {/* Restricción Clínica Input */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Restricción Clínica / Foco Nutricional
                </label>
                <TagInput
                  value={state.activeConstraints}
                  onChange={(newTags) => state.setActiveConstraints(newTags)}
                  placeholder="Ej: Sin gluten, Intolerancia a la lactosa, Diabético, HTA..."
                  suggestions={state.availableConstraintTags}
                  disableDelete={true}
                  openDirection="down"
                  helperText="Selecciona sugerencias o presiona Enter para agregar una restricción."
                  className="min-h-[44px] rounded-xl border-slate-200 bg-white shadow-xs"
                />
              </div>
            </div>

            {/* Macro Calculations Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-emerald-600" /> Energía Total
                </span>
                <div className="mt-2">
                  <span className="text-2xl font-black text-slate-900">{totals.calories}</span>
                  <span className="text-xs font-semibold text-slate-400 ml-1">kcal</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Beef className="h-4 w-4 text-slate-500" /> Proteínas
                </span>
                <div className="mt-2">
                  <span className="text-2xl font-black text-slate-900">{totals.protein}</span>
                  <span className="text-xs font-semibold text-slate-400 ml-1">g</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Wheat className="h-4 w-4 text-slate-500" /> Carbohidratos
                </span>
                <div className="mt-2">
                  <span className="text-2xl font-black text-slate-900">{totals.carbs}</span>
                  <span className="text-xs font-semibold text-slate-400 ml-1">g</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Droplets className="h-4 w-4 text-slate-500" /> Lípidos
                </span>
                <div className="mt-2">
                  <span className="text-2xl font-black text-slate-900">{totals.fats}</span>
                  <span className="text-xs font-semibold text-slate-400 ml-1">g</span>
                </div>
              </div>
            </div>

            {/* Diet Categories & Food Builder Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
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
