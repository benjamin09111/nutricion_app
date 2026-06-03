import type { Metadata } from "next";
import NutritionistsClient from "./NutritionistsClient";
import { getPublicNutritionists } from "@/lib/public-nutritionists";

export const metadata: Metadata = {
  title: "Nutricionistas en Chile | Directorio NutriNet",
  description:
    "Encuentra nutricionistas en Chile, compara perfiles, especialidades y agenda una consulta online o presencial.",
  keywords: [
    "nutricionistas en Chile",
    "nutricionista online",
    "nutricionista presencial",
    "agenda nutricionista",
    "consulta nutricional",
    "directorio de nutricionistas",
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
      "Directorio de nutricionistas en Chile con perfiles públicos, especialidades y opción de agendar consulta.",
    url: "/nutricionistas",
    type: "website",
    images: [{ url: "/logo_2.webp", width: 1200, height: 630, alt: "Directorio de nutricionistas NutriNet" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nutricionistas en Chile | Directorio NutriNet",
    description:
      "Directorio público para encontrar nutricionistas online y presenciales en Chile.",
    images: ["/logo_2.webp"],
  },
};

export const revalidate = 300;

export default async function NutritionistsPage() {
  const initialData = await getPublicNutritionists({ page: 1, limit: 12 });

  return <NutritionistsClient initialData={initialData} />;
}
