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
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
let MailService = class MailService {
    mailerService;
    constructor(mailerService) {
        this.mailerService = mailerService;
    }
    async sendWelcomeEmail(email, fullName, password) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '🌿 ¡Bienvenido a NutriSaaS! Tus credenciales de acceso',
                template: 'welcome',
                context: {
                    name: fullName,
                    email: email,
                    password: password,
                    loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Correo de bienvenida enviado a: ${email}`);
        }
        catch (error) {
            console.error('❌ Error enviando correo:', error);
            if (process.env.NODE_ENV === 'production') {
                throw error;
            }
            else {
                console.log('⚠️ Continuando ejecución pese al error de correo (Modo Desarrollo)');
                console.log('-----------------------------------------------------------');
                console.log(`🔑 DATOS DEL USUARIO: ${email} / ${password}`);
                console.log('-----------------------------------------------------------');
            }
        }
    }
    async sendAdminNotification(requestData) {
        try {
            await this.mailerService.sendMail({
                to: process.env.MAIL_USER,
                subject: '🔔 Nueva Solicitud de Registro Profesional',
                template: 'admin-notification',
                context: {
                    ...requestData,
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.error('❌ Error enviando notificación al admin:', error);
        }
    }
    async sendRegistrationConfirmation(email, fullName) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '📥 Hemos recibido tu solicitud - NutriSaaS',
                template: 'request-confirmation',
                context: {
                    name: fullName,
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.error('❌ Error enviando confirmación al usuario:', error);
        }
    }
    async sendRegistrationApproved(email, fullName, tempPass) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '✅ ¡Bienvenido a NutriSaaS!',
                template: 'registration-approved',
                context: {
                    name: fullName,
                    password: tempPass,
                    loginUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'http://localhost:3000/login',
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.error('❌ Error enviando credenciales:', error);
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService])
], MailService);
//# sourceMappingURL=mail.service.js.map