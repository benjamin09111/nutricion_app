"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FoodsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodsService = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const XLSX = __importStar(require("xlsx"));
const cache_service_1 = require("../../common/services/cache.service");
let FoodsService = FoodsService_1 = class FoodsService {
    prisma;
    cacheService;
    draftMarker = '__NUTRI_DIET_DRAFT__';
    logger = new common_1.Logger(FoodsService_1.name);
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    normalizeText(value) {
        return (value ?? '')
            .trim()
            .replace(/\s+/g, ' ');
    }
    parseDraftIngredientField(rawValue) {
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
    buildDraftIngredientField(baseIngredients, isDraft) {
        const cleaned = typeof baseIngredients === 'string' ? baseIngredients.trim() : '';
        if (isDraft) {
            return cleaned
                ? `${this.draftMarker}\n${cleaned}`
                : this.draftMarker;
        }
        return cleaned || null;
    }
    buildNonDraftWhere() {
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
    resolveIngredientNotesForWrite(params) {
        const { cleanedIngredients, isDraft: existingIsDraft } = this.parseDraftIngredientField(params.existingIngredients);
        const nextIsDraft = typeof params.isDraft === 'boolean' ? params.isDraft : existingIsDraft;
        const nextIngredients = params.incomingIngredients !== undefined
            ? params.incomingIngredients
            : cleanedIngredients;
        return this.buildDraftIngredientField(nextIngredients, nextIsDraft);
    }
    serializeIngredient(ingredient, nutritionistId) {
        const { cleanedIngredients, isDraft } = this.parseDraftIngredientField(ingredient.ingredients);
        return {
            ...ingredient,
            ingredients: cleanedIngredients,
            isDraft,
            isMine: ingredient.nutritionistId === nutritionistId && !!nutritionistId,
        };
    }
    async resolveNutritionist(accountId) {
        if (!accountId)
            return null;
        return this.prisma.nutritionist.findUnique({
            where: { accountId },
        });
    }
    async findIngredientWithRelations(id, nutritionistId) {
        return this.prisma.ingredient.findUnique({
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
    assertIngredientOwnership(ingredient, nutritionistId) {
        if (!nutritionistId || ingredient.nutritionistId !== nutritionistId) {
            throw new common_1.ForbiddenException('No tienes permisos para modificar este ingrediente');
        }
    }
    async getOrCreateBrand(name) {
        if (!name)
            return null;
        const normalized = this.normalizeText(name);
        return this.prisma.ingredientBrand.upsert({
            where: { name: normalized },
            update: {},
            create: { name: normalized },
        });
    }
    async getOrCreateCategory(name) {
        const normalized = this.normalizeText(name);
        return this.prisma.ingredientCategory.upsert({
            where: { name: normalized },
            update: {},
            create: { name: normalized },
        });
    }
    async getOrCreateTags(names) {
        if (!names || names.length === 0)
            return [];
        const tags = [];
        for (const name of names) {
            const normalized = this.normalizeText(name);
            const tag = await this.prisma.tag.upsert({
                where: { name: normalized },
                update: {},
                create: { name: normalized },
            });
            tags.push(tag);
        }
        return tags;
    }
    async findDuplicateIngredient(params) {
        const normalizedName = this.normalizeText(params.name);
        return this.prisma.ingredient.findFirst({
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
    async invalidateFoodCaches(params) {
        const identifiers = Array.from(new Set([params.accountId, params.nutritionistId].filter(Boolean)));
        if (identifiers.length === 0)
            return;
        const prefixes = params.includeDashboard
            ? ['foods', 'dashboard']
            : ['foods'];
        await Promise.all(identifiers.flatMap((identifier) => prefixes.map((prefix) => this.cacheService.invalidateNutritionistPrefix(identifier, prefix))));
    }
    async create(createFoodDto, userId) {
        const { brand, category, tags, isPublic, isDraft, ingredients, ...rest } = createFoodDto;
        const normalizedName = this.normalizeText(rest.name);
        const nutritionist = await this.prisma.nutritionist.findUnique({
            where: { accountId: userId },
        });
        if (!nutritionist) {
            throw new Error("Nutritionist profile required to create ingredients. Please ensure you are logged in as a Nutritionist.");
        }
        const brandRecord = await this.getOrCreateBrand(brand);
        const categoryRecord = await this.getOrCreateCategory(category);
        const tagRecords = await this.getOrCreateTags(tags);
        const existing = await this.findDuplicateIngredient({
            name: normalizedName,
            brandId: brandRecord?.id ?? null,
        });
        if (existing) {
            throw new Error(`Ya existe un alimento llamado '${normalizedName}' para esa marca.`);
        }
        const ingredient = await this.prisma.$transaction(async (tx) => {
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
    async findAll(params) {
        const { nutritionistAccountId, search, category, tag, tab = 'all', page = 1, limit = 20 } = params;
        const nutritionist = await this.resolveNutritionist(nutritionistAccountId);
        const nutritionistId = nutritionist?.id;
        const shouldDebug = tab === 'favorites' ||
            tab === 'not_recommended' ||
            tab === 'tagged' ||
            tab === 'mine' ||
            tab === 'drafts';
        if (shouldDebug) {
            this.logger.log(`[findAll] tab=${tab} accountId=${nutritionistAccountId ?? 'none'} nutritionistId=${nutritionistId ?? 'none'} search=${search ?? '-'} category=${category ?? '-'} tag=${tag ?? '-'} page=${page} limit=${limit}`);
        }
        const andClauses = [];
        let preferenceIngredientIds = [];
        switch (tab) {
            case 'drafts':
                if (!nutritionistId)
                    return [];
                andClauses.push({ nutritionistId });
                andClauses.push({
                    ingredients: {
                        contains: this.draftMarker,
                    },
                });
                break;
            case 'mine':
            case 'created':
                if (!nutritionistId)
                    return [];
                andClauses.push({ nutritionistId });
                andClauses.push(this.buildNonDraftWhere());
                break;
            case 'favorites':
                if (!nutritionistId)
                    return [];
                preferenceIngredientIds = (await this.prisma.ingredientPreference.findMany({
                    where: {
                        nutritionistId,
                        isFavorite: true,
                        isHidden: false,
                    },
                    select: { ingredientId: true },
                })).map((preference) => preference.ingredientId);
                if (shouldDebug) {
                    this.logger.log(`[findAll] tab=favorites preferenceIds=${JSON.stringify(preferenceIngredientIds.slice(0, 20))} total=${preferenceIngredientIds.length}`);
                }
                if (preferenceIngredientIds.length === 0)
                    return [];
                andClauses.push({ id: { in: preferenceIngredientIds } });
                andClauses.push(this.buildNonDraftWhere());
                break;
            case 'not_recommended':
                if (!nutritionistId)
                    return [];
                preferenceIngredientIds = (await this.prisma.ingredientPreference.findMany({
                    where: {
                        nutritionistId,
                        isNotRecommended: true,
                        isHidden: false,
                    },
                    select: { ingredientId: true },
                })).map((preference) => preference.ingredientId);
                if (shouldDebug) {
                    this.logger.log(`[findAll] tab=not_recommended preferenceIds=${JSON.stringify(preferenceIngredientIds.slice(0, 20))} total=${preferenceIngredientIds.length}`);
                }
                if (preferenceIngredientIds.length === 0)
                    return [];
                andClauses.push({ id: { in: preferenceIngredientIds } });
                andClauses.push(this.buildNonDraftWhere());
                break;
            case 'tagged':
                if (!nutritionistId)
                    return [];
                preferenceIngredientIds = (await this.prisma.ingredientPreference.findMany({
                    where: {
                        nutritionistId,
                        isHidden: false,
                        tags: { some: {} },
                    },
                    select: { ingredientId: true },
                })).map((preference) => preference.ingredientId);
                if (shouldDebug) {
                    this.logger.log(`[findAll] tab=tagged personalPreferenceIds=${JSON.stringify(preferenceIngredientIds.slice(0, 20))} total=${preferenceIngredientIds.length}`);
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
                andClauses.push(nutritionistId
                    ? {
                        OR: [{ isPublic: true }, { nutritionistId }],
                    }
                    : { isPublic: true });
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
                    { tags: { some: { name: { equals: tag, mode: client_1.Prisma.QueryMode.insensitive } } } },
                    ...(nutritionistId
                        ? [{
                                preferences: {
                                    some: {
                                        nutritionistId,
                                        tags: { some: { name: { equals: tag, mode: client_1.Prisma.QueryMode.insensitive } } },
                                    },
                                },
                            }]
                        : []),
                ],
            });
        }
        if (nutritionistId) {
            andClauses.push({
                preferences: {
                    none: {
                        nutritionistId,
                        isHidden: true,
                    },
                },
            });
        }
        const whereClause = andClauses.length > 0 ? { AND: andClauses } : {};
        const ingredients = await this.prisma.ingredient.findMany({
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
        if (shouldDebug) {
            const sample = ingredients.slice(0, 5).map((ingredient) => ({
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
            this.logger.log(`[findAll] tab=${tab} results=${ingredients.length} sample=${JSON.stringify(sample)}`);
        }
        return ingredients.map((ing) => this.serializeIngredient(ing, nutritionistId));
    }
    async togglePreference(ingredientId, userId, data) {
        this.logger.log(`[togglePreference] accountId=${userId} ingredientId=${ingredientId} payload=${JSON.stringify(data)}`);
        let nutritionist = await this.prisma.nutritionist.findUnique({
            where: { accountId: userId },
        });
        if (!nutritionist) {
            this.logger.warn(`[togglePreference] Missing nutritionist profile for accountId=${userId}. Attempting auto-creation.`);
            const account = await this.prisma.account.findUnique({
                where: { id: userId }
            });
            if (!account) {
                this.logger.error(`[togglePreference] Account not found accountId=${userId}`);
                throw new common_1.NotFoundException("Cuenta de usuario no encontrada.");
            }
            try {
                nutritionist = await this.prisma.nutritionist.create({
                    data: {
                        accountId: userId,
                        fullName: 'Nutricionista (Auto-generado)',
                        specialty: 'General',
                    }
                });
                this.logger.warn(`[togglePreference] Auto-created nutritionistId=${nutritionist.id} for accountId=${userId}`);
            }
            catch (createError) {
                this.logger.error(`[togglePreference] Failed auto-create for accountId=${userId}`, createError);
                throw new common_1.NotFoundException("No se pudo crear el perfil de nutricionista necesario.");
            }
        }
        const ingredient = await this.prisma.ingredient.findUnique({
            where: { id: ingredientId },
        });
        if (!ingredient) {
            this.logger.error(`[togglePreference] Ingredient not found ingredientId=${ingredientId}`);
            throw new common_1.NotFoundException("Ingrediente no encontrado.");
        }
        const { tags, ...rest } = data;
        const tagRecords = tags ? await this.getOrCreateTags(tags) : undefined;
        try {
            const preference = await this.prisma.ingredientPreference.upsert({
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
            this.logger.log(`[togglePreference] saved nutritionistId=${nutritionist.id} ingredientId=${ingredientId} result=${JSON.stringify({
                id: preference.id,
                isFavorite: preference.isFavorite,
                isNotRecommended: preference.isNotRecommended,
                isHidden: preference.isHidden,
                tagCount: preference.tags?.length ?? 0,
            })}`);
            return preference;
        }
        catch (error) {
            this.logger.error(`[togglePreference] Error upserting ingredientId=${ingredientId}`, error);
            throw error;
        }
    }
    async findOne(id, requesterAccountId) {
        const nutritionist = await this.resolveNutritionist(requesterAccountId);
        const nutritionistId = nutritionist?.id;
        const ingredient = await this.findIngredientWithRelations(id, nutritionistId);
        if (!ingredient) {
            throw new common_1.NotFoundException('Ingrediente no encontrado');
        }
        const canAccess = ingredient.isPublic ||
            (nutritionistId ? ingredient.nutritionistId === nutritionistId : false);
        if (!canAccess) {
            throw new common_1.ForbiddenException('No tienes permisos para ver este ingrediente');
        }
        return this.serializeIngredient(ingredient, nutritionistId);
    }
    async update(id, updateFoodDto, requesterAccountId) {
        const nutritionist = await this.resolveNutritionist(requesterAccountId);
        const nutritionistId = nutritionist?.id;
        const existing = await this.prisma.ingredient.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('Ingrediente no encontrado');
        }
        this.assertIngredientOwnership(existing, nutritionistId);
        const { brand, category, tags, ingredients, isDraft, ...rest } = updateFoodDto;
        const normalizedName = rest.name !== undefined ? this.normalizeText(rest.name) : this.normalizeText(existing.name);
        const brandRecord = brand ? await this.getOrCreateBrand(brand) : undefined;
        const categoryRecord = category ? await this.getOrCreateCategory(category) : undefined;
        const tagRecords = tags ? await this.getOrCreateTags(tags) : undefined;
        const finalBrandId = brand !== undefined ? (brandRecord?.id ?? null) : (existing.brandId ?? null);
        const duplicate = await this.findDuplicateIngredient({
            name: normalizedName,
            brandId: finalBrandId,
            excludeIngredientId: existing.id,
        });
        if (duplicate) {
            throw new Error(`Ya existe un alimento llamado '${normalizedName}' para esa marca.`);
        }
        const ingredient = await this.prisma.ingredient.update({
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
    async remove(id, requesterAccountId) {
        const nutritionist = await this.resolveNutritionist(requesterAccountId);
        const nutritionistId = nutritionist?.id;
        const ingredient = await this.prisma.ingredient.findUnique({ where: { id } });
        if (!ingredient) {
            throw new common_1.NotFoundException('Ingrediente no encontrado');
        }
        this.assertIngredientOwnership(ingredient, nutritionistId);
        const result = await this.prisma.ingredient.delete({
            where: { id },
        });
        await this.invalidateFoodCaches({
            accountId: requesterAccountId,
            nutritionistId: ingredient.nutritionistId,
            includeDashboard: true,
        });
        return result;
    }
    async getMarketPrices(limit = 7) {
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
            const headers = jsonData[0];
            const rows = jsonData.slice(1, limit + 1);
            return rows.map(row => {
                const record = {};
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
        }
        catch (error) {
            console.error('Error reading market prices:', error);
            return [];
        }
    }
};
exports.FoodsService = FoodsService;
exports.FoodsService = FoodsService = FoodsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], FoodsService);
//# sourceMappingURL=foods.service.js.map