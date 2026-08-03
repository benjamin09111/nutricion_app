import React from "react";
import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";

export interface FastMealPlanItem {
  id: string;
  section: string;
  time: string;
  mealText: string;
  portion?: string;
}

export interface FastDeliverableParagraphItem {
  title: string;
  subtitle?: string;
  foods: string[];
  imagePath?: string | null;
}

export interface FastDeliverableResourcePage {
  resourceId: string;
  title: string;
  content: string;
  variables?: Record<string, string>;
}

export interface FastDeliverablePdfData {
  name: string;
  patientName?: string | null;
  patient?: {
    name?: string | null;
    ageYears?: number | null;
    weight?: number | null;
    height?: number | null;
    bmi?: number | null;
  } | null;
  clinicalRestriction?: string | null;
  contentMode?: "table" | "paragraphs";
  paragraphs?: FastDeliverableParagraphItem[];
  nutritionistName?: string | null;
  nutritionistEmail?: string | null;
  planObjective?: string;
  showPlanObjectiveInPdf?: boolean;
  meals: FastMealPlanItem[];
  avoidFoods: string[];
  resources: FastDeliverableResourcePage[];
  portionGuide: Array<{ category: string; portion: string }>;
  supplementNote?: string;
  generatedAt?: string;
}

type ResourceBlock = {
  text: string;
  kind: "paragraph" | "heading" | "bullet";
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)));

const parseResourceContent = (content: string): ResourceBlock[] => {
  const normalized = content
    .replace(/(<li[^>]*>)\s*<p[^>]*>/gi, "$1")
    .replace(/<\/p>\s*(?=<\/li>)/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<h[1-6][^>]*>/gi, "\n__HEADING__")
    .replace(/<\/h[1-6\s]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n__BULLET__")
    .replace(/<\/li\s*>/gi, "\n")
    .replace(/<\/?(?:p|div|section|article|blockquote)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  return decodeHtmlEntities(normalized)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("__HEADING__")) {
        return { kind: "heading" as const, text: line.slice("__HEADING__".length).trim() };
      }
      if (line.startsWith("__BULLET__")) {
        return { kind: "bullet" as const, text: line.slice("__BULLET__".length).trim() };
      }
      return { kind: "paragraph" as const, text: line };
    });
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 32,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    color: "#0f172a",
    fontSize: 9,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "2px solid #059669",
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  headerRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  brand: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#059669",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  metaText: {
    fontSize: 8.5,
    color: "#475569",
  },
  objective: {
    fontSize: 9,
    color: "#065f46",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  patientMetaRow: {
    fontSize: 8.5,
    color: "#334155",
    marginBottom: 2,
  },
  patientMetaLabel: {
    fontFamily: "Helvetica-Bold",
    color: "#475569",
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#059669",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  paragraphContainer: {
    marginTop: 8,
    padding: 10,
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    backgroundColor: "#f8fafc",
  },
  paragraphTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 4,
    paddingBottom: 4,
    borderBottom: "1px solid #e2e8f0",
  },
  paragraphSubtitle: {
    fontSize: 8.5,
    color: "#475569",
    marginBottom: 6,
  },
  paragraphContent: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  paragraphInfo: {
    flex: 1,
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 4,
    padding: 8,
  },
  foodList: {
    flex: 1,
  },
  foodItem: {
    fontSize: 8.5,
    color: "#334155",
    marginBottom: 2,
    paddingLeft: 4,
  },
  imageContainer: {
    width: 118,
    minHeight: 104,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    padding: 4,
  },
  categoryImage: {
    width: 104,
    height: 96,
    objectFit: "contain",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#ecfdf5",
    borderTop: "1px solid #a7f3d0",
    borderLeft: "1px solid #a7f3d0",
    borderRight: "1px solid #a7f3d0",
    borderBottom: "1px solid #a7f3d0",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderLeft: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    borderBottom: "1px solid #e2e8f0",
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableRowEven: {
    backgroundColor: "#f8fafc",
  },
  cellTime: {
    width: "15%",
    paddingRight: 6,
  },
  cellSection: {
    width: "20%",
    paddingRight: 6,
  },
  cellMeal: {
    width: "45%",
    paddingRight: 6,
  },
  cellPortion: {
    width: "20%",
  },
  cellHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#047857",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  mutedText: {
    fontSize: 8.5,
    color: "#64748b",
    fontStyle: "italic",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: 6,
  },
  chipText: {
    fontSize: 8.5,
    color: "#c2410c",
    fontFamily: "Helvetica-Bold",
  },
  portionHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderTop: "1px solid #cbd5e1",
    borderLeft: "1px solid #cbd5e1",
    borderRight: "1px solid #cbd5e1",
    borderBottom: "1px solid #cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  portionRow: {
    flexDirection: "row",
    borderLeft: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    borderBottom: "1px solid #e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  portionCategory: {
    width: "40%",
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  portionValue: {
    width: "60%",
    color: "#334155",
  },
  resourceCard: {
    width: "100%",
    marginBottom: 12,
  },
  resourceTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  resourceHeading: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginTop: 5,
    marginBottom: 3,
  },
  resourceParagraph: {
    fontSize: 8.5,
    color: "#334155",
    lineHeight: 1.4,
    marginBottom: 5,
  },
  resourceBullet: {
    fontSize: 8.5,
    color: "#334155",
    lineHeight: 1.4,
    marginBottom: 3,
    paddingLeft: 8,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    paddingTop: 6,
    borderTop: "1px solid #e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 7.5,
    color: "#64748b",
  },
  footerBrand: {
    fontFamily: "Helvetica-Bold",
    color: "#059669",
  },
});

export function FastDeliverablePdfDocument({
  data,
}: {
  data: FastDeliverablePdfData;
}) {
  const patientName = data.patient?.name || data.patientName;
  const ageDisplay = data.patient?.ageYears
    ? `${data.patient.ageYears} años`
    : "No registrada";
  const weightDisplay = data.patient?.weight
    ? `${data.patient.weight} kg`
    : "No registrado";
  const heightDisplay = data.patient?.height
    ? `${data.patient.height} cm`
    : "No registrada";
  const bmiDisplay = data.patient?.bmi ? `${data.patient.bmi}` : null;

  const nutritionistName = data.nutritionistName?.trim() || "Nutricionista";
  const nutritionistEmail = data.nutritionistEmail?.trim() || "";
  const isParagraphsMode = data.contentMode === "paragraphs" && (data.paragraphs?.length || 0) > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brand}>NutriNet</Text>
            <Text style={styles.title}>{data.name || "Entregable Rápido"}</Text>
            {data.showPlanObjectiveInPdf && data.planObjective?.trim() ? (
              <Text style={styles.objective}>Objetivo: {data.planObjective.trim()}</Text>
            ) : null}
            <Text style={styles.metaText}>
              {patientName ? `Paciente: ${patientName}` : "Entregable Express"}
              {data.clinicalRestriction ? ` • Restricción: ${data.clinicalRestriction}` : ""}
              {" • "}{data.generatedAt || new Date().toLocaleDateString("es-CL")}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.patientMetaRow}>
              <Text style={styles.patientMetaLabel}>Edad: </Text>
              {ageDisplay}
            </Text>
            <Text style={styles.patientMetaRow}>
              <Text style={styles.patientMetaLabel}>Peso: </Text>
              {weightDisplay}
            </Text>
            <Text style={styles.patientMetaRow}>
              <Text style={styles.patientMetaLabel}>Altura: </Text>
              {heightDisplay}
            </Text>
            {bmiDisplay && (
              <Text style={styles.patientMetaRow}>
                <Text style={styles.patientMetaLabel}>IMC: </Text>
                {bmiDisplay}
              </Text>
            )}
          </View>
        </View>

        {/* Pautas alimenticias en párrafos O Tabla de comidas */}
        {isParagraphsMode ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pautas alimenticias</Text>
            {data.paragraphs!.map((paragraph, index) => (
              <View key={index} style={styles.paragraphContainer}>
                <Text style={styles.paragraphTitle}>{paragraph.title}</Text>
                {paragraph.subtitle ? (
                  <Text style={styles.paragraphSubtitle}>{paragraph.subtitle}</Text>
                ) : null}
                <View style={styles.paragraphContent}>
                  <View style={styles.paragraphInfo}>
                    <View style={styles.foodList}>
                      {paragraph.foods.map((food, foodIndex) => (
                        <Text key={foodIndex} style={styles.foodItem}>
                          • {food}
                        </Text>
                      ))}
                    </View>
                  </View>
                  {paragraph.imagePath && (
                    <View style={styles.imageContainer}>
                      {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image has no alt prop. */}
                      <Image src={paragraph.imagePath} style={styles.categoryImage} />
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plan de comidas</Text>
            <View style={styles.tableHeader}>
              <View style={styles.cellTime}>
                <Text style={styles.cellHeaderText}>Hora</Text>
              </View>
              <View style={styles.cellSection}>
                <Text style={styles.cellHeaderText}>Sección</Text>
              </View>
              <View style={styles.cellMeal}>
                <Text style={styles.cellHeaderText}>Indicación / Alimentos</Text>
              </View>
              <View style={styles.cellPortion}>
                <Text style={styles.cellHeaderText}>Porción</Text>
              </View>
            </View>
            {data.meals && data.meals.length > 0 ? (
              data.meals.map((meal, index) => (
                <View
                  key={meal.id || index}
                  style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.tableRowEven : {},
                  ]}
                >
                  <View style={styles.cellTime}>
                    <Text>{meal.time || "-"}</Text>
                  </View>
                  <View style={styles.cellSection}>
                    <Text>{meal.section || "-"}</Text>
                  </View>
                  <View style={styles.cellMeal}>
                    <Text>{meal.mealText || "-"}</Text>
                  </View>
                  <View style={styles.cellPortion}>
                    <Text>{meal.portion || "-"}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={styles.mutedText}>Sin comidas configuradas.</Text>
              </View>
            )}
          </View>
        )}

        {/* Alimentos a evitar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alimentos a evitar</Text>
          {data.avoidFoods && data.avoidFoods.length > 0 ? (
            <View style={styles.chipWrap}>
              {data.avoidFoods.map((food, index) => (
                <View key={`${food}-${index}`} style={styles.chip}>
                  <Text style={styles.chipText}>{food}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.mutedText}>No tiene</Text>
          )}
        </View>

        {/* Suplemento opcional */}
        {data.supplementNote ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suplemento</Text>
            <Text style={styles.metaText}>{data.supplementNote}</Text>
          </View>
        ) : null}

        {/* Recursos Educativos */}
        {data.resources && data.resources.length > 0 ? (
          <View style={styles.section}>
            {data.resources.map((resource, index) => (
              <View
                key={`${resource.resourceId}-${index}`}
                style={styles.resourceCard}
              >
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                {parseResourceContent(resource.content)
                  .map((block, blockIdx) => (
                    <Text
                      key={`${block.kind}-${blockIdx}`}
                      style={
                        block.kind === "heading"
                          ? styles.resourceHeading
                          : block.kind === "bullet"
                            ? styles.resourceBullet
                            : styles.resourceParagraph
                      }
                    >
                      {block.kind === "bullet" ? "• " : ""}{block.text}
                    </Text>
                  ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Guía rápida de porciones (Hoja aparte al final) */}
        {data.portionGuide && data.portionGuide.length > 0 ? (
          <View break style={styles.section}>
            <Text style={styles.sectionTitle}>Guía rápida de porciones</Text>
            <View style={styles.portionHeader}>
              <Text style={[styles.portionCategory, styles.cellHeaderText]}>
                Categoría
              </Text>
              <Text style={[styles.portionValue, styles.cellHeaderText]}>
                Porción Sugerida
              </Text>
            </View>
            {data.portionGuide.map((item, index) => (
              <View
                key={`${item.category}-${index}`}
                style={[
                  styles.portionRow,
                  index % 2 === 1 ? styles.tableRowEven : {},
                ]}
              >
                <Text style={styles.portionCategory}>{item.category}</Text>
                <Text style={styles.portionValue}>{item.portion}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Pie de página estático en todas las páginas */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>NutriNet</Text>
          <Text>
            {nutritionistName}
            {nutritionistEmail ? ` (${nutritionistEmail})` : ""}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

