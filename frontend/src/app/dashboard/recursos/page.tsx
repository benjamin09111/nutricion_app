import { ResourcesClient } from './ResourcesClient';

export const metadata = {
    title: 'Recursos del Entregable | NutriSaaS',
    description: 'Gestiona los contenidos educativos que se incluyen en el entregable final de tus pacientes.',
};

export default function RecursosPage() {
    return <ResourcesClient />;
}
