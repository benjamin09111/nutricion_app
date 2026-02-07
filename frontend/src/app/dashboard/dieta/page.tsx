
import DietClient from './DietClient';
import { getLocalMarketPrices } from '@/lib/data-reader';

export const metadata = {
    title: 'Generador de Dieta | NutriSaaS',
    description: 'Crea dietas personalizadas basadas en patrones generales.',
};

export default function DietPage() {
    // We can fetch initial "Market" foods to populate the "General Diet"
    // For now, we'll pass a subset or let the Client handle the mock data for the "Base Diet"
    const marketFoods = getLocalMarketPrices(0).slice(0, 100).map((f, i) => ({
        ...f,
        // Mock tags for demonstration
        tags: [
            i % 3 === 0 ? 'Keto' : null,
            i % 5 === 0 ? 'Vegetariano' : null,
            i % 2 === 0 ? 'Alto en Proteinas' : null
        ].filter(Boolean) as string[]
    }));

    return (
        <div className="h-full">
            <DietClient initialFoods={marketFoods} />
        </div>
    );
}
