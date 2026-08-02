import type { ScreeningTestDefinition } from '../types';

/**
 * NRS-2002 — Nutritional Risk Screening
 * Recommended by ESPEN for hospitalized adult patients (18–64 years).
 * Total score: 0–7 points. Risk threshold: ≥3.
 * References: Kondrup et al. Clinical Nutrition, 2003.
 */
export const NRS_2002_DEFINITION: ScreeningTestDefinition = {
  type: 'NRS_2002',
  name: 'Nutritional Risk Screening (NRS-2002)',
  shortName: 'NRS-2002',
  description: 'Cribado del riesgo nutricional en pacientes adultos hospitalizados (18–64 años). Recomendado por ESPEN.',
  targetAge: '18–64 años',
  icon: 'Stethoscope',
  maxScore: 7,
  sections: [
    {
      title: 'Deterioro del Estado Nutricional',
      maxPoints: 3,
      questions: [
        {
          id: 'NUT_STATUS',
          label: 'Estado nutricional del paciente',
          autoFillKey: 'bmi_nrs',
          defaultValue: 0,
          options: [
            { value: 0, label: '0 = Normal (IMC 20.5–25, ingesta >75%, sin pérdida peso)' },
            { value: 1, label: '1 = Leve (pérdida peso >5% en 3 meses o ingesta 50–75%)' },
            { value: 2, label: '2 = Moderado (pérdida peso >5% en 2 meses o IMC 18.5–20.5 + deterioro)' },
            { value: 3, label: '3 = Grave (pérdida peso >5% en 1 mes o IMC <18.5 + deterioro)' },
          ],
        },
      ],
    },
    {
      title: 'Gravedad de la Enfermedad',
      maxPoints: 3,
      questions: [
        {
          id: 'DISEASE_SEV',
          label: 'Gravedad de la enfermedad actual',
          autoFillKey: undefined,
          defaultValue: 0,
          options: [
            { value: 0, label: '0 = Sin enfermedad significativa' },
            { value: 1, label: '1 = Fractura de cadera, paciente crónico con complicaciones agudas' },
            { value: 2, label: '2 = Cirugía abdominal mayor, ACV, neumonía severa, neoplasia hematológica' },
            { value: 3, label: '3 = Traumatismo craneoencefálico, trasplante medular, UCI (APACHE >10)' },
          ],
        },
      ],
    },
    {
      title: 'Factor Edad',
      maxPoints: 1,
      questions: [
        {
          id: 'AGE_FACTOR',
          label: '¿El paciente tiene 70 años o más?',
          autoFillKey: 'age_nrs',
          defaultValue: 0,
          options: [
            { value: 0, label: '0 = No (< 70 años)' },
            { value: 1, label: '1 = Sí (≥ 70 años)' },
          ],
        },
      ],
    },
  ],
  thresholds: [
    {
      maxScore: 3,
      category: 'Sin Riesgo Nutricional',
      color: '#22c55e',
      isAlert: false,
      recommendation: 'Sin riesgo nutricional significativo. Reevaluar semanalmente durante hospitalización.',
    },
    {
      maxScore: 8,
      category: 'Riesgo Nutricional (≥3)',
      color: '#ef4444',
      isAlert: true,
      recommendation: 'Se detecta riesgo nutricional. Iniciar plan nutricional individualizado. Interconsulta con nutrición clínica.',
    },
  ],
};
