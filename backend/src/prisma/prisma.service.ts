import { Injectable, OnModuleInit, OnModuleDestroy, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.validateDatabaseUrl();
    this.logger.log('Prisma initialized (lazy connection)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected');
  }

  private validateDatabaseUrl(): void {
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      throw new InternalServerErrorException(
        'DATABASE_URL environment variable is not set. Check your .env file.',
      );
    }

    if (!dbUrl.startsWith('postgresql://')) {
      const preview = dbUrl.substring(0, 20);
      throw new InternalServerErrorException(
        `Invalid DATABASE_URL: must start with "postgresql://" but got "${preview}...". This usually means Prisma Accelerate/Proxy is misconfigured. Check your .env file.`,
      );
    }

    try {
      const url = new URL(dbUrl);
      this.logger.log(`Database URL host: ${url.host}`);
    } catch {
      throw new InternalServerErrorException(
        'Invalid DATABASE_URL format. Could not parse as URL.',
      );
    }
  }
}
