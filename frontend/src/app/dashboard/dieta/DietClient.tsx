"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Calculator, User, Filter, Loader2, RotateCcw, Lock, Apple, MessageCircleHeart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { ActionDockItem } from "@/components/ui/ActionDock";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { ModuleUsageBadges } from "@/components/shared/ModuleUsageBadges";
import { WorkflowContextBanner } from "@/components/shared/WorkflowContextBanner";
import { NatyLoadingOverlay, PlanWizardShell } from "@/components/plans";
import { NatyPlanChatDemo } from "@/components/plans/NatyPlanChatDemo";
import { MarketPrice } from "@/features/foods";

import { useDietState } from "@/features/diet/hooks/useDietState";
import { DietPatientSection } from "@/features/diet/components/DietPatientSection";
import { DietConstraintSection } from "@/features/diet/components/DietConstraintSection";
import { DietMacroSection } from "@/features/diet/components/DietMacroSection";
import { DietPlannerSection } from "@/features/diet/components/DietPlannerSection";
import { DietRecipesSection, DietMealBlock } from "@/features/diet/components/DietRecipesSection";
import { DietCartSection } from "@/features/diet/components/DietCartSection";
import { DietResourcesSection } from "@/features/diet/components/DietResourcesSection";
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
import { getTodayDateInputValue } from "@/features/patients/utils/patient-helpers";
import { toast } from "sonner";
import { isGuestMode } from "@/lib/demo-local-api";

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
  "Recursos",
  "Plan final",
];

const QUICK_WIZARD_STEPS = ["Info general", "Dieta", "Plan final"];

export default function DietClient({ initialFoods }: DietClientProps) {
  const state = useDietState({ initialFoods, startEmpty: false });
  const wizardSteps = state.flowMode === "quick" ? QUICK_WIZARD_STEPS : WIZARD_STEPS;
  const finalStepIndex = wizardSteps.length - 1;
  const currentStep = state.currentStep;
  const setCurrentStep = state.setCurrentStep;
  const deliveryDate = getTodayDateInputValue();
  const [showMacroCalculator, setShowMacroCalculator] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isFoodReferenceBookOpen, setIsFoodReferenceBookOpen] = useState(false);
  const [useDefaultDiet, setUseDefaultDiet] = useState(true);
  const [isNatyChatOpen, setIsNatyChatOpen] = useState(false);

  const [isImportRecipeModalOpen, setIsImportRecipeModalOpen] = useState(false);

  const handleImportRecipe = (creation: any) => {
    const { content } = creation;
    if (!content) {
      toast.error("Esta receta no contiene datos válidos.");
      return;
    }

    const newMeals: DietMealBlock[] = [];
    const canonicalMeals = content.planContext?.plan?.meals;
    const rawDishes =
      content.dishes ||
      content.recipes ||
      content.meals ||
      (Array.isArray(canonicalMeals)
        ? canonicalMeals.map((meal: any) => ({
            ...meal,
            name: meal.mealText || meal.section,
            title: meal.mealText || meal.section,
          }))
        : []);
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
      state.setMeals((prev) => [...prev, ...newMeals]);
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
      state.meals.length > 0,
      state.dietMealsTableData.length > 0 || state.meals.length > 0,
      state.autoCartItems.length > 0 || currentStep > 4,
      state.selectedResourceIds.length > 0 || currentStep > 5,
      currentStep === finalStepIndex,
    ];
    const completion = state.flowMode === "quick"
      ? fullStepCompletion.slice(0, 2)
      : fullStepCompletion;

    return completion.reduce<number[]>((completed, isComplete, index) => {
      if (index < currentStep && isComplete) completed.push(index);
      return completed;
    }, []);
  }, [
    state.dietName,
    totalSelectedFoods,
    state.meals.length,
    state.dietMealsTableData.length,
    state.autoCartItems.length,
    state.selectedResourceIds.length,
    currentStep,
    finalStepIndex,
    state.flowMode,
  ]);

  // Action Dock buttons: Reiniciar, Importar otra DIETA creada, Guardar, Descargar
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
        description: "Reiniciar plan",
        variant: "rose",
        onClick: () => state.setIsResetConfirmOpen(true),
      },
    ],
    [state, setIsFoodReferenceBookOpen],
  );

  return (
    <>
      <NatyPlanChatDemo isOpen={isNatyChatOpen} onClose={() => setIsNatyChatOpen(false)} />
      {state.isGeneratingAiDishes && (
        <NatyLoadingOverlay
          title="Naty está diseñando el plan..."
          subtitle="Terminando los últimos detalles..."
          steps={[
            "Revisando la dieta base y el contexto clínico...",
            "Organizando platos y porciones...",
            "Auditando restricciones y combinaciones...",
            "Listo para revisar",
          ]}
          isDemo={isGuestMode()}
        />
      )}
      <ModuleLayout
        title={state.flowMode === "quick" ? "Rápido" : "Pauta Nutricional Personalizada"}
        description={
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#668E20] -mt-0.5 mb-0.5">
              <Apple className="w-4 h-4 text-[#86A83C]" />
              <span className="tracking-wider uppercase text-[10px] font-bold">Planificación Personalizada</span>
            </div>
            <p className="text-sm sm:text-[15px] text-[#626573] leading-relaxed">
              {state.flowMode === "quick"
                ? "Crea una pauta rápida con la misma base nutricional, sin pasar por recetas ni carrito. Puedes ampliarla después."
                : "Diseña la pauta nutricional completa de tu paciente paso a paso: Información General, Dieta, Recetas & Porciones, Carrito de Compras y Plan Final."}
            </p>
          </div>
        }
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
              patient={state.selectedPatient}
              mode={state.currentProjectMode}
              moduleLabel="Dieta"
              activeConstraints={state.activeConstraints}
              patientRestrictions={state.selectedPatient?.dietRestrictions || state.selectedPatient?.tags || []}
            />

            {!state.selectedPatient ? (
              <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/60 p-8 text-center">
                <User className="mx-auto h-10 w-10 text-purple-500" />
                <h2 className="mt-3 text-base font-bold text-purple-900">Importa un paciente para comenzar</h2>
                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-purple-700">
                  Personalizado necesita el contexto del paciente para construir una dieta clínica segura y específica.
                </p>
                <Button type="button" onClick={() => state.setIsImportPatientModalOpen(true)} className="mt-5 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white hover:bg-indigo-700">
                  <User className="mr-2 h-4 w-4" />
                  Importar paciente
                </Button>
              </div>
            ) : (
            <PlanWizardShell
              steps={wizardSteps}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={handleStepClick}
              onBack={goBack}
              onNext={goNext}
              isLastStep={currentStep === finalStepIndex}
              lockFutureSteps
              hideNextOnLastStep
              onReset={handleResetDiet}
              nextDisabled={
                (currentStep === 0 && !state.dietName.trim()) ||
                (currentStep === 0 && !state.selectedPatient) ||
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

                  {/* Introducción y Despedida del PDF */}
                  <div className="space-y-5 rounded-2xl border border-[#E9E5E7] bg-white p-5 sm:p-6 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                        <MessageCircleHeart className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Introducción y despedida</h3>
                        <p className="text-xs text-slate-500">
                          Se generan automáticamente con el nombre de {state.selectedPatient?.fullName || "tu paciente"}; puedes editarlas libremente.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Introducción</label>
                        <label className="flex items-center gap-2 rounded-xl border border-[#DDE7B8] bg-[#F0F5DF] px-3 py-1 text-[11px] font-bold text-[#668E20] cursor-pointer hover:bg-[#E8EFCB] transition-colors">
                          <input
                            type="checkbox"
                            checked={state.includeIntroInPdf}
                            onChange={(e) => state.setIncludeIntroInPdf(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-[#86A83C] text-[#86A83C] focus:ring-[#86A83C] cursor-pointer"
                          />
                          Incluir en el PDF
                        </label>
                      </div>
                      <Textarea
                        value={state.introMessage}
                        onChange={(e) => state.updateIntroMessage(e.target.value)}
                        placeholder="Mensaje de bienvenida para el paciente..."
                        className="min-h-[90px] rounded-xl border-[#E9E5E7] text-xs font-normal text-[#20212B]"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Despedida</label>
                        <label className="flex items-center gap-2 rounded-xl border border-[#DDE7B8] bg-[#F0F5DF] px-3 py-1 text-[11px] font-bold text-[#668E20] cursor-pointer hover:bg-[#E8EFCB] transition-colors">
                          <input
                            type="checkbox"
                            checked={state.includeClosingInPdf}
                            onChange={(e) => state.setIncludeClosingInPdf(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-[#86A83C] text-[#86A83C] focus:ring-[#86A83C] cursor-pointer"
                          />
                          Incluir en el PDF
                        </label>
                      </div>
                      <Textarea
                        value={state.closingMessage}
                        onChange={(e) => state.updateClosingMessage(e.target.value)}
                        placeholder="Mensaje de cierre / despedida para el paciente..."
                        className="min-h-[90px] rounded-xl border-[#E9E5E7] text-xs font-normal text-[#20212B]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2: DIETA */}
              {currentStep === 1 && (
                <div className="space-y-6">
                   <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 shadow-2xs">
                     <input
                       type="checkbox"
                       checked={useDefaultDiet}
                       onChange={(event) => {
                         const nextValue = event.target.checked;
                         setUseDefaultDiet(nextValue);
                         if (nextValue) state.applyBaseFoods();
                         else state.startFromZero();
                       }}
                       className="h-4 w-4 rounded border-slate-300 text-[#86A83C] focus:ring-[#86A83C]"
                     />
                     <span>
                       <span className="block">Aplicar dieta por defecto</span>
                       <span className="mt-0.5 block text-[11px] font-medium text-slate-500">Usa la misma plantilla base de categorías y alimentos de Dietas.</span>
                     </span>
                   </label>
                   <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                     <div>
                       <h2 className="text-base font-bold text-slate-900">Dieta base</h2>
                       <p className="mt-1 text-xs text-slate-500">Usa la plantilla base o importa una dieta guardada para comenzar.</p>
                     </div>
                     {state.editingCreationId ? (
                       <div className="flex items-center gap-2">
                         <Button type="button" variant="outline" onClick={() => state.setIsImportCreationModalOpen(true)} className="h-10 rounded-xl border-indigo-200 bg-indigo-50 px-4 text-xs font-bold text-indigo-700 hover:bg-indigo-100">
                           Cambiar dieta
                         </Button>
                         <Button type="button" variant="outline" onClick={state.removeImportedDiet} className="h-10 rounded-xl border-rose-200 bg-rose-50 px-4 text-xs font-bold text-rose-700 hover:bg-rose-100">
                           Quitar dieta
                         </Button>
                       </div>
                     ) : (
                       <Button type="button" onClick={() => state.setIsImportCreationModalOpen(true)} className="h-10 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700">
                         Importar dieta
                       </Button>
                     )}
                   </div>

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
                  <div className="overflow-hidden rounded-2xl border border-[#E9E5E7] bg-white p-5 sm:p-6 shadow-2xs">
                    <div
                      onClick={() => setShowMacroCalculator(!showMacroCalculator)}
                      className="flex cursor-pointer items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F5DF] text-[#668E20]">
                          <Calculator className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Calculadora de Metas Calóricas y Macronutrientes</h3>
                          <p className="text-xs text-slate-500">Configura el GET, déficit calórico y distribución de macros (opcional)</p>
                        </div>
                      </div>

                      <Button type="button" variant="ghost" className="h-8 w-8 rounded-xl p-0 text-slate-500 cursor-pointer">
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
                  meals={state.meals}
                  setMeals={state.setMeals}
                  patientName={state.selectedPatient?.fullName}
                  onOpenAdvancedRecipes={() => void state.continueToRecipes()}
                  onImportRecipe={() => setIsImportRecipeModalOpen(true)}
                  isGeneratingAiDishes={state.isGeneratingAiDishes}
                  onQuickGenerateAiDishes={(options, setMealsFn) =>
                    state.handleQuickGenerateAiDishes(options, setMealsFn || state.setMeals)
                  }
                  isAiValidationModalOpen={state.isAiValidationModalOpen}
                  setIsAiValidationModalOpen={state.setIsAiValidationModalOpen}
                  pendingAiDishes={state.pendingAiDishes}
                  onConfirmAiDishes={(dishes) => state.handleConfirmAiDishes(dishes, state.setMeals)}
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
                  includeMealsSection={state.includeMealsSection}
                  setIncludeMealsSection={state.setIncludeMealsSection}
                  dietMealsTableData={state.dietMealsTableData}
                  setDietMealsTableData={state.setDietMealsTableData}
                  dishes={state.meals}
                  patientName={state.selectedPatient?.fullName}
                  includeExchangeGuideInPdf={state.includeExchangeGuideInPdf}
                  setIncludeExchangeGuideInPdf={state.setIncludeExchangeGuideInPdf}
                  avoidFoods={state.avoidFoods}
                  addAvoidFood={state.addAvoidFood}
                  removeAvoidFood={state.removeAvoidFood}
                  includeAvoidFoodsInPdf={state.includeAvoidFoodsInPdf}
                  setIncludeAvoidFoodsInPdf={state.setIncludeAvoidFoodsInPdf}
                />
              )}

              {/* PASO 5: CARRITO */}
              {state.flowMode === "full" && currentStep === 4 && (
                <DietCartSection
                  autoCartItems={state.autoCartItems}
                  includeCartSection={state.includeCartSection}
                  setIncludeCartSection={state.setIncludeCartSection}
                  patientName={state.selectedPatient?.fullName}
                  setCartItemOverride={state.setCartItemOverride}
                  removeCartItem={state.removeCartItem}
                />
              )}

              {/* PASO 6: RECURSOS */}
              {state.flowMode === "full" && currentStep === 5 && (
                <DietResourcesSection
                  selectedResourceIds={state.selectedResourceIds}
                  setSelectedResourceIds={state.setSelectedResourceIds}
                  includeResourcesSection={state.includeResourcesSection}
                  setIncludeResourcesSection={state.setIncludeResourcesSection}
                  patientName={state.selectedPatient?.fullName}
                  activeConstraints={state.activeConstraints}
                  patientRestrictions={
                    state.selectedPatient?.dietRestrictions ||
                    state.selectedPatient?.tags ||
                    []
                  }
                />
              )}

              {/* PASO 7: PLAN FINAL */}
              {currentStep === finalStepIndex && (
                <DietFinalPlanSection
                  patientName={state.selectedPatient?.fullName}
                  patientAge={typeof state.selectedPatient?.age === "number" ? state.selectedPatient.age : null}
                  patientGender={state.selectedPatient?.gender}
                  patientFocus={state.selectedPatient?.nutritionalFocus}
                  dietName={state.dietName}
                  totalFoodGroups={totalFoodGroups}
                  totalSelectedFoods={totalSelectedFoods}
                  totalMeals={state.meals.length}
                  totalCartItems={state.includeCartSection ? state.autoCartItems.length : 0}
                  totalResources={state.includeResourcesSection ? state.selectedResourceIds.length : 0}
                  totalAvoidFoods={state.avoidFoods.length}
                  calorieTarget={state.macroTargets.calories}
                  onExportPdf={() => void state.performExportPdf()}
                  onSaveCreation={() => state.setIsSaveCreationModalOpen(true)}
                  includeFoodTableSection={state.includeFoodTableSection}
                  setIncludeFoodTableSection={state.setIncludeFoodTableSection}
                  includeMealsSection={state.includeMealsSection}
                  setIncludeMealsSection={state.setIncludeMealsSection}
                  includeCartSection={state.includeCartSection}
                  setIncludeCartSection={state.setIncludeCartSection}
                  includeResourcesSection={state.includeResourcesSection}
                  setIncludeResourcesSection={state.setIncludeResourcesSection}
                  includeAvoidFoodsInPdf={state.includeAvoidFoodsInPdf}
                  setIncludeAvoidFoodsInPdf={state.setIncludeAvoidFoodsInPdf}
                  includeIntroInPdf={state.includeIntroInPdf}
                  setIncludeIntroInPdf={state.setIncludeIntroInPdf}
                  includeClosingInPdf={state.includeClosingInPdf}
                  setIncludeClosingInPdf={state.setIncludeClosingInPdf}
                />
              )}
            </PlanWizardShell>
            )}

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
        isOpen={isUpgradeModalOpen || state.isUpgradeModalOpen}
        onClose={() => {
          setIsUpgradeModalOpen(false);
          state.setIsUpgradeModalOpen(false);
        }}
        description="Has alcanzado el límite de operaciones o generaciones con Naty IA de tu plan actual. ¡Actualiza a un plan Pro o Premium para disfrutar de acceso ilimitado y agilizar tus consultas!"
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
