"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngredientGroupsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let IngredientGroupsService = class IngredientGroupsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getNutritionistId(accountId) {
        const nutritionist = await this.prisma.nutritionist.findUnique({
            where: { accountId },
            select: { id: true }
        });
        if (!nutritionist)
            throw new common_1.NotFoundException('Nutritionist profile not found');
        return nutritionist.id;
    }
    async create(accountId, createDto) {
        const nutritionistId = await this.getNutritionistId(accountId);
        const { tags, ingredients, ...data } = createDto;
        const tagRecords = tags && tags.length > 0
            ? await Promise.all(tags.map((name) => this.getOrCreateTag(name)))
            : [];
        return this.prisma.ingredientGroup.create({
            data: {
                ...data,
                nutritionist: { connect: { id: nutritionistId } },
                tags: {
                    connect: tagRecords.map((t) => ({ id: t.id }))
                },
                entries: ingredients ? {
                    create: ingredients.map(ing => ({
                        ingredientId: ing.id,
                        brandSuggestion: ing.brandSuggestion,
                        amount: ing.amount,
                        unit: ing.unit
                    }))
                } : undefined
            },
            include: {
                tags: true,
                entries: {
                    include: {
                        ingredient: { select: { id: true, name: true, brand: true } }
                    }
                },
                _count: { select: { entries: true } }
            }
        });
    }
    async findAll(accountId) {
        const nutritionistId = await this.getNutritionistId(accountId);
        return this.prisma.ingredientGroup.findMany({
            where: {
                nutritionistId
            },
            include: {
                tags: true,
                _count: { select: { entries: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }
    async findOne(id, accountId) {
        const nutritionistId = await this.getNutritionistId(accountId);
        const group = await this.prisma.ingredientGroup.findUnique({
            where: { id },
            include: {
                tags: true,
                entries: {
                    include: {
                        ingredient: {
                            include: {
                                brand: true,
                                category: true,
                                tags: true,
                                preferences: {
                                    where: { nutritionistId }
                                }
                            }
                        }
                    }
                },
                nutritionist: { select: { id: true } }
            }
        });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        if (group.nutritionistId !== nutritionistId)
            throw new common_1.ForbiddenException('Access denied');
        return {
            ...group,
            ingredients: group.entries.map(entry => ({
                ...entry.ingredient,
                brandSuggestion: entry.brandSuggestion,
                amount: entry.amount,
                unit: entry.unit,
                entryId: entry.id
            }))
        };
    }
    async update(id, accountId, updateDto) {
        const nutritionistId = await this.getNutritionistId(accountId);
        await this.findOne(id, accountId);
        const { tags, ingredients, ...data } = updateDto;
        const tagRecords = tags
            ? await Promise.all(tags.map(name => this.getOrCreateTag(name)))
            : undefined;
        const updateData = { ...data };
        if (tags) {
            updateData.tags = {
                set: tagRecords?.map((t) => ({ id: t.id }))
            };
        }
        if (ingredients) {
            updateData.entries = {
                deleteMany: {},
                create: ingredients.map(ing => ({
                    ingredientId: ing.id,
                    brandSuggestion: ing.brandSuggestion,
                    amount: ing.amount,
                    unit: ing.unit
                }))
            };
        }
        return this.prisma.ingredientGroup.update({
            where: { id },
            data: updateData,
            include: { tags: true }
        });
    }
    async remove(id, accountId) {
        const nutritionistId = await this.getNutritionistId(accountId);
        await this.findOne(id, accountId);
        return this.prisma.ingredientGroup.delete({ where: { id } });
    }
    async addIngredients(id, accountId, dto) {
        const nutritionistId = await this.getNutritionistId(accountId);
        await this.findOne(id, accountId);
        return this.prisma.ingredientGroup.update({
            where: { id },
            data: {
                entries: {
                    create: dto.ingredientIds.map(ingId => ({
                        ingredientId: ingId
                    }))
                }
            },
            include: { _count: { select: { entries: true } } }
        });
    }
    async removeIngredients(id, accountId, dto) {
        const nutritionistId = await this.getNutritionistId(accountId);
        await this.findOne(id, accountId);
        return this.prisma.ingredientGroup.update({
            where: { id },
            data: {
                entries: {
                    deleteMany: {
                        ingredientId: { in: dto.ingredientIds }
                    }
                }
            },
            include: { _count: { select: { entries: true } } }
        });
    }
    async getOrCreateTag(name) {
        return this.prisma.tag.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
};
exports.IngredientGroupsService = IngredientGroupsService;
exports.IngredientGroupsService = IngredientGroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IngredientGroupsService);
//# sourceMappingURL=ingredient-groups.service.js.map