import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountCodeType } from '@prisma/client';
import { randomBytes } from 'crypto';

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
    adminId?: string;
    start?: number;
    limit?: number;
    includeArchived?: boolean;
  }) {
    const where: any = {};
    const discountCodes = this.prisma.discountCode as any;

    if (params.type) where.type = params.type;
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

  async getCodeByCode(code: string) {
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

  async getCodeById(id: string) {
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

    if (discountCode.isUsed) {
      throw new BadRequestException('Este codigo ya fue utilizado.');
    }

    return discountCode;
  }

  async markAsUsed(code: string, accountId: string, tx?: any) {
    const client = tx || this.prisma;
    return client.discountCode.update({
      where: { code },
      data: {
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
