import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountCodeType } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class DiscountCodesService {
  private readonly logger = new Logger(DiscountCodesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private generateCode(type: DiscountCodeType): string {
    const random = randomBytes(4)
      .toString('hex')
      .toUpperCase()
      .slice(0, 8);
    return `${type}_${random}`;
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
  }) {
    const where: any = {};

    if (params.type) where.type = params.type;
    if (params.isUsed !== undefined) where.isUsed = params.isUsed;
    if (params.adminId) where.createdByAdminId = params.adminId;

    const [total, data] = await Promise.all([
      this.prisma.discountCode.count({ where }),
      this.prisma.discountCode.findMany({
        where,
        include: {
          createdBy: { select: { email: true } },
          usedBy: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: params.start || 0,
        take: Math.min(params.limit || 100, 100),
      }),
    ]);

    return { total, data };
  }

  async getCodeByCode(code: string) {
    return this.prisma.discountCode.findUnique({
      where: { code },
      include: {
        createdBy: { select: { email: true } },
        usedBy: { select: { email: true } },
      },
    });
  }

  async getCodeById(id: string) {
    return this.prisma.discountCode.findUnique({
      where: { id },
      include: {
        createdBy: { select: { email: true } },
        usedBy: { select: { email: true } },
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
}
