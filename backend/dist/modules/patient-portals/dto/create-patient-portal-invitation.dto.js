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
exports.CreatePatientPortalInvitationDto = void 0;
const class_validator_1 = require("class-validator");
class CreatePatientPortalInvitationDto {
    email;
    expiresInDays;
}
exports.CreatePatientPortalInvitationDto = CreatePatientPortalInvitationDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'El correo del paciente no es válido' }),
    __metadata("design:type", String)
], CreatePatientPortalInvitationDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'Los días de expiración deben ser un número entero' }),
    (0, class_validator_1.Min)(1, { message: 'La invitación debe durar al menos 1 día' }),
    __metadata("design:type", Number)
], CreatePatientPortalInvitationDto.prototype, "expiresInDays", void 0);
//# sourceMappingURL=create-patient-portal-invitation.dto.js.map