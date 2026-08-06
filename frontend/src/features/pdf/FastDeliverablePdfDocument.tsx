import React from "react";
import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";

export interface FastMealPlanItem {
  id: string;
  section: string;
  time: string;
  mealText: string;
  portion?: string;
  optionTexts?: string[];
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
  contentMode?: "table" | "paragraphs" | "both";
  tableMode?: "simple" | "options";
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
    color: "#251d32",
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "4px solid #7c5cac",
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
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#7c5cac",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#3f2c5f",
    marginBottom: 6,
    lineHeight: 1.15,
  },
  metaText: {
    fontSize: 9.5,
    color: "#475569",
  },
  objective: {
    fontSize: 11,
    color: "#5f438f",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  patientMetaRow: {
    fontSize: 9,
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
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    backgroundColor: "#7c5cac",
    marginBottom: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    letterSpacing: 0.1,
  },
  paragraphContainer: {
    marginTop: 10,
    marginBottom: 8,
  },
  paragraphTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#5f438f",
    marginBottom: 3,
  },
  paragraphSubtitle: {
    fontSize: 9.5,
    color: "#475569",
    marginBottom: 6,
  },
  paragraphContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  paragraphInfo: {
    width: "49%",
    flexGrow: 0,
  },
  foodText: {
    fontSize: 10.5,
    color: "#334155",
    lineHeight: 1.7,
  },
  imageContainer: {
    width: "49%",
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  categoryImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#5f438f",
    borderTop: "1px solid #5f438f",
    borderLeft: "1px solid #5f438f",
    borderRight: "1px solid #5f438f",
    borderBottom: "1px solid #5f438f",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderLeft: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    borderBottom: "1px solid #e2e8f0",
    paddingVertical: 8,
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
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  optionsSectionCell: {
    paddingRight: 6,
  },
  optionsCell: {
    paddingLeft: 5,
    paddingRight: 5,
  },
  mutedText: {
    fontSize: 9.5,
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
    fontSize: 9.5,
    color: "#c2410c",
    fontFamily: "Helvetica-Bold",
  },
  portionHeader: {
    flexDirection: "row",
    backgroundColor: "#5f438f",
    borderTop: "1px solid #5f438f",
    borderLeft: "1px solid #5f438f",
    borderRight: "1px solid #5f438f",
    borderBottom: "1px solid #5f438f",
    paddingVertical: 8,
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
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#5f438f",
    marginBottom: 4,
  },
  resourceHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#5f438f",
    marginTop: 5,
    marginBottom: 3,
  },
  resourceParagraph: {
    fontSize: 9.5,
    color: "#334155",
    lineHeight: 1.4,
    marginBottom: 5,
  },
  resourceBullet: {
    fontSize: 9.5,
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
    color: "#7c5cac",
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
  const showTable =
    (data.contentMode === "table" || data.contentMode === "both" || !data.contentMode) &&
    (data.meals?.length || 0) > 0;
  const showParagraphs =
    (data.contentMode === "paragraphs" || data.contentMode === "both") &&
    (data.paragraphs?.length || 0) > 0;
  const isOptionsTable = data.tableMode === "options";
  const optionCount = Math.max(1, Math.min(3, Math.max(...data.meals.map((meal) => meal.optionTexts?.length || 0))));
  const optionSectionWidth = `${Math.max(18, 30 - optionCount * 2)}%`;
  const optionWidth = `${(100 - Math.max(18, 30 - optionCount * 2)) / optionCount}%`;

  return (
    <Document>
      <Page size="A4" orientation={isOptionsTable ? "landscape" : "portrait"} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brand}>NutriNet</Text>
            <Text style={styles.title}>{data.name || "Entregable Rápido"}</Text>
             {data.planObjective?.trim() ? (
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

        {/* Tabla de comidas (si aplica) */}
        {showTable && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plan de comidas</Text>
            {isOptionsTable ? (
              <>
                <View style={styles.tableHeader}>
                  <View style={[styles.optionsSectionCell, { width: optionSectionWidth }]}>
                    <Text style={styles.cellHeaderText}>Tiempo de comida</Text>
                  </View>
                  {Array.from({ length: optionCount }, (_, index) => (
                    <View key={index} style={[styles.optionsCell, { width: optionWidth }]}>
                      <Text style={styles.cellHeaderText}>Opción {index + 1}</Text>
                    </View>
                  ))}
                </View>
                {data.meals.map((meal, index) => (
                  <View key={meal.id || index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowEven : {}]}>
                    <View style={[styles.optionsSectionCell, { width: optionSectionWidth }]}>
                      <Text>{meal.section || "-"}</Text>
                    </View>
                    {Array.from({ length: optionCount }, (_, optionIndex) => (
                      <View key={optionIndex} style={[styles.optionsCell, { width: optionWidth }]}>
                        <Text>{meal.optionTexts?.[optionIndex] || "-"}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </>
            ) : <>
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
              {data.meals.map((meal, index) => (
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
              ))}
            </>}
          </View>
        )}

        {/* Pautas alimenticias en párrafos (si aplica) */}
        {showParagraphs && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pautas alimenticias por categoría</Text>
            {data.paragraphs!.map((paragraph, index) => (
              <View key={index} style={styles.paragraphContainer} wrap={false}>
                <View style={styles.paragraphContent}>
                  <View style={paragraph.imagePath ? styles.paragraphInfo : { width: "100%" }}>
                    <Text style={styles.paragraphTitle}>{paragraph.title}</Text>
                    {paragraph.subtitle ? (
                      <Text style={styles.paragraphSubtitle}>{paragraph.subtitle}</Text>
                    ) : null}
                    <Text style={styles.foodText}>
                      {paragraph.foods.map((food) => `• ${food}`).join("\n")}
                    </Text>
                  </View>
                  {paragraph.imagePath ? (
                    <View style={styles.imageContainer}>
                      {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image has no alt prop. */}
                      <Image
                        src={
                          paragraph.imagePath.startsWith("http") || paragraph.imagePath.startsWith("data:")
                            ? paragraph.imagePath
                            : typeof window !== "undefined"
                              ? `${window.location.origin}${paragraph.imagePath.startsWith("/") ? "" : "/"}${paragraph.imagePath}`
                              : paragraph.imagePath
                        }
                        style={styles.categoryImage}
                      />
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
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
                wrap={false}
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

        {/* Pie de página estático en todas las páginas */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>NutriNet</Text>
          <Text>
            {nutritionistName}
            {nutritionistEmail ? ` (${nutritionistEmail})` : ""}
          </Text>
        </View>
      </Page>

      {data.portionGuide && data.portionGuide.length > 0 ? (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
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

          <View style={styles.footer} fixed>
            <Text style={styles.footerBrand}>NutriNet</Text>
            <Text>
              {nutritionistName}
              {nutritionistEmail ? ` (${nutritionistEmail})` : ""}
            </Text>
          </View>
        </Page>
      ) : null}
    </Document>
  );
}

