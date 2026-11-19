"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import {
  Utensils,
  RotateCcw,
  Filter,
  FileCode,
  Loader2,
  Sparkles,
  Beef,
  Wheat,
  Droplets,
  Scale,
  Tag as TagIcon,
  AlertCircle,
  Apple,
  User,
  Lock,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
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
import { NatyPlanChatDemo } from "@/components/plans/NatyPlanChatDemo";
import { PlanWizardShell } from "@/components/plans";
import { formatCLP } from "@/lib/utils/currency";
import { useDashboardShell } from "@/context/DashboardShellContext";
import { isGuestMode } from "@/lib/demo-local-api";

interface DietasClientProps {
  initialFoods: MarketPrice[];
}

export default function DietasClient({ initialFoods }: DietasClientProps) {
  const { setSidebarCollapsed } = useDashboardShell();
  const state = useDietState({ initialFoods, startEmpty: false });
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isFoodReferenceBookOpen, setIsFoodReferenceBookOpen] = useState(false);
  const hasEnsuredDemoBaseFoods = useRef(false);
  const [isNatyChatOpen, setIsNatyChatOpen] = useState(false);
  const [dietWizardStep, setDietWizardStep] = useState(0);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [useBaseTemplate, setUseBaseTemplate] = useState(true);
  const [resetToEmpty, setResetToEmpty] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(true);
  }, [setSidebarCollapsed]);

  // Compute total foods count across categories
  const totalFoodsCount = useMemo(() => {
    return Object.values(state.allGroupsToRender).reduce(
      (acc, foods) => acc + foods.length,
      0,
    );
  }, [state.allGroupsToRender]);

  useEffect(() => {
    if (
      hasEnsuredDemoBaseFoods.current ||
      !isGuestMode() ||
      state.isHydrating ||
      totalFoodsCount > 0
    ) {
      return;
    }

    hasEnsuredDemoBaseFoods.current = true;
    state.applyBaseFoods();
  }, [state.isHydrating, totalFoodsCount, state]);

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

  const handleResetDiet = () => {
    if (resetToEmpty) {
      state.startFromZero();
      setUseBaseTemplate(false);
      return;
    }

    state.resetDiet();
    setDietWizardStep(0);
    setUseBaseTemplate(true);
  };

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

  const buildDietPdfData = () => ({
    dietName: state.dietName.trim() || "Dieta General Base",
    dietTags: state.dietTags,
    patientName: "tú persona",
    foods: Object.values(state.allGroupsToRender).flat(),
    generatedAt: new Date().toLocaleDateString("es-CL"),
  });

  const handlePreviewPdf = async () => {
    try {
      const [{ pdf }, { DietPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/features/pdf/DietPdfDocument"),
      ]);
      const blob = await pdf(React.createElement(DietPdfDocument, { data: buildDietPdfData() }) as any).toBlob();
      if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(URL.createObjectURL(blob));
    } catch (error: any) {
      toast.error(error?.message || "No se pudo generar la vista previa.");
    }
  };

  // Handle PDF Export
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await downloadDietPdf(buildDietPdfData());
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

  // Action Dock shared with the quick modules, plus Importar dieta.
  const actionItems: ActionDockItem[] = useMemo(
    () => [
      {
        id: "patient",
        icon: state.isLoadingPatients ? Loader2 : User,
        label: state.selectedPatient?.fullName || "Importar paciente",
        description: state.selectedPatient ? "Cambiar paciente" : "Importar paciente",
        variant: state.selectedPatient ? "emerald" : "slate",
        disabled: state.isLoadingPatients,
        onClick: () => state.setIsImportPatientModalOpen(true),
      },
      {
        id: "import",
        icon: Filter,
        label: "Importar creación",
        description: "Importar creación no disponible por ahora",
        variant: "indigo",
        disabled: true,
        onClick: () => undefined,
      },
      {
        id: "naty-chat",
        icon: Sparkles,
        customIcon: <Image src="/circle_logo.webp" alt="Naty" width={48} height={48} className="-m-1.5 h-10 w-10 rounded-full object-contain md:-m-2 md:h-12 md:w-12" />,
        label: "Hablar con Naty",
        description: "Abrir chat demo de Naty",
        variant: "indigo",
        onClick: () => setIsNatyChatOpen(true),
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
        id: "reset",
        icon: RotateCcw,
        label: "Reiniciar",
        description: "Volver a la plantilla base",
        variant: "rose",
        onClick: () => {
          setResetToEmpty(false);
          state.setIsResetConfirmOpen(true);
        },
      },
    ],
    [state, setIsFoodReferenceBookOpen],
  );

  return (
    <>
      <NatyPlanChatDemo isOpen={isNatyChatOpen} onClose={() => setIsNatyChatOpen(false)} />
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
              <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
                {/* Diet Name */}
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
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

             <PlanWizardShell
               steps={["Dieta base", "Resumen"]}
               currentStep={dietWizardStep}
               completedSteps={dietWizardStep > 0 ? [0] : []}
               onStepClick={setDietWizardStep}
               onBack={() => setDietWizardStep(0)}
               onNext={() => setDietWizardStep(1)}
               isLastStep={dietWizardStep === 1}
               hideNextOnLastStep
               nextDisabled={dietWizardStep === 0 && (!state.dietName.trim() || totalFoodsCount === 0)}
               lockFutureSteps
             >
             {dietWizardStep === 0 ? (
             <>
             {/* Macro Calculations Summary Bar (Minimalist Horizontal Bar) */}
             <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs">
               <input
                 type="checkbox"
                 checked={useBaseTemplate}
                 onChange={(event) => {
                   const nextValue = event.target.checked;
                   setUseBaseTemplate(nextValue);
                   setResetToEmpty(!nextValue);
                   if (nextValue) {
                     state.applyBaseFoods();
                   } else {
                     state.startFromZero();
                   }
                 }}
                 className="h-4 w-4 rounded border-slate-300 text-[#86A83C] focus:ring-[#86A83C]"
               />
               Usar plantilla base de alimentos
             </label>

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
             </>
             ) : (
               <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                 <div>
                   <h2 className="text-base sm:text-lg font-bold text-slate-900">Resumen de la dieta</h2>
                   <p className="mt-1 text-xs leading-5 text-slate-500">Revisa la plantilla antes de exportarla o guardarla.</p>
                 </div>
                 <div className="grid gap-3 sm:grid-cols-3">
                   <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dieta</p><p className="mt-1 text-sm font-bold text-slate-900">{state.dietName || "Dieta General Base"}</p></div>
                   <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Categorías</p><p className="mt-1 text-sm font-bold text-slate-900">{Object.keys(state.allGroupsToRender).length}</p></div>
                   <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Alimentos</p><p className="mt-1 text-sm font-bold text-slate-900">{totalFoodsCount}</p></div>
                 </div>
                 <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                   <Button type="button" variant="outline" onClick={() => setDietWizardStep(0)} className="rounded-xl">Volver</Button>
                   <Button type="button" onClick={() => void handlePreviewPdf()} className="rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">Vista previa</Button>
                   <Button type="button" onClick={() => void handleExportPdf()} disabled={isExportingPdf} className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">Descargar PDF</Button>
                   <Button type="button" disabled={isGuestMode()} onClick={() => void handleSaveCreation()} className="rounded-xl bg-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-100"><Lock className="mr-2 h-4 w-4" />Guardar dieta</Button>
                   <Button type="button" disabled={isGuestMode()} onClick={async () => { await handleSaveCreation(); await handleExportPdf(); }} className="rounded-xl bg-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-100"><Lock className="mr-2 h-4 w-4" />Guardar y descargar</Button>
                 </div>
               </section>
             )}
             </PlanWizardShell>
           </div>
        )}
      </ModuleLayout>

      <Modal
        isOpen={Boolean(previewPdfUrl)}
        onClose={() => {
          if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
          setPreviewPdfUrl(null);
        }}
        title="Vista previa de la dieta"
        className="max-w-5xl"
      >
        {previewPdfUrl && (
          <div className="h-[70vh] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <iframe src={`${previewPdfUrl}#toolbar=1&navpanes=0`} title="Vista previa de la dieta" className="h-full w-full border-0" />
          </div>
        )}
      </Modal>

      {/* Shared Modals */}
      <DietModals
        isResetConfirmOpen={state.isResetConfirmOpen}
        setIsResetConfirmOpen={state.setIsResetConfirmOpen}
        resetDiet={handleResetDiet}
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
