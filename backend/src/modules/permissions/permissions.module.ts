import { Module, Global } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsGuard } from './permissions.guard';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [PermissionsService, PermissionsGuard],
  exports: [PermissionsService, PermissionsGuard],
})
export class PermissionsModule {}
