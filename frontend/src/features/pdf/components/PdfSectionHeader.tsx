import React from "react";
import { View, Text, StyleSheet, Svg, Path } from "@react-pdf/renderer";
import { colors } from "../styles/pdfStyles";

export interface PdfSectionHeaderProps {
  title: string;
  badge?: string;
  icon?: "cutlery" | "clinical" | "leaf" | "warning" | "chart" | "recipe" | "user";
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 8,
    marginTop: 6,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  titleText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: colors.white,
    letterSpacing: 0.2,
  },
  badgeContainer: {
    backgroundColor: colors.secondaryLight,
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: colors.secondaryDark,
  },
});

export function PdfSectionHeader({
  title,
  badge,
  icon = "cutlery",
}: PdfSectionHeaderProps) {
  const renderIcon = () => {
    switch (icon) {
      case "cutlery":
        return (
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path
              fill={colors.white}
              d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"
            />
          </Svg>
        );
      case "clinical":
        return (
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path
              fill={colors.white}
              d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
            />
          </Svg>
        );
      case "chart":
        return (
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path
              fill={colors.white}
              d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
            />
          </Svg>
        );
      case "recipe":
        return (
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path
              fill={colors.white}
              d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h2v5l-1-.75L9 9V4zm9 16H6V4h1v9l3-2.25L13 13V4h5v16z"
            />
          </Svg>
        );
      default:
        return (
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path
              fill={colors.white}
              d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
            />
          </Svg>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        {renderIcon()}
        <Text style={styles.titleText}>{title}</Text>
      </View>
      {badge ? (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : (
        <Svg width={12} height={12} viewBox="0 0 24 24">
          <Path
            fill={colors.secondary}
            d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"
          />
        </Svg>
      )}
    </View>
  );
}

