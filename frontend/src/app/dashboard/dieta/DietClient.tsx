"use client";

import { useMemo } from "react";
import {
  GraduationCap,
  ArrowRight,
  Brain,
  Library,
  User,
  AlertCircle,
  Download,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionDockItem } from "@/components/ui/ActionDock";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleFooter } from "@/components/shared/ModuleFooter";
import { WorkflowContextBanner } from "@/components/shared/WorkflowContextBanner";
import { MarketPrice } from "@/features/foods";
import { toast } from "sonner";

import { useDietState } from "@/features/diet/hooks/useDietState";
import { DietPatientSection } from "@/features/diet/components/DietPatientSection";
import { DietConstraintSection } from "@/features/diet/components/DietConstraintSection";
import { DietMacroSection } from "@/features/diet/components/DietMacroSection";
import { DietPlannerSection } from "@/features/diet/components/DietPlannerSection";
import { DietModals } from "@/features/diet/components/DietModals";
import {
  findNewlyAddedTag,
  hasTagInList,
  normalizeConstraintList,
  buildFoodInfoPreview,
} from "@/features/diet/utils/diet-helpers";

interface DietClientProps {
  initialFoods: MarketPrice[];
}

export default function DietClient({ initialFoods }: DietClientProps) {
  const state = useDietState({ initialFoods });

  const actionDockItems: ActionDockItem[] = useMemo(
    () => [
      {
        id: "import-creation",
        icon: Library,
        label: "Importar Creación",
        variant: "indigo",
        onClick: () => {
          state.setIsImportCreationModalOpen(true);
        },
      },
      {
        id: "link-patient",
        icon: User,
        label: state.selectedPatient ? "Cambiar Paciente" : "Importar Paciente",
        variant: "emerald",
        onClick: () => {
          state.setIsImportPatientModalOpen(true);
          state.setPatientsError(null);
        },
      },
      {
        id: "sep-1",
        icon: Library,
        label: "",
        onClick: () => {},
        isSeparator: true,
      },
      {
        id: "verify-foods",
        icon: AlertCircle,
        label: "Validar Restricciones (Próximamente)",
        variant: "slate",
        onClick: state.handleVerifyRestrictions,
        disabled: true,
      },
      {
        id: "export-pdf",
        icon: Download,
        label: state.isExportingPdf ? "Generando PDF..." : "Exportar PDF",
        variant: "slate",
        onClick: state.handleExportPdf,
      },
      {
        id: "reset",
        icon: RotateCcw,
        label: "Reiniciar Todo",
        variant: "rose",
        onClick: () => state.setIsResetConfirmOpen(true),
      },
      {
        id: "sep-2",
        icon: Library,
        label: "",
        onClick: () => {},
        isSeparator: true,
      },
      {
        id: "continue",
        icon: ArrowRight,
        label: "CONTINUAR",
        variant: "emerald",
        onClick: () => {
          if (state.draftFoodsPendingCompletion.length > 0) {
            state.setIsContinueDraftWarningOpen(true);
          } else {
            void state.continueToRecipes();
          }
        },
      },
    ],
    [state],
  );

  return (
    <>
      <ModuleLayout
        title="Estrategia: Dieta Base"
        description={
          <div className="space-y-4">
            <p>
              Define la estrategia nutricional de tu paciente. Selecciona restricciones, alimentos permitidos y establece la base para las porciones y el carrito.
            </p>
            <div className="flex flex-wrap gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <span className="text-emerald-600 underline underline-offset-4 decoration-2">1. Estrategia</span>
              <span>2. Cuantificación</span>
              <span>3. Logística</span>
              <span>4. Producto Final</span>
            </div>
          </div>
        }
        step={{
          number: 1,
          label: "Estrategia & Base",
          icon: GraduationCap,
          color: "text-emerald-600",
        }}
        rightNavItems={actionDockItems}
        footer={
          <ModuleFooter>
            <Button
              variant="outline"
              className="h-12 border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-black gap-2 transition-all active:scale-95 group"
              onClick={state.openSmartModal}
            >
              <div className="bg-indigo-100 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                <Brain className="h-5 w-5" />
              </div>
              Añadir alimentos inteligente
            </Button>

            <div className="flex gap-3">
              <Button
                className="h-12 px-8 bg-slate-900"
                onClick={() => {
                  if (!state.dietName.trim()) {
                    toast.error("Por favor, asigna un nombre a la dieta.");
                    return;
                  }
                  state.setIsSaveCreationModalOpen(true);
                }}
              >
                Guardar Creación
              </Button>
              <Button
                className="h-12 px-8 bg-emerald-600"
                onClick={state.handleContinue}
              >
                SIGUIENTE <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </ModuleFooter>
        }
      >
        <WorkflowContextBanner
          projectName={state.currentProjectName}
          patientName={state.selectedPatient?.fullName || null}
          mode={state.currentProjectMode}
          moduleLabel="Dieta"
        />

        <DietPatientSection
          selectedPatient={state.selectedPatient}
          handleUnlinkPatient={state.handleUnlinkPatient}
        />

        <DietConstraintSection
          dietName={state.dietName}
          setDietName={state.setDietName}
          dietTags={state.dietTags}
          setDietTags={state.setDietTags}
          activeConstraints={state.activeConstraints}
          setActiveConstraints={state.setActiveConstraints}
          availableClassificationTags={state.availableClassificationTags}
          availableConstraintTags={state.availableConstraintTags}
          selectedDefaultConstraintIds={state.selectedDefaultConstraintIds}
          toggleConstraint={state.toggleConstraint}
          findNewlyAddedTag={findNewlyAddedTag}
          hasTagInList={hasTagInList}
          normalizeConstraintList={normalizeConstraintList}
          setPendingTagCreation={state.setPendingTagCreation}
          saveDraft={state.saveDraft}
        />

        <DietMacroSection
          macroSettings={state.macroSettings}
          macroTargets={state.macroTargets}
          setMacroSettings={state.setMacroSettings}
          saveDraft={state.saveDraft}
        />

        <DietPlannerSection
          allGroupsToRender={state.allGroupsToRender}
          isApplyingPreferences={state.isApplyingPreferences}
          applyNutritionistPreferences={state.applyNutritionistPreferences}
          openAddModal={state.openAddModal}
          setGroupToDelete={state.setGroupToDelete}
          setIsDeleteGroupConfirmOpen={state.setIsDeleteGroupConfirmOpen}
          openDraftFoodEditor={state.openDraftFoodEditor}
          setSelectedFoodForInfo={state.setSelectedFoodForInfo}
          setIsFoodInfoModalOpen={state.setIsFoodInfoModalOpen}
          removeFood={state.removeFood}
          setIsAddGroupModalOpen={state.setIsAddGroupModalOpen}
        />

        <DietModals
          isResetConfirmOpen={state.isResetConfirmOpen}
          setIsResetConfirmOpen={state.setIsResetConfirmOpen}
          resetDiet={state.resetDiet}
          isExportConfirmOpen={state.isExportConfirmOpen}
          setIsExportConfirmOpen={state.setIsExportConfirmOpen}
          performExportPdf={state.performExportPdf}
          isContinueDraftWarningOpen={state.isContinueDraftWarningOpen}
          setIsContinueDraftWarningOpen={state.setIsContinueDraftWarningOpen}
          continueToRecipes={state.continueToRecipes}
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
          handleImportCreation={state.handleImportCreation}
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
      </ModuleLayout>
    </>
  );
}
