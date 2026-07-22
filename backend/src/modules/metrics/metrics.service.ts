import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import {
  AccountStatus,
  PaymentStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { STAFF_ROLES } from '../permissions/permissions.constants';

@Injectable()
export class MetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  private readonly metricDefinitionSelect = {
    id: true,
    name: true,
    unit: true,
    key: true,
    nutritionistId: true,
    icon: true,
    color: true,
  };

  async findAll() {
    return this.prisma.metricDefinition.findMany({
      select: this.metricDefinitionSelect,
      orderBy: { name: 'asc' },
    });
  }

  async findOrCreate(
    data: {
      name: string;
      unit: string;
      key: string;
      icon?: string;
      color?: string;
    },
    nutritionistId?: string,
  ) {
    const key = data.key || data.name.trim().toLowerCase().replace(/\s+/g, '_');

    const existingMetric = await this.prisma.metricDefinition.findFirst({
      where: {
        OR: [
          { key },
          { name: { equals: data.name.trim(), mode: 'insensitive' } },
        ],
      },
      select: this.metricDefinitionSelect,
    });

    if (existingMetric) {
      return existingMetric;
    }

    const metric = await this.prisma.metricDefinition.create({
      data: {
        ...data,
        key,
        nutritionistId,
      },
      select: this.metricDefinitionSelect,
    });

    await this.cacheService.invalidateGlobalPrefix('metrics');
    return metric;
  }

  async search(query: string) {
    return this.prisma.metricDefinition.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { key: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: this.metricDefinitionSelect,
      orderBy: { name: 'asc' },
      take: 20,
    });
  }

  async remove(id: string, nutritionistId: string, role?: string) {
    const metric = await this.prisma.metricDefinition.findUnique({
      where: { id },
      select: this.metricDefinitionSelect,
    });
    if (!metric) {
      throw new NotFoundException(
        'La métrica que intentas eliminar no existe o ya fue borrada.',
      );
    }

    const isAdmin = role && role.startsWith('ADMIN');

    if (!isAdmin && !metric.nutritionistId) {
      throw new ForbiddenException(
        'Las métricas globales del sistema no pueden ser eliminadas',
      );
    }

    if (
      !isAdmin &&
      metric.nutritionistId &&
      metric.nutritionistId !== nutritionistId
    ) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta métrica',
      );
    }

    const deleted = await this.prisma.metricDefinition.delete({
      where: { id },
    });

    await this.cacheService.invalidateGlobalPrefix('metrics');
    return deleted;
  }

  private ensureAdmin(role?: string) {
    if (!role || !STAFF_ROLES.includes(role as any)) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a esta sección',
      );
    }
  }

  async getAdminDashboard(role?: string) {
    this.ensureAdmin(role);

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const [
      totalUsers,
      newUsers,
      totalRevenueAgg,
      todayMetric,
      yesterdayMetric,
      activeSubscriptions,
      recentUsers,
    ] = await Promise.all([
      this.prisma.account.count({
        where: { status: { not: AccountStatus.DELETED } },
      }),
      this.prisma.account.count({
        where: {
          createdAt: { gte: startOfToday },
          status: { not: AccountStatus.DELETED },
        },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),
      this.prisma.dailyMetric.findUnique({ where: { date: startOfToday } }),
      this.prisma.dailyMetric.findUnique({ where: { date: startOfYesterday } }),
      this.prisma.subscription.count({
        where: {
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
          },
        },
      }),
      this.prisma.account.findMany({
        where: { status: { not: AccountStatus.DELETED } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { nutritionist: { select: { fullName: true } } },
      }),
    ]);

    const todayRevenue = Number(todayMetric?.totalRevenue || 0);
    const yesterdayRevenue = Number(yesterdayMetric?.totalRevenue || 0);
    const revenueGrowth =
      yesterdayRevenue > 0
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : todayRevenue > 0
          ? 100
          : 0;

    return {
      overview: {
        totalRevenue: Number(totalRevenueAgg._sum.amount || 0),
        revenueGrowth,
        totalUsers,
        newUsers,
      },
      activeSubscriptions,
      recentUsers: recentUsers.map((acc) => ({
        id: acc.id,
        name:
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
        email: acc.email,
        role: acc.role,
        joinedAt: acc.createdAt,
      })),
    };
  }

  async forceCalculateAdminMetrics(role?: string) {
    this.ensureAdmin(role);

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [totalUsers, activeSubscriptions, revenueToday, revenueYesterday] =
      await Promise.all([
        this.prisma.account.count({
          where: { status: { not: AccountStatus.DELETED } },
        }),
        this.prisma.subscription.count({
          where: {
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
            },
          },
        }),
        this.prisma.payment.aggregate({
          where: { status: PaymentStatus.COMPLETED, paidAt: { gte: today } },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: {
            status: PaymentStatus.COMPLETED,
            paidAt: { gte: yesterday, lt: today },
          },
          _sum: { amount: true },
        }),
      ]);

    const totalRevenue = Number(revenueToday._sum.amount || 0);
    const yesterdayRevenue = Number(revenueYesterday._sum.amount || 0);
    const revenueGrowth =
      yesterdayRevenue > 0
        ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : totalRevenue > 0
          ? 100
          : 0;

    await this.prisma.dailyMetric.upsert({
      where: { date: today },
      update: {
        totalRevenue,
        revenueGrowth,
        totalUsers,
        activeSubscriptions,
        newUsers: await this.prisma.account.count({
          where: {
            createdAt: { gte: today },
            status: { not: AccountStatus.DELETED },
          },
        }),
      },
      create: {
        date: today,
        totalRevenue,
        revenueGrowth,
        totalUsers,
        activeUsers: totalUsers,
        newUsers: await this.prisma.account.count({
          where: {
            createdAt: { gte: today },
            status: { not: AccountStatus.DELETED },
          },
        }),
        activeSubscriptions,
      },
    });

    await this.cacheService.invalidateGlobalPrefix('metrics');

    return { success: true };
  }
}
