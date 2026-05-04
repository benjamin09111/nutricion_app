"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const foods_service_1 = require("./foods.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const cache_service_1 = require("../../common/services/cache.service");
describe('FoodsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                foods_service_1.FoodsService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {},
                },
                {
                    provide: cache_service_1.CacheService,
                    useValue: {
                        invalidateNutritionistPrefix: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(foods_service_1.FoodsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=foods.service.spec.js.map