import {
  Controller,
  Get,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  Query,
  UnauthorizedException,
  Request,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import {
  SPECIAL_FEATURES,
  isAdminRole,
  isStaffRole,
} from '../permissions/permissions.constants';

const WORKER_ALLOWED_USER_ROLES = new Set([
  'ADMIN_GENERAL',
  'ALL_NUTRITIONISTS',
  'NUTRITIONIST',
  'NUTRITIONIST_DEVELOPER',
  'ORGANIZATION',
  'SUPPLEMENT_STORE',
  'SUPERMARKET',
]);

@Controller('users')
// @UseGuards(AuthGuard) -> Moved to individual methods to allow public access to count
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('count/nutritionists')
  async countNutritionists() {
    const count = await this.usersService.countNutritionists();
    return { count };
  }

  @Get()
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  findAll(
    @Request() req: any,
    @Query('role') role?: any,
    @Query('search') search?: string,
    @Query('visibility') visibility?: 'all' | 'public' | 'hidden',
    @Query('plan') plan?: string,
    @Query('status') status?: string,
    @Query('payment') payment?: string,
    @Query('verification') verification?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const requesterRole = req.user?.role;
    if (!isStaffRole(requesterRole)) {
      throw new UnauthorizedException(
        'Solo personal autorizado puede ver usuarios',
      );
    }

    if (requesterRole === 'WORKER') {
      const requestedRoles =
        typeof role === 'string'
          ? role
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          : [];

      if (
        requestedRoles.length === 0 ||
        requestedRoles.some(
          (requestedRole: string) =>
            !WORKER_ALLOWED_USER_ROLES.has(requestedRole),
        )
      ) {
        throw new UnauthorizedException(
          'No tienes permisos para consultar esos usuarios',
        );
      }
    }

    return this.usersService.findAll(
      role,
      search,
      visibility,
      plan,
      status,
      payment,
      verification,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Patch('me/settings')
  @UseGuards(AuthGuard)
  async updateMySettings(@Request() req: any, @Body() body: any) {
    return this.usersService.updateMySettings(req.user.id, body);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    // 1. Basic check: must be at least some kind of admin
    const requesterRole = req.user.role;
    if (!isAdminRole(requesterRole)) {
      throw new UnauthorizedException(
        'Solo personal autorizado puede realizar esta acción',
      );
    }

    // 2. Fetch the target user's current data
    const targetUser = await this.usersService.findOne(id);
    if (!targetUser) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isTargetAdmin = isAdminRole(targetUser.role);
    const isRequestingMaster = body.role === 'ADMIN_MASTER';
    const isChangingStatusOfAdmin = isTargetAdmin && body.status !== undefined;

    // 3. SECURE RULE: Only ADMIN_MASTER can:
    // - Change role of an existing Admin
    // - Set a role to ADMIN_MASTER
    // - Change status (deactivate) of an existing Admin
    if (isTargetAdmin || isRequestingMaster || isChangingStatusOfAdmin) {
      if (requesterRole !== 'ADMIN_MASTER') {
        throw new UnauthorizedException(
          'Solo un Admin Master puede realizar cambios de jerarquía o estado sobre otros administradores',
        );
      }
    }

    return this.usersService.update(id, body);
  }

  @Patch(':id/plan')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  updatePlan(
    @Param('id') id: string,
    @Body() body: { plan: string; days?: number; recordPayment?: boolean },
    @Request() req: any,
  ) {
    if (!isAdminRole(req.user.role)) {
      throw new UnauthorizedException(
        'Solo el administrador puede cambiar planes',
      );
    }
    return this.usersService.updatePlan(
      id,
      body.plan as any,
      body.days,
      body.recordPayment,
    );
  }

  @Post(':id/notify-transfer')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  notifyTransfer(@Param('id') id: string, @Request() req: any) {
    if (!isAdminRole(req.user.role)) {
      throw new UnauthorizedException(
        'Solo el administrador puede enviar este aviso',
      );
    }

    return this.usersService.sendTransferNotification(id);
  }

  @Patch(':id/public-profile')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  updatePublicProfileVisibility(
    @Param('id') id: string,
    @Body() body: { publicProfileEnabled: boolean },
    @Request() req: any,
  ) {
    if (!isAdminRole(req.user.role)) {
      throw new UnauthorizedException(
        'Solo el administrador puede gestionar el portal público',
      );
    }

    return this.usersService.updatePublicProfileVisibility(
      id,
      body.publicProfileEnabled === true,
    );
  }

  @Post('reset-unpaid-plans')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  resetUnpaidPlans(@Request() req: any) {
    if (!isAdminRole(req.user.role)) {
      throw new UnauthorizedException(
        'Solo el administrador puede resetear planes',
      );
    }
    return this.usersService.resetUnpaidPlans();
  }

  @Patch(':id/delete')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  async softDelete(@Param('id') id: string, @Request() req: any) {
    // Permissions check: must be at least some kind of admin
    const requesterRole = req.user.role;
    if (!isAdminRole(requesterRole)) {
      throw new UnauthorizedException(
        'Solo personal autorizado puede realizar esta acción',
      );
    }

    // Fetch the target user
    const targetUser = await this.usersService.findOne(id);
    if (!targetUser) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // SECURE RULE: Only ADMIN_MASTER can delete another Admin
    const isTargetAdmin = isAdminRole(targetUser.role);
    if (isTargetAdmin && requesterRole !== 'ADMIN_MASTER') {
      throw new UnauthorizedException(
        'Solo un Admin Master puede eliminar a otros administradores',
      );
    }

    return this.usersService.softDelete(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  async hardDelete(@Param('id') id: string, @Request() req: any) {
    const requesterRole = req.user.role;
    if (!isAdminRole(requesterRole)) {
      throw new UnauthorizedException(
        'Solo personal autorizado puede realizar esta acción',
      );
    }

    const targetUser = await this.usersService.findOne(id);
    if (!targetUser) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isTargetAdmin = isAdminRole(targetUser.role);
    if (isTargetAdmin && requesterRole !== 'ADMIN_MASTER') {
      throw new UnauthorizedException(
        'Solo un Admin Master puede eliminar a otros administradores',
      );
    }

    return this.usersService.hardDelete(id);
  }

  @Post('me/deletion-request')
  @UseGuards(AuthGuard)
  async createDeletionRequest(@Request() req: any) {
    const accountId = req.user.id;
    const result = await this.usersService.createDeletionRequest(accountId);

    if (result.exists) {
      return {
        success: true,
        message: 'Ya existe una solicitud pendiente',
        request: result.request,
      };
    }

    return {
      success: true,
      message: 'Solicitud de eliminación creada',
      request: result.request,
    };
  }

  @Get('me/deletion-request')
  @UseGuards(AuthGuard)
  async getMyDeletionRequest(@Request() req: any) {
    const accountId = req.user.id;
    const request = await this.usersService.getPendingDeletionRequests();
    const pending = request.filter((r) => r.accountId === accountId);
    return {
      hasPendingRequest: pending.length > 0,
      request: pending[0] || null,
    };
  }

  @Get('deletion-requests')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  async getDeletionRequests(@Request() req: any) {
    const requesterRole = req.user.role;
    if (!isAdminRole(requesterRole)) {
      throw new UnauthorizedException(
        'Solo personal autorizado puede ver estas solicitudes',
      );
    }

    return this.usersService.getPendingDeletionRequests();
  }

  @Get('deletion-requests/count')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  async countDeletionRequests(@Request() req: any) {
    const requesterRole = req.user.role;
    if (!isAdminRole(requesterRole)) {
      throw new UnauthorizedException(
        'Solo personal autorizado puede ver estas solicitudes',
      );
    }

    const count = await this.usersService.countPendingDeletionRequests();
    return { count };
  }

  @Post('deletion-requests/:id/accept')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  async acceptDeletionRequest(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Request() req: any,
  ) {
    const requesterRole = req.user.role;
    if (!isAdminRole(requesterRole)) {
      throw new UnauthorizedException(
        'Solo personal autorizado puede procesar estas solicitudes',
      );
    }

    return this.usersService.acceptDeletionRequest(id, req.user.id, body.notes);
  }
}
