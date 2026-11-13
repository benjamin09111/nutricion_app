"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Utensils,
  BookOpen,
  FolderOpen,
  HelpCircle,
  Compass,
  Menu,
} from "lucide-react";
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
} from "@/features/patient-portal-demo/types";
import { PatientHeader } from "@/features/patient-portal-demo/components/PatientHeader";
import {
  PatientMobileNavDrawer,
  PatientNavTabId,
} from "@/features/patient-portal-demo/components/PatientMobileNavDrawer";
import { NatyWelcomeBanner } from "@/features/patient-portal-demo/components/NatyWelcomeBanner";
import { PatientSummaryTab } from "@/features/patient-portal-demo/components/PatientSummaryTab";
import { PatientMealsTab } from "@/features/patient-portal-demo/components/PatientMealsTab";
import { PatientDiaryTab } from "@/features/patient-portal-demo/components/PatientDiaryTab";
import { PatientFilesTab } from "@/features/patient-portal-demo/components/PatientFilesTab";
import { PatientQnATab } from "@/features/patient-portal-demo/components/PatientQnATab";
import { PatientResourcesTab } from "@/features/patient-portal-demo/components/PatientResourcesTab";
import { PatientGamificationFooter } from "@/features/patient-portal-demo/components/PatientGamificationFooter";
import { NatyPatientChatFloating } from "@/features/patient-portal-demo/components/NatyPatientChatFloating";
import { cn } from "@/lib/utils";

export function PatientDashboardClient() {
  const [profile, setProfile] = useState<PatientProfileState | null>(null);
  const [meals, setMeals] = useState<PatientMeal[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<PatientDiaryEntry[]>([]);
  const [qnaItems, setQnaItems] = useState<PatientQnAItem[]>([]);
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const [activeTab, setActiveTab] = useState<PatientNavTabId>("resumen");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Load state from localStorage / defaults on mount
  useEffect(() => {
    const data = loadPatientDemoState();
    setProfile(data.profile);
    setMeals(data.meals);
    setDiaryEntries(data.diary);
    setQnaItems(data.qna);
    setNotifications(data.notifications);
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

  const navTabs: {
    id: PatientNavTabId;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    { id: "resumen", label: "Resumen", icon: LayoutDashboard },
    {
      id: "comidas",
      label: "Horario & Comidas",
      icon: Utensils,
      badge: `${meals.filter((m) => m.isConsumed).length}/${meals.length}`,
    },
    { id: "diario", label: "Diario de Vida", icon: BookOpen },
    {
      id: "archivos",
      label: "Pautas & Archivos",
      icon: FolderOpen,
      badge: `${INITIAL_FILES.length}`,
    },
    { id: "preguntas", label: "Consultas al Nutri", icon: HelpCircle },
    { id: "recursos", label: "Educación & Guías", icon: Compass },
  ];

  const currentTabConfig = navTabs.find((t) => t.id === activeTab) || navTabs[0];
  const CurrentTabIcon = currentTabConfig.icon;

  return (
    <div className="min-h-screen bg-[#FAFAFB] text-[#20212B] flex flex-col justify-between selection:bg-[#F0F5DF] selection:text-[#5A781E]">
      {/* 1. Header con botón Hamburger, logo, notificaciones y avatar */}
      <PatientHeader
        patientName={profile.fullName}
        nutriName={profile.nutriName}
        notifications={notifications}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
        onLogoClick={() => setActiveTab("resumen")}
      />

      {/* 2. Drawer Desplegable Hamburger para Móviles */}
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

      {/* 3. Contenido Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-24 sm:pb-28">
        {/* Banner de Bienvenida con Naty y recordatorio de siguiente comida */}
        <NatyWelcomeBanner
          patientName={profile.fullName}
          nextMeal={nextMeal}
          currentStreakDays={profile.currentStreakDays}
          onConsumeMeal={handleToggleMeal}
          onViewMealsTab={() => setActiveTab("comidas")}
        />

        {/* 
          Barra Móvil Compacta: Indicador del módulo activo con botón para abrir el hamburger
          (Reemplaza la tira de scroll incómoda en móviles)
        */}
        <div className="md:hidden flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#E9E5E7] shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#F0F5DF] text-[#5A781E] flex items-center justify-center">
              <CurrentTabIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
                Módulo actual
              </span>
              <span className="text-xs font-black text-[#20212B]">
                {currentTabConfig.label}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="h-8 px-3 rounded-xl bg-[#F0F5DF] hover:bg-[#E4ECC8] text-[#5A781E] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Módulos</span>
          </button>
        </div>

        {/* Barra de Pestañas para Pantallas Medianas y Grandes (Desktop) */}
        <div className="hidden md:block sticky top-14 sm:top-16 z-20 bg-[#FAFAFB]/95 backdrop-blur-md py-2">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#E9E5E7] shadow-2xs">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    isActive
                      ? "bg-[#86A83C] text-white shadow-xs shadow-[#86A83C]/20"
                      : "text-slate-600 hover:text-[#20212B] hover:bg-slate-50 active:scale-95"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={cn(
                        "text-[10px] font-black px-1.5 py-0.2 rounded-full",
                        isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="w-full animate-in fade-in duration-150">
          {activeTab === "resumen" && (
            <PatientSummaryTab
              profile={profile}
              meals={meals}
              onAddWater={handleAddWater}
              onNavigateToMeals={() => setActiveTab("comidas")}
            />
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

      {/* 4. Footer Gamificado con Estrellas y Racha (Compacto, pb-safe) */}
      <PatientGamificationFooter profile={profile} />

      {/* 5. Chat Flotante con Naty la nutria */}
      <NatyPatientChatFloating />
    </div>
  );
}
