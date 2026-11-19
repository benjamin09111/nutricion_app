import React from "react";
import { View, Text, Image, StyleSheet, Svg, Path } from "@react-pdf/renderer";
import { colors } from "../styles/pdfStyles";
import { NUTRINET_LOGO_B64, NATY_MASCOT_B64 } from "./NutriNetPdfAssets";

export interface HeaderMetaItem {
  label: string;
  value: string;
}

export interface PdfBrandedHeaderProps {
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  objective?: string;
  patientName?: string | null;
  date?: string;
  extraMeta?: HeaderMetaItem[];
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  logoImage: {
    width: 130,
    height: 31,
    objectFit: "contain",
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
  contentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    position: "relative",
  },
  titlesBlock: {
    flex: 1,
    paddingRight: 8,
  },
  mainTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
    lineHeight: 1.15,
    marginBottom: 4,
  },
  subtitlePill: {
    alignSelf: "flex-start",
    backgroundColor: colors.secondaryLight,
    paddingVertical: 2.5,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.secondaryDark,
  },
  objectiveBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  objectiveText: {
    fontSize: 8,
    color: colors.slate700,
    flex: 1,
    lineHeight: 1.3,
  },
  objectiveBold: {
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
  },
  metaPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 12,
  },
  metaPillText: {
    fontSize: 7.5,
    color: colors.slate700,
  },
  metaPillBold: {
    fontFamily: "Helvetica-Bold",
    color: colors.primaryDark,
  },
  mascotWrap: {
    width: 90,
    height: 65,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  mascotImage: {
    width: 85,
    height: 60,
    objectFit: "contain",
  },
});

export function PdfBrandedHeader({
  title,
  subtitle,
  badgeLabel = "NutriNet",
  objective,
  patientName,
  date,
  extraMeta,
}: PdfBrandedHeaderProps) {
  const currentDate =
    date ||
    new Date().toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <View style={styles.headerContainer}>
      {/* Row 1: Logo & Top Right Badge */}
      <View style={styles.topRow}>
        <Image src={NUTRINET_LOGO_B64} style={styles.logoImage} />
        <View style={styles.badgePill}>
          <Svg width={9} height={9} viewBox="0 0 24 24">
            <Path
              fill={colors.primary}
              d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"
            />
          </Svg>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      </View>

      {/* Row 2: Titles, Objective, Pills + Naty Mascot */}
      <View style={styles.contentRow}>
        <View style={styles.titlesBlock}>
          <Text style={styles.mainTitle}>{title}</Text>
          {subtitle && (
            <View style={styles.subtitlePill}>
              <Text style={styles.subtitleText}>{subtitle}</Text>
            </View>
          )}

          {objective && (
            <View style={styles.objectiveBox}>
              <Svg width={10} height={10} viewBox="0 0 24 24">
                <Path
                  fill={colors.primary}
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
                />
              </Svg>
              <Text style={styles.objectiveText}>
                <Text style={styles.objectiveBold}>Objetivo: </Text>
                {objective}
              </Text>
            </View>
          )}

          {/* Metadata pills */}
          <View style={styles.metaPillsRow}>
            {patientName && (
              <View style={styles.metaPill}>
                <Svg width={8} height={8} viewBox="0 0 24 24">
                  <Path
                    fill={colors.primary}
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                  />
                </Svg>
                <Text style={styles.metaPillText}>
                  <Text style={styles.metaPillBold}>Paciente: </Text>
                  {patientName}
                </Text>
              </View>
            )}
            <View style={styles.metaPill}>
              <Svg width={8} height={8} viewBox="0 0 24 24">
                <Path
                  fill={colors.secondaryDark}
                  d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"
                />
              </Svg>
              <Text style={styles.metaPillText}>
                <Text style={styles.metaPillBold}>Fecha: </Text>
                {currentDate}
              </Text>
            </View>
            {extraMeta?.map((item, idx) => (
              <View key={idx} style={styles.metaPill}>
                <Text style={styles.metaPillText}>
                  <Text style={styles.metaPillBold}>{item.label}: </Text>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Naty Mascot on the right */}
        <View style={styles.mascotWrap}>
          <Image src={NATY_MASCOT_B64} style={styles.mascotImage} />
        </View>
      </View>
    </View>
  );
}

