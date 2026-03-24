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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const passport_1 = require("@nestjs/passport");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async countNutritionists() {
        const count = await this.usersService.countNutritionists();
        return { count };
    }
    findAll(role, search) {
        return this.usersService.findAll(role, search);
    }
    async update(id, body, req) {
        const requesterRole = req.user.role;
        if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(requesterRole)) {
            throw new common_1.UnauthorizedException('Solo personal autorizado puede realizar esta acción');
        }
        const targetUser = await this.usersService.findOne(id);
        if (!targetUser) {
            throw new common_1.UnauthorizedException('Usuario no encontrado');
        }
        const isTargetAdmin = ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(targetUser.role);
        const isRequestingMaster = body.role === 'ADMIN_MASTER';
        const isChangingStatusOfAdmin = isTargetAdmin && body.status !== undefined;
        if (isTargetAdmin || isRequestingMaster || isChangingStatusOfAdmin) {
            if (requesterRole !== 'ADMIN_MASTER') {
                throw new common_1.UnauthorizedException('Solo un Admin Master puede realizar cambios de jerarquía o estado sobre otros administradores');
            }
        }
        return this.usersService.update(id, body);
    }
    updatePlan(id, body, req) {
        if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role)) {
            throw new common_1.UnauthorizedException('Solo el administrador puede cambiar planes');
        }
        return this.usersService.updatePlan(id, body.plan, body.days);
    }
    resetUnpaidPlans(req) {
        if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role)) {
            throw new common_1.UnauthorizedException('Solo el administrador puede resetear planes');
        }
        return this.usersService.resetUnpaidPlans();
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('count/nutritionists'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "countNutritionists", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Query)('role')),
    __param(1, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/plan'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Post)('reset-unpaid-plans'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "resetUnpaidPlans", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map