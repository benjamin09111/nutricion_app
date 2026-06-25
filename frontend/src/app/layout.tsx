import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nutrinet.cl"),
  title: {
    template: "%s | NutriNet",
    default: "NutriNet | Software para Nutricionistas en Chile",
  },
  description:
    "Software para nutricionistas en Chile. Gestiona pacientes, crea dietas, organiza consultas y publica tu perfil profesional en NutriNet.",
  applicationName: "NutriNet",
  creator: "NutriNet",
  publisher: "NutriNet",
  category: "health",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  keywords: [
    "nutricionista",
    "nutricionistas en Chile",
    "software nutrición",
    "software para nutricionistas",
    "plataforma para nutricionistas",
    "nutricionista online",
    "nutricionista en Chile",
    "dietas",
    "gestión pacientes",
    "saas salud",
    "chile",
  ],
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://nutrinet.cl",
    siteName: "NutriNet",
    title: "NutriNet | Software para Nutricionistas en Chile",
    description:
      "Gestiona pacientes, crea dietas y publica tu perfil profesional en la plataforma para nutricionistas de NutriNet.",
    images: [
      {
        url: "/logo_2.webp",
        width: 1200,
        height: 630,
        alt: "NutriNet - Software para nutricionistas en Chile",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NutriNet | Software para Nutricionistas en Chile",
    description:
      "Plataforma para nutricionistas: pacientes, dietas, consultas y perfiles públicos en Chile.",
    images: ["/logo_2.webp"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { Toaster } from "sonner";
import Providers from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL" suppressHydrationWarning>
      <body className={`${poppins.variable} ${inter.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
