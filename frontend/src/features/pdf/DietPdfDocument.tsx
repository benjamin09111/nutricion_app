import React from "react";
import {
    Document,
    Page,
    View,
    Text,
    StyleSheet,
} from "@react-pdf/renderer";
import { colors, shared } from "./styles/pdfStyles";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DietFood {
    producto: string;
    grupo: string;
    unidad?: string;
    calorias?: number;
    proteinas?: number;
    lipidos?: number;
    carbohidratos?: number;
    precioPromedio?: number;
    status?: "base" | "favorite" | "added";
}

export interface DietPdfData {
    dietName: string;
    dietTags?: string[];
    activeConstraints?: string[];
    patientName?: string;
    foods: DietFood[];
    generatedAt?: string;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
    page: {
        ...shared.page,
    },
    // --- Cover Page ---
    coverPage: {
        backgroundColor: colors.slate900,
        paddingTop: 0,
        paddingBottom: 0,
        paddingHorizontal: 0,
    },
    coverTop: {
        backgroundColor: colors.primary,
        paddingHorizontal: 48,
        paddingTop: 56,
        paddingBottom: 40,
    },
    coverEyebrow: {
        fontSize: 9,
        color: colors.primaryLight,
        fontFamily: "Helvetica-Bold",
        letterSpacing: 2,
        textTransform: "uppercase",
        marginBottom: 12,
    },
    coverTitle: {
        fontSize: 28,
        fontFamily: "Helvetica-Bold",
        color: colors.white,
        lineHeight: 1.2,
        marginBottom: 8,
    },
    coverSubtitle: {
        fontSize: 13,
        color: colors.primaryLight,
        marginBottom: 20,
    },
    coverPatientBadge: {
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    coverPatientLabel: {
        fontSize: 8,
        color: "rgba(255,255,255,0.7)",
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    coverPatientName: {
        fontSize: 12,
        color: colors.white,
        fontFamily: "Helvetica-Bold",
    },
    coverBottom: {
        paddingHorizontal: 48,
        paddingTop: 32,
        flex: 1,
    },
    coverMetaRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 28,
    },
    coverMetaCard: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 8,
        padding: 14,
        border: "1px solid rgba(255,255,255,0.1)",
    },
    coverMetaLabel: {
        fontSize: 8,
        color: "rgba(255,255,255,0.5)",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 6,
    },
    coverMetaValue: {
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        color: colors.white,
    },
    coverTagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 24,
    },
    coverTag: {
        backgroundColor: "rgba(16,185,129,0.2)",
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        border: "1px solid rgba(16,185,129,0.4)",
    },
    coverTagText: {
        fontSize: 8,
        color: colors.primary,
        fontFamily: "Helvetica-Bold",
    },
    coverConstraintTag: {
        backgroundColor: "rgba(244,63,94,0.15)",
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        border: "1px solid rgba(244,63,94,0.3)",
    },
    coverConstraintText: {
        fontSize: 8,
        color: "#f43f5e",
        fontFamily: "Helvetica-Bold",
    },
    coverFooter: {
        paddingHorizontal: 48,
        paddingVertical: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: "1px solid rgba(255,255,255,0.1)",
    },
    coverFooterBrand: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: colors.primary,
    },
    coverFooterDate: {
        fontSize: 8,
        color: "rgba(255,255,255,0.4)",
    },

    // --- Content Page Header ---
    pageHeader: {
        ...shared.pageHeader,
    },
    pageHeaderTitle: {
        ...shared.pageHeaderTitle,
    },
    pageHeaderBrand: {
        ...shared.pageHeaderBrand,
    },
    headerDot: {
        width: 6,
        height: 6,
        backgroundColor: colors.primary,
        borderRadius: 3,
        marginRight: 5,
    },

    // --- Summary stats ---
    statsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 20,
    },
    statBox: {
        ...shared.statBox,
    },
    statValue: {
        ...shared.statValue,
    },
    statLabel: {
        ...shared.statLabel,
    },

    // --- Group header ---
    groupHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 14,
        marginBottom: 6,
    },
    groupDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        marginRight: 6,
    },
    groupName: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: colors.slate900,
        flex: 1,
    },
    groupCount: {
        fontSize: 8,
        color: colors.slate500,
        backgroundColor: colors.slate100,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },

    // --- Table ---
    tableHeader: {
        ...shared.tableHeader,
    },
    tableRow: {
        ...shared.tableRow,
    },
    tableRowAlt: {
        backgroundColor: colors.slate50,
    },
    tableHeaderCell: {
        ...shared.tableHeaderCell,
    },
    tableCell: {
        ...shared.tableCell,
    },
    tableCellBold: {
        ...shared.tableCellBold,
    },
    // Macro pill
    macroPill: {
        backgroundColor: colors.primaryLight,
        borderRadius: 3,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    macroPillText: {
        fontSize: 7.5,
        color: colors.primaryDark,
        fontFamily: "Helvetica-Bold",
    },
    // Page footer
    pageFooter: {
        ...shared.pageFooter,
    },
    pageFooterText: {
        ...shared.pageFooterText,
    },
    pageFooterBrand: {
        ...shared.pageFooterBrand,
    },
    watermark: {
        fontSize: 7,
        color: colors.slate300,
    },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GROUP_COLORS: Record<string, string> = {
    Carnes: "#f43f5e",
    Frutas: "#f59e0b",
    Verduras: "#10b981",
    Cereales: "#6366f1",
    Lácteos: "#3b82f6",
    Legumbres: "#8b5cf6",
    Grasas: "#f97316",
    default: "#64748b",
};

function getGroupColor(grupo: string): string {
    for (const key of Object.keys(GROUP_COLORS)) {
        if (grupo.toLowerCase().includes(key.toLowerCase())) return GROUP_COLORS[key];
    }
    return GROUP_COLORS.default;
}

function groupFoods(foods: DietFood[]): Record<string, DietFood[]> {
    return foods.reduce(
        (acc, food) => {
            const g = food.grupo || "Varios";
            if (!acc[g]) acc[g] = [];
            acc[g].push(food);
            return acc;
        },
        {} as Record<string, DietFood[]>,
    );
}

// ─── Cover Page ──────────────────────────────────────────────────────────────

function CoverPage({ data }: { data: DietPdfData }) {
    const dateStr = new Date().toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    return (
        <Page size="A4" style={S.coverPage}>
            {/* Top green band */}
            <View style={S.coverTop}>
                <Text style={S.coverEyebrow}>Plan Nutricional · Dieta Base</Text>
                <Text style={S.coverTitle}>{data.dietName || "Plan Alimentario"}</Text>
                <Text style={S.coverSubtitle}>
                    {data.foods.length} alimentos · {Object.keys(groupFoods(data.foods)).length} grupos alimenticios
                </Text>
                {data.patientName && (
                    <View style={S.coverPatientBadge}>
                        <View>
                            <Text style={S.coverPatientLabel}>Paciente</Text>
                            <Text style={S.coverPatientName}>{data.patientName}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Dark bottom */}
            <View style={S.coverBottom}>
                {/* Meta cards */}
                <View style={S.coverMetaRow}>
                    <View style={S.coverMetaCard}>
                        <Text style={S.coverMetaLabel}>Total Alimentos</Text>
                        <Text style={S.coverMetaValue}>{data.foods.length}</Text>
                    </View>
                    <View style={S.coverMetaCard}>
                        <Text style={S.coverMetaLabel}>Grupos</Text>
                        <Text style={S.coverMetaValue}>
                            {Object.keys(groupFoods(data.foods)).length}
                        </Text>
                    </View>
                    <View style={S.coverMetaCard}>
                        <Text style={S.coverMetaLabel}>Restricciones</Text>
                        <Text style={S.coverMetaValue}>
                            {data.activeConstraints?.length ?? 0}
                        </Text>
                    </View>
                </View>

                {/* Tags */}
                {data.dietTags && data.dietTags.length > 0 && (
                    <>
                        <Text style={{ ...S.coverMetaLabel, marginBottom: 8 }}>
                            Etiquetas del Plan
                        </Text>
                        <View style={S.coverTagsRow}>
                            {data.dietTags.map((tag) => (
                                <View key={tag} style={S.coverTag}>
                                    <Text style={S.coverTagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Restrictions */}
                {data.activeConstraints && data.activeConstraints.length > 0 && (
                    <>
                        <Text style={{ ...S.coverMetaLabel, marginBottom: 8 }}>
                            Restricciones Clínicas
                        </Text>
                        <View style={S.coverTagsRow}>
                            {data.activeConstraints.map((c) => (
                                <View key={c} style={S.coverConstraintTag}>
                                    <Text style={S.coverConstraintText}>{c}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </View>

            {/* Footer */}
            <View style={S.coverFooter}>
                <Text style={S.coverFooterBrand}>NutriSaaS</Text>
                <Text style={S.coverFooterDate}>{dateStr}</Text>
            </View>
        </Page>
    );
}

// ─── Food Table Page ──────────────────────────────────────────────────────────

function FoodTablePage({
    grouped,
    patientName,
    dietName,
}: {
    grouped: Record<string, DietFood[]>;
    patientName?: string;
    dietName: string;
}) {
    const dateStr = new Date().toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    return (
        <Page size="A4" style={S.page}>
            {/* Page Header */}
            <View style={S.pageHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={S.headerDot} />
                    <Text style={S.pageHeaderBrand}>NutriSaaS</Text>
                    <Text style={{ ...S.pageHeaderTitle, marginLeft: 6 }}>
                        — Dieta Base
                    </Text>
                </View>
                {patientName && (
                    <Text style={S.pageHeaderTitle}>Paciente: {patientName}</Text>
                )}
            </View>

            {/* Section title */}
            <Text style={shared.sectionTitle}>Alimentos por Grupo</Text>
            <Text style={{ ...shared.sectionSubtitle, marginBottom: 12 }}>
                {dietName} · Clasificación por categorías alimenticias
            </Text>

            {/* Tables per group */}
            {Object.entries(grouped).map(([grupo, foods]) => {
                const dotColor = getGroupColor(grupo);
                return (
                    <View key={grupo} wrap={false}>
                        {/* Group header */}
                        <View style={S.groupHeader}>
                            <View style={{ ...S.groupDot, backgroundColor: dotColor }} />
                            <Text style={S.groupName}>{grupo}</Text>
                            <Text style={S.groupCount}>{foods.length} alimentos</Text>
                        </View>

                        {/* Column headers */}
                        <View style={S.tableHeader}>
                            <Text style={{ ...S.tableHeaderCell, flex: 3 }}>Alimento</Text>
                            <Text style={{ ...S.tableHeaderCell, flex: 1 }}>Unidad</Text>
                            <Text
                                style={{
                                    ...S.tableHeaderCell,
                                    flex: 1,
                                    textAlign: "center",
                                }}
                            >
                                Cal.
                            </Text>
                            <Text
                                style={{
                                    ...S.tableHeaderCell,
                                    flex: 1,
                                    textAlign: "center",
                                }}
                            >
                                Prot.
                            </Text>
                            <Text
                                style={{
                                    ...S.tableHeaderCell,
                                    flex: 1,
                                    textAlign: "center",
                                }}
                            >
                                Carb.
                            </Text>
                            <Text
                                style={{
                                    ...S.tableHeaderCell,
                                    flex: 1,
                                    textAlign: "center",
                                }}
                            >
                                Grasas
                            </Text>
                        </View>

                        {/* Rows */}
                        {foods.map((food, idx) => (
                            <View
                                key={food.producto}
                                style={[S.tableRow, idx % 2 === 1 ? S.tableRowAlt : {}]}
                            >
                                <Text style={{ ...S.tableCellBold, flex: 3 }}>
                                    {food.producto}
                                </Text>
                                <Text style={{ ...S.tableCell, flex: 1 }}>
                                    {food.unidad ?? "—"}
                                </Text>
                                <Text
                                    style={{
                                        ...S.tableCell,
                                        flex: 1,
                                        textAlign: "center",
                                    }}
                                >
                                    {food.calorias ? `${Math.round(food.calorias)}` : "—"}
                                </Text>
                                <Text
                                    style={{
                                        ...S.tableCell,
                                        flex: 1,
                                        textAlign: "center",
                                    }}
                                >
                                    {food.proteinas ? `${food.proteinas.toFixed(1)}g` : "—"}
                                </Text>
                                <Text
                                    style={{
                                        ...S.tableCell,
                                        flex: 1,
                                        textAlign: "center",
                                    }}
                                >
                                    {food.carbohidratos
                                        ? `${food.carbohidratos.toFixed(1)}g`
                                        : "—"}
                                </Text>
                                <Text
                                    style={{
                                        ...S.tableCell,
                                        flex: 1,
                                        textAlign: "center",
                                    }}
                                >
                                    {food.lipidos ? `${food.lipidos.toFixed(1)}g` : "—"}
                                </Text>
                            </View>
                        ))}
                    </View>
                );
            })}

            {/* Footnote */}
            <View style={{ marginTop: 20, paddingTop: 12, borderTop: `1px solid ${colors.slate100}` }}>
                <Text style={{ fontSize: 7, color: colors.slate500, fontStyle: "italic" }}>
                    * Valores nutricionales por 100g de alimento. Generado por NutriSaaS.
                </Text>
            </View>

            {/* Page Footer */}
            <View style={S.pageFooter} fixed>
                <Text style={S.pageFooterText}>{dateStr}</Text>
                <Text style={S.watermark}>Powered by NutriSaaS</Text>
                <Text style={S.pageFooterBrand}>Dieta Base</Text>
            </View>
        </Page>
    );
}


// ─── Main Document ────────────────────────────────────────────────────────────

export function DietPdfDocument({ data }: { data: DietPdfData }) {
    const grouped = groupFoods(data.foods);

    return (
        <Document
            title={data.dietName || "Dieta Base"}
            author="NutriSaaS"
            subject="Plan Alimentario - Dieta Base"
            creator="NutriSaaS v1.0"
        >
            <CoverPage data={data} />
            <FoodTablePage
                grouped={grouped}
                patientName={data.patientName}
                dietName={data.dietName}
            />
        </Document>
    );
}
