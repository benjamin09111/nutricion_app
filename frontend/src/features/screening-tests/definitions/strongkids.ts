import type { ScreeningTestDefinition } from '../types';

/**
 * STRONGkids — Screening Tool for Risk on Nutritional status and Growth
 * Pediatric nutritional risk screening (1–18 years).
 * Total score: 0–5 points. Thresholds: 0 = low, 1-3 = medium, 4-5 = high.
 * References: Hulst et al. Clinical Nutrition, 2010.
 */
export const STRONGKIDS_DEFINITION: ScreeningTestDefinition = {
  type: 'STRONGKIDS',
  name: 'Screening Tool for Risk on Nutritional status and Growth (STRONGkids)',
  shortName: 'STRONGkids',
  description: 'Tamizaje del riesgo nutricional en niños y adolescentes hospitalizados (1–18 años).',
  targetAge: '1–18 años',
  icon: 'Baby',
  maxScore: 5,
  sections: [
    {
      title: 'Evaluación Clínica',
      maxPoints: 5,
      questions: [
        {
          id: 'SUBJECTIVE',
          label: '¿Presenta el paciente un estado nutricional deficiente a la evaluación clínica subjetiva? (masa muscular y grasa subcutánea disminuidas)',
          autoFillKey: undefined,
          defaultValue: 0,
          options: [
            { value: 0, label: '0 = No' },
            { value: 1, label: '1 = Sí' },
          ],
        },
        {
          id: 'HIGH_RISK_DISEASE',
          label: '¿Presenta una enfermedad de alto riesgo nutricional? (anorexia, enfermedad hepática, quemaduras, cirugía mayor, displasia broncopulmonar, enfermedad celíaca, fibrosis quística, prematuridad, cardiopatía, enfermedad infecciosa, enfermedad inflamatoria intestinal, cáncer, enfermedad metabólica, pancreatitis, síndrome de intestino corto, enfermedad muscular, enfermedad renal crónica, trauma, otra)',
          autoFillKey: undefined,
          defaultValue: 0,
          options: [
            { value: 0, label: '0 = No' },
            { value: 2, label: '2 = Sí' },
          ],
        },
        {
          id: 'INTAKE_LOSS',
          label: '¿Presenta alguno de estos? Diarrea excesiva (≥5 veces/día) y/o vómitos (>3 veces/día), ingesta reducida los últimos días, intervención nutricional preexistente, incapacidad de ingesta adecuada por dolor',
          autoFillKey: undefined,
          defaultValue: 0,
          options: [
            { value: 0, label: '0 = No' },
            { value: 1, label: '1 = Sí' },
          ],
        },
        {
          id: 'WEIGHT_CHANGE',
          label: '¿Se ha observado pérdida de peso o estancamiento ponderal (en lactantes < 1 año) en las últimas semanas/meses?',
          autoFillKey: undefined,
          defaultValue: 0,
          options: [
            { value: 0, label: '0 = No' },
            { value: 1, label: '1 = Sí' },
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
      recommendation: 'Riesgo bajo. Continuar cuidados habituales. Reevaluar semanalmente durante la hospitalización.',
    },
    {
      maxScore: 4,
      category: 'Riesgo Medio',
      color: '#f59e0b',
      isAlert: false,
      recommendation: 'Riesgo medio. Consultar con nutricionista para valoración e indicaciones dietéticas. Verificar peso 2 veces por semana y reevaluar riesgo en 1 semana.',
    },
    {
      maxScore: 6,
      category: 'Riesgo Alto',
      color: '#ef4444',
      isAlert: true,
      recommendation: 'Riesgo alto. Consultar con nutricionista clínico y médico para diagnóstico completo, plan nutricional individualizado y seguimiento. Verificar peso 2 veces por semana.',
    },
  ],
};
