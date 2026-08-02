import type { ScreeningTestDefinition } from '../types';

/**
 * MNA — Mini Nutritional Assessment
 * Validated screening tool for malnutrition risk in older adults (≥65 years).
 * Total score: 0–30 points.
 * References: Nestlé Nutrition Institute, Vellas et al. 1999.
 */
export const MNA_DEFINITION: ScreeningTestDefinition = {
  type: 'MNA',
  name: 'Mini Nutritional Assessment (MNA®)',
  shortName: 'MNA',
  description: 'Evaluación del riesgo de desnutrición en adultos mayores (≥65 años). Herramienta validada internacionalmente.',
  targetAge: '≥65 años',
  icon: 'FileText',
  maxScore: 30,
  sections: [
    {
      title: 'Cribado Rápido',
      maxPoints: 14,
      questions: [
        {
          id: 'A',
          label: '¿Ha disminuido la ingesta de alimentos en los últimos 3 meses?',
          autoFillKey: undefined,
          defaultValue: 2,
          options: [
            { value: 0, label: '0 = Disminución grave del apetito' },
            { value: 1, label: '1 = Disminución moderada' },
            { value: 2, label: '2 = Sin disminución del apetito' },
          ],
        },
        {
          id: 'B',
          label: 'Pérdida reciente de peso (<3 meses)',
          autoFillKey: undefined,
          defaultValue: 3,
          options: [
            { value: 0, label: '0 = Pérdida de peso > 3 kg' },
            { value: 1, label: '1 = No sabe' },
            { value: 2, label: '2 = Pérdida entre 1 y 3 kg' },
            { value: 3, label: '3 = Sin pérdida de peso' },
          ],
        },
        {
          id: 'C',
          label: 'Movilidad habitual',
          autoFillKey: undefined,
          defaultValue: 2,
          options: [
            { value: 0, label: '0 = De la cama al sillón' },
            { value: 1, label: '1 = Autonomía en el interior' },
            { value: 2, label: '2 = Sale del domicilio' },
          ],
        },
        {
          id: 'D',
          label: '¿Ha tenido enfermedad aguda o estrés psicológico en 3 meses?',
          autoFillKey: undefined,
          defaultValue: 2,
          options: [
            { value: 0, label: '0 = Sí' },
            { value: 2, label: '2 = No' },
          ],
        },
        {
          id: 'E',
          label: 'Problemas neuropsicológicos',
          autoFillKey: undefined,
          defaultValue: 2,
          options: [
            { value: 0, label: '0 = Demencia o depresión grave' },
            { value: 1, label: '1 = Demencia moderada' },
            { value: 2, label: '2 = Sin problemas psicológicos' },
          ],
        },
        {
          id: 'F',
          label: 'IMC o Circunferencia Pantorrilla (CP)',
          autoFillKey: 'bmi_or_calf',
          defaultValue: 3,
          options: [
            { value: 0, label: '0 = IMC < 19 o CP < 31 cm' },
            { value: 1, label: '1 = IMC 19 – 21' },
            { value: 2, label: '2 = IMC 21 – 23' },
            { value: 3, label: '3 = IMC ≥ 23 o CP ≥ 31 cm' },
          ],
        },
      ],
    },
    {
      title: 'Evaluación Global',
      maxPoints: 16,
      questions: [
        {
          id: 'G',
          label: '¿El paciente vive independiente en su domicilio?',
          autoFillKey: undefined,
          defaultValue: 1,
          options: [
            { value: 0, label: '0 = No' },
            { value: 1, label: '1 = Sí' },
          ],
        },
        {
          id: 'H',
          label: '¿Toma más de 3 medicamentos al día?',
          autoFillKey: undefined,
          defaultValue: 1,
          options: [
            { value: 0, label: '0 = Sí' },
            { value: 1, label: '1 = No' },
          ],
        },
        {
          id: 'I',
          label: '¿Presenta úlceras o lesiones cutáneas?',
          autoFillKey: undefined,
          defaultValue: 1,
          options: [
            { value: 0, label: '0 = Sí' },
            { value: 1, label: '1 = No' },
          ],
        },
        {
          id: 'J',
          label: 'N° de comidas completas al día',
          autoFillKey: undefined,
          defaultValue: 2,
          options: [
            { value: 0, label: '0 = 1 comida' },
            { value: 1, label: '1 = 2 comidas' },
            { value: 2, label: '2 = 3 comidas' },
          ],
        },
        {
          id: 'K',
          label: 'Consumo de alimentos proteicos',
          autoFillKey: undefined,
          defaultValue: 1,
          options: [
            { value: 0, label: '0 = 0 a 1 grupo proteico' },
            { value: 0.5, label: '0.5 = 2 grupos proteicos' },
            { value: 1, label: '1 = 3 grupos (lácteos, huevos/legumbres, carne/pescado)' },
          ],
        },
        {
          id: 'L',
          label: '¿Consume ≥2 porciones de frutas/verduras al día?',
          autoFillKey: undefined,
          defaultValue: 1,
          options: [
            { value: 0, label: '0 = No' },
            { value: 1, label: '1 = Sí' },
          ],
        },
        {
          id: 'M',
          label: 'Consumo de líquidos al día',
          autoFillKey: undefined,
          defaultValue: 1,
          options: [
            { value: 0, label: '0 = Menos de 3 vasos' },
            { value: 0.5, label: '0.5 = De 3 a 5 vasos' },
            { value: 1, label: '1 = Más de 5 vasos' },
          ],
        },
        {
          id: 'N',
          label: 'Forma de alimentarse',
          autoFillKey: undefined,
          defaultValue: 2,
          options: [
            { value: 0, label: '0 = Necesita asistencia' },
            { value: 1, label: '1 = Se alimenta solo con dificultad' },
            { value: 2, label: '2 = Se alimenta solo sin dificultad' },
          ],
        },
        {
          id: 'O',
          label: 'Autopercepción del estado nutricional',
          autoFillKey: undefined,
          defaultValue: 2,
          options: [
            { value: 0, label: '0 = Se considera desnutrido' },
            { value: 1, label: '1 = No sabe' },
            { value: 2, label: '2 = Sin problemas de nutrición' },
          ],
        },
        {
          id: 'P',
          label: 'Autopercepción de salud vs pares de su edad',
          autoFillKey: undefined,
          defaultValue: 2,
          options: [
            { value: 0, label: '0 = Peor' },
            { value: 0.5, label: '0.5 = No sabe' },
            { value: 1, label: '1 = Igual' },
            { value: 2, label: '2 = Mejor' },
          ],
        },
        {
          id: 'Q',
          label: 'Circunferencia Braquial (CB)',
          autoFillKey: 'armCircumference',
          defaultValue: 1,
          options: [
            { value: 0, label: '0 = CB < 21 cm' },
            { value: 0.5, label: '0.5 = CB 21 – 22 cm' },
            { value: 1, label: '1 = CB ≥ 22 cm' },
          ],
        },
        {
          id: 'R',
          label: 'Circunferencia de Pantorrilla (CP)',
          autoFillKey: 'calfCircumference',
          defaultValue: 1,
          options: [
            { value: 0, label: '0 = CP < 31 cm' },
            { value: 1, label: '1 = CP ≥ 31 cm' },
          ],
        },
      ],
    },
  ],
  thresholds: [
    {
      maxScore: 17,
      category: 'Desnutrición Confirmada',
      color: '#ef4444',
      isAlert: true,
      recommendation: 'Se confirma desnutrición. Se requiere intervención nutricional inmediata y seguimiento clínico estrecho.',
    },
    {
      maxScore: 23.5,
      category: 'Riesgo de Desnutrición',
      color: '#f59e0b',
      isAlert: false,
      recommendation: 'Existe riesgo de desnutrición. Se recomienda evaluación nutricional detallada y plan de intervención preventivo.',
    },
    {
      maxScore: 31,
      category: 'Estado Nutricional Normal',
      color: '#22c55e',
      isAlert: false,
      recommendation: 'Estado nutricional adecuado. Mantener hábitos alimentarios actuales y realizar seguimiento periódico.',
    },
  ],
};
