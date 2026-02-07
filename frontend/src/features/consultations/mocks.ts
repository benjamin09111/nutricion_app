import { Consultation } from './types';

export const MOCK_CONSULTATIONS: Consultation[] = [
    {
        id: '1',
        patientId: '1',
        patientName: 'Ana Silva',
        date: '2025-01-01',
        title: 'Sesión Inicial - Evaluación',
        description: 'Evaluación inicial. Se detecta baja ingesta de micronutrientes.',
        metrics: [
            { label: 'Peso', value: 65.5, unit: 'kg' },
            { label: 'Grasa Corporal', value: 18, unit: '%' },
            { label: 'Cantidad de Vitamina C', value: 45, unit: 'mg' }
        ]
    },
    {
        id: '2',
        patientId: '2',
        patientName: 'Carlos Ruiz',
        date: '2025-01-10',
        title: 'Control Mensual',
        description: 'Paciente mejora adherencia.',
        metrics: [
            { label: 'Peso', value: 83.2, unit: 'kg' },
            { label: 'Mutilación', value: 34, unit: 'kg' }
        ]
    },
    {
        id: '3',
        patientId: '1',
        patientName: 'Ana Silva',
        date: '2025-01-15',
        title: 'Control Quincenal',
        description: 'Se observa aumento en el consumo de cítricos.',
        metrics: [
            { label: 'Peso', value: 64.8, unit: 'kg' },
            { label: 'Cantidad de Vitamina C', value: 70, unit: 'mg' }
        ]
    },
    {
        id: '4',
        patientId: '1',
        patientName: 'Ana Silva',
        date: '2025-01-28',
        title: 'Seguimiento Actual',
        description: 'Objetivos de Vitamina C alcanzados.',
        metrics: [
            { label: 'Peso', value: 64.2, unit: 'kg' },
            { label: 'Cantidad de Vitamina C', value: 95, unit: 'mg' }
        ]
    }
];
