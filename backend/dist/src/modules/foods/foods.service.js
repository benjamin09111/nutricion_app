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
exports.FoodsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let FoodsService = class FoodsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createFoodDto, nutritionistId) {
        const isPublic = createFoodDto.isPublic ?? false;
        return this.prisma.food.create({
            data: {
                ...createFoodDto,
                nutritionistId: isPublic ? null : nutritionistId,
                isPublic: isPublic,
            },
        });
    }
    async findAll(params) {
        const { nutritionistId, search, category, page = 1, limit = 20 } = params;
        const whereClause = {
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
        if (nutritionistId) {
            return foods.filter((f) => !f.preferences?.[0]?.isHidden);
        }
        return foods;
    }
    async findOne(id) {
        return this.prisma.food.findUnique({
            where: { id },
        });
    }
    update(id, updateFoodDto) {
        return this.prisma.food.update({
            where: { id },
            data: updateFoodDto,
        });
    }
    remove(id) {
        return this.prisma.food.delete({
            where: { id },
        });
    }
};
exports.FoodsService = FoodsService;
exports.FoodsService = FoodsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FoodsService);
//# sourceMappingURL=foods.service.js.map