import { Prisma } from '@prisma/client';
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

    async create(createFoodDto: CreateFoodDto, userId: string) {
        // Find nutritionist profile from Account ID
        const nutritionist = await this.prisma.nutritionist.findUnique({
            where: { accountId: userId },
        });

        if (!nutritionist) {
            throw new Error("Nutritionist profile required to create ingredients. Please ensure you are logged in as a Nutritionist.");
        }

        return this.prisma.$transaction(async (tx) => {
            const ingredient = await tx.ingredient.create({
                data: {
                    ...createFoodDto,
                    isPublic: true, // Always public per requirement
                    verified: false,
                    nutritionist: { connect: { id: nutritionist.id } },
                },
            });

            await tx.ingredientPreference.create({
                data: {
                    nutritionist: { connect: { id: nutritionist.id } },
                    ingredient: { connect: { id: ingredient.id } },
                    isFavorite: true,
                    isHidden: false,
                },
            });

            return ingredient;
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

        const ingredients = await this.prisma.ingredient.findMany({
            where: {
                ...whereClause,
                ...(nutritionistId ? {
                    preferences: {
                        none: {
                            nutritionistId,
                            isHidden: true
                        }
                    }
                } : {})
            },
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

        return ingredients;
    }

    async findOne(id: string) {
        return this.prisma.ingredient.findUnique({
            where: { id },
        });
    }

    update(id: string, updateFoodDto: UpdateFoodDto) {
        return this.prisma.ingredient.update({
            where: { id },
            data: updateFoodDto,
        });
    }

    remove(id: string) {
        return this.prisma.ingredient.delete({
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

            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                range: 0,
                header: 1,
                defval: ''
            });

            const headers = jsonData[0] as string[];
            const rows = jsonData.slice(1, limit + 1) as any[][];

            return rows.map(row => {
                const record: any = {};
                headers.forEach((header, index) => {
                    const value = row[index];
                    record[header] = value;
                });

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
