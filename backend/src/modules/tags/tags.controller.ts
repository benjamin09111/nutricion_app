import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Delete,
  Param,
  Request,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES } from '../permissions/permissions.constants';

@Controller('tags')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    if (search) {
      return this.tagsService.search(search);
    }
    return this.tagsService.findAll(limit ? parseInt(limit) : undefined);
  }

  @Post()
  async create(@Body('name') name: string, @Request() req: any) {
    const nutritionistId = req.user.nutritionistId;
    return this.tagsService.findOrCreate(name, nutritionistId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const nutritionistId = req.user.nutritionistId;
    const role = req.user.role;
    return this.tagsService.remove(id, nutritionistId, role);
  }
}
