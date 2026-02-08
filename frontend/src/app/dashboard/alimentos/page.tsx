import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import FoodsClient from './FoodsClient';
import { Ingredient } from '@/features/foods';

async function getIngredients(): Promise<Ingredient[]> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
    try {
        const res = await fetch(`${apiUrl}/foods?limit=1000`, { cache: 'no-store' }); // Disable cache for dev
        if (!res.ok) {
            console.error('Failed to fetch ingredients:', res.status, res.statusText);
            return [];
        }
        return res.json();
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        return [];
    }
}

export default async function FoodsPage() {
    const ingredients = await getIngredients();

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between px-2">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">
                        Catálogo de Ingredientes
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Gestiona los ingredientes base para tus pautas y recetas.
                    </p>
                </div>
                {/* Action button moved to Client Component */}
            </div>

            {/* Main Content: Filters + Table consolidated in Client Component */}
            <FoodsClient initialData={ingredients} />
        </div>
    );
}
