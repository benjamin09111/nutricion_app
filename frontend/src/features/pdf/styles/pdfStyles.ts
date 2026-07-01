import { StyleSheet, Font } from "@react-pdf/renderer";

// -- Color Palette --
export const colors = {
    primary: "#10b981",       // emerald-500
    primaryDark: "#059669",   // emerald-600
    primaryLight: "#d1fae5",  // emerald-100
    secondary: "#6366f1",     // indigo-500
    secondaryLight: "#e0e7ff",
    slate900: "#0f172a",
    slate700: "#334155",
    slate500: "#64748b",
    slate300: "#cbd5e1",
    slate100: "#f1f5f9",
    slate50: "#f8fafc",
    white: "#ffffff",
    amber: "#f59e0b",
    amberLight: "#fef3c7",
    rose: "#f43f5e",
    roseLight: "#ffe4e6",
};

// -- Shared Styles --
export const shared = StyleSheet.create({
    page: {
        backgroundColor: colors.white,
        fontFamily: "Helvetica",
        paddingTop: 40,
        paddingBottom: 60,
        paddingHorizontal: 40,
    },
    // Header band at top of each page
    pageHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        paddingBottom: 12,
        borderBottom: `2px solid ${colors.primaryLight}`,
    },
    pageHeaderTitle: {
        fontSize: 9,
        color: colors.slate500,
        fontFamily: "Helvetica",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    pageHeaderBrand: {
        fontSize: 8,
        color: colors.primary,
        fontFamily: "Helvetica-Bold",
    },
    // Footer
    pageFooter: {
        position: "absolute",
        bottom: 24,
        left: 40,
        right: 40,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: `1px solid ${colors.slate300}`,
        paddingTop: 8,
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
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        color: colors.slate900,
        marginBottom: 10,
        marginTop: 20,
    },
    sectionSubtitle: {
        fontSize: 10,
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
        gap: 8,
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
        fontSize: 8.5,
        color: colors.slate700,
    },
    tableCellBold: {
        fontSize: 8.5,
        color: colors.slate900,
        fontFamily: "Helvetica-Bold",
    },
});
