"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsModule = void 0;
const common_1 = require("@nestjs/common");
const patients_service_1 = require("./patients.service");
const patients_controller_1 = require("./patients.controller");
const prisma_module_1 = require("../../prisma/prisma.module");
const tags_module_1 = require("../tags/tags.module");
const metrics_module_1 = require("../metrics/metrics.module");
let PatientsModule = class PatientsModule {
};
exports.PatientsModule = PatientsModule;
exports.PatientsModule = PatientsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, tags_module_1.TagsModule, metrics_module_1.MetricsModule],
        providers: [patients_service_1.PatientsService],
        controllers: [patients_controller_1.PatientsController]
    })
], PatientsModule);
//# sourceMappingURL=patients.module.js.map