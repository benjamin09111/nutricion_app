import systemMetrics from "@/lib/metrics.json";

export const DEFAULT_CONSTRAINTS = [
  { id: "Intolerante a la lactosa", label: "Intolerante a la lactosa" },
  { id: "Sin gluten", label: "Sin gluten" },
  { id: "Intolerancia a la fructosa", label: "Intolerancia a la fructosa" },
  { id: "Alergia a la proteína de leche de vaca (APLV)", label: "Alergia a la proteína de leche de vaca (APLV)" },
  { id: "Alergia al maní y frutos secos", label: "Alergia al maní y frutos secos" },
  { id: "Alergia al huevo", label: "Alergia al huevo" },
  { id: "Alergia a mariscos", label: "Alergia a mariscos" },
  { id: "Alergia al pescado", label: "Alergia al pescado" },
  { id: "Alergia a la soya", label: "Alergia a la soya" },
  { id: "Diabético", label: "Diabético" },
  { id: "Hipertensión arterial", label: "Hipertensión arterial" },
  { id: "Dislipidemia / Hipercolesterolemia", label: "Dislipidemia / Hipercolesterolemia" },
  { id: "Enfermedad renal crónica", label: "Enfermedad renal crónica" },
  { id: "Síndrome de intestino irritable (FODMAP)", label: "Síndrome de intestino irritable (FODMAP)" },
  { id: "Hiperuricemia / Gota", label: "Hiperuricemia / Gota" },
  { id: "Vegetariano", label: "Vegetariano" },
  { id: "Vegano", label: "Vegano" },
  { id: "Ovovegetariano", label: "Ovovegetariano" },
  { id: "Lactovegetariano", label: "Lactovegetariano" },
  { id: "Pescetariano", label: "Pescetariano" },
  { id: "Dieta Keto / Cetogénica", label: "Dieta Keto / Cetogénica" },
  { id: "Bajo en sodio", label: "Bajo en sodio" },
  { id: "Bajo en carbohidratos (Low Carb)", label: "Bajo en carbohidratos (Low Carb)" },
  { id: "Embarazo y lactancia", label: "Embarazo y lactancia" },
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
