import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
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

    private async getOrCreateBrand(name?: string) {
        if (!name) return null;
        const normalized = name.trim();
        return (this.prisma as any).ingredientBrand.upsert({
            where: { name: normalized },
            update: {},
            create: { name: normalized },
        });
    }

    private async getOrCreateCategory(name: string) {
        const normalized = name.trim();
        return (this.prisma as any).ingredientCategory.upsert({
            where: { name: normalized },
            update: {},
            create: { name: normalized },
        });
    }

    private async getOrCreateTags(names?: string[]) {
        if (!names || names.length === 0) return [];
        const tags = [];
        for (const name of names) {
            const normalized = name.trim();
            const tag = await (this.prisma as any).tag.upsert({
                where: { name: normalized },
                update: {},
                create: { name: normalized },
            });
            tags.push(tag);
        }
        return tags;
    }

    async create(createFoodDto: CreateFoodDto, userId: string) {
        const { brand, category, tags, ...rest } = createFoodDto;

        // Find nutritionist profile from Account ID
        const nutritionist = await (this.prisma as any).nutritionist.findUnique({
            where: { accountId: userId },
        });

        if (!nutritionist) {
            throw new Error("Nutritionist profile required to create ingredients. Please ensure you are logged in as a Nutritionist.");
        }

        const brandRecord = await this.getOrCreateBrand(brand);
        const categoryRecord = await this.getOrCreateCategory(category);
        const tagRecords = await this.getOrCreateTags(tags);

        // Check for duplicates (Name + Brand)
        if (brandRecord) {
            const existing = await (this.prisma as any).ingredient.findFirst({
                where: {
                    name: rest.name,
                    brandId: brandRecord.id,
                }
            });

            if (existing) {
                // If it exists, we could either return it or throw error.
                // User said "alimentos son unicos en nombre, y unicos en marca".
                // Implies we should reject creation of duplicate.
                throw new Error(`Ya existe un alimento llamado '${rest.name}' de la marca '${brand}'.`);
            }
        }

        return (this.prisma as any).$transaction(async (tx: any) => {
            const ingredient = await tx.ingredient.create({
                data: {
                    ...rest,
                    brand: brandRecord ? { connect: { id: brandRecord.id } } : undefined,
                    category: { connect: { id: categoryRecord.id } },
                    tags: {
                        connect: tagRecords.map(t => ({ id: t.id })),
                    },
                    isPublic: true,
                    verified: false,
                    nutritionist: { connect: { id: nutritionist.id } },
                },
                include: {
                    brand: true,
                    category: true,
                    tags: true,
                },
            });

            await tx.ingredientPreference.create({
                data: {
                    nutritionist: { connect: { id: nutritionist.id } },
                    ingredient: { connect: { id: ingredient.id } },
                    isFavorite: true, // Auto-favorite own creations? User didn't specify, but usually yes.
                    isHidden: false,
                },
            });

            return ingredient;
        });
    }

    async findAll(params: {
        nutritionistAccountId?: string;
        search?: string;
        category?: string;
        tab?: string;
        page?: number;
        limit?: number;
    }) {
        const { nutritionistAccountId, search, category, tab = 'all', page = 1, limit = 20 } = params;

        let nutritionistId: string | undefined;
        if (nutritionistAccountId) {
            const nutritionist = await (this.prisma as any).nutritionist.findUnique({
                where: { accountId: nutritionistAccountId },
            });
            nutritionistId = nutritionist?.id;
        }

        const whereClause: any = {};

        // 1. Tab-based filtering
        if (tab === 'created' && nutritionistId) {
            whereClause.nutritionistId = nutritionistId;
        } else if (tab === 'favorites' && nutritionistId) {
            whereClause.preferences = {
                some: {
                    nutritionistId,
                    isFavorite: true,
                },
            };
        } else if (tab === 'not_recommended' && nutritionistId) {
            whereClause.preferences = {
                some: {
                    nutritionistId,
                    isNotRecommended: true,
                },
            };
        } else if (tab === 'app') {
            // "Ingredientes de la App" -> Verified/System ingredients
            // Using verified=true as proxy for "System/App" ingredients.
            // Adjust if seeding logic differs.
            whereClause.verified = true;
            whereClause.isPublic = true;
        } else if (tab === 'community') {
            // "Ingredientes de Nutricionistas" -> Public but not verified (yet)
            whereClause.verified = false;
            whereClause.isPublic = true;
            whereClause.nutritionistId = { not: null };
        } else {
            // 'all' tab (default fallback): Show public foods OR my created foods (if any remaining logic uses 'all')
            whereClause.OR = [
                { isPublic: true },
                ...(nutritionistId ? [{ nutritionistId }] : []),
            ];
        }

        // 2. Additional filters
        if (search) {
            whereClause.name = { contains: search, mode: 'insensitive' };
        }

        if (category) {
            // Filter by category name
            whereClause.category = {
                name: { contains: category, mode: 'insensitive' }
            };
        }

        // 3. Hide completely hidden foods for this nutritionist
        if (nutritionistId) {
            const originalWhere = { ...whereClause };
            whereClause.AND = [
                originalWhere,
                {
                    preferences: {
                        none: {
                            nutritionistId,
                            isHidden: true,
                        },
                    },
                },
            ];
        }

        const ingredients = await (this.prisma as any).ingredient.findMany({
            where: whereClause,
            include: {
                brand: true,
                category: true,
                tags: true,
                ...(nutritionistId ? {
                    preferences: {
                        where: { nutritionistId },
                        include: { tags: true },
                    },
                } : {}),
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { name: 'asc' },
        });

        return ingredients;
    }

    async togglePreference(ingredientId: string, userId: string, data: {
        isFavorite?: boolean;
        isNotRecommended?: boolean;
        isHidden?: boolean;
        tags?: string[];
    }) {
        console.log('[togglePreference] Processing for Account ID:', userId, 'Ingredient ID:', ingredientId);
        let nutritionist = await (this.prisma as any).nutritionist.findUnique({
            where: { accountId: userId },
        });

        if (!nutritionist) {
            console.warn(`[togglePreference] Nutritionist profile missing for Account ID: ${userId}. Attempting auto-creation...`);

            // Check if account exists first
            const account = await (this.prisma as any).account.findUnique({
                where: { id: userId }
            });

            if (!account) {
                console.error(`[togglePreference] Account not found: ${userId}`);
                throw new NotFoundException("Cuenta de usuario no encontrada.");
            }

            // Auto-create nutritionist profile to fix the issue
            try {
                nutritionist = await (this.prisma as any).nutritionist.create({
                    data: {
                        accountId: userId,
                        fullName: 'Nutricionista (Auto-generado)',
                        specialty: 'General',
                    }
                });
                console.log(`[togglePreference] Auto-created Nutritionist profile: ${nutritionist.id}`);
            } catch (createError) {
                console.error(`[togglePreference] Failed to auto-create profile:`, createError);
                throw new NotFoundException("No se pudo crear el perfil de nutricionista necesario.");
            }
        }

        // Verify ingredient exists
        const ingredient = await (this.prisma as any).ingredient.findUnique({
            where: { id: ingredientId },
        });

        if (!ingredient) {
            console.error(`[togglePreference] Ingredient not found: ${ingredientId}`);
            throw new NotFoundException("Ingrediente no encontrado.");
        }

        const { tags, ...rest } = data;
        const tagRecords = tags ? await this.getOrCreateTags(tags) : undefined;

        try {
            return await (this.prisma as any).ingredientPreference.upsert({
                where: {
                    nutritionistId_ingredientId: {
                        nutritionistId: nutritionist.id,
                        ingredientId,
                    },
                },
                update: {
                    ...rest,
                    ...(tagRecords ? {
                        tags: {
                            set: tagRecords.map(t => ({ id: t.id })),
                        },
                    } : {}),
                },
                create: {
                    nutritionistId: nutritionist.id,
                    ingredientId,
                    ...rest,
                    ...(tagRecords ? {
                        tags: {
                            connect: tagRecords.map(t => ({ id: t.id })),
                        },
                    } : {}),
                },
                include: { tags: true },
            });
        } catch (error) {
            console.error(`[togglePreference] Error upserting preference:`, error);
            throw error;
        }
    }

    async findOne(id: string) {
        return (this.prisma as any).ingredient.findUnique({
            where: { id },
            include: {
                brand: true,
                category: true,
                tags: true,
            },
        });
    }

    async update(id: string, updateFoodDto: UpdateFoodDto) {
        const { brand, category, tags, ...rest } = updateFoodDto;

        const brandRecord = brand ? await this.getOrCreateBrand(brand) : undefined;
        const categoryRecord = category ? await this.getOrCreateCategory(category) : undefined;
        const tagRecords = tags ? await this.getOrCreateTags(tags) : undefined;

        return (this.prisma as any).ingredient.update({
            where: { id },
            data: {
                ...rest,
                ...(brandRecord && { brand: { connect: { id: brandRecord.id } } }),
                ...(categoryRecord && { category: { connect: { id: categoryRecord.id } } }),
                ...(tagRecords && { tags: { set: tagRecords.map(t => ({ id: t.id })) } }),
            },
        });
    }

    remove(id: string) {
        return (this.prisma as any).ingredient.delete({
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
