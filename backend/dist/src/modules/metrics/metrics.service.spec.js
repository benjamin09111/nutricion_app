"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const metrics_service_1 = require("./metrics.service");
describe('MetricsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [metrics_service_1.MetricsService],
        }).compile();
        service = module.get(metrics_service_1.MetricsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=metrics.service.spec.js.map