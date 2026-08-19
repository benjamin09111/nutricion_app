"use client";

import { useState, useMemo } from "react";
import { GraduationCap, ChevronDown, ChevronUp, Calculator, User, Filter, Download, Loader2, RotateCcw, Lock, Save, Apple } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionDockItem } from "@/components/ui/ActionDock";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleUsageBadges } from "@/components/shared/ModuleUsageBadges";
import { WorkflowContextBanner } from "@/components/shared/WorkflowContextBanner";
import { PlanWizardShell } from "@/components/plans";
import { MarketPrice } from "@/features/foods";

import { useDietState } from "@/features/diet/hooks/useDietState";
import { DietPatientSection } from "@/features/diet/components/DietPatientSection";
import { DietTemplateImportSection } from "@/features/diet/components/DietTemplateImportSection";
import { DietConstraintSection } from "@/features/diet/components/DietConstraintSection";
import { DietMacroSection } from "@/features/diet/components/DietMacroSection";
import { DietPlannerSection } from "@/features/diet/components/DietPlannerSection";
import { DietRecipesSection, DietMealBlock } from "@/features/diet/components/DietRecipesSection";
import { DietCartSection, DietCartItem } from "@/features/diet/components/DietCartSection";
import { DietFinalPlanSection } from "@/features/diet/components/DietFinalPlanSection";
import { DietModals } from "@/features/diet/components/DietModals";
import { FreemiumUpgradeModal } from "@/components/memberships/FreemiumUpgradeModal";
import { FoodReferenceBook } from "@/components/foods/FoodReferenceBook";
import { ImportCreationModal } from "@/components/shared/ImportCreationModal";
import {
  findNewlyAddedTag,
  hasTagInList,
  normalizeConstraintList,
  buildFoodInfoPreview,
} from "@/features/diet/utils/diet-helpers";
import { useRouter } from "next/navigation";
import { getTodayDateInputValue } from "@/features/patients/utils/patient-helpers";
import { toast } from "sonner";

import { DietMealsSection, DietMealTableRow } from "@/features/diet/components/DietMealsSection";

interface DietClientProps {
  initialFoods: MarketPrice[];
}

const WIZARD_STEPS = [
  "Info general",
  "Dieta",
  "Platos",
  "Comidas",
  "Carrito",
  "Plan final",
];

const QUICK_WIZARD_STEPS = ["Info general", "Dieta", "Plan final"];

export default function DietClient({ initialFoods }: DietClientProps) {
  const router = useRouter();
  const state = useDietState({ initialFoods, startEmpty: true });
  const wizardSteps = state.flowMode === "quick" ? QUICK_WIZARD_STEPS : WIZARD_STEPS;
  const finalStepIndex = wizardSteps.length - 1;
  const [currentStep, setCurrentStep] = useState(0);
  const deliveryDate = getTodayDateInputValue();
  const [showMacroCalculator, setShowMacroCalculator] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isFoodReferenceBookOpen, setIsFoodReferenceBookOpen] = useState(false);

  // Local state for Step 3 (Platos), Step 4 (Comidas) & Step 5 (Carrito)
  const [meals, setMeals] = useState<DietMealBlock[]>([]);
  const [includeMealsSection, setIncludeMealsSection] = useState(true);
  const [tableMode, setTableMode] = useState<"simple" | "options">("simple");
  const [optionCount, setOptionCount] = useState(1);
  const [dietMealsTableData, setDietMealsTableData] = useState<DietMealTableRow[]>([
    { id: "meal-1", section: "Desayuno", mealText: "", time: "08:30", portion: "1 porción" },
    { id: "meal-2", section: "Colación AM", mealText: "", time: "11:00", portion: "1 porción" },
    { id: "meal-3", section: "Almuerzo", mealText: "", time: "13:30", portion: "1 porción" },
    { id: "meal-4", section: "Colación PM", mealText: "", time: "17:00", portion: "1 porción" },
    { id: "meal-5", section: "Cena", mealText: "", time: "20:30", portion: "1 porción" },
  ]);

  const [cartItems, setCartItems] = useState<DietCartItem[]>([]);
  const [isImportRecipeModalOpen, setIsImportRecipeModalOpen] = useState(false);

  const handleImportRecipe = (creation: any) => {
    const { content } = creation;
    if (!content) {
      toast.error("Esta receta no contiene datos válidos.");
      return;
    }

    const newMeals: DietMealBlock[] = [];
    const rawDishes = content.dishes || content.recipes || content.meals || [];
    if (Array.isArray(rawDishes) && rawDishes.length > 0) {
      rawDishes.forEach((dish: any, idx: number) => {
        const ingredientsList = Array.isArray(dish.ingredients)
          ? dish.ingredients
              .map((ing: any) =>
                typeof ing === "string"
                  ? ing
                  : `${ing.amount || ""} ${ing.unit || ""} ${
                      ing.producto || ing.name || ""
                    }`,
              )
              .join(", ")
          : typeof dish.ingredients === "string"
          ? dish.ingredients
          : "";

        newMeals.push({
          id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          section:
            dish.category || dish.section || dish.mealSection || `Preparación ${idx + 1}`,
          time: dish.time || "12:00",
          name: dish.name || dish.title || creation.name,
          ingredients: ingredientsList,
          instructions: dish.instructions || dish.preparation || "",
          portion: dish.portion || dish.portionSize || "1 porción",
        });
      });
    } else {
      const ingredientsList = Array.isArray(content.ingredients)
        ? content.ingredients
            .map((ing: any) =>
              typeof ing === "string"
                ? ing
                : `${ing.amount || ""} ${ing.unit || ""} ${
                    ing.producto || ing.name || ""
                  }`,
            )
            .join(", ")
        : typeof content.ingredients === "string"
        ? content.ingredients
        : "";

      newMeals.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        section: content.section || "Plato Principal",
        time: "12:00",
        name: creation.name || "Receta Importada",
        ingredients: ingredientsList,
        instructions:
          content.instructions ||
          content.preparation ||
          content.quickDescription ||
          "",
        portion: content.portion || "1 porción",
      });
    }

    if (newMeals.length > 0) {
      setMeals((prev) => [...prev, ...newMeals]);
      toast.success(`Receta "${creation.name}" importada correctamente.`);
    } else {
      toast.info(`No se encontraron platos en la creación "${creation.name}".`);
    }
  };

  const goBack = () => setCurrentStep((step) => Math.max(0, step - 1));
  const goNext = () => setCurrentStep((step) => Math.min(finalStepIndex, step + 1));
  const handleStepClick = (step: number) => setCurrentStep(step);

  const handleResetDiet = () => {
    state.resetDiet();
    setMeals([]);
    setCartItems([]);
    setCurrentStep(0);
  };

  const totalFoodGroups = Object.keys(state.allGroupsToRender).length;
  const totalSelectedFoods = Object.values(state.allGroupsToRender).reduce(
    (total, foods) => total + foods.length,
    0,
  );

  const completedSteps = useMemo(() => {
    const fullStepCompletion = [
      Boolean(state.dietName.trim()),
      totalSelectedFoods > 0,
      meals.length > 0,
      cartItems.length > 0,
    ];
    const completion = state.flowMode === "quick"
      ? fullStepCompletion.slice(0, 2)
      : fullStepCompletion;

    return completion.reduce<number[]>((completed, isComplete, index) => {
      if (isComplete) completed.push(index);
      return completed;
    }, []);
  }, [state.dietName, totalSelectedFoods, state.dietTags.length, state.flowMode, meals.length, cartItems.length]);

  // Action Dock buttons: Reiniciar, Importar otra DIETA creada, Guardar, Descargar
  const actionItems: ActionDockItem[] = useMemo(
    () => [
      {
        id: "reset",
        icon: RotateCcw,
        label: "Reiniciar",
        description: "Reiniciar plan",
        variant: "rose",
        onClick: () => state.setIsResetConfirmOpen(true),
      },
      {
        id: "import",
        icon: Filter,
        label: "Importar dieta creada",
        description: "Cargar una dieta previamente guardada",
        variant: "indigo",
        onClick: () => state.setIsImportCreationModalOpen(true),
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
        icon: Save,
        label: "Guardar",
        description: "Guardar borrador de la pauta",
        variant: "emerald",
        onClick: () => {
          state.saveDraft();
        },
      },
      {
        id: "pdf",
        icon: Download,
        label: "Descargar",
        description: "Descargar PDF de la pauta",
        variant: "indigo",
        onClick: () => void state.performExportPdf(),
      },
    ],
    [state],
  );

  return (
    <>
      <ModuleLayout
        title={state.flowMode === "quick" ? "Entregable Rápido" : "Estrategia: Pauta Nutricional Unificada"}
        description={
          state.flowMode === "quick"
            ? "Crea una pauta rápida con la misma base nutricional, sin pasar por recetas ni carrito. Puedes ampliarla después."
            : "Diseña la pauta nutricional completa de tu paciente paso a paso: Información General, Dieta, Recetas & Porciones, Carrito de Compras y Plan Final."
        }
        step={{
          number: currentStep + 1,
          label: wizardSteps[currentStep],
          icon: GraduationCap,
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
              Preparando la dieta...
            </div>
          </div>
        ) : (
          <>
            <WorkflowContextBanner
              projectName={state.currentProjectName}
              patientName={state.selectedPatient?.fullName || null}
              mode={state.currentProjectMode}
              moduleLabel="Dieta"
            />

            <PlanWizardShell
              steps={wizardSteps}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={handleStepClick}
              onBack={goBack}
              onNext={goNext}
              isLastStep={currentStep === finalStepIndex}
              lockFutureSteps
              onReset={handleResetDiet}
              nextDisabled={
                (currentStep === 0 && !state.dietName.trim()) ||
                (currentStep === 1 && !Object.values(state.allGroupsToRender).some((foods) => foods.length > 0))
              }
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
                    deliveryDate={deliveryDate.split("-").reverse().join("-")}
                    dateIcon={<Lock className="h-3.5 w-3.5 text-slate-400" />}
                    description={state.creationDescription}
                    setDescription={state.setCreationDescription}
                    planObjective={state.planObjective}
                    setPlanObjective={state.setPlanObjective}
                    showGeneralInfo
                    showClinicalRestriction
                  />
                </div>
              )}

              {/* PASO 2: DIETA */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <DietTemplateImportSection
                    dietName={state.dietName}
                    dietTags={state.dietTags}
                    totalFoodsCount={
                      Object.values(state.allGroupsToRender).reduce(
                        (acc, foods) => acc + foods.length,
                        0,
                      )
                    }
                    totalGroupsCount={Object.keys(state.allGroupsToRender).length}
                    onImportDiet={() => state.setIsImportCreationModalOpen(true)}
                    onCreateDiet={() => {
                      state.saveDraft();
                      router.push("/dashboard/dietas");
                    }}
                  />

                  {Object.values(state.allGroupsToRender).some((foods) => foods.length > 0) && (
                    <>
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
                </>
              )}
                </div>
              )}

              {/* PASO 3: PLATOS */}
              {state.flowMode === "full" && currentStep === 2 && (
                <DietRecipesSection
                  meals={meals}
                  setMeals={setMeals}
                  patientName={state.selectedPatient?.fullName}
                  onOpenAdvancedRecipes={() => void state.continueToRecipes()}
                  onImportRecipe={() => setIsImportRecipeModalOpen(true)}
                  isGeneratingAiDishes={state.isGeneratingAiDishes}
                  onQuickGenerateAiDishes={(options, setMealsFn) =>
                    state.handleQuickGenerateAiDishes(options, setMealsFn || setMeals)
                  }
                  isAiValidationModalOpen={state.isAiValidationModalOpen}
                  setIsAiValidationModalOpen={state.setIsAiValidationModalOpen}
                  pendingAiDishes={state.pendingAiDishes}
                  onConfirmAiDishes={(dishes) => state.handleConfirmAiDishes(dishes, setMeals)}
                  patient={state.selectedPatient}
                  baseDietFoodsCount={
                    Object.values(state.allGroupsToRender).reduce(
                      (acc, foods) => acc + foods.length,
                      0,
                    )
                  }
                />
              )}

              {/* PASO 4: COMIDAS & HORARIOS */}
              {state.flowMode === "full" && currentStep === 3 && (
                <DietMealsSection
                  includeMealsSection={includeMealsSection}
                  setIncludeMealsSection={setIncludeMealsSection}
                  tableMode={tableMode}
                  setTableMode={setTableMode}
                  optionCount={optionCount}
                  setOptionCount={setOptionCount}
                  dietMealsTableData={dietMealsTableData}
                  setDietMealsTableData={setDietMealsTableData}
                  dishes={meals}
                  patientName={state.selectedPatient?.fullName}
                  onFillWithNaty={() => {
                    toast.info("Naty está organizando tus preparaciones en la tabla de comidas...");
                  }}
                />
              )}

              {/* PASO 5: CARRITO */}
              {state.flowMode === "full" && currentStep === 4 && (
                <DietCartSection
                  cartItems={cartItems}
                  setCartItems={setCartItems}
                  patientName={state.selectedPatient?.fullName}
                  onOpenAdvancedCart={() => router.push("/dashboard/carrito")}
                />
              )}

              {/* PASO 6: PLAN FINAL */}
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
              resetDiet={handleResetDiet}
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
          </>
        )}
      </ModuleLayout>

      <FreemiumUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        description="La importación de pautas y plantillas de dietas anteriores es una función exclusiva para usuarios con un plan de pago (Pro/Premium). ¡Actualiza tu plan para reutilizar tus creaciones guardadas y ahorrar tiempo en cada consulta!"
      />

      <FoodReferenceBook
        isOpen={isFoodReferenceBookOpen}
        onClose={() => setIsFoodReferenceBookOpen(false)}
      />

      <ImportCreationModal
        isOpen={isImportRecipeModalOpen}
        onClose={() => setIsImportRecipeModalOpen(false)}
        onImport={handleImportRecipe}
        defaultType="RECIPE"
        allowedTypes={["RECIPE", "RECETARIO", "FAST_DELIVERABLE"]}
        allowFreemium
      />
    </>
  );
}
