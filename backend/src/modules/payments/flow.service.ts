import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '@prisma/client';
import { createHmac } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from './payments.service';
import { DiscountCodesService } from '../discount-codes/discount-codes.service';
import { resolveRequiredUrl } from '../../common/utils/runtime-url.util';

type FlowParams = Record<string, string | number | boolean | null | undefined>;

interface FlowPaymentCreateResponse {
  url: string;
  token: string;
  flowOrder: number;
}

interface FlowPaymentStatusResponse {
  flowOrder: number;
  commerceOrder: string;
  status: number;
  subject: string;
  currency: string;
  amount: number;
  payer: string;
  paymentData?: Record<string, unknown>;
}

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly discountCodesService: DiscountCodesService,
  ) {}

  async createMembershipCheckout(
    accountId: string,
    planId: string,
    payerEmail?: string,
    discountCode?: string,
    returnPath?: string,
  ) {
    let discount: { code: string; percent: number; type: string } | undefined;

    if (discountCode) {
      const code =
        await this.discountCodesService.validateAndGetDiscount(discountCode);
      discount = {
        code: code.code,
        percent: code.discountPercent,
        type: code.type,
      };
    }

    const pendingPayment = await this.paymentsService.prepareMembershipPayment(
      accountId,
      planId,
      discount,
    );
    const metadata = (pendingPayment.metadata as any) || {};
    const commerceOrder = `mem_${pendingPayment.id}`;

    const response = await this.createPayment({
      commerceOrder,
      subject: `Plan ${metadata.planName} - NutriNet`,
      amount: Number(pendingPayment.amount),
      currency: pendingPayment.currency,
      email: payerEmail || 'pagos@nutrinet.cl',
      urlConfirmation: this.getConfirmationUrl(),
      urlReturn: this.getReturnUrl(
        returnPath ||
          `/dashboard/bienvenida?plan=${encodeURIComponent(metadata.planName || 'Plan')}&slug=${encodeURIComponent(metadata.planSlug || '')}`,
      ),
      optional: JSON.stringify({
        paymentId: pendingPayment.id,
        accountId,
        planId,
        type: 'MEMBERSHIP_PLAN',
        ...(discount
          ? { discountCode: discount.code, discountPercent: discount.percent }
          : {}),
      }),
    });

    const paymentUrl = `${response.url}?token=${response.token}`;

    if (discountCode && discount) {
      await this.prisma.$transaction(async (tx) => {
        await this.discountCodesService.markAsUsed(
          discount.code,
          accountId,
          tx,
        );
        await tx.payment.update({
          where: { id: pendingPayment.id },
          data: {
            idempotencyKey: `flow:${response.token}`,
            metadata: {
              ...metadata,
              provider: 'FLOW',
              commerceOrder,
              flowOrder: response.flowOrder,
              token: response.token,
              paymentUrl,
              rawFlowResponse: response,
            },
          },
        });
      });
    } else {
      await this.prisma.payment.update({
        where: { id: pendingPayment.id },
        data: {
          idempotencyKey: `flow:${response.token}`,
          metadata: {
            ...metadata,
            provider: 'FLOW',
            commerceOrder,
            flowOrder: response.flowOrder,
            token: response.token,
            paymentUrl,
            rawFlowResponse: response,
          },
        },
      });
    }

    return {
      provider: 'FLOW' as const,
      paymentUrl,
      token: response.token,
      flowOrder: response.flowOrder,
      paymentId: pendingPayment.id,
    };
  }

  async handlePaymentConfirmation(token: string) {
    if (!token) throw new BadRequestException('Token de Flow no recibido');

    const status = await this.getPaymentStatus(token);
    const payment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: `flow:${token}` },
    });

    if (!payment) {
      this.logger.warn(`Flow payment not found for token ${token}`);
      throw new NotFoundException('Pago Flow no encontrado');
    }

    const metadata = (payment.metadata as any) || {};
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          ...metadata,
          flowStatus: status.status,
          lastFlowStatus: status,
        },
      },
    });

    if (payment.status === PaymentStatus.COMPLETED) {
      return { processed: false, reason: 'already_completed' };
    }

    if (status.status === 2) {
      return this.paymentsService.activateMembershipFromPayment(
        payment.id,
        String(status.flowOrder),
      );
    }

    if (status.status === 3 || status.status === 4) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      return { processed: true, status: 'FAILED', flowStatus: status.status };
    }

    return { processed: false, status: 'PENDING', flowStatus: status.status };
  }

  async createPayment(params: {
    commerceOrder: string;
    subject: string;
    amount: number;
    email: string;
    urlConfirmation: string;
    urlReturn: string;
    currency?: string;
    optional?: string;
    timeout?: number;
  }): Promise<FlowPaymentCreateResponse> {
    return this.post<FlowPaymentCreateResponse>('/payment/create', {
      commerceOrder: params.commerceOrder,
      subject: params.subject,
      currency: params.currency || 'CLP',
      amount: params.amount,
      email: params.email,
      paymentMethod: 9,
      urlConfirmation: params.urlConfirmation,
      urlReturn: params.urlReturn,
      optional: params.optional,
      timeout: params.timeout,
    });
  }

  async getPaymentStatus(token: string): Promise<FlowPaymentStatusResponse> {
    return this.get<FlowPaymentStatusResponse>('/payment/getStatus', { token });
  }

  private async post<T>(path: string, params: FlowParams): Promise<T> {
    const signedParams = this.signParams(params);
    const response = await fetch(`${this.getBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(this.toSearchParams(signedParams)),
    });

    return this.parseResponse<T>(response, path);
  }

  private async get<T>(path: string, params: FlowParams): Promise<T> {
    const signedParams = this.signParams(params);
    const search = new URLSearchParams(this.toSearchParams(signedParams));
    const response = await fetch(`${this.getBaseUrl()}${path}?${search}`);

    return this.parseResponse<T>(response, path);
  }

  private signParams(params: FlowParams) {
    const apiKey = this.configService.get<string>('FLOW_API_KEY');
    const secretKey = this.configService.get<string>('FLOW_SECRET_KEY');

    if (!apiKey || !secretKey) {
      throw new InternalServerErrorException(
        'Credenciales de Flow no configuradas',
      );
    }

    const cleanParams = Object.fromEntries(
      Object.entries({ apiKey, ...params }).filter(
        ([, value]) => value !== undefined && value !== null,
      ),
    ) as Record<string, string | number | boolean>;

    const toSign = Object.keys(cleanParams)
      .filter((key) => key !== 's')
      .sort()
      .map((key) => `${key}${cleanParams[key]}`)
      .join('');

    return {
      ...cleanParams,
      s: createHmac('sha256', secretKey).update(toSign).digest('hex'),
    };
  }

  private toSearchParams(params: Record<string, string | number | boolean>) {
    return Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    );
  }

  private async parseResponse<T>(response: Response, path: string): Promise<T> {
    const body = await response.text();
    let parsed: any;

    try {
      parsed = body ? JSON.parse(body) : null;
    } catch {
      parsed = body;
    }

    if (!response.ok) {
      this.logger.error(`Flow ${path} failed`, parsed);
      throw new BadRequestException({
        message: 'Flow rechazó la operación',
        provider: 'FLOW',
        statusCode: response.status,
        detail: parsed,
      });
    }

    return parsed as T;
  }

  private getBaseUrl() {
    return (
      this.configService.get<string>('FLOW_BASE_URL') ||
      'https://sandbox.flow.cl/api'
    ).replace(/\/$/, '');
  }

  private getFrontendUrl() {
    return resolveRequiredUrl(
      this.configService.get<string>('FRONTEND_URL'),
      this.configService.get<string>('NEXT_PUBLIC_FRONTEND_URL'),
    );
  }

  private getConfirmationUrl() {
    const configured = this.configService.get<string>('FLOW_CONFIRMATION_URL');
    if (configured) return configured;

    const apiUrl = this.configService.get<string>('API_URL');
    if (apiUrl)
      return `${apiUrl.replace(/\/$/, '')}/payments/flow/confirmation`;

    throw new Error('FLOW_CONFIRMATION_URL or API_URL is required');
  }

  private getReturnUrl(path: string) {
    const apiUrl = this.configService.get<string>('API_URL');
    const base = apiUrl ? apiUrl.replace(/\/$/, '') : 'http://localhost:3001';
    return `${base}/payments/flow/return?path=${encodeURIComponent(path)}`;
  }
}
