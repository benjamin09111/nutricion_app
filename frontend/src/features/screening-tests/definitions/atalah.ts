import type { ScreeningTestDefinition } from '../types';

/**
 * Curvas de Atalah — Evaluación Nutricional de la Embarazada
 * Chilean standard for nutritional classification of pregnant women.
 * Uses gestational week + BMI to classify: Bajo peso, Normal, Sobrepeso, Obesidad.
 * References: Atalah E. et al. Rev Méd Chile, 1997. MINSAL Chile.
 *
 * NOTE: This test uses a different scoring mechanism than the others.
 * Instead of summing question scores, it classifies based on BMI ranges
 * at specific gestational weeks. The "questions" here capture the inputs
 * and the scoring logic in scoring.ts handles the lookup.
 */
export const ATALAH_DEFINITION: ScreeningTestDefinition = {
  type: 'ATALAH',
  name: 'Curvas de Atalah — Estado Nutricional de la Gestante',
  shortName: 'Atalah',
  description: 'Clasificación nutricional de mujeres embarazadas según semana de gestación e IMC. Estándar del MINSAL Chile.',
  targetAge: 'Embarazadas',
  icon: 'Heart',
  maxScore: 4, // 1=bajo peso, 2=normal, 3=sobrepeso, 4=obesidad (classification, not additive)
  sections: [
    {
      title: 'Datos Antropométricos de la Gestante',
      maxPoints: 4,
      questions: [
        {
          id: 'GEST_WEEK',
          label: 'Semana de gestación actual',
          autoFillKey: 'pregnancyWeek',
          defaultValue: 20,
          options: Array.from({ length: 35 }, (_, i) => ({
            value: i + 6,
            label: `${i + 6} semanas`,
          })),
        },
        {
          id: 'GEST_BMI',
          label: 'IMC actual de la gestante (kg/m²)',
          autoFillKey: 'bmi_atalah',
          defaultValue: 25,
          options: [
            { value: 18, label: 'IMC < 20' },
            { value: 22, label: 'IMC 20 – 24.9' },
            { value: 27, label: 'IMC 25 – 29.9' },
            { value: 32, label: 'IMC ≥ 30' },
          ],
        },
      ],
    },
  ],
  thresholds: [
    {
      maxScore: 2,
      category: 'Bajo Peso',
      color: '#f59e0b',
      isAlert: true,
      recommendation: 'La gestante presenta bajo peso. Se recomienda plan alimentario hipercalórico y seguimiento nutricional frecuente para asegurar ganancia de peso adecuada.',
    },
    {
      maxScore: 3,
      category: 'Normal',
      color: '#22c55e',
      isAlert: false,
      recommendation: 'Estado nutricional normal durante la gestación. Mantener alimentación equilibrada y controles habituales.',
    },
    {
      maxScore: 4,
      category: 'Sobrepeso',
      color: '#f59e0b',
      isAlert: false,
      recommendation: 'La gestante presenta sobrepeso. Se recomienda plan alimentario controlado y actividad física moderada. Monitorear ganancia de peso.',
    },
    {
      maxScore: 5,
      category: 'Obesidad',
      color: '#ef4444',
      isAlert: true,
      recommendation: 'La gestante presenta obesidad. Se requiere intervención nutricional especializada, restricción calórica controlada y seguimiento multidisciplinario.',
    },
  ],
};

/**
 * Atalah reference table: gestational week → [bajo peso max BMI, normal max BMI, sobrepeso max BMI]
 * Values above sobrepeso max = obesity.
 * Source: Atalah E. et al. 1997, MINSAL Chile normativas vigentes.
 */
export const ATALAH_TABLE: Record<number, [number, number, number]> = {
  6:  [20.0, 25.0, 30.0],
  7:  [20.0, 25.0, 30.0],
  8:  [20.0, 25.0, 30.0],
  9:  [20.1, 25.1, 30.1],
  10: [20.2, 25.2, 30.2],
  11: [20.3, 25.3, 30.3],
  12: [20.4, 25.4, 30.3],
  13: [20.6, 25.6, 30.4],
  14: [20.7, 25.7, 30.5],
  15: [20.8, 25.8, 30.6],
  16: [21.0, 26.0, 30.7],
  17: [21.1, 26.1, 30.8],
  18: [21.2, 26.2, 30.9],
  19: [21.4, 26.3, 31.0],
  20: [21.5, 26.5, 31.1],
  21: [21.7, 26.7, 31.2],
  22: [21.8, 26.8, 31.3],
  23: [22.0, 27.0, 31.4],
  24: [22.2, 27.1, 31.5],
  25: [22.3, 27.3, 31.7],
  26: [22.5, 27.4, 31.8],
  27: [22.7, 27.6, 31.9],
  28: [22.8, 27.7, 32.0],
  29: [23.0, 27.9, 32.1],
  30: [23.2, 28.0, 32.2],
  31: [23.4, 28.2, 32.3],
  32: [23.5, 28.3, 32.4],
  33: [23.7, 28.5, 32.6],
  34: [23.8, 28.6, 32.7],
  35: [24.0, 28.8, 32.8],
  36: [24.2, 28.9, 32.9],
  37: [24.3, 29.0, 33.0],
  38: [24.5, 29.2, 33.1],
  39: [24.7, 29.3, 33.2],
  40: [24.9, 29.5, 33.3],
};
