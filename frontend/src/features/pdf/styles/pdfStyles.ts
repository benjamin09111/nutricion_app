import { StyleSheet } from "@react-pdf/renderer";

// -- Official NutriNet Canva-Style Color Palette --
export const colors = {
    // Official NutriNet Purple & Navy Palette
    primary: "#7C3AED",
    primaryDark: "#1E1B4B",
    primaryLight: "#F3EDFF",
    primaryGradientStart: "#7C3AED",
    primaryGradientEnd: "#6D28D9",
    // Official NutriNet Lime & Fresh Accents
    secondary: "#84CC16",
    secondaryLight: "#ECFCCB",
    secondaryDark: "#3F6212",
    accentYellow: "#FEF08A",
    accentYellowDark: "#854D0E",
    accentLime: "#84CC16",
    accentLimeLight: "#ECFCCB",
    // Warning & Avoid Foods Cream Palette
    bgCream: "#FFFBEB",
    borderAmber: "#FDE68A",
    textAmber: "#92400E",
    prohibitRed: "#EF4444",
    prohibitRedLight: "#FEE2E2",
    // Neutral Slate Scales
    slate900: "#0F172A",
    slate800: "#1E293B",
    slate700: "#334155",
    slate600: "#475569",
    slate500: "#64748B",
    slate400: "#94A3B8",
    slate300: "#CBD5E1",
    slate200: "#E2E8F0",
    slate100: "#F1F5F9",
    slate50: "#F8FAFC",
    white: "#FFFFFF",
    amber: "#F59E0B",
    amberLight: "#FEF3C7",
    rose: "#F43F5E",
    roseLight: "#FFE4E6",
};

// -- Shared Styles --
export const shared = StyleSheet.create({
    page: {
        backgroundColor: colors.white,
        fontFamily: "Helvetica",
        paddingTop: 30,
        paddingBottom: 48,
        paddingHorizontal: 32,
        fontSize: 10,
        lineHeight: 1.5,
    },
    // Header band at top of each page
    pageHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: `3px solid ${colors.primary}`,
    },
    pageHeaderTitle: {
        fontSize: 10,
        color: colors.slate500,
        fontFamily: "Helvetica",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    pageHeaderBrand: {
        fontSize: 9,
        color: colors.primary,
        fontFamily: "Helvetica-Bold",
    },
    // Footer
    pageFooter: {
        position: "absolute",
        bottom: 18,
        left: 32,
        right: 32,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: `1px solid ${colors.slate300}`,
        paddingTop: 6,
    },
    pageFooterText: {
        fontSize: 8,
        color: colors.slate500,
    },
    pageFooterBrand: {
        fontSize: 8,
        color: colors.primary,
        fontFamily: "Helvetica-Bold",
    },
    // Section title
    sectionTitle: {
        fontSize: 17,
        fontFamily: "Helvetica-Bold",
        color: colors.primaryDark,
        marginBottom: 8,
        marginTop: 16,
        lineHeight: 1.2,
    },
    sectionSubtitle: {
        fontSize: 11,
        color: colors.slate500,
        marginBottom: 14,
    },
    // Badge / Tag pill
    badge: {
        backgroundColor: colors.primaryLight,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    badgeText: {
        fontSize: 7,
        color: colors.primaryDark,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    // Stat box
    statBox: {
        backgroundColor: colors.slate50,
        borderRadius: 6,
        padding: 10,
        flex: 1,
        alignItems: "center",
        border: `1px solid ${colors.slate300}`,
    },
    statValue: {
        fontSize: 16,
        fontFamily: "Helvetica-Bold",
        color: colors.slate900,
    },
    statLabel: {
        fontSize: 8,
        color: colors.slate500,
        marginTop: 2,
        textAlign: "center",
    },
    // Row / Col helpers
    row: {
        flexDirection: "row",
        gap: 6,
    },
    // Table
    tableHeader: {
        flexDirection: "row",
        backgroundColor: colors.slate900,
        borderRadius: 4,
        paddingVertical: 6,
        paddingHorizontal: 8,
        marginBottom: 2,
    },
    tableHeaderCell: {
        fontSize: 8,
        color: colors.white,
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderBottom: `1px solid ${colors.slate100}`,
    },
    tableRowAlt: {
        backgroundColor: colors.slate50,
    },
    tableCell: {
        fontSize: 9,
        color: colors.slate700,
    },
    tableCellBold: {
        fontSize: 9,
        color: colors.slate900,
        fontFamily: "Helvetica-Bold",
    },
});
