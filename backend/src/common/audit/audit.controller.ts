import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuthGuard } from '../../modules/auth/guards/auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/guards/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('audit')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRole.ADMIN_MASTER)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('patients/:patientId')
  listPatientAccess(@Param('patientId') patientId: string) {
    return this.auditService.listPatientAccess(patientId);
  }
}
