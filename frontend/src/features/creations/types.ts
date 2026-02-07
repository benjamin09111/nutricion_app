export enum CreationType {
    DIET = 'Dieta',
    SHOPPING_LIST = 'Lista de Compras',
    RECIPE = 'Receta',
    OTHER = 'Otro'
}

export interface Creation {
    id: string;
    name: string;
    type: CreationType;
    createdAt: string;
    size: string;
    format: 'PDF' | 'Excel' | 'JSON' | 'Doc';
    tags?: string[];
}
