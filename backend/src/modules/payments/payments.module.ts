import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsWebhookController } from './payments.webhook.controller';
import { PaymentsService } from './payments.service';
import { FlowService } from './flow.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { DiscountCodesModule } from '../discount-codes/discount-codes.module';

@Module({
  imports: [PrismaModule, PermissionsModule, DiscountCodesModule],
  controllers: [PaymentsController, PaymentsWebhookController],
  providers: [PaymentsService, FlowService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
