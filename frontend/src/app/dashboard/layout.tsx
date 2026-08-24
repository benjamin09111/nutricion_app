import type { Metadata } from "next";
import { DashboardShell } from "./DashboardShell";

// El shell del dashboard es un client component y por eso no puede exportar
// `metadata`. Este layout servidor existe únicamente para marcar como noindex
// todo /dashboard/**, tal como exige la regla de indexación del proyecto.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
