"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { WorkflowContextBanner } from "@/components/shared/WorkflowContextBanner";
import { PlanWizardShell, PromptPreviewButton } from "@/components/plans";
import { MarketPrice } from "@/features/foods";

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

const WIZARD_STEPS = ["Información general", "Estrategia", "Cuantificación", "Logística", "Plan final"];

export default function DietClient({ initialFoods }: DietClientProps) {
  const state = useDietState({ initialFoods });
  const [currentStep, setCurrentStep] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));

  const buildMainPromptPayload = () => ({
    context: {
      patient: state.selectedPatient || null,
      dietName: state.dietName,
      restrictions: state.activeConstraints,
      tags: state.dietTags,
      macroTargets: state.macroTargets,
      foodGroups: state.allGroupsToRender,
    },
    instruction: "Construir la estrategia nutricional base respetando el contexto clínico del paciente y las restricciones seleccionadas.",
    expectedOutput: "JSON con estrategia, restricciones aplicadas, alimentos permitidos y recomendaciones base.",
  });

  const goBack = () => setCurrentStep((step) => Math.max(0, step - 1));
  const goNext = () => setCurrentStep((step) => Math.min(WIZARD_STEPS.length - 1, step + 1));
  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <>
      <ModuleLayout
        title="Estrategia: Dieta Base"
        description="Construye la estrategia nutricional de tu paciente paso a paso, desde el contexto clínico hasta el plan final."
        step={{
          number: currentStep + 1,
          label: WIZARD_STEPS[currentStep],
          icon: GraduationCap,
          color: "text-emerald-600",
        }}
        rightContent={
          <PromptPreviewButton
            moduleName="Principal"
            endpoint="Principal: referencia de prompt (sin envío activo)"
            buildPayload={buildMainPromptPayload}
            expectedOutput="JSON con estrategia nutricional base, restricciones, alimentos permitidos y recomendaciones."
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
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          completedSteps={Array.from({ length: currentStep }, (_, index) => index)}
          onStepClick={handleStepClick}
          onBack={goBack}
          onNext={goNext}
          isLastStep={currentStep === WIZARD_STEPS.length - 1}
          nextDisabled={false}
        >
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

          {currentStep === 1 && (
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
          )}

          {currentStep === 2 && (
            <DietMacroSection
              macroSettings={state.macroSettings}
              macroTargets={state.macroTargets}
              setMacroSettings={state.setMacroSettings}
              saveDraft={state.saveDraft}
            />
          )}

          {currentStep === 3 && (
            <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Logística</p>
                <h2 className="mt-2 text-xl font-black text-slate-900">Prepara los siguientes pasos del plan</h2>
                <p className="mt-1 text-sm text-slate-500">La dieta seleccionada alimentará el carrito, las recetas y el entregable final.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Alimentos seleccionados</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{Object.values(state.allGroupsToRender).reduce((total, foods) => total + foods.length, 0)} alimentos en {Object.keys(state.allGroupsToRender).length} grupos</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Siguiente módulo</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">Recetas y carrito de compras</p>
                </div>
              </div>
              <Button type="button" variant="outline" onClick={() => void state.continueToRecipes()} className="h-11 rounded-xl border-indigo-200 font-bold text-indigo-700">Continuar a recetas</Button>
            </section>
          )}

          {currentStep === 4 && (
            <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Plan final</p>
                <h2 className="mt-2 text-xl font-black text-slate-900">Revisa tu estrategia antes de entregar</h2>
                <p className="mt-1 text-sm text-slate-500">La pauta queda lista para exportar o continuar con recetas.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Paciente</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{state.selectedPatient?.fullName || "Sin paciente"}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Objetivo energético</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{state.macroTargets.calories} kcal</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Categorías</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{Object.keys(state.allGroupsToRender).length} grupos</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void state.performExportPdf()} className="h-11 rounded-xl bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700">Descargar PDF</Button>
                <Button type="button" variant="outline" onClick={() => state.setIsSaveCreationModalOpen(true)} className="h-11 rounded-xl border-slate-200 font-bold">Guardar</Button>
                <Button type="button" variant="outline" onClick={() => void state.continueToRecipes()} className="h-11 rounded-xl border-indigo-200 font-bold text-indigo-700">Continuar a recetas</Button>
              </div>
            </section>
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
