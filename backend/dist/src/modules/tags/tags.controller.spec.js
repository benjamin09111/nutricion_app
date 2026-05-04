"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const tags_controller_1 = require("./tags.controller");
describe('TagsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [tags_controller_1.TagsController],
        }).compile();
        controller = module.get(tags_controller_1.TagsController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=tags.controller.spec.js.map