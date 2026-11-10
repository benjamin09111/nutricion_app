import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { colors } from "./styles/pdfStyles";
import { formatNutritionBasisLabel } from "./pdfFormatters";
import {
  PdfBrandedHeader,
  PdfSectionHeader,
  PdfBrandedFooter,
  PdfAvoidFoodsSection,
} from "./components";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DietFood {
  producto: string;
  grupo: string;
  unidad?: string;
  calorias?: number;
  proteinas?: number;
  lipidos?: number;
  carbohidratos?: number;
  precioPromedio?: number;
  status?: "base" | "favorite" | "added";
}

export interface DietCartPdfItem {
  name: string;
  category: string;
}

export interface DietMealPdfItem {
  section: string;
  mealText: string;
  time?: string;
  portion?: string;
}

export interface DietPdfData {
  dietName: string;
  dietTags?: string[];
  activeConstraints?: string[];
  planObjective?: string;
  showPlanObjectiveInPdf?: boolean;
  includeFoodTableSection?: boolean;
  includeMealsSection?: boolean;
  meals?: DietMealPdfItem[];
  patientName?: string;
  foods: DietFood[];
  generatedAt?: string;
  includeCartSection?: boolean;
  cartItems?: DietCartPdfItem[];
  includeResourcesSection?: boolean;
  selectedResourceIds?: string[];
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    fontFamily: "Helvetica",
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 28,
    fontSize: 9,
    lineHeight: 1.4,
    color: colors.slate800,
  },
  section: {
    marginBottom: 8,
  },
  // Stat Cards
  statsGrid: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 7,
    color: colors.slate500,
    textTransform: "uppercase",
    marginBottom: 2,
    fontFamily: "Helvetica-Bold",
  },
  statVal: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
  },
  // Tags Row
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
  },
  tagPill: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingVertical: 2.5,
    paddingHorizontal: 6,
  },
  tagText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  // Group Header
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.slate50,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginTop: 6,
    marginBottom: 3,
    borderRadius: 4,
  },
  groupName: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
    flex: 1,
  },
  groupCount: {
    fontSize: 7,
    color: colors.slate500,
  },
  // Table
  tableWrapper: {
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.slate100,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.slate600,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  tableRowAlt: {
    backgroundColor: colors.slate50,
  },
  tableCell: {
    fontSize: 7.5,
    color: colors.slate700,
  },
  tableCellBold: {
    fontSize: 7.5,
    color: colors.slate900,
    fontFamily: "Helvetica-Bold",
  },
});

function groupFoods(foods: DietFood[]): Record<string, DietFood[]> {
  return foods.reduce(
    (acc, food) => {
      const g = food.grupo || "Varios";
      if (!acc[g]) acc[g] = [];
      acc[g].push(food);
      return acc;
    },
    {} as Record<string, DietFood[]>,
  );
}

// ─── Cover Page ──────────────────────────────────────────────────────────────

function CoverPage({ data }: { data: DietPdfData }) {
  const grouped = groupFoods(data.foods);
  const groupCount = Object.keys(grouped).length;

  const extraMeta = [
    { label: "Alimentos", value: `${data.foods.length}` },
    { label: "Grupos", value: `${groupCount}` },
  ];

  return (
    <Page size="A4" style={S.page}>
      <PdfBrandedHeader
        title={data.dietName || "Plan de Alimentación"}
        subtitle="Pauta Nutricional Personalizada"
        badgeLabel="Plan Nutricional"
        objective={data.planObjective?.trim() || "Planificación de porciones y distribución de nutrientes."}
        patientName={data.patientName}
        date={data.generatedAt}
        extraMeta={extraMeta}
      />

      {/* Stats Summary */}
      <View style={S.statsGrid}>
        <View style={S.statCard}>
          <Text style={S.statLabel}>Total Alimentos</Text>
          <Text style={S.statVal}>{data.foods.length}</Text>
        </View>
        <View style={S.statCard}>
          <Text style={S.statLabel}>Grupos Alimentarios</Text>
          <Text style={S.statVal}>{groupCount}</Text>
        </View>
        <View style={S.statCard}>
          <Text style={S.statLabel}>Restricciones Activas</Text>
          <Text style={S.statVal}>{data.activeConstraints?.length || 0}</Text>
        </View>
      </View>

      {/* Tags if present */}
      {data.dietTags && data.dietTags.length > 0 && (
        <View style={S.tagsRow}>
          {data.dietTags.map((tag, i) => (
            <View key={i} style={S.tagPill}>
              <Text style={S.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Alimentos a evitar / Restricciones si las tiene */}
      {data.activeConstraints && data.activeConstraints.length > 0 && (
        <PdfAvoidFoodsSection avoidFoods={data.activeConstraints} title="Restricciones aplicadas a este plan" />
      )}

      {/* Top alimentos destacados */}
      <View style={S.section}>
        <PdfSectionHeader title="Resumen de Grupos Alimenticios" icon="leaf" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {Object.entries(grouped).map(([grupo, foods], idx) => (
            <View
              key={idx}
              style={{
                width: "48%",
                backgroundColor: colors.slate50,
                borderWidth: 1,
                borderColor: colors.slate200,
                borderRadius: 8,
                padding: 6,
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: colors.primaryDark }}>
                {grupo}
              </Text>
              <Text style={{ fontSize: 7, color: colors.slate500, marginTop: 1 }}>
                {foods.length} alimentos seleccionados
              </Text>
            </View>
          ))}
        </View>
      </View>

      <PdfBrandedFooter />
    </Page>
  );
}

// ─── Food Table Page ──────────────────────────────────────────────────────────

function FoodTablePage({
  grouped,
  patientName,
  dietName,
}: {
  grouped: Record<string, DietFood[]>;
  patientName?: string;
  dietName: string;
}) {
  return (
    <Page size="A4" style={S.page}>
      <PdfSectionHeader title={`Catálogo de Alimentos · ${dietName}`} icon="cutlery" />

      {Object.entries(grouped).map(([grupo, foods]) => (
        <View key={grupo} style={{ marginBottom: 4 }}>
          <View style={S.groupHeader}>
            <Text style={S.groupName}>{grupo}</Text>
            <Text style={S.groupCount}>{foods.length} alimentos</Text>
          </View>

          <View style={S.tableWrapper}>
            <View style={S.tableHeader}>
              <Text style={{ ...S.tableHeaderCell, flex: 3 }}>Alimento</Text>
              <Text style={{ ...S.tableHeaderCell, flex: 1 }}>Unidad</Text>
              <Text style={{ ...S.tableHeaderCell, flex: 1, textAlign: "center" }}>Cal.</Text>
              <Text style={{ ...S.tableHeaderCell, flex: 1, textAlign: "center" }}>Prot.</Text>
              <Text style={{ ...S.tableHeaderCell, flex: 1, textAlign: "center" }}>Carb.</Text>
              <Text style={{ ...S.tableHeaderCell, flex: 1, textAlign: "center" }}>Grasas</Text>
            </View>

            {foods.map((food, idx) => (
              <View key={food.producto} style={[S.tableRow, idx % 2 === 1 ? S.tableRowAlt : {}]}>
                <Text style={{ ...S.tableCellBold, flex: 3 }}>{food.producto}</Text>
                <Text style={{ ...S.tableCell, flex: 1 }}>{food.unidad ?? "100g"}</Text>
                <Text style={{ ...S.tableCell, flex: 1, textAlign: "center" }}>
                  {food.calorias ? `${Math.round(food.calorias)}` : "—"}
                </Text>
                <Text style={{ ...S.tableCell, flex: 1, textAlign: "center" }}>
                  {food.proteinas ? `${food.proteinas.toFixed(1)}g` : "—"}
                </Text>
                <Text style={{ ...S.tableCell, flex: 1, textAlign: "center" }}>
                  {food.carbohidratos ? `${food.carbohidratos.toFixed(1)}g` : "—"}
                </Text>
                <Text style={{ ...S.tableCell, flex: 1, textAlign: "center" }}>
                  {food.lipidos ? `${food.lipidos.toFixed(1)}g` : "—"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <PdfBrandedFooter />
    </Page>
  );
}

// ─── Main Document ────────────────────────────────────────────────────────────

export function DietPdfDocument({ data }: { data: DietPdfData }) {
  const grouped = groupFoods(data.foods);
  const showFoodTable = data.includeFoodTableSection !== false;

  return (
    <Document
      title={data.dietName || "Dieta NutriNet"}
      author="NutriNet"
      subject="Plan Alimentario Personalizado"
      creator="NutriNet Canva Engine"
    >
      <CoverPage data={data} />
      {showFoodTable && (
        <FoodTablePage
          grouped={grouped}
          patientName={data.patientName}
          dietName={data.dietName}
        />
      )}
    </Document>
  );
}
