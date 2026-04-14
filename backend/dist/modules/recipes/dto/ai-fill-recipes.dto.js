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
exports.AiFillRecipesDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class AiFillTargetsDto {
    calories;
    protein;
    carbs;
    fats;
}
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AiFillTargetsDto.prototype, "calories", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AiFillTargetsDto.prototype, "protein", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AiFillTargetsDto.prototype, "carbs", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AiFillTargetsDto.prototype, "fats", void 0);
class AiFillRulesDto {
    strictDietFoodsForMainMeals;
    allowSimpleSnackProductsOutsideDiet;
    maxMainIngredients;
    preferSimpleRecipes;
    preferCommonHouseholdMeals;
    fillOnlyEmptySlots;
}
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AiFillRulesDto.prototype, "strictDietFoodsForMainMeals", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AiFillRulesDto.prototype, "allowSimpleSnackProductsOutsideDiet", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], AiFillRulesDto.prototype, "maxMainIngredients", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AiFillRulesDto.prototype, "preferSimpleRecipes", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AiFillRulesDto.prototype, "preferCommonHouseholdMeals", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AiFillRulesDto.prototype, "fillOnlyEmptySlots", void 0);
class AiFillSlotDto {
    slotId;
    time;
    mealSection;
    label;
    isEmpty;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiFillSlotDto.prototype, "slotId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiFillSlotDto.prototype, "time", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiFillSlotDto.prototype, "mealSection", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiFillSlotDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AiFillSlotDto.prototype, "isEmpty", void 0);
class AiFillDayDto {
    day;
    slots;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiFillDayDto.prototype, "day", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AiFillSlotDto),
    __metadata("design:type", Array)
], AiFillDayDto.prototype, "slots", void 0);
class ExistingAssignmentDto {
    day;
    slotId;
    mealSection;
    title;
    mainIngredients;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExistingAssignmentDto.prototype, "day", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExistingAssignmentDto.prototype, "slotId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExistingAssignmentDto.prototype, "mealSection", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExistingAssignmentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ExistingAssignmentDto.prototype, "mainIngredients", void 0);
class AiPatientProfileDto {
    fullName;
    ageYears;
    gender;
    weightKg;
    heightCm;
    nutritionalFocus;
    fitnessGoals;
    activityLevel;
    restrictions;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AiPatientProfileDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AiPatientProfileDto.prototype, "ageYears", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AiPatientProfileDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AiPatientProfileDto.prototype, "weightKg", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AiPatientProfileDto.prototype, "heightCm", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AiPatientProfileDto.prototype, "nutritionalFocus", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AiPatientProfileDto.prototype, "fitnessGoals", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['sedentario', 'deportista']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AiPatientProfileDto.prototype, "activityLevel", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], AiPatientProfileDto.prototype, "restrictions", void 0);
class AiPatientGoalsDto {
    calories;
    protein;
    carbs;
    fats;
}
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AiPatientGoalsDto.prototype, "calories", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AiPatientGoalsDto.prototype, "protein", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AiPatientGoalsDto.prototype, "carbs", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AiPatientGoalsDto.prototype, "fats", void 0);
class AiProteinSupplementDto {
    enabled;
    gramsPerDay;
}
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AiProteinSupplementDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AiProteinSupplementDto.prototype, "gramsPerDay", void 0);
class AiFillPayloadDto {
    scope;
    targets;
    dietRestrictions;
    preferredFoods;
    nutritionistNotes;
    allowedFoodsByDiet;
    chileExchangePortionGuide;
    patientProfile;
    patientGoals;
    proteinSupplement;
    generalSnackFlexAllowed;
    rules;
    day;
    slots;
    days;
    existingAssignments;
    recipeStyle;
    timeStyle;
}
__decorate([
    (0, class_validator_1.IsIn)(['day', 'week']),
    __metadata("design:type", String)
], AiFillPayloadDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AiFillTargetsDto),
    __metadata("design:type", AiFillTargetsDto)
], AiFillPayloadDto.prototype, "targets", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AiFillPayloadDto.prototype, "dietRestrictions", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AiFillPayloadDto.prototype, "preferredFoods", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AiFillPayloadDto.prototype, "nutritionistNotes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AiFillPayloadDto.prototype, "allowedFoodsByDiet", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AiFillPayloadDto.prototype, "chileExchangePortionGuide", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AiPatientProfileDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", AiPatientProfileDto)
], AiFillPayloadDto.prototype, "patientProfile", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AiPatientGoalsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", AiPatientGoalsDto)
], AiFillPayloadDto.prototype, "patientGoals", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AiProteinSupplementDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", AiProteinSupplementDto)
], AiFillPayloadDto.prototype, "proteinSupplement", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AiFillPayloadDto.prototype, "generalSnackFlexAllowed", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AiFillRulesDto),
    __metadata("design:type", AiFillRulesDto)
], AiFillPayloadDto.prototype, "rules", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AiFillPayloadDto.prototype, "day", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AiFillSlotDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], AiFillPayloadDto.prototype, "slots", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AiFillDayDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], AiFillPayloadDto.prototype, "days", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ExistingAssignmentDto),
    __metadata("design:type", Array)
], AiFillPayloadDto.prototype, "existingAssignments", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['very-simple', 'simple', 'varied']),
    __metadata("design:type", String)
], AiFillPayloadDto.prototype, "recipeStyle", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['quick', 'normal']),
    __metadata("design:type", String)
], AiFillPayloadDto.prototype, "timeStyle", void 0);
class AiFillRecipesDto {
    scope;
    payload;
}
exports.AiFillRecipesDto = AiFillRecipesDto;
__decorate([
    (0, class_validator_1.IsIn)(['day', 'week']),
    __metadata("design:type", String)
], AiFillRecipesDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AiFillPayloadDto),
    __metadata("design:type", AiFillPayloadDto)
], AiFillRecipesDto.prototype, "payload", void 0);
//# sourceMappingURL=ai-fill-recipes.dto.js.map