import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Cookies from "js-cookie";
import jsPDF from "jspdf";
import { domToPng } from "modern-screenshot";
import { fetchApi } from "@/lib/api-base";
import { validateRut } from "@/lib/rut-utils";
import { useScrollLock } from "@/hooks/useScrollLock";
import { Patient, ActivityLevel, ClinicalRecord } from "@/features/patients";
import {
  ClinicalRecordDraft,
  buildClinicalRecordDraft,
  createEmptyClinicalRecordDraft,
  serializeClinicalRecordDraft,
} from "../clinical-record";
import { Consultation, Metric, ConsultationsResponse } from "@/features/consultations";
import {
  PatientPortalOverview,
  PortalInviteResponse,
  PatientPortalEntry,
} from "@/features/patient-portal";
import {
  isIndependentMetricsConsultation,
  normalizeMetricKey,
  hasHistoricalMetricKey,
  toDateOnly,
  formatDateOnlyForLocale,
  getTodayDateInputValue,
} from "../utils/patient-helpers";
import { Ruler, Weight, Activity, Dumbbell, Zap, Target } from "lucide-react";

export type TabType =
  | "General"
  | "Consultas"
  | "Ficha clínica"
  | "Progreso"
  | "Acompañamiento"
  | "Creaciones";

interface UsePatientDetailStateProps {
  id: string;
}

export function usePatientDetailState({ id }: UsePatientDetailStateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConsultationsLoading, setIsConsultationsLoading] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportIncludeClinicalRecord, setExportIncludeClinicalRecord] = useState(false);
  const [exportIncludeProgress, setExportIncludeProgress] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("General");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Patient>>({});
  const [clinicalRecord, setClinicalRecord] = useState<ClinicalRecord | null>(null);
  const [clinicalRecordDraft, setClinicalRecordDraft] = useState<ClinicalRecordDraft>(
    createEmptyClinicalRecordDraft(),
  );
  const [isClinicalRecordLoading, setIsClinicalRecordLoading] = useState(false);
  const [isClinicalRecordSaving, setIsClinicalRecordSaving] = useState(false);
  const [hasLoadedClinicalRecord, setHasLoadedClinicalRecord] = useState(false);
  const [recalcKey, setRecalcKey] = useState(0);
  const [isAutomaticNutritionLoading, setIsAutomaticNutritionLoading] =
    useState(false);
  const [showRecalculateSaveConfirm, setShowRecalculateSaveConfirm] =
    useState(false);
  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null);
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [isOverwriteConfirmOpen, setIsOverwriteConfirmOpen] = useState(false);
  const [conflictingConsultationId, setConflictingConsultationId] = useState<
    string | null
  >(null);
  const [metricForm, setMetricForm] = useState({
    date: getTodayDateInputValue(),
    metrics: [] as Metric[],
  });
  const [isEditMetricHistoryModalOpen, setIsEditMetricHistoryModalOpen] =
    useState(false);
  const [editingMetricKey, setEditingMetricKey] = useState<string | null>(null);
  const [globalMetrics, setGlobalMetrics] = useState<any[]>([]);
  const [metricsSearchQuery, setMetricsSearchQuery] = useState("");
  const [isAddMetricModalOpen, setIsAddMetricModalOpen] = useState(false);
  const [newMetric, setNewMetric] = useState({
    name: "",
    unit: "",
    key: "",
    icon: "Activity",
    color: "#64748b",
  });
  const [isDeleteEntireMetricConfirmOpen, setIsDeleteEntireMetricConfirmOpen] =
    useState(false);
  const [metricKeyToDelete, setMetricKeyToDelete] = useState<string | null>(
    null,
  );
  const [portalOverview, setPortalOverview] =
    useState<PatientPortalOverview | null>(null);
  const [isPortalInviteModalOpen, setIsPortalInviteModalOpen] = useState(false);
  const [portalInviteDays, setPortalInviteDays] = useState("7");
  const [generatedPortalLink, setGeneratedPortalLink] = useState("");
  const [generatedPortalCode, setGeneratedPortalCode] = useState("");
  const [isCreatingPortalInvite, setIsCreatingPortalInvite] = useState(false);
  const [isCopyingPortalLink, setIsCopyingPortalLink] = useState(false);
  const [isPortalNotificationModalOpen, setIsPortalNotificationModalOpen] =
    useState(false);
  const [portalNotificationTitle, setPortalNotificationTitle] = useState("");
  const [portalNotificationMessage, setPortalNotificationMessage] =
    useState("");
  const [portalNotificationSendEmail, setPortalNotificationSendEmail] =
    useState(true);
  const [isCreatingPortalNotification, setIsCreatingPortalNotification] =
    useState(false);
  const [portalFilter, setPortalFilter] = useState({
    from: "",
    to: "",
    kind: "ALL" as "ALL" | "QUESTION" | "TRACKING" | "NOTIFICATION" | "REPLY",
    section: "ALL" as
      | "ALL"
      | "alimentacion"
      | "suplementos"
      | "actividadFisica",
    search: "",
  });
  const [replyTarget, setReplyTarget] = useState<PatientPortalEntry | null>(
    null,
  );
  const [replyMessage, setReplyMessage] = useState("");
  const [isSubmittingPortalReply, setIsSubmittingPortalReply] = useState(false);

  const [isDeletePatientConfirmOpen, setIsDeletePatientConfirmOpen] =
    useState(false);
  const [isDeleteConsultationConfirmOpen, setIsDeleteConsultationConfirmOpen] =
    useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState<
    string | null
  >(null);
  const [activeAcompTab, setActiveAcompTab] = useState<
    "diario" | "preguntas" | "planes" | "notificaciones" | "mensajes"
  >("diario");

  useEffect(() => {
    if (searchParams.get("tab")?.toLowerCase() === "acompanamiento") {
      setActiveTab("Acompañamiento");
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "Ficha clínica" && patient && !hasLoadedClinicalRecord) {
      void fetchClinicalRecord();
    }
  }, [activeTab, patient, hasLoadedClinicalRecord]);

  const [portalMessageText, setPortalMessageText] = useState("");
  const [isCreatingPortalMessage, setIsCreatingPortalMessage] = useState(false);

  const isAnyModalOpen =
    isMetricModalOpen || !!selectedConsultation || isEditMetricHistoryModalOpen;
  useScrollLock(isAnyModalOpen);

  const openProgressExportModal = () => {
    setExportIncludeClinicalRecord(false);
    setExportIncludeProgress(true);
    setIsExportModalOpen(true);
  };

  const openClinicalRecordExportModal = () => {
    setExportIncludeClinicalRecord(true);
    setExportIncludeProgress(false);
    setIsExportModalOpen(true);
  };

  const prepareChartData = () => {
    const dataPoints: any[] = [];
    const hasHistoricalWeight = hasHistoricalMetricKey(consultations, "weight");
    const hasHistoricalHeight = hasHistoricalMetricKey(consultations, "height");

    if (patient) {
      const baseline: any = {
        date: new Date(patient.createdAt || Date.now()).toLocaleDateString(
          "es-ES",
          { day: "2-digit", month: "short" },
        ),
        fullDate: new Date(patient.createdAt || Date.now()).toLocaleDateString(
          "es-ES",
          { day: "2-digit", month: "2-digit", year: "numeric" },
        ),
        isBaseline: true,
      };

      let hasBaselineData = false;
      if (patient.weight && !hasHistoricalWeight) {
        baseline["weight"] = patient.weight;
        hasBaselineData = true;
      }

      if (patient.height && !hasHistoricalHeight) {
        baseline["height"] = patient.height;
        hasBaselineData = true;
      }

      if (hasBaselineData) dataPoints.push(baseline);
    }

    if (Array.isArray(consultations)) {
      const consultationPoints = [...consultations]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((c) => {
          const dateOnly = toDateOnly(c.date);
          const data: any = {
            date: formatDateOnlyForLocale(dateOnly, {
              day: "2-digit",
              month: "short",
            }),
            fullDate: formatDateOnlyForLocale(dateOnly, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            sortDate: dateOnly,
          };
          if (Array.isArray(c.metrics)) {
            c.metrics.forEach((m) => {
              const mKey = normalizeMetricKey(m.label, m.key);
              if (!mKey) return;

              const rawValue =
                typeof m.value === "string"
                  ? m.value.replace(",", ".")
                  : m.value;
              const val = parseFloat(rawValue as string);

              if (!isNaN(val)) {
                data[mKey] = val;
              }
            });
          }
          return data;
        });
      dataPoints.push(...consultationPoints);
    }

    return dataPoints.sort((a, b) => {
      const toTimestamp = (dateOnly: string) => {
        const [year, month, day] = dateOnly.split("-").map(Number);
        if (!year || !month || !day) return 0;
        return Date.UTC(year, month - 1, day, 12, 0, 0);
      };

      const dateA = a.isBaseline
        ? toDateOnly(patient?.createdAt || "")
        : (a.sortDate as string);
      const dateB = b.isBaseline
        ? toDateOnly(patient?.createdAt || "")
        : (b.sortDate as string);

      return toTimestamp(dateA) - toTimestamp(dateB);
    });
  };

  const registeredMetricKeys = useMemo(() => {
    const keys = new Set<string>();
    consultations.forEach((c) => {
      if (Array.isArray(c.metrics)) {
        c.metrics.forEach((m) => {
          const mk = normalizeMetricKey(m.label, m.key);
          if (mk) keys.add(mk);
        });
      }
    });
    if (patient) {
      if (patient.weight) keys.add("weight");
      if (patient.height) keys.add("height");
      if (Array.isArray(patient.customVariables)) {
        patient.customVariables.forEach((cv: any) => {
          const mk = normalizeMetricKey(cv.label, cv.key);
          if (mk) keys.add(mk);
        });
      }
    }
    return Array.from(keys);
  }, [consultations, patient]);

  const getAllMetricKeys = () => {
    return registeredMetricKeys;
  };

  const getMetricInfo = (key: string) => {
    const presets: Record<
      string,
      { label: string; unit: string; color: string; icon: any }
    > = {
      weight: { label: "Peso", unit: "kg", color: "#3b82f6", icon: Weight },
      height: { label: "Altura", unit: "cm", color: "#6366f1", icon: Ruler },
      body_fat: {
        label: "Grasa Corporal",
        unit: "%",
        color: "#10b981",
        icon: Activity,
      },
      muscle_mass: {
        label: "Masa Muscular",
        unit: "kg",
        color: "#f59e0b",
        icon: Dumbbell,
      },
      visceral_fat: {
        label: "Grasa Visceral",
        unit: "lvl",
        color: "#ef4444",
        icon: Zap,
      },
      waist: { label: "Cintura", unit: "cm", color: "#ec4899", icon: Target },
    };

    if (presets[key]) return presets[key];

    for (const c of consultations) {
      const m = (c.metrics as any[])?.find(
        (m) => normalizeMetricKey(m.label, m.key) === key,
      );
      if (m)
        return {
          label: m.label,
          unit: m.unit || "",
          color: "#64748b",
          icon: Activity,
        };
    }

    if (patient && Array.isArray(patient.customVariables)) {
      const cv = (patient.customVariables as any[])?.find(
        (v) => normalizeMetricKey(v.label, v.key) === key,
      );
      if (cv) {
        return {
          label: cv.label,
          unit: cv.unit || "",
          color: "#64748b",
          icon: Activity,
        };
      }
    }

    return { label: key, unit: "", color: "#64748b", icon: Activity };
  };

  const token =
    Cookies.get("auth_token") ||
    (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);

  const fetchPatient = async (retries = 3) => {
    setIsLoading(true);
    try {
      const response = await fetchApi(`/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPatient(data);
      } else {
        toast.error("Paciente no encontrado");
        router.push("/dashboard/pacientes");
      }
    } catch (e) {
      if (retries > 0) {
        setTimeout(() => fetchPatient(retries - 1), 2000);
      } else {
        toast.error("Error al cargar datos del paciente");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConsultations = async () => {
    setIsConsultationsLoading(true);
    try {
      const response = await fetchApi(
        `/consultations?patientId=${id}&limit=50&type=ALL&t=${Date.now()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const result: ConsultationsResponse = await response.json();
        setConsultations(result.data);
      }
    } catch (error) {
      console.error("Error fetching consultations", error);
    } finally {
      setIsConsultationsLoading(false);
    }
  };

  const fetchGlobalMetrics = async () => {
    try {
      const response = await fetchApi(`/metrics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setGlobalMetrics(data);
      }
    } catch (error) {
      console.error("Error fetching global metrics", error);
    }
  };

  const fetchPortalOverview = async () => {
    try {
      const response = await fetchApi(
        `/patient-portals/patients/${id}/overview`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data: PatientPortalOverview = await response.json();
        setPortalOverview(data);
      }
    } catch (error) {
      console.error("Error fetching portal overview", error);
    }
  };

  const fetchClinicalRecord = useCallback(async () => {
    if (!patient || isClinicalRecordLoading || hasLoadedClinicalRecord) {
      return;
    }

    setIsClinicalRecordLoading(true);
    try {
      const response = await fetchApi(`/patients/${id}/clinical-record`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: ClinicalRecord = await response.json();
        setClinicalRecord(data);
        setClinicalRecordDraft(buildClinicalRecordDraft(patient, data));
      } else {
        setClinicalRecordDraft(buildClinicalRecordDraft(patient, null));
      }
    } catch (error) {
      console.error("Error fetching clinical record", error);
      setClinicalRecordDraft(buildClinicalRecordDraft(patient, null));
      setHasLoadedClinicalRecord(true);
      setIsClinicalRecordLoading(false);
      return;
    } finally {
      setHasLoadedClinicalRecord(true);
      setIsClinicalRecordLoading(false);
    }
  }, [hasLoadedClinicalRecord, id, isClinicalRecordLoading, patient, token]);

  const saveClinicalRecord = useCallback(async () => {
    if (!patient) return;

    setIsClinicalRecordSaving(true);
    try {
      const response = await fetchApi(`/patients/${id}/clinical-record`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(serializeClinicalRecordDraft(clinicalRecordDraft)),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar la ficha clínica");
      }

      const data: ClinicalRecord = await response.json();
      setClinicalRecord(data);
      setClinicalRecordDraft(buildClinicalRecordDraft(patient, data));
      toast.success("Ficha clínica guardada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar la ficha clínica");
    } finally {
      setIsClinicalRecordSaving(false);
    }
  }, [clinicalRecordDraft, id, patient, token]);

  const smartMetrics = useMemo(
    () => [
      { key: "weight", label: "Peso", unit: "kg", icon: Weight, color: "#3b82f6" },
      { key: "height", label: "Altura", unit: "cm", icon: Ruler, color: "#6366f1" },
      { key: "body_fat", label: "Grasa Corporal", unit: "%", icon: Activity, color: "#10b981" },
      { key: "muscle_mass", label: "Masa Muscular", unit: "kg", icon: Dumbbell, color: "#f59e0b" },
      { key: "visceral_fat", label: "Grasa Visceral", unit: "lvl", icon: Zap, color: "#ef4444" },
      { key: "waist", label: "Cintura", unit: "cm", icon: Target, color: "#ec4899" },
    ],
    [],
  );

  const availableMetricSuggestions = useMemo(() => {
    const combined = [...smartMetrics];
    globalMetrics.forEach((gm) => {
      const gmKey = normalizeMetricKey(gm.name, gm.key);
      if (
        !combined.some(
          (sm) =>
            sm.key === gmKey ||
            sm.label.toLowerCase() === gm.name.toLowerCase(),
        )
      ) {
        combined.push({
          key: gmKey,
          label: gm.name,
          unit: gm.unit,
          icon: Activity,
          color: "#64748b",
        });
      }
    });
    return combined;
  }, [globalMetrics, smartMetrics]);

  const clinicalConsultations = useMemo(() => {
    return consultations.filter((c) => !isIndependentMetricsConsultation(c));
  }, [consultations]);

  useEffect(() => {
    if (id) {
      fetchPatient();
      fetchConsultations();
      fetchGlobalMetrics();
      fetchPortalOverview();
    }
  }, [id]);

  const automaticNutritionCalculations = useMemo(() => {
    const variables = Array.isArray(patient?.customVariables)
      ? (patient.customVariables as any[])
      : [];
    const stored = variables.find(
      (item) => item?.key === "automaticNutritionCalculations",
    )?.value;
    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? stored
      : null;
  }, [patient?.customVariables]);

  const handleEdit = () => {
    if (!patient) return;
    setEditForm(patient);
    setIsEditing(true);
  };

  const handleCreatePortalInvite = async () => {
    if (!patient) return;

    if (!patient.email?.trim()) {
      toast.error("Este paciente no tiene un correo registrado.");
      return;
    }

    const expiresInDays = Number(portalInviteDays);
    setIsCreatingPortalInvite(true);
    try {
      const response = await fetchApi(
        `/patient-portals/patients/${patient.id}/invitations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            expiresInDays:
              Number.isFinite(expiresInDays) && expiresInDays > 0
                ? Math.min(expiresInDays, 7)
                : 7,
          }),
        },
      );

      const data: PortalInviteResponse = await response.json();
      if (!response.ok) {
        throw new Error(
          (data as any)?.message || "No se pudo generar la invitación",
        );
      }

      setGeneratedPortalLink(data.shareUrl);
      setGeneratedPortalCode(data.accessCode);
      setPortalInviteDays("7");
      await fetchPortalOverview();
      toast.success(`Acceso generado con éxito. Ya puedes compartir el link.`);
    } catch (error: any) {
      toast.error(error?.message || "No se pudo generar la invitación.");
    } finally {
      setIsCreatingPortalInvite(false);
    }
  };

  const handleCopyPortalLink = async (value?: string) => {
    const link = value || generatedPortalLink;
    if (!link) return;

    setIsCopyingPortalLink(true);
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado al portapapeles.");
    } catch (error) {
      toast.error("No se pudo copiar automáticamente.");
    } finally {
      setIsCopyingPortalLink(false);
    }
  };

  const handleCreatePortalNotification = async () => {
    if (!patient) return;

    const message = portalNotificationMessage.trim();
    if (!message) {
      toast.error("Escribe un mensaje para la notificación.");
      return;
    }

    setIsCreatingPortalNotification(true);
    try {
      const response = await fetchApi(
        `/patient-portals/patients/${patient.id}/notifications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: portalNotificationTitle.trim() || undefined,
            message,
            sendEmail: portalNotificationSendEmail,
          }),
        },
      );

      const data: { overview?: PatientPortalOverview; message?: string } =
        await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "No se pudo enviar la notificación.");
      }

      if (data.overview) {
        setPortalOverview(data.overview);
      } else {
        await fetchPortalOverview();
      }

      setPortalNotificationTitle("");
      setPortalNotificationMessage("");
      setPortalNotificationSendEmail(true);
      setIsPortalNotificationModalOpen(false);
      toast.success("Notificación enviada por correo al paciente.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreatingPortalNotification(false);
    }
  };

  const handleCreatePortalMessage = async () => {
    if (!patient) return;
    const message = portalMessageText.trim();
    if (!message) {
      toast.error("Escribe un mensaje para tu paciente.");
      return;
    }

    setIsCreatingPortalMessage(true);
    try {
      const response = await fetchApi(
        `/patient-portals/patients/${patient.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message }),
        },
      );

      const data: { overview?: PatientPortalOverview; message?: string } =
        await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "No se pudo enviar el mensaje.");
      }

      if (data.overview) {
        setPortalOverview(data.overview);
      } else {
        await fetchPortalOverview();
      }

      setPortalMessageText("");
      toast.success("Mensaje publicado en el portal del paciente.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreatingPortalMessage(false);
    }
  };

  const handleTogglePortalAccess = async (status: "ACTIVE" | "BLOCKED") => {
    if (!patient) return;

    try {
      const response = await fetchApi(
        `/patient-portals/patients/${patient.id}/access-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      const data: { overview?: PatientPortalOverview; message?: string } =
        await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "No se pudo actualizar el acceso.");
      }

      if (data.overview) {
        setPortalOverview(data.overview);
      } else {
        await fetchPortalOverview();
      }

      toast.success(
        status === "BLOCKED" ? "Acceso bloqueado." : "Acceso reactivado.",
      );
    } catch (error: any) {
      toast.error(error?.message || "No se pudo cambiar el estado del portal.");
    }
  };

  const handleReplyPortalQuestion = async () => {
    if (!patient || !replyTarget || !replyMessage.trim()) {
      return;
    }

    setIsSubmittingPortalReply(true);
    try {
      const response = await fetchApi(
        `/patient-portals/patients/${patient.id}/replies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionId: replyTarget.id,
            message: replyMessage.trim(),
          }),
        },
      );

      const data: { overview?: PatientPortalOverview; message?: string } =
        await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "No se pudo guardar la respuesta.");
      }

      if (data.overview) {
        setPortalOverview(data.overview);
      } else {
        await fetchPortalOverview();
      }

      setReplyTarget(null);
      setReplyMessage("");
      toast.success("Respuesta enviada al portal del paciente.");
    } catch (error: any) {
      toast.error(error?.message || "No se pudo enviar la respuesta.");
    } finally {
      setIsSubmittingPortalReply(false);
    }
  };

  const resetMetricForm = (metrics: Metric[] = []) => {
    setMetricForm({
      date: getTodayDateInputValue(),
      metrics,
    });
  };

  const createMetricDraft = (metricKey: string): Metric => {
    const info = getMetricInfo(metricKey);
    return {
      key: metricKey,
      label: info.label,
      unit: info.unit,
      value: "",
    };
  };

  const openMetricLogger = (metricKey?: string) => {
    resetMetricForm(metricKey ? [createMetricDraft(metricKey)] : []);
    setConflictingConsultationId(null);
    setIsOverwriteConfirmOpen(false);
    setIsMetricModalOpen(true);
  };

  const closeMetricLogger = () => {
    setIsMetricModalOpen(false);
    setConflictingConsultationId(null);
    setIsOverwriteConfirmOpen(false);
    resetMetricForm();
  };

  const handleSaveMetricsClick = () => {
    if (!patient) return;

    const incompleteMetrics = metricForm.metrics.filter(
      (m) =>
        m.label.trim() !== "" &&
        (m.value === undefined ||
          m.value === null ||
          m.value.toString().trim() === ""),
    );
    if (incompleteMetrics.length > 0) {
      toast.error(
        `La métrica "${incompleteMetrics[0].label}" debe tener un valor.`,
      );
      return;
    }

    const validMetrics = metricForm.metrics.filter(
      (m) =>
        m.label.trim() !== "" &&
        m.value !== undefined &&
        m.value !== null &&
        m.value.toString().trim() !== "",
    );

    if (validMetrics.length === 0) {
      toast.error("Agrega al menos una métrica con valor");
      return;
    }

    const existingSameDayConsultation = consultations.find(
      (c) =>
        isIndependentMetricsConsultation(c) &&
        toDateOnly(c.date) === metricForm.date,
    );

    if (existingSameDayConsultation) {
      const existingMetricKeys = new Set(
        (existingSameDayConsultation.metrics || []).map((metric) =>
          normalizeMetricKey(metric.label, metric.key),
        ),
      );
      const hasOverlappingMetric = validMetrics.some((metric) =>
        existingMetricKeys.has(normalizeMetricKey(metric.label, metric.key)),
      );

      if (hasOverlappingMetric) {
        setConflictingConsultationId(existingSameDayConsultation.id);
        setIsOverwriteConfirmOpen(true);
        return;
      }

      executeSaveMetrics(existingSameDayConsultation.id);
    } else {
      executeSaveMetrics();
    }
  };

  const confirmSaveMetrics = () => {
    setIsOverwriteConfirmOpen(false);
    executeSaveMetrics(conflictingConsultationId);
  };

  const executeSaveMetrics = async (
    updateConsultationId: string | null = null,
  ) => {
    try {
      if (updateConsultationId) {
        const existingConsultation = consultations.find(
          (c) => c.id === updateConsultationId,
        );
        const mergedMetrics = [...(existingConsultation?.metrics || [])];

        const validMetrics = metricForm.metrics.filter(
          (m) =>
            m.label.trim() !== "" &&
            m.value !== undefined &&
            m.value !== null &&
            m.value.toString().trim() !== "",
        );

        validMetrics.forEach((m) => {
          const normKey = normalizeMetricKey(m.label, m.key);
          const idx = mergedMetrics.findIndex(
            (em) => normalizeMetricKey(em.label, em.key) === normKey,
          );
          if (idx !== -1) {
            mergedMetrics[idx] = {
              ...mergedMetrics[idx],
              value: m.value,
              unit: m.unit,
            };
          } else {
            mergedMetrics.push({ ...m, key: normKey });
          }
        });

        const response = await fetchApi(
          `/consultations/${updateConsultationId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ metrics: mergedMetrics }),
          },
        );

        if (response.ok) {
          toast.success("Métricas actualizadas correctamente");
          closeMetricLogger();
          setConflictingConsultationId(null);
          await Promise.all([fetchConsultations(), fetchPatient()]);
        } else {
          toast.error("Error al actualizar métricas");
        }
      } else {
        const response = await fetchApi(`/consultations`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientId: id,
            date: metricForm.date,
            title: "Registro de Métricas Independiente",
            description: "Entrada manual de datos de seguimiento.",
            metrics: metricForm.metrics
              .filter(
                (m) =>
                  m.label.trim() !== "" &&
                  m.value !== undefined &&
                  m.value !== null &&
                  m.value.toString().trim() !== "",
              )
              .map((m) => ({
                ...m,
                key: normalizeMetricKey(m.label, m.key),
              })),
          }),
        });

        if (response.ok) {
          const newConsultation = await response.json();
          toast.success("Métricas registradas correctamente");
          closeMetricLogger();
          setConflictingConsultationId(null);
          setConsultations((prev) => [newConsultation, ...prev]);
          await Promise.all([fetchConsultations(), fetchPatient()]);
        } else {
          toast.error("Error al guardar métricas");
        }
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleCreateGlobalMetric = async () => {
    if (!newMetric.name || !newMetric.unit) {
      toast.error("Nombre y unidad son requeridos");
      return;
    }

    const exists = availableMetricSuggestions.find(
      (s) => s.label.toLowerCase() === newMetric.name.toLowerCase(),
    );
    if (exists) {
      toast.info(
        `La métrica "${newMetric.name}" ya existe con la unidad "${exists.unit}". No es necesario crearla.`,
      );
      return;
    }

    try {
      const response = await fetchApi(`/metrics`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMetric),
      });

      if (response.ok) {
        toast.success("Métrica global creada");
        setIsAddMetricModalOpen(false);
        setNewMetric({
          name: "",
          unit: "",
          key: "",
          icon: "Activity",
          color: "#64748b",
        });
        fetchGlobalMetrics();
      } else {
        const err = await response.json().catch(() => ({}));
        if (response.status === 400 || response.status === 409) {
          toast.info(err.message || "Esta métrica ya existe en el sistema.");
        } else {
          toast.error(err.message || "Error al crear la métrica");
        }
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const metricHistory = useMemo(() => {
    if (!editingMetricKey) return [];

    const history: any[] = [];
    const hasHistoricalWeight = hasHistoricalMetricKey(consultations, "weight");
    const hasHistoricalHeight = hasHistoricalMetricKey(consultations, "height");

    if (
      editingMetricKey === "weight" &&
      patient?.weight &&
      !hasHistoricalWeight
    ) {
      history.push({
        id: "baseline-weight",
        date: patient.createdAt || new Date().toISOString(),
        value: patient.weight.toString(),
        unit: "kg",
        label: "Peso Inicial (Perfil)",
        isBaseline: true,
      });
    }

    if (
      editingMetricKey === "height" &&
      patient?.height &&
      !hasHistoricalHeight
    ) {
      history.push({
        id: "baseline-height",
        date: patient.createdAt || new Date().toISOString(),
        value: patient.height.toString(),
        unit: "cm",
        label: "Altura Inicial (Perfil)",
        isBaseline: true,
      });
    }

    consultations.forEach((c) => {
      if (Array.isArray(c.metrics)) {
        c.metrics.forEach((m, idx) => {
          const mk = normalizeMetricKey(m.label, m.key);
          if (mk === editingMetricKey) {
            history.push({
              id: c.id,
              date: c.date,
              value: m.value?.toString() || "",
              unit: m.unit || "",
              label: m.label,
              metricIndex: idx,
              consultationTitle: c.title,
            });
          }
        });
      }
    });

    return history.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [editingMetricKey, consultations, patient]);

  const onDeleteMetricRecord = async (record: any) => {
    if (record.isBaseline) {
      try {
        const res = await fetchApi(`/patients/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ weight: null }),
        });

        if (res.ok) {
          const updated = await res.json();
          setPatient(updated);
          toast.success("Registro base de peso eliminado");
          return;
        }
        toast.error("Error al eliminar el registro base");
        return;
      } catch {
        toast.error("Error de conexión");
        return;
      }
    }
    try {
      const consultation = consultations.find((c) => c.id === record.id);
      if (!consultation) return;

      const newMetrics = (consultation.metrics || []).filter(
        (_: any, idx: number) => idx !== record.metricIndex,
      );

      let res: Response;
      const isIndependentRegistry =
        isIndependentMetricsConsultation(consultation);

      if (newMetrics.length === 0 && isIndependentRegistry) {
        res = await fetchApi(`/consultations/${record.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        res = await fetchApi(`/consultations/${record.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ metrics: newMetrics }),
        });
      }

      if (res.ok) {
        if (newMetrics.length === 0 && isIndependentRegistry) {
          setConsultations((prev) => prev.filter((c) => c.id !== record.id));
        } else {
          const updated = await res.json();
          setConsultations((prev) =>
            prev.map((c) => (c.id === record.id ? updated : c)),
          );
        }
        toast.success("Registro eliminado del historial");
      } else {
        toast.error("Error al eliminar el registro");
      }
    } catch (e) {
      toast.error("Error de conexión");
    }
  };

  const onSaveMetricEdit = async (
    record: any,
    newValue: string,
    newDate: string,
  ) => {
    try {
      if (record.isBaseline) {
        const parsedValue = parseFloat(newValue.replace(",", "."));
        if (Number.isNaN(parsedValue)) {
          toast.error("Ingresa un valor válido");
          return;
        }

        if (editingMetricKey !== "weight" && editingMetricKey !== "height") {
          toast.error("Esta métrica base no se puede editar desde aquí");
          return;
        }

        const baselineDate = new Date(record.date).toISOString().split("T")[0];
        const editedDate = new Date(newDate).toISOString().split("T")[0];
        const changedDate = baselineDate !== editedDate;

        const metricInfo = getMetricInfo(editingMetricKey);

        const profileRes = await fetchApi(`/patients/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            [editingMetricKey]: parsedValue,
          }),
        });

        if (!profileRes.ok) {
          toast.error("Error al actualizar el perfil");
          return;
        }

        if (changedDate) {
          const consultationRes = await fetchApi(`/consultations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              patientId: id,
              date: newDate,
              title: "Registro de Métricas Independiente",
              description: "Entrada manual de datos de seguimiento.",
              metrics: [
                {
                  key: editingMetricKey,
                  label: metricInfo.label,
                  value: parsedValue.toString(),
                  unit: metricInfo.unit,
                },
              ],
            }),
          });

          if (!consultationRes.ok) {
            toast.error("Error al guardar el nuevo registro histórico");
            return;
          }
        }

        const updated = await profileRes.json();
        setPatient(updated);
        await fetchConsultations();
        toast.success(
          changedDate
            ? `${metricInfo.label} actualizado y convertido a registro histórico editable`
            : "Valor del perfil actualizado",
        );
      } else {
        const consultation = consultations.find((c) => c.id === record.id);
        if (!consultation) return;

        const newMetrics = [...(consultation.metrics || [])];
        newMetrics[record.metricIndex] = {
          ...newMetrics[record.metricIndex],
          value: newValue,
        };

        const res = await fetchApi(`/consultations/${record.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ metrics: newMetrics, date: newDate }),
        });

        if (res.ok) {
          const updated = await res.json();
          setConsultations((prev) =>
            prev.map((c) => (c.id === record.id ? updated : c)),
          );
          toast.success("Registro histórico actualizado");
        } else {
          toast.error("Error al actualizar la consulta");
        }
      }
    } catch (e) {
      toast.error("Error al guardar cambios históricos");
    }
  };

  const addMetricToForm = () => {
    setMetricForm((prev) => ({
      ...prev,
      metrics: [...prev.metrics, { label: "", value: "", unit: "" }],
    }));
  };

  const addSmartMetricToForm = (metric: any) => {
    const metricKey = normalizeMetricKey(metric.label, metric.key);
    const isDuplicate = metricForm.metrics.some(
      (m) => normalizeMetricKey(m.label, m.key) === metricKey,
    );

    if (isDuplicate) {
      toast.error(`${metric.label} ya está en la lista`);
      return;
    }

    setMetricForm((prev) => ({
      ...prev,
      metrics: [
        ...prev.metrics,
        { label: metric.label, unit: metric.unit, value: "", key: metric.key },
      ],
    }));
  };

  const updateMetricInForm = (
    index: number,
    field: keyof Metric,
    value: string,
  ) => {
    const newMetrics = [...metricForm.metrics];
    const updatedMetric = { ...newMetrics[index], [field]: value };

    if (field === "label") {
      const known = availableMetricSuggestions.find(
        (s) =>
          s.label.toLowerCase() === value.toLowerCase() ||
          s.key === normalizeMetricKey(value, ""),
      );
      if (known) {
        updatedMetric.unit = known.unit;
        updatedMetric.key = known.key;
      }
    }

    newMetrics[index] = updatedMetric;
    setMetricForm((prev) => ({ ...prev, metrics: newMetrics }));
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let currentY = 20;
      const includeClinical = exportIncludeClinicalRecord;
      const includeProgress = exportIncludeProgress;
      if (!includeClinical && !includeProgress) {
        toast.error("Selecciona al menos una sección para exportar");
        return;
      }
      const reportTitle =
        includeClinical && includeProgress
          ? "INFORME CLÍNICO Y EVOLUCIÓN"
          : includeClinical
            ? "FICHA CLÍNICA"
            : "INFORME DE EVOLUCIÓN";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129);
      doc.text(reportTitle, margin, currentY);
      currentY += 10;

      doc.setFontSize(14);
      doc.setTextColor(51, 65, 85);
      doc.text(`Paciente: ${patient?.fullName || "Sin Nombre"}`, margin, currentY);
      currentY += 7;

      if (includeClinical) {
        const writeLine = (label: string, value?: string | number | boolean | null) => {
          if (value === undefined || value === null || value === "" || value === false) return;
          const text = `${label}: ${value}`;
          const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
          if (currentY + lines.length * 5 > 270) {
            doc.addPage();
            currentY = 20;
          }
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105);
          doc.text(lines, margin, currentY);
          currentY += lines.length * 5;
        };

        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text("FICHA CLÍNICA", margin, currentY);
        currentY += 8;

        writeLine("Ocupación", clinicalRecordDraft.vitalHistory.occupation);
        writeLine("Horario laboral", clinicalRecordDraft.vitalHistory.workSchedule);
        writeLine("Medicamentos", clinicalRecordDraft.vitalHistory.medications);
        writeLine("Suplementos / drogas", clinicalRecordDraft.vitalHistory.supplementsOrDrugs);
        writeLine("Patologías", clinicalRecordDraft.vitalHistory.diagnosedPathologies);
        writeLine("Embarazo", clinicalRecordDraft.gynecoObstetric.isPregnant ? "Sí" : null);
        writeLine("Semanas de gestación", clinicalRecordDraft.gynecoObstetric.pregnancyWeeks);
        writeLine(
          "Peso pre-gestacional",
          clinicalRecordDraft.gynecoObstetric.pregestationalWeight
            ? `${clinicalRecordDraft.gynecoObstetric.pregestationalWeight} kg`
            : null,
        );
        writeLine("Frecuencia alimentaria", clinicalRecordDraft.nutritionalAnamnesis.foodFrequency);
        writeLine("Recordatorio 24h", clinicalRecordDraft.nutritionalAnamnesis.recall24h);
        writeLine("Preferencias", clinicalRecordDraft.nutritionalAnamnesis.eatingPreferences);
        writeLine("Observaciones", clinicalRecordDraft.nutritionalAnamnesis.clinicalObservations);

        writeLine("Pliegue tricipital", clinicalRecordDraft.anthropometry.skinfolds.tricipital);
        writeLine("Pliegue bicipital", clinicalRecordDraft.anthropometry.skinfolds.bicipital);
        writeLine("Pliegue subescapular", clinicalRecordDraft.anthropometry.skinfolds.subescapular);
        writeLine("Pliegue suprailiaco", clinicalRecordDraft.anthropometry.skinfolds.suprailiac);
        writeLine("Altura de rodilla", clinicalRecordDraft.anthropometry.circumferences.kneeHeight);
        writeLine("Pantorrilla", clinicalRecordDraft.anthropometry.circumferences.calfCircumference);
        writeLine("Braquial", clinicalRecordDraft.anthropometry.circumferences.armCircumference);
        writeLine("Cintura", clinicalRecordDraft.anthropometry.circumferences.waistCircumference);
        writeLine("Cadera", clinicalRecordDraft.anthropometry.circumferences.hipCircumference);

        currentY += 6;
      }

      if (includeProgress) {
        const chartData = prepareChartData();
        if (chartData.length > 0) {
          const first = chartData[0].fullDate;
          const last = chartData[chartData.length - 1].fullDate;
          doc.setFontSize(10);
          doc.setTextColor(148, 163, 184);
          doc.text(`Periodo: ${first} - ${last}`, margin, currentY);
          currentY += 15;
        }

        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text("RESUMEN DE CAMBIOS", margin, currentY);
        currentY += 8;
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 10;

        const metricKeys = getAllMetricKeys();
        for (const key of metricKeys) {
          const info = getMetricInfo(key);
          const filtered = chartData.filter((d) => d[key] !== undefined);
          if (filtered.length >= 2) {
            const first = filtered[0][key];
            const last = filtered[filtered.length - 1][key];
            const diff = (Number(last) - Number(first)).toFixed(1);
            const color = Number(diff) < 0 ? [225, 29, 72] : [16, 185, 129];

            doc.setFontSize(10);
            doc.setTextColor(71, 85, 105);
            doc.text(`${info.label}:`, margin, currentY);

            doc.setFont("helvetica", "normal");
            doc.text(
              `Inicio: ${first}${info.unit} -> Final: ${last}${info.unit}`,
              margin + 60,
              currentY,
            );

            doc.setFont("helvetica", "bold");
            // @ts-ignore
            doc.setTextColor(...color);
            doc.text(
              `${Number(diff) > 0 ? "+" : ""}${diff}${info.unit}`,
              pageWidth - margin - 20,
              currentY,
              { align: "right" },
            );

            currentY += 8;
            if (currentY > 270) {
              doc.addPage();
              currentY = 20;
            }
          }
        }

        currentY += 15;

        for (const key of metricKeys) {
          const container = document.getElementById(`export-chart-${key}`);
          if (container) {
            if (currentY > 180) {
              doc.addPage();
              currentY = 20;
            }

            const imgData = await domToPng(container, {
              scale: 2,
              backgroundColor: "#ffffff",
              filter: (node) => {
                if (node instanceof HTMLElement && node.dataset.noExport) {
                  return false;
                }
                return true;
              },
            });

            const info = getMetricInfo(key);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(30, 41, 59);
            doc.text(`Gráfico: ${info.label} (${info.unit})`, margin, currentY);
            currentY += 5;

            const imgWidth = pageWidth - margin * 2;
            const { width, height } = container.getBoundingClientRect();
            const imgHeight = (height * imgWidth) / width;

            doc.addImage(imgData, "PNG", margin, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 15;
          }
        }
      }

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Generado automáticamente por NutriNet - ${new Date().toLocaleDateString("es-ES")}`,
        margin,
        285,
      );

      doc.save(
        `${(includeClinical ? "Ficha_" : "Evolucion_")}${(patient?.fullName || "Paciente").replace(/\s+/g, "_")}.pdf`,
      );
      toast.success("PDF generado correctamente");
      setIsExportModalOpen(false);
    } catch (error) {
      console.error("PDF Error:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const removeMetricFromForm = (index: number) => {
    const newMetrics = [...metricForm.metrics];
    newMetrics.splice(index, 1);
    setMetricForm((prev) => ({ ...prev, metrics: newMetrics }));
  };

  const handleDeleteEntireMetric = async () => {
    if (!metricKeyToDelete) return;
    setIsDeleteEntireMetricConfirmOpen(false);

    const key = metricKeyToDelete;
    try {
      const isAnthropometricMetric = key === "weight" || key === "height";
      const hasInCustomVars =
        patient?.customVariables &&
        (patient.customVariables as any[]).some(
          (cv) => normalizeMetricKey(cv.label, cv.key) === key,
        );

      const consultationsToUpdate = consultations.filter((c) =>
        (c.metrics || []).some(
          (m) => normalizeMetricKey(m.label, m.key) === key,
        ),
      );

      if (
        consultationsToUpdate.length === 0 &&
        !isAnthropometricMetric &&
        !hasInCustomVars
      ) {
        toast.info("No hay registros históricos para eliminar");
        setMetricKeyToDelete(null);
        return;
      }

      const updatePromises = consultationsToUpdate.map(async (c) => {
        const newMetrics = (c.metrics || []).filter(
          (m) => normalizeMetricKey(m.label, m.key) !== key,
        );

        if (newMetrics.length === 0 && isIndependentMetricsConsultation(c)) {
          return fetchApi(`/consultations/${c.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        return fetchApi(`/consultations/${c.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ metrics: newMetrics }),
        });
      });

      const patientUpdates: any = {};
      let needsPatientUpdate = false;

      if (key === "weight" && patient?.weight) {
        patientUpdates.weight = null;
        needsPatientUpdate = true;
      }

      if (key === "height" && patient?.height) {
        patientUpdates.height = null;
        needsPatientUpdate = true;
      }

      if (patient && Array.isArray(patient.customVariables)) {
        const hasMetric = (patient.customVariables as any[]).some(
          (cv) => normalizeMetricKey(cv.label, cv.key) === key,
        );
        if (hasMetric) {
          patientUpdates.customVariables = (
            patient.customVariables as any[]
          ).filter((cv) => normalizeMetricKey(cv.label, cv.key) !== key);
          needsPatientUpdate = true;
        }
      }

      if (needsPatientUpdate) {
        updatePromises.push(
          fetchApi(`/patients/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(patientUpdates),
          }),
        );
      }

      const results = await Promise.all(updatePromises);
      const allOk = results.every((r) => r.ok);

      if (allOk) {
        toast.success(`Historial de ${getMetricInfo(key).label} eliminado`);
        await Promise.all([fetchConsultations(), fetchPatient()]);
      } else {
        toast.error("Algunos registros no pudieron actualizarse correctamente");
        fetchConsultations();
      }
    } catch (error) {
      toast.error("Error al eliminar el historial completo");
    } finally {
      setMetricKeyToDelete(null);
    }
  };

  const hasNutritionInputsChanged = () => {
    if (!patient) return false;
    return [
      "weight",
      "height",
      "birthDate",
      "gender",
      "activityLevel",
      "nutritionalFocus",
    ].some(
      (field) =>
        (editForm as any)[field] !== undefined &&
        (editForm as any)[field] !== (patient as any)[field],
    );
  };

  const handleSaveClick = () => {
    if (editForm.documentId && !validateRut(editForm.documentId)) {
      toast.error("El RUT ingresado no es válido.");
      return;
    }
    if (hasNutritionInputsChanged()) {
      setShowRecalculateSaveConfirm(true);
      return;
    }
    void handleSave(false);
  };

  const handleSave = async (recalculateNutrition = false) => {
    if (!patient || !editForm) return;

    try {
      const payload: any = {
        fullName: editForm.fullName,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        documentId: editForm.documentId || undefined,
        birthDate: editForm.birthDate
          ? new Date(editForm.birthDate).toISOString()
          : undefined,
        gender: editForm.gender || undefined,
        weight: editForm.weight !== undefined && editForm.weight !== null ? Number(editForm.weight) : undefined,
        height: editForm.height !== undefined && editForm.height !== null ? Number(editForm.height) : undefined,
        dietRestrictions: editForm.dietRestrictions || [],
        clinicalSummary: editForm.clinicalSummary || undefined,
        nutritionalFocus: editForm.nutritionalFocus || undefined,
        fitnessGoals: editForm.fitnessGoals || undefined,
        likes: editForm.likes || undefined,
        activityLevel: editForm.activityLevel || "sedentario",
        customVariables: Array.isArray(editForm.customVariables)
          ? editForm.customVariables.filter(
              (item: any) => item?.key !== "activityLevel",
            )
          : undefined,
        recalculateNutrition,
      };

      const response = await fetchApi(`/patients/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updated = await response.json();
        setPatient(updated);
        setIsEditing(false);
        toast.success("Perfil actualizado");
      } else {
        toast.error("Error al actualizar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleAutomaticNutritionRecalculation = async () => {
    if (!patient) return;
    setIsAutomaticNutritionLoading(true);
    try {
      const response = await fetchApi(
        `/patients/${patient.id}/automatic-calculations`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok)
        throw new Error("No se pudieron recalcular los valores");
      const updated = await response.json();
      setPatient(updated);
      setRecalcKey((key) => key + 1);
      toast.success(
        "Cálculos automáticos actualizados. Revisa los valores antes de usarlos clínicamente.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al recalcular",
      );
    } finally {
      setIsAutomaticNutritionLoading(false);
    }
  };

  const updateField = (field: keyof Patient, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+")) {
      val = "+" + val.replace(/\+/g, "");
    }
    const cleanVal = "+" + val.substring(1).replace(/\D/g, "");
    updateField("phone", cleanVal);
  };

  const normalizeActivityLevel = (value?: string | null): ActivityLevel => {
    const raw = String(value || "").toLowerCase();
    const keys = ["sedentario", "ligero", "moderado", "activo", "muy_activo"];
    if (keys.includes(raw)) {
      return raw as ActivityLevel;
    }
    return raw === "deportista" ? "activo" : "sedentario";
  };

  const getActivityLevelFromVariables = (vars: any[]) => {
    const raw = vars.find((item) => item?.key === "activityLevel")?.value;
    return normalizeActivityLevel(raw);
  };

  const getCurrentActivityLevel = () => {
    const directValue = isEditing
      ? editForm.activityLevel
      : patient?.activityLevel;
    if (directValue) return normalizeActivityLevel(directValue);
    const source = isEditing
      ? editForm.customVariables
      : patient?.customVariables;
    const vars = Array.isArray(source) ? (source as any[]) : [];
    return getActivityLevelFromVariables(vars);
  };

  const updateActivityLevel = (value: ActivityLevel) => {
    if (!isEditing) return;
    const vars = Array.isArray(editForm.customVariables)
      ? [...(editForm.customVariables as any[])]
      : [];
    updateField("activityLevel", value);
    updateField(
      "customVariables",
      vars.filter((item) => item?.key !== "activityLevel"),
    );
  };

  const handleDelete = async () => {
    try {
      const response = await fetchApi(`/patients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Paciente eliminado correctamente");
        router.push("/dashboard/pacientes");
      } else {
        toast.error("Error al eliminar paciente");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsDeletePatientConfirmOpen(false);
    }
  };

  const toggleStatus = async () => {
    if (!patient) return;
    const newStatus = patient.status === "Active" ? "Inactive" : "Active";

    try {
      const response = await fetchApi(`/patients/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updated = await response.json();
        setPatient(updated);
        toast.success(
          `Estado actualizado a ${newStatus === "Active" ? "Activo" : "Inactivo"}`,
        );
      }
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  const portalEntries = portalOverview?.entries || [];
  const filteredPortalEntries = useMemo(() => {
    const fromDate = portalFilter.from
      ? new Date(`${portalFilter.from}T00:00:00`)
      : null;
    const toDate = portalFilter.to
      ? new Date(`${portalFilter.to}T23:59:59.999`)
      : null;
    const search = portalFilter.search.trim().toLowerCase();

    return portalEntries.filter((entry) => {
      const createdAt = new Date(entry.createdAt);
      if (fromDate && createdAt < fromDate) return false;
      if (toDate && createdAt > toDate) return false;
      if (portalFilter.kind !== "ALL" && entry.kind !== portalFilter.kind)
        return false;

      const sections = entry.payload?.sections || {};
      if (portalFilter.section !== "ALL") {
        if (entry.kind !== "TRACKING") return false;
        if (!sections[portalFilter.section]) return false;
      }

      if (!search) return true;

      const haystack = [
        entry.body || "",
        entry.replyTo?.body || "",
        sections.alimentacion || "",
        sections.suplementos || "",
        sections.actividadFisica || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [portalEntries, portalFilter]);

  const filteredPortalQuestions = filteredPortalEntries.filter(
    (entry) => entry.kind === "QUESTION",
  );
  const filteredPortalTracking = filteredPortalEntries.filter(
    (entry) => entry.kind === "TRACKING",
  );
  const filteredPortalReplies = filteredPortalEntries.filter(
    (entry) => entry.kind === "REPLY",
  );
  const portalAccessCode =
    portalOverview?.portal.latestInvitation?.accessCode || generatedPortalCode;

  return {
    patient,
    setPatient,
    consultations,
    setConsultations,
    isLoading,
    setIsLoading,
    isConsultationsLoading,
    setIsConsultationsLoading,
    isExportModalOpen,
    setIsExportModalOpen,
    exportIncludeClinicalRecord,
    setExportIncludeClinicalRecord,
    exportIncludeProgress,
    setExportIncludeProgress,
    isExporting,
    setIsExporting,
    activeTab,
    setActiveTab,
    isEditing,
    setIsEditing,
    editForm,
    setEditForm,
    recalcKey,
    setRecalcKey,
    isAutomaticNutritionLoading,
    showRecalculateSaveConfirm,
    setShowRecalculateSaveConfirm,
    selectedConsultation,
    setSelectedConsultation,
    isMetricModalOpen,
    setIsMetricModalOpen,
    isOverwriteConfirmOpen,
    setIsOverwriteConfirmOpen,
    conflictingConsultationId,
    metricForm,
    setMetricForm,
    isEditMetricHistoryModalOpen,
    setIsEditMetricHistoryModalOpen,
    editingMetricKey,
    setEditingMetricKey,
    globalMetrics,
    metricsSearchQuery,
    setMetricsSearchQuery,
    isAddMetricModalOpen,
    setIsAddMetricModalOpen,
    newMetric,
    setNewMetric,
    isDeleteEntireMetricConfirmOpen,
    setIsDeleteEntireMetricConfirmOpen,
    metricKeyToDelete,
    setMetricKeyToDelete,
    portalOverview,
    isPortalInviteModalOpen,
    setIsPortalInviteModalOpen,
    portalInviteDays,
    setPortalInviteDays,
    generatedPortalLink,
    setGeneratedPortalLink,
    generatedPortalCode,
    setGeneratedPortalCode,
    isCreatingPortalInvite,
    isCopyingPortalLink,
    isPortalNotificationModalOpen,
    setIsPortalNotificationModalOpen,
    portalNotificationTitle,
    setPortalNotificationTitle,
    portalNotificationMessage,
    setPortalNotificationMessage,
    portalNotificationSendEmail,
    setPortalNotificationSendEmail,
    isCreatingPortalNotification,
    portalFilter,
    setPortalFilter,
    replyTarget,
    setReplyTarget,
    replyMessage,
    setReplyMessage,
    isSubmittingPortalReply,
    isDeletePatientConfirmOpen,
    setIsDeletePatientConfirmOpen,
    isDeleteConsultationConfirmOpen,
    setIsDeleteConsultationConfirmOpen,
    consultationToDelete,
    setConsultationToDelete,
    activeAcompTab,
    setActiveAcompTab,
    portalMessageText,
    setPortalMessageText,
    isCreatingPortalMessage,
    clinicalRecord,
    clinicalRecordDraft,
    setClinicalRecordDraft,
    isClinicalRecordLoading,
    isClinicalRecordSaving,
    token,
    fetchPatient,
    fetchConsultations,
    fetchGlobalMetrics,
    fetchPortalOverview,
    fetchClinicalRecord,
    saveClinicalRecord,
    prepareChartData,
    registeredMetricKeys,
    getAllMetricKeys,
    getMetricInfo,
    smartMetrics,
    availableMetricSuggestions,
    clinicalConsultations,
    automaticNutritionCalculations,
    handleEdit,
    handleCreatePortalInvite,
    handleCopyPortalLink,
    handleCreatePortalNotification,
    handleCreatePortalMessage,
    handleTogglePortalAccess,
    handleReplyPortalQuestion,
    openProgressExportModal,
    openClinicalRecordExportModal,
    resetMetricForm,
    createMetricDraft,
    openMetricLogger,
    closeMetricLogger,
    handleSaveMetricsClick,
    confirmSaveMetrics,
    executeSaveMetrics,
    handleCreateGlobalMetric,
    metricHistory,
    onDeleteMetricRecord,
    onSaveMetricEdit,
    addMetricToForm,
    addSmartMetricToForm,
    updateMetricInForm,
    handleExportPDF,
    removeMetricFromForm,
    handleDeleteEntireMetric,
    hasNutritionInputsChanged,
    handleSaveClick,
    handleSave,
    handleAutomaticNutritionRecalculation,
    updateField,
    handlePhoneChange,
    normalizeActivityLevel,
    getCurrentActivityLevel,
    updateActivityLevel,
    handleDelete,
    toggleStatus,
    filteredPortalEntries,
    filteredPortalQuestions,
    filteredPortalTracking,
    filteredPortalReplies,
    portalAccessCode,
  };
}
