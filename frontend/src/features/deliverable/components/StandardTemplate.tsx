import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// Generic Sans-serif like Inter or Helvetica is built-in
const S = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff", // clean white
    padding: 40,
    fontFamily: "Helvetica",
    position: "relative",
  },
  // --- Typography & Colors (Friendly Palette) ---
  textWhite: { color: "#ffffff" },
  textSlate900: { color: "#1e293b" }, // Softer black
  textSlate600: { color: "#475569" },
  textSlate500: { color: "#64748b" },
  textSlate400: { color: "#94a3b8" },

  // Warm / Empathetic Accent Colors
  bgWarmLight: { backgroundColor: "#fff1f2" }, // rose-50
  textWarmMain: { color: "#e11d48" }, // rose-600
  textWarmDark: { color: "#be123c" }, // rose-700

  // Secondary Accents (Calm Teal/Indigo)
  bgCalm: { backgroundColor: "#eef2ff" }, // indigo-50
  textCalmMain: { color: "#6366f1" }, // indigo-500
  textCalmDark: { color: "#4338ca" }, // indigo-700

  // --- Cover Page ---
  coverPage: {
    backgroundColor: "#fff1f2", // rose-50
    padding: 0,
    fontFamily: "Helvetica",
  },
  coverContent: {
    flex: 1,
    padding: 60,
    justifyContent: "center",
  },
  coverBrand: {
    position: "absolute",
    top: 40,
    left: 40,
    fontSize: 12,
    color: "#be123c", // rose-700
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  coverTitle: {
    fontSize: 34,
    color: "#be123c",
    fontFamily: "Helvetica-Bold",
    marginBottom: 16,
    lineHeight: 1.2,
  },
  coverSubtitle: {
    fontSize: 15,
    color: "#e11d48", // rose-600
    marginBottom: 48,
    lineHeight: 1.4,
  },
  coverPatientBox: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#ffe4e6",
  },
  coverPatientLabel: {
    fontSize: 11,
    color: "#f43f5e",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  coverPatientName: {
    fontSize: 22,
    color: "#be123c",
    fontFamily: "Helvetica-Bold",
  },
  coverDate: {
    fontSize: 11,
    color: "#fb7185",
    marginTop: 8,
  },

  // --- Section Headers ---
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: "#ffe4e6",
    paddingBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#be123c",
  },
  sectionHeaderSubtitle: {
    fontSize: 11,
    color: "#f43f5e",
    letterSpacing: 0.5,
    marginTop: 6,
  },

  // --- Patient Info Page ---
  patientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 32,
  },
  patientCard: {
    width: "48%",
    backgroundColor: "#fff1f2", // rose-50
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffe4e6",
  },
  patientLabel: {
    fontSize: 10,
    color: "#e11d48",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  patientValue: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#be123c",
  },

  // --- Shopping List (Cart) ---
  cartTable: {
    display: "flex",
    width: "auto",
    borderWidth: 1,
    borderColor: "#e0e7ff", // indigo-200
    borderRadius: 12,
    overflow: "hidden",
  },
  cartRowHeader: {
    flexDirection: "row",
    backgroundColor: "#eef2ff", // indigo-50
    borderBottomWidth: 1,
    borderBottomColor: "#e0e7ff",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cartRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc", // very light gray
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cartCol1: { width: "50%" },
  cartCol2: { width: "25%" },
  cartCol3: { width: "25%", textAlign: "right" },
  cartTextHeader: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#4f46e5", // indigo-600
    textTransform: "uppercase",
  },
  cartTextFood: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  cartTextGroup: {
    fontSize: 9,
    color: "#818cf8", // indigo-400
    marginTop: 3,
  },
  cartTextQty: {
    fontSize: 12,
    color: "#4338ca", // indigo-700
    fontFamily: "Helvetica-Bold",
  },
  cartTextUnit: {
    fontSize: 10,
    color: "#6366f1",
  },

  // --- Recipes / Meals ---
  mealContainer: {
    marginBottom: 36,
  },
  mealDayHeader: {
    backgroundColor: "#eef2ff", // indigo-50
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#6366f1",
  },
  mealDayText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#4338ca", // indigo-700
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  mealSlot: {
    flexDirection: "row",
    marginBottom: 20,
    pageBreakInside: "avoid",
  },
  mealTimeCol: {
    width: "22%",
    paddingRight: 16,
    borderRightWidth: 2,
    borderRightColor: "#e0e7ff", // indigo-200
  },
  mealTimeText: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  mealTypeText: {
    fontSize: 10,
    color: "#6366f1", // indigo-500
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginTop: 5,
  },
  mealContentCol: {
    width: "78%",
    paddingLeft: 16,
    paddingTop: 0,
  },
  mealRecipeTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
    marginBottom: 6,
  },
  mealRecipeDesc: {
    fontSize: 11,
    color: "#475569",
    lineHeight: 1.5,
    marginBottom: 10,
  },
  mealMacros: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  mealMacroItem: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
  },
  mealMacroValue: {
    color: "#4338ca", // indigo-700
  },

  // --- Footer Watermark ---
  pageFooter: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#ffe4e6",
    paddingTop: 12,
  },
  pageFooterText: {
    fontSize: 9,
    color: "#fb7185", // rose-400
  },
});

interface StandardTemplateProps {
  data: any;
  config: {
    includeLogo: boolean;
    selectedSections: string[];
    brandSettings?: {
      primaryColorHex?: string;
      brandBackgroundUrl?: string;
    };
  };
}

export const StandardTemplate = ({ data, config }: StandardTemplateProps) => {
  const { diet, patientMeta, cart, recipes } = data || {};
  const { selectedSections, brandSettings } = config || { selectedSections: [] };
  const { brandBackgroundUrl, primaryColorHex } = brandSettings || {};
  const resourcePages = data?.deliverable?.resourcePages || [];

  const BackgroundImage = () => {
    if (!brandBackgroundUrl) return null;
    return (
      <Image 
        src={brandBackgroundUrl} 
        style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, zIndex: -10 }} 
        fixed
      />
    );
  };

  const hasSection = (id: string) => selectedSections.includes(id);
  const colorOverride = primaryColorHex ? { color: primaryColorHex } : {};

  const htmlToPdfText = (value: string) =>
    (value || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const patientName = patientMeta?.fullName || "Sin Asignar";
  const focus = patientMeta?.nutritionalFocus || diet?.name || "Plan Personalizado";
  const coverResource = resourcePages.find((page: { title?: string }) =>
    /portada|introducci/i.test(page.title || ""),
  );
  const coverIntroText = coverResource
    ? htmlToPdfText(coverResource.content).slice(0, 280)
    : null;
  const currentDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document
      title={`Tu Plan Nutricional - ${patientName}`}
      author="NutriSaaS"
      creator="NutriSaaS Clínico"
    >
      {/* ──────────────────────────────────── PORTADA ──────────────────────────────────── */}
      <Page size="A4" style={S.coverPage}>
        <BackgroundImage />
        <View style={S.coverContent}>
          <Text style={[S.coverBrand, colorOverride]}>NUTRICIÓN CONSCIENTE</Text>
          <Text style={[S.coverTitle, colorOverride]}>Bienvenid{patientMeta?.gender === 'feminine' ? 'a' : 'o'} a tu{"\n"}Plan Personalizado</Text>
          <Text style={S.coverSubtitle}>
            {coverIntroText ||
              "Una guía creada especialmente para ti, enfocada en escuchar a tu cuerpo y sanar desde la raíz."}
          </Text>

          <View style={S.coverPatientBox}>
            <Text style={S.coverPatientLabel}>Preparado con dedicación para</Text>
            <Text style={[S.coverPatientName, colorOverride]}>{patientName}</Text>
            <Text style={S.coverDate}>{currentDate}</Text>
          </View>
        </View>
      </Page>

      {/* ────────────────────────────────── DATOS DEL PACIENTE ────────────────────────────────── */}
      {hasSection("patientInfo") && patientMeta && (
        <Page size="A4" style={S.page}>
          <BackgroundImage />
          <View style={S.sectionHeader}>
            <View>
              <Text style={[S.sectionHeaderTitle, colorOverride]}>Un mapa para conocerte</Text>
              <Text style={S.sectionHeaderSubtitle}>Tus metas y punto de partida</Text>
            </View>
          </View>

          <View style={S.patientGrid}>
            <View style={S.patientCard}>
              <Text style={S.patientLabel}>Enfoque Principal</Text>
              <Text style={S.patientValue}>{focus}</Text>
            </View>
            <View style={S.patientCard}>
              <Text style={S.patientLabel}>Peso Actual</Text>
              <Text style={S.patientValue}>
                {patientMeta.weight ? `${patientMeta.weight} kg` : "No registrado"}
              </Text>
            </View>
            <View style={S.patientCard}>
              <Text style={S.patientLabel}>Estatura Actual</Text>
              <Text style={S.patientValue}>
                {patientMeta.height ? `${patientMeta.height} cm` : "No registrado"}
              </Text>
            </View>
            {patientMeta.restrictions && patientMeta.restrictions.length > 0 && (
              <View style={{ ...S.patientCard, width: "100%", backgroundColor: "#eef2ff", borderColor: "#e0e7ff" }}>
                <Text style={{ ...S.patientLabel, color: "#6366f1" }}>Lo que debemos evitar o preferir</Text>
                <Text style={{ ...S.patientValue, color: "#4338ca", fontSize: 13, lineHeight: 1.5 }}>
                  {patientMeta.restrictions.join(" • ")}
                </Text>
              </View>
            )}
          </View>

          <View style={{ marginTop: 20, padding: 20, backgroundColor: "#fff1f2", borderRadius: 12, borderWidth: 1, borderColor: "#ffe4e6" }}>
            <Text style={{ fontSize: 12, color: "#be123c", fontFamily: "Helvetica-Bold", marginBottom: 8 }}>
              Tus resultados no dictan tu valor
            </Text>
            <Text style={{ fontSize: 11, color: "#e11d48", lineHeight: 1.5 }}>
              Estos números son solo herramientas para guiar tu tratamiento, no para juzgarte. El progreso real se mide en energía, digestión y cómo te sientes contigo mismo.
            </Text>
          </View>

          <View style={S.pageFooter} fixed>
            <Text style={S.pageFooterText}>Powered by NutriSaaS</Text>
            <Text style={S.pageFooterText}>{currentDate}</Text>
          </View>
        </Page>
      )}

      {/* ──────────────────────────────── LISTA DE COMPRAS (CARRITO) ──────────────────────────────── */}
      {hasSection("shoppingList") && cart?.items && cart.items.length > 0 && (
        <Page size="A4" style={S.page}>
          <BackgroundImage />
          <View style={S.sectionHeader}>
            <View>
              <Text style={[S.sectionHeaderTitle, colorOverride]}>Sugerencias de Supermercado</Text>
              <Text style={S.sectionHeaderSubtitle}>Todo lo que necesitas, sin complicaciones</Text>
            </View>
          </View>

          <View style={S.cartTable}>
            {/* Table Header */}
            <View style={S.cartRowHeader}>
              <Text style={[S.cartCol1, S.cartTextHeader]}>¿Qué comprar?</Text>
              <Text style={[S.cartCol2, S.cartTextHeader]}>Para el mes</Text>
              <Text style={[S.cartCol3, S.cartTextHeader]}>Formato</Text>
            </View>

            {/* Table Body */}
            {cart.items.map((item: any, idx: number) => (
              <View
                key={item.id}
                style={[
                  S.cartRow,
                  { backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" },
                  idx === cart.items.length - 1 ? { borderBottomWidth: 0 } : {}
                ]}
                wrap={false}
              >
                <View style={S.cartCol1}>
                  <Text style={S.cartTextFood}>{item.producto}</Text>
                  <Text style={S.cartTextGroup}>{item.grupo}</Text>
                </View>
                <View style={S.cartCol2}>
                  <Text style={S.cartTextQty}>
                    {item.unidad === 'kg' && item.cantidadMes < 1
                      ? Math.round(item.cantidadMes * 1000)
                      : item.cantidadMes}
                  </Text>
                </View>
                <View style={S.cartCol3}>
                  <Text style={S.cartTextUnit}>
                    {item.unidad === 'kg' && item.cantidadMes < 1 ? 'g' : item.unidad}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>
              * Las cantidades son estimadas para facilitar tus compras. Puedes adaptarlas a tus tiempos reales y tu propia despensa.
            </Text>
          </View>

          <View style={S.pageFooter} fixed>
            <Text style={S.pageFooterText}>Lista de Compras · {patientName}</Text>
            <Text style={S.pageFooterText}>NutriSaaS</Text>
          </View>
        </Page>
      )}

      {/* ───────────────────────────────── PLAN DE RECETAS (MINUTA) ───────────────────────────────── */}
      {hasSection("recipes") && recipes?.weekSlots && (
        <Page size="A4" style={S.page}>
          <BackgroundImage />
          <View style={S.sectionHeader}>
            <View>
              <Text style={[S.sectionHeaderTitle, colorOverride]}>Tu Nutrición Día a Día</Text>
              <Text style={S.sectionHeaderSubtitle}>Estructura flexible para guiarte sin estrés</Text>
            </View>
          </View>

          {/* Render each day that has slots */}
          {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day) => {
            const slots = recipes.weekSlots[day];
            if (!slots || slots.length === 0) return null;

            return (
              <View key={day} style={S.mealContainer} wrap={false}>
                <View style={S.mealDayHeader}>
                  <Text style={S.mealDayText}>{day}</Text>
                </View>

                {slots.map((slot: any) => (
                  <View key={slot.id} style={S.mealSlot}>
                    <View style={S.mealTimeCol}>
                      <Text style={S.mealTimeText}>{slot.time}</Text>
                      <Text style={S.mealTypeText}>{slot.label}</Text>
                    </View>

                    <View style={S.mealContentCol}>
                      {slot.recipe ? (
                        <>
                          <Text style={S.mealRecipeTitle}>{slot.recipe.title}</Text>
                          {slot.recipe.description && (
                            <Text style={S.mealRecipeDesc}>{slot.recipe.description}</Text>
                          )}
                          <View style={S.mealMacros}>
                            <Text style={S.mealMacroItem}>
                              <Text style={S.mealMacroValue}>{slot.recipe.protein}g</Text> Proteína
                            </Text>
                            <Text style={S.mealMacroItem}>
                              <Text style={S.mealMacroValue}>{slot.recipe.calories} kcal</Text>
                            </Text>
                            <Text style={S.mealMacroItem}>
                              <Text style={S.mealMacroValue}>{slot.recipe.carbs}g</Text> Carbo
                            </Text>
                          </View>
                        </>
                      ) : (
                        <Text style={[S.mealRecipeDesc, { fontStyle: "italic", color: "#94a3b8", marginTop: 8 }]}>
                          Recuerda escuchar a tu cuerpo. Si sientes hambre, prioriza alimentos que te nutran y te hagan sentir bien.
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            );
          })}

          <View style={S.pageFooter} fixed>
            <Text style={S.pageFooterText}>Menú de Comidas · {patientName}</Text>
            <Text style={S.pageFooterText}>NutriSaaS</Text>
          </View>
        </Page>
      )}

      {/* ─────────────────────────────────── RECURSOS EXTRA ─────────────────────────────────── */}
      {resourcePages.map((page: { title: string; content: string }, index: number) => (
        <Page size="A4" style={S.page} key={`extra-resource-${index}`}>
          <BackgroundImage />
          <View style={S.sectionHeader}>
            <View>
              <Text style={[S.sectionHeaderTitle, colorOverride]}>{page.title || "Recurso adicional"}</Text>
              <Text style={S.sectionHeaderSubtitle}>Contenido personalizado reutilizable</Text>
            </View>
          </View>
          <View style={{ backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 18 }}>
            <Text style={{ fontSize: 11, color: "#334155", lineHeight: 1.6 }}>
              {htmlToPdfText(page.content)}
            </Text>
          </View>

          <View style={S.pageFooter} fixed>
            <Text style={S.pageFooterText}>Recurso adicional · {patientName}</Text>
            <Text style={S.pageFooterText}>NutriSaaS</Text>
          </View>
        </Page>
      ))}

      {/* ────────────────────────── NOTA FINAL (SI NO HAY SECCIONES SELECCIONADAS) ────────────────────────── */}
      {selectedSections.length === 0 && (
        <Page size="A4" style={S.page}>
          <BackgroundImage />
          <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginTop: "50%" }}>
            El PDF ha sido generado sin secciones seleccionadas.
          </Text>
        </Page>
      )}

    </Document>
  );
};
