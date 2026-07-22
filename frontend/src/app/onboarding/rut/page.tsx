import { RutOnboardingClient } from "./rut-onboarding-client";
import { Suspense } from "react";

export const metadata = {
  title: "Completa tu RUT | NutriNet",
  description: "Asocia tu RUT a tu cuenta antes de entrar a la plataforma.",
};

export default function RutOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <RutOnboardingClient />
    </Suspense>
  );
}
