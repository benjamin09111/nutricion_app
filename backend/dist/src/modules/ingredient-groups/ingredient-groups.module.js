"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngredientGroupsModule = void 0;
const common_1 = require("@nestjs/common");
const ingredient_groups_service_1 = require("./ingredient-groups.service");
const ingredient_groups_controller_1 = require("./ingredient-groups.controller");
const prisma_module_1 = require("../../prisma/prisma.module");
let IngredientGroupsModule = class IngredientGroupsModule {
};
exports.IngredientGroupsModule = IngredientGroupsModule;
exports.IngredientGroupsModule = IngredientGroupsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [ingredient_groups_controller_1.IngredientGroupsController],
        providers: [ingredient_groups_service_1.IngredientGroupsService],
    })
], IngredientGroupsModule);
//# sourceMappingURL=ingredient-groups.module.js.map