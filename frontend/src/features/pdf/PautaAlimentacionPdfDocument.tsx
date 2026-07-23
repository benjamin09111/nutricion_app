import React from "react";
import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";

export interface PautaParagraphData {
  title: string;
  subtitle?: string;
  foods: string[];
  imagePath: string | null;
}

export interface PautaPatientData {
  name: string;
  ageYears: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bloodPressure?: string | null;
  nextControl: string | null;
}

export interface PautaResourceData {
  title: string;
  content: string;
}

export interface PautaMealData {
  id: string;
  section: string;
  time: string;
  mealText: string;
  portion: string;
}

export interface PautaAlimentacionPdfData {
  name: string;
  restriction: string;
  patient: PautaPatientData | null;
  pautaEditorMode: "paragraphs" | "table";
  paragraphs: PautaParagraphData[];
  meals: PautaMealData[];
  avoidFoods: string[];
  resource: PautaResourceData | null;
  nutritionistName?: string | null;
  nutritionistEmail?: string | null;
  generatedAt?: string;
}

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
    border: "1px solid #a7f3d0",
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
  cellTime: { width: "15%", paddingRight: 6 },
  cellSection: { width: "20%", paddingRight: 6 },
  cellMeal: { width: "45%", paddingRight: 6 },
  cellPortion: { width: "20%" },
  cellHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#047857",
    textTransform: "uppercase",
    letterSpacing: 0.3,
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
  resourceCard: {
    width: "100%",
    marginTop: 8,
  },
  resourceContent: {
    fontSize: 8.5,
    color: "#334155",
    lineHeight: 1.4,
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

export const PautaAlimentacionPdfDocument: React.FC<{ data: PautaAlimentacionPdfData }> = ({
  data,
}) => {
  const patientName = data.patient?.name;
  const ageDisplay = data.patient?.ageYears ? `${data.patient.ageYears} años` : "No registrada";
  const weightDisplay = data.patient?.weight ? `${data.patient.weight} kg` : "No registrado";
  const heightDisplay = data.patient?.height ? `${data.patient.height} cm` : "No registrada";
  const bmiDisplay = data.patient?.bmi ? `${data.patient.bmi}` : null;
  const bpDisplay = data.patient?.bloodPressure ? `${data.patient.bloodPressure}` : null;

  const nutritionistName = data.nutritionistName?.trim() || "Nutricionista";
  const nutritionistEmail = data.nutritionistEmail?.trim() || "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brand}>NutriNet</Text>
            <Text style={styles.title}>{data.name || "Pauta de Alimentación"}</Text>
            <Text style={styles.metaText}>
              {patientName ? `Paciente: ${patientName}` : "Pauta de Alimentación"}{" "}
              {data.restriction ? ` • Restricción: ${data.restriction}` : ""}{" "}
              • {data.generatedAt || new Date().toLocaleDateString("es-CL")}
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

        {data.pautaEditorMode === "table" ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Plan de comidas</Text>
              <View style={styles.tableHeader}>
                <View style={styles.cellTime}><Text style={styles.cellHeaderText}>Hora</Text></View>
                <View style={styles.cellSection}><Text style={styles.cellHeaderText}>Categoría</Text></View>
                <View style={styles.cellMeal}><Text style={styles.cellHeaderText}>Indicación / Alimentos</Text></View>
                <View style={styles.cellPortion}><Text style={styles.cellHeaderText}>Porción</Text></View>
              </View>
              {data.meals.map((meal, index) => (
                <View key={meal.id || index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowEven : {}]}>
                  <View style={styles.cellTime}><Text>{meal.time || "-"}</Text></View>
                  <View style={styles.cellSection}><Text>{meal.section || "-"}</Text></View>
                  <View style={styles.cellMeal}><Text>{meal.mealText || "-"}</Text></View>
                  <View style={styles.cellPortion}><Text>{meal.portion || "-"}</Text></View>
                </View>
              ))}
            </View>
            {data.avoidFoods.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Alimentos a evitar</Text>
                <View style={styles.chipWrap}>
                  {data.avoidFoods.map((food, index) => (
                    <View key={`${food}-${index}`} style={styles.chip}><Text style={styles.chipText}>{food}</Text></View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pautas alimenticias</Text>
            {data.paragraphs.map((paragraph, index) => (
              <View key={index} style={styles.paragraphContainer}>
                <Text style={styles.paragraphTitle}>{paragraph.title}</Text>
                {paragraph.subtitle ? <Text style={styles.paragraphSubtitle}>{paragraph.subtitle}</Text> : null}
                <View style={styles.paragraphContent}>
                  <View style={styles.paragraphInfo}>
                    <View style={styles.foodList}>
                      {paragraph.foods.map((food, foodIndex) => (
                        <Text key={foodIndex} style={styles.foodItem}>• {food}</Text>
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
        )}

        {/* Recurso Educativo (Como bloque sin borde ni fondo gris) */}
        {data.resource && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{data.resource.title}</Text>
            <View style={styles.resourceCard}>
              <Text style={styles.resourceContent}>
                {data.resource.content.replace(/<[^>]+>/g, "").slice(0, 800)}
              </Text>
            </View>
          </View>
        )}

        {/* Pie de página fijo en todas las páginas */}
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
};
