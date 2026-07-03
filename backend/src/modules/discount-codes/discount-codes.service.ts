import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountCodeType } from '@prisma/client';
import { randomBytes } from 'crypto';

type DiscountCodeStatus = 'ACTIVE' | 'SHARED' | 'EXPIRED';

@Injectable()
export class DiscountCodesService {
  private readonly logger = new Logger(DiscountCodesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private generateCode(type: DiscountCodeType): string {
    const random = randomBytes(6).toString('hex').toUpperCase().slice(0, 12);

    const parts = [random.slice(0, 4), random.slice(4, 8), random.slice(8, 12)];

    return `${type}-${parts.join('-')}`;
  }

  async generateCodes(
    type: DiscountCodeType,
    count: number,
    createdByAdminId: string,
  ) {
    const discountPercent = type === DiscountCodeType.NUTRI ? 50 : 90;
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      let code: string;
      let exists = true;

      do {
        code = this.generateCode(type);
        const existing = await this.prisma.discountCode.findUnique({
          where: { code },
        });
        exists = !!existing;
      } while (exists);

      codes.push(code);
    }

    await this.prisma.discountCode.createMany({
      data: codes.map((code) => ({
        code,
        type,
        discountPercent,
        createdByAdminId,
      })),
    });

    return this.prisma.discountCode.findMany({
      where: { code: { in: codes } },
      include: {
        createdBy: { select: { email: true } },
      },
    });
  }

  async findAll(params: {
    type?: DiscountCodeType;
    isUsed?: boolean;
    status?: DiscountCodeStatus;
    adminId?: string;
    start?: number;
    limit?: number;
    includeArchived?: boolean;
  }) {
    const where: any = {};
    const discountCodes = this.prisma.discountCode as any;

    if (params.type) where.type = params.type;
    if (params.status) where.status = params.status;
    if (params.isUsed !== undefined) where.isUsed = params.isUsed;
    if (params.adminId) where.createdByAdminId = params.adminId;
    if (!params.includeArchived) where.archivedAt = null;

    const [total, data] = await Promise.all([
      discountCodes.count({ where }),
      discountCodes.findMany({
        where,
        include: {
          createdBy: { select: { email: true } },
          usedBy: { select: { email: true } },
          archivedBy: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.start || 0,
        take: Math.min(params.limit || 100, 100),
      }),
    ]);

    return { total, data };
  }

  getCodeByCode(code: string) {
    const discountCodes = this.prisma.discountCode as any;

    return discountCodes.findUnique({
      where: { code },
      include: {
        createdBy: { select: { email: true } },
        usedBy: { select: { email: true } },
        archivedBy: { select: { email: true } },
      },
    });
  }

  getCodeById(id: string) {
    const discountCodes = this.prisma.discountCode as any;

    return discountCodes.findUnique({
      where: { id },
      include: {
        createdBy: { select: { email: true } },
        usedBy: { select: { email: true } },
        archivedBy: { select: { email: true } },
      },
    });
  }

  async validateAndGetDiscount(code: string) {
    if (!code || typeof code !== 'string' || !code.trim()) {
      throw new BadRequestException('Debes ingresar un codigo de descuento.');
    }

    const normalized = code.trim().toUpperCase();
    const discountCode = await this.prisma.discountCode.findUnique({
      where: { code: normalized },
    });

    if (!discountCode) {
      throw new BadRequestException('Codigo de descuento invalido.');
    }

    if (discountCode.archivedAt) {
      throw new BadRequestException('Codigo expirado.');
    }

    const discountCodeStatus = (discountCode as any).status as
      | DiscountCodeStatus
      | undefined;

    if (discountCodeStatus === 'EXPIRED' || discountCode.isUsed) {
      throw new BadRequestException('Codigo expirado.');
    }

    return discountCode;
  }

  async setCodeStatus(
    codeId: string,
    status: Exclude<DiscountCodeStatus, 'ACTIVE'>,
  ) {
    const discountCode = await this.prisma.discountCode.findUnique({
      where: { id: codeId },
      select: { id: true },
    });

    if (!discountCode) {
      throw new BadRequestException('Codigo no encontrado.');
    }

    const discountCodes = this.prisma.discountCode as any;

    return discountCodes.update({
      where: { id: codeId },
      data: {
        status,
        isUsed: status === 'EXPIRED',
        usedByAccountId: null,
        usedAt: status === 'EXPIRED' ? new Date() : null,
        archivedByAdminId: null,
      },
    });
  }

  markAsUsed(code: string, accountId: string, tx?: any) {
    const client = (tx || this.prisma).discountCode;
    return client.update({
      where: { code },
      data: {
        status: 'EXPIRED',
        isUsed: true,
        usedByAccountId: accountId,
        usedAt: new Date(),
      },
    });
  }

  async archiveUsedCodes(adminId: string) {
    const archivedAt = new Date();
    const discountCodes = this.prisma.discountCode as any;

    const result = await discountCodes.updateMany({
      where: {
        isUsed: true,
        status: 'EXPIRED',
        archivedAt: null,
      },
      data: {
        archivedAt,
        archivedByAdminId: adminId,
      },
    });

    return {
      archivedCount: result.count,
      archivedAt,
    };
  }
}
