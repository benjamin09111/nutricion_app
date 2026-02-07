
export enum FoodUnit {
    KILO = '$/kilo',
    UNIDAD = '$/unidad',
    MALLA = '$/malla',
    ATADO = '$/atado',
    OTRO = 'otro'
}

export enum FoodGroup {
    BOVINA = 'Carne bovina',
    CERDO_AVE_CORDERO = 'Carne de Cerdo - Ave - Cordero',
    ABARROTES = 'Abarrotes y otros',
    FRUTAS = 'Frutas',
    HORTALIZAS = 'Hortalizas',
    LACTEOS_HUEVOS = 'Lácteos - Huevos - Margarinas',
    PAN = 'Pan'
}

export interface Food {
    id: string;
    name: string;
    brand?: string;
    category: string;
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
    tags?: string[];
    isPublic: boolean;
}

export interface MarketPrice {
    id?: string; // Optional because CSV records don't have UUIDs initially
    producto: string;
    grupo: FoodGroup | string;
    unidad: FoodUnit | string;
    precioPromedio: number;
    isUserCreated?: boolean;

    // Optional legacy fields (from old dataset or manual entry)
    anio?: string;
    mes?: string;
    semana?: string;
    fechaInicio?: string;
    fechaTermino?: string;
    region?: string;
    sector?: string;
    tipoPuntoMonitoreo?: string;
    precioMinimo?: number;
    precioMaximo?: number;

    calorias?: number;
    proteinas?: number;
    tags?: string[];
    status?: 'base' | 'favorite' | 'removed';
}
