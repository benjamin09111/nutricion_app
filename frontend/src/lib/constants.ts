import systemMetrics from "@/lib/metrics.json";

export const DEFAULT_CONSTRAINTS = [
  { id: "Diabético", label: "Diabético" },
  { id: "Hipertensión", label: "Hipertensión" },
  { id: "Vegetariano", label: "Vegetariano" },
  { id: "Celiaco", label: "Celiaco" },
  { id: "Sin Gluten", label: "Sin Gluten" },
];

export const DEFAULT_METRICS = (systemMetrics as Array<{
  key: string;
  label: string;
  unit: string;
  icon: string;
  color: string;
  category: string;
}>).map((m) => ({
  key: m.key,
  name: m.label,
  unit: m.unit,
  icon: m.icon,
  color: m.color,
}));

export { systemMetrics };
