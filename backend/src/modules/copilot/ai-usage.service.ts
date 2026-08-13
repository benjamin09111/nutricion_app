import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface LogAiUsageParams {
  accountId?: string;
  feature: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  metadata?: Record<string, any>;
}

export class AiUsageFilterQuery {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  userSearch?: string;
  model?: string;
  feature?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  calculateCostInCents(
    model: string,
    promptTokens: number,
    completionTokens: number,
  ): number {
    const modelLower = (model || '').toLowerCase();

    // Rates in USD per 1M tokens
    let promptRatePerM = 0.15;
    let completionRatePerM = 0.60;

    if (modelLower.includes('gpt-4o') && !modelLower.includes('mini')) {
      promptRatePerM = 2.50;
      completionRatePerM = 10.00;
    } else if (modelLower.includes('gpt-4o-mini')) {
      promptRatePerM = 0.15;
      completionRatePerM = 0.60;
    } else if (modelLower.includes('gemini')) {
      promptRatePerM = 0.075;
      completionRatePerM = 0.30;
    } else if (modelLower.includes('deepseek')) {
      promptRatePerM = 0.14;
      completionRatePerM = 0.28;
    }

    const promptCostUSD = (promptTokens / 1_000_000) * promptRatePerM;
    const completionCostUSD = (completionTokens / 1_000_000) * completionRatePerM;
    const totalCostUSD = promptCostUSD + completionCostUSD;

    // Convert USD to Cents (1 USD = 100 Cents)
    const costInCents = totalCostUSD * 100;
    return Number(costInCents.toFixed(6));
  }

  async logUsage(params: LogAiUsageParams) {
    try {
      const totalTokens = (params.promptTokens || 0) + (params.completionTokens || 0);
      const estimatedCostCents = this.calculateCostInCents(
        params.model,
        params.promptTokens || 0,
        params.completionTokens || 0,
      );

      return await this.prisma.aiUsageLog.create({
        data: {
          accountId: params.accountId || null,
          feature: params.feature || 'general',
          model: params.model || 'unknown',
          promptTokens: params.promptTokens || 0,
          completionTokens: params.completionTokens || 0,
          totalTokens,
          estimatedCostCents,
          metadata: params.metadata || {},
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log AI usage: ${error}`);
      return null;
    }
  }

  private buildWhereClause(query: AiUsageFilterQuery): any {
    const where: any = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query.accountId) where.accountId = query.accountId;
    if (query.model) where.model = { contains: query.model, mode: 'insensitive' };
    if (query.feature) where.feature = query.feature;

    if (query.userSearch && query.userSearch.trim()) {
      const term = query.userSearch.trim();
      where.account = {
        OR: [
          { email: { contains: term, mode: 'insensitive' } },
          { nutritionist: { fullName: { contains: term, mode: 'insensitive' } } },
        ],
      };
    }

    return where;
  }

  async getStats(query: AiUsageFilterQuery) {
    const where = this.buildWhereClause(query);

    const logs = await this.prisma.aiUsageLog.findMany({
      where,
      select: {
        id: true,
        model: true,
        feature: true,
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        estimatedCostCents: true,
        createdAt: true,
      },
    });

    let totalCalls = logs.length;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let totalCostCents = 0;

    const byModel: Record<string, { calls: number; tokens: number; costCents: number }> = {};
    const byFeature: Record<string, { calls: number; tokens: number; costCents: number }> = {};

    for (const log of logs) {
      totalPromptTokens += log.promptTokens;
      totalCompletionTokens += log.completionTokens;
      totalTokens += log.totalTokens;
      totalCostCents += log.estimatedCostCents;

      // Group by Model
      if (!byModel[log.model]) {
        byModel[log.model] = { calls: 0, tokens: 0, costCents: 0 };
      }
      byModel[log.model].calls += 1;
      byModel[log.model].tokens += log.totalTokens;
      byModel[log.model].costCents += log.estimatedCostCents;

      // Group by Feature
      if (!byFeature[log.feature]) {
        byFeature[log.feature] = { calls: 0, tokens: 0, costCents: 0 };
      }
      byFeature[log.feature].calls += 1;
      byFeature[log.feature].tokens += log.totalTokens;
      byFeature[log.feature].costCents += log.estimatedCostCents;
    }

    const usdClpRate = 950;
    const totalCostUSD = totalCostCents / 100;
    const totalCostCLP = Math.round(totalCostUSD * usdClpRate);

    return {
      summary: {
        totalCalls,
        totalPromptTokens,
        totalCompletionTokens,
        totalTokens,
        totalCostCents: Number(totalCostCents.toFixed(4)),
        totalCostUSD: Number(totalCostUSD.toFixed(4)),
        totalCostCLP,
      },
      byModel,
      byFeature,
    };
  }

  async getLogs(query: AiUsageFilterQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(query);

    const [total, items] = await Promise.all([
      this.prisma.aiUsageLog.count({ where }),
      this.prisma.aiUsageLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          account: {
            select: {
              id: true,
              email: true,
              nutritionist: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async cleanOldLogs() {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const deleted = await this.prisma.aiUsageLog.deleteMany({
      where: {
        createdAt: {
          lt: sixtyDaysAgo,
        },
      },
    });

    this.logger.log(`Cleaned up ${deleted.count} AI usage logs older than 60 days`);
    return deleted.count;
  }
}
