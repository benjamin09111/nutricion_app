import { Module, Global } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PrismaService } from '../../prisma/prisma.service';

@Global()
@Module({
  providers: [PermissionsService, PrismaService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
