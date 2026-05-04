"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const substitutes_controller_1 = require("./substitutes.controller");
describe('SubstitutesController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [substitutes_controller_1.SubstitutesController],
        }).compile();
        controller = module.get(substitutes_controller_1.SubstitutesController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=substitutes.controller.spec.js.map