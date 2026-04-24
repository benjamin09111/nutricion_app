import { Prisma } from '@prisma/client';
import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { PrismaService } from '../../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { MarketPriceDto } from './dto/market-price.dto';

import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class FoodsService {
    private readonly draftMarker = '__NUTRI_DIET_DRAFT__';
    private readonly logger = new Logger(FoodsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheService: CacheService
    ) { }

    private normalizeText(value?: string | null) {
        return (value ?? '')
            .trim()
            .replace(/\s+/g, ' ');
    }

    private parseDraftIngredientField(rawValue?: string | null) {
        const value = typeof rawValue === 'string' ? rawValue : '';
        const isDraft = value.includes(this.draftMarker);
        const cleaned = value
            .replace(this.draftMarker, '')
            .trim();

        return {
            isDraft,
            cleanedIngredients: cleaned || null,
        };
    }

    private buildDraftIngredientField(
        baseIngredients?: string | null,
        isDraft?: boolean,
    ) {
        const cleaned = typeof baseIngredients === 'string' ? baseIngredients.trim() : '';

        if (isDraft) {
            return cleaned
                ? `${this.draftMarker}\n${cleaned}`
                : this.draftMarker;
        }

        return cleaned || null;
    }

    private buildNonDraftWhere(): Prisma.IngredientWhereInput {
        return {
            OR: [
                { ingredients: null },
                {
                    NOT: {
                        ingredients: {
                            contains: this.draftMarker,
                        },
                    },
                },
            ],
        };
    }

    private resolveIngredientNotesForWrite(params: {
        existingIngredients?: string | null;
        incomingIngredients?: string | null;
        isDraft?: boolean;
    }) {
        const { cleanedIngredients, isDraft: existingIsDraft } = this.parseDraftIngredientField(
            params.existingIngredients,
        );

        const nextIsDraft =
            typeof params.isDraft === 'boolean' ? params.isDraft : existingIsDraft;
        const nextIngredients =
            params.incomingIngredients !== undefined
                ? params.incomingIngredients
                : cleanedIngredients;

        return this.buildDraftIngredientField(nextIngredients, nextIsDraft);
    }

    private serializeIngredient(ingredient: any, nutritionistId?: string) {
        const { cleanedIngredients, isDraft } = this.parseDraftIngredientField(
            ingredient.ingredients,
        );

        return {
            ...ingredient,
            ingredients: cleanedIngredients,
            isDraft,
            isMine: ingredient.nutritionistId === nutritionistId && !!nutritionistId,
        };
    }

    private async resolveNutritionist(accountId?: string) {
        if (!accountId) return null;
        return (this.prisma as any).nutritionist.findUnique({
            where: { accountId },
        });
    }

    private async findIngredientWithRelations(id: string, nutritionistId?: string) {
        return (this.prisma as any).ingredient.findUnique({
            where: { id },
            include: {
                brand: true,
                category: true,
                tags: true,
                ...(nutritionistId
                    ? {
                        preferences: {
                            where: { nutritionistId },
                            include: { tags: true },
                        },
                    }
                    : {}),
            },
        });
    }

    private assertIngredientOwnership(ingredient: any, nutritionistId?: string) {
        if (!nutritionistId || ingredient.nutritionistId !== nutritionistId) {
            throw new ForbiddenException('No tienes permisos para modificar este ingrediente');
        }
    }

    private async getOrCreateBrand(name?: string) {
        if (!name) return null;
        const normalized = this.normalizeText(name);
        return (this.prisma as any).ingredientBrand.upsert({
            where: { name: normalized },
            update: {},
            create: { name: normalized },
        });
    }

    private async getOrCreateCategory(name: string) {
        const normalized = this.normalizeText(name);
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
            const normalized = this.normalizeText(name);
            const tag = await (this.prisma as any).tag.upsert({
                where: { name: normalized },
                update: {},
                create: { name: normalized },
            });
            tags.push(tag);
        }
        return tags;
    }

    private async findDuplicateIngredient(params: {
        name: string;
        brandId?: string | null;
        excludeIngredientId?: string;
    }) {
        const normalizedName = this.normalizeText(params.name);

        return (this.prisma as any).ingredient.findFirst({
            where: {
                ...(params.excludeIngredientId ? { id: { not: params.excludeIngredientId } } : {}),
                name: {
                    equals: normalizedName,
                    mode: 'insensitive',
                },
                ...(params.brandId ? { brandId: params.brandId } : { brandId: null }),
            },
            select: {
                id: true,
                name: true,
            },
        });
    }

    private async invalidateFoodCaches(params: {
        accountId?: string | null;
        nutritionistId?: string | null;
        includeDashboard?: boolean;
    }) {
        const identifiers = Array.from(
            new Set([params.accountId, params.nutritionistId].filter(Boolean)),
        ) as string[];

        if (identifiers.length === 0) return;

        const prefixes = params.includeDashboard
            ? ['foods', 'dashboard']
            : ['foods'];

        await Promise.all(
            identifiers.flatMap((identifier) =>
                prefixes.map((prefix) =>
                    this.cacheService.invalidateNutritionistPrefix(identifier, prefix),
                ),
            ),
        );
    }

    async create(createFoodDto: CreateFoodDto, userId: string) {
        const { brand, category, tags, isPublic, isDraft, ingredients, ...rest } = createFoodDto;
        const normalizedName = this.normalizeText(rest.name);

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

        // Check for duplicates (Name + Brand), also when no brand exists.
        const existing = await this.findDuplicateIngredient({
            name: normalizedName,
            brandId: brandRecord?.id ?? null,
        });
        if (existing) {
            throw new Error(`Ya existe un alimento llamado '${normalizedName}' para esa marca.`);
        }

        const ingredient = await (this.prisma as any).$transaction(async (tx: any) => {
            const ingredient = await tx.ingredient.create({
                data: {
                    ...rest,
                    name: normalizedName,
                    ingredients: this.buildDraftIngredientField(ingredients, isDraft),
                    brand: brandRecord ? { connect: { id: brandRecord.id } } : undefined,
                    category: { connect: { id: categoryRecord.id } },
                    tags: {
                        connect: tagRecords.map(t => ({ id: t.id })),
                    },
                    isPublic: isPublic ?? false,
                    verified: false,
                    nutritionist: { connect: { id: nutritionist.id } },
                },
                include: {
                    brand: true,
                    category: true,
                    tags: true,
                },
            });

            return ingredient;
        });

        await this.invalidateFoodCaches({
            accountId: userId,
            nutritionistId: nutritionist.id,
            includeDashboard: true,
        });
        return this.serializeIngredient(ingredient, nutritionist.id);
    }

    async findAll(params: {
        nutritionistAccountId?: string;
        search?: string;
        category?: string;
        tag?: string;
        tab?: string;
        page?: number;
        limit?: number;
    }) {
        const { nutritionistAccountId, search, category, tag, tab = 'all', page = 1, limit = 20 } = params;

        const nutritionist = await this.resolveNutritionist(nutritionistAccountId);
        const nutritionistId = nutritionist?.id;
        const shouldDebug =
            tab === 'favorites' ||
            tab === 'not_recommended' ||
            tab === 'tagged' ||
            tab === 'mine' ||
            tab === 'drafts';

        if (shouldDebug) {
            this.logger.log(
                `[findAll] tab=${tab} accountId=${nutritionistAccountId ?? 'none'} nutritionistId=${nutritionistId ?? 'none'} search=${search ?? '-'} category=${category ?? '-'} tag=${tag ?? '-'} page=${page} limit=${limit}`,
            );
        }

        const andClauses: Prisma.IngredientWhereInput[] = [];
        let preferenceIngredientIds: string[] = [];

        switch (tab) {
            case 'drafts':
                if (!nutritionistId) return [];
                andClauses.push({ nutritionistId });
                andClauses.push({
                    ingredients: {
                        contains: this.draftMarker,
                    },
                });
                break;
            case 'mine':
            case 'created':
                if (!nutritionistId) return [];
                andClauses.push({ nutritionistId });
                andClauses.push(this.buildNonDraftWhere());
                break;
            case 'favorites':
                if (!nutritionistId) return [];
                preferenceIngredientIds = (
                    await (this.prisma as any).ingredientPreference.findMany({
                        where: {
                            nutritionistId,
                            isFavorite: true,
                            isHidden: false,
                        },
                        select: { ingredientId: true },
                    })
                ).map((preference: { ingredientId: string }) => preference.ingredientId);
                if (shouldDebug) {
                    this.logger.log(
                        `[findAll] tab=favorites preferenceIds=${JSON.stringify(preferenceIngredientIds.slice(0, 20))} total=${preferenceIngredientIds.length}`,
                    );
                }
                if (preferenceIngredientIds.length === 0) return [];
                andClauses.push({ id: { in: preferenceIngredientIds } });
                andClauses.push(this.buildNonDraftWhere());
                break;
            case 'not_recommended':
                if (!nutritionistId) return [];
                preferenceIngredientIds = (
                    await (this.prisma as any).ingredientPreference.findMany({
                        where: {
                            nutritionistId,
                            isNotRecommended: true,
                            isHidden: false,
                        },
                        select: { ingredientId: true },
                    })
                ).map((preference: { ingredientId: string }) => preference.ingredientId);
                if (shouldDebug) {
                    this.logger.log(
                        `[findAll] tab=not_recommended preferenceIds=${JSON.stringify(preferenceIngredientIds.slice(0, 20))} total=${preferenceIngredientIds.length}`,
                    );
                }
                if (preferenceIngredientIds.length === 0) return [];
                andClauses.push({ id: { in: preferenceIngredientIds } });
                andClauses.push(this.buildNonDraftWhere());
                break;
            case 'tagged':
                if (!nutritionistId) return [];
                preferenceIngredientIds = (
                    await (this.prisma as any).ingredientPreference.findMany({
                        where: {
                            nutritionistId,
                            isHidden: false,
                            tags: { some: {} },
                        },
                        select: { ingredientId: true },
                    })
                ).map((preference: { ingredientId: string }) => preference.ingredientId);
                if (shouldDebug) {
                    this.logger.log(
                        `[findAll] tab=tagged personalPreferenceIds=${JSON.stringify(preferenceIngredientIds.slice(0, 20))} total=${preferenceIngredientIds.length}`,
                    );
                }
                andClauses.push({
                    OR: [
                        { tags: { some: {} } },
                        ...(preferenceIngredientIds.length > 0
                            ? [{ id: { in: preferenceIngredientIds } }]
                            : []),
                    ],
                });
                andClauses.push(this.buildNonDraftWhere());
                break;
            case 'app':
                andClauses.push({
                    verified: true,
                    isPublic: true,
                });
                break;
            case 'community':
                andClauses.push({
                    verified: false,
                    isPublic: true,
                    nutritionistId: { not: null },
                });
                if (nutritionistId) {
                    andClauses.push({
                        nutritionistId: { not: nutritionistId },
                    });
                }
                break;
            default:
                andClauses.push(
                    nutritionistId
                        ? {
                            OR: [{ isPublic: true }, { nutritionistId }],
                        }
                        : { isPublic: true },
                );
                andClauses.push(this.buildNonDraftWhere());
                break;
        }

        if (search) {
            andClauses.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { brand: { name: { contains: search, mode: 'insensitive' } } },
                ],
            });
        }

        if (category && category !== 'Todos') {
            andClauses.push({
                category: {
                    name: { contains: category, mode: 'insensitive' },
                },
            });
        }

        if (tag && tag !== 'Todos') {
            andClauses.push({
                OR: [
                    { tags: { some: { name: { equals: tag, mode: Prisma.QueryMode.insensitive } } } },
                    ...(nutritionistId
                        ? [{
                            preferences: {
                                some: {
                                    nutritionistId,
                                    tags: { some: { name: { equals: tag, mode: Prisma.QueryMode.insensitive } } },
                                },
                            },
                        }]
                        : []),
                ],
            });
        }

        if (nutritionistId) {
            andClauses.push(
                {
                    preferences: {
                        none: {
                            nutritionistId,
                            isHidden: true,
                        },
                    },
                },
            );
        }

        const whereClause: Prisma.IngredientWhereInput =
            andClauses.length > 0 ? { AND: andClauses } : {};

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

        const dedupedIngredients: any[] = [];
        const seenIngredientKeys = new Set<string>();

        for (const ingredient of ingredients) {
            const key = `${this.normalizeText(ingredient.name).toLowerCase()}::${ingredient.brandId ?? ''}`;
            if (seenIngredientKeys.has(key)) {
                continue;
            }
            seenIngredientKeys.add(key);
            dedupedIngredients.push(ingredient);
        }

        if (shouldDebug) {
            const sample = dedupedIngredients.slice(0, 5).map((ingredient: any) => ({
                id: ingredient.id,
                name: ingredient.name,
                preference: ingredient.preferences?.[0]
                    ? {
                        isFavorite: ingredient.preferences[0].isFavorite,
                        isNotRecommended: ingredient.preferences[0].isNotRecommended,
                        isHidden: ingredient.preferences[0].isHidden,
                        tagCount: ingredient.preferences[0].tags?.length ?? 0,
                    }
                    : null,
                globalTagCount: ingredient.tags?.length ?? 0,
            }));

            this.logger.log(
                `[findAll] tab=${tab} results=${dedupedIngredients.length} sample=${JSON.stringify(sample)}`,
            );
        }

        // Add isMine property to each ingredient
        return dedupedIngredients.map((ing: any) => this.serializeIngredient(ing, nutritionistId));
    }

    async togglePreference(ingredientId: string, userId: string, data: {
        isFavorite?: boolean;
        isNotRecommended?: boolean;
        isHidden?: boolean;
        tags?: string[];
    }) {
        this.logger.log(
            `[togglePreference] accountId=${userId} ingredientId=${ingredientId} payload=${JSON.stringify(data)}`,
        );
        let nutritionist = await (this.prisma as any).nutritionist.findUnique({
            where: { accountId: userId },
        });

        if (!nutritionist) {
            this.logger.warn(
                `[togglePreference] Missing nutritionist profile for accountId=${userId}. Attempting auto-creation.`,
            );

            // Check if account exists first
            const account = await (this.prisma as any).account.findUnique({
                where: { id: userId }
            });

            if (!account) {
                this.logger.error(`[togglePreference] Account not found accountId=${userId}`);
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
                this.logger.warn(
                    `[togglePreference] Auto-created nutritionistId=${nutritionist.id} for accountId=${userId}`,
                );
            } catch (createError) {
                this.logger.error(`[togglePreference] Failed auto-create for accountId=${userId}`, createError as any);
                throw new NotFoundException("No se pudo crear el perfil de nutricionista necesario.");
            }
        }

        // Verify ingredient exists
        const ingredient = await (this.prisma as any).ingredient.findUnique({
            where: { id: ingredientId },
        });

        if (!ingredient) {
            this.logger.error(`[togglePreference] Ingredient not found ingredientId=${ingredientId}`);
            throw new NotFoundException("Ingrediente no encontrado.");
        }

        const { tags, ...rest } = data;
        const tagRecords = tags ? await this.getOrCreateTags(tags) : undefined;

        try {
            const preference = await (this.prisma as any).ingredientPreference.upsert({
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

            await this.invalidateFoodCaches({
                accountId: userId,
                nutritionistId: nutritionist.id,
                includeDashboard: true,
            });
            this.logger.log(
                `[togglePreference] saved nutritionistId=${nutritionist.id} ingredientId=${ingredientId} result=${JSON.stringify({
                    id: preference.id,
                    isFavorite: preference.isFavorite,
                    isNotRecommended: preference.isNotRecommended,
                    isHidden: preference.isHidden,
                    tagCount: preference.tags?.length ?? 0,
                })}`,
            );
            return preference;
        } catch (error) {
            this.logger.error(`[togglePreference] Error upserting ingredientId=${ingredientId}`, error as any);
            throw error;
        }
    }

    async findOne(id: string, requesterAccountId: string) {
        const nutritionist = await this.resolveNutritionist(requesterAccountId);
        const nutritionistId = nutritionist?.id;
        const ingredient = await this.findIngredientWithRelations(id, nutritionistId);

        if (!ingredient) {
            throw new NotFoundException('Ingrediente no encontrado');
        }

        const canAccess =
            ingredient.isPublic ||
            (nutritionistId ? ingredient.nutritionistId === nutritionistId : false);

        if (!canAccess) {
            throw new ForbiddenException('No tienes permisos para ver este ingrediente');
        }

        return this.serializeIngredient(ingredient, nutritionistId);
    }

    async update(id: string, updateFoodDto: UpdateFoodDto, requesterAccountId: string) {
        const nutritionist = await this.resolveNutritionist(requesterAccountId);
        const nutritionistId = nutritionist?.id;
        const existing = await (this.prisma as any).ingredient.findUnique({ where: { id } });

        if (!existing) {
            throw new NotFoundException('Ingrediente no encontrado');
        }

        this.assertIngredientOwnership(existing, nutritionistId);

        const { brand, category, tags, ingredients, isDraft, ...rest } = updateFoodDto;
        const normalizedName =
            rest.name !== undefined ? this.normalizeText(rest.name) : this.normalizeText(existing.name);

        const brandRecord = brand ? await this.getOrCreateBrand(brand) : undefined;
        const categoryRecord = category ? await this.getOrCreateCategory(category) : undefined;
        const tagRecords = tags ? await this.getOrCreateTags(tags) : undefined;
        const finalBrandId =
            brand !== undefined ? (brandRecord?.id ?? null) : (existing.brandId ?? null);

        const duplicate = await this.findDuplicateIngredient({
            name: normalizedName,
            brandId: finalBrandId,
            excludeIngredientId: existing.id,
        });
        if (duplicate) {
            throw new Error(`Ya existe un alimento llamado '${normalizedName}' para esa marca.`);
        }

        const ingredient = await (this.prisma as any).ingredient.update({
            where: { id },
            data: {
                ...rest,
                ...(rest.name !== undefined ? { name: normalizedName } : {}),
                ingredients: this.resolveIngredientNotesForWrite({
                    existingIngredients: existing.ingredients,
                    incomingIngredients: ingredients,
                    isDraft,
                }),
                ...(brandRecord && { brand: { connect: { id: brandRecord.id } } }),
                ...(categoryRecord && { category: { connect: { id: categoryRecord.id } } }),
                ...(tagRecords && { tags: { set: tagRecords.map(t => ({ id: t.id })) } }),
            },
            include: {
                brand: true,
                category: true,
                tags: true,
                ...(nutritionistId
                    ? {
                        preferences: {
                            where: { nutritionistId },
                            include: { tags: true },
                        },
                    }
                    : {}),
            },
        });

        await this.invalidateFoodCaches({
            accountId: requesterAccountId,
            nutritionistId: existing.nutritionistId,
            includeDashboard: true,
        });
        return this.serializeIngredient(ingredient, nutritionistId);
    }

    async remove(id: string, requesterAccountId: string) {
        const nutritionist = await this.resolveNutritionist(requesterAccountId);
        const nutritionistId = nutritionist?.id;
        const ingredient = await (this.prisma as any).ingredient.findUnique({ where: { id } });

        if (!ingredient) {
            throw new NotFoundException('Ingrediente no encontrado');
        }

        this.assertIngredientOwnership(ingredient, nutritionistId);

        const result = await (this.prisma as any).ingredient.delete({
            where: { id },
        });
        await this.invalidateFoodCaches({
            accountId: requesterAccountId,
            nutritionistId: ingredient.nutritionistId,
            includeDashboard: true,
        });
        return result;
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
