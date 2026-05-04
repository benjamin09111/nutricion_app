"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const substitutes_service_1 = require("./substitutes.service");
describe('SubstitutesService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [substitutes_service_1.SubstitutesService],
        }).compile();
        service = module.get(substitutes_service_1.SubstitutesService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=substitutes.service.spec.js.map