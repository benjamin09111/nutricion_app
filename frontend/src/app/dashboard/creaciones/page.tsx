
import CreationsClient from './CreationsClient';
import { Creation, CreationType } from '@/features/creations/types';

const mockCreations: Creation[] = [
    {
        id: '1',
        name: 'Dieta Hipertrofia - Juan Pérez',
        type: CreationType.DIET,
        createdAt: '25 Ene 2025',
        size: '1.2 MB',
        format: 'PDF',
        tags: ['Musculación', 'Alto Carb']
    },
    {
        id: '2',
        name: 'Lista de Compras Semanal - María G.',
        type: CreationType.SHOPPING_LIST,
        createdAt: '24 Ene 2025',
        size: '450 KB',
        format: 'Excel',
        tags: ['Low Cost', 'Vegetariano']
    },
    {
        id: '3',
        name: 'Receta Pan Integral Casero',
        type: CreationType.RECIPE,
        createdAt: '20 Ene 2025',
        size: '2.5 MB',
        format: 'PDF',
        tags: ['Panadería', 'Integral']
    },
    {
        id: '4',
        name: 'Dieta Keto - 1500kcal',
        type: CreationType.DIET,
        createdAt: '18 Ene 2025',
        size: '1.1 MB',
        format: 'PDF',
        tags: ['Keto', 'Pérdida Peso', 'Mujer']
    },
    {
        id: '5',
        name: 'Rutina + Suplementación',
        type: CreationType.OTHER,
        createdAt: '15 Ene 2025',
        size: '3.0 MB',
        format: 'Doc',
        tags: ['Gym', 'Suplementos']
    }
];

export default function CreationsPage() {
    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between px-2">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">
                        Mis Creaciones
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Gestiona y descarga todos los recursos generados para tus pacientes.
                    </p>
                </div>
            </div>
            <CreationsClient initialData={mockCreations} />
        </div>
    );
}
