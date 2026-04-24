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
exports.QuickAiFillRecipesDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class QuickAiExistingDishDto {
    title;
    mealSection;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickAiExistingDishDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickAiExistingDishDto.prototype, "mealSection", void 0);
class QuickAiMealTargetDto {
    mealSection;
    count;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuickAiMealTargetDto.prototype, "mealSection", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(14),
    __metadata("design:type", Number)
], QuickAiMealTargetDto.prototype, "count", void 0);
class QuickAiPatientDto {
    fullName;
    restrictions;
    likes;
    healthTags;
    clinicalSummary;
    nutritionalFocus;
    fitnessGoals;
    gender;
    ageYears;
    birthDate;
    weight;
    height;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickAiPatientDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], QuickAiPatientDto.prototype, "restrictions", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickAiPatientDto.prototype, "likes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], QuickAiPatientDto.prototype, "healthTags", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickAiPatientDto.prototype, "clinicalSummary", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickAiPatientDto.prototype, "nutritionalFocus", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickAiPatientDto.prototype, "fitnessGoals", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickAiPatientDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QuickAiPatientDto.prototype, "ageYears", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickAiPatientDto.prototype, "birthDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QuickAiPatientDto.prototype, "weight", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QuickAiPatientDto.prototype, "height", void 0);
class QuickAiFillPayloadDto {
    dietName;
    notes;
    allowedFoodsMain;
    restrictedFoods;
    specialConsiderations;
    referenceDishes;
    resources;
    patient;
    existingDishes;
    desiredDishCount;
    mealSectionTargets;
    generationMode;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickAiFillPayloadDto.prototype, "dietName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickAiFillPayloadDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], QuickAiFillPayloadDto.prototype, "allowedFoodsMain", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], QuickAiFillPayloadDto.prototype, "restrictedFoods", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickAiFillPayloadDto.prototype, "specialConsiderations", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], QuickAiFillPayloadDto.prototype, "referenceDishes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], QuickAiFillPayloadDto.prototype, "resources", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => QuickAiPatientDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", QuickAiPatientDto)
], QuickAiFillPayloadDto.prototype, "patient", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => QuickAiExistingDishDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], QuickAiFillPayloadDto.prototype, "existingDishes", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(60),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QuickAiFillPayloadDto.prototype, "desiredDishCount", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => QuickAiMealTargetDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], QuickAiFillPayloadDto.prototype, "mealSectionTargets", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['single', 'weekly']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuickAiFillPayloadDto.prototype, "generationMode", void 0);
class QuickAiFillRecipesDto {
    payload;
}
exports.QuickAiFillRecipesDto = QuickAiFillRecipesDto;
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => QuickAiFillPayloadDto),
    __metadata("design:type", QuickAiFillPayloadDto)
], QuickAiFillRecipesDto.prototype, "payload", void 0);
//# sourceMappingURL=quick-ai-fill-recipes.dto.js.map