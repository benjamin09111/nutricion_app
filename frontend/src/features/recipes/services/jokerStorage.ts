
export interface EmergencyJoker {
    id: string;
    title: string;
}

const STORAGE_KEY = 'nutrisaas_jokers_db';

const DEFAULT_JOKERS: EmergencyJoker[] = [
    { id: '1', title: 'Sandwich de Atún & Palta' },
    { id: '2', title: 'Bowl de Avena Express' },
    { id: '3', title: 'Omelette de 2 Huevos + Tomate' }
];

export const JokerStorage = {
    getAll: (): EmergencyJoker[] => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    save: (joker: EmergencyJoker): void => {
        const items = JokerStorage.getAll();
        items.push(joker);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    },

    delete: (id: string): void => {
        const items = JokerStorage.getAll().filter(i => i.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    },

    initialize: () => {
        if (typeof window === 'undefined') return;
        if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_JOKERS));
        }
    }
};
