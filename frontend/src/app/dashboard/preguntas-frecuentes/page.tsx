import { FaqClient } from "./FaqClient";

export const metadata = {
  title: "Preguntas frecuentes | NutriNet",
  description: "Respuestas rápidas sobre NutriNet, sus módulos, la IA y el flujo clínico.",
};

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <FaqClient />
    </div>
  );
}
