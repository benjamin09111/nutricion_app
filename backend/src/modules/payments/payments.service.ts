import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { PermissionsService } from '../permissions/permissions.service';
import { PlanUsageService } from '../permissions/plan-usage.service';
import { getMembershipPlanKey } from '../memberships/plan-entitlements';
import {
  PaymentStatus,
  PaymentMethod,
  SubscriptionStatus,
} from '@prisma/client';
import { DiscountCodesService } from '../discount-codes/discount-codes.service';
import { resolveAccountPlanFromMembershipPlan } from '../memberships/account-plan';
import { WhatsAppService } from '../notifications/whatsapp.service';
import { MailService } from '../mail/mail.service';
import * as XLSX from 'xlsx';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly permissionsService: PermissionsService,
    private readonly planUsageService: PlanUsageService,
    private readonly discountCodesService: DiscountCodesService,
    private readonly whatsappService: WhatsAppService,
    private readonly mailService: MailService,
  ) {}

  private isMockMode(): boolean {
    return this.configService.get<string>('MOCK_PAYMENTS') === 'true';
  }

  /**
   * Get all payments with account, plan, and subscription details
   */
  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        account: {
          select: {
            email: true,
            plan: true,
            nutritionist: {
              select: { fullName: true },
            },
            subscription: {
              select: {
                plan: { select: { name: true, slug: true } },
                status: true,
              },
            },
          },
        },
        subscriptionEvents: {
          select: { eventType: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRecent(limit: number = 5) {
    return this.prisma.payment.findMany({
      take: limit,
      include: {
        account: {
          select: {
            email: true,
            nutritionist: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deletePayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.subscriptionEvent.deleteMany({
        where: { paymentId },
      });

      await tx.payment.delete({
        where: { id: paymentId },
      });

      return { success: true, id: paymentId };
    });
  }

  async getRevenueStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalRevenue,
      mrr,
      pendingCount,
      completedCount,
      activeSubscriptions,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.COMPLETED,
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      this.prisma.payment.count({ where: { status: PaymentStatus.COMPLETED } }),
      this.prisma.subscription.count({
        where: {
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
          },
        },
      }),
    ]);

    return {
      totalLifetime: Number(totalRevenue._sum.amount || 0),
      mrr: Number(mrr._sum.amount || 0),
      pendingCount,
      completedCount,
      activeSubscriptions,
      currency: 'CLP',
    };
  }

  async exportAccountingWorkbook() {
    const payments = await this.prisma.payment.findMany({
      where: { status: PaymentStatus.COMPLETED },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            createdAt: true,
            nutritionist: {
              select: { fullName: true },
            },
            subscription: {
              select: {
                status: true,
                startDate: true,
                endDate: true,
                cancelAtPeriodEnd: true,
                plan: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
        subscriptionEvents: {
          select: { eventType: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const toIso = (value: Date | string | null | undefined) =>
      value ? new Date(value).toISOString() : '';

    const toClDateTime = (value: Date | string | null | undefined) =>
      value
        ? new Date(value).toLocaleString('es-CL', {
            timeZone: 'America/Santiago',
          })
        : '';

    const paymentRows = payments.map((payment) => {
      const metadata = (payment.metadata as Record<string, any>) || {};
      const subscription = payment.account.subscription;

      return {
        payment_id: payment.id,
        account_id: payment.accountId,
        email: payment.account.email,
        nutritionist_name: payment.account.nutritionist?.fullName || '',
        plan_name: metadata.planName || subscription?.plan?.name || '',
        plan_slug: metadata.planSlug || subscription?.plan?.slug || '',
        method: payment.method,
        status: payment.status,
        amount_clp: Number(payment.amount),
        currency: payment.currency,
        full_price_clp: Number(metadata.fullPrice ?? payment.amount),
        prorated_credit_clp: Number(metadata.proratedCredit ?? 0),
        charged_amount_clp: Number(metadata.chargedAmount ?? payment.amount),
        discount_code: metadata.discountCode || '',
        discount_percent: metadata.discountPercent ?? '',
        provider: metadata.provider || '',
        source: metadata.source || metadata.type || '',
        is_mock: Boolean(metadata.mock || metadata.isSimulation),
        transaction_id: payment.transactionId || '',
        paid_at_iso: toIso(payment.paidAt),
        paid_at_cl: toClDateTime(payment.paidAt),
        created_at_iso: toIso(payment.createdAt),
        created_at_cl: toClDateTime(payment.createdAt),
        updated_at_iso: toIso(payment.updatedAt),
        subscription_status: subscription?.status || '',
        subscription_start_iso: toIso(subscription?.startDate),
        subscription_end_iso: toIso(subscription?.endDate),
        cancel_at_period_end: subscription?.cancelAtPeriodEnd ? 'SI' : 'NO',
        subscription_event: payment.subscriptionEvents?.[0]?.eventType || '',
        account_created_iso: toIso(payment.account.createdAt),
      };
    });

    const transferRows = paymentRows.filter(
      (row) => row.method === 'BANK_TRANSFER',
    );

    const totalRevenue = paymentRows.reduce(
      (sum, row) => sum + Number(row.amount_clp || 0),
      0,
    );
    const bankRevenue = transferRows.reduce(
      (sum, row) => sum + Number(row.amount_clp || 0),
      0,
    );
    const flowRevenue = paymentRows
      .filter((row) => row.method === 'FLOW')
      .reduce((sum, row) => sum + Number(row.amount_clp || 0), 0);
    const manualRevenue = paymentRows
      .filter((row) => row.method === 'MANUAL')
      .reduce((sum, row) => sum + Number(row.amount_clp || 0), 0);

    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['NutriNet - Resumen Contable'],
      ['Generado el', toClDateTime(new Date())],
      [],
      ['Indicador', 'Valor'],
      ['Ventas totales (CLP)', totalRevenue],
      ['Pagos completados', paymentRows.length],
      ['Transferencias aceptadas', transferRows.length],
      ['Ingresos por transferencia (CLP)', bankRevenue],
      ['Ingresos por Flow (CLP)', flowRevenue],
      ['Ingresos manuales (CLP)', manualRevenue],
    ]);

    const salesSheet = XLSX.utils.json_to_sheet(paymentRows);
    const transfersSheet = XLSX.utils.json_to_sheet(transferRows);

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
    XLSX.utils.book_append_sheet(workbook, salesSheet, 'Ventas completadas');
    XLSX.utils.book_append_sheet(
      workbook,
      transfersSheet,
      'Transferencias aceptadas',
    );

    summarySheet['!cols'] = [{ wch: 32 }, { wch: 28 }];
    salesSheet['!cols'] = [
      { wch: 36 },
      { wch: 36 },
      { wch: 30 },
      { wch: 28 },
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 12 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
    ];
    transfersSheet['!cols'] = salesSheet['!cols'];

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return {
      buffer,
      filename: `nutrinet_contabilidad_${new Date().toISOString().slice(0, 10)}.xlsx`,
    };
  }

  // ─── Membership Status ────────────────────────────────────────────

  async getMembershipStatus(accountId: string) {
    const snapshot = await this.permissionsService.getAccessSnapshot(accountId);

    if (!snapshot) throw new NotFoundException('Cuenta no encontrada');

    const subscription = snapshot.subscription;
    const now = new Date();
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const [activePatients, monthlyConsultations, pdfUsage, aiUsage] =
      await Promise.all([
        this.prisma.patient.count({
          where: { nutritionist: { accountId }, status: 'Active' },
        }),
        this.prisma.consultation.count({
          where: {
            nutritionist: { accountId },
            date: { gte: startOfMonth },
          },
        }),
        this.planUsageService.getUsage(accountId, 'pdf.monthly.limit'),
        this.planUsageService.getUsage(accountId, 'ai.calls.limit'),
      ]);
    const daysRemaining = subscription?.endDate
      ? Math.ceil(
          (new Date(subscription.endDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    const nextPaymentAt =
      subscription?.endDate && Number(snapshot.currentPlan?.price || 0) > 0
        ? new Date(subscription.endDate).toISOString()
        : null;

    return {
      requiresPlanSelection: snapshot.requiresPlanSelection,
      accountPlan: snapshot.accountPlan,
      currentPlan: snapshot.currentPlan
        ? {
            id: snapshot.currentPlan.id,
            name: snapshot.currentPlan.name,
            slug: snapshot.currentPlan.slug,
            key:
              snapshot.currentPlan.key ||
              getMembershipPlanKey(snapshot.currentPlan),
            price: Number(snapshot.currentPlan.price),
            features: snapshot.currentPlan.features,
            entitlements: snapshot.currentPlan.entitlements,
          }
        : null,
      entitlements: snapshot.entitlements,
      usage: {
        patientsActive: activePatients,
        consultationsMonthly: monthlyConsultations,
        pdfMonthly: pdfUsage,
        aiMonthly: aiUsage,
      },
      billing: {
        nextPaymentAt,
        nextPaymentAmount:
          subscription && Number(snapshot.currentPlan?.price || 0) > 0
            ? Number(snapshot.currentPlan?.price || 0)
            : 0,
        currency: 'CLP',
      },
      subscription: subscription
        ? {
            ...subscription,
            startDate: subscription.startDate?.toISOString() ?? null,
            endDate: subscription.endDate?.toISOString() ?? null,
            canceledAt: subscription.canceledAt?.toISOString() ?? null,
            daysRemaining,
          }
        : null,
    };
  }

  // ─── Select Free Plan ─────────────────────────────────────────────

  async selectFreePlan(accountId: string, planId: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new BadRequestException('Plan no encontrado o inactivo');
    }

    if (Number(plan.price) !== 0) {
      throw new BadRequestException(
        'Este plan requiere pago. Usa el checkout de pago.',
      );
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          accountId,
          amount: 0,
          currency: plan.currency,
          status: PaymentStatus.COMPLETED,
          method: PaymentMethod.MANUAL,
          paidAt: startDate,
          metadata: {
            type: 'MEMBERSHIP_PLAN',
            source: 'FREE_PLAN_SELECTION',
            mock: true,
            planId: plan.id,
            planName: plan.name,
          },
        },
      });

      await this.upsertSubscription(tx, accountId, plan, startDate, endDate);
      await this.updateAccountPlan(tx, accountId, plan, endDate);
      await this.createSubscriptionEvent(
        tx,
        accountId,
        payment.id,
        'ACTIVATED',
        plan.id,
      );
      await this.upsertDailyMetric(tx, 0, startDate);

      const membershipStatus =
        await this.permissionsService.getAccessSnapshot(accountId);

      return {
        payment,
        plan: { id: plan.id, name: plan.name, slug: plan.slug },
        membershipStatus,
      };
    });
  }

  // ─── Membership Checkout (Mock or Real) ───────────────────────────

  async membershipCheckout(
    accountId: string,
    planId: string,
    payerEmail?: string,
  ) {
    void payerEmail;
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new BadRequestException('Plan no encontrado o inactivo');
    }

    const price = Number(plan.price);
    if (price === 0) {
      throw new BadRequestException(
        'Este plan es gratuito. Usa el endpoint de plan gratis.',
      );
    }

    // Calculate prorated credit from current subscription
    const credit = await this.calculateProratedCredit(accountId);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const chargeAmount = Math.max(0, price - credit);

    if (this.isMockMode()) {
      return this.mockCheckout(
        accountId,
        plan,
        startDate,
        endDate,
        chargeAmount,
        credit,
      );
    }

    // Real checkout is handled by FlowService through /payments/flow/checkout.
    return { mock: false, requiresProvider: true };
  }

  async prepareMembershipPayment(
    accountId: string,
    planId: string,
    discount?: { code: string; percent: number; type: string },
  ) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new BadRequestException('Plan no encontrado o inactivo');
    }

    const pricing = await this.calculateMembershipCharge(accountId, plan, {
      discount,
    });

    return this.prisma.payment.create({
      data: {
        accountId,
        amount: pricing.finalPrice,
        currency: plan.currency,
        status: PaymentStatus.PENDING,
        method: PaymentMethod.FLOW,
        metadata: {
          type: 'MEMBERSHIP_PLAN',
          provider: 'FLOW',
          mock: false,
          planId: plan.id,
          planName: plan.name,
          planSlug: plan.slug,
          fullPrice: pricing.price,
          proratedCredit: pricing.credit,
          chargedAmount: pricing.finalPrice,
          ...(pricing.discount
            ? {
                discountCode: pricing.discount.code,
                discountPercent: pricing.discount.discountPercent,
                discountType: pricing.discount.type,
              }
            : {}),
        },
      },
    });
  }

  async validateDiscount(accountId: string, planId: string, code: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new BadRequestException('Plan no encontrado o inactivo');
    }

    const pricing = await this.calculateMembershipCharge(accountId, plan, {
      discountCode: code,
    });

    if (!pricing.discount) {
      throw new BadRequestException('Código de descuento inválido.');
    }

    return {
      valid: true,
      code: pricing.discount.code,
      type: pricing.discount.type,
      discountPercent: pricing.discount.discountPercent,
      originalPrice: pricing.price,
      proratedCredit: pricing.credit,
      basePrice: pricing.basePrice,
      finalPrice: pricing.finalPrice,
      currency: plan.currency,
    };
  }

  private async calculateProratedCredit(accountId: string): Promise<number> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { accountId },
      include: { plan: true },
    });

    if (!subscription || !subscription.endDate || !subscription.plan) {
      return 0;
    }

    const now = new Date();
    const endDate = new Date(subscription.endDate);

    if (endDate <= now) return 0;

    const oldPrice = Number(subscription.plan.price);
    if (oldPrice <= 0) return 0;

    const daysRemaining = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysRemaining <= 0) return 0;

    // Daily rate of old plan * days remaining
    const dailyRate = oldPrice / 30;
    const credit = Math.round(dailyRate * daysRemaining);

    return credit;
  }

  private async calculateMembershipCharge(
    accountId: string,
    plan: { price: unknown; currency: string },
    options?: {
      discount?: { code: string; percent: number; type: string };
      discountCode?: string;
    },
  ) {
    const price = Number(plan.price);
    if (price === 0) {
      throw new BadRequestException(
        'Este plan es gratuito. Usa el endpoint de plan gratis.',
      );
    }

    const credit = await this.calculateProratedCredit(accountId);
    const basePrice = Math.max(0, price - credit);

    let discount = options?.discount;
    if (!discount && options?.discountCode) {
      const discountCode =
        await this.discountCodesService.validateAndGetDiscount(
          options.discountCode,
        );
      discount = {
        code: discountCode.code,
        percent: discountCode.discountPercent,
        type: discountCode.type,
      };
    }

    const finalPrice = discount
      ? Math.max(0, Math.round(basePrice * (1 - discount.percent / 100)))
      : basePrice;

    return {
      price,
      credit,
      basePrice,
      finalPrice,
      discount: discount
        ? {
            code: discount.code,
            discountPercent: discount.percent,
            type: discount.type,
          }
        : null,
    };
  }

  private async mockCheckout(
    accountId: string,
    plan: any,
    startDate: Date,
    endDate: Date,
    amount: number,
    credit: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          accountId,
          amount,
          currency: plan.currency,
          status: PaymentStatus.COMPLETED,
          method: PaymentMethod.FLOW,
          paidAt: startDate,
          metadata: {
            type: 'MEMBERSHIP_PLAN',
            source: 'MOCK_CHECKOUT',
            mock: true,
            provider: 'FLOW',
            planId: plan.id,
            planName: plan.name,
            planSlug: plan.slug,
            fullPrice: Number(plan.price),
            proratedCredit: credit,
            chargedAmount: amount,
          },
        },
      });

      await this.upsertSubscription(tx, accountId, plan, startDate, endDate);
      await this.updateAccountPlan(tx, accountId, plan, endDate);
      await this.createSubscriptionEvent(
        tx,
        accountId,
        payment.id,
        'UPGRADED',
        plan.id,
      );
      await this.upsertDailyMetric(tx, amount, startDate);

      return {
        mock: true,
        success: true,
        payment,
        proratedCredit: credit,
        chargedAmount: amount,
        redirectUrl: null,
      };
    });
  }

  // ─── Activate Membership from Payment (shared by mock/webhook/simulate) ──

  async activateMembershipFromPayment(paymentId: string, mpPaymentId?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.log(`Payment ${paymentId} already completed, skipping`);
      return { processed: false, reason: 'already_completed' };
    }

    const metadata = payment.metadata as any;
    const planId = metadata?.planId;
    const accountId = payment.accountId;

    if (!planId) {
      throw new BadRequestException('Payment metadata missing planId');
    }

    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: startDate,
          ...(mpPaymentId ? { transactionId: mpPaymentId } : {}),
        },
      });

      const discountCode =
        (metadata?.discountCode as string | undefined) ||
        (metadata?.discount?.code as string | undefined);

      if (discountCode) {
        await this.discountCodesService.markAsUsed(discountCode, accountId, tx);
      }

      await this.upsertSubscription(tx, accountId, plan, startDate, endDate);
      await this.updateAccountPlan(tx, accountId, plan, endDate);
      await tx.account.update({
        where: { id: accountId },
        data: { lastLoginAt: new Date() },
      });
      await this.createSubscriptionEvent(
        tx,
        accountId,
        paymentId,
        'ACTIVATED',
        plan.id,
      );
      await this.upsertDailyMetric(tx, Number(payment.amount), startDate);

      return { processed: true, status: 'COMPLETED' };
    });
  }

  // ─── Cancel / Resume ──────────────────────────────────────────────

  async cancelSubscription(accountId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { accountId },
    });

    if (!subscription) {
      throw new NotFoundException('No tienes una suscripción activa');
    }

    const updated = await this.prisma.subscription.update({
      where: { accountId },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        eventType: 'CANCEL_AT_PERIOD_END',
        metadata: { canceledAt: new Date().toISOString() },
        createdAt: new Date(),
      },
    });

    return { success: true, endDate: updated.endDate };
  }

  async resumeSubscription(accountId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { accountId },
    });

    if (!subscription) {
      throw new NotFoundException('No tienes una suscripción');
    }

    const updated = await this.prisma.subscription.update({
      where: { accountId },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        eventType: 'RESUMED',
        metadata: { resumedAt: new Date().toISOString() },
        createdAt: new Date(),
      },
    });

    return { success: true, endDate: updated.endDate };
  }

  // ─── Manual Bank Transfer Payment ─────────────────────────────────

  async createManualTransferPayment(
    accountId: string,
    planId: string,
    nutritionistEmail?: string,
    nutritionistName?: string,
    discountCode?: string,
    amount?: number,
  ) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan no encontrado o inactivo');
    }

    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { nutritionist: true },
    });

    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    const pricing = await this.calculateMembershipCharge(accountId, plan, {
      discountCode,
    });
    const paymentAmount = discountCode
      ? pricing.finalPrice
      : (amount ?? pricing.finalPrice);

    const payment = await this.prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          accountId,
          amount: paymentAmount,
          currency: plan.currency,
          status: PaymentStatus.PENDING,
          method: PaymentMethod.BANK_TRANSFER,
          metadata: {
            type: 'MEMBERSHIP_PLAN',
            provider: 'MANUAL_TRANSFER',
            planId: plan.id,
            planName: plan.name,
            planSlug: plan.slug,
            fullPrice: pricing.price,
            proratedCredit: pricing.credit,
            chargedAmount: paymentAmount,
            ...(pricing.discount
              ? {
                  discountCode: pricing.discount.code,
                  discountPercent: pricing.discount.discountPercent,
                  discountType: pricing.discount.type,
                }
              : {}),
            nutritionistEmail: nutritionistEmail || account.email,
            nutritionistName:
              nutritionistName ||
              account.nutritionist?.fullName ||
              'No especificado',
            requestedAt: new Date().toISOString(),
          },
        },
      });

      return createdPayment;
    });

    const nameForNotification =
      nutritionistName || account.nutritionist?.fullName || 'No especificado';
    const emailForNotification = nutritionistEmail || account.email;

    this.whatsappService
      .notifyOwnerOfTransfer({
        nutritionistName: nameForNotification,
        nutritionistEmail: emailForNotification,
        planName: plan.name,
        amount: paymentAmount,
        paymentId: payment.id,
      })
      .catch((err) => {
        this.logger.error(
          '[Payments] Error enviando notificación WhatsApp:',
          err,
        );
      });

    this.mailService
      .sendTransferNotification({
        nutritionistName: nameForNotification,
        nutritionistEmail: emailForNotification,
        planName: plan.name,
        amount: paymentAmount,
        paymentId: payment.id,
        source: 'payments.manual-transfer',
      })
      .catch((err) => {
        this.logger.error('[Payments] Error enviando notificación email:', err);
      });

    return {
      paymentId: payment.id,
      plan: {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        price: pricing.price,
        currency: plan.currency,
      },
      status: 'PENDING',
      message:
        'Solicitud de pago registrada. Un administrador revisará tu transferencia.',
    };
  }

  // ─── Get Bank Transfer Data ────────────────────────────────────────

  getBankTransferData() {
    return {
      bankName: this.configService.get<string>('BANK_NAME') || 'Banco de Chile',
      accountType:
        this.configService.get<string>('BANK_ACCOUNT_TYPE') ||
        'Cuenta Corriente',
      accountNumber:
        this.configService.get<string>('BANK_ACCOUNT_NUMBER') || '',
      rut: this.configService.get<string>('BANK_RUT') || '',
      email: this.configService.get<string>('BANK_EMAIL') || '',
      beneficiary:
        this.configService.get<string>('BANK_BENEFICIARY') || 'NutriNet SpA',
    };
  }

  // ─── Simulate Payment (Admin) ─────────────────────────────────────

  async simulatePayment(data: {
    userId: string;
    planId: string;
    amount?: number;
    method: PaymentMethod;
  }) {
    const { userId, planId, method } = data;

    const user = await this.prisma.account.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    const amount = data.amount ?? Number(plan.price);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          accountId: userId,
          amount,
          currency: plan.currency,
          status: PaymentStatus.COMPLETED,
          method,
          paidAt: startDate,
          metadata: {
            type: 'MEMBERSHIP_PLAN',
            source: 'ADMIN_SIMULATION',
            isSimulation: true,
            adminTriggered: true,
            mock: true,
            planId: plan.id,
            planName: plan.name,
            planSlug: plan.slug,
          },
        },
      });

      await this.upsertSubscription(tx, userId, plan, startDate, endDate);
      await this.updateAccountPlan(tx, userId, plan, endDate);
      await tx.account.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      });
      await this.createSubscriptionEvent(
        tx,
        userId,
        payment.id,
        'ACTIVATED',
        plan.id,
      );
      await this.upsertDailyMetric(tx, amount, startDate);

      return { payment, subscription: true };
    });
  }

  async approvePayment(paymentId: string) {
    const result = await this.activateMembershipFromPayment(paymentId);

    if (result.processed) {
      await this.sendPaymentStatusEmail(paymentId, 'approved');
    }

    return result;
  }

  async rejectPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        account: {
          select: {
            email: true,
            nutritionist: { select: { fullName: true } },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      return { processed: false, reason: 'not_pending' };
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED },
    });

    await this.sendPaymentStatusEmail(paymentId, 'rejected', payment.account);

    return { processed: true, status: 'FAILED' };
  }

  async devSwitchPlan(accountId: string, planId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { role: true },
    });

    if (account?.role !== 'NUTRITIONIST_DEVELOPER') {
      throw new UnauthorizedException(
        'Solo el modo developer puede cambiar planes así',
      );
    }

    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id: planId, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan no encontrado o inactivo');
    }

    const startDate = new Date();
    const days = this.getPlanDurationDays(plan.billingPeriod);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    return this.prisma.$transaction(async (tx) => {
      await this.upsertSubscription(tx, accountId, plan, startDate, endDate);
      await this.updateAccountPlan(tx, accountId, plan, endDate);
      await this.createSubscriptionEvent(
        tx,
        accountId,
        null,
        'DEV_SWITCHED',
        plan.id,
      );

      const membershipStatus =
        await this.permissionsService.getAccessSnapshot(accountId);

      return {
        success: true,
        subscription: true,
        plan: { id: plan.id, name: plan.name, slug: plan.slug },
        membershipStatus,
      };
    });
  }

  private async sendPaymentStatusEmail(
    paymentId: string,
    status: 'approved' | 'rejected',
    accountOverride?: {
      email: string;
      nutritionist?: { fullName: string | null } | null;
    },
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        account: {
          select: {
            email: true,
            nutritionist: { select: { fullName: true } },
          },
        },
      },
    });

    if (!payment) return;

    const metadata = (payment.metadata as Record<string, any>) || {};
    const planName = metadata.planName || 'tu plan';
    const recipient = accountOverride || payment.account;
    const fullName = recipient.nutritionist?.fullName || undefined;

    if (status === 'approved') {
      await this.mailService.sendAnnouncementEmail({
        email: recipient.email,
        name: fullName,
        title: `Tu plan fue actualizado a ${planName}`,
        message:
          `Tu pago fue aprobado y tu plan ya quedó activo en NutriNet.\n\n` +
          `Cierra sesión y vuelve a ingresar para ver los cambios.`,
      });
      return;
    }

    await this.mailService.sendAnnouncementEmail({
      email: recipient.email,
      name: fullName,
      title: 'Tu pago fue rechazado',
      message:
        `No pudimos aprobar tu pago para ${planName}.\n\n` +
        `Si crees que esto es un error, vuelve a registrar la transferencia o contacta al equipo de soporte.`,
    });
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private upsertSubscription(
    tx: any,
    accountId: string,
    plan: any,
    startDate: Date,
    endDate: Date,
  ) {
    return tx.subscription.upsert({
      where: { accountId },
      update: {
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        updatedAt: startDate,
      },
      create: {
        accountId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
      },
    });
  }

  private updateAccountPlan(
    tx: any,
    accountId: string,
    plan: any,
    endDate: Date,
  ) {
    const accountPlan = resolveAccountPlanFromMembershipPlan(
      plan.slug || plan.name,
    );

    return tx.account.update({
      where: { id: accountId },
      data: {
        plan: accountPlan,
        subscriptionEndsAt: endDate,
        membershipSelectedAt: new Date(),
      },
    });
  }

  private getPlanDurationDays(billingPeriod?: string | null) {
    const normalized = (billingPeriod || 'monthly').toLowerCase();

    if (normalized.includes('year') || normalized.includes('annual')) {
      return 365;
    }

    return 30;
  }

  private async createSubscriptionEvent(
    tx: any,
    accountId: string,
    paymentId: string | null,
    eventType: string,
    planId: string,
  ) {
    const subscription = await tx.subscription.findUnique({
      where: { accountId },
    });
    if (!subscription) return;

    return tx.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        eventType,
        paymentId: paymentId || undefined,
        newPlanId: planId,
        metadata: { source: 'payments-service', eventType },
      },
    });
  }

  private async upsertDailyMetric(tx: any, amount: number, startDate: Date) {
    const today = new Date(startDate);
    today.setHours(0, 0, 0, 0);

    await tx.dailyMetric.upsert({
      where: { date: today },
      update: { totalRevenue: { increment: amount } },
      create: {
        date: today,
        totalRevenue: amount,
        activeSubscriptions: 1,
        totalUsers: await tx.account.count(),
      },
    });
  }
}
