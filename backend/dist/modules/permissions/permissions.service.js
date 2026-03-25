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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PermissionsService = class PermissionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkFeatureAccess(accountId, featureKey) {
        const account = await this.prisma.account.findUnique({
            where: { id: accountId },
            include: {
                subscription: {
                    include: { plan: true }
                }
            }
        });
        if (!account)
            return false;
        if (['ADMIN_MASTER', 'ADMIN_GENERAL', 'ADMIN'].includes(account.role))
            return true;
        const features = account.subscription?.plan?.features;
        if (features && features[featureKey] === true)
            return true;
        return false;
    }
    async getFeatureLimit(accountId, limitKey) {
        const account = await this.prisma.account.findUnique({
            where: { id: accountId },
            include: {
                subscription: { include: { plan: true } }
            }
        });
        if (!account)
            return 0;
        if (['ADMIN_MASTER', 'ADMIN_GENERAL', 'ADMIN'].includes(account.role))
            return Infinity;
        const features = account.subscription?.plan?.features;
        return (features && typeof features[limitKey] === 'number') ? features[limitKey] : 0;
    }
    async ensureAccess(accountId, featureKey) {
        const hasAccess = await this.checkFeatureAccess(accountId, featureKey);
        if (!hasAccess) {
            throw new common_1.ForbiddenException(`Su plan actual no incluye la función: ${featureKey}`);
        }
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map