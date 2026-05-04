"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientPortalsModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../../prisma/prisma.module");
const patient_portals_controller_1 = require("./patient-portals.controller");
const patient_portals_service_1 = require("./patient-portals.service");
const patient_portal_guard_1 = require("./guards/patient-portal.guard");
let PatientPortalsModule = class PatientPortalsModule {
};
exports.PatientPortalsModule = PatientPortalsModule;
exports.PatientPortalsModule = PatientPortalsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            config_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => ({
                    secret: configService.get('PORTAL_JWT_SECRET') || configService.get('JWT_SECRET') || 'secret',
                }),
            }),
        ],
        controllers: [patient_portals_controller_1.PatientPortalsController],
        providers: [patient_portals_service_1.PatientPortalsService, patient_portal_guard_1.PatientPortalAuthGuard],
        exports: [patient_portals_service_1.PatientPortalsService],
    })
], PatientPortalsModule);
//# sourceMappingURL=patient-portals.module.js.map