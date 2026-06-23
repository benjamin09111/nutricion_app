import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { GoogleIntegrationService } from './google-integration.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [GoogleIntegrationService],
  exports: [GoogleIntegrationService],
})
export class IntegrationsModule {}
