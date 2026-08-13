import { Metadata } from "next";
import SobreNutriNetClient from "./SobreNutriNetClient";

export const metadata: Metadata = {
  title: "Sobre NutriNet | Plataforma Clínica para Nutricionistas en Chile",
  description:
    "Conoce nuestra visión, equipo, preguntas frecuentes, seguridad de datos (Ley 19.628) y respaldo clínico para nutricionistas.",
};

export default function SobreNutriNetPage() {
  return <SobreNutriNetClient />;
}
