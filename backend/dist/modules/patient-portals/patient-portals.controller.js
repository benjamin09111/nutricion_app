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
exports.PatientPortalsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const patient_portals_service_1 = require("./patient-portals.service");
const create_patient_portal_invitation_dto_1 = require("./dto/create-patient-portal-invitation.dto");
const create_patient_portal_entry_dto_1 = require("./dto/create-patient-portal-entry.dto");
const create_patient_portal_question_dto_1 = require("./dto/create-patient-portal-question.dto");
const create_patient_portal_reply_dto_1 = require("./dto/create-patient-portal-reply.dto");
const patient_portal_guard_1 = require("./guards/patient-portal.guard");
let PatientPortalsController = class PatientPortalsController {
    patientPortalsService;
    constructor(patientPortalsService) {
        this.patientPortalsService = patientPortalsService;
    }
    createInvitation(req, patientId, dto) {
        return this.patientPortalsService.createInvitation(req.user.nutritionistId, patientId, dto);
    }
    getPatientOverview(req, patientId) {
        return this.patientPortalsService.getPortalOverview(req.user.nutritionistId, patientId);
    }
    previewInvitation(token) {
        return this.patientPortalsService.previewInvitation(token);
    }
    verifyInvitation(token, body) {
        return this.patientPortalsService.verifyInvitation(token, body.email, body.accessCode);
    }
    getMyPortal(req) {
        return this.patientPortalsService.getPortalSessionOverview(req.portalSession);
    }
    createQuestion(req, dto) {
        return this.patientPortalsService.createQuestion(req.portalSession, dto);
    }
    createTracking(req, dto) {
        return this.patientPortalsService.createTrackingEntry(req.portalSession, dto);
    }
    createTrackingAlias(req, dto) {
        return this.patientPortalsService.createTrackingEntry(req.portalSession, dto);
    }
    createReply(req, patientId, dto) {
        return this.patientPortalsService.createReply(req.user.nutritionistId, patientId, dto);
    }
    setAccessStatus(req, patientId, body) {
        return this.patientPortalsService.setAccessStatus(req.user.nutritionistId, patientId, body.status);
    }
};
exports.PatientPortalsController = PatientPortalsController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('patients/:patientId/invitations'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('patientId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_patient_portal_invitation_dto_1.CreatePatientPortalInvitationDto]),
    __metadata("design:returntype", void 0)
], PatientPortalsController.prototype, "createInvitation", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('patients/:patientId/overview'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PatientPortalsController.prototype, "getPatientOverview", null);
__decorate([
    (0, common_1.Get)('invitations/:token/preview'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PatientPortalsController.prototype, "previewInvitation", null);
__decorate([
    (0, common_1.Post)('invitations/:token/verify'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PatientPortalsController.prototype, "verifyInvitation", null);
__decorate([
    (0, common_1.UseGuards)(patient_portal_guard_1.PatientPortalAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PatientPortalsController.prototype, "getMyPortal", null);
__decorate([
    (0, common_1.UseGuards)(patient_portal_guard_1.PatientPortalAuthGuard),
    (0, common_1.Post)('me/questions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_patient_portal_question_dto_1.CreatePatientPortalQuestionDto]),
    __metadata("design:returntype", void 0)
], PatientPortalsController.prototype, "createQuestion", null);
__decorate([
    (0, common_1.UseGuards)(patient_portal_guard_1.PatientPortalAuthGuard),
    (0, common_1.Post)('me/tracking'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_patient_portal_entry_dto_1.CreatePatientPortalEntryDto]),
    __metadata("design:returntype", void 0)
], PatientPortalsController.prototype, "createTracking", null);
__decorate([
    (0, common_1.UseGuards)(patient_portal_guard_1.PatientPortalAuthGuard),
    (0, common_1.Post)('me/check-ins'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_patient_portal_entry_dto_1.CreatePatientPortalEntryDto]),
    __metadata("design:returntype", void 0)
], PatientPortalsController.prototype, "createTrackingAlias", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('patients/:patientId/replies'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('patientId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_patient_portal_reply_dto_1.CreatePatientPortalReplyDto]),
    __metadata("design:returntype", void 0)
], PatientPortalsController.prototype, "createReply", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('patients/:patientId/access-status'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('patientId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], PatientPortalsController.prototype, "setAccessStatus", null);
exports.PatientPortalsController = PatientPortalsController = __decorate([
    (0, common_1.Controller)('patient-portals'),
    __metadata("design:paramtypes", [patient_portals_service_1.PatientPortalsService])
], PatientPortalsController);
//# sourceMappingURL=patient-portals.controller.js.map