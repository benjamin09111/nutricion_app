"use client";

import { useState, useEffect, useMemo } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Ruler,
  Weight,
  ArrowLeft,
  TrendingUp,
  History as HistoryIcon,
  ClipboardList,
  Plus,
  Activity,
  Target,
  Zap,
  Dumbbell,
  AlertCircle,
  Search,
  Edit2,
  Save,
  X as CloseIcon,
  ChevronRight,
  Eye,
  Trash2,
  CalendarDays,
  FileText,
  Lock,
  Globe,
  Hash,
  Heart,
} from "lucide-react";
import { DEFAULT_METRICS } from "@/lib/constants";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useRouter } from "next/navigation";
import { Patient } from "@/features/patients";
import {
  Consultation,
  ConsultationsResponse,
  Metric,
} from "@/features/consultations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MetricTagInput } from "@/components/ui/MetricTagInput";
import { Modal } from "@/components/ui/Modal";
import { TagInput } from "@/components/ui/TagInput";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import Cookies from "js-cookie";
import jsPDF from "jspdf";
import { domToPng } from "modern-screenshot";
import { fetchApi, getApiUrl } from "@/lib/api-base";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const METRIC_KEY_MAP: Record<string, string> = {
  peso: "weight",
  weight: "weight",
  grasa: "body_fat",
  grasa_corporal: "body_fat",
  body_fat: "body_fat",
  "grasa_%": "body_fat",
  "%_grasa": "body_fat",
  masa_muscular: "muscle_mass",
  muscle_mass: "muscle_mass",
  grasa_visceral: "visceral_fat",
  visceral_fat: "visceral_fat",
  cintura: "waist",
  waist: "waist",
  estatura: "height",
  altura: "height",
  height: "height",
};

/**
 * Normaliza etiquetas de métricas para usarlas como llaves consistentes en gráficas.
 * Evita duplicados como "Peso" vs "weight".
 */
const normalizeMetricKey = (label: string = "", key?: string) => {
  // 1. Si ya tiene una llave técnica conocida
  if (key && METRIC_KEY_MAP[key.toLowerCase()]) {
    return METRIC_KEY_MAP[key.toLowerCase()];
  }

  // 2. Normalizar la etiqueta (label)
  const normalizedLabel = label.trim().toLowerCase().replace(/\s+/g, "_");

  // 3. Buscar en el mapa de sinonimos o devolver la etiqueta normalizada
  return METRIC_KEY_MAP[normalizedLabel] || key || normalizedLabel;
};

const INDEPENDENT_METRICS_REGISTRY_TITLE = "registro de metricas independiente";

const normalizeText = (value: string = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const isIndependentMetricsConsultation = (
  consultation: Pick<Consultation, "title">,
) => normalizeText(consultation.title).includes(INDEPENDENT_METRICS_REGISTRY_TITLE);

const toDateOnly = (value?: string | Date | null) => {
  if (!value) return "";

  if (typeof value === "string") {
    const isoLike = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoLike?.[1]) return isoLike[1];
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateOnlyForLocale = (
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
) => {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return "";

  const [year, month, day] = dateOnly.split("-").map(Number);
  if (!year || !month || !day) return "";

  // Mediodía UTC para evitar desfases de huso horario al formatear.
  const stableDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return stableDate.toLocaleDateString("es-ES", options);
};

const getTodayDateInputValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface PatientDetailClientProps {
  id: string;
}

type TabType = "General" | "Consultas" | "Progreso";

export default function PatientDetailClient({ id }: PatientDetailClientProps) {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConsultationsLoading, setIsConsultationsLoading] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("General");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Patient>>({});
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

  const [isDeletePatientConfirmOpen, setIsDeletePatientConfirmOpen] = useState(false);
  const [isDeleteConsultationConfirmOpen, setIsDeleteConsultationConfirmOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState<string | null>(null);

  const isAnyModalOpen =
    isMetricModalOpen || !!selectedConsultation || isEditMetricHistoryModalOpen;
  useScrollLock(isAnyModalOpen);

  const prepareChartData = () => {
    const dataPoints: any[] = [];
    const hasHistoricalWeight = Array.isArray(consultations)
      ? consultations.some((c) =>
          Array.isArray(c.metrics)
            ? c.metrics.some(
                (m) => normalizeMetricKey(m.label, m.key) === "weight",
              )
            : false,
        )
      : false;

    // 1. Añadir registro base del perfil del paciente si existe
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

      if (hasBaselineData) dataPoints.push(baseline);
    }

    // 2. Añadir registros de consultas / métricas independientes
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

    // Find in consultations for custom ones
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

    // Find in patient custom variables
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

  const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");

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

  const smartMetrics = useMemo(
    () => [
      {
        key: "weight",
        label: "Peso",
        unit: "kg",
        icon: Weight,
        color: "#3b82f6",
      },
      {
        key: "body_fat",
        label: "Grasa Corporal",
        unit: "%",
        icon: Activity,
        color: "#10b981",
      },
      {
        key: "muscle_mass",
        label: "Masa Muscular",
        unit: "kg",
        icon: Dumbbell,
        color: "#f59e0b",
      },
      {
        key: "visceral_fat",
        label: "Grasa Visceral",
        unit: "lvl",
        icon: Zap,
        color: "#ef4444",
      },
      {
        key: "waist",
        label: "Cintura",
        unit: "cm",
        icon: Target,
        color: "#ec4899",
      },
    ],
    [],
  );

  const availableMetricSuggestions = useMemo(() => {
    // Combinamos las métricas estáticas recomendadas con las globales creadas
    const combined = [...smartMetrics];

    // Añadir globales que no estén ya en smartMetrics
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
          icon: Activity, // Default icon lucide-react component
          color: "#64748b", // Default color
        });
      }
    });

    return combined;
  }, [globalMetrics, smartMetrics]);

  const clinicalConsultations = useMemo(() => {
    return consultations.filter(
      (c) => !isIndependentMetricsConsultation(c),
    );
  }, [consultations]);

  useEffect(() => {
    if (id) {
      fetchPatient();
      fetchConsultations();
      fetchGlobalMetrics();
    }
  }, [id]);

  const handleEdit = () => {
    if (!patient) return;
    setEditForm(patient);
    setIsEditing(true);
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

    // Validate metrics: Must have values if they have a label
    const incompleteMetrics = metricForm.metrics.filter(m => m.label.trim() !== "" && (m.value === undefined || m.value === null || m.value.toString().trim() === ""));
    if (incompleteMetrics.length > 0) {
      toast.error(`La métrica "${incompleteMetrics[0].label}" debe tener un valor.`);
      return;
    }

    // Filter out completely empty metrics
    const validMetrics = metricForm.metrics.filter(
      (m) => m.label.trim() !== "" && m.value !== undefined && m.value !== null && m.value.toString().trim() !== "",
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
        // PATCH existente
        const existingConsultation = consultations.find(
          (c) => c.id === updateConsultationId,
        );
        const mergedMetrics = [...(existingConsultation?.metrics || [])];

        const validMetrics = metricForm.metrics.filter(
          (m) => m.label.trim() !== "" && m.value !== undefined && m.value !== null && m.value.toString().trim() !== "",
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
        // POST nuevo
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
              .filter((m) => m.label.trim() !== "" && m.value !== undefined && m.value !== null && m.value.toString().trim() !== "")
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

    // Check if it already exists in our local list to avoid extra requests
    const exists = availableMetricSuggestions.find(
      (s) => s.label.toLowerCase() === newMetric.name.toLowerCase()
    );
    if (exists) {
      toast.info(`La métrica "${newMetric.name}" ya existe con la unidad "${exists.unit}". No es necesario crearla.`);
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
        // Si el backend dice que ya existe, lo mostramos explícitamente como aviso no como error fatal
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
    const hasHistoricalWeight = consultations.some((c) =>
      Array.isArray(c.metrics)
        ? c.metrics.some(
            (m) => normalizeMetricKey(m.label, m.key) === "weight",
          )
        : false,
    );

    // 1. Registro base del perfil
    if (editingMetricKey === "weight" && patient?.weight && !hasHistoricalWeight) {
      history.push({
        id: "baseline-weight",
        date: patient.createdAt || new Date().toISOString(),
        value: patient.weight.toString(),
        unit: "kg",
        label: "Peso Inicial (Perfil)",
        isBaseline: true,
      });
    }

    // 2. Registros de consultas
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
        const parsedWeight = parseFloat(newValue.replace(",", "."));
        if (Number.isNaN(parsedWeight)) {
          toast.error("Ingresa un valor de peso valido");
          return;
        }

        const baselineDate = new Date(record.date).toISOString().split("T")[0];
        const editedDate = new Date(newDate).toISOString().split("T")[0];
        const changedDate = baselineDate !== editedDate;

        // Always keep patient current weight in sync.
        const profileRes = await fetchApi(`/patients/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ weight: parsedWeight }),
        });

        if (!profileRes.ok) {
          toast.error("Error al actualizar peso del perfil");
          return;
        }

        // If date changed, convert baseline into an editable historical record.
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
              metrics: [{ key: "weight", label: "Peso", value: parsedWeight.toString(), unit: "kg" }],
            }),
          });

          if (!consultationRes.ok) {
            toast.error("Error al guardar el nuevo registro histórico de peso");
            return;
          }
        }

        const updated = await profileRes.json();
        setPatient(updated);
        await fetchConsultations();
        toast.success(
          changedDate
            ? "Peso actualizado y convertido a registro histórico editable"
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
          // Si se cambia la fecha de una consulta general, se cambia para toda la consulta.
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
    // Evitar duplicados por llave normalizada
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

    // Si cambiamos el label, verificamos si es una métrica conocida para bloquear la unidad
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

      // 1. Cabecera
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129); // Emerald-500
      doc.text("INFORME DE EVOLUCIÓN", margin, currentY);
      currentY += 10;

      doc.setFontSize(14);
      doc.setTextColor(51, 65, 85); // Slate-700
      doc.text(`Paciente: ${patient?.fullName || "Sin Nombre"}`, margin, currentY);
      currentY += 7;

      const chartData = prepareChartData();
      if (chartData.length > 0) {
        const first = chartData[0].fullDate;
        const last = chartData[chartData.length - 1].fullDate;
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(`Periodo: ${first} - ${last}`, margin, currentY);
        currentY += 15;
      }

      // 2. Resumen de Evolución (Texto)
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
          const color = Number(diff) < 0 ? [225, 29, 72] : [16, 185, 129]; // Red-600 or Emerald-500

          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105);
          doc.text(`${info.label}:`, margin, currentY);
          
          doc.setFont("helvetica", "normal");
          doc.text(`Inicio: ${first}${info.unit} -> Final: ${last}${info.unit}`, margin + 60, currentY);
          
          doc.setFont("helvetica", "bold");
          // @ts-ignore
          doc.setTextColor(...color);
          doc.text(`${Number(diff) > 0 ? "+" : ""}${diff}${info.unit}`, pageWidth - margin - 20, currentY, { align: "right" });
          
          currentY += 8;
          if (currentY > 270) { doc.addPage(); currentY = 20; }
        }
      }

      currentY += 15;

      // 3. Gráficas (Imágenes)
      for (const key of metricKeys) {
        const container = document.getElementById(`export-chart-${key}`);
        if (container) {
          // Si estamos cerca del final de la página, saltar
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
            }
          });

          const info = getMetricInfo(key);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(30, 41, 59);
          doc.text(`Gráfico: ${info.label} (${info.unit})`, margin, currentY);
          currentY += 5;

          const imgWidth = pageWidth - (margin * 2);
          const { width, height } = container.getBoundingClientRect();
          const imgHeight = (height * imgWidth) / width;

          doc.addImage(imgData, "PNG", margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 15;
        }
      }

      // Pie de página
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generado automáticamente por NutriSaaS - ${new Date().toLocaleDateString("es-ES")}`, margin, 285);

      doc.save(`Evolucion_${(patient?.fullName || "Paciente").replace(/\s+/g, "_")}.pdf`);
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
      const isWeight = key === "weight";
      const hasInCustomVars =
        patient?.customVariables &&
        (patient.customVariables as any[]).some(
          (cv) => normalizeMetricKey(cv.label, cv.key) === key,
        );

      // Identificar todas las consultas que contienen esta métrica
      const consultationsToUpdate = consultations.filter((c) =>
        (c.metrics || []).some(
          (m) => normalizeMetricKey(m.label, m.key) === key,
        ),
      );

      if (consultationsToUpdate.length === 0 && !isWeight && !hasInCustomVars) {
        toast.info("No hay registros históricos para eliminar");
        setMetricKeyToDelete(null);
        return;
      }

      // 1. Procesar todas las consultas (historial)
      const updatePromises = consultationsToUpdate.map(async (c) => {
        const newMetrics = (c.metrics || []).filter(
          (m) => normalizeMetricKey(m.label, m.key) !== key,
        );

        // Si la consulta es un "Registro de Métricas Independiente" y ahora quedó vacía, la eliminamos por completo
        if (
          newMetrics.length === 0 &&
          isIndependentMetricsConsultation(c)
        ) {
          return fetchApi(`/consultations/${c.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        // Si no está vacía o es una consulta clínica real, solo removemos la métrica específica
          return fetchApi(`/consultations/${c.id}`, {
            method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ metrics: newMetrics }),
        });
      });

      // 2. Actualizar perfil del paciente (Peso y Variables Personalizadas)
      const patientUpdates: any = {};
      let needsPatientUpdate = false;

      if (isWeight && patient?.weight) {
        patientUpdates.weight = null;
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
        // Forzamos un refresco inmediato de los datos
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

  const handleSave = async () => {
    if (!patient || !editForm) return;

    try {
      // Clean payload to match precisely backend UpdatePatientDto
      const payload: any = {
        fullName: editForm.fullName,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        documentId: editForm.documentId || undefined,
        birthDate: editForm.birthDate
          ? new Date(editForm.birthDate).toISOString()
          : undefined,
        gender: editForm.gender || undefined,
        height: editForm.height
          ? Number(editForm.height.toString().replace(",", "."))
          : undefined,
        weight: editForm.weight
          ? Number(editForm.weight.toString().replace(",", "."))
          : undefined,
        dietRestrictions: editForm.dietRestrictions || [],
        clinicalSummary: editForm.clinicalSummary || undefined,
        nutritionalFocus: editForm.nutritionalFocus || undefined,
        fitnessGoals: editForm.fitnessGoals || undefined,
        likes: editForm.likes || undefined,
        customVariables: editForm.customVariables || undefined,
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

  const updateField = (field: keyof Patient, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
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

  if (isLoading && !patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-16 w-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-semibold text-xs">
          Cargando expediente...
        </p>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-24 animate-in fade-in duration-700">
      {/* Header & Back Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1 lg:px-0">
        <div className="flex items-center gap-4 lg:gap-6">
          <button
            onClick={() => router.push("/dashboard/pacientes")}
            className="group p-3 lg:p-4 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
          <div>
            {patient.status === "Inactive" && (
              <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-lg w-fit border border-slate-200 animate-in slide-in-from-left duration-300">
                <AlertCircle className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                  Paciente Inactivo
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 mb-1">
              <h1
                className={cn(
                  "text-2xl font-semibold transition-all",
                  patient.status === "Inactive"
                    ? "text-slate-400"
                    : "text-slate-900",
                )}
              >
                {isEditing ? (
                  <Input
                    value={editForm.fullName || ""}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className="bg-slate-50 border-none font-semibold text-2xl h-12 p-0 focus:bg-transparent"
                  />
                ) : (
                  patient.fullName
                )}
              </h1>
              <button
                onClick={toggleStatus}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer hover:scale-105 active:scale-95",
                  patient.status !== "Inactive"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                    : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100",
                )}
              >
                {patient.status !== "Inactive" ? "Activo" : "Inactivo"}
              </button>
            </div>
            <p className="text-slate-400 font-bold text-xs flex items-center gap-2">
              EXPEDIENTE INTEGRADO <ChevronRight className="w-3 h-3" />{" "}
              {patient.documentId || "SIN ID"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4 w-full lg:w-auto">
          {isEditing ? (
            <>
              <Button
                onClick={() => setIsEditing(false)}
                variant="ghost"
                className="flex-1 sm:flex-none rounded-2xl h-11 lg:h-10 px-4 text-slate-400 font-semibold text-xs"
              >
                <CloseIcon className="w-5 h-5 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="flex-2 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 lg:h-10 px-6 rounded-2xl shadow-sm transition-all active:scale-95"
              >
                <Save className="w-5 h-5 mr-2" />
                GUARDAR
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleEdit}
                variant="ghost"
                className="flex-1 sm:flex-none rounded-2xl h-11 lg:h-10 px-4 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 font-semibold text-xs"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
              {!isEditing && (
                <Button
                  onClick={() =>
                    router.push("/dashboard/consultas/nueva?patientId=" + patient.id)
                  }
                  className="flex-2 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 lg:h-10 px-6 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  CONSULTA
                </Button>
              )}
              <Button
                disabled
                className="bg-slate-50 border border-slate-100 text-slate-400 font-bold h-10 px-4 rounded-2xl cursor-not-allowed opacity-60 flex items-center gap-2"
                title="Próximamente: Carga y análisis de exámenes clínicos con IA"
              >
                <FileText className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-widest">
                  Subir Examen
                </span>
                <span className="text-[8px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500 ml-1">
                  FUTURO
                </span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          {
            label: "Peso Actual",
            value: patient.weight,
            unit: "kg",
            icon: Weight,
            color: "text-blue-600",
            bg: "bg-blue-50",
            field: "weight",
          },
          {
            label: "Altura",
            value: patient.height,
            unit: "cm",
            icon: Ruler,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            field: "height",
          },
          {
            label: "Género",
            value: patient.gender,
            icon: User,
            color: "text-amber-600",
            bg: "bg-amber-50",
            field: "gender",
          },
          {
            label: "Identificador",
            value: patient.documentId || "---",
            icon: ClipboardList,
            color: "text-rose-600",
            bg: "bg-rose-50",
            field: "documentId",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 group hover:scale-[1.02] transition-all"
          >
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform",
                stat.bg,
              )}
            >
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">
                {stat.label}
              </p>
              <div className="text-2xl font-semibold text-slate-900 flex items-baseline gap-1">
                {isEditing && stat.field ? (
                  <Input
                    type={
                      stat.field === "weight" || stat.field === "height"
                        ? "number"
                        : "text"
                    }
                    step="any"
                    value={
                      (editForm[stat.field as keyof Patient] as
                        | string
                        | number) || ""
                    }
                    onChange={(e) =>
                      updateField(stat.field as keyof Patient, e.target.value)
                    }
                    className="h-8 border-none bg-slate-50 font-semibold p-1 text-xl"
                  />
                ) : (
                  <>
                    {stat.value}
                    <span className="text-xs text-slate-400 font-bold">
                      {stat.unit}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="flex p-1 bg-slate-100/50 rounded-2xl w-full lg:w-fit border border-slate-200 backdrop-blur-sm overflow-x-auto no-scrollbar scroll-smooth">
        {(["General", "Consultas", "Progreso"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap flex-1 lg:flex-none",
              activeTab === tab
                ? "bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/50"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {activeTab === "General" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
          {/* Left Column: Clinical & Dietary */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-10">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
              <div className="p-5 lg:p-6 border-b border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl lg:text-2xl font-semibold text-slate-900 flex items-center gap-3 lg:gap-4">
                  <Activity className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-500" />
                  Inteligencia Clínica
                </h3>
                <div className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-xs font-semibold border border-emerald-100 w-fit">
                  Sincronizado
                </div>
              </div>

              <div className="p-5 lg:p-6 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-slate-400 border-b border-slate-50 pb-3">
                      Información de Contacto
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 group">
                        <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-emerald-50 transition-colors">
                          <Mail className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400">
                            Email
                          </p>
                          {isEditing ? (
                            <Input
                              value={editForm.email || ""}
                              onChange={(e) =>
                                updateField("email", e.target.value)
                              }
                              className="h-8 border-none font-bold text-slate-800 p-0"
                            />
                          ) : (
                            <p className="font-bold text-slate-700">
                              {patient.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 group">
                        <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-emerald-50 transition-colors">
                          <Phone className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400">
                            Teléfono
                          </p>
                          {isEditing ? (
                            <Input
                              value={editForm.phone || ""}
                              onChange={(e) =>
                                updateField("phone", e.target.value)
                              }
                              className="h-8 border-none font-bold text-slate-800 p-0"
                            />
                          ) : (
                            <p className="font-bold text-slate-700">
                              {patient.phone || "No registrado"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-5">
                    <h4 className="text-xs font-semibold text-slate-400 border-b border-slate-50 pb-3">
                      Restricciones Alimentarias
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {isEditing ? (
                        <TagInput
                          value={(editForm.dietRestrictions as string[]) || []}
                          onChange={(tags) =>
                            updateField("dietRestrictions", tags)
                          }
                          fetchSuggestionsUrl={`${getApiUrl()}/tags`}
                          className="mt-2"
                          placeholder="Agregar restricción..."
                        />
                      ) : (
                        <>
                          {Array.isArray(patient.dietRestrictions) &&
                            patient.dietRestrictions.length > 0 ? (
                            patient.dietRestrictions.map((r, i) => (
                              <span
                                key={i}
                                className="px-5 py-2 bg-rose-50 text-rose-700 text-xs font-semibold rounded-2xl border border-rose-100 shadow-sm"
                              >
                                {r}
                              </span>
                            ))
                          ) : (
                            <div className="flex items-center gap-3 text-slate-400 p-4 bg-slate-50 rounded-2xl w-full border border-dashed border-slate-200" >
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-xs font-bold" >
                                Sin restricciones detectadas
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h4 className="text-xs font-semibold text-slate-400 border-b border-slate-50 pb-3 flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-emerald-500" />
                      Etiquetas de Clasificación
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {isEditing ? (
                        <TagInput
                          value={(editForm.tags as string[]) || []}
                          onChange={(tags) =>
                            updateField("tags", tags)
                          }
                          fetchSuggestionsUrl={`${getApiUrl()}/tags`}
                          className="mt-2"
                          placeholder="Ej: #Deportista, #Vegano..."
                        />
                      ) : (
                        <>
                          {Array.isArray(patient.tags) &&
                            patient.tags.length > 0 ? (
                            patient.tags.map((t, i) => (
                              <span
                                key={i}
                                className="px-5 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-2xl border border-emerald-100 shadow-sm"
                              >
                                {t}
                              </span>
                            ))
                          ) : (
                            <div className="flex items-center gap-3 text-slate-400 p-4 bg-slate-50 rounded-2xl w-full border border-dashed border-slate-200" >
                              <span className="text-xs font-bold" >
                                Sin etiquetas asignadas
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* New Clinical Summary Row */}
              <div className="px-10 pb-10" >
                <div className="space-y-4" >
                  <h4 className="text-xs font-semibold text-slate-400 border-b border-slate-50 pb-3 flex items-center justify-between" >
                    Resumen / Observaciones Clínicas
                    {!isEditing && (
                      <span className="text-emerald-500 lowercase font-bold tracking-normal opacity-50" >
                        Solo visible para el nutricionista
                      </span>
                    )}
                  </h4>
                  {isEditing ? (
                    <textarea
                      value={editForm.clinicalSummary || ""}
                      onChange={(e) =>
                        updateField("clinicalSummary", e.target.value)
                      }
                      className="w-full h-32 rounded-2xl bg-slate-50 border-none p-6 font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                      placeholder="Ingresa notas clínicas, antecedentes importantes o evolución general..."
                    />
                  ) : (
                    <div className="p-8 bg-slate-50/50 rounded-2xl border border-slate-50 min-h-[100px]" >
                      {patient.clinicalSummary ? (
                        <p className="text-slate-600 font-medium whitespace-pre-wrap leading-relaxed" >
                          {patient.clinicalSummary}
                        </p>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3 py-4 text-slate-300" >
                          <ClipboardList className="w-8 h-8 opacity-20" />
                          <p className="text-xs font-bold" >
                            Sin observaciones clínicas registradas
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Health Status */}
          <div className="lg:col-span-4 space-y-10" >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-800 shadow-sm relative overflow-hidden group" >
              <h4 className="flex items-center gap-3 font-semibold text-emerald-600 text-xs mb-8" >
                <Target className="w-4 h-4" />
                Foco Nutricional
              </h4>

              <div className="space-y-8 relative z-10" >
                <div >
                  <p className="text-xs font-semibold text-slate-400 mb-2" >
                    Objetivo Principal
                  </p>
                  {isEditing ? (
                    <Input
                      value={editForm.nutritionalFocus || ""}
                      onChange={(e) =>
                        updateField("nutritionalFocus", e.target.value)
                      }
                      className="bg-slate-100 border-none text-slate-800 font-semibold text-2xl h-12 p-2 focus:ring-1 focus:ring-emerald-500"
                      placeholder="Ej. Déficit Calórico"
                    />
                  ) : (
                    <p className="text-2xl font-semibold tracking-tight leading-tight" >
                      {patient.nutritionalFocus || "Sin foco definido"}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 backdrop-blur-sm group-hover:bg-slate-100 transition-all" >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center" >
                    <Zap className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-emerald-700" >
                    {patient.status === "Active"
                      ? "Seguimiento optimizado."
                      : "Paciente en pausa."}
                  </p>
                </div>
              </div>
            </div>

            {/* Metas Nutricionales Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-800 shadow-sm relative overflow-hidden group">
              <h4 className="flex items-center gap-3 font-semibold text-emerald-600 text-xs mb-8" >
                <Target className="w-4 h-4" />
                Metas Nutricionales (Carrito)
              </h4>

              <div className="space-y-4">
                {(() => {
                  const dataSource = isEditing ? editForm.customVariables : patient.customVariables;
                  const vars = Array.isArray(dataSource) ? dataSource as any[] : [];
                  const getCV = (key: string) => vars.find(v => v.key === key)?.value || "";

                  const updateCV = (key: string, label: string, value: string, unit: string) => {
                    if (!isEditing) return;
                    const prev = Array.isArray(editForm.customVariables) ? [...editForm.customVariables as any[]] : [];
                    const idx = prev.findIndex(v => v.key === key);
                    if (idx >= 0) { prev[idx] = { key, label, value, unit }; }
                    else { prev.push({ key, label, value, unit }); }
                    updateField("customVariables", prev);
                  };

                  return (
                    <div className="space-y-4 relative z-10">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Calorías (kcal)</label>
                          {isEditing ? (
                            <Input type="number" value={getCV("targetCalories")} onChange={e => updateCV("targetCalories", "Calorías Meta", e.target.value, "kcal")} className="font-bold border-slate-200" />
                          ) : (
                            <p className="font-bold text-amber-600">{getCV("targetCalories") || "No definido"}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Proteína (g)</label>
                          {isEditing ? (
                            <Input type="number" value={getCV("targetProtein")} onChange={e => updateCV("targetProtein", "Proteína Meta", e.target.value, "g")} className="font-bold border-slate-200" />
                          ) : (
                            <p className="font-bold text-emerald-600">{getCV("targetProtein") || "No definido"}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Carbohidratos (g)</label>
                          {isEditing ? (
                            <Input type="number" value={getCV("targetCarbs")} onChange={e => updateCV("targetCarbs", "Carbohidratos Meta", e.target.value, "g")} className="font-bold border-slate-200" />
                          ) : (
                            <p className="font-bold text-blue-600">{getCV("targetCarbs") || "No definido"}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Grasas (g)</label>
                          {isEditing ? (
                            <Input type="number" value={getCV("targetFats")} onChange={e => updateCV("targetFats", "Grasas Meta", e.target.value, "g")} className="font-bold border-slate-200" />
                          ) : (
                            <p className="font-bold text-purple-600">{getCV("targetFats") || "No definido"}</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Temporalidad</label>
                        {isEditing ? (
                          <select value={getCV("targetTimeframe") || "dia"} onChange={e => updateCV("targetTimeframe", "Temporalidad", e.target.value, "")} className="w-full h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 px-3">
                            <option value="dia">Diario</option>
                            <option value="semana">Semanal</option>
                            <option value="mes">Mensual</option>
                          </select>
                        ) : (
                          <p className="font-bold text-slate-700 capitalize">{getCV("targetTimeframe") || "Diario"}</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-8" >
              <div className="flex items-center justify-between" >
                <div className="flex items-center gap-4 text-rose-600" >
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center" >
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-semibold tracking-tight" >
                    Metas Fitness
                  </h4>
                </div>
              </div>

              <div className="space-y-4" >
                {isEditing ? (
                  <textarea
                    value={editForm.fitnessGoals || ""}
                    onChange={(e) =>
                      updateField("fitnessGoals", e.target.value)
                    }
                    className="w-full h-24 rounded-2xl bg-slate-50 border-none p-6 font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
                    placeholder="Ej. Maratón en Septiembre, Hipertrofia tren inferior..."
                  />
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100" >
                    {patient.fitnessGoals ? (
                      <p className="text-sm font-semibold text-slate-600 leading-relaxed text-center" >
                        {patient.fitnessGoals}
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-slate-400 text-center" >
                        No se han definido objetivos aún.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Likes (Gustos) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-8" >
              <div className="flex items-center justify-between" >
                <div className="flex items-center gap-4 text-emerald-600" >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center" >
                    <Heart className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h4 className="text-lg font-semibold tracking-tight" >
                    Gustos y Preferencias
                  </h4>
                </div>
              </div>

              <div className="space-y-4" >
                {isEditing ? (
                  <textarea
                    value={editForm.likes || ""}
                    onChange={(e) =>
                      updateField("likes", e.target.value)
                    }
                    className="w-full h-24 rounded-2xl bg-slate-50 border-none p-6 font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                    placeholder="Ej. Prefiere comida casera, no le gusta el sabor a stevia..."
                  />
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100" >
                    {patient.likes ? (
                      <p className="text-sm font-semibold text-slate-600 leading-relaxed text-center" >
                        {patient.likes}
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-slate-400 text-center" >
                        No hay preferencias registradas.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Status Management Card */}
            <div
              className={cn(
                "bg-white rounded-2xl p-6 border transition-all duration-500",
                patient.status === "Inactive"
                  ? "border-slate-200 bg-slate-50/50"
                  : "border-slate-100",
              )}
            >
              <div className="flex items-center gap-3 mb-6" >
                <div
                  className={cn(
                    "p-2 rounded-xl",
                    patient.status === "Inactive"
                      ? "bg-slate-200 text-slate-500"
                      : "bg-emerald-100 text-emerald-600",
                  )}
                >
                  <Target className="w-5 h-5" />
                </div>
                <div >
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900" >
                    Estado del Paciente
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase" >
                    {patient.status === "Active"
                      ? "Actualmente en tratamiento"
                      : "Tratamiento pausado"}
                  </p>
                </div>
              </div>

              <div className="space-y-4" >
                <p className="text-xs text-slate-500 leading-relaxed font-medium" >
                  {patient.status === "Active"
                    ? "El paciente está activo y siguiendo sus planes. Puedes pausar su seguimiento si ha terminado su tratamiento o está fuera por un tiempo."
                    : "El paciente está inactivo. Sus planes no aparecerán en las listas por defecto, pero su historial clínico se mantiene intacto."}
                </p>
                <Button
                  onClick={toggleStatus}
                  variant="outline"
                  className={cn(
                    "w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                    patient.status === "Active"
                      ? "border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white",
                  )}
                >
                  {patient.status === "Active"
                    ? "Marcar como Inactivo"
                    : "Reactivar Paciente"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consultas Tab */}
      {activeTab === "Consultas" && (
        <div className="space-y-6 lg:space-y-10 animate-in slide-in-from-right-4 duration-500 px-1 lg:px-6 py-2">
          <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900">Historial Clínico</h2>
              <p className="text-xs lg:text-sm font-medium text-slate-400">Visualiza y gestiona las consultas del paciente</p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/consultas/nueva?patientId=" + patient.id)}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 px-6 rounded-2xl shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-5 h-5 mr-2" />
              NUEVA CONSULTA
            </Button>
          </div>

          <div className="space-y-6" >
            <div className="space-y-4" >
              {isConsultationsLoading ? (
                <div className="p-20 flex justify-center" >
                  <div className="h-10 w-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              ) : clinicalConsultations.length > 0 ? (
                clinicalConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:scale-[1.01] transition-all cursor-pointer"
                    onClick={() => setSelectedConsultation(consultation)}
                  >
                    <div className="flex items-center gap-4 lg:gap-6">
                      <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                        <CalendarDays className="w-6 h-6 text-slate-300 group-hover:text-emerald-500" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-emerald-600 mb-1" >
                          {new Date(consultation.date).toLocaleDateString(
                            "es-ES",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </div>
                        <h4 className="text-lg font-semibold text-slate-800 tracking-tight leading-none group-hover:text-slate-900" >
                          {consultation.title}
                        </h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-4" >
                      {consultation.metrics &&
                        consultation.metrics.length > 0 && (
                          <div className="hidden md:flex items-center gap-2" >
                            {consultation.metrics.slice(0, 1).map((m, i) => (
                              <div
                                key={i}
                                className="px-4 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-400"
                              >
                                {m.label}: {m.value}
                                {m.unit}
                              </div>
                            ))}
                          </div>
                        )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConsultation(consultation);
                          }}
                          className="p-3 rounded-xl text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all cursor-pointer"
                          title="Ver detalles"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/consultas/${consultation.id}`);
                          }}
                          className="p-3 rounded-xl text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                          title="Editar consulta"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setConsultationToDelete(consultation.id);
                            setIsDeleteConsultationConfirmOpen(true);
                          }}
                          className="p-3 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Eliminar consulta"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 rounded-2xl p-16 text-center border-4 border-dashed border-slate-200/50" >
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center mx-auto mb-6" >
                    <Activity className="w-10 h-10 text-slate-200" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-600 mb-2" >
                    Sin registros de consulta
                  </h4>
                  <p className="text-slate-400 font-medium max-w-xs mx-auto mb-8" >
                    Empieza a documentar el progreso de {patient.fullName} {" "}
                    creando su primera consulta.
                  </p>
                  <Button
                    onClick={() =>
                      router.push(
                        "/dashboard/consultas/nueva?patientId=" + patient.id,
                      )
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 px-4 rounded-2xl transition-all shadow-xl shadow-emerald-200/50 active:scale-95"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Iniciar Evaluación
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progreso Tab */}
      {
        activeTab === "Progreso" && (
          <div className="space-y-10 animate-in zoom-in-95 duration-500">
            {/* Metrics Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Seguimiento Biométrico
                </h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-tight">
                  Gestiona la evolución física del paciente
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white text-emerald-600 font-black rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-all cursor-pointer group/pdf shadow-sm hover:shadow-md"
                >
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] uppercase tracking-widest">
                    Exportar PDF
                  </span>
                </button>
                <button
                  onClick={() => openMetricLogger()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Plus className="w-5 h-5 text-emerald-400" />
                  Registrar Métrica
                </button>
              </div>
            </div>

            {/* Last Values Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6 px-2">
              {getAllMetricKeys().map((key) => {
                const info = getMetricInfo(key);
                const chartData = prepareChartData();
                const filtered = chartData.filter(d => d[key] !== undefined);
                const lastPoint = filtered.length > 0 ? filtered[filtered.length - 1] : null;

                return (
                  <div
                    key={`summary-${key}`}
                    className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-emerald-200 hover:shadow-md transition-all cursor-default"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                        <info.icon className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                      </div>
                      {lastPoint && (
                        <div className="text-[9px] font-bold text-slate-300 uppercase bg-slate-50 px-2 py-1 rounded-lg">
                          {lastPoint.date}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">
                        {info.label}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 tracking-tight">
                          {lastPoint ? lastPoint[key] : "---"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {info.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progression Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {getAllMetricKeys().map((key) => {
                const info = getMetricInfo(key);
                const chartData = prepareChartData();
                const filteredData = chartData.filter((d) => d[key] !== undefined);
                const firstPoint = filteredData.length > 0 ? filteredData[0] : null;
                const latestPoint =
                  filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;

                const firstValueRaw = firstPoint ? Number(firstPoint[key]) : null;
                const latestValueRaw = latestPoint ? Number(latestPoint[key]) : null;
                const hasValidFirst = firstValueRaw !== null && Number.isFinite(firstValueRaw);
                const hasValidLast = latestValueRaw !== null && Number.isFinite(latestValueRaw);
                const diffRaw =
                  hasValidFirst && hasValidLast ? latestValueRaw - firstValueRaw : null;

                const formatMetricValue = (value: number | null) => {
                  if (value === null || !Number.isFinite(value)) return "---";
                  if (Number.isInteger(value)) return value.toString();
                  return value.toFixed(2).replace(/\.?0+$/, "");
                };

                const diffDisplay =
                  diffRaw === null || !Number.isFinite(diffRaw)
                    ? "---"
                    : `${diffRaw > 0 ? "+" : ""}${formatMetricValue(diffRaw)}`;

                return (
                  <div
                    key={key}
                    id={`export-chart-${key}`}
                    className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                      <div className="space-y-1">
                        <h3 className="text-base lg:text-lg font-semibold text-slate-900 flex items-center gap-3">
                          <info.icon
                            className={cn(
                              "w-6 h-6",
                              info.color === "#3b82f6"
                                ? "text-blue-500"
                                : info.color === "#10b981"
                                  ? "text-emerald-500"
                                  : "text-slate-400",
                            )}
                          />
                          {info.label}
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 opacity-80">
                          Tendencia histórica ({info.unit})
                        </p>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 min-h-[72px] flex flex-col justify-between">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-tight min-h-[18px]">
                              Primer valor
                            </p>
                            <div className="flex items-baseline gap-1 flex-wrap mt-2">
                              <span className="text-sm font-black text-slate-700 leading-none">
                                {formatMetricValue(firstValueRaw)}
                              </span>
                              <span className="text-[10px] text-slate-400 leading-none">
                                {info.unit}
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 min-h-[72px] flex flex-col justify-between">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-tight min-h-[18px]">
                              Último valor
                            </p>
                            <div className="flex items-baseline gap-1 flex-wrap mt-2">
                              <span className="text-sm font-black text-slate-700 leading-none">
                                {formatMetricValue(latestValueRaw)}
                              </span>
                              <span className="text-[10px] text-slate-400 leading-none">
                                {info.unit}
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 min-h-[72px] flex flex-col justify-between">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-tight min-h-[18px]">
                              Diferencia
                            </p>
                            <div
                              className={cn(
                                "flex items-baseline gap-1 flex-wrap mt-2",
                              )}
                            >
                              <span
                                className={cn(
                                  "text-sm font-black leading-none",
                                  diffRaw === null || !Number.isFinite(diffRaw)
                                    ? "text-slate-500"
                                    : diffRaw > 0
                                      ? "text-emerald-600"
                                      : diffRaw < 0
                                        ? "text-rose-600"
                                        : "text-slate-700",
                                )}
                              >
                                {diffDisplay}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] text-slate-400 leading-none",
                                )}
                              >
                                {info.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openMetricLogger(key)}
                          data-no-export="true"
                          className="p-3 bg-emerald-50 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-xl transition-all active:scale-95 cursor-pointer border border-emerald-100"
                          title={`Registrar ${info.label} rápidamente`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingMetricKey(key);
                            setIsEditMetricHistoryModalOpen(true);
                          }}
                          data-no-export="true"
                          className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95 cursor-pointer border border-transparent hover:border-emerald-100"
                          title={`Editar historial de ${info.label}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setMetricKeyToDelete(key);
                            setIsDeleteEntireMetricConfirmOpen(true);
                          }}
                          data-no-export="true"
                          className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95 cursor-pointer border border-transparent hover:border-rose-100"
                          title={`Eliminar toda la métrica ${info.label}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="h-[300px] w-full">
                      {(() => {
                        if (filteredData.length >= 2) {
                          return (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={chartData}
                                margin={{
                                  top: 10,
                                  right: 10,
                                  left: -20,
                                  bottom: 0,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id={`color-${key}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="5%"
                                      stopColor="#10b981"
                                      stopOpacity={0.3}
                                    />
                                    <stop
                                      offset="95%"
                                      stopColor="#10b981"
                                      stopOpacity={0}
                                    />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  vertical={false}
                                  stroke="#f1f5f9"
                                />
                                <XAxis
                                  dataKey="date"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    fill: "#94a3b8",
                                  }}
                                  dy={15}
                                />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    fill: "#94a3b8",
                                  }}
                                  domain={["auto", "auto"]}
                                />
                                <Tooltip
                                  contentStyle={{
                                    borderRadius: "16px",
                                    border: "none",
                                    boxShadow:
                                      "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                    padding: "12px",
                                  }}
                                  itemStyle={{
                                    fontWeight: 600,
                                    fontSize: "12px",
                                  }}
                                  labelStyle={{
                                    fontWeight: 700,
                                    color: "#1e293b",
                                    marginBottom: "4px",
                                  }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey={key}
                                  stroke="#10b981"
                                  strokeWidth={3}
                                  fillOpacity={1}
                                  fill={`url(#color-${key})`}
                                  animationDuration={1500}
                                  connectNulls
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          );
                        }

                        // Si solo hay un punto o ninguno, mostramos una visualización informativa
                        return (
                          <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 gap-4 group-hover:bg-slate-50 transition-colors">
                            <div className="w-20 h-20 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center animate-in zoom-in-50 duration-500">
                              {latestPoint ? (
                                <>
                                  <span className="text-2xl font-black text-slate-900 leading-none">
                                    {latestPoint[key]}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                    {info.unit}
                                  </span>
                                </>
                              ) : (
                                <info.icon className="w-8 h-8 opacity-20 text-slate-400" />
                              )}
                            </div>
                            <div className="text-center space-y-1 px-6">
                              <p className="text-xs font-bold text-slate-600">
                                {latestPoint
                                  ? "Primer registro detectado"
                                  : "Sin registros detectados"}
                              </p>
                              <p className="text-[10px] font-semibold text-slate-400 leading-tight">
                                {latestPoint
                                  ? "Se necesitan al menos 2 registros en fechas distintas para generar la curva de tendencia."
                                  : `No hay datos históricos para ${info.label.toLowerCase()}.`}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )
      }

      {/* View Details Modal */}
      {
        selectedConsultation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold uppercase tracking-tight border border-emerald-100">
                        {new Date(selectedConsultation.date).toLocaleDateString(
                          "es-ES",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </span>
                    </div>
                    <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">
                      {selectedConsultation.title}
                    </h2>
                    <div className="flex items-center gap-2 text-slate-500 font-semibold uppercase text-xs tracking-tight">
                      <User className="w-4 h-4 text-emerald-500" />
                      {patient?.fullName}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedConsultation(null)}
                    className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <CloseIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-tight ml-1">
                    Observaciones Clínicas
                  </h4>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 font-medium leading-relaxed">
                    {selectedConsultation.description || "Sin notas registradas."}
                  </div>
                </div>

                {selectedConsultation.metrics &&
                  selectedConsultation.metrics.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-tight ml-1">
                        Métricas Clave
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedConsultation.metrics.map((m, i) => (
                          <div
                            key={i}
                            className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                          >
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                              {m.label}
                            </p>
                            <p className="text-2xl font-semibold text-slate-900">
                              {m.value}{" "}
                              <span className="text-xs text-slate-400 uppercase tracking-tight ml-1">
                                {m.unit}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="pt-6">
                  <Button
                    onClick={() => setSelectedConsultation(null)}
                    className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl shadow-lg active:scale-95 transition-all text-xs tracking-tight uppercase"
                  >
                    Cerrar Expediente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      }


      {/* Independent Metric Logging Modal */}
      {
        isMetricModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">
                    Registrar Evolución
                  </h3>
                  <p className="text-slate-500 font-medium text-xs mt-1">
                    Añade datos biométricos fuera de consulta
                  </p>
                </div>
                <button
                  onClick={closeMetricLogger}
                  className="p-3 bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-slate-100 shadow-sm cursor-pointer"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-tight ml-1">
                    Fecha del Registro
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
                    <input
                      type="date"
                      className="w-full h-14 pl-14 pr-5 rounded-2xl bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-semibold text-slate-700 cursor-pointer shadow-sm"
                      value={metricForm.date}
                      onChange={(e) =>
                        setMetricForm({ ...metricForm, date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-tight">
                      Seleccionar Métricas
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setMetricForm({
                            ...metricForm,
                            metrics: [],
                          })
                        }
                        className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest px-3 py-1 cursor-pointer"
                      >
                        Limpiar
                      </button>
                      <button
                        onClick={addMetricToForm}
                        className="text-xs font-semibold bg-slate-50 text-slate-500 px-4 py-2 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> FILA VACÍA
                      </button>
                    </div>
                  </div>

                  <MetricTagInput
                    value={metricForm.metrics}
                    registeredKeys={registeredMetricKeys}
                    onChange={(newMetrics) => {
                      // Ensure each new metric has a 'value' property if it doesn't exist
                      const updatedMetrics = newMetrics.map((m) => ({
                        ...m,
                        value: m.value || "",
                      }));
                      setMetricForm({ ...metricForm, metrics: updatedMetrics });
                    }}
                    placeholder="Busca por nombre (ej: Brazo, Cadera...)"
                    className="mt-2"
                  />
                </div>

                <div className="space-y-4">
                  {metricForm.metrics.map((m, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-in slide-in-from-bottom-2"
                    >
                      <div className="col-span-4 space-y-2">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
                          Concepto
                        </label>
                        <Input
                          placeholder="Peso, Cintura..."
                          value={m.label}
                          onChange={(e) =>
                            updateMetricInForm(idx, "label", e.target.value)
                          }
                          className="bg-white"
                        />
                      </div>
                      <div className="col-span-4 space-y-2">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
                          Valor
                        </label>
                        <Input
                          placeholder="70.5"
                          value={m.value}
                          onChange={(e) =>
                            updateMetricInForm(idx, "value", e.target.value)
                          }
                          className="bg-white"
                        />
                      </div>
                      <div className="col-span-3 space-y-2">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
                          Unidad
                        </label>
                        {(() => {
                          const known = availableMetricSuggestions.find(
                            (s) =>
                              s.label.toLowerCase() === m.label.toLowerCase() ||
                              s.key === normalizeMetricKey(m.label, m.key),
                          );
                          return (
                            <div className="relative">
                              <select
                                value={m.unit}
                                disabled={!!known}
                                onChange={(e) =>
                                  updateMetricInForm(idx, "unit", e.target.value)
                                }
                                className={cn(
                                  "w-full rounded-xl border h-11 text-slate-900 bg-white px-4 py-2 text-sm focus:ring-4 outline-none font-bold cursor-pointer transition-shadow shadow-xs",
                                  known
                                    ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                    : "border-slate-200 focus:ring-emerald-500/10 focus:border-emerald-500",
                                )}
                              >
                                <option value="" disabled>
                                  Selecciona...
                                </option>
                                <option value="kg">kg (Kilogramos)</option>
                                <option value="g">g (Gramos)</option>
                                <option value="cm">cm (Centímetros)</option>
                                <option value="mm">mm (Milímetros)</option>
                                <option value="%">% (Porcentaje)</option>
                                <option value="mg/dL">mg/dL</option>
                                <option value="mmol/L">mmol/L</option>
                                <option value="kcal">kcal</option>
                                <option value="latidos/min">latidos/min</option>
                                <option value="hrs">hrs</option>
                                <option value="mins">mins</option>
                                <option value="niveles">niveles (1-10)</option>
                                <option value="unidades">unidades</option>
                              </select>
                              {known && (
                                <span className="absolute -top-6 right-0 text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 animate-in fade-in slide-in-from-right-2">
                                  Unidad Oficial
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="col-span-1 pb-1">
                        <button
                          onClick={() => removeMetricFromForm(idx)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 shrink-0">
                <button
                  onClick={closeMetricLogger}
                  className="px-6 py-3 bg-white text-slate-500 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleSaveMetricsClick}
                  className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  GUARDAR CAMBIOS
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal de edición de historial detallado */}
      {
        isEditMetricHistoryModalOpen && editingMetricKey && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <HistoryIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                      Historial de Registros
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {getMetricInfo(editingMetricKey).label}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditMetricHistoryModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <CloseIcon className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-4 custom-scrollbar flex-1">
                {metricHistory.length > 0 ? (
                  metricHistory.map((record, idx) => (
                    <MetricRecordRow
                      key={`${record.id}-${idx}`}
                      record={record}
                      onSave={onSaveMetricEdit}
                      onDelete={onDeleteMetricRecord}
                    />
                  ))
                ) : (
                  <div className="py-20 text-center flex flex-col items-center gap-4">
                    <ClipboardList className="w-12 h-12 text-slate-200" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">
                      No hay registros para esta métrica
                    </p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex shrink-0 justify-end">
                <button
                  onClick={() => setIsEditMetricHistoryModalOpen(false)}
                  className="px-10 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  CERRAR HISTORIAL
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal para Nueva Métrica (Global) */}
      <Modal
        isOpen={isAddMetricModalOpen}
        onClose={() => setIsAddMetricModalOpen(false)}
        title="Crear Nueva Métrica"
      >
        <div className="space-y-6 py-4 px-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Nombre de la Métrica
              </label>
              <div className="relative">
                <Input
                  placeholder="Ej: Circunferencia de Brazo, Pliegue Cutáneo..."
                  value={newMetric.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const known = availableMetricSuggestions.find(s => s.label.toLowerCase() === val.toLowerCase());
                    if (known) {
                      setNewMetric({ ...newMetric, name: val, unit: known.unit });
                    } else {
                      setNewMetric({ ...newMetric, name: val });
                    }
                  }}
                  className="rounded-xl border-slate-200 h-11 text-slate-900 pr-10"
                />
                {(() => {
                  const known = availableMetricSuggestions.find(s => s.label.toLowerCase() === newMetric.name.toLowerCase());
                  return known ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200" title="Esta métrica ya existe">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
              {(() => {
                const known = availableMetricSuggestions.find(s => s.label.toLowerCase() === newMetric.name.toLowerCase());
                return known ? (
                  <p className="text-[10px] font-bold text-amber-600 animate-in fade-in slide-in-from-top-1">
                    Esta métrica ya está registrada en el sistema.
                  </p>
                ) : null;
              })()}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Unidad {(() => {
                  const known = availableMetricSuggestions.find(s => s.label.toLowerCase() === newMetric.name.toLowerCase());
                  return known ? "(Bloqueada)" : "(Opcional)";
                })()}
              </label>
              <div className="relative">
                <select
                  value={newMetric.unit}
                  disabled={!!availableMetricSuggestions.find(s => s.label.toLowerCase() === newMetric.name.toLowerCase())}
                  onChange={(e) =>
                    setNewMetric({ ...newMetric, unit: e.target.value })
                  }
                  className={cn(
                    "w-full rounded-xl border h-11 text-slate-900 bg-white px-3 py-2 text-sm focus:ring-2 transition-all font-medium",
                    !!availableMetricSuggestions.find(s => s.label.toLowerCase() === newMetric.name.toLowerCase())
                      ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                      : "border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-300"
                  )}
                >
                  <option value="" disabled>
                    Selecciona una unidad...
                  </option>
                  <option value="kg">kg (Kilogramos)</option>
                  <option value="g">g (Gramos)</option>
                  <option value="cm">cm (Centímetros)</option>
                  <option value="mm">mm (Milímetros)</option>
                  <option value="%">% (Porcentaje)</option>
                  <option value="mg/dL">mg/dL</option>
                  <option value="mmol/L">mmol/L</option>
                  <option value="kcal">kcal</option>
                  <option value="latidos/min">latidos/min</option>
                  <option value="hrs">hrs</option>
                  <option value="mins">mins</option>
                  <option value="niveles">niveles (1-10)</option>
                  <option value="unidades">unidades</option>
                </select>
                {!!availableMetricSuggestions.find(s => s.label.toLowerCase() === newMetric.name.toLowerCase()) && (
                   <span className="absolute -top-6 right-0 text-[8px] font-black uppercase text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                    Utilizar unidad existente
                   </span>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              <Globe className="w-3 h-3 inline mr-1 text-emerald-500" />
              Esta métrica será{" "}
              <span className="text-emerald-600 font-bold">Global</span>. Otros
              nutricionistas podrán verla y reutilizarla. Solo tú podrás
              eliminarla.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              variant="ghost"
              className="rounded-xl font-bold text-slate-400"
              onClick={() => setIsAddMetricModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-slate-900 text-white rounded-xl font-black px-8 shadow-lg shadow-slate-200"
              onClick={handleCreateGlobalMetric}
            >
              Crear
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmación Sobreescribir Métrica */}
      <ConfirmationModal
        isOpen={isOverwriteConfirmOpen}
        onClose={() => {
          setIsOverwriteConfirmOpen(false);
          setConflictingConsultationId(null);
        }}
        onConfirm={confirmSaveMetrics}
        title="¿Sobreescribir Valores?"
        description="Ya existe un registro con esta fecha. Los valores nuevos reemplazarán a los existentes para las métricas que coincidan. Las demás métricas de esa fecha se mantendrán intactas."
        confirmText="Sí, sobreescribir"
        cancelText="Cancelar"
      />
      {/* Modal de Exportación PDF con aviso de IA */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => !isExporting && setIsExportModalOpen(false)}
        title="Exportar Informe de Progreso"
      >
        <div className="space-y-6 pt-2">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Próximamente: Análisis por IA</h4>
                En futuras actualizaciones, nuestro motor de IA realizará un análisis automático de estas tendencias para identificar patrones de éxito y áreas de mejora en el tratamiento de <strong>{patient?.fullName || "Paciente"}</strong>.
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl">
                <FileText className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                   <p className="text-[10px] font-black uppercase text-slate-400">Nombre del Archivo</p>
                   <p className="text-xs font-bold text-slate-700">Evolucion_{(patient?.fullName || "Paciente").replace(/\s+/g, "_")}.pdf</p>
                </div>
             </div>
             <div className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-xl">
                <CalendarDays className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                   <p className="text-[10px] font-black uppercase text-slate-400">Contenido</p>
                   <p className="text-xs font-bold text-slate-700">Resumen textual + Gráficos de tendencia</p>
                </div>
             </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              className="flex-1 h-12 rounded-xl font-bold text-slate-400"
              onClick={() => setIsExportModalOpen(false)}
              disabled={isExporting}
            >
              CANCELAR
            </Button>
            <Button
              className="flex-2 h-12 bg-slate-900 text-white rounded-xl font-black text-[10px] tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  GENERANDO...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  GENERAR INFORME PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmación Borrar Métrica Completa */}
      <ConfirmationModal
        isOpen={isDeleteEntireMetricConfirmOpen}
        onClose={() => {
          setIsDeleteEntireMetricConfirmOpen(false);
          setMetricKeyToDelete(null);
        }}
        onConfirm={handleDeleteEntireMetric}
        title={`¿Eliminar Historial de ${metricKeyToDelete ? getMetricInfo(metricKeyToDelete).label : ""}?`}
        description="Esta acción eliminará TODOS los registros históricos de esta métrica para este paciente (incluyendo el valor inicial si aplica). Esta acción no se puede deshacer."
        confirmText="Sí, eliminar todo"
        cancelText="Cancelar"
        variant="destructive"
      />

      <ConfirmationModal
        isOpen={isDeletePatientConfirmOpen}
        onClose={() => setIsDeletePatientConfirmOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar paciente?"
        description="¿Estás seguro de que deseas eliminar este paciente? Esta acción es irreversible."
        confirmText="Sí, eliminar"
        variant="destructive"
      />

      <ConfirmationModal
        isOpen={isDeleteConsultationConfirmOpen}
        onClose={() => {
          setIsDeleteConsultationConfirmOpen(false);
          setConsultationToDelete(null);
        }}
        onConfirm={async () => {
          if (!consultationToDelete) return;
          try {
            const token = Cookies.get("auth_token") || localStorage.getItem("auth_token");
            const response = await fetchApi(`/consultations/${consultationToDelete}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
              toast.success("Consulta eliminada");
              fetchConsultations();
            } else {
              toast.error("Error al eliminar consulta");
            }
          } catch (error) {
            toast.error("Error de red");
          } finally {
            setIsDeleteConsultationConfirmOpen(false);
            setConsultationToDelete(null);
          }
        }}
        title="¿Eliminar consulta?"
        description="¿Estás seguro de que deseas eliminar esta consulta? Se eliminarán también las métricas asociadas a ella."
        confirmText="Sí, eliminar"
        variant="destructive"
      />

      {/* Footer / Danger Zone */}
      <div className="pt-20 border-t border-slate-100 mt-20 flex flex-col items-center gap-4">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
          Ecosistema NutriSaaS v1.1
        </p>
        <button
          onClick={() => setIsDeletePatientConfirmOpen(true)}
          className="group flex items-center gap-3 px-6 py-3 text-slate-300 hover:text-rose-500 transition-all cursor-pointer opacity-30 hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Eliminar Paciente
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Sub-componente para gestionar una fila de historial de métrica
 */
function MetricRecordRow({
  record,
  onSave,
  onDelete,
}: {
  record: any;
  onSave: (rec: any, val: string, date: string) => Promise<void>;
  onDelete: (rec: any) => Promise<void>;
}) {
  const [val, setVal] = useState(record.value);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Normalizar la fecha a formato YYYY-MM-DD para el input type="date"
  const normalizeDate = (d: string) => {
    try {
      const dateObj = new Date(d);
      return isNaN(dateObj.getTime())
        ? ""
        : dateObj.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const [date, setDate] = useState(normalizeDate(record.date));
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges =
    val !== record.value || date !== normalizeDate(record.date);

  const handleSave = async () => {
    setIsSaving(true);
    // Si no se pudo parsear bien la fecha, al menos enviamos un ISO string.
    let newDateStr = new Date().toISOString();
    if (date) {
      newDateStr = new Date(`${date}T12:00:00Z`).toISOString();
    }
    await onSave(record, val, newDateStr);
    setIsSaving(false);
  };

  const handleDelete = async () => {
    await onDelete(record);
    setIsDeleteConfirmOpen(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 flex flex-wrap md:flex-nowrap items-end gap-4 hover:border-emerald-200 hover:shadow-sm transition-all group relative">
      <div className="flex-1 min-w-[140px] space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
          <Calendar className="w-3 h-3 text-emerald-500" /> Fecha
        </label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-12 bg-slate-50/50 border border-slate-200 focus:bg-white font-bold"
        />
      </div>

      <div className="flex-1 min-w-[100px] space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
          <Activity className="w-3 h-3 text-emerald-500" /> Valor
        </label>
        <div className="relative">
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="h-12 bg-slate-50/50 border border-slate-200 focus:bg-white font-bold pr-12"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
            {record.unit.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-end pb-1 h-full gap-3">
        <button
          onClick={() => setIsDeleteConfirmOpen(true)}
          className={cn(
            "p-3 rounded-xl transition-all cursor-pointer group/trash",
            "bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white shadow-sm",
          )}
          title="Eliminar este registro"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <button
          disabled={!hasChanges || isSaving}
          onClick={handleSave}
          className={cn(
            "p-3 rounded-xl transition-all cursor-pointer",
            hasChanges
              ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-600 active:scale-95"
              : "bg-slate-100 text-slate-300 opacity-50 cursor-not-allowed",
          )}
        >
          {isSaving ? (
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            <Save className="w-5 h-5" />
          )}
        </button>
      </div>

      {record.consultationTitle && (
        <div className="w-full md:w-auto md:absolute md:top-2 md:right-4 pt-2 md:pt-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            {record.consultationTitle}
          </span>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar registro?"
        description="Esta acción eliminará permanentemente este valor de métrica del historial del paciente. ¿Deseas continuar?"
        confirmText="Sí, eliminar"
        cancelText="No, cancelar"
        variant="destructive"
      />
    </div>
  );
}

