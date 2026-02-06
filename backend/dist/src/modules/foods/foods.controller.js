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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodsController = void 0;
const common_1 = require("@nestjs/common");
const foods_service_1 = require("./foods.service");
const create_food_dto_1 = require("./dto/create-food.dto");
const update_food_dto_1 = require("./dto/update-food.dto");
let FoodsController = class FoodsController {
    foodsService;
    constructor(foodsService) {
        this.foodsService = foodsService;
    }
    create(createFoodDto) {
        return this.foodsService.create(createFoodDto, undefined);
    }
    findAll(search, category, page, limit) {
        return this.foodsService.findAll({
            search,
            category,
            page: page ? +page : 1,
            limit: limit ? +limit : 20,
        });
    }
    getMarketPrices(limit) {
        return this.foodsService.getMarketPrices(limit ? Number(limit) : 7);
    }
    findOne(id) {
        return this.foodsService.findOne(id);
    }
    update(id, updateFoodDto) {
        return this.foodsService.update(id, updateFoodDto);
    }
    remove(id) {
        return this.foodsService.remove(id);
    }
};
exports.FoodsController = FoodsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_food_dto_1.CreateFoodDto]),
    __metadata("design:returntype", void 0)
], FoodsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], FoodsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('market-prices'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FoodsController.prototype, "getMarketPrices", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FoodsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_food_dto_1.UpdateFoodDto]),
    __metadata("design:returntype", void 0)
], FoodsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FoodsController.prototype, "remove", null);
exports.FoodsController = FoodsController = __decorate([
    (0, common_1.Controller)('foods'),
    __metadata("design:paramtypes", [foods_service_1.FoodsService])
], FoodsController);
//# sourceMappingURL=foods.controller.js.map