"use client";

import React, { useState, useEffect } from "react";
import {
  loadPatientDemoState,
  savePatientDemoState,
  INITIAL_FILES,
  INITIAL_RESOURCES,
} from "@/features/patient-portal-demo/mock-patient-data";
import {
  PatientProfileState,
  PatientMeal,
  PatientDiaryEntry,
  PatientQnAItem,
  PatientNotification,
  PatientConsumedFood,
} from "@/features/patient-portal-demo/types";
import { PatientHeader } from "@/features/patient-portal-demo/components/PatientHeader";
import {
  PatientMobileNavDrawer,
  PatientNavTabId,
} from "@/features/patient-portal-demo/components/PatientMobileNavDrawer";
import { NatyWelcomeBanner } from "@/features/patient-portal-demo/components/NatyWelcomeBanner";
import { PatientSummaryTab } from "@/features/patient-portal-demo/components/PatientSummaryTab";
import { PatientGoalsTab } from "@/features/patient-portal-demo/components/PatientGoalsTab";
import { PatientMealsTab } from "@/features/patient-portal-demo/components/PatientMealsTab";
import { PatientDiaryTab } from "@/features/patient-portal-demo/components/PatientDiaryTab";
import { PatientFilesTab } from "@/features/patient-portal-demo/components/PatientFilesTab";
import { PatientQnATab } from "@/features/patient-portal-demo/components/PatientQnATab";
import { PatientResourcesTab } from "@/features/patient-portal-demo/components/PatientResourcesTab";
import { PatientInstagramFooter } from "@/features/patient-portal-demo/components/PatientInstagramFooter";
import { PatientLevelModal } from "@/features/patient-portal-demo/components/PatientLevelModal";
import { PatientNotificationsModal } from "@/features/patient-portal-demo/components/PatientNotificationsModal";
import { PatientConsumedFoodsModal } from "@/features/patient-portal-demo/components/PatientConsumedFoodsModal";
import { NutriAdviceModal } from "@/features/patient-portal-demo/components/NutriAdviceModal";
import { NatyPatientChatFloating } from "@/features/patient-portal-demo/components/NatyPatientChatFloating";

export function PatientDashboardClient() {
  const [profile, setProfile] = useState<PatientProfileState | null>(null);
  const [meals, setMeals] = useState<PatientMeal[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<PatientDiaryEntry[]>([]);
  const [qnaItems, setQnaItems] = useState<PatientQnAItem[]>([]);
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const [consumedFoods, setConsumedFoods] = useState<PatientConsumedFood[]>([]);
  const [activeTab, setActiveTab] = useState<PatientNavTabId>("resumen");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isConsumedFoodsOpen, setIsConsumedFoodsOpen] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isNatyChatOpen, setIsNatyChatOpen] = useState(false);
  const [isNutriAdviceOpen, setIsNutriAdviceOpen] = useState(false);

  // Load state from localStorage / defaults on mount
  useEffect(() => {
    const data = loadPatientDemoState();
    setProfile(data.profile);
    setMeals(data.meals);
    setDiaryEntries(data.diary);
    setQnaItems(data.qna);
    setNotifications(data.notifications);
    if (data.consumedFoods) {
      setConsumedFoods(data.consumedFoods);
    }
  }, []);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#86A83C] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Cargando portal del paciente...</span>
        </div>
      </div>
    );
  }

  // Next meal to be consumed
  const nextMeal = meals.find((m) => !m.isConsumed);

  // Toggle meal consumption
  const handleToggleMeal = (mealId: string) => {
    const updatedMeals = meals.map((m) => {
      if (m.id === mealId) {
        return { ...m, isConsumed: !m.isConsumed };
      }
      return m;
    });

    const isNowConsumed = updatedMeals.find((m) => m.id === mealId)?.isConsumed;
    const starDelta = isNowConsumed ? 10 : -10;

    const updatedProfile = {
      ...profile,
      totalStars: Math.max(0, profile.totalStars + starDelta),
    };

    setMeals(updatedMeals);
    setProfile(updatedProfile);
    savePatientDemoState({ meals: updatedMeals, profile: updatedProfile });
  };

  // Add water intake
  const handleAddWater = (amountMl: number) => {
    const updatedProfile = {
      ...profile,
      waterIntakeMl: profile.waterIntakeMl + amountMl,
      totalStars: profile.totalStars + 5,
    };
    setProfile(updatedProfile);
    savePatientDemoState({ profile: updatedProfile });
  };

  // Add diary entry
  const handleAddDiaryEntry = (newEntry: Omit<PatientDiaryEntry, "id">) => {
    const entry: PatientDiaryEntry = {
      ...newEntry,
      id: `diary-${Date.now()}`,
    };
    const updatedEntries = [entry, ...diaryEntries];
    const updatedProfile = {
      ...profile,
      totalStars: profile.totalStars + 15,
    };
    setDiaryEntries(updatedEntries);
    setProfile(updatedProfile);
    savePatientDemoState({ diary: updatedEntries, profile: updatedProfile });
  };

  // Delete diary entry
  const handleDeleteDiaryEntry = (id: string) => {
    const updatedEntries = diaryEntries.filter((e) => e.id !== id);
    setDiaryEntries(updatedEntries);
    savePatientDemoState({ diary: updatedEntries });
  };

  // Ask question
  const handleAskQuestion = (questionText: string) => {
    const newQnA: PatientQnAItem = {
      id: `qna-${Date.now()}`,
      question: questionText,
      answer: "Tu nutricionista Valentina revisará tu consulta en breve y te responderá por este mismo canal.",
      askedAt: "Hoy",
      isResolved: false,
    };
    const updatedQnA = [newQnA, ...qnaItems];
    setQnaItems(updatedQnA);
    savePatientDemoState({ qna: updatedQnA });
  };

  // Mark all notifications read
  const handleMarkAllNotificationsAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    savePatientDemoState({ notifications: updated });
  };

  // Add extra consumed food (fuera de pauta)
  const handleAddConsumedFood = (item: { name: string; time: string; portion?: string }) => {
    const newEntry: PatientConsumedFood = {
      id: `cf-${Date.now()}`,
      name: item.name,
      time: item.time,
      portion: item.portion,
    };
    const updated = [newEntry, ...consumedFoods];
    setConsumedFoods(updated);
    savePatientDemoState({ consumedFoods: updated });
  };

  // Delete consumed food
  const handleDeleteConsumedFood = (id: string) => {
    const updated = consumedFoods.filter((f) => f.id !== id);
    setConsumedFoods(updated);
    savePatientDemoState({ consumedFoods: updated });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] text-[#20212B] flex flex-col justify-between selection:bg-[#F0F5DF] selection:text-[#5A781E]">
      {/* 1. Header Minimalista: Logo, Consejo de Nutri, Notificaciones y Hamburger */}
      <PatientHeader
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
        onLogoClick={() => setActiveTab("resumen")}
        onOpenNutriAdvice={() => setIsNutriAdviceOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadNotificationsCount={notifications.filter((n) => !n.isRead).length}
      />

      {/* 2. Drawer Desplegable Hamburger con Perfil y Módulos */}
      <PatientMobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        profile={profile}
        completedMealsCount={meals.filter((m) => m.isConsumed).length}
        totalMealsCount={meals.length}
        filesCount={INITIAL_FILES.length}
      />

      {/* 3. Contenido Principal (Flujo directo sin barra de pestañas intermedia) */}
      <main className="flex-1 w-full max-w-md mx-auto px-5 py-5 space-y-5 pb-32">
        {/* Banner con Naty, Saludo, Consejo de la Nutri en acordeón y recordatorio de comida */}
        <NatyWelcomeBanner
          patientName={profile.fullName}
          nextMeal={nextMeal}
          currentStreakDays={profile.currentStreakDays}
          totalStars={profile.totalStars}
          completedMealsCount={meals.filter((m) => m.isConsumed).length}
          totalMealsCount={meals.length}
          nutriName={profile.nutriName}
          nutriSpecialty={profile.nutriSpecialty}
          onConsumeMeal={handleToggleMeal}
          onViewMealsTab={() => setActiveTab("comidas")}
        />

        {/* Contenido del Módulo Activo con animación fluida al cambiar de tab */}
        <div key={activeTab} className="w-full animate-in fade-in-50 slide-in-from-bottom-2 duration-250 ease-out">
          {activeTab === "resumen" && (
            <PatientSummaryTab
              profile={profile}
              meals={meals}
              onAddWater={handleAddWater}
              onNavigateToMeals={() => setActiveTab("comidas")}
              onNavigateToGoals={() => setActiveTab("objetivos")}
            />
          )}

          {activeTab === "objetivos" && (
            <PatientGoalsTab profile={profile} />
          )}

          {activeTab === "comidas" && (
            <PatientMealsTab meals={meals} onToggleMeal={handleToggleMeal} />
          )}

          {activeTab === "diario" && (
            <PatientDiaryTab
              entries={diaryEntries}
              onAddEntry={handleAddDiaryEntry}
              onDeleteEntry={handleDeleteDiaryEntry}
            />
          )}

          {activeTab === "archivos" && <PatientFilesTab files={INITIAL_FILES} />}

          {activeTab === "preguntas" && (
            <PatientQnATab qnaItems={qnaItems} onAskQuestion={handleAskQuestion} />
          )}

          {activeTab === "recursos" && (
            <PatientResourcesTab resources={INITIAL_RESOURCES} />
          )}
        </div>
      </main>

      {/* 4. Footer Estilo Instagram: Alimentos Consumidos (Izq), Nutria Naty (Centro), Mi Nivel / Trofeo (Der) */}
      <PatientInstagramFooter
        profile={profile}
        consumedFoodsCount={consumedFoods.length}
        onOpenConsumedFoods={() => setIsConsumedFoodsOpen(true)}
        onOpenNatyChat={() => setIsNatyChatOpen(true)}
        onOpenLevelModal={() => setIsLevelModalOpen(true)}
      />

      {/* 5. Modales flotantes interactivos accionados desde Header y Footer */}
      <PatientNotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
      />

      <PatientConsumedFoodsModal
        isOpen={isConsumedFoodsOpen}
        onClose={() => setIsConsumedFoodsOpen(false)}
        foods={consumedFoods}
        onAddFood={handleAddConsumedFood}
        onDeleteFood={handleDeleteConsumedFood}
        nutriName={profile.nutriName}
      />

      <PatientLevelModal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        profile={profile}
      />

      <NutriAdviceModal
        isOpen={isNutriAdviceOpen}
        onClose={() => setIsNutriAdviceOpen(false)}
        nutriName={profile.nutriName}
        nutriSpecialty={profile.nutriSpecialty}
      />

      <NatyPatientChatFloating
        isOpen={isNatyChatOpen}
        onClose={() => setIsNatyChatOpen(false)}
      />
    </div>
  );
}
