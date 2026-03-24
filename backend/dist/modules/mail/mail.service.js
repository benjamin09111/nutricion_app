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
    async sendWelcomeEmail(email, fullName, password, validAdminMessage) {
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
                    adminMessage: validAdminMessage || '',
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Correo de bienvenida enviado a: ${email}`);
        }
        catch (error) {
            console.error('❌ Error enviando correo de bienvenida:', error);
        }
    }
    async sendRegistrationConfirmation(email, fullName) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '✅ Recibimos tu solicitud - NutriSaaS',
                template: 'request-confirmation',
                context: {
                    name: fullName,
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Correo de confirmación enviado a: ${email}`);
        }
        catch (error) {
            console.error('❌ Error enviando confirmación de registro:', error);
        }
    }
    async sendAdminNotification(requestData) {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@nutrisaas.com';
        try {
            await this.mailerService.sendMail({
                to: adminEmail,
                subject: '🔔 Nueva Solicitud de Registro',
                template: 'admin-notification',
                context: {
                    fullName: requestData.fullName,
                    email: requestData.email,
                    phone: requestData.phone,
                    professionalId: requestData.professionalId,
                    specialty: requestData.specialty,
                    message: requestData.message,
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Notificación enviada al administrador (${adminEmail})`);
        }
        catch (error) {
            console.error('❌ Error enviando notificación al administrador:', error);
        }
    }
    async sendFeedback(data) {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@nutrisaas.com';
        try {
            await this.mailerService.sendMail({
                to: adminEmail,
                subject: `💬 [${data.type}] ${data.subject}`,
                template: 'admin-notification',
                context: {
                    fullName: data.fromEmail.split('@')[0],
                    email: data.fromEmail,
                    message: data.message,
                    specialty: `SOPORTE: ${data.type}`,
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Notificación de soporte enviada al admin (${adminEmail})`);
        }
        catch (error) {
            console.error('❌ Error enviando notificación de soporte:', error);
        }
    }
    async sendRejectionEmail(email, fullName, adminMessage) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Actualización sobre tu solicitud - NutriSaaS',
                template: 'rejection',
                context: {
                    name: fullName,
                    adminMessage: adminMessage || '',
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Correo de rechazo enviado a: ${email}`);
        }
        catch (error) {
            console.error('❌ Error enviando correo de rechazo:', error);
        }
    }
    async sendPasswordResetEmail(email, fullName, password) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '🔑 Recuperación de Acceso - NutriSaaS',
                template: 'password-reset',
                context: {
                    name: fullName,
                    email: email,
                    password: password,
                    loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
                    year: new Date().getFullYear(),
                },
            });
            console.log(`✅ Correo de recuperación enviado a: ${email}`);
        }
        catch (error) {
            console.error('❌ Error enviando correo de recuperación:', error);
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService])
], MailService);
//# sourceMappingURL=mail.service.js.map