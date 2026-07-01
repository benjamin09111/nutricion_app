import React from "react";
import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";

export interface PautaParagraphData {
  title: string;
  foods: string[];
  imagePath: string | null;
}

export interface PautaPatientData {
  name: string;
  ageYears: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  bloodPressure: string | null;
  nextControl: string | null;
}

export interface PautaResourceData {
  title: string;
  content: string;
}

export interface PautaAlimentacionPdfData {
  name: string;
  restriction: string;
  patient: PautaPatientData | null;
  paragraphs: PautaParagraphData[];
  resource: PautaResourceData | null;
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
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: "1px solid #cbd5e1",
  },
  brand: {
    fontSize: 18,
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
  restrictionBadge: {
    backgroundColor: "#ecfdf5",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  restrictionText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#065f46",
    textTransform: "uppercase",
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  patientCard: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
  },
  patientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  patientItem: {
    width: "48%",
    marginBottom: 4,
  },
  patientLabel: {
    fontSize: 7,
    color: "#64748b",
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  patientValue: {
    fontSize: 10,
    color: "#0f172a",
  },
  patientFullRow: {
    width: "100%",
    marginBottom: 4,
  },
  paragraphContainer: {
    marginTop: 12,
    padding: 10,
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    backgroundColor: "#fafafa",
  },
  paragraphTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: "1px solid #e2e8f0",
  },
  paragraphContent: {
    flexDirection: "row",
    gap: 10,
  },
  foodList: {
    flex: 1,
  },
  foodItem: {
    fontSize: 9,
    color: "#334155",
    marginBottom: 3,
    paddingLeft: 4,
  },
  imageContainer: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    padding: 4,
  },
  categoryImage: {
    width: 50,
    height: 50,
    objectFit: "contain",
  },
  placeholderText: {
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
  },
  resourceSection: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 6,
  },
  resourceTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#166534",
    marginBottom: 6,
  },
  resourceContent: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 20,
    paddingTop: 8,
    borderTop: "1px solid #e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#94a3b8",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },
});

export const PautaAlimentacionPdfDocument: React.FC<{ data: PautaAlimentacionPdfData }> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>NutriNet</Text>
          <Text style={styles.title}>{data.name}</Text>
          {data.generatedAt && (
            <Text style={styles.meta}>Generado: {data.generatedAt}</Text>
          )}
        </View>

        <View style={styles.restrictionBadge}>
          <Text style={styles.restrictionText}>
            Restricción: {data.restriction}
          </Text>
        </View>

        {data.patient && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos del Paciente</Text>
            <View style={styles.patientCard}>
              <View style={styles.patientGrid}>
                <View style={styles.patientItem}>
                  <Text style={styles.patientLabel}>Nombre</Text>
                  <Text style={styles.patientValue}>{data.patient.name}</Text>
                </View>
                {data.patient.ageYears !== null && (
                  <View style={styles.patientItem}>
                    <Text style={styles.patientLabel}>Edad</Text>
                    <Text style={styles.patientValue}>{data.patient.ageYears} años</Text>
                  </View>
                )}
                {data.patient.weight !== null && (
                  <View style={styles.patientItem}>
                    <Text style={styles.patientLabel}>Peso</Text>
                    <Text style={styles.patientValue}>{data.patient.weight} kg</Text>
                  </View>
                )}
                {data.patient.height !== null && (
                  <View style={styles.patientItem}>
                    <Text style={styles.patientLabel}>Talla</Text>
                    <Text style={styles.patientValue}>{data.patient.height} cm</Text>
                  </View>
                )}
                {data.patient.bmi !== null && (
                  <View style={styles.patientItem}>
                    <Text style={styles.patientLabel}>IMC</Text>
                    <Text style={styles.patientValue}>{data.patient.bmi}</Text>
                  </View>
                )}
                {data.patient.bloodPressure && (
                  <View style={styles.patientItem}>
                    <Text style={styles.patientLabel}>Presión Arterial</Text>
                    <Text style={styles.patientValue}>{data.patient.bloodPressure}</Text>
                  </View>
                )}
                {data.patient.nextControl && (
                  <View style={styles.patientFullRow}>
                    <Text style={styles.patientLabel}>Próximo Control</Text>
                    <Text style={styles.patientValue}>{data.patient.nextControl}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pautas Alimenticias</Text>
          {data.paragraphs.map((paragraph, index) => (
            <View key={index} style={styles.paragraphContainer}>
              <Text style={styles.paragraphTitle}>{paragraph.title}</Text>
              <View style={styles.paragraphContent}>
                <View style={styles.foodList}>
                  {paragraph.foods.map((food, foodIndex) => (
                    <Text key={foodIndex} style={styles.foodItem}>
                      • {food}
                    </Text>
                  ))}
                </View>
                {paragraph.imagePath && (
                  <View style={styles.imageContainer}>
                    <Image src={paragraph.imagePath} style={styles.categoryImage} />
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {data.resource && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recurso Educativo</Text>
            <View style={styles.resourceSection}>
              <Text style={styles.resourceTitle}>{data.resource.title}</Text>
              <Text style={styles.resourceContent}>
                {data.resource.content.replace(/<[^>]+>/g, "").slice(0, 500)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            NutriNet - Pautas de Alimentación
          </Text>
          <Text style={styles.footerText}>
            Página 1
          </Text>
        </View>
      </Page>
    </Document>
  );
};