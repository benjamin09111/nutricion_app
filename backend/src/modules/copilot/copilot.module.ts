import { Module } from '@nestjs/common';
import { CopilotService } from './copilot.service';
import { CopilotController } from './copilot.controller';
import { AiUsageService } from './ai-usage.service';
import { AiUsageController } from './ai-usage.controller';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PermissionsModule],
  providers: [CopilotService, AiUsageService],
  controllers: [CopilotController, AiUsageController],
  exports: [CopilotService, AiUsageService],
})
export class CopilotModule {}
