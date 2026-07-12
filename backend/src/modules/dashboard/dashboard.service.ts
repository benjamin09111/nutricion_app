import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  getMembershipPlanEntitlements,
  getMembershipPlanKey,
} from '../memberships/plan-entitlements';

const LIFETIME_PERIOD_KEY = 'lifetime';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getNutritionistStats(nutritionistId: string, accountId: string) {
    if (!nutritionistId || !accountId) {
      return this.emptyStats();
    }

    const [
      totalPatients,
      activePatients,
      inactivePatients,
      totalConsultations,
      pdfFastDeliverable,
      pdfPautas,
      pdfDiet,
      pdfRecipes,
      recentPatients,
      recentConsultations,
      recentProjects,
      account,
    ] = await Promise.all([
      this.prisma.patient.count({ where: { nutritionistId } }),
      this.prisma.patient.count({
        where: { nutritionistId, status: 'Active' },
      }),
      this.prisma.patient.count({
        where: { nutritionistId, status: { not: 'Active' } },
      }),
      this.prisma.consultation.count({ where: { nutritionistId } }),
      this.prisma.creation.count({
        where: { nutritionistId, type: 'FAST_DELIVERABLE' },
      }),
      this.prisma.creation.count({
        where: { nutritionistId, type: 'PAUTAS' },
      }),
      this.prisma.creation.count({
        where: { nutritionistId, type: 'DIET' },
      }),
      this.prisma.creation.count({
        where: { nutritionistId, type: 'RECIPE' },
      }),

      this.prisma.patient.findMany({
        where: { nutritionistId },
        orderBy: { updatedAt: 'desc' },
        take: 2,
        select: { id: true, fullName: true, updatedAt: true, email: true },
      }),
      this.prisma.consultation.findMany({
        where: { nutritionistId },
        orderBy: { date: 'desc' },
        take: 2,
        include: {
          patient: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.project.findMany({
        where: { nutritionistId },
        orderBy: { updatedAt: 'desc' },
        take: 2,
        include: {
          patient: { select: { id: true, fullName: true } },
        },
      }),

      this.prisma.account.findUnique({
        where: { id: accountId },
        include: {
          subscription: { include: { plan: true } },
        },
      }),
    ]);

    let planUsageCounters: { featureKey: string; usageCount: number }[] = [];
    try {
      planUsageCounters = await this.prisma.planUsageCounter.findMany({
        where: { accountId, periodKey: LIFETIME_PERIOD_KEY },
      });
    } catch {
      // Table may not exist yet — plan usage will show zeros
    }

    const plan = account?.subscription?.plan ?? null;
    const planKey = getMembershipPlanKey(
      plan || { slug: account?.plan || 'free' },
    );
    const entitlements = getMembershipPlanEntitlements(planKey);

    const usageMap: Record<string, number> = {};
    for (const counter of planUsageCounters) {
      usageMap[counter.featureKey] = counter.usageCount;
    }

    const patientLimit = Number(entitlements['patients.active.limit']) || 0;
    const consultationLimit =
      Number(entitlements['consultations.monthly.limit']) || 0;
    const pdfLimit = Number(entitlements['pdf.monthly.limit']) || 0;

    const isFree = planKey === 'free';

    let planUsagePercent = 0;
    if (isFree) {
      const limits = [
        {
          used: activePatients,
          limit: patientLimit > 0 ? patientLimit : Infinity,
        },
        {
          used: totalConsultations,
          limit: consultationLimit > 0 ? consultationLimit : Infinity,
        },
        {
          used: usageMap['pdf.monthly.limit'] || 0,
          limit: pdfLimit > 0 ? pdfLimit : Infinity,
        },
      ];
      const percentages = limits.map((l) =>
        l.limit > 0 && l.limit !== Infinity
          ? Math.min(100, Math.round((l.used / l.limit) * 100))
          : 0,
      );
      planUsagePercent = Math.max(...percentages);
    }

    return {
      patients: {
        total: totalPatients,
        active: activePatients,
        inactive: inactivePatients,
      },
      consultations: {
        total: totalConsultations,
      },
      pdfs: {
        rapido: pdfFastDeliverable,
        pautas: pdfPautas,
        dietas: pdfDiet,
        recetas: pdfRecipes,
      },
      planUsage: {
        planKey,
        isFree,
        percent: planUsagePercent,
        limits: {
          patients: patientLimit,
          consultations: consultationLimit,
          pdfs: pdfLimit,
        },
        usage: {
          patients: activePatients,
          consultations: totalConsultations,
          pdfs: usageMap['pdf.monthly.limit'] || 0,
        },
      },
      recentPatients,
      recentConsultations: recentConsultations.map((c) => ({
        id: c.id,
        title: c.title,
        date: c.date,
        patient: c.patient,
      })),
      recentProjects,
    };
  }

  private emptyStats() {
    return {
      patients: { total: 0, active: 0, inactive: 0 },
      consultations: { total: 0 },
      pdfs: { rapido: 0, pautas: 0, dietas: 0, recetas: 0 },
      planUsage: {
        planKey: 'free',
        isFree: false,
        percent: 0,
        limits: { patients: 0, consultations: 0, pdfs: 0 },
        usage: { patients: 0, consultations: 0, pdfs: 0 },
      },
      recentPatients: [],
      recentConsultations: [],
      recentProjects: [],
    };
  }
}
