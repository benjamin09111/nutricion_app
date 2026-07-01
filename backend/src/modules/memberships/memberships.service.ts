import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma, MembershipPlan } from '@prisma/client';

const normalizeMembershipFeature = (value: unknown): string => {
  const feature = typeof value === 'string' ? value.trim() : '';
  if (!feature) return '';

  if (/^([✓✔Xx])\s*(.*)$/.test(feature)) {
    return feature;
  }

  const excludedMatch = feature.match(/^sin\s+(.*)$/i);
  if (excludedMatch) {
    return `X ${excludedMatch[1].trim()}`;
  }

  return `✓ ${feature}`;
};

const asStringArray = (value: Prisma.JsonValue): string[] => {
  if (Array.isArray(value))
    return value.map((v) => (typeof v === 'string' ? v : ''));
  return [];
};

type PlanRow = MembershipPlan;

const normalizeMembershipPlan = (plan: PlanRow) => ({
  ...plan,
  price: Number(plan.price),
  features: asStringArray(plan.features).map(normalizeMembershipFeature),
});

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const plans = await this.prisma.membershipPlan.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return plans.map(normalizeMembershipPlan);
  }

  async findActive() {
    const plans = await this.prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    return plans.map(normalizeMembershipPlan);
  }

  async findOne(id: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id },
    });
    if (!plan) return null;
    return normalizeMembershipPlan(plan);
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    price: number;
    currency?: string;
    billingPeriod?: string;
    features: string[];
    maxPatients?: number;
    maxStorage?: number;
    isPopular?: boolean;
    isActive?: boolean;
    displayOrder?: number;
  }) {
    return this.prisma.membershipPlan.create({
      data: {
        ...data,
        features: (data.features || []).map(normalizeMembershipFeature),
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      price?: number;
      currency?: string;
      billingPeriod?: string;
      features?: string[];
      maxPatients?: number;
      maxStorage?: number;
      isPopular?: boolean;
      isActive?: boolean;
      displayOrder?: number;
    },
  ) {
    return this.prisma.membershipPlan.update({
      where: { id },
      data: {
        ...data,
        ...(data.features
          ? { features: data.features.map(normalizeMembershipFeature) }
          : {}),
      },
    });
  }

  async remove(id: string) {
    return this.prisma.membershipPlan.delete({
      where: { id },
    });
  }

  async toggleActive(id: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id },
    });
    if (!plan) throw new Error('Plan not found');

    return this.prisma.membershipPlan.update({
      where: { id },
      data: { isActive: !plan.isActive },
    });
  }
}
