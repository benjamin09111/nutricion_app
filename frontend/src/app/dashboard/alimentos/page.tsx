
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import FoodsClient from './FoodsClient';
import { getLocalMarketPrices } from '@/lib/data-reader';

export default async function FoodsPage() {
    // Reading all records for catalog
    const localPrices = getLocalMarketPrices(0);
    const finalData = localPrices;

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between px-2">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">
                        Catálogo de Alimentos
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Explora precios y productos del mercado chileno.
                    </p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95">
                        <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Añadir Alimento
                    </Button>
                </div>
            </div>

            {/* Main Content: Filters + Table consolidated in Client Component */}
            <FoodsClient initialData={finalData} />
        </div>
    );
}
