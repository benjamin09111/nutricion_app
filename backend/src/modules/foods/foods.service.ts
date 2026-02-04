import { Injectable } from '@nestjs/common';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { PrismaService } from '../../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { MarketPriceDto } from './dto/market-price.dto';

@Injectable()
export class FoodsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createFoodDto: CreateFoodDto, nutritionistId?: string) {
        // If nutritionistId is present, it's a custom food
        const isPublic = createFoodDto.isPublic ?? false;

        return this.prisma.food.create({
            data: {
                ...createFoodDto,
                nutritionistId: isPublic ? null : nutritionistId,
                isPublic: isPublic,
            },
        });
    }

    async findAll(params: {
        nutritionistId?: string;
        search?: string;
        category?: string;
        page?: number;
        limit?: number;
    }) {
        const { nutritionistId, search, category, page = 1, limit = 20 } = params;

        const whereClause: any = {
            OR: [{ isPublic: true }],
        };

        if (nutritionistId) {
            whereClause.OR.push({ nutritionistId });
        }

        if (search) {
            whereClause.name = { contains: search, mode: 'insensitive' };
        }

        if (category) {
            whereClause.category = category;
        }

        const foods = await this.prisma.food.findMany({
            where: whereClause,
            include: nutritionistId
                ? {
                    preferences: {
                        where: { nutritionistId },
                    },
                }
                : undefined,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { name: 'asc' },
        });

        // Client-side filtering for 'Hidden' if nutritionistId is active
        if (nutritionistId) {
            return foods.filter((f: any) => !f.preferences?.[0]?.isHidden);
        }

        return foods;
    }

    async findOne(id: string) {
        return this.prisma.food.findUnique({
            where: { id },
        });
    }

    update(id: string, updateFoodDto: UpdateFoodDto) {
        return this.prisma.food.update({
            where: { id },
            data: updateFoodDto,
        });
    }

    remove(id: string) {
        return this.prisma.food.delete({
            where: { id },
        });
    }

    async getMarketPrices(limit: number = 7): Promise<MarketPriceDto[]> {
        try {
            const filePath = path.resolve(process.cwd(), '..', 'docs', 'data', 'foods.csv');

            if (!fs.existsSync(filePath)) {
                console.error('Market prices file not found at:', filePath);
                return [];
            }

            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Read first rows (+1 for header)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                range: 0,
                header: 1, // Use first row as header is handled manually or let XLSX handle it
                defval: ''
            });

            // jsonData[0] is header
            const headers = jsonData[0] as string[];
            const rows = jsonData.slice(1, limit + 1) as any[][];

            return rows.map(row => {
                const record: any = {};
                headers.forEach((header, index) => {
                    const value = row[index];
                    record[header] = value;
                });

                // Mapping to DTO
                return {
                    anio: record['Anio'],
                    mes: record['Mes'],
                    semana: record['Semana'],
                    fechaInicio: record['Fecha inicio'],
                    fechaTermino: record['Fecha termino'],
                    region: record['Region'],
                    sector: record['Sector'],
                    tipoPuntoMonitoreo: record['Tipo de punto monitoreo'],
                    grupo: record['Grupo'],
                    producto: record['Producto'],
                    unidad: record['Unidad'],
                    precioMinimo: parseFloat(record['Precio minimo']) || 0,
                    precioMaximo: parseFloat(record['Precio maximo']) || 0,
                    precioPromedio: parseFloat(String(record['Precio promedio']).replace(',', '.')) || 0,
                };
            });
        } catch (error) {
            console.error('Error reading market prices:', error);
            return [];
        }
    }
}
