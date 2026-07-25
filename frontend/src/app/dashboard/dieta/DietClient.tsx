"use client";

import { useState, useMemo } from "react";
import { GraduationCap, ChevronDown, ChevronUp, Calculator, User, Filter, Sparkles, Download, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionDockItem } from "@/components/ui/ActionDock";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { WorkflowContextBanner } from "@/components/shared/WorkflowContextBanner";
import { PlanWizardShell, PromptPreviewButton } from "@/components/plans";
import { MarketPrice } from "@/features/foods";

import { useDietState } from "@/features/diet/hooks/useDietState";
import { DietPatientSection } from "@/features/diet/components/DietPatientSection";
import { DietConstraintSection } from "@/features/diet/components/DietConstraintSection";
import { DietMacroSection } from "@/features/diet/components/DietMacroSection";
import { DietPlannerSection } from "@/features/diet/components/DietPlannerSection";
import { DietRecipesSection, DietMealBlock } from "@/features/diet/components/DietRecipesSection";
import { DietCartSection, DietCartItem, DEFAULT_CART_ITEMS } from "@/features/diet/components/DietCartSection";
import { DietFinalPlanSection } from "@/features/diet/components/DietFinalPlanSection";
import { DietModals } from "@/features/diet/components/DietModals";
import {
  findNewlyAddedTag,
  hasTagInList,
  normalizeConstraintList,
  buildFoodInfoPreview,
} from "@/features/diet/utils/diet-helpers";
import { useRouter } from "next/navigation";

interface DietClientProps {
  initialFoods: MarketPrice[];
}

const WIZARD_STEPS = [
  "Info general",
  "Dieta",
  "Recetas y porciones",
  "Carrito",
  "Plan final",
];

const QUICK_WIZARD_STEPS = ["Info general", "Dieta", "Plan final"];

export default function DietClient({ initialFoods }: DietClientProps) {
  const router = useRouter();
  const state = useDietState({ initialFoods });
  const wizardSteps = state.flowMode === "quick" ? QUICK_WIZARD_STEPS : WIZARD_STEPS;
  const finalStepIndex = wizardSteps.length - 1;
  const [currentStep, setCurrentStep] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [showMacroCalculator, setShowMacroCalculator] = useState(false);

  // Local state for Step 3 (Recetas y porciones) & Step 4 (Carrito)
  const [meals, setMeals] = useState<DietMealBlock[]>([]);
  const [cartItems, setCartItems] = useState<DietCartItem[]>(() => DEFAULT_CART_ITEMS);

  const buildMainPromptPayload = () => ({
    context: {
      patient: state.selectedPatient || null,
      dietName: state.dietName,
      restrictions: state.activeConstraints,
      tags: state.dietTags,
      macroTargets: state.macroTargets,
      foodGroups: state.allGroupsToRender,
      mealsCount: meals.length,
      cartItemsCount: cartItems.length,
    },
    instruction:
      "Construir la estrategia nutricional unificada respetando el contexto clínico del paciente, las recetas y el carrito de compras.",
    expectedOutput:
      "JSON con pauta consolidada, restricciones aplicadas, recetas por horario y lista de víveres del carrito.",
  });

  const goBack = () => setCurrentStep((step) => Math.max(0, step - 1));
  const goNext = () =>
    setCurrentStep((step) => Math.min(finalStepIndex, step + 1));
  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  // Helper counts
  const totalFoodGroups = Object.keys(state.allGroupsToRender).length;
  const totalSelectedFoods = Object.values(state.allGroupsToRender).reduce(
    (total, foods) => total + foods.length,
    0,
  );

  const actionItems: ActionDockItem[] = useMemo(
    () => [
      {
        id: "patient",
        icon: state.isLoadingPatients ? Loader2 : User,
        label: state.isLoadingPatients
          ? "Cargando..."
          : state.selectedPatient?.fullName?.trim()
            ? state.selectedPatient.fullName
            : "Importar paciente",
        description: state.selectedPatient?.fullName?.trim() ? "Cambiar paciente" : "Importar paciente",
        variant: state.selectedPatient?.fullName?.trim() ? "emerald" : "slate",
        disabled: state.isLoadingPatients,
        onClick: () => state.setIsImportPatientModalOpen(true),
      },
      {
        id: "import",
        icon: Filter,
        label: "Importar pauta",
        variant: "indigo",
        onClick: () => state.setIsImportCreationModalOpen(true),
      },
      {
        id: "ai-nutri",
        icon: Sparkles,
        label: "IA Nutri",
        variant: "emerald",
        onClick: () => state.setIsSmartModalOpen(true),
      },
      {
        id: "pdf",
        icon: Download,
        label: "Descargar PDF",
        description: "Descargar PDF de la pauta",
        variant: "indigo",
        onClick: () => void state.performExportPdf(),
      },
      {
        id: "reset",
        icon: RotateCcw,
        label: "Reiniciar",
        description: "Reiniciar plan",
        variant: "rose",
        onClick: () => state.setIsResetConfirmOpen(true),
      },
    ],
    [state],
  );

  return (
    <>
      <ModuleLayout
         title={state.flowMode === "quick" ? "Entregable Rápido" : "Estrategia: Pauta Nutricional Unificada"}
         description={state.flowMode === "quick"
           ? "Crea una pauta rápida con la misma base nutricional, sin pasar por recetas ni carrito. Puedes ampliarla después."
           : "Diseña la pauta nutricional completa de tu paciente paso a paso: Información General, Dieta, Recetas & Porciones, Carrito de Compras y Plan Final."}
        step={{
          number: currentStep + 1,
           label: wizardSteps[currentStep],
          icon: GraduationCap,
          color: "text-emerald-600",
        }}
        rightNavItems={actionItems}
        rightContent={
          <PromptPreviewButton
            moduleName="Principal"
            endpoint="Principal: referencia de prompt (sin envío activo)"
            buildPayload={buildMainPromptPayload}
            expectedOutput="JSON con estrategia nutricional base, restricciones, recetas, carrito y plan final."
          />
        }
      >
        <WorkflowContextBanner
          projectName={state.currentProjectName}
          patientName={state.selectedPatient?.fullName || null}
          mode={state.currentProjectMode}
          moduleLabel="Dieta"
        />

        <PlanWizardShell
           steps={wizardSteps}
          currentStep={currentStep}
          completedSteps={Array.from({ length: currentStep }, (_, index) => index)}
          onStepClick={handleStepClick}
          onBack={goBack}
          onNext={goNext}
           isLastStep={currentStep === finalStepIndex}
          nextDisabled={false}
        >
          {/* PASO 1: INFO GENERAL */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <DietPatientSection
                selectedPatient={state.selectedPatient}
                handleUnlinkPatient={state.handleUnlinkPatient}
                onImportPatient={() => state.setIsImportPatientModalOpen(true)}
                isLoadingPatients={state.isLoadingPatients}
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
                deliveryDate={deliveryDate}
                setDeliveryDate={setDeliveryDate}
                description={state.creationDescription}
                setDescription={state.setCreationDescription}
                showGeneralInfo
                showClinicalRestriction
              />
            </div>
          )}

          {/* PASO 2: DIETA */}
          {currentStep === 1 && (
            <div className="space-y-6">
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
              />

              {/* Collapsible Macro Target Calculator */}
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div
                  onClick={() => setShowMacroCalculator(!showMacroCalculator)}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Calculator className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Calculadora de Metas Calóricas y Macronutrientes</h3>
                      <p className="text-xs text-slate-500">Configura el GET, déficit calórico y distribución de macros (opcional)</p>
                    </div>
                  </div>

                  <Button type="button" variant="ghost" className="h-8 w-8 rounded-xl p-0 text-slate-500">
                    {showMacroCalculator ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </Button>
                </div>

                {showMacroCalculator && (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <DietMacroSection
                      macroSettings={state.macroSettings}
                      macroTargets={state.macroTargets}
                      setMacroSettings={state.setMacroSettings}
                      saveDraft={state.saveDraft}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 3: RECETAS Y PORCIONES */}
          {state.flowMode === "full" && currentStep === 2 && (
            <DietRecipesSection
              meals={meals}
              setMeals={setMeals}
              patientName={state.selectedPatient?.fullName}
              onOpenAdvancedRecipes={() => void state.continueToRecipes()}
            />
          )}

          {/* PASO 4: CARRITO */}
          {state.flowMode === "full" && currentStep === 3 && (
            <DietCartSection
              cartItems={cartItems}
              setCartItems={setCartItems}
              patientName={state.selectedPatient?.fullName}
              onOpenAdvancedCart={() => router.push("/dashboard/carrito")}
            />
          )}

          {/* PASO 5: PLAN FINAL */}
          {currentStep === finalStepIndex && (
            <DietFinalPlanSection
              patientName={state.selectedPatient?.fullName}
              patientAge={typeof state.selectedPatient?.age === "number" ? state.selectedPatient.age : null}
              patientGender={state.selectedPatient?.gender}
              patientFocus={state.selectedPatient?.nutritionalFocus}
              dietName={state.dietName}
              totalFoodGroups={totalFoodGroups}
              totalSelectedFoods={totalSelectedFoods}
              totalMeals={meals.length}
              totalCartItems={cartItems.length}
              calorieTarget={state.macroTargets.calories}
              onExportPdf={() => void state.performExportPdf()}
              onSaveCreation={() => state.setIsSaveCreationModalOpen(true)}
              onContinueToDeliverable={() => void state.continueToRecipes()}
            />
          )}
        </PlanWizardShell>

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
