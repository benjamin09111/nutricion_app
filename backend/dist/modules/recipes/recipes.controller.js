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
exports.RecipesController = void 0;
const common_1 = require("@nestjs/common");
const recipes_service_1 = require("./recipes.service");
const create_recipe_dto_1 = require("./dto/create-recipe.dto");
const estimate_macros_dto_1 = require("./dto/estimate-macros.dto");
const compatible_recipes_dto_1 = require("./dto/compatible-recipes.dto");
const ai_fill_recipes_dto_1 = require("./dto/ai-fill-recipes.dto");
const quick_ai_fill_recipes_dto_1 = require("./dto/quick-ai-fill-recipes.dto");
const auth_guard_1 = require("../auth/guards/auth.guard");
const http_cache_interceptor_1 = require("../../common/interceptors/http-cache.interceptor");
const cache_manager_1 = require("@nestjs/cache-manager");
const recipe_matching_service_1 = require("./recipe-matching.service");
let RecipesController = class RecipesController {
    recipesService;
    recipeMatchingService;
    constructor(recipesService, recipeMatchingService) {
        this.recipesService = recipesService;
        this.recipeMatchingService = recipeMatchingService;
    }
    async create(req, createRecipeDto) {
        console.log('[RecipesController.create] req.user.id:', req?.user?.id);
        try {
            return await this.recipesService.create(req.user.id, createRecipeDto);
        }
        catch (err) {
            console.error('[RecipesController.create] Error:', err?.message || err);
            throw err;
        }
    }
    estimateMacros(dto) {
        return this.recipesService.estimateMacros(dto);
    }
    findCompatible(req, dto) {
        const nutritionistId = req.user.nutritionistId || req.user.id;
        return this.recipeMatchingService.findCompatibleRecipes(nutritionistId, dto.ingredientNames, dto.restrictions);
    }
    fillWithAi(req, dto) {
        return this.recipesService.fillWithAi(req.user.id, dto);
    }
    fillQuickWithAi(req, dto) {
        return this.recipesService.quickFillWithAi(req.user.id, dto);
    }
    findAll(req) {
        return this.recipesService.findAll(req.user.id);
    }
    findOne(req, id) {
        return this.recipesService.findOne(id, req.user.id);
    }
    update(req, id, updateRecipeDto) {
        return this.recipesService.update(id, req.user.id, req.user.role, updateRecipeDto);
    }
    remove(req, id) {
        return this.recipesService.remove(id, req.user.id, req.user.role);
    }
};
exports.RecipesController = RecipesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_recipe_dto_1.CreateRecipeDto]),
    __metadata("design:returntype", Promise)
], RecipesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('estimate-macros'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [estimate_macros_dto_1.EstimateMacrosDto]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "estimateMacros", null);
__decorate([
    (0, common_1.Post)('compatible'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, compatible_recipes_dto_1.CompatibleRecipesDto]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "findCompatible", null);
__decorate([
    (0, common_1.Post)('ai-fill'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ai_fill_recipes_dto_1.AiFillRecipesDto]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "fillWithAi", null);
__decorate([
    (0, common_1.Post)('quick-ai-fill'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, quick_ai_fill_recipes_dto_1.QuickAiFillRecipesDto]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "fillQuickWithAi", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_recipe_dto_1.CreateRecipeDto]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "remove", null);
exports.RecipesController = RecipesController = __decorate([
    (0, common_1.Controller)('recipes'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.UseInterceptors)(http_cache_interceptor_1.HttpCacheInterceptor),
    (0, cache_manager_1.CacheTTL)(300000),
    __metadata("design:paramtypes", [recipes_service_1.RecipesService,
        recipe_matching_service_1.RecipeMatchingService])
], RecipesController);
//# sourceMappingURL=recipes.controller.js.map