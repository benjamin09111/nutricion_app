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
exports.PatientPortalAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../../prisma/prisma.service");
let PatientPortalAuthGuard = class PatientPortalAuthGuard {
    jwtService;
    configService;
    prisma;
    constructor(jwtService, configService, prisma) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers?.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token) {
            throw new common_1.UnauthorizedException('No hay sesión de portal activa');
        }
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('PORTAL_JWT_SECRET') || this.configService.get('JWT_SECRET') || 'secret',
            });
            if (payload?.kind !== 'patient-portal' || !payload?.patientId || !payload?.nutritionistId) {
                throw new common_1.UnauthorizedException('Token de portal inválido');
            }
            const invitation = await this.prisma.patientPortalInvitation.findUnique({
                where: { id: payload.invitationId },
                select: {
                    id: true,
                    status: true,
                    expiresAt: true,
                    revokedAt: true,
                    blockedAt: true,
                    patientId: true,
                    nutritionistId: true,
                },
            });
            if (!invitation ||
                invitation.patientId !== payload.patientId ||
                invitation.nutritionistId !== payload.nutritionistId ||
                invitation.status !== 'ACTIVE' ||
                invitation.revokedAt ||
                invitation.blockedAt ||
                invitation.expiresAt.getTime() < Date.now()) {
                throw new common_1.UnauthorizedException('El acceso del portal está bloqueado o expiró');
            }
            request.portalSession = payload;
            return true;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('La sesión del portal expiró o es inválida');
        }
    }
};
exports.PatientPortalAuthGuard = PatientPortalAuthGuard;
exports.PatientPortalAuthGuard = PatientPortalAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], PatientPortalAuthGuard);
//# sourceMappingURL=patient-portal.guard.js.map