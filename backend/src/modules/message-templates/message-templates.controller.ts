import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { MessageTemplatesService } from './message-templates.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES, isAdminRole } from '../permissions/permissions.constants';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { UpdateMessageTemplateDto } from './dto/update-message-template.dto';

@Controller('message-templates')
export class MessageTemplatesController {
  constructor(private readonly messageTemplatesService: MessageTemplatesService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Get()
  findAll(@Request() req: any) {
    if (!isAdminRole(req.user.role)) {
      throw new UnauthorizedException('No tienes permisos para ver plantillas');
    }

    return this.messageTemplatesService.findAll();
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Post()
  create(@Request() req: any, @Body() body: CreateMessageTemplateDto) {
    if (!isAdminRole(req.user.role)) {
      throw new UnauthorizedException('No tienes permisos para crear plantillas');
    }

    return this.messageTemplatesService.create(body);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: UpdateMessageTemplateDto,
  ) {
    if (!isAdminRole(req.user.role)) {
      throw new UnauthorizedException('No tienes permisos para editar plantillas');
    }

    return this.messageTemplatesService.update(id, body);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    if (!isAdminRole(req.user.role)) {
      throw new UnauthorizedException('No tienes permisos para eliminar plantillas');
    }

    return this.messageTemplatesService.remove(id);
  }
}
