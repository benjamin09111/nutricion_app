import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';
import { CreatePersonalNoteTabDto } from './dto/create-personal-note-tab.dto';
import { UpdatePersonalNoteTabDto } from './dto/update-personal-note-tab.dto';
import { PersonalNotesService } from './personal-notes.service';

@Controller('personal-notes')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
export class PersonalNotesController {
  constructor(private readonly personalNotesService: PersonalNotesService) {}

  @Get('tabs')
  findAll(@Request() req: any) {
    return this.personalNotesService.findAll(req.user.id);
  }

  @Post('tabs')
  create(@Request() req: any, @Body() dto: CreatePersonalNoteTabDto) {
    return this.personalNotesService.create(req.user.id, dto);
  }

  @Patch('tabs/:id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePersonalNoteTabDto,
  ) {
    return this.personalNotesService.update(req.user.id, id, dto);
  }

  @Delete('tabs/:id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.personalNotesService.remove(req.user.id, id);
  }
}
