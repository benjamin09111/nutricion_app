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
  SubscriptionPlan,
} from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly permissionsService: PermissionsService,
    private readonly planUsageService: PlanUsageService,
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

    // Real Mercado Pago flow
    return { mock: false, requiresProvider: true };
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
          method: PaymentMethod.MERCADOPAGO,
          paidAt: startDate,
          metadata: {
            type: 'MEMBERSHIP_PLAN',
            source: 'MOCK_CHECKOUT',
            mock: true,
            provider: 'MERCADOPAGO',
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

      await this.upsertSubscription(tx, accountId, plan, startDate, endDate);
      await this.updateAccountPlan(tx, accountId, plan, endDate);
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
      const subscription = await this.upsertSubscription(
        tx,
        accountId,
        plan,
        startDate,
        endDate,
      );
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

  // ─── Private Helpers ──────────────────────────────────────────────

  private async upsertSubscription(
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

  private async updateAccountPlan(
    tx: any,
    accountId: string,
    plan: any,
    endDate: Date,
  ) {
    const accountPlan: SubscriptionPlan =
      Number(plan.price) === 0 ? SubscriptionPlan.FREE : SubscriptionPlan.PRO;

    return tx.account.update({
      where: { id: accountId },
      data: {
        plan: accountPlan,
        subscriptionEndsAt: endDate,
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
