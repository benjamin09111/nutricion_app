import type { Metadata } from "next";
import NutritionistsClient from "./NutritionistsClient";
import { getPublicNutritionists } from "@/lib/public-nutritionists";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Nutricionistas en Chile | Busca, Compara y Agenda tu Consulta | NutriNet",
  description:
    "Directorio completo de nutricionistas en Chile. Busca por nombre, especialidad o ubicación. Compara perfiles, precios y disponibilidad. Agenda consultas online o presenciales.",
  keywords: [
    "nutricionistas Chile",
    "buscar nutricionista",
    "nutricionista online Chile",
    "nutricionista presencial Santiago",
    "consulta nutricional",
    "nutrición clínica",
    "nutrición deportiva",
    "control de peso",
    "dieta personalizada",
    "agenda nutricionista",
    "mejor nutricionista Chile",
    "nutricionista cerca de mí",
  ],
  alternates: {
    canonical: "/nutricionistas",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Nutricionistas en Chile | Directorio NutriNet",
    description:
      "Encuentra al nutricionista ideal en Chile. Más de 100 profesionales verificados con perfiles públicos, especialidades y agenda online.",
    url: "/nutricionistas",
    type: "website",
    siteName: "NutriNet",
    images: [
      {
        url: "/og-nutricionistas.png",
        width: 1200,
        height: 630,
        alt: "Directorio de nutricionistas en Chile - NutriNet",
      },
      {
        url: "/logo_2.webp",
        width: 1200,
        height: 630,
        alt: "NutriNet - Directorio de nutricionistas",
      },
    ],
    locale: "es_CL",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nutricionistas en Chile | NutriNet",
    description:
      "Directorio completo de nutricionistas en Chile. Agenda tu consulta online o presencial.",
    images: ["/logo_2.webp"],
    creator: "@nutrinet_cl",
  },
};

export const dynamic = "force-dynamic";

export default async function NutritionistsPage() {
  const initialData = await getPublicNutritionists({ page: 1, limit: 12 });
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://nutrinet.cl"
  ).replace(/\/$/, "");

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: `${baseUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Nutricionistas",
        item: `${baseUrl}/nutricionistas`,
      },
    ],
  };

  const directoryJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Directorio de Nutricionistas en Chile",
    description:
      "Directorio profesional de nutricionistas verificados en Chile.",
    url: `${baseUrl}/nutricionistas`,
    aspect: "Overview",
  };

  return (
    <>
      <JsonLd data={[directoryJsonLd, breadcrumbJsonLd]} />
      <NutritionistsClient initialData={initialData} />
    </>
  );
}
