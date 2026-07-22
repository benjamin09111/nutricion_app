import { Module } from '@nestjs/common';
import { CopilotService } from './copilot.service';
import { CopilotController } from './copilot.controller';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PermissionsModule],
  providers: [CopilotService],
  controllers: [CopilotController],
  exports: [CopilotService],
})
export class CopilotModule {}
