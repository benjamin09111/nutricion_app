"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const foods_module_1 = require("./modules/foods/foods.module");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const mail_module_1 = require("./modules/mail/mail.module");
const users_module_1 = require("./modules/users/users.module");
const support_module_1 = require("./modules/support/support.module");
const requests_module_1 = require("./modules/requests/requests.module");
const patients_module_1 = require("./modules/patients/patients.module");
const memberships_module_1 = require("./modules/memberships/memberships.module");
const payments_module_1 = require("./modules/payments/payments.module");
const metrics_module_1 = require("./modules/metrics/metrics.module");
const ingredient_groups_module_1 = require("./modules/ingredient-groups/ingredient-groups.module");
const recipes_module_1 = require("./modules/recipes/recipes.module");
const schedule_1 = require("@nestjs/schedule");
const cache_manager_1 = require("@nestjs/cache-manager");
const http_logger_middleware_1 = require("./common/middleware/http-logger.middleware");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const creations_module_1 = require("./modules/creations/creations.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(http_logger_middleware_1.HttpLoggerMiddleware)
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            foods_module_1.FoodsModule,
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            mail_module_1.MailModule,
            users_module_1.UsersModule,
            support_module_1.SupportModule,
            requests_module_1.RequestsModule,
            patients_module_1.PatientsModule,
            memberships_module_1.MembershipsModule,
            payments_module_1.PaymentsModule,
            metrics_module_1.MetricsModule,
            ingredient_groups_module_1.IngredientGroupsModule,
            recipes_module_1.RecipesModule,
            schedule_1.ScheduleModule.forRoot(),
            cache_manager_1.CacheModule.register({
                isGlobal: true,
                ttl: 300000,
            }),
            dashboard_module_1.DashboardModule,
            creations_module_1.CreationsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map