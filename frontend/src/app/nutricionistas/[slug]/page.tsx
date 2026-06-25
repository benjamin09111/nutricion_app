import NutritionistProfileClient from "./NutritionistProfileClient";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicNutritionistBySlug } from "@/lib/public-nutritionists";

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

  if (result.status === "gone") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <span className="text-2xl font-black">!</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Este perfil ya no es público
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            El nutricionista ocultó su perfil del portal público. Si necesitas
            agendar, vuelve a intentarlo más tarde o contacta directamente al
            profesional.
          </p>
        </div>
      </div>
    );
  }

  if (result.status !== "ok") {
    notFound();
  }

  const nutritionist = result.nutritionist;

  return (
    <NutritionistProfileClient slug={slug} initialNutritionist={nutritionist} />
  );
}
