"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsModule = void 0;
const common_1 = require("@nestjs/common");
const requests_service_1 = require("./requests.service");
const requests_controller_1 = require("./requests.controller");
const prisma_module_1 = require("../../prisma/prisma.module");
const mail_module_1 = require("../mail/mail.module");
const auth_module_1 = require("../auth/auth.module");
let RequestsModule = class RequestsModule {
};
exports.RequestsModule = RequestsModule;
exports.RequestsModule = RequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, mail_module_1.MailModule, auth_module_1.AuthModule],
        providers: [requests_service_1.RequestsService],
        controllers: [requests_controller_1.RequestsController]
    })
], RequestsModule);
//# sourceMappingURL=requests.module.js.map