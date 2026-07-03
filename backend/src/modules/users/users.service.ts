import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveRequiredUrl } from '../../common/utils/runtime-url.util';
const normalizeCalendarTimeZone = (timeZone?: string | null) =>
  !timeZone || timeZone === 'UTC' ? 'America/Santiago' : timeZone;
import {
  AccountStatus,
  SubscriptionPlan,
  UserRole,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { DiscountCodesService } from '../discount-codes/discount-codes.service';
import { ADMIN_ROLES } from '../permissions/permissions.constants';
import { normalizeMembershipPlanKey } from '../memberships/plan-entitlements';
import { resolveAccountPlanFromMembershipPlan } from '../memberships/account-plan';

const NUTRITIONIST_ROLES = ['NUTRITIONIST', 'NUTRITIONIST_DEVELOPER'] as const;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly discountCodesService: DiscountCodesService,
  ) {}

  /**
   * RULE: The backend must handle all heavy logic, filtering, and calculations.
   * The frontend should only receive prepared data and display it immediately.
   */
  async findAll(
    role?: any,
    search?: string,
    visibility?: 'all' | 'public' | 'hidden',
    plan?: string,
    status?: string,
    payment?: string,
    verification?: string,
    page?: number,
    limit?: number,
  ) {
    const where: any = {
      status: { not: 'DELETED' as any },
    };

    const normalizedRole =
      typeof role === 'string' && role.includes(',')
        ? role
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : role;

    if (normalizedRole) {
      if (Array.isArray(normalizedRole)) {
        where.role = { in: normalizedRole };
      } else if (normalizedRole === 'ALL_ADMINS') {
        where.role = { in: [...ADMIN_ROLES] };
      } else if (normalizedRole === 'ALL_ADMIN_ACCOUNTS') {
        where.role = { in: [...ADMIN_ROLES] };
      } else if (normalizedRole === 'ALL_MANAGEMENT_ACCOUNTS') {
        where.role = { in: [...ADMIN_ROLES, 'NUTRITIONIST_DEVELOPER'] };
      } else if (normalizedRole === 'ALL_NUTRITIONISTS') {
        where.role = { in: [...NUTRITIONIST_ROLES] };
      } else {
        where.role = normalizedRole;
      }
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        {
          nutritionist: { fullName: { contains: search, mode: 'insensitive' } },
        },
      ];
    }

    if (visibility === 'public') {
      where.nutritionist = {
        ...(where.nutritionist || {}),
        publicProfileEnabled: true,
      };
    } else if (visibility === 'hidden') {
      where.nutritionist = {
        ...(where.nutritionist || {}),
        publicProfileEnabled: false,
      };
    }

    if (plan && plan !== 'all') {
      const normalizedPlan = plan.trim().toLowerCase();
      if (['free', 'pro', 'enterprise'].includes(normalizedPlan)) {
        where.plan = normalizedPlan.toUpperCase() as SubscriptionPlan;
      } else {
        where.AND = [
          ...(where.AND || []),
          {
            subscription: {
              is: {
                plan: {
                  is: {
                    slug: normalizedPlan,
                  },
                },
              },
            },
          },
        ];
      }
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (payment && payment !== 'all') {
      if (payment === 'free') {
        where.plan = 'FREE';
      } else if (payment === 'paid') {
        where.AND = [
          ...(where.AND || []),
          {
            subscription: {
              is: {
                status: { in: ['ACTIVE', 'TRIALING'] },
                endDate: { gt: new Date() },
              },
            },
          },
        ];
      } else if (payment === 'expired') {
        where.AND = [
          ...(where.AND || []),
          {
            subscription: {
              is: {
                endDate: { lte: new Date() },
              },
            },
          },
        ];
      } else if (payment === 'none') {
        where.AND = [
          ...(where.AND || []),
          {
            subscription: { is: null },
          },
        ];
      }
    }

    if (verification === 'pending_transfer') {
      where.AND = [
        ...(where.AND || []),
        {
          payments: {
            some: {
              status: 'PENDING',
              method: 'BANK_TRANSFER',
            },
          },
        },
      ];
    }

    const normalizedPage = Math.max(1, Math.trunc(page || 1));
    const normalizedLimit = Math.min(50, Math.max(1, Math.trunc(limit || 10)));
    const hasPagination = page !== undefined || limit !== undefined;

    if (hasPagination) {
      const total = await this.prisma.account.count({ where });

      const totalPages = Math.max(1, Math.ceil(total / normalizedLimit));
      const effectivePage = Math.min(normalizedPage, totalPages);
      const skip = (effectivePage - 1) * normalizedLimit;

      const accounts = await this.prisma.account.findMany({
        where,
        include: {
          nutritionist: {
            include: {
              _count: {
                select: { patients: true },
              },
            },
          },
          payments: {
            where: {
              status: 'PENDING',
              method: 'BANK_TRANSFER',
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
            },
          },
          subscription: {
            include: {
              plan: true,
            },
          },
        },
        orderBy: [
          { lastLoginAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
        ],
        skip,
        take: normalizedLimit,
      });

      const items = accounts.map((acc) => this.mapAccount(acc));

      return {
        items,
        page: effectivePage,
        limit: normalizedLimit,
        total,
        totalPages,
      };
    }

    const accounts = await this.prisma.account.findMany({
      where,
      include: {
        nutritionist: {
          include: {
            _count: {
              select: { patients: true },
            },
          },
        },
        payments: {
          where: {
            status: 'PENDING',
            method: 'BANK_TRANSFER',
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: [
        { lastLoginAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
    });

    // Backend optimizes the data structure before sending to frontend
    return accounts.map((acc) => this.mapAccount(acc));
  }

  private mapAccount(acc: any) {
    const subscriptionPlan = acc.subscription?.plan || null;
    const subscriptionEndsAt =
      acc.subscription?.endDate || acc.subscriptionEndsAt;
    const paymentState = this.resolvePaymentState(
      acc.plan,
      subscriptionPlan?.price,
      subscriptionEndsAt,
    );

    return {
      id: acc.id,
      email: acc.email,
      role: acc.role,
      rut: acc.rut || null,
      status: acc.status,
      plan: acc.plan,
      subscriptionEndsAt: acc.subscriptionEndsAt,
      createdAt: acc.createdAt,
      lastLogin: acc.lastLoginAt || acc.updatedAt,
      paymentState,
      membershipPlan: subscriptionPlan
        ? {
            id: subscriptionPlan.id,
            name: subscriptionPlan.name,
            slug: subscriptionPlan.slug,
            price: Number(subscriptionPlan.price),
            billingPeriod: subscriptionPlan.billingPeriod,
            isActive: subscriptionPlan.isActive,
          }
        : null,
      fullName:
        acc.nutritionist?.fullName ||
        (acc.role === 'ADMIN_MASTER'
          ? 'Admin Master'
          : acc.role === 'ADMIN_GENERAL'
            ? 'Admin General'
            : acc.role === 'ADMIN'
              ? 'Administrador (Legado)'
              : String(acc.role) === 'WORKER'
                ? 'Worker'
                : acc.role === 'NUTRITIONIST_DEVELOPER'
                  ? 'Nutricionista Developer'
                  : acc.email.split('@')[0]),
      patientCount: acc.nutritionist?._count?.patients || 0,
      publicSlug: acc.nutritionist?.publicSlug || null,
      publicProfileEnabled: acc.nutritionist?.publicProfileEnabled ?? false,
      specialty: acc.nutritionist?.specialty || null,
      consultationMode: acc.nutritionist?.consultationMode || null,
      location: acc.nutritionist?.location || null,
      avatarUrl: acc.nutritionist?.avatarUrl || null,
      verification: acc.payments?.length ? 'pending_transfer' : 'none',
    };
  }

  private resolvePaymentState(
    accountPlan: SubscriptionPlan,
    planPrice?: unknown,
    subscriptionEndsAt?: Date | null,
  ): 'free' | 'paid' | 'expired' | 'none' {
    const price =
      typeof planPrice === 'number' ? planPrice : Number(planPrice || 0);

    if (accountPlan === 'FREE' || price === 0) {
      return 'free';
    }

    if (!subscriptionEndsAt) {
      return 'none';
    }

    return new Date(subscriptionEndsAt).getTime() > Date.now()
      ? 'paid'
      : 'expired';
  }

  async findOne(id: string) {
    return this.prisma.account.findUnique({
      where: { id },
      include: { nutritionist: true },
    });
  }

  async sendTransferNotification(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: {
        email: true,
        plan: true,
        nutritionist: {
          select: {
            fullName: true,
          },
        },
        payments: {
          where: {
            status: PaymentStatus.PENDING,
            method: PaymentMethod.BANK_TRANSFER,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            amount: true,
            metadata: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const latestPayment = account.payments[0];
    const metadata = (latestPayment?.metadata as Record<string, any>) || {};

    await this.mailService.sendTransferNotification({
      nutritionistName: account.nutritionist?.fullName || 'No especificado',
      nutritionistEmail: account.email,
      planName: metadata.planName || account.plan,
      amount: latestPayment ? Number(latestPayment.amount) : undefined,
      paymentId: latestPayment?.id,
      source: 'users.admin-panel',
    });

    return {
      success: true,
      message: 'Aviso de transferencia enviado a contacto@nutrinet.cl',
    };
  }

  async update(
    id: string,
    data: {
      status?: AccountStatus;
      plan?: SubscriptionPlan;
      subscriptionEndsAt?: Date;
      role?: UserRole;
    },
  ) {
    return this.prisma.account.update({
      where: { id },
      data: {
        status: data.status,
        plan: data.plan,
        subscriptionEndsAt: data.subscriptionEndsAt,
        role: data.role,
      },
    });
  }

  /**
   * Update nutritionist settings (stored as JSON)
   */
  async updateMySettings(accountId: string, settingsData: any) {
    const nutritionist = await this.prisma.nutritionist.findUnique({
      where: { accountId },
    });

    if (!nutritionist) {
      throw new Error('Perfil de nutricionista no encontrado');
    }

    const currentSettings =
      (nutritionist.settings as Record<string, any>) || {};
    const newSettings = { ...currentSettings, ...settingsData };
    const publicProfileEnabled = settingsData.publicProfileEnabled === true;
    const publicSlug =
      typeof settingsData.publicSlug === 'string' &&
      settingsData.publicSlug.trim()
        ? settingsData.publicSlug.trim()
        : nutritionist.publicSlug ||
          this.generateSlug(nutritionist.fullName, nutritionist.id);

    return this.prisma.nutritionist.update({
      where: { accountId },
      data: {
        settings: newSettings,
        publicSlug,
        publicProfileEnabled,
        headline:
          typeof settingsData.headline === 'string'
            ? settingsData.headline.trim() || null
            : nutritionist.headline,
        bio:
          typeof settingsData.bio === 'string'
            ? settingsData.bio.trim() || null
            : nutritionist.bio,
        consultationMode:
          typeof settingsData.consultationMode === 'string' &&
          settingsData.consultationMode.trim()
            ? settingsData.consultationMode.trim()
            : nutritionist.consultationMode || 'online',
        location:
          typeof settingsData.location === 'string'
            ? settingsData.location.trim() || null
            : nutritionist.location,
      },
    });
  }

  async updatePublicProfileVisibility(accountId: string, enabled: boolean) {
    const nutritionist = await this.prisma.nutritionist.findUnique({
      where: { accountId },
      select: {
        accountId: true,
        settings: true,
        publicSlug: true,
        fullName: true,
        account: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!nutritionist) {
      throw new Error('Perfil de nutricionista no encontrado');
    }

    const currentSettings =
      (nutritionist.settings as Record<string, any>) || {};

    const updatedNutritionist = await this.prisma.nutritionist.update({
      where: { accountId },
      data: {
        publicProfileEnabled: enabled,
        settings: {
          ...currentSettings,
          publicProfileEnabled: enabled,
        },
      },
      select: {
        id: true,
        accountId: true,
        publicSlug: true,
        publicProfileEnabled: true,
      },
    });

    const title = enabled
      ? 'Tu perfil público volvió a estar visible'
      : 'Tu perfil público fue ocultado';
    const message = enabled
      ? 'Tu perfil ya aparece nuevamente en el portal público de NutriNet.'
      : 'Un administrador ocultó tu perfil del portal público. Tu acceso privado sigue activo.';

    await this.prisma.notification.create({
      data: {
        accountId,
        title,
        message,
        type: enabled ? 'success' : 'warning',
        link: enabled
          ? `/nutricionistas/${nutritionist.publicSlug || this.generateSlug(nutritionist.fullName, accountId)}`
          : '/dashboard/configuraciones',
        metadata: {
          source: 'admin-portal',
          event: enabled ? 'public-profile-enabled' : 'public-profile-disabled',
          email: nutritionist.account.email,
        },
      },
    });

    const frontendUrl = resolveRequiredUrl(
      process.env.FRONTEND_URL,
      process.env.NEXT_PUBLIC_FRONTEND_URL,
    );
    const publicUrl = `${frontendUrl}/nutricionistas/${nutritionist.publicSlug || this.generateSlug(nutritionist.fullName, accountId)}`;

    this.mailService
      .sendPublicProfileVisibilityEmail({
        email: nutritionist.account.email,
        fullName: nutritionist.fullName,
        enabled,
        publicUrl: enabled ? publicUrl : undefined,
      })
      .catch((error) => {
        this.logger.error(
          `No se pudo enviar el correo de visibilidad pública para ${nutritionist.account.email}`,
          error instanceof Error ? error.stack : String(error),
        );
      });

    return updatedNutritionist;
  }

  /**
   * Update user's subscription plan
   */
  async updatePlan(
    userId: string,
    plan: SubscriptionPlan,
    days?: number,
    recordPayment = false,
  ) {
    const normalizedPlan = normalizeMembershipPlanKey(String(plan));
    const accountForPayment = await this.prisma.account.findUnique({
      where: { id: userId },
      select: {
        email: true,
        nutritionist: { select: { fullName: true } },
      },
    });

    if (recordPayment && !accountForPayment) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    return this.prisma.$transaction(async (tx) => {
      if (normalizedPlan === 'free') {
        const subscriptions = await tx.subscription.findMany({
          where: { accountId: userId },
          select: { id: true },
        });

        if (subscriptions.length > 0) {
          await tx.subscriptionEvent.deleteMany({
            where: {
              subscriptionId: {
                in: subscriptions.map((subscription) => subscription.id),
              },
            },
          });
        }

        await tx.subscription.deleteMany({ where: { accountId: userId } });

        if (accountForPayment?.email) {
          void this.mailService
            .sendAnnouncementEmail({
              email: accountForPayment.email,
              name: accountForPayment.nutritionist?.fullName,
              title: 'Tu plan fue actualizado a Gratuito',
              message:
                `Hola${accountForPayment.nutritionist?.fullName ? ` ${accountForPayment.nutritionist.fullName}` : ''},\n\n` +
                `Tu plan en NutriNet fue actualizado a Plan Gratuito.\n` +
                `Para ver los cambios, cierra sesión y vuelve a iniciar sesión.\n\n` +
                `Gracias por confiar en NutriNet.`,
            })
            .catch((error) => {
              this.logger.error(
                `No se pudo enviar el correo de cambio de plan a ${accountForPayment.email}`,
                error instanceof Error ? error.stack : String(error),
              );
            });
        }

        return tx.account.update({
          where: { id: userId },
          data: {
            plan: SubscriptionPlan.FREE,
            subscriptionEndsAt: null,
            membershipSelectedAt: new Date(),
            lastLoginAt: new Date(),
          },
        });
      }

      const membershipPlans = await tx.membershipPlan.findMany({
        where: { isActive: true },
      });
      const membershipPlan = membershipPlans.find((membership) => {
        const membershipKey = normalizeMembershipPlanKey(
          membership.slug || membership.name || '',
        );
        return membershipKey === normalizedPlan;
      });

      if (!membershipPlan) {
        throw new Error('Plan de membresía no encontrado');
      }

      const planPrice = Number(membershipPlan.price);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (days && days > 0 ? days : 30));
      const shouldRecordPayment = recordPayment && planPrice > 0;

      const accountPlan = resolveAccountPlanFromMembershipPlan(
        membershipPlan.slug || membershipPlan.name,
      );

      const subscription = await tx.subscription.upsert({
        where: { accountId: userId },
        update: {
          planId: membershipPlan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate,
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
        create: {
          accountId: userId,
          planId: membershipPlan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate,
        },
      });

      const pendingTransfer = await tx.payment.findFirst({
        where: {
          accountId: userId,
          status: PaymentStatus.PENDING,
          method: PaymentMethod.BANK_TRANSFER,
        },
        orderBy: { createdAt: 'desc' },
      });

      const upsertDailyMetric = async (amount: number) => {
        const today = new Date();
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
      };

      let paymentId: string | null = pendingTransfer?.id || null;

      if (pendingTransfer) {
        const discountCode =
          (pendingTransfer.metadata as Record<string, any> | null)
            ?.discountCode ||
          (pendingTransfer.metadata as Record<string, any> | null)?.discount
            ?.code;

        await tx.payment.update({
          where: { id: pendingTransfer.id },
          data: {
            status: PaymentStatus.COMPLETED,
            paidAt: new Date(),
            metadata: {
              ...(pendingTransfer.metadata as Record<string, any>),
              approvedByAdmin: true,
              approvedAt: new Date().toISOString(),
              approvalSource: 'users.updatePlan',
            },
          },
        });

        if (discountCode) {
          await this.discountCodesService.markAsUsed(discountCode, userId, tx);
        }

        await upsertDailyMetric(Number(pendingTransfer.amount));
      } else if (shouldRecordPayment) {
        const createdPayment = await tx.payment.create({
          data: {
            accountId: userId,
            amount: planPrice,
            currency: membershipPlan.currency,
            status: PaymentStatus.COMPLETED,
            method: PaymentMethod.BANK_TRANSFER,
            paidAt: new Date(),
            metadata: {
              type: 'MEMBERSHIP_PLAN',
              source: 'ADMIN_PLAN_CHANGE',
              adminConfirmed: true,
              approvedByAdmin: true,
              approvedAt: new Date().toISOString(),
              planId: membershipPlan.id,
              planName: membershipPlan.name,
              planSlug: membershipPlan.slug,
              fullPrice: planPrice,
              chargedAmount: planPrice,
              nutritionistEmail: accountForPayment?.email,
              nutritionistName:
                accountForPayment?.nutritionist?.fullName || 'No especificado',
            },
          },
        });

        paymentId = createdPayment.id;
        await upsertDailyMetric(planPrice);
      }

      if (paymentId) {
        await tx.subscriptionEvent.create({
          data: {
            subscriptionId: subscription.id,
            eventType: 'ACTIVATED',
            paymentId,
            newPlanId: membershipPlan.id,
            metadata: {
              source: 'users.updatePlan',
              recordPayment: shouldRecordPayment || Boolean(pendingTransfer),
            },
          },
        });
      }

      if (accountForPayment?.email) {
        const planLabel = accountPlan;
        void this.mailService
          .sendAnnouncementEmail({
            email: accountForPayment.email,
            name: accountForPayment.nutritionist?.fullName,
            title: `Tu plan fue actualizado a ${planLabel}`,
            message:
              `Hola${accountForPayment.nutritionist?.fullName ? ` ${accountForPayment.nutritionist.fullName}` : ''},\n\n` +
              `Tu plan en NutriNet fue actualizado a ${planLabel}.\n` +
              `Para ver los cambios, cierra sesión y vuelve a iniciar sesión.\n\n` +
              `Gracias por confiar en NutriNet.`,
          })
          .catch((error) => {
            this.logger.error(
              `No se pudo enviar el correo de cambio de plan a ${accountForPayment.email}`,
              error instanceof Error ? error.stack : String(error),
            );
          });
      }

      return tx.account.update({
        where: { id: userId },
        data: {
          plan: accountPlan,
          subscriptionEndsAt: endDate,
          membershipSelectedAt: new Date(),
          lastLoginAt: new Date(),
        },
      });
    });
  }

  /**
   * Reset all unpaid users to FREE plan
   * Criteria: subscriptionEndsAt is in the past or null, and plan is not FREE
   */
  async resetUnpaidPlans() {
    const now = new Date();

    const result = await this.prisma.account.updateMany({
      where: {
        role: { in: [...NUTRITIONIST_ROLES] },
        plan: { not: 'FREE' },
        OR: [{ subscriptionEndsAt: null }, { subscriptionEndsAt: { lt: now } }],
      },
      data: {
        plan: 'FREE',
        subscriptionEndsAt: null,
      },
    });

    return {
      updatedCount: result.count,
      message: `${result.count} usuarios fueron cambiados a plan FREE`,
    };
  }
  /**
   * Delete account permanently.
   * Removes dependent payment/subscription records first, then the account.
   */
  async hardDelete(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!account) return;

    const [payments, subscription] = await Promise.all([
      this.prisma.payment.findMany({
        where: { accountId: id },
        select: { id: true },
      }),
      this.prisma.subscription.findUnique({
        where: { accountId: id },
        select: { id: true },
      }),
    ]);

    const paymentIds = payments.map((payment) => payment.id);
    const subscriptionId = subscription?.id;

    return this.prisma.$transaction(async (tx) => {
      if (subscriptionId) {
        await tx.subscriptionEvent.deleteMany({
          where: { subscriptionId },
        });
      }

      if (paymentIds.length > 0) {
        await tx.subscriptionEvent.deleteMany({
          where: { paymentId: { in: paymentIds } },
        });

        await tx.payment.deleteMany({
          where: { accountId: id },
        });
      }

      if (subscriptionId) {
        await tx.subscription.deleteMany({
          where: { accountId: id },
        });
      }

      await tx.account.delete({
        where: { id },
      });

      return { success: true, message: 'Cuenta eliminada permanentemente' };
    });
  }

  /**
   * Count total number of nutritionists
   */
  async countNutritionists() {
    return this.prisma.account.count({
      where: {
        role: { in: [...NUTRITIONIST_ROLES] },
        status: { not: 'DELETED' as any },
      },
    });
  }

  /**
   * List public nutritionists for directory
   */
  async listPublicNutritionists(filters: {
    search?: string;
    specialty?: string;
    mode?: string;
    location?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, specialty, mode, location } = filters;
    const page = Math.max(1, Math.trunc(filters.page || 1));
    const limit = Math.min(24, Math.max(1, Math.trunc(filters.limit || 12)));
    const skip = (page - 1) * limit;

    const where: any = {
      account: {
        role: { in: [...NUTRITIONIST_ROLES] },
        status: 'ACTIVE',
      },
      publicProfileEnabled: true,
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { specialty: { contains: search, mode: 'insensitive' } },
        { headline: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (specialty) {
      where.specialty = { contains: specialty, mode: 'insensitive' };
    }

    if (mode) {
      where.consultationMode = mode;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    const nutritionists = await this.prisma.nutritionist.findMany({
      where,
      select: {
        id: true,
        publicSlug: true,
        fullName: true,
        specialty: true,
        phone: true,
        avatarUrl: true,
        headline: true,
        bio: true,
        consultationMode: true,
        location: true,
        publicProfileEnabled: true,
        settings: true,
      },
      orderBy: { fullName: 'asc' },
      skip,
      take: limit,
    });

    const total = await this.prisma.nutritionist.count({ where });

    return {
      nutritionists: nutritionists.map((n) => this.sanitizePublicProfile(n)),
      total,
      page,
      limit,
      lastPage: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /**
   * Get public nutritionist by slug
   */
  async resolvePublicNutritionistBySlug(slug: string) {
    const nutritionist = await this.prisma.nutritionist.findUnique({
      where: { publicSlug: slug },
      select: {
        id: true,
        publicSlug: true,
        fullName: true,
        specialty: true,
        professionalId: true,
        phone: true,
        avatarUrl: true,
        headline: true,
        bio: true,
        consultationMode: true,
        location: true,
        publicProfileEnabled: true,
        settings: true,
        account: {
          select: {
            role: true,
            status: true,
            email: true,
          },
        },
      },
    });

    if (!nutritionist) {
      return { status: 'missing' as const, profile: null };
    }

    if (
      !NUTRITIONIST_ROLES.includes(nutritionist.account.role as any) ||
      nutritionist.account.status !== 'ACTIVE'
    ) {
      return { status: 'missing' as const, profile: null };
    }

    const publicProfile = this.sanitizePublicProfile(nutritionist);

    if (!publicProfile.isPublic) {
      return { status: 'gone' as const, profile: null };
    }

    return { status: 'ok' as const, profile: publicProfile };
  }

  async getPublicNutritionistBySlug(slug: string) {
    const result = await this.resolvePublicNutritionistBySlug(slug);
    return result.profile;
  }

  /**
   * Get nutritionist availability for public booking
   */
  async getNutritionistAvailability(nutritionistId: string) {
    const calendar = await this.prisma.appointmentCalendar.findUnique({
      where: { nutritionistId },
      include: {
        timeSlots: {
          orderBy: [{ dayOfWeek: 'asc' }, { hour: 'asc' }],
        },
      },
    });

    if (!calendar) {
      return { hasCalendar: false, slots: [] };
    }

    const schedule: Record<string, Record<number, { available: boolean }>> = {};

    for (let day = 0; day < 7; day++) {
      schedule[day] = {};
      for (let hour = 0; hour < 24; hour++) {
        schedule[day][hour] = { available: false };
      }
    }

    for (const slot of calendar.timeSlots) {
      schedule[slot.dayOfWeek][slot.hour] = {
        available: slot.isAvailable,
      };
    }

    return {
      hasCalendar: true,
      calendarId: calendar.id,
      timeZone: normalizeCalendarTimeZone(calendar.timeZone),
      schedule,
    };
  }

  /**
   * Sanitize and extract public profile data from nutritionist
   */
  private sanitizePublicProfile(nutritionist: {
    id: string;
    fullName: string;
    publicSlug?: string | null;
    publicProfileEnabled?: boolean;
    specialty: string | null;
    professionalId?: string | null;
    phone: string | null;
    avatarUrl: string | null;
    headline?: string | null;
    bio?: string | null;
    consultationMode?: string | null;
    location?: string | null;
    settings: any;
  }) {
    const settings = (nutritionist.settings as Record<string, any>) || {};

    const slug =
      nutritionist.publicSlug ||
      settings.publicSlug ||
      this.generateSlug(nutritionist.fullName, nutritionist.id);

    const isPublic =
      nutritionist.publicProfileEnabled ??
      settings.publicProfileEnabled === true;

    return {
      id: nutritionist.id,
      slug,
      fullName: nutritionist.fullName,
      specialty: nutritionist.specialty,
      professionalId: nutritionist.professionalId,
      headline: nutritionist.headline ?? settings.headline ?? null,
      bio: nutritionist.bio ?? settings.bio ?? null,
      specialties: this.parseSpecialties(settings.specialties),
      consultationMode:
        nutritionist.consultationMode || settings.consultationMode || 'online',
      location: nutritionist.location ?? settings.location ?? null,
      avatarUrl: nutritionist.avatarUrl,
      isPublic,
      showSchedule: settings.showSchedule !== false,
      publicPhone: settings.showPublicPhone
        ? settings.publicPhone || null
        : null,
      publicEmail: settings.publicEmail || null,
      instagram: settings.showInstagram
        ? settings.professionalInstagram || null
        : null,
      linkedin: settings.showLinkedin ? settings.linkedin || null : null,
      bookingEnabled: settings.bookingEnabled !== false,
      conditionsTreated: settings.conditionsTreated || null,
      patientTypes: settings.patientTypes || null,
      prices: settings.prices || null,
      officeAddress: settings.officeAddress || null,
      paymentMethods: settings.paymentMethods || null,
      acceptedInsurance: settings.acceptedInsurance || null,
      country: settings.country || null,
    };
  }

  /**
   * Generate URL-friendly slug from name and id
   */
  private generateSlug(fullName: string, id: string): string {
    const namePart = fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    const idPart = id.substring(0, 8);
    return `${namePart}-${idPart}`;
  }

  /**
   * Parse specialties from settings
   */
  private parseSpecialties(specialties: any): string[] {
    if (!specialties) return [];
    if (Array.isArray(specialties)) return specialties;
    if (typeof specialties === 'string') {
      try {
        return JSON.parse(specialties);
      } catch {
        return [specialties];
      }
    }
    return [];
  }
}
