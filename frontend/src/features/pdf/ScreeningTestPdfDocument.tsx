"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ScreeningTestCreationContent } from "@/features/screening-tests/types";
import { getTestDefinition } from "@/features/screening-tests/definitions";
import { colors } from "./styles/pdfStyles";
import {
  PdfBrandedHeader,
  PdfSectionHeader,
  PdfBrandedFooter,
} from "./components";

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 28,
    backgroundColor: colors.white,
    fontFamily: "Helvetica",
    color: colors.slate800,
    fontSize: 9.5,
    lineHeight: 1.4,
  },
  section: {
    marginBottom: 8,
  },
  resultCard: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.slate50,
  },
  resultTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: colors.slate600,
    marginBottom: 2,
  },
  scoreText: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
  },
  cardBox: {
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 8,
    padding: 6,
    marginBottom: 6,
  },
  questionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    alignItems: "center",
  },
  questionLabel: {
    fontSize: 8,
    color: colors.slate700,
    flex: 1,
    paddingRight: 6,
  },
  questionValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
  },
  recBox: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  recTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
    marginBottom: 2,
  },
  recText: {
    fontSize: 7.5,
    color: colors.slate700,
    lineHeight: 1.35,
  },
});

export interface ScreeningTestPdfData {
  name?: string;
  content: ScreeningTestCreationContent;
}

export function ScreeningTestPdfDocument({ data }: { data: ScreeningTestPdfData }) {
  const content = data.content;
  const definition = getTestDefinition(content.testType);
  const resColor = content.result?.color || colors.primary;

  const extraMeta = [
    { label: "Puntaje", value: `${content.result?.total ?? "—"}` },
    { label: "Categoría", value: content.result?.category || "Evaluado" },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfBrandedHeader
          title={definition?.name || content.testType || "Evaluación Nutricional"}
          subtitle="Informe de Evaluación del Riesgo Nutricional"
          badgeLabel="Tamizaje Clínico"
          objective="Evaluación estandarizada según protocolos y guías clínicas."
          patientName={content.patientName || "Sin nombre"}
          date={content.appliedAt ? new Date(content.appliedAt).toISOString() : undefined}
          extraMeta={extraMeta}
        />

        {/* Result Card */}
        <View style={styles.resultCard}>
          <View>
            <Text style={styles.resultTitle}>Resultado del Tamizaje</Text>
            <Text style={styles.scoreText}>
              {content.result?.total} {definition?.type !== "ATALAH" ? `/ ${definition?.maxScore || 30} pts` : "IMC"}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: resColor }]}>
            <Text style={styles.badgeText}>{content.result?.category || "Normal"}</Text>
          </View>
        </View>

        {/* Question Answers Details */}
        {definition?.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <PdfSectionHeader title={section.title} icon="clinical" />
            <View style={styles.cardBox}>
              {section.questions.map((q) => {
                const val = content.answers[q.id];
                const selectedOption = q.options.find((opt) => opt.value === val);
                return (
                  <View key={q.id} style={styles.questionRow}>
                    <Text style={styles.questionLabel}>{q.label}</Text>
                    <Text style={styles.questionValue}>
                      {selectedOption?.label || `${val} pts`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Recommendation */}
        {content.result?.recommendation && (
          <View style={styles.recBox}>
            <Text style={styles.recTitle}>Recomendación Clínica</Text>
            <Text style={styles.recText}>{content.result.recommendation}</Text>
          </View>
        )}

        <PdfBrandedFooter />
      </Page>
    </Document>
  );
}
