import type { Metadata } from "next";
import VerifyEmailClient from "./VerifyEmailClient";

export const metadata: Metadata = {
  title: "Verificación de Correo | NutriNet",
  description: "Verifica tu dirección de correo electrónico en NutriNet.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const token = Array.isArray(resolvedSearchParams?.token)
    ? resolvedSearchParams.token[0]
    : resolvedSearchParams?.token;

  return <VerifyEmailClient token={token || null} />;
}
