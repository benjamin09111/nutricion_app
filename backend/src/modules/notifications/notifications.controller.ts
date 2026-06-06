import { Body, Controller, Delete, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { NotificationsService } from './notifications.service';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';

@Controller('notifications')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  getMine(@Request() req: any) {
    return this.notificationsService.getMine(req.user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.delete(req.user.id, id);
  }
}
