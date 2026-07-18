import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Consultation } from "@/features/consultations";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const METRIC_KEY_MAP: Record<string, string> = {
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
export const normalizeMetricKey = (label: string = "", key?: string) => {
  if (key && METRIC_KEY_MAP[key.toLowerCase()]) {
    return METRIC_KEY_MAP[key.toLowerCase()];
  }
  const normalizedLabel = label.trim().toLowerCase().replace(/\s+/g, "_");
  return METRIC_KEY_MAP[normalizedLabel] || key || normalizedLabel;
};

export const hasHistoricalMetricKey = (
  consultations: Consultation[],
  targetKey: string,
) =>
  consultations.some((c) =>
    Array.isArray(c.metrics)
      ? c.metrics.some((m) => normalizeMetricKey(m.label, m.key) === targetKey)
      : false,
  );

export const buildMetricSeriesForKey = (
  consultations: Consultation[],
  targetKey: string,
) => {
  const seriesByDate = new Map<string, Record<string, unknown>>();

  const sortedConsultations = [...consultations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  sortedConsultations.forEach((consultation) => {
    const dateOnly = toDateOnly(consultation.date);
    if (!dateOnly || !Array.isArray(consultation.metrics)) return;

    consultation.metrics.forEach((metric) => {
      const metricKey = normalizeMetricKey(metric.label, metric.key);
      if (metricKey !== targetKey) return;

      const rawValue =
        typeof metric.value === "string"
          ? metric.value.replace(",", ".")
          : metric.value;
      const value = Number(rawValue);
      if (Number.isNaN(value)) return;

      // This series is consultation-only. Baseline profile values are handled separately.
      seriesByDate.set(dateOnly, {
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
        [targetKey]: value,
      });
    });
  });

  return Array.from(seriesByDate.values()).sort((a, b) => {
    const left = String(a.sortDate || "");
    const right = String(b.sortDate || "");
    return left.localeCompare(right);
  });
};

export const INDEPENDENT_METRICS_REGISTRY_TITLE = "registro de metricas independiente";

export const normalizeText = (value: string = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export const isIndependentMetricsConsultation = (
  consultation: Pick<Consultation, "title">,
) =>
  normalizeText(consultation.title).includes(
    INDEPENDENT_METRICS_REGISTRY_TITLE,
  );

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const toDateOnly = (value?: string | Date | null) => {
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

export const formatDateOnlyForLocale = (
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

export const getTodayDateInputValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
