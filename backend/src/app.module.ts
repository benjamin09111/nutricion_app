import { Module } from '@nestjs/common';
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
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
// import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

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
    // AnnouncementsModule,
    ScheduleModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes default cache
    }),
    DashboardModule,
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
