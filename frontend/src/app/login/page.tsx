import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Iniciar sesión | NutriNet",
  description: "Accede a tu cuenta profesional de NutriNet.",
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  searchParams?: Promise<{ autostart?: string; callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = (await searchParams) || {};

  return (
    <Suspense fallback={null}>
      <LoginPageClient autoStart={params.autostart === "1"} />
    </Suspense>
  );
}
