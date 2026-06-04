import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MercadoPagoConfig,
  Preference,
  Payment,
  WebhookSignatureValidator,
} from 'mercadopago';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import type { CreatePreferenceDto } from './dto/create-preference.dto';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly client: MercadoPagoConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const accessToken = this.configService.get<string>('MP_ACCESS_TOKEN');
    if (!accessToken) {
      this.logger.warn(
        'MP_ACCESS_TOKEN not configured — Mercado Pago will not work',
      );
    }
    this.client = new MercadoPagoConfig({ accessToken: accessToken ?? '' });
  }

  async createPreference(
    dto: CreatePreferenceDto,
    accountId: string,
    payerEmail: string,
  ) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }

    const amount = Number(plan.price);

    const preference = await new Preference(this.client).create({
      body: {
        items: [
          {
            id: plan.id,
            title: `Plan ${plan.name} — NutriNet`,
            description: plan.description ?? undefined,
            quantity: 1,
            unit_price: amount,
            currency_id: plan.currency,
          },
        ],
        payer: {
          email: payerEmail,
        },
        metadata: {
          plan_id: plan.id,
          plan_slug: plan.slug,
          account_id: accountId,
        },
        back_urls: {
          success: `${this.configService.get('FRONTEND_URL')}/dashboard/ajustes?payment=success`,
          failure: `${this.configService.get('FRONTEND_URL')}/dashboard/ajustes?payment=failure`,
          pending: `${this.configService.get('FRONTEND_URL')}/dashboard/ajustes?payment=pending`,
        },
        auto_return: 'approved',
      },
    });

    try {
      await this.prisma.payment.create({
        data: {
          accountId,
          amount,
          currency: plan.currency,
          status: PaymentStatus.PENDING,
          method: PaymentMethod.MERCADOPAGO,
          transactionId: preference.id!,
          metadata: {
            planId: plan.id,
            planSlug: plan.slug,
            planName: plan.name,
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to persist pending payment', error);
      throw new BadRequestException(
        'No se pudo registrar la intención de pago',
      );
    }

    return {
      init_point: preference.init_point!,
      sandbox_init_point: preference.sandbox_init_point,
      preference_id: preference.id,
    };
  }

  async handleWebhook(paymentId: string) {
    const payment = await new Payment(this.client).get({ id: paymentId });

    if (!payment || payment.status !== 'approved') {
      this.logger.log(`Payment ${paymentId} not approved, skipping`);
      return { processed: false, reason: 'not_approved' };
    }

    const existing = await this.prisma.payment.findFirst({
      where: { transactionId: paymentId },
    });

    if (existing && existing.status === PaymentStatus.COMPLETED) {
      this.logger.log(`Payment ${paymentId} already completed, skipping`);
      return { processed: false, reason: 'already_completed' };
    }

    const metadata = payment.metadata as any;
    const planId = metadata?.plan_id;
    const accountId = metadata?.account_id;

    if (!planId || !accountId) {
      this.logger.error('Missing plan_id or account_id in payment metadata');
      throw new BadRequestException('Metadata incompleto en el pago');
    }

    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      this.logger.error(`Plan ${planId} not found`);
      throw new NotFoundException('Plan no encontrado');
    }

    const startDate = new Date();
    const endDate = new Date();
    if (plan.billingPeriod === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    return this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.payment.update({
          where: { id: existing.id },
          data: {
            status: PaymentStatus.COMPLETED,
            paidAt: startDate,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            accountId,
            amount: payment.transaction_amount ?? Number(plan.price),
            currency: plan.currency,
            status: PaymentStatus.COMPLETED,
            method: PaymentMethod.MERCADOPAGO,
            transactionId: paymentId,
            paidAt: startDate,
            metadata: {
              planId: plan.id,
              planSlug: plan.slug,
              planName: plan.name,
            },
          },
        });
      }

      await tx.subscription.upsert({
        where: { accountId },
        update: {
          planId: plan.id,
          status: 'ACTIVE',
          startDate,
          endDate,
          cancelAtPeriodEnd: false,
          updatedAt: startDate,
        },
        create: {
          accountId,
          planId: plan.id,
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      });

      let accountPlan: 'FREE' | 'PRO' | 'ENTERPRISE' = 'PRO';
      if (plan.slug.includes('free')) accountPlan = 'FREE';
      if (plan.slug.includes('enterprise')) accountPlan = 'ENTERPRISE';

      await tx.account.update({
        where: { id: accountId },
        data: {
          plan: accountPlan,
          subscriptionEndsAt: endDate,
        },
      });

      return { processed: true, status: 'COMPLETED' };
    });
  }

  async getPaymentById(paymentId: string) {
    return new Payment(this.client).get({ id: paymentId });
  }

  verifyWebhookSignature(headers: Record<string, string>, body: any): boolean {
    const secret = this.configService.get<string>(
      'MP_WEBHOOK_SECRET',
    );

    if (!secret) {
      this.logger.warn(
        'MP_WEBHOOK_SECRET not set, skipping signature verification',
      );
      return true;
    }

    const signature = headers['x-signature'];
    const requestId = headers['x-request-id'];

    if (!signature || !requestId) {
      return false;
    }

    try {
      WebhookSignatureValidator.validate({
        xSignature: signature,
        xRequestId: requestId,
        dataId: body?.data?.id ?? '',
        secret,
      });
      return true;
    } catch {
      this.logger.warn('Webhook signature validation failed');
      return false;
    }
  }
}
