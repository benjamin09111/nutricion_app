import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export interface FastMealPlanItem {
  id: string;
  section: string;
  time: string;
  mealText: string;
  portion?: string;
}

export interface FastDeliverableResourcePage {
  resourceId: string;
  title: string;
  content: string;
  variables: Record<string, string>;
}

export interface FastDeliverablePdfData {
  name: string;
  patientName?: string | null;
  patient?: {
    name?: string | null;
    ageYears?: number | null;
    gender?: string | null;
    nutritionalFocus?: string | null;
    fitnessGoals?: string | null;
    restrictions?: string[];
    likes?: string | null;
    source?: "manual" | "imported";
  };
  meals: FastMealPlanItem[];
  avoidFoods: string[];
  resources: FastDeliverableResourcePage[];
  portionGuide: Array<{ category: string; portion: string }>;
  supplementNote?: string;
  generatedAt?: string;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 30,
    paddingHorizontal: 30,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    color: "#0f172a",
    fontSize: 9,
    lineHeight: 1.35,
  },
  header: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: "1px solid #cbd5e1",
  },
  brand: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#059669",
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  meta: {
    fontSize: 8,
    color: "#475569",
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  patientCard: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
  },
  patientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  patientItem: {
    width: "48%",
    marginBottom: 6,
  },
  patientLabel: {
    fontSize: 7,
    color: "#64748b",
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  patientValue: {
    fontSize: 9,
    color: "#0f172a",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#ecfdf5",
    border: "1px solid #a7f3d0",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderLeft: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    borderBottom: "1px solid #e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  cellTime: {
    width: "18%",
    paddingRight: 6,
  },
  cellSection: {
    width: "18%",
    paddingRight: 6,
  },
  cellMeal: {
    width: "44%",
    paddingRight: 6,
  },
  cellPortion: {
    width: "20%",
  },
  cellHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#065f46",
    textTransform: "uppercase",
  },
  muted: {
    color: "#64748b",
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
    border: "1px solid #fdba74",
    borderRadius: 999,
  },
  chipText: {
    fontSize: 8,
    color: "#9a3412",
    fontFamily: "Helvetica-Bold",
  },
  portionGrid: {
    border: "1px solid #e2e8f0",
    borderBottom: "none",
  },
  portionRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  portionCategory: {
    width: "40%",
    fontFamily: "Helvetica-Bold",
  },
  portionValue: {
    width: "60%",
  },
  resourceCard: {
    marginBottom: 6,
    padding: 7,
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
  },
  resourceTitle: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 30,
    right: 30,
    paddingTop: 8,
    borderTop: "1px solid #e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#64748b",
  },
});

export function FastDeliverablePdfDocument({
  data,
}: {
  data: FastDeliverablePdfData;
}) {
  const patientFields = data.patient
    ? [
        {
          label: "Nombre",
          value: data.patient.name?.trim() || "",
        },
        {
          label: "Edad",
          value:
            data.patient.ageYears !== null && data.patient.ageYears !== undefined
              ? `${data.patient.ageYears} años`
              : "",
        },
        {
          label: "Sexo",
          value: data.patient.gender?.trim() || "",
        },
        {
          label: "Origen",
          value:
            data.patient.source === "imported"
              ? "Paciente importado"
              : data.patient.source === "manual"
                ? "Datos manuales"
                : "",
        },
        {
          label: "Enfoque",
          value: data.patient.nutritionalFocus?.trim() || "",
        },
        {
          label: "Metas",
          value: data.patient.fitnessGoals?.trim() || "",
        },
        {
          label: "Restricciones",
          value: (data.patient.restrictions || [])
            .map((restriction) => restriction.trim())
            .filter(Boolean)
            .join(", "),
        },
        {
          label: "Gustos",
          value: data.patient.likes?.trim() || "",
        },
      ].filter((item) => item.value.trim().length > 0)
    : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>NutriSaaS</Text>
          <Text style={styles.title}>{data.name || "Entregable rápido"}</Text>
          <Text style={styles.meta}>
            {data.patientName ? `Paciente: ${data.patientName}` : "Formato express"}{" "}
            • {data.generatedAt || new Date().toLocaleDateString("es-CL")}
          </Text>
        </View>

        {data.patient ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos del paciente</Text>
            <View style={styles.patientCard}>
              <View style={styles.patientGrid}>
                <View style={styles.patientItem}>
                  <Text style={styles.patientLabel}>Nombre</Text>
                  <Text style={styles.patientValue}>{data.patient.name || "-"}</Text>
                </View>
                <View style={styles.patientItem}>
                  <Text style={styles.patientLabel}>Edad</Text>
                  <Text style={styles.patientValue}>
                    {data.patient.ageYears !== null && data.patient.ageYears !== undefined
                      ? `${data.patient.ageYears} años`
                      : "-"}
                  </Text>
                </View>
                <View style={styles.patientItem}>
                  <Text style={styles.patientLabel}>Sexo</Text>
                  <Text style={styles.patientValue}>{data.patient.gender || "-"}</Text>
                </View>
                <View style={styles.patientItem}>
                  <Text style={styles.patientLabel}>Origen</Text>
                  <Text style={styles.patientValue}>
                    {data.patient.source === "imported" ? "Paciente importado" : "Datos manuales"}
                  </Text>
                </View>
                <View style={styles.patientItem}>
                  <Text style={styles.patientLabel}>Enfoque</Text>
                  <Text style={styles.patientValue}>{data.patient.nutritionalFocus || "-"}</Text>
                </View>
                <View style={styles.patientItem}>
                  <Text style={styles.patientLabel}>Metas</Text>
                  <Text style={styles.patientValue}>{data.patient.fitnessGoals || "-"}</Text>
                </View>
              </View>
              <View style={{ marginTop: 6 }}>
                <Text style={styles.patientLabel}>Restricciones</Text>
                <Text style={styles.patientValue}>
                  {data.patient.restrictions && data.patient.restrictions.length > 0
                    ? data.patient.restrictions.join(", ")
                    : "-"}
                </Text>
              </View>
              <View style={{ marginTop: 6 }}>
                <Text style={styles.patientLabel}>Gustos</Text>
                <Text style={styles.patientValue}>{data.patient.likes || "-"}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tabla de comidas</Text>
          <View style={styles.tableHeader}>
            <View style={styles.cellTime}>
              <Text style={styles.cellHeaderText}>Hora</Text>
            </View>
            <View style={styles.cellSection}>
              <Text style={styles.cellHeaderText}>Sección</Text>
            </View>
            <View style={styles.cellMeal}>
              <Text style={styles.cellHeaderText}>Indicación</Text>
            </View>
            <View style={styles.cellPortion}>
              <Text style={styles.cellHeaderText}>Porción</Text>
            </View>
          </View>
          {data.meals.length > 0 ? (
            data.meals.map((meal) => (
              <View key={meal.id} style={styles.tableRow}>
                <View style={styles.cellTime}>
                  <Text>{meal.time || "-"}</Text>
                </View>
                <View style={styles.cellSection}>
                  <Text>{meal.section}</Text>
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
              <Text style={styles.muted}>Sin comidas configuradas.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alimentos a evitar</Text>
          {data.avoidFoods.length > 0 ? (
            <View style={styles.chipWrap}>
              {data.avoidFoods.map((food, index) => (
                <View key={`${food}-${index}`} style={styles.chip}>
                  <Text style={styles.chipText}>{food}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>Sin restricciones específicas registradas.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guía rápida de porciones</Text>
          <View style={styles.portionGrid}>
            {data.portionGuide.map((item) => (
              <View key={item.category} style={styles.portionRow}>
                <Text style={styles.portionCategory}>{item.category}</Text>
                <Text style={styles.portionValue}>{item.portion}</Text>
              </View>
            ))}
          </View>
        </View>

        {data.supplementNote ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suplemento</Text>
            <Text>{data.supplementNote}</Text>
          </View>
        ) : null}

        {data.resources.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recursos específicos</Text>
            {data.resources.slice(0, 3).map((resource, index) => (
              <View key={`${resource.resourceId}-${index}`} style={styles.resourceCard}>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <Text>{resource.content}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text>Entregable rápido</Text>
          <Text>Uso clínico express</Text>
        </View>
      </Page>
    </Document>
  );
}
