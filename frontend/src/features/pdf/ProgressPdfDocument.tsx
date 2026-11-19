import React from "react";
import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";
import { colors } from "./styles/pdfStyles";
import {
  PdfBrandedHeader,
  PdfSectionHeader,
  PdfBrandedFooter,
} from "./components";

export interface MetricSummary {
  key: string;
  label: string;
  unit: string;
  firstValue: string;
  lastValue: string;
  diff: string;
  diffColor: string;
}

export interface ProgressPdfData {
  patientName: string;
  dateFrom: string;
  dateTo: string;
  metrics: MetricSummary[];
  chartImages: Record<string, string>;
  generatedAt: string;
}

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
  tableWrapper: {
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.slate50,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: colors.slate600,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: colors.slate50,
  },
  tableCell: {
    fontSize: 8,
    color: colors.slate700,
  },
  tableCellBold: {
    fontSize: 8,
    color: colors.primaryDark,
    fontFamily: "Helvetica-Bold",
  },
  // Charts grid
  chartsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chartBlock: {
    width: "48%",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 10,
    padding: 6,
    marginBottom: 6,
  },
  chartTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
    marginBottom: 3,
  },
  chartImage: {
    width: "100%",
    height: 100,
    objectFit: "contain",
    borderRadius: 6,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.slate50,
    borderRadius: 4,
    padding: 3,
    alignItems: "center",
  },
  statVal: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
  },
  statLbl: {
    fontSize: 6,
    color: colors.slate500,
  },
  emptyText: {
    fontSize: 8,
    color: colors.slate400,
    fontStyle: "italic",
    paddingVertical: 10,
    textAlign: "center",
  },
});

export function ProgressPdfDocument({ data }: { data: ProgressPdfData }) {
  const chartKeys = Object.keys(data.chartImages);

  const extraMeta = [
    { label: "Período", value: `${data.dateFrom || "Inicio"} — ${data.dateTo || "Hoy"}` },
    { label: "Métricas", value: `${data.metrics.length}` },
  ];

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <PdfBrandedHeader
          title="Informe de Evolución Biométrica"
          subtitle="Seguimiento Histórico & Tendencias Clínicas"
          badgeLabel="Progreso Clínico"
          objective="Análisis comparativo de hitos antropométricos y progreso del paciente."
          patientName={data.patientName}
          date={data.generatedAt}
          extraMeta={extraMeta}
        />

        {data.metrics.length > 0 ? (
          <View style={S.section}>
            <PdfSectionHeader title="Resumen de Cambios & Hitos" icon="chart" />
            <View style={S.tableWrapper}>
              <View style={S.tableHeader}>
                <Text style={{ ...S.tableHeaderCell, flex: 2 }}>Métrica</Text>
                <Text style={{ ...S.tableHeaderCell, flex: 1.2, textAlign: "center" }}>Inicio</Text>
                <Text style={{ ...S.tableHeaderCell, flex: 1.2, textAlign: "center" }}>Actual</Text>
                <Text style={{ ...S.tableHeaderCell, flex: 1.2, textAlign: "center" }}>Variación</Text>
              </View>

              {data.metrics.map((m, i) => (
                <View key={m.key} style={[S.tableRow, i % 2 === 1 ? S.tableRowAlt : {}]}>
                  <Text style={{ ...S.tableCellBold, flex: 2 }}>{m.label}</Text>
                  <Text style={{ ...S.tableCell, flex: 1.2, textAlign: "center" }}>
                    {m.firstValue} {m.unit}
                  </Text>
                  <Text style={{ ...S.tableCell, flex: 1.2, textAlign: "center" }}>
                    {m.lastValue} {m.unit}
                  </Text>
                  <Text
                    style={{
                      ...S.tableCell,
                      flex: 1.2,
                      textAlign: "center",
                      fontFamily: "Helvetica-Bold",
                      color: m.diffColor || colors.secondaryDark,
                    }}
                  >
                    {m.diff}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={S.emptyText}>Sin datos de evolución registrados para este paciente.</Text>
        )}

        {/* Gráficos de evolución */}
        {chartKeys.length > 0 && (
          <View style={S.section}>
            <PdfSectionHeader title="Gráficos de Tendencia" icon="chart" />
            <View style={S.chartsGrid}>
              {chartKeys.map((key) => {
                const m = data.metrics.find((mt) => mt.key === key);
                const imgSrc = data.chartImages[key];
                if (!imgSrc || !m) return null;

                return (
                  <View key={key} style={S.chartBlock} wrap={false}>
                    <Text style={S.chartTitle}>
                      {m.label} ({m.unit})
                    </Text>
                    <Image src={imgSrc} style={S.chartImage} />
                    <View style={S.statsRow}>
                      <View style={S.statBox}>
                        <Text style={S.statVal}>{m.firstValue}</Text>
                        <Text style={S.statLbl}>INICIAL</Text>
                      </View>
                      <View style={S.statBox}>
                        <Text style={S.statVal}>{m.lastValue}</Text>
                        <Text style={S.statLbl}>ACTUAL</Text>
                      </View>
                      <View style={S.statBox}>
                        <Text style={{ ...S.statVal, color: m.diffColor || colors.secondaryDark }}>
                          {m.diff}
                        </Text>
                        <Text style={S.statLbl}>CAMBIO</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <PdfBrandedFooter />
      </Page>
    </Document>
  );
}
