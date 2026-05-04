"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const metrics_controller_1 = require("./metrics.controller");
describe('MetricsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [metrics_controller_1.MetricsController],
        }).compile();
        controller = module.get(metrics_controller_1.MetricsController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=metrics.controller.spec.js.map