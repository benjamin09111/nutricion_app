import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { createdAt: true },
    });

    const existing = await (this.prisma as any).appRating.findUnique({
      where: { accountId },
    });

    const now = new Date();
    const createdAt = account?.createdAt ? new Date(account.createdAt) : now;
    const diffMs = now.getTime() - createdAt.getTime();
    const accountAgeDays = diffMs / (1000 * 60 * 60 * 24);
    const eligibleForAutoPrompt = accountAgeDays >= 2;

    return {
      hasRated: Boolean(existing),
      eligibleForAutoPrompt,
      accountAgeDays: Number(accountAgeDays.toFixed(1)),
      rating: existing || null,
    };
  }

  async createRating(accountId: string, dto: CreateRatingDto) {
    const existing = await (this.prisma as any).appRating.findUnique({
      where: { accountId },
    });

    if (existing) {
      throw new BadRequestException('Ya has registrado tu valoración de NutriNet.');
    }

    const rating = await (this.prisma as any).appRating.create({
      data: {
        accountId,
        stars: dto.stars,
        comment: dto.comment ? dto.comment.trim() : null,
      },
    });

    return {
      success: true,
      message: '¡Muchas gracias por tu valoración!',
      rating,
    };
  }

  async getStats() {
    const allRatings = await (this.prisma as any).appRating.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const totalCount = allRatings.length;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    allRatings.forEach((r: { stars: number }) => {
      sum += r.stars;
      if (r.stars >= 1 && r.stars <= 5) {
        distribution[r.stars as 1 | 2 | 3 | 4 | 5]++;
      }
    });

    const averageStars = totalCount > 0 ? Number((sum / totalCount).toFixed(1)) : 0;

    return {
      totalCount,
      averageStars,
      distribution,
      ratings: allRatings.map((r: { id: string; stars: number; comment: string | null; createdAt: Date }) => ({
        id: r.id,
        stars: r.stars,
        comment: r.comment,
        createdAt: r.createdAt,
      })),
    };
  }
}
