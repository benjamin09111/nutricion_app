"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AlertCircle, Plus, ChefHat, Trash2, User, X, Check, Search, Sparkles, Loader2, FileText } from "lucide-react";
import Cookies from "js-cookie";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SaveCreationModal } from "@/components/ui/SaveCreationModal";
import { ImportCreationModal } from "@/components/shared/ImportCreationModal";
import { ModuleLayout } from "@/components/shared/ModuleLayout";
import { WorkflowContextBanner } from "@/components/shared/WorkflowContextBanner";
import { PlanPatientSelector, NatyLoadingOverlay, NatyButton, PlanWizardShell } from "@/components/plans";
import type { PlanPatient } from "@/components/plans";
import { FormStepCard } from "@/components/patient-form/FormStepCard";
import { fetchApi } from "@/lib/api-base";
import { DEFAULT_CONSTRAINTS } from "@/lib/constants";
import { fetchCreation, fetchProject, saveCreation } from "@/lib/workflow";
import { downloadPautaAlimentacionPdf } from "@/features/pdf/pautaAlimentacionPdfExport";
import { useDashboardShell } from "@/context/DashboardShellContext";
import { cn } from "@/lib/utils";

type PautaPatient = { id?: string; fullName: string; email?: string | null; ageYears?: number | null; weight?: number | null; height?: number | null; bloodPressure?: string | null; source?: "manual" | "imported"; };
type PautaFoodItem = { id: string; portion: string; food: string; };
type PautaParagraph = { id: string; category: string; categoryOptional: string; portionsPerDay: string; foods: PautaFoodItem[]; imagePath: string | null; };

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  "Lácteos": "/imag_categories/1.webp",
  "Huevos": "/imag_categories/2.webp",
  "Carnes y Vísceras": "/imag_categories/3.webp",
  "Pescados y Mariscos": "/imag_categories/4.webp",
  "Semillas y Nueces": "/imag_categories/5.webp",
  "Cereales y Derivados": "/imag_categories/6.webp",
  "Papas": "/imag_categories/7.webp",
  "Grasas y Aceites": "/imag_categories/8.webp",
  "Verduras": "/imag_categories/9.webp",
  "Frutas": "/imag_categories/10.webp",
  "Azúcares y Miel": "/imag_categories/11.webp",
  "Alimentos Dulces": "/imag_categories/11.webp",
  "Postres de Leche": "/imag_categories/1.webp",
  "Jugos y Néctares": "/imag_categories/10.webp",
  "Refrescos en Polvo": "/imag_categories/11.webp",
  "Bebidas": "/imag_categories/10.webp",
  "Bebidas Alcohólicas": "/imag_categories/11.webp",
  "Productos Salados": "/imag_categories/3.webp",
  "Salsas": "/imag_categories/8.webp",
  "Especias": "/imag_categories/9.webp",
  "Endulzantes": "/imag_categories/11.webp",
  "Platos Preparados": "/imag_categories/6.webp",
};
type ImportedCreation = { id: string; name: string; type: string; content?: Record<string, unknown>; metadata?: Record<string, unknown>; };
type ServerTag = { id: string; name: string; };
type ImportedPatient = { id: string; fullName: string; email?: string | null; ageYears?: number | null; weight?: number | null; height?: number | null; };

const DEFAULT_TITLE = "Pauta de alimentación";
const createEmptyPatient = (): PautaPatient => ({ fullName: "", email: null, ageYears: null, weight: null, height: null, bloodPressure: null, source: "manual" });
const createFoodItem = (): PautaFoodItem => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, portion: "", food: "" });
const createParagraph = (): PautaParagraph => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, category: "", categoryOptional: "", portionsPerDay: "", foods: [createFoodItem()], imagePath: null });

const WIZARD_STEPS = ["Recurso", "Párrafos"];

const formatPautaFoodLabel = (portion: string, food: string) => {
  const cleanFood = food.trim();
  const cleanPortion = portion.trim();

  if (!cleanFood) return "";
  if (!cleanPortion) return cleanFood;

  if (/^\d+(?:[.,]\d+)?$/.test(cleanPortion)) {
    const numericPortion = cleanPortion.replace(",", ".");
    return `${numericPortion} porción${Number(numericPortion) === 1 ? "" : "es"} de ${cleanFood}`;
  }

  return `${cleanPortion} de ${cleanFood}`;
};

export default function PautasAlimentacionClient() {
  const { setSidebarCollapsed } = useDashboardShell();
  const searchParams = useSearchParams();
  const creationId = searchParams.get("creationId");
  const projectId = searchParams.get("project");

  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [selectedRestriction, setSelectedRestriction] = useState<string>("");
  const [restrictions, setRestrictions] = useState<ServerTag[]>([]);
  const [restrictionSearch, setRestrictionSearch] = useState("");

  const [selectedPatient, setSelectedPatient] = useState<PautaPatient>(createEmptyPatient());
  const [patients, setPatients] = useState<ImportedPatient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [isManualPatientExpanded, setIsManualPatientExpanded] = useState(false);
  const [manualPatientData, setManualPatientData] = useState({ ageYears: "", weight: "", height: "", bloodPressure: "" });

  const [paragraphs, setParagraphs] = useState<PautaParagraph[]>([createParagraph()]);
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<string | null>(null);
  const [educationalContent, setEducationalContent] = useState("");
  const [educationalMode, setEducationalMode] = useState<'auto' | 'manual'>('auto');
  const [autoEducationalContent, setAutoEducationalContent] = useState<string>("");
  const [hasAutoMatch, setHasAutoMatch] = useState<boolean>(true);
  const [savedDescriptions, setSavedDescriptions] = useState<Array<{id: string; restriction: string; content: string}>>([]);

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isSaveCreationModalOpen, setIsSaveCreationModalOpen] = useState(false);
  const [isImportCreationModalOpen, setIsImportCreationModalOpen] = useState(false);
  const [creationDescription, setCreationDescription] = useState("");
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
  const [currentProjectMode, setCurrentProjectMode] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const completedSteps = useMemo(() => Array.from({ length: currentStep }, (_, i) => i), [currentStep]);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [selectedParagraphId, setSelectedParagraphId] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiAllowedFoods, setAiAllowedFoods] = useState("");
  const [aiRestrictedFoods, setAiRestrictedFoods] = useState("");
  const [aiSelectedCategories, setAiSelectedCategories] = useState<string[]>([]);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, WIZARD_STEPS.length - 1)));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(WIZARD_STEPS.length - 1, prev + 1));
  }, []);

  const identitySectionRef = useRef<HTMLElement | null>(null);
  const patientDivRef = useRef<HTMLDivElement | null>(null);
  const resourceDivRef = useRef<HTMLDivElement | null>(null);
  const paragraphsSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => { setSidebarCollapsed(true); }, [setSidebarCollapsed]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("nutri_descriptions") || "[]");
      setSavedDescriptions(saved);
    } catch { }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showCategoryDropdown && !(e.target as HTMLElement).closest('.category-dropdown')) {
        setShowCategoryDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showCategoryDropdown]);

  useEffect(() => {
    const draft = localStorage.getItem("nutri_pauta_alimentacion_draft");
    if (!draft) return;
    try {
      const parsed = JSON.parse(draft);
      setTitle(parsed.title || DEFAULT_TITLE);
      setSelectedRestriction(parsed.selectedRestriction || "");
      setSelectedPatient(parsed.selectedPatient || createEmptyPatient());
      setIsManualPatientExpanded(parsed.isManualPatientExpanded === true);
      setManualPatientData(parsed.manualPatientData || { ageYears: "", weight: "", height: "", bloodPressure: "" });
      setParagraphs(Array.isArray(parsed.paragraphs) && parsed.paragraphs.length > 0 ? parsed.paragraphs : [createParagraph()]);
      setEducationalContent(parsed.educationalContent || "");
    } catch (error) { console.error("Error loading draft", error); }
  }, []);

  useEffect(() => {
    localStorage.setItem("nutri_pauta_alimentacion_draft", JSON.stringify({ title, selectedRestriction, selectedPatient, isManualPatientExpanded, manualPatientData, paragraphs, educationalContent }));
  }, [title, selectedRestriction, selectedPatient, isManualPatientExpanded, manualPatientData, paragraphs, educationalContent]);

  useEffect(() => {
    if (!creationId) return;
    const loadCreation = async () => {
      try {
        setSelectedPatient(createEmptyPatient());
        const creation = await fetchCreation(creationId);
        const content = creation.content || {};
        setTitle(content.title || creation.name || DEFAULT_TITLE);
        setSelectedRestriction(content.selectedRestriction || "");
        setParagraphs(Array.isArray(content.paragraphs) && content.paragraphs.length > 0 ? content.paragraphs : [createParagraph()]);
        setEducationalContent(content.educationalContent || "");
        if (creation.metadata?.patientName) {
          setSelectedPatient({ id: creation.metadata?.patientId, fullName: creation.metadata.patientName, source: creation.metadata?.patientId ? "imported" : "manual" });
        }
        setIsManualPatientExpanded(false);
      } catch (error) { console.error(error); toast.error("No se pudieron cargar las pautas."); }
    };
    loadCreation();
  }, [creationId]);

  useEffect(() => {
    if (!projectId) return;
    const loadProject = async () => {
      try {
        setSelectedPatient(createEmptyPatient());
        const project = await fetchProject(projectId);
        setCurrentProjectName(project.name || null);
        setCurrentProjectMode(project.mode || null);
        if (project.patient) {
          setSelectedPatient({ fullName: (project.patient as ImportedPatient).fullName || "", email: (project.patient as ImportedPatient).email, ageYears: (project.patient as ImportedPatient).ageYears, weight: (project.patient as ImportedPatient).weight ?? null, height: (project.patient as ImportedPatient).height ?? null, source: "imported" });
        }
      } catch (error) { console.error("Error loading project", error); }
    };
    loadProject();
  }, [projectId]);

  useEffect(() => {
    const fetchRestrictions = async () => {
      try {
        const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
        const response = await fetchApi("/tags", { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) setRestrictions(await response.json());
      } catch (error) { console.error("Error fetching restrictions", error); }
    };
    fetchRestrictions();
  }, []);

  useEffect(() => {
    const fetchAutoContent = async () => {
      if (!selectedRestriction.trim()) {
        setAutoEducationalContent("");
        setHasAutoMatch(true);
        return;
      }
      try {
        const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
        const response = await fetchApi("/resources", { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          const restrictionLower = selectedRestriction.toLowerCase();
          const match = data.find((r: any) => 
            r.title?.toLowerCase().includes(restrictionLower) || 
            r.category?.toLowerCase().includes(restrictionLower)
          );
          if (match) {
            setAutoEducationalContent(match.content || "");
            setHasAutoMatch(true);
          } else {
            setAutoEducationalContent("");
            setHasAutoMatch(false);
          }
        }
      } catch (error) { console.error("Error fetching auto content", error); }
    };
    fetchAutoContent();
  }, [selectedRestriction]);

  const allRestrictions = useMemo(() => {
    const defaultIds = DEFAULT_CONSTRAINTS.map((c) => c.id);
    const serverRestrictionNames = restrictions.map((r) => r.name);
    return Array.from(new Set([...defaultIds, ...serverRestrictionNames]));
  }, [restrictions]);

  const filteredRestrictions = useMemo(() => {
    if (!restrictionSearch.trim()) return allRestrictions;
    return allRestrictions.filter((r) => r.toLowerCase().includes(restrictionSearch.toLowerCase()));
  }, [allRestrictions, restrictionSearch]);

  const FOOD_CATEGORIES = [
    "Lácteos",
    "Huevos",
    "Carnes y Vísceras",
    "Pescados y Mariscos",
    "Semillas y Nueces",
    "Cereales y Derivados",
    "Papas",
    "Grasas y Aceites",
    "Verduras",
    "Frutas",
    "Azúcares y Miel",
    "Alimentos Dulces",
    "Postres de Leche",
    "Jugos y Néctares",
    "Refrescos en Polvo",
    "Bebidas",
    "Bebidas Alcohólicas",
    "Productos Salados",
    "Salsas",
    "Especias",
    "Endulzantes",
    "Platos Preparados",
  ];

  const exchangeCategories = FOOD_CATEGORIES;
  const usedCategories = useMemo(() => paragraphs.flatMap(p => [p.category, p.categoryOptional]).filter(c => c.trim()), [paragraphs]);
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return exchangeCategories;
    return exchangeCategories.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [exchangeCategories, categorySearch]);

  const calculatedBmi = useMemo(() => {
    const weight = Number(manualPatientData.weight) || selectedPatient.weight;
    const height = Number(manualPatientData.height) || selectedPatient.height;
    if (!weight || !height) return null;
    return Math.round((weight / ((height / 100) * (height / 100))) * 10) / 10;
  }, [manualPatientData.weight, manualPatientData.height, selectedPatient.weight, selectedPatient.height]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    return patients.filter((p) => (p.fullName || "").toLowerCase().includes(patientSearch.toLowerCase()));
  }, [patients, patientSearch]);

  const validParagraphs = useMemo(() => paragraphs.filter((p) => p.category.trim() || p.foods.some((f) => f.food.trim())), [paragraphs]);

  const openPatientModal = async () => {
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi(`/patients`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { const data = await response.json(); setPatients(data.data || []); }
    } catch (error) { console.error("Error fetching patients", error); }
    setPatientSearch("");
    setIsPatientModalOpen(true);
  };

  const handleSelectPatient = (patient: ImportedPatient) => {
    setSelectedPatient({ id: patient.id, fullName: patient.fullName, email: patient.email, ageYears: patient.ageYears ?? null, weight: patient.weight ?? null, height: patient.height ?? null, source: "imported" });
    setIsManualPatientExpanded(false);
    setIsPatientModalOpen(false);
    toast.success(`Paciente ${patient.fullName} seleccionado.`);
  };

  const clearSelectedPatient = () => {
    setSelectedPatient(createEmptyPatient());
    setIsManualPatientExpanded(false);
    setManualPatientData({ ageYears: "", weight: "", height: "", bloodPressure: "" });
    toast.info("Paciente quitado.");
  };

  const updateParagraphImage = (id: string, imagePath: string | null) => {
    setParagraphs((current) => current.map((p) => (p.id === id ? { ...p, imagePath } : p)));
    setIsImageSelectorOpen(false);
  };

  const openImageSelector = (paragraphId: string) => {
    setSelectedParagraphId(paragraphId);
    setIsImageSelectorOpen(true);
  };

  const updateParagraph = (id: string, field: keyof PautaParagraph, value: string | boolean) => {
    setParagraphs((current) => current.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const addParagraph = () => setParagraphs((current) => [...current, createParagraph()]);
  const removeParagraph = (id: string) => setParagraphs((current) => (current.length === 1 ? current : current.filter((p) => p.id !== id)));
  const updateFoodItem = (paragraphId: string, foodId: string, field: keyof PautaFoodItem, value: string) => {
    setParagraphs((current) => current.map((p) => (p.id === paragraphId ? { ...p, foods: p.foods.map((f) => (f.id === foodId ? { ...f, [field]: value } : f)) } : p)));
  };
  const addFoodItem = (paragraphId: string) => setParagraphs((current) => current.map((p) => (p.id === paragraphId ? { ...p, foods: [...p.foods, createFoodItem()] } : p)));
  const removeFoodItem = (paragraphId: string, foodId: string) => setParagraphs((current) => current.map((p) => (p.id === paragraphId ? { ...p, foods: p.foods.length === 1 ? p.foods : p.foods.filter((f) => f.id !== foodId) } : p)));

  const applyImportedCreation = (creation: ImportedCreation) => {
    if (creation.type !== "PAUTAS") { toast.error("Solo pautas de alimentación."); return; }
    const content = creation.content as Record<string, unknown> || {};
    setTitle(String(content.title || creation.name || DEFAULT_TITLE));
    setSelectedRestriction(String(content.selectedRestriction || ""));
    setParagraphs(Array.isArray(content.paragraphs) && content.paragraphs.length > 0 ? content.paragraphs as PautaParagraph[] : [createParagraph()]);
    setEducationalContent(String(content.educationalContent || ""));
    const patientName = typeof creation.metadata?.patientName === "string" ? creation.metadata.patientName : null;
    const patientId = typeof creation.metadata?.patientId === "string" ? creation.metadata.patientId : undefined;
    setSelectedPatient(patientName ? { id: patientId, fullName: patientName, source: patientId ? "imported" : "manual" } : createEmptyPatient());
    setIsManualPatientExpanded(false);
    setIsImportCreationModalOpen(false);
    toast.success("Pautas importadas.");
  };

  const validateRequiredSections = () => {
    if (!selectedRestriction.trim()) { toast.error("Selecciona una restricción."); return false; }
    if (validParagraphs.length === 0) { toast.error("Agrega al menos un párrafo."); return false; }
    return true;
  };

  const buildPdfPayload = () => {
    const patientAge = isManualPatientExpanded ? (manualPatientData.ageYears ? Number(manualPatientData.ageYears) : null) : (selectedPatient.ageYears ?? null);
    const patientWeight = isManualPatientExpanded ? (manualPatientData.weight ? Number(manualPatientData.weight) : null) : (selectedPatient.weight ?? null);
    const patientHeight = isManualPatientExpanded ? (manualPatientData.height ? Number(manualPatientData.height) : null) : (selectedPatient.height ?? null);

    return {
      name: `${title} - ${selectedRestriction}`,
      restriction: selectedRestriction,
      patient: selectedPatient.fullName.trim() ? { name: selectedPatient.fullName, ageYears: patientAge, weight: patientWeight, height: patientHeight, bmi: calculatedBmi, bloodPressure: (isManualPatientExpanded && manualPatientData.bloodPressure.trim()) ? manualPatientData.bloodPressure : (selectedPatient.bloodPressure ?? null), nextControl: null } : null,
      paragraphs: validParagraphs.map((p) => ({
        title: p.portionsPerDay.trim() ? `Tiempo de alimentación ${p.portionsPerDay.trim()}` : "Tiempo de alimentación",
        subtitle: [
          p.category.trim() ? `Grupo clínico: ${p.category.trim()}` : null,
          p.categoryOptional.trim() ? `Alternativa clínica: ${p.categoryOptional.trim()}` : null,
        ].filter(Boolean).join(" · "),
        foods: p.foods
          .map((f) => {
            return formatPautaFoodLabel(f.portion, f.food);
          })
          .filter(Boolean),
        imagePath: p.imagePath,
      })),
      resource: educationalContent.trim() ? { title: `Información educativa - ${selectedRestriction}`, content: educationalContent } : null,
      generatedAt: new Date().toLocaleDateString("es-CL"),
    };
  };

  const handleExportPdf = async () => {
    if (!validateRequiredSections()) return;
    setIsExportingPdf(true);
    try { await downloadPautaAlimentacionPdf(buildPdfPayload()); toast.success("PDF descargado."); setIsSaveCreationModalOpen(true); }
    catch (error) { console.error(error); toast.error("Error al generar PDF."); }
    finally { setIsExportingPdf(false); }
  };

  const handleGenerateWithAi = async () => {
    if (aiSelectedCategories.length === 0) {
      toast.error("Selecciona al menos una categoría.");
      return;
    }
    const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
    if (!token) {
      toast.error("No se encontró una sesión activa.");
      return;
    }
    setIsGeneratingAi(true);
    toast.info("Naty est\u00e1 generando las pautas. Puedes seguir editando mientras tanto.");
    try {
      const response = await fetchApi("/pautas/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restriction: selectedRestriction,
          allowedFoods: aiAllowedFoods.split(",").map((item) => item.trim()).filter(Boolean),
          restrictedFoods: aiRestrictedFoods.split(",").map((item) => item.trim()).filter(Boolean),
          categories: aiSelectedCategories,
          patient: {
            fullName: selectedPatient.fullName || "",
            ageYears: selectedPatient.ageYears ?? undefined,
            weight: selectedPatient.weight ?? undefined,
            height: selectedPatient.height ?? undefined,
          },
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || "No se pudo generar con IA.");
      }
      const result = await response.json();
      if (result.paragraphs && Array.isArray(result.paragraphs)) {
        const existingCategories = paragraphs.map((p) => p.category).filter(Boolean);
        const newParagraphs = result.paragraphs.map((p: { category: string; categoryOptional?: string; portionsPerDay?: string; foods?: Array<{ portion: string; food: string }> }) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          category: p.category,
          categoryOptional: p.categoryOptional || "",
          portionsPerDay: p.portionsPerDay || "",
          foods: (p.foods && p.foods.length > 0)
            ? p.foods.map((f: { portion: string; food: string }) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, portion: f.portion, food: f.food }))
            : [createFoodItem()],
          imagePath: CATEGORY_IMAGE_MAP[p.category] || null,
        })).filter((np: { category: string }) => !existingCategories.includes(np.category));
        if (newParagraphs.length > 0) {
          setParagraphs((prev) => [...prev, ...newParagraphs]);
          toast.success(`Naty gener\u00f3 ${newParagraphs.length} p\u00e1rrafos.`);
        } else {
          toast.warning("Las categorías seleccionadas ya existen en las pautas.");
        }
      } else {
        toast.error("La respuesta de la IA no fue válida.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al generar con IA.");
    } finally {
      setIsGeneratingAi(false);
      setIsAiModalOpen(false);
    }
  };

  const handleSaveToCreations = async () => {
    if (!validateRequiredSections()) return;
    setIsSaving(true);
    try {
      await saveCreation({
        name: `${title} - ${selectedRestriction}`,
        type: "PAUTAS",
        content: { title, selectedRestriction, paragraphs, educationalContent, manualPatientData: isManualPatientExpanded ? manualPatientData : null, updatedAt: new Date().toISOString() },
        metadata: { ...(creationDescription.trim() ? { description: creationDescription.trim() } : {}), ...(selectedPatient.fullName ? { patientId: selectedPatient.id, patientName: selectedPatient.fullName } : {}), restriction: selectedRestriction, paragraphCount: validParagraphs.length },
        tags: ["pautas", selectedRestriction.toLowerCase().replace(/\s+/g, "_")],
      });
      toast.success("Pautas guardadas.");
      setIsSaveCreationModalOpen(false);
      setCreationDescription("");
    } catch (error: unknown) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Error al guardar.");
    }
    finally { setIsSaving(false); }
  };

  const resetPauta = () => {
    setTitle(DEFAULT_TITLE);
    setSelectedRestriction("");
    setSelectedPatient(createEmptyPatient());
    setIsManualPatientExpanded(false);
    setManualPatientData({ ageYears: "", weight: "", height: "", bloodPressure: "" });
    setParagraphs([createParagraph()]);
    setEducationalContent("");
    localStorage.removeItem("nutri_pauta_alimentacion_draft");
    toast.success("Pautas reiniciadas.");
  };

  const fetchPatients = async (): Promise<PlanPatient[]> => {
    try {
      const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
      const response = await fetchApi("/patients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch {
      return [];
    }
  };

  const handlePlanSelectPatient = (patient: PlanPatient) => {
    setSelectedPatient({
      id: patient.id,
      fullName: patient.fullName,
      email: patient.email,
      ageYears: patient.ageYears ?? null,
      weight: patient.weight ?? null,
      height: patient.height ?? null,
      source: patient.id ? "imported" : "manual",
    });
    setIsManualPatientExpanded(false);
  };

  return (
    <>
      {isGeneratingAi && (
        <NatyLoadingOverlay
          title="Naty est\u00e1 preparando..."
          subtitle="Generando los p\u00e1rrafos de pautas alimenticias"
        />
      )}

      <ModuleLayout
        title="Pautas de Alimentaci\u00f3n"
        description="Crea gu\u00edas alimenticias para restricciones cl\u00ednicas."
        className="max-w-[68rem]"
      >
        <WorkflowContextBanner projectName={currentProjectName} patientName={selectedPatient?.fullName || null} mode={currentProjectMode} moduleLabel="Pautas" />

        <div className="mt-6 xl:px-4 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 max-w-2xl">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Título</p>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-base font-semibold" placeholder={DEFAULT_TITLE} />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Restricción clínica</p>
                {selectedRestriction ? (
                  <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3">
                    <span className="flex-1 font-semibold text-emerald-900">{selectedRestriction}</span>
                    <button type="button" onClick={() => { setSelectedRestriction(""); setRestrictionSearch(""); }} className="rounded-full p-1 text-emerald-600 hover:bg-emerald-100"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input type="text" value={restrictionSearch} onChange={(e) => setSelectedRestriction(e.target.value)} placeholder="Buscar o Escribir" className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-base font-medium" />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {filteredRestrictions.slice(0, 6).map((r) => (
                        <button key={r} type="button" onClick={() => { setSelectedRestriction(r); setRestrictionSearch(""); }} className="rounded-full px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200">
                          {r}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100">
              <PlanPatientSelector
                patient={selectedPatient.fullName ? {
                  id: selectedPatient.id,
                  fullName: selectedPatient.fullName,
                  email: selectedPatient.email,
                  ageYears: selectedPatient.ageYears,
                  weight: selectedPatient.weight,
                  height: selectedPatient.height,
                } : null}
                onSelect={handlePlanSelectPatient}
                onClear={clearSelectedPatient}
                fetchPatients={fetchPatients}
              />
              {!isManualPatientExpanded && (
                <button
                  type="button"
                  onClick={() => { setSelectedPatient(createEmptyPatient()); setIsManualPatientExpanded(true); }}
                  className="mt-2 text-left text-sm font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-800"
                >
                  O completa manualmente
                </button>
              )}
              {isManualPatientExpanded && (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre</p>
                      <Input value={selectedPatient.fullName} onChange={(e) => setSelectedPatient((p) => ({ ...p, fullName: e.target.value }))} placeholder="Nombre y apellido" className="h-11 rounded-xl border-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Edad</p>
                      <Input type="number" min={0} value={manualPatientData.ageYears} onChange={(e) => setManualPatientData((d) => ({ ...d, ageYears: e.target.value }))} placeholder="Ej: 42" className="h-11 rounded-xl border-slate-200 w-24" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Peso (kg)</p>
                      <Input type="number" min={0} step="0.1" value={manualPatientData.weight} onChange={(e) => setManualPatientData((d) => ({ ...d, weight: e.target.value }))} placeholder="Ej: 70" className="h-11 rounded-xl border-slate-200 w-24" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Talla (cm)</p>
                      <Input type="number" min={0} value={manualPatientData.height} onChange={(e) => setManualPatientData((d) => ({ ...d, height: e.target.value }))} placeholder="Ej: 170" className="h-11 rounded-xl border-slate-200 w-24" />
                    </div>
                    <button type="button" onClick={() => { setIsManualPatientExpanded(false); setSelectedPatient(createEmptyPatient()); }} className="text-sm font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-800">Importar paciente</button>
                  </div>
                  {calculatedBmi !== null && (
                    <div className="mt-4 inline-block rounded-lg bg-emerald-50 px-4 py-2">
                      <span className="text-sm font-semibold text-emerald-700">IMC:</span>{" "}
                      <span className="text-base font-bold text-emerald-800">{calculatedBmi}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 xl:px-4">
          <PlanWizardShell
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
            onBack={goBack}
            onNext={goNext}
            isLastStep={currentStep === WIZARD_STEPS.length - 1}
            onReset={resetPauta}
          >

          {currentStep === 0 && (
            <FormStepCard icon={<FileText className="w-4 h-4 text-emerald-600" />} title="Recurso educativo" description="Contenido educativo asociado">
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => setEducationalMode('auto')} className={cn("px-4 py-2 rounded-full text-sm font-semibold transition-colors", educationalMode === 'auto' ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>Automático</button>
                    <button type="button" onClick={() => setEducationalMode('manual')} className={cn("px-4 py-2 rounded-full text-sm font-semibold transition-colors", educationalMode === 'manual' ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>Manual</button>
                  </div>
                  {educationalMode === 'manual' ? (
                    <div className="space-y-3">
                      {savedDescriptions.filter(d => !selectedRestriction || d.restriction.toLowerCase() === selectedRestriction.toLowerCase()).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <p className="w-full text-xs text-slate-500">Usar descripción guardada:</p>
                          {savedDescriptions.filter(d => !selectedRestriction || d.restriction.toLowerCase() === selectedRestriction.toLowerCase()).map(desc => (
                            <button key={desc.id} type="button" onClick={() => setEducationalContent(desc.content)} className="rounded-full px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200">{desc.restriction}</button>
                          ))}
                        </div>
                      )}
                      <textarea value={educationalContent} onChange={(e) => setEducationalContent(e.target.value)} placeholder="Escribe información educativa..." className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base" />
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => {
                          if (!selectedRestriction.trim() || !educationalContent.trim()) { toast.error("Selecciona una restricción y escribe el contenido."); return; }
                          const newDesc = { id: `desc_${Date.now()}`, restriction: selectedRestriction, content: educationalContent };
                          const updated = [...savedDescriptions, newDesc];
                          setSavedDescriptions(updated);
                          localStorage.setItem("nutri_descriptions", JSON.stringify(updated));
                          toast.success("Descripción guardada.");
                        }} className="h-9 rounded-xl text-xs">Guardar descripción</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedDescriptions.filter(d => !selectedRestriction || d.restriction.toLowerCase() === selectedRestriction.toLowerCase()).length > 0 && selectedRestriction && (
                        <div className="flex flex-wrap gap-2">
                          <p className="w-full text-xs text-slate-500">Descripciones guardadas:</p>
                          {savedDescriptions.filter(d => !selectedRestriction || d.restriction.toLowerCase() === selectedRestriction.toLowerCase()).map(desc => (
                            <button key={desc.id} type="button" onClick={() => setEducationalContent(desc.content)} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">{desc.restriction}</button>
                          ))}
                        </div>
                      )}
                      <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                        {selectedRestriction ? (
                          hasAutoMatch && autoEducationalContent ? (
                            <p className="text-sm text-emerald-800">Se incluirá automáticamente el recurso de: <span className="font-semibold">{selectedRestriction}</span></p>
                          ) : savedDescriptions.filter(d => d.restriction.toLowerCase() === selectedRestriction.toLowerCase()).length > 0 ? (
                            <p className="text-sm text-emerald-800">Usa una de las <span className="font-semibold">{savedDescriptions.filter(d => d.restriction.toLowerCase() === selectedRestriction.toLowerCase()).length}</span> descripciones guardadas, o cambia a modo manual.</p>
                          ) : (
                            <p className="text-sm text-amber-700">No hay coincidencias para <span className="font-semibold">{selectedRestriction}</span>, crea la información de forma manual.</p>
                          )
                        ) : (
                          <p className="text-sm text-slate-600">Selecciona una restricción para agregar su información automáticamente.</p>
                        )}
                      </div>
                    </div>
                  )}
            </FormStepCard>
          )}

          {currentStep === 1 && (
            <FormStepCard icon={<ChefHat className="w-4 h-4 text-emerald-600" />} title="Párrafos" description="Bloques de pauta y alimentos">
              {!selectedRestriction.trim() && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/90 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <AlertCircle className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700">Selecciona una restricción clínica</h3>
                    <p className="mt-2 max-w-sm text-sm text-slate-500">Para crear los párrafos de pautas, primero debes seleccionar una restricción clínica en la sección de Información general.</p>
                  </div>
                </div>
              )}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Párrafos de pautas *</p>
                    <p className="mt-1 text-xs text-slate-500">Crea un título seleccionando 1-2 categorías de alimentos + porciones.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={addParagraph} disabled={!selectedRestriction.trim()} className="h-10 rounded-2xl border-slate-200"><Plus className="mr-2 h-4 w-4" />Agregar</Button>
                    <Button variant="outline" onClick={() => setIsAiModalOpen(true)} disabled={!selectedRestriction.trim()} title={!selectedRestriction.trim() ? "Selecciona una restricci\u00f3n cl\u00ednica primero" : "Generar p\u00e1rrafos con Naty"} className="h-10 rounded-xl border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-50"><Sparkles className="mr-2 h-4 w-4" />Generar con Naty</Button>
                  </div>
                </div>
                <div className="space-y-6">
                  {paragraphs.map((paragraph) => (
                    <div key={paragraph.id} className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                      {paragraphs.length > 1 && <button type="button" onClick={() => removeParagraph(paragraph.id)} disabled={!selectedRestriction.trim()} className="absolute right-4 top-4 rounded-full p-2 text-rose-500 hover:bg-rose-50 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>}
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoría 1 *</p>
                          <div className="relative category-dropdown">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input type="text" value={paragraph.category} onChange={(e) => { updateParagraph(paragraph.id, "category", e.target.value); setShowCategoryDropdown(`${paragraph.id}-1`); setCategorySearch(e.target.value); }} onFocus={() => setShowCategoryDropdown(`${paragraph.id}-1`)} placeholder="Buscar..." disabled={!selectedRestriction.trim()} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm disabled:bg-slate-100 disabled:text-slate-400" />
                            {showCategoryDropdown === `${paragraph.id}-1` && (
                              <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg category-dropdown">
                                {filteredCategories.filter(c => !usedCategories.includes(c) || c === paragraph.category || c === paragraph.categoryOptional).map(c => (<button key={c} type="button" onClick={() => { updateParagraph(paragraph.id, "category", c); setShowCategoryDropdown(null); }} className="w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50">{c}</button>))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoría 2</p>
                          <div className="relative category-dropdown">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input type="text" value={paragraph.categoryOptional} onChange={(e) => { updateParagraph(paragraph.id, "categoryOptional", e.target.value); setShowCategoryDropdown(`${paragraph.id}-2`); setCategorySearch(e.target.value); }} onFocus={() => setShowCategoryDropdown(`${paragraph.id}-2`)} placeholder="Buscar..." disabled={!selectedRestriction.trim()} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm disabled:bg-slate-100 disabled:text-slate-400" />
                            {showCategoryDropdown === `${paragraph.id}-2` && (
                              <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg category-dropdown">
                                {filteredCategories.filter(c => !usedCategories.includes(c) || c === paragraph.categoryOptional || c === paragraph.category).map(c => (<button key={c} type="button" onClick={() => { updateParagraph(paragraph.id, "categoryOptional", c); setShowCategoryDropdown(null); }} className="w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50">{c}</button>))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Porciones al día</p>
                          <Input value={paragraph.portionsPerDay} onChange={(e) => updateParagraph(paragraph.id, "portionsPerDay", e.target.value)} placeholder="Ej: 2 porciones al día" disabled={!selectedRestriction.trim()} className="h-11 rounded-xl border-slate-200" />
                        </div>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Alimentos</p>
                          {paragraph.foods.map((food) => (
                            <div key={food.id} className="flex gap-2">
                              <Input value={food.portion} onChange={(e) => updateFoodItem(paragraph.id, food.id, "portion", e.target.value)} placeholder="Porción" disabled={!selectedRestriction.trim()} className="h-10 flex-1 rounded-lg border-slate-200" />
                              <Input value={food.food} onChange={(e) => updateFoodItem(paragraph.id, food.id, "food", e.target.value)} placeholder="Alimento" disabled={!selectedRestriction.trim()} className="h-10 flex-[2] rounded-lg border-slate-200" />
                              {paragraph.foods.length > 1 && <button type="button" onClick={() => removeFoodItem(paragraph.id, food.id)} disabled={!selectedRestriction.trim()} className="rounded-full p-2 text-rose-500 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>}
                            </div>
                          ))}
                          <Button type="button" variant="ghost" onClick={() => addFoodItem(paragraph.id)} disabled={!selectedRestriction.trim()} className="text-sm text-emerald-600 hover:text-emerald-700 disabled:text-slate-400"><Plus className="mr-1 h-4 w-4" />Agregar alimento</Button>
                        </div>
                        <button type="button" onClick={() => openImageSelector(paragraph.id)} disabled={!selectedRestriction.trim()} className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white px-2 py-3 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 disabled:cursor-not-allowed disabled:opacity-50">
                          {paragraph.imagePath ? (
                            <div className="relative w-full">
                              <Image src={paragraph.imagePath} alt="Imagen de categoría" width={160} height={160} className="mx-auto h-20 w-auto rounded-lg object-contain" />
                              <button type="button" onClick={(e) => { e.stopPropagation(); updateParagraphImage(paragraph.id, null); }} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex h-20 w-full items-center justify-center">
                              <div className="text-center">
                                <ChefHat className="mx-auto h-8 w-8 text-slate-300" />
                                <p className="mt-1 text-xs text-slate-400">Seleccionar</p>
                              </div>
                            </div>
                          )}
                          <p className="mt-1 text-[10px] text-slate-400">Click para {paragraph.imagePath ? "cambiar" : "agregar"}</p>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FormStepCard>
          )}

          </PlanWizardShell>
        </div>
      </ModuleLayout>

      <Modal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} className="max-w-lg">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Seleccionar paciente</h3>
          <div className="mb-4">
            <Input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Buscar..." className="rounded-xl" />
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filteredPatients.length === 0 ? <p className="text-center text-sm text-slate-500">No se encontraron.</p> : filteredPatients.map((patient) => (<button key={patient.id} type="button" onClick={() => handleSelectPatient(patient)} className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-slate-50"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100"><User className="h-5 w-5 text-emerald-600" /></div><div><p className="font-medium">{patient.fullName}</p>{patient.email && <p className="text-xs text-slate-500">{patient.email}</p>}</div></button>))}
          </div>
        </div>
      </Modal>

      <SaveCreationModal isOpen={isSaveCreationModalOpen} onClose={() => setIsSaveCreationModalOpen(false)} description={creationDescription} onDescriptionChange={setCreationDescription} onConfirm={handleSaveToCreations} isSaving={isSaving} />
      <ImportCreationModal isOpen={isImportCreationModalOpen} onClose={() => setIsImportCreationModalOpen(false)} onImport={applyImportedCreation} allowedTypes={["PAUTAS"]} />

      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} className="max-w-2xl">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Sparkles className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Generar con Naty</h3>
                <p className="text-sm text-slate-500">Rellena los párrafos automáticamente</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsAiModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <p className="text-sm font-medium text-amber-900">Restricción clínica actual:</p>
              <p className="mt-1 font-semibold text-amber-800">{selectedRestriction || "No seleccionada"}</p>
            </div>

            {selectedPatient.fullName && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Datos del paciente:</p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedPatient.fullName}
                  {selectedPatient.ageYears && ` • ${selectedPatient.ageYears} años`}
                  {selectedPatient.weight && ` • ${selectedPatient.weight} kg`}
                  {selectedPatient.height && ` • ${selectedPatient.height} cm`}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Categorías a generar *</label>
                <p className="text-xs text-slate-500 mb-2">Selecciona las categorías que quieres añadir (se excluirán las ya seleccionadas)</p>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200 p-3">
                  {exchangeCategories
                    .filter((cat) => !paragraphs.some((p) => p.category === cat || p.categoryOptional === cat))
                    .map((category) => (
                      <label key={category} className="flex items-center gap-2 rounded-lg p-2 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiSelectedCategories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAiSelectedCategories((prev) => [...prev, category]);
                            } else {
                              setAiSelectedCategories((prev) => prev.filter((c) => c !== category));
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-700">{category}</span>
                      </label>
                    ))}
                  {exchangeCategories.filter((cat) => !paragraphs.some((p) => p.category === cat || p.categoryOptional === cat)).length === 0 && (
                    <p className="col-span-2 text-center text-sm text-slate-500 py-4">Todas las categorías ya están utilizadas</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Alimentos permitidos</label>
                <Input
                  value={aiAllowedFoods}
                  onChange={(e) => setAiAllowedFoods(e.target.value)}
                  placeholder="Ej: pollo, arroz, verduras..."
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-slate-500">Separados por coma</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Alimentos no permitidos</label>
                <Input
                  value={aiRestrictedFoods}
                  onChange={(e) => setAiRestrictedFoods(e.target.value)}
                  placeholder="Ej: azúcar, frituras, bebidas gasosas..."
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-slate-500">Separados por coma</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAiModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <NatyButton
              onClick={handleGenerateWithAi}
              isLoading={isGeneratingAi}
              disabled={aiSelectedCategories.length === 0}
              label="Generar con Naty"
            />
          </div>
        </div>
      </Modal>

      <Modal isOpen={isImageSelectorOpen} onClose={() => setIsImageSelectorOpen(false)} className="max-w-3xl">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Seleccionar imagen</h3>
              <p className="text-sm text-slate-500">Seleccione una imagen para este párrafo</p>
            </div>
            <button type="button" onClick={() => setIsImageSelectorOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>
          <p className="mb-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Seleccione una imagen</p>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {(() => {
              const uniqueImages = Array.from(new Set(Object.values(CATEGORY_IMAGE_MAP)));
              return uniqueImages.map((imagePath, idx) => {
                const isSelected = paragraphs.find((p) => p.id === selectedParagraphId)?.imagePath === imagePath;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectedParagraphId && updateParagraphImage(selectedParagraphId, imagePath)}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-200"
                        : "border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100 hover:scale-[1.02]"
                    )}
                  >
                    <Image
                      src={imagePath}
                      alt={`Imagen ${idx + 1}`}
                      width={160}
                      height={160}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/30 backdrop-blur-sm">
                        <Check className="h-8 w-8 text-white drop-shadow-md" />
                      </div>
                    )}
                    {!isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    )}
                  </button>
                );
              });
            })()}
          </div>

          <div className="mt-6 flex justify-between border-t border-slate-200 pt-4">
            <Button variant="ghost" onClick={() => { if (selectedParagraphId) updateParagraphImage(selectedParagraphId, null); }} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
              <X className="mr-2 h-4 w-4" />
              Quitar imagen
            </Button>
            <Button variant="outline" onClick={() => setIsImageSelectorOpen(false)} className="rounded-2xl">
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
