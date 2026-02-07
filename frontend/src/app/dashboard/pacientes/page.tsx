import PatientsClient from './PatientsClient';
import { MOCK_PATIENTS } from '@/features/patients/mocks';

export default function PatientsPage() {
    return (
        <PatientsClient initialData={MOCK_PATIENTS} />
    );
}
