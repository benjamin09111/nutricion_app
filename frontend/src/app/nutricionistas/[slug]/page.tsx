import NutritionistProfileClient from "./NutritionistProfileClient";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicNutritionistBySlug } from "@/lib/public-nutritionists";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const nutritionist = await getPublicNutritionistBySlug(slug);

  if (!nutritionist) {
    return {
      title: "Nutricionista no encontrado | NutriNet",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const locationText = nutritionist.location ? ` en ${nutritionist.location}` : "";
  const modeText = nutritionist.consultationMode === "presencial"
    ? "presencial"
    : nutritionist.consultationMode === "both"
      ? "online y presencial"
      : "online";
  const specialtyText = nutritionist.specialty ? `especialista en ${nutritionist.specialty}` : "nutricionista";

  return {
    title: `${nutritionist.fullName} | Nutricionista${locationText} | NutriNet`,
    description: `Agenda una consulta con ${nutritionist.fullName}, ${specialtyText}. Atención ${modeText}${locationText}, Chile.`,
    keywords: [
      nutritionist.fullName,
      nutritionist.specialty || "nutricionista",
      "nutricionista en Chile",
      "consulta nutricional",
      nutritionist.location || "",
    ].filter(Boolean),
    alternates: {
      canonical: `/nutricionistas/${slug}`,
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
      title: `${nutritionist.fullName} | Nutricionista${locationText} | NutriNet`,
      description: `Perfil profesional de ${nutritionist.fullName}. Atención ${modeText}${locationText}.`,
      type: "profile",
      url: `/nutricionistas/${slug}`,
      images: nutritionist.avatarUrl
        ? [{ url: nutritionist.avatarUrl, width: 1200, height: 630, alt: nutritionist.fullName }]
        : [{ url: "/logo_2.webp", width: 1200, height: 630, alt: "NutriNet" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${nutritionist.fullName} | Nutricionista | NutriNet`,
      description: `Perfil profesional de ${nutritionist.fullName} en NutriNet.`,
      images: [nutritionist.avatarUrl || "/logo_2.webp"],
    },
  };
}

export default async function NutritionistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const nutritionist = await getPublicNutritionistBySlug(slug);

  if (!nutritionist) {
    notFound();
  }

  return <NutritionistProfileClient slug={slug} initialNutritionist={nutritionist} />;
}
