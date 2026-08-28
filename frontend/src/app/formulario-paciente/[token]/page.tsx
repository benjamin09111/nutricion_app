import type { Metadata } from 'next';
import PublicIntakeFormClient from './PublicIntakeFormClient';

export const metadata: Metadata = {
  title: 'Formulario Clínico de Inicialización | NutriNet',
  description: 'Formulario privado de antecedentes clínicos para pacientes.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <PublicIntakeFormClient />;
}
