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
exports.CreateSupportRequestDto = void 0;
const class_validator_1 = require("class-validator");
class CreateSupportRequestDto {
    email;
    message;
    type;
    subject;
}
exports.CreateSupportRequestDto = CreateSupportRequestDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateSupportRequestDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSupportRequestDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['PASSWORD_RESET', 'CONTACT', 'OTHER', 'FEEDBACK', 'COMPLAINT', 'IDEA']),
    __metadata("design:type", String)
], CreateSupportRequestDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSupportRequestDto.prototype, "subject", void 0);
//# sourceMappingURL=create-support-request.dto.js.map