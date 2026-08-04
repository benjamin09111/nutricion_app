"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ScreeningTestCreationContent } from "@/features/screening-tests/types";
import { getTestDefinition } from "@/features/screening-tests/definitions";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#251d32",
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#7c5cac",
    borderBottomStyle: "solid",
    paddingBottom: 10,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 23,
    fontFamily: "Helvetica-Bold",
    color: "#3f2c5f",
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  brand: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#7c5cac",
  },
  patientBox: {
    backgroundColor: "#f5f1fa",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  patientText: {
    fontSize: 10,
    color: "#334155",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  resultCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#475569",
    marginBottom: 3,
  },
  scoreText: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#7c5cac",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    borderBottomStyle: "solid",
    paddingBottom: 3,
    marginBottom: 8,
    marginTop: 10,
  },
  questionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
    borderBottomStyle: "solid",
  },
  questionLabel: {
    fontSize: 9.5,
    color: "#334155",
    width: "75%",
  },
  questionValue: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    width: "25%",
    textAlign: "right",
  },
  recBox: {
    backgroundColor: "#f5f1fa",
    borderRadius: 8,
    padding: 10,
    marginTop: 15,
  },
  recTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 3,
  },
  recText: {
    fontSize: 9.5,
    color: "#334155",
    lineHeight: 1.3,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    borderTopStyle: "solid",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7.5,
    color: "#94a3b8",
  },
});

export interface ScreeningTestPdfData {
  name?: string;
  content: ScreeningTestCreationContent;
}

export function ScreeningTestPdfDocument({ data }: { data: ScreeningTestPdfData }) {
  const content = data.content;
  const definition = getTestDefinition(content.testType);

  const resColor = content.result?.color || "#22c55e";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              {definition?.name || content.testType}
            </Text>

            <Text style={styles.subtitle}>
              Informe de Evaluación del Riesgo Nutricional
            </Text>
          </View>
          <Text style={styles.brand}>NutriNet®</Text>
        </View>

        {/* Patient Info */}
        <View style={styles.patientBox}>
          <Text style={styles.patientText}>
            Paciente: <Text style={styles.bold}>{content.patientName || "Sin nombre"}</Text>
          </Text>
          <Text style={styles.patientText}>
            Fecha:{" "}
            <Text style={styles.bold}>
              {new Date(content.appliedAt).toLocaleDateString("es-CL")}
            </Text>
          </Text>
        </View>

        {/* Result Card */}
        <View style={[styles.resultCard, { backgroundColor: `${resColor}15` }]}>
          <View>
            <Text style={styles.resultTitle}>Resultado del Tamizaje</Text>
            <Text style={styles.scoreText}>
              {content.result?.total} {definition?.type !== "ATALAH" ? `/ ${definition?.maxScore || 30} pts` : "IMC"}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: resColor }]}>
            <Text>{content.result?.category}</Text>
          </View>
        </View>

        {/* Question Answers Details */}
        {definition?.sections.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.questions.map((q) => {
              const val = content.answers[q.id];
              const selectedOption = q.options.find((opt) => opt.value === val);
              return (
                <View key={q.id} style={styles.questionRow}>
                  <Text style={styles.questionLabel}>
                    {q.label}
                  </Text>
                  <Text style={styles.questionValue}>
                    {selectedOption?.label || `${val} pts`}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        {/* Recommendation */}
        {content.result?.recommendation && (
          <View style={styles.recBox}>
            <Text style={styles.recTitle}>Recomendación Clínica</Text>
            <Text style={styles.recText}>{content.result.recommendation}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Documento generado por NutriNet — Plataforma Nutricional Clínica Chile
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
