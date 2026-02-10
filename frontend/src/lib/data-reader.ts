
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { MarketPrice } from '@/features/foods';

export function getLocalMarketPrices(limit: number = 20): MarketPrice[] {
    try {
        const filePath = path.resolve(process.cwd(), '..', 'docs', 'data', 'foods.csv');

        if (!fs.existsSync(filePath)) {
            // Squelch error in development/production if file is expected to be missing or populated later
            // console.warn('Market prices file not found at:', filePath);
            return [];
        }

        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            range: 0,
            header: 1,
            defval: '',
            raw: false,
        }) as any[][];

        if (jsonData.length < 2) return [];

        const headers = jsonData[0] as string[];
        // Use slice if limit is positive, otherwise take all
        const rows = limit > 0 ? jsonData.slice(1, limit + 1) : jsonData.slice(1);

        return rows.map((row, index) => {
            const record: any = {};
            headers.forEach((header, index) => {
                const value = row[index];
                record[header] = value;
            });

            // Clean and parse prices robustly
            const parsePrice = (val: any) => {
                const str = String(val || '0').replace(',', '.');
                return Math.round(parseFloat(str) || 0);
            };

            return {
                id: `market-${index}`,
                producto: String(record['Alimento'] || ''),
                precioPromedio: parsePrice(record['Precio promedio']),
                unidad: String(record['Unidad'] || ''),
                grupo: String(record['Grupo'] || ''),
                // Optional fields
                calorias: 0,
                proteinas: 0,
            };
        });
    } catch (error) {
        console.error('Error reading local market prices:', error);
        return [];
    }
}
