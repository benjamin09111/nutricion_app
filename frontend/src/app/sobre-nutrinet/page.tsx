import { Metadata } from "next";
import SobreNutriNetClient from "./SobreNutriNetClient";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Sobre NutriNet | Plataforma Clínica para Nutricionistas en Chile",
  description:
    "Conoce nuestra visión, equipo, preguntas frecuentes, seguridad de datos (Ley 19.628 y 21.719) y respaldo clínico para nutricionistas.",
  alternates: {
    canonical: "/sobre-nutrinet",
  },
  openGraph: {
    title: "Sobre NutriNet | Plataforma Clínica para Nutricionistas",
    description:
      "Plataforma clínica integral para nutricionistas en Chile: gestión de fichas, pautas alimentarias y seguridad de datos.",
    url: "/sobre-nutrinet",
    type: "website",
    siteName: "NutriNet",
    images: [{ url: "/logo_2.webp", width: 1200, height: 630, alt: "NutriNet" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sobre NutriNet | Plataforma Clínica para Nutricionistas",
    description:
      "Conoce la visión y la plataforma clínica para profesionales de la nutrición en Chile.",
    images: ["/logo_2.webp"],
  },
};

export default function SobreNutriNetPage() {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://nutrinet.cl"
  ).replace(/\/$/, "");

  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Sobre NutriNet",
    description:
      "Plataforma clínica de software para nutricionistas en Chile.",
    url: `${baseUrl}/sobre-nutrinet`,
    mainEntity: {
      "@type": "Organization",
      name: "NutriNet",
      url: baseUrl,
      logo: `${baseUrl}/circle_logo.webp`,
      contactPoint: {
        "@type": "ContactPoint",
        email: "contacto@nutrinet.cl",
        contactType: "customer service",
      },
    },
  };

  return (
    <>
      <JsonLd data={aboutJsonLd} />
      <SobreNutriNetClient />
    </>
  );
}
