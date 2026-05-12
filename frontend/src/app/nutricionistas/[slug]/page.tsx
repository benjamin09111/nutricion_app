import NutritionistProfileClient from "./NutritionistProfileClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `Nutricionista | NutriNet`,
    description: `Perfil profesional de nutricionista en NutriNet`,
  };
}

export default function NutritionistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  return <NutritionistProfileClient slugPromise={params} />;
}