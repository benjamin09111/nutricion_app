import type { Metadata } from "next";

// Todo el portal del paciente es privado y depende de tokens de acceso:
// nunca debe indexarse.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
