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
exports.IngredientGroupsController = void 0;
const common_1 = require("@nestjs/common");
const ingredient_groups_service_1 = require("./ingredient-groups.service");
const create_ingredient_group_dto_1 = require("./dto/create-ingredient-group.dto");
const update_group_ingredients_dto_1 = require("./dto/update-group-ingredients.dto");
const auth_guard_1 = require("../auth/guards/auth.guard");
let IngredientGroupsController = class IngredientGroupsController {
    ingredientGroupsService;
    constructor(ingredientGroupsService) {
        this.ingredientGroupsService = ingredientGroupsService;
    }
    create(req, createDto) {
        return this.ingredientGroupsService.create(req.user.nutritionistId, createDto);
    }
    findAll(req) {
        return this.ingredientGroupsService.findAll(req.user.nutritionistId);
    }
    findOne(req, id) {
        return this.ingredientGroupsService.findOne(id, req.user.nutritionistId);
    }
    update(req, id, updateDto) {
        return this.ingredientGroupsService.update(id, req.user.nutritionistId, updateDto);
    }
    remove(req, id) {
        return this.ingredientGroupsService.remove(id, req.user.nutritionistId);
    }
    addIngredients(req, id, dto) {
        return this.ingredientGroupsService.addIngredients(id, req.user.nutritionistId, dto);
    }
    removeIngredients(req, id, dto) {
        return this.ingredientGroupsService.removeIngredients(id, req.user.nutritionistId, dto);
    }
};
exports.IngredientGroupsController = IngredientGroupsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_ingredient_group_dto_1.CreateIngredientGroupDto]),
    __metadata("design:returntype", void 0)
], IngredientGroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IngredientGroupsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IngredientGroupsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_ingredient_group_dto_1.CreateIngredientGroupDto]),
    __metadata("design:returntype", void 0)
], IngredientGroupsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], IngredientGroupsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/ingredients'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_group_ingredients_dto_1.UpdateGroupIngredientsDto]),
    __metadata("design:returntype", void 0)
], IngredientGroupsController.prototype, "addIngredients", null);
__decorate([
    (0, common_1.Delete)(':id/ingredients'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_group_ingredients_dto_1.UpdateGroupIngredientsDto]),
    __metadata("design:returntype", void 0)
], IngredientGroupsController.prototype, "removeIngredients", null);
exports.IngredientGroupsController = IngredientGroupsController = __decorate([
    (0, common_1.Controller)('ingredient-groups'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [ingredient_groups_service_1.IngredientGroupsService])
], IngredientGroupsController);
//# sourceMappingURL=ingredient-groups.controller.js.map