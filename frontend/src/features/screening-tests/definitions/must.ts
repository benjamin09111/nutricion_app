import type { ScreeningTestDefinition } from '../types';

/**
 * MUST — Malnutrition Universal Screening Tool
 * Developed by BAPEN for community and outpatient adult screening.
 * Total score: 0–6+. Thresholds: 0 = low, 1 = medium, ≥2 = high risk.
 * References: Elia M. BAPEN, 2003.
 */
export const MUST_DEFINITION: ScreeningTestDefinition = {
  type: 'MUST',
  name: 'Malnutrition Universal Screening Tool (MUST)',
  shortName: 'MUST',
  description: 'Tamizaje de desnutrición en adultos ambulatorios y comunitarios. Desarrollado por BAPEN.',
  targetAge: '18–64 años',
  icon: 'ClipboardCheck',
  maxScore: 6,
  sections: [
    {
      title: 'Paso 1 — IMC',
      maxPoints: 2,
      questions: [
        {
          id: 'BMI_STEP',
          label: 'Índice de Masa Corporal (IMC) del paciente',
          autoFillKey: 'bmi_must',
          defaultValue: 0,
          options: [
            { value: 0, label: '0 = IMC > 20 kg/m²' },
            { value: 1, label: '1 = IMC 18.5 – 20 kg/m²' },
            { value: 2, label: '2 = IMC < 18.5 kg/m²' },
          ],
        },
      ],
    },
    {
      title: 'Paso 2 — Pérdida de Peso',
      maxPoints: 2,
      questions: [
        {
          id: 'WEIGHT_LOSS',
          label: 'Pérdida de peso involuntaria en los últimos 3–6 meses',
          autoFillKey: undefined,
          defaultValue: 0,
          options: [
            { value: 0, label: '0 = Pérdida < 5%' },
            { value: 1, label: '1 = Pérdida 5 – 10%' },
            { value: 2, label: '2 = Pérdida > 10%' },
          ],
        },
      ],
    },
    {
      title: 'Paso 3 — Efecto de Enfermedad Aguda',
      maxPoints: 2,
      questions: [
        {
          id: 'ACUTE_DISEASE',
          label: '¿Existe enfermedad aguda con nula o probable nula ingesta alimentaria por >5 días?',
          autoFillKey: undefined,
          defaultValue: 0,
          options: [
            { value: 0, label: '0 = No' },
            { value: 2, label: '2 = Sí' },
          ],
        },
      ],
    },
  ],
  thresholds: [
    {
      maxScore: 1,
      category: 'Riesgo Bajo',
      color: '#22c55e',
      isAlert: false,
      recommendation: 'Riesgo bajo de desnutrición. Continuar cuidados habituales. Reevaluar periódicamente.',
    },
    {
      maxScore: 2,
      category: 'Riesgo Medio',
      color: '#f59e0b',
      isAlert: false,
      recommendation: 'Riesgo medio. Observar ingesta alimentaria durante 3 días. Si la ingesta es adecuada, reevaluar. Si es inadecuada, implementar plan nutricional.',
    },
    {
      maxScore: 7,
      category: 'Riesgo Alto',
      color: '#ef4444',
      isAlert: true,
      recommendation: 'Riesgo alto de desnutrición. Referir a especialista en nutrición para plan de intervención. Mejorar ingesta nutricional.',
    },
  ],
};
