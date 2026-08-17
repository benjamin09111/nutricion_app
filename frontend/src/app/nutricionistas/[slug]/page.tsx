import NutritionistProfileClient from "./NutritionistProfileClient";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicNutritionistBySlug } from "@/lib/public-nutritionists";
import { JsonLd } from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicNutritionistBySlug(slug);

  if (result.status !== "ok") {
    return {
      title:
        result.status === "gone"
          ? "Perfil no público | NutriNet"
          : "Nutricionista no encontrado | NutriNet",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const nutritionist = result.nutritionist;

  const locationText = nutritionist.location
    ? ` en ${nutritionist.location}`
    : "";
  const modeText =
    nutritionist.consultationMode === "presencial"
      ? "presencial"
      : nutritionist.consultationMode === "both"
        ? "online y presencial"
        : "online";
  const specialtyText = nutritionist.specialty
    ? `especialista en ${nutritionist.specialty}`
    : "nutricionista";

  const profileKeywords = [
    nutritionist.fullName,
    nutritionist.specialty || "nutricionista",
    "nutricionista Chile",
    "nutricionista" +
      (nutritionist.location ? ` ${nutritionist.location}` : ""),
    "consulta nutricional",
    "agenda nutricionista",
    ...(nutritionist.specialties || []),
  ].filter(Boolean);

  return {
    title: `${nutritionist.fullName} | Nutricionista${locationText} | NutriNet`,
    description: `Agenda una consulta con ${nutritionist.fullName}, ${specialtyText}. Atención ${modeText}${locationText}, Chile. Perfil verificado en NutriNet.`,
    keywords: profileKeywords,
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
      description: `Perfil profesional de ${nutritionist.fullName}. Atención ${modeText}${locationText}. Agenda tu cita online o presencial.`,
      type: "profile",
      url: `/nutricionistas/${slug}`,
      siteName: "NutriNet",
      images: nutritionist.avatarUrl
        ? [
            {
              url: nutritionist.avatarUrl,
              width: 1200,
              height: 630,
              alt: nutritionist.fullName,
            },
          ]
        : [
            {
              url: "/logo_2.webp",
              width: 1200,
              height: 630,
              alt: `${nutritionist.fullName} - NutriNet`,
            },
          ],
      locale: "es_CL",
    },
    twitter: {
      card: "summary_large_image",
      title: `${nutritionist.fullName} | Nutricionista | NutriNet`,
      description: `Perfil profesional de ${nutritionist.fullName}. Atención ${modeText}${locationText}.`,
      images: [nutritionist.avatarUrl || "/logo_2.webp"],
    },
  };
}

export default async function NutritionistProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublicNutritionistBySlug(slug);

  if (result.status !== "ok") {
    notFound();
  }

  const nutritionist = result.nutritionist;
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://nutrinet.cl"
  ).replace(/\/$/, "");

  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: nutritionist.fullName,
    url: `${baseUrl}/nutricionistas/${slug}`,
    image: nutritionist.avatarUrl || `${baseUrl}/logo_2.webp`,
    description: `Nutricionista ${
      nutritionist.specialty ? `especialista en ${nutritionist.specialty}` : ""
    } en Chile. Atiende ${nutritionist.consultationMode}.`,
    medicalSpecialty:
      nutritionist.specialties && nutritionist.specialties.length > 0
        ? nutritionist.specialties
        : [nutritionist.specialty].filter(Boolean),
    address: nutritionist.location
      ? {
          "@type": "PostalAddress",
          addressLocality: nutritionist.location,
          addressCountry: "CL",
        }
      : undefined,
    priceRange: nutritionist.prices || undefined,
  };

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
      {
        "@type": "ListItem",
        position: 3,
        name: nutritionist.fullName,
        item: `${baseUrl}/nutricionistas/${slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={[profileJsonLd, breadcrumbJsonLd]} />
      <NutritionistProfileClient slug={slug} initialNutritionist={nutritionist} />
    </>
  );
}
