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
exports.CreateRegistrationRequestDto = void 0;
const class_validator_1 = require("class-validator");
class CreateRegistrationRequestDto {
    fullName;
    email;
    phone;
    professionalId;
    specialty;
    message;
}
exports.CreateRegistrationRequestDto = CreateRegistrationRequestDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre es obligatorio' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
    __metadata("design:type", String)
], CreateRegistrationRequestDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El correo es obligatorio' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Correo electrónico inválido' }),
    __metadata("design:type", String)
], CreateRegistrationRequestDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRegistrationRequestDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRegistrationRequestDto.prototype, "professionalId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRegistrationRequestDto.prototype, "specialty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRegistrationRequestDto.prototype, "message", void 0);
//# sourceMappingURL=create-registration-request.dto.js.map