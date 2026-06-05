import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountStatus, SubscriptionPlan, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * RULE: The backend must handle all heavy logic, filtering, and calculations.
   * The frontend should only receive prepared data and display it immediately.
   */
  async findAll(role?: any, search?: string) {
    const where: any = {
      status: { not: 'DELETED' as any },
    };

    if (role) {
      if (Array.isArray(role)) {
        where.role = { in: role };
      } else if (role === 'ALL_ADMINS') {
        where.role = { in: ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'] };
      } else {
        where.role = role;
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
      },
      orderBy: { createdAt: 'desc' },
    });

    // Backend optimizes the data structure before sending to frontend
    return accounts.map((acc) => ({
      id: acc.id,
      email: acc.email,
      role: acc.role,
      status: acc.status,
      plan: acc.plan,
      subscriptionEndsAt: acc.subscriptionEndsAt,
      createdAt: acc.createdAt,
      lastLogin: acc.lastLoginAt || acc.updatedAt,
      fullName:
        acc.nutritionist?.fullName ||
        ((acc.role as any) === 'ADMIN_MASTER'
          ? 'Admin Master'
          : (acc.role as any) === 'ADMIN_GENERAL'
            ? 'Admin General'
            : acc.role === 'ADMIN'
              ? 'Admin General'
              : acc.email.split('@')[0]),
      patientCount: acc.nutritionist?._count?.patients || 0,
      publicSlug: acc.nutritionist?.publicSlug || null,
      publicProfileEnabled: acc.nutritionist?.publicProfileEnabled ?? false,
      specialty: acc.nutritionist?.specialty || null,
      consultationMode: acc.nutritionist?.consultationMode || null,
      location: acc.nutritionist?.location || null,
      avatarUrl: acc.nutritionist?.avatarUrl || null,
    }));
  }

  async findOne(id: string) {
    return this.prisma.account.findUnique({
      where: { id },
      include: { nutritionist: true },
    });
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
      typeof settingsData.publicSlug === 'string' && settingsData.publicSlug.trim()
        ? settingsData.publicSlug.trim()
        : (nutritionist.publicSlug || this.generateSlug(nutritionist.fullName, nutritionist.id));

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

    return updatedNutritionist;
  }

  /**
   * Update user's subscription plan
   */
  async updatePlan(userId: string, plan: SubscriptionPlan, days?: number) {
    const updateData: any = { plan };

    if (days && days > 0) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      updateData.subscriptionEndsAt = endDate;
    }

    return this.prisma.account.update({
      where: { id: userId },
      data: updateData,
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
        role: 'NUTRITIONIST',
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
   * Delete account (Soft Delete)
   * Professional pattern: Rename email to free it up for reuse
   */
  async softDelete(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: { email: true },
    });

    if (!account) return;

    // Append timestamp to avoid collisions if they delete multiple accounts with same email over time
    const deletedEmail = `${account.email}.deleted.${Date.now()}`;

    return this.prisma.account.update({
      where: { id },
      data: {
        status: 'DELETED' as any,
        email: deletedEmail,
      },
    });
  }

  /**
   * Count total number of nutritionists
   */
  async countNutritionists() {
    return this.prisma.account.count({
      where: { role: 'NUTRITIONIST', status: { not: 'DELETED' as any } },
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
        role: 'NUTRITIONIST',
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
  async getPublicNutritionistBySlug(slug: string) {
    const nutritionist = await this.prisma.nutritionist.findUnique({
      where: { publicSlug: slug },
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
      return null;
    }

    if (
      nutritionist.account.role !== 'NUTRITIONIST' ||
      nutritionist.account.status !== 'ACTIVE'
    ) {
      return null;
    }

    const publicProfile = this.sanitizePublicProfile(nutritionist);
    return publicProfile.isPublic ? publicProfile : null;
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
      timeZone: calendar.timeZone,
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
      publicPhone: settings.showPublicPhone ? (settings.publicPhone || null) : null,
      publicEmail: settings.publicEmail || null,
      instagram: settings.showInstagram ? (settings.professionalInstagram || null) : null,
      linkedin: settings.showLinkedin ? (settings.linkedin || null) : null,
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
