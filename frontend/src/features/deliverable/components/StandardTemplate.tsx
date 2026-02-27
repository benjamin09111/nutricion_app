import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Important: para proyectos Next.js se deben registrar fuentes o usar las del sistema
// Aquí usamos estilos genéricos, luego puedes afinar tipografías.
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
  },
  coverPage: {
    backgroundColor: "#0f172a", // slate-900
    padding: 60,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 20,
    textAlign: "center",
  },
  coverSubtitle: {
    fontSize: 16,
    color: "#34d399", // emerald-400
    marginBottom: 40,
    textAlign: "center",
  },
  coverPatient: {
    fontSize: 24,
    color: "#ffffff",
    marginTop: 40,
    textAlign: "center",
  },
  coverDate: {
    fontSize: 12,
    color: "#94a3b8", // slate-400
    marginTop: 10,
    textAlign: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 20,
    borderBottom: "2px solid #10b981",
    paddingBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  textRow: {
    flexDirection: "row",
    marginBottom: 8,
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 6,
  },
  colLeft: {
    width: "60%",
    fontSize: 12,
    color: "#334155",
  },
  colRight: {
    width: "40%",
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "bold",
    textAlign: "right",
  },
});

interface StandardTemplateProps {
  data: any;
  config: {
    includeLogo: boolean;
    selectedSections: string[];
  };
}

export const StandardTemplate = ({ data, config }: StandardTemplateProps) => {
  const { patientMeta, cart, recipes } = data || {};
  const { selectedSections } = config || { selectedSections: [] };

  const hasSection = (id: string) => selectedSections.includes(id);

  const patientName = patientMeta?.fullName || "Paciente de Prueba";
  const currentDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      {/* 1. PORTADA */}
      {hasSection("cover") && (
        <Page size="A4" style={styles.coverPage}>
          <Text style={styles.coverTitle}>Plan Nutricional y Clínico</Text>
          <Text style={styles.coverSubtitle}>Generado por NutriSaaS</Text>
          <View style={{ marginTop: 80 }}>
            <Text
              style={{
                fontSize: 14,
                color: "#94a3b8",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              Preparado para:
            </Text>
            <Text style={styles.coverPatient}>{patientName}</Text>
            <Text style={styles.coverDate}>{currentDate}</Text>
          </View>
        </Page>
      )}

      {/* 2. DATOS DEL PACIENTE */}
      {hasSection("patientInfo") && patientMeta && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.header}>Perfil del Paciente</Text>
          <View style={styles.section}>
            <View style={styles.textRow}>
              <Text style={styles.colLeft}>Nombre Completo</Text>
              <Text style={styles.colRight}>{patientMeta.fullName}</Text>
            </View>
            <View style={styles.textRow}>
              <Text style={styles.colLeft}>Peso Actual</Text>
              <Text style={styles.colRight}>
                {patientMeta.weight ? `${patientMeta.weight} kg` : "N/A"}
              </Text>
            </View>
            <View style={styles.textRow}>
              <Text style={styles.colLeft}>Estatura Actual</Text>
              <Text style={styles.colRight}>
                {patientMeta.height ? `${patientMeta.height} cm` : "N/A"}
              </Text>
            </View>
            <View style={styles.textRow}>
              <Text style={styles.colLeft}>Objetivo Principal</Text>
              <Text style={styles.colRight}>
                {patientMeta.nutritionalFocus || "N/A"}
              </Text>
            </View>
          </View>
        </Page>
      )}

      {/* 3. LISTA DE COMPRAS (CARRITO) */}
      {hasSection("shoppingList") && cart?.items && cart.items.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.header}>Lista de Compras Mensual</Text>
          <View style={styles.section}>
            {cart.items.map((item: any) => (
              <View key={item.id} style={styles.textRow}>
                <Text style={styles.colLeft}>
                  {item.producto} ({item.grupo})
                </Text>
                <Text style={styles.colRight}>
                  {item.cantidadMes} {item.unidad}
                </Text>
              </View>
            ))}
          </View>
        </Page>
      )}

      {/* 4. PLAN DE RECETAS */}
      {hasSection("recipes") && recipes?.weekSlots && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.header}>Estructura Diaria Sugerida</Text>

          <View style={styles.section}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "bold",
                marginBottom: 10,
                color: "#10b981",
              }}
            >
              Ejemplo: Lunes
            </Text>

            {(recipes.weekSlots["Lunes"] || []).map((slot: any) => (
              <View
                key={slot.id}
                style={{
                  marginBottom: 15,
                  padding: 10,
                  backgroundColor: "#f8fafc",
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    color: "#0f172a",
                    marginBottom: 4,
                  }}
                >
                  {slot.time} - {slot.label.toUpperCase()}
                </Text>
                {slot.recipe ? (
                  <View>
                    <Text
                      style={{
                        fontSize: 14,
                        color: "#334155",
                        marginBottom: 4,
                      }}
                    >
                      {slot.recipe.title}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#64748b" }}>
                      {slot.recipe.description}
                    </Text>
                    <Text
                      style={{ fontSize: 10, color: "#10b981", marginTop: 4 }}
                    >
                      Nutrientes: {slot.recipe.protein}g Prot |{" "}
                      {slot.recipe.calories} kcal
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={{
                      fontSize: 10,
                      color: "#64748b",
                      fontStyle: "italic",
                    }}
                  >
                    PENDIENTE POR ASIGNAR
                  </Text>
                )}
              </View>
            ))}
          </View>
        </Page>
      )}
    </Document>
  );
};
