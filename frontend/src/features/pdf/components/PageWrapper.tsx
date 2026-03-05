import React from "react";
import { View, Text, StyleSheet, Page } from "@react-pdf/renderer";
import { colors, shared } from "../styles/pdfStyles";

interface PageWrapperProps {
    children: React.ReactNode;
    pageNumber?: number;
    totalPages?: number;
    moduleLabel: string;
    patientName?: string;
}

const styles = StyleSheet.create({
    page: {
        ...shared.page,
    },
    headerBrand: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    headerDot: {
        width: 6,
        height: 6,
        backgroundColor: colors.primary,
        borderRadius: 3,
    },
});

export function PageWrapper({
    children,
    pageNumber,
    moduleLabel,
    patientName,
}: PageWrapperProps) {
    return (
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={shared.pageHeader}>
                <View style={styles.headerBrand}>
                    <View style={styles.headerDot} />
                    <Text style={shared.pageHeaderBrand}>NutriSaaS</Text>
                    <Text style={{ ...shared.pageHeaderTitle, marginLeft: 6 }}>
                        — {moduleLabel}
                    </Text>
                </View>
                {patientName && (
                    <Text style={shared.pageHeaderTitle}>Paciente: {patientName}</Text>
                )}
            </View>

            {/* Content */}
            {children}

            {/* Footer */}
            <View style={shared.pageFooter} fixed>
                <Text style={shared.pageFooterText}>
                    {new Date().toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                    })}
                </Text>
                <Text style={shared.pageFooterBrand}>NutriSaaS</Text>
                {pageNumber !== undefined && (
                    <Text style={shared.pageFooterText}>Pág. {pageNumber}</Text>
                )}
            </View>
        </Page>
    );
}
