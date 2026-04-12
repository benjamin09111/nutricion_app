export enum CreationType {
  DIET = "Dieta",
  SHOPPING_LIST = "Lista de Compras",
  RECIPE = "Receta",
  FAST_DELIVERABLE = "Entregable Rápido",
  OTHER = "Otro",
}

export interface Creation {
  id: string;
  name: string;
  type: CreationType;
  createdAt: string;
  size: string;
  format: "PDF" | "Excel" | "JSON" | "Doc";
  tags?: string[];
  isPublic?: boolean;
  description?: string;
  patientName?: string | null;
  filterTags?: string[];
}
