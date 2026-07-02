"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  ChefHat,
  Library,
  User,
  Download,
  RotateCcw,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ActionDockItem } from "@/components/ui/ActionDock";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleFooter } from "@/components/shared/ModuleFooter";
import { WorkflowContextBanner } from "@/components/shared/WorkflowContextBanner";
import { WizardTabs } from "@/components/shared/WizardTabs";
import { DraftRestoreModal } from "@/components/shared/DraftRestoreModal";
import { ImportCreationModal } from "@/components/shared/ImportCreationModal";
import { buildProjectAwarePath } from "@/lib/workflow";

// Hooks & Subcomponents
import { useRecipesState } from "@/features/recipes/hooks/useRecipesState";
import { RecipeBaseSection } from "@/features/recipes/components/RecipeBaseSection";
import { RecipePatientSection } from "@/features/recipes/components/RecipePatientSection";
import { RecipeConfigSection } from "@/features/recipes/components/RecipeConfigSection";
import { RecipeLibrarySection } from "@/features/recipes/components/RecipeLibrarySection";
import { RecipePlannerSection } from "@/features/recipes/components/RecipePlannerSection";
import { RecipeModals } from "@/features/recipes/components/RecipeModals";

const WIZARD_STEPS = [
  { label: "Base", description: "Contexto inicial y fuente principal." },
  { label: "Paciente", description: "Asocia o revisa el caso activo." },
  { label: "Configuración", description: "Horarios, estructura y reglas." },
  { label: "Biblioteca", description: "Explora y agrega recetas." },
  { label: "Planificador", description: "Distribuye recetas por día y bloque." },
];

export default function RecipesClient() {
  const router = useRouter();
  const state = useRecipesState();
  const [currentStep, setCurrentStep] = useState(0);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, WIZARD_STEPS.length - 1)));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(WIZARD_STEPS.length - 1, prev + 1));
  }, []);

  const actionDockItems: ActionDockItem[] = useMemo(
    () => [
      {
        id: "created-recipes",
        icon: ChefHat,
        label: state.showOnlyMyRecipes ? "Mis platos creados" : "Mostrar mis platos",
        variant: "emerald",
        onClick: () => {
          state.setShowOnlyMyRecipes(true);
          state.setShowMatchingOnly(true);
          state.setRecipeModalTab("mine");
          state.setRecipeSearch("");
          state.setRecipeMealSectionFilter("");
          state.setRecipeLibraryPage(1);
          toast.success("Mostrando tus platos creados.");
        },
      },
      {
        id: "created-recipes-anyway",
        icon: Library,
        label: "Importar aunque no coincidan",
        variant: "slate",
        onClick: () => {
          state.setShowOnlyMyRecipes(true);
          state.setShowMatchingOnly(false);
          state.setRecipeModalTab("mine");
          state.setRecipeSearch("");
          state.setRecipeMealSectionFilter("");
          state.setRecipeLibraryPage(1);
          toast.info("Ahora puedes elegir platos creados aunque no coincidan al 100%.");
        },
      },
      {
        id: "import-creation",
        icon: Library,
        label: "Importar Creación",
        variant: "indigo",
        onClick: () => {
          state.setIsImportCreationModalOpen(true);
        },
      },
      !state.selectedPatient && {
        id: "link-patient",
        icon: User,
        label: "Importar Paciente",
        variant: "emerald",
        onClick: () => {
          state.setIsImportPatientModalOpen(true);
          state.fetchPatients();
        },
      },
      {
        id: "export-pdf",
        icon: Download,
        label: "Exportar PDF",
        variant: "slate",
        onClick: state.handleExportPdf,
        disabled: state.isRecipesLocked || state.isExportingPdf,
      },
      {
        id: "reset",
        icon: RotateCcw,
        label: "Reiniciar Todo",
        variant: "rose",
        onClick: state.resetRecipes,
        disabled: state.isRecipesLocked,
      },
    ].filter(Boolean) as ActionDockItem[],
    [state],
  );

  const assignedSourceSummary = useMemo(() => {
    if (state.sourceModules.diet) return "Dieta asignada · metas heredadas";
    return "Sin dieta asignada";
  }, [state.sourceModules]);

  return (
    <>
      {state.isGenerating ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 backdrop-blur-sm">
          <div className="mx-4 flex max-w-sm flex-col items-center rounded-[2rem] bg-white px-8 py-7 text-center shadow-2xl">
            <Image
              src="/nutria.webp"
              alt="Nati está cocinando"
              width={112}
              height={112}
              className="h-28 w-28 animate-pulse object-contain"
            />
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.28em] text-emerald-600">
              Nati está cocinando
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">
              Rellenando platos vacíos
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Estamos completando automáticamente los bloques pendientes de {state.currentDay}.
            </p>
            <div className="mt-5 flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando con IA
            </div>
          </div>
        </div>
      ) : null}

      <ImportCreationModal
        isOpen={state.isImportCreationModalOpen}
        onClose={() => state.setIsImportCreationModalOpen(false)}
        onImport={state.handleImportCreation}
        defaultType="DIET"
      />

      <DraftRestoreModal
        isOpen={state.showDraftModal}
        moduleName="Recetas"
        draftLabel={state.draftMeta.label}
        draftDate={state.draftMeta.date}
        onKeep={state.handleKeepDraft}
        onDiscard={state.handleDiscardDraft}
      />

      <ModuleLayout
        title="Cuantificación: Recetas y Porciones"
        description={
          <div className="space-y-4">
            <p>
              Transforma tu estrategia en platos concretos. Navega por etapas para revisar el contexto, la configuración y el planificador sin perder espacio visual.
            </p>
          </div>
        }
        className="max-w-none"
        rightNavItems={actionDockItems}
        footer={
          <ModuleFooter>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Status del Plan
                </p>
                <p className="text-xs font-bold text-slate-600">
                  Estructura semanal alineada con Dieta y con sus objetivos clínicos heredados.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                className="h-12 px-8 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 uppercase tracking-widest text-xs"
                disabled={state.isRecipesLocked}
                onClick={async () => {
                  try {
                    if (state.isRecipesLocked) {
                      toast.error("Importa una dieta primero.");
                      return;
                    }
                    await state.persistRecipesCreation();
                    toast.success("Creación guardada exitosamente");
                  } catch (error: any) {
                    toast.error(error?.message || "No se pudieron guardar las recetas.");
                  }
                }}
              >
                Guardar Creación
              </Button>

              <Button
                disabled={state.isRecipesLocked}
                onClick={async () => {
                  try {
                    if (state.isRecipesLocked) {
                      toast.error("Importa una dieta primero.");
                      return;
                    }
                    const emptyBlocks = state.getEmptyMealBlocks();
                    if (emptyBlocks.length > 0) {
                      const firstEmpty = emptyBlocks[0];
                      toast.error("Aún hay bloques de comida vacíos.", {
                        description: `${firstEmpty.day}: ${firstEmpty.label} (${firstEmpty.time}). Completa todos los bloques antes de continuar.`,
                      });
                      state.setCurrentDay(firstEmpty.day);
                      state.setPlannerView("daily");
                      return;
                    }

                    await state.persistRecipesCreation();
                    router.push(
                      buildProjectAwarePath(
                        "/dashboard/carrito?flow=continue",
                        state.currentProjectId,
                      ),
                    );
                  } catch (error: any) {
                    toast.error(error?.message || "No se pudieron guardar las recetas.");
                  }
                }}
                className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-2xl shadow-emerald-200 transition-all hover:scale-[1.02] flex items-center gap-3 uppercase tracking-widest text-xs"
              >
                SIGUIENTE
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </ModuleFooter>
        }
      >
        <WorkflowContextBanner
          projectName={state.currentProjectName}
          patientName={state.selectedPatient?.fullName || null}
          mode={state.currentProjectMode}
          moduleLabel="Recetas"
        />

        <div className="space-y-6">
          <WizardTabs
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            onStepChange={goToStep}
          />

          <div className={cn("space-y-8", state.isRecipesLocked && "pointer-events-none opacity-55 select-none")}>
            {currentStep === 0 && (
              <RecipeBaseSection
                hasSourceData={state.hasSourceData}
                assignedSourceSummary={assignedSourceSummary}
                selectedPatient={state.selectedPatient}
                sourceFoods={state.sourceFoods}
                handleUnlinkPatient={state.handleUnlinkPatient}
                baseSectionRef={state.baseSectionRef}
              />
            )}

            {currentStep === 1 && (
              <RecipePatientSection
                selectedPatient={state.selectedPatient}
                setSelectedPatient={state.setSelectedPatient}
                updateSelectedPatientContext={state.updateSelectedPatientContext}
                handlePatientLoad={state.handlePatientLoad}
                parseDelimitedList={state.parseDelimitedList}
                hasSourceData={state.hasSourceData}
                setIsImportCreationModalOpen={state.setIsImportCreationModalOpen}
                currentProjectId={state.currentProjectId}
                patientSectionRef={state.patientSectionRef}
              />
            )}

            {currentStep === 2 && (
              <RecipeConfigSection
                mealCount={state.mealCount}
                handleMealCountChange={state.handleMealCountChange}
                plannerView={state.plannerView}
                setPlannerView={state.setPlannerView}
                currentProjectId={state.currentProjectId}
                isGenerating={state.isGenerating}
                canUseAiAutofill={state.canUseAiAutofill}
                handleQuickGenerateAI={state.handleQuickGenerateAI}
                fillCurrentDayWithMyRecipes={state.fillCurrentDayWithMyRecipes}
                recipeTabCounts={state.recipeTabCounts}
                wakeUpTime={state.wakeUpTime}
                setWakeUpTime={state.setWakeUpTime}
                sleepTime={state.sleepTime}
                setSleepTime={state.setSleepTime}
                proteinSupplement={state.proteinSupplement}
                setProteinSupplement={state.setProteinSupplement}
                adviseMealRepetition={state.adviseMealRepetition}
                setAdviseMealRepetition={state.setAdviseMealRepetition}
                enableSubstituteRecipes={state.enableSubstituteRecipes}
                setEnableSubstituteRecipes={state.setEnableSubstituteRecipes}
                substituteRecipesBySection={state.substituteRecipesBySection}
                removeSubstituteRecipe={state.removeSubstituteRecipe}
                hasSourceData={state.hasSourceData}
                sourceFoods={state.sourceFoods}
                structureSectionRef={state.structureSectionRef}
              />
            )}

            {currentStep === 3 && (
              <RecipeLibrarySection
                recipeSearch={state.recipeSearch}
                setRecipeSearch={state.setRecipeSearch}
                recipeTabCounts={state.recipeTabCounts}
                recipeModalTab={state.recipeModalTab}
                setRecipeModalTab={state.setRecipeModalTab}
                showMatchingOnly={state.showMatchingOnly}
                setShowMatchingOnly={state.setShowMatchingOnly}
                showOnlyMyRecipes={state.showOnlyMyRecipes}
                setShowOnlyMyRecipes={state.setShowOnlyMyRecipes}
                showOnlyAddedRecipes={state.showOnlyAddedRecipes}
                setShowOnlyAddedRecipes={state.setShowOnlyAddedRecipes}
                recipeMealSectionFilter={state.recipeMealSectionFilter}
                setRecipeMealSectionFilter={state.setRecipeMealSectionFilter}
                recipeLibraryPage={state.recipeLibraryPage}
                setRecipeLibraryPage={state.setRecipeLibraryPage}
                recipeLibraryTotalPages={state.recipeLibraryTotalPages}
                isLoadingRecipeLibrary={state.isLoadingRecipeLibrary}
                filteredRecipeLibrary={state.filteredRecipeLibrary}
                paginatedRecipeLibrary={state.paginatedRecipeLibrary}
                draggedRecipeId={state.draggedRecipeId}
                setDraggedRecipeId={state.setDraggedRecipeId}
                setDraggedSlotId={state.setDraggedSlotId}
                setDropTargetKey={state.setDropTargetKey}
                getRecipeImage={state.getRecipeImage}
                getSlotLabelFromMealSection={state.getSlotLabelFromMealSection}
                previewRecipeId={state.previewRecipeId}
                setPreviewRecipeId={state.setPreviewRecipeId}
                enableSubstituteRecipes={state.enableSubstituteRecipes}
                isRecipeMarkedAsSubstitute={state.isRecipeMarkedAsSubstitute}
                getSubstituteSectionForRecipe={state.getSubstituteSectionForRecipe}
                toggleSubstituteRecipe={state.toggleSubstituteRecipe}
                truncateText={state.truncateText}
                librarySectionRef={state.librarySectionRef}
              />
            )}

            {currentStep === 4 && (
              <RecipePlannerSection
                plannerView={state.plannerView}
                setPlannerView={state.setPlannerView}
                cycleDayCount={state.cycleDayCount}
                setCycleDayCount={state.setCycleDayCount}
                days={state.days}
                currentDay={state.currentDay}
                setCurrentDay={state.setCurrentDay}
                weekSlots={state.weekSlots}
                currentSlots={state.currentSlots}
                canUseAiAutofill={state.canUseAiAutofill}
                isGenerating={state.isGenerating}
                handleQuickGenerateAI={state.handleQuickGenerateAI}
                fillCurrentDayWithMyRecipes={state.fillCurrentDayWithMyRecipes}
                recipeTabCounts={state.recipeTabCounts}
                wakeUpTime={state.wakeUpTime}
                sleepTime={state.sleepTime}
                draggedSlotId={state.draggedSlotId}
                setDraggedSlotId={state.setDraggedSlotId}
                draggedRecipeId={state.draggedRecipeId}
                draggedRecipe={state.draggedRecipe}
                dropTargetKey={state.dropTargetKey}
                setDropTargetKey={state.setDropTargetKey}
                isRecipeMealSectionCompatible={state.isRecipeMealSectionCompatible}
                handleSlotDrop={state.handleSlotDrop}
                slotTimeDrafts={state.slotTimeDrafts}
                handleSlotTimeDraftChange={state.handleSlotTimeDraftChange}
                commitSlotTimeChange={state.commitSlotTimeChange}
                handleOpenEditMealBlockModal={state.handleOpenEditMealBlockModal}
                handleRemoveMealBlock={state.handleRemoveMealBlock}
                openQuickMealModal={state.openQuickMealModal}
                openSlotEditor={state.openSlotEditor}
                clearRecipeFromSlot={state.clearRecipeFromSlot}
                handleSlotPortionChange={state.handleSlotPortionChange}
                getRecipeImage={state.getRecipeImage}
                truncateText={state.truncateText}
                getSlotLabelFromMealSection={state.getSlotLabelFromMealSection}
                handleOpenAddBlockModal={state.handleOpenAddBlockModal}
                dayTotalsWithSupplement={state.dayTotalsWithSupplement}
                targetProtein={state.targetProtein}
                targetCalories={state.targetCalories}
                targetCarbs={state.targetCarbs}
                targetFats={state.targetFats}
                setTargetCalories={state.setTargetCalories}
                setTargetProtein={state.setTargetProtein}
                selectedPatient={state.selectedPatient}
                patientNutritionGoals={state.patientNutritionGoals}
                isEditingPatientGoals={state.isEditingPatientGoals}
                setIsEditingPatientGoals={state.setIsEditingPatientGoals}
                assignPatientGoalsFromCurrentTargets={state.assignPatientGoalsFromCurrentTargets}
                dayTotals={state.dayTotals}
                weekTotalsWithSupplement={state.weekTotalsWithSupplement}
                recommendedProteinRange={state.recommendedProteinRange}
                selectedPatientActivityLevel={state.selectedPatientActivityLevel}
                proteinSupplementPerDay={state.proteinSupplementPerDay}
                plannerSectionRef={state.plannerSectionRef}
              />
            )}

            <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Navegación por etapas
                </p>
                <p className="text-sm font-medium text-slate-600">
                  Cambia entre secciones sin perder el contexto del plan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={currentStep === 0}
                  className="h-10 rounded-xl border-slate-200 px-4 font-semibold text-slate-600 cursor-pointer"
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={currentStep === WIZARD_STEPS.length - 1}
                  className="h-10 rounded-xl bg-indigo-600 px-4 font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ModuleLayout>

      <RecipeModals
        showSwapModal={state.showSwapModal}
        setShowSwapModal={state.setShowSwapModal}
        recipeSearch={state.recipeSearch}
        setRecipeSearch={state.setRecipeSearch}
        recipeModalTab={state.recipeModalTab}
        setRecipeModalTab={state.setRecipeModalTab}
        recipeTabCounts={state.recipeTabCounts}
        showMatchingOnly={state.showMatchingOnly}
        setShowMatchingOnly={state.setShowMatchingOnly}
        sourceFoods={state.sourceFoods}
        recipeMealSectionFilter={state.recipeMealSectionFilter}
        setRecipeMealSectionFilter={state.setRecipeMealSectionFilter}
        isLoadingRecipeLibrary={state.isLoadingRecipeLibrary}
        filteredRecipeLibrary={state.filteredRecipeLibrary}
        assignRecipeToActiveSlot={state.assignRecipeToActiveSlot}
        showQuickMealModal={state.showQuickMealModal}
        setShowQuickMealModal={state.setShowQuickMealModal}
        quickMealTarget={state.quickMealTarget}
        setQuickMealTarget={state.setQuickMealTarget}
        quickMealDraft={state.quickMealDraft}
        setQuickMealDraft={state.setQuickMealDraft}
        submitQuickMeal={state.submitQuickMeal}
        showAddBlockModal={state.showAddBlockModal}
        setShowAddBlockModal={state.setShowAddBlockModal}
        editingMealBlockId={state.editingMealBlockId}
        setEditingMealBlockId={state.setEditingMealBlockId}
        availableMealSectionsForEditing={state.availableMealSectionsForEditing}
        availableMealSectionsToAdd={state.availableMealSectionsToAdd}
        handleUpdateMealBlock={state.handleUpdateMealBlock}
        handleAddMealBlock={state.handleAddMealBlock}
        isImportPatientModalOpen={state.isImportPatientModalOpen}
        setIsImportPatientModalOpen={state.setIsImportPatientModalOpen}
        patientSearchQuery={state.patientSearchQuery}
        setPatientSearchQuery={state.setPatientSearchQuery}
        isLoadingPatients={state.isLoadingPatients}
        patients={state.patients}
        handleSelectPatient={state.handleSelectPatient}
        isSaveCreationModalOpen={state.isSaveCreationModalOpen}
        setIsSaveCreationModalOpen={state.setIsSaveCreationModalOpen}
        creationDescription={state.creationDescription}
        setCreationDescription={state.setCreationDescription}
        readWorkflowDraft={state.readWorkflowDraft}
        buildRecipesModule={state.buildRecipesModule}
        selectedPatient={state.selectedPatient}
        buildPatientMeta={state.buildPatientMeta}
        persistRecipesCreation={state.persistRecipesCreation}
      />
    </>
  );
}
