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
import { PaymentsService } from './payments.service';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly client: MercadoPagoConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly paymentsService: PaymentsService,
  ) {
    const accessToken = this.configService.get<string>('MP_ACCESS_TOKEN');
    if (!accessToken) {
      this.logger.warn(
        'MP_ACCESS_TOKEN not configured — Mercado Pago will not work',
      );
    }
    this.client = new MercadoPagoConfig({ accessToken: accessToken ?? '' });
  }

  private isMockMode(): boolean {
    return this.configService.get<string>('MOCK_PAYMENTS') === 'true';
  }

  async createPreference(
    planId: string,
    accountId: string,
    payerEmail: string,
  ) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }

    const amount = Number(plan.price);

    // Create pending payment first to get the internal ID
    const pendingPayment = await this.prisma.payment.create({
      data: {
        accountId,
        amount,
        currency: plan.currency,
        status: PaymentStatus.PENDING,
        method: PaymentMethod.MERCADOPAGO,
        metadata: {
          type: 'MEMBERSHIP_PLAN',
          provider: 'MERCADOPAGO',
          mock: false,
          planId: plan.id,
          planName: plan.name,
          planSlug: plan.slug,
        },
      },
    });

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
          payment_id: pendingPayment.id,
        },
        external_reference: pendingPayment.id,
        back_urls: {
          success: `${this.configService.get('FRONTEND_URL')}/dashboard?payment=success`,
          failure: `${this.configService.get('FRONTEND_URL')}/dashboard?payment=failure`,
          pending: `${this.configService.get('FRONTEND_URL')}/dashboard?payment=pending`,
        },
        auto_return: 'approved',
      },
    });

    // Update payment with preference ID in metadata
    await this.prisma.payment.update({
      where: { id: pendingPayment.id },
      data: {
        metadata: {
          ...((pendingPayment.metadata as any) || {}),
          preferenceId: preference.id,
        },
        idempotencyKey: `membership:${accountId}:${planId}:${pendingPayment.id}`,
      },
    });

    return {
      init_point: preference.init_point!,
      sandbox_init_point: preference.sandbox_init_point,
      preference_id: preference.id,
      payment_id: pendingPayment.id,
    };
  }

  async handleWebhook(mpPaymentId: string) {
    const payment = await new Payment(this.client).get({ id: mpPaymentId });

    if (!payment || payment.status !== 'approved') {
      this.logger.log(`MP payment ${mpPaymentId} not approved, skipping`);
      return { processed: false, reason: 'not_approved' };
    }

    // Find internal payment by external_reference (which is our Payment.id)
    const internalPaymentId = payment.external_reference;
    if (!internalPaymentId) {
      this.logger.error('No external_reference in MP payment');
      throw new BadRequestException('Referencia externa no encontrada en el pago');
    }

    const existing = await this.prisma.payment.findUnique({
      where: { id: internalPaymentId },
    });

    if (!existing) {
      this.logger.error(`Internal payment ${internalPaymentId} not found`);
      throw new NotFoundException('Pago interno no encontrado');
    }

    if (existing.status === PaymentStatus.COMPLETED) {
      this.logger.log(`Payment ${internalPaymentId} already completed`);
      return { processed: false, reason: 'already_completed' };
    }

    return this.paymentsService.activateMembershipFromPayment(
      internalPaymentId,
      mpPaymentId,
    );
  }

  async getPaymentById(paymentId: string) {
    return new Payment(this.client).get({ id: paymentId });
  }

  verifyWebhookSignature(headers: Record<string, string>, body: any): boolean {
    const secret = this.configService.get<string>('MP_WEBHOOK_SECRET');

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
