import type { Metadata } from "next";
import PortalClient from "./PortalClient";

export const metadata: Metadata = {
  title: "Portal Paciente | NutriNet",
  description: "Acceso privado al plan de nutrición.",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function PortalPage(props: PageProps) {
  const { token } = await props.params;

  return <PortalClient token={token} />;
}
