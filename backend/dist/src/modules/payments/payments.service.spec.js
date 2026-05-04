"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const payments_service_1 = require("./payments.service");
describe('PaymentsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [payments_service_1.PaymentsService],
        }).compile();
        service = module.get(payments_service_1.PaymentsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=payments.service.spec.js.map