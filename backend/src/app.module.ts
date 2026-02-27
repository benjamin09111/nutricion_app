import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FoodsModule } from './modules/foods/foods.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { UsersModule } from './modules/users/users.module';
import { SupportModule } from './modules/support/support.module';
import { RequestsModule } from './modules/requests/requests.module';
import { PatientsModule } from './modules/patients/patients.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { IngredientGroupsModule } from './modules/ingredient-groups/ingredient-groups.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CreationsModule } from './modules/creations/creations.module';
import { TagsModule } from './modules/tags/tags.module';
import { SubstitutesModule } from './modules/substitutes/substitutes.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FoodsModule,
    PrismaModule,
    AuthModule,
    MailModule,
    UsersModule,
    SupportModule,
    RequestsModule,
    PatientsModule,
    MembershipsModule,
    PaymentsModule,
    MetricsModule,
    IngredientGroupsModule,
    RecipesModule,
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          url: process.env.REDIS_URL,
          ttl: 300000, // 5 minutes
          pingInterval: 10000, // Keep connection alive
        }),
      }),
    }),
    DashboardModule,
    CreationsModule,
    TagsModule,
    SubstitutesModule,
    ResourcesModule,
    UploadsModule,
    ConsultationsModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpLoggerMiddleware)
      .forRoutes('*');
  }
}
