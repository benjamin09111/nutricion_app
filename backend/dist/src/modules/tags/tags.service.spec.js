"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const tags_service_1 = require("./tags.service");
describe('TagsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [tags_service_1.TagsService],
        }).compile();
        service = module.get(tags_service_1.TagsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=tags.service.spec.js.map