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
exports.ResourcesController = void 0;
const common_1 = require("@nestjs/common");
const resources_service_1 = require("./resources.service");
const auth_guard_1 = require("../auth/guards/auth.guard");
let ResourcesController = class ResourcesController {
    resourcesService;
    constructor(resourcesService) {
        this.resourcesService = resourcesService;
    }
    findAll(req) {
        const nutritionistId = req.user.nutritionistId;
        const isAdmin = ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role);
        return this.resourcesService.findAll(nutritionistId, isAdmin);
    }
    findOne(id) {
        return this.resourcesService.findOne(id);
    }
    create(req, data) {
        const isAdmin = ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role);
        const nutritionistId = isAdmin ? (data.isGlobal ? null : req.user.nutritionistId) : req.user.nutritionistId;
        return this.resourcesService.create(nutritionistId, data);
    }
    update(id, req, data) {
        const nutritionistId = req.user.nutritionistId;
        const isAdmin = ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role);
        return this.resourcesService.update(id, nutritionistId, isAdmin, data);
    }
    remove(id, req) {
        const nutritionistId = req.user.nutritionistId;
        const isAdmin = ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role);
        return this.resourcesService.remove(id, nutritionistId, isAdmin);
    }
};
exports.ResourcesController = ResourcesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResourcesController.prototype, "remove", null);
exports.ResourcesController = ResourcesController = __decorate([
    (0, common_1.Controller)('resources'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [resources_service_1.ResourcesService])
], ResourcesController);
//# sourceMappingURL=resources.controller.js.map