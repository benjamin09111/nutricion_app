import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo | NutriNet",
  description: "Demostración de la plataforma clínica NutriNet.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
