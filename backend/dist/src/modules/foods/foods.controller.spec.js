"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const core_1 = require("@nestjs/core");
const cache_manager_1 = require("@nestjs/cache-manager");
const foods_controller_1 = require("./foods.controller");
const foods_service_1 = require("./foods.service");
describe('FoodsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [foods_controller_1.FoodsController],
            providers: [
                {
                    provide: foods_service_1.FoodsService,
                    useValue: {},
                },
                {
                    provide: cache_manager_1.CACHE_MANAGER,
                    useValue: {},
                },
                {
                    provide: core_1.Reflector,
                    useValue: {
                        get: jest.fn(),
                    },
                },
            ],
        }).compile();
        controller = module.get(foods_controller_1.FoodsController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=foods.controller.spec.js.map