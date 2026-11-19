import React from "react";
import { View, Text, StyleSheet, Page, Image } from "@react-pdf/renderer";
import { colors } from "../styles/pdfStyles";
import { NUTRINET_LOGO_B64 } from "./NutriNetPdfAssets";
import { PdfBrandedFooter } from "./PdfBrandedFooter";

export interface PageWrapperProps {
  children: React.ReactNode;
  pageNumber?: number;
  totalPages?: number;
  moduleLabel: string;
  patientName?: string;
  nutritionistName?: string;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.white,
    fontFamily: "Helvetica",
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 30,
    fontSize: 9.5,
    lineHeight: 1.45,
    color: colors.slate800,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  logo: {
    width: 95,
    height: 22,
    objectFit: "contain",
  },
  rightMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgePill: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  patientText: {
    fontSize: 8,
    color: colors.slate600,
  },
});

export function PageWrapper({
  children,
  pageNumber,
  totalPages,
  moduleLabel,
  patientName,
  nutritionistName,
}: PageWrapperProps) {
  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Image src={NUTRINET_LOGO_B64} style={styles.logo} />
        <View style={styles.rightMeta}>
          {patientName && (
            <Text style={styles.patientText}>
              Paciente: <Text style={{ fontFamily: "Helvetica-Bold", color: colors.primaryDark }}>{patientName}</Text>
            </Text>
          )}
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>{moduleLabel}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>{children}</View>

      {/* Footer */}
      <PdfBrandedFooter
        pageNumber={pageNumber}
        totalPages={totalPages}
        nutritionistName={nutritionistName}
      />
    </Page>
  );
}
