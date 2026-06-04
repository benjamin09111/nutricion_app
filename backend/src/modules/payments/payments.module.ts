import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsWebhookController } from './payments.webhook.controller';
import { PaymentsService } from './payments.service';
import { MercadoPagoService } from './mercadopago.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController, PaymentsWebhookController],
  providers: [PaymentsService, MercadoPagoService],
})
export class PaymentsModule {}
