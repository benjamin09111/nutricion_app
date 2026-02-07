import ConsultationsClient from './ConsultationsClient';
import { MOCK_CONSULTATIONS } from '@/features/consultations/mocks';

const mockPatients = [
    { id: '1', name: 'Ana Silva' },
    { id: '2', name: 'Carlos Ruiz' },
    { id: '3', name: 'Maria Gonzalez' },
    { id: '4', name: 'Ana Silva' },
    { id: '5', name: 'Pedro Pascal' },
    { id: '6', name: 'Luisa Lane' },
    { id: '7', name: 'Clark Kent' },
];

export default function ConsultationsPage() {
    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between px-2">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">
                        Consultas
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Registro de todas las sesiones realizadas con tus pacientes.
                    </p>
                </div>
            </div>
            <ConsultationsClient initialData={MOCK_CONSULTATIONS} patients={mockPatients} />
        </div>
    );
}
