import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  /**
   * Public endpoint for landing page
   * Returns only active plans
   */
  @Get('active')
  findActive() {
    return this.membershipsService.findActive();
  }

  /**
   * Admin endpoints (protected)
   */
  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.membershipsService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membershipsService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createDto: any) {
    return this.membershipsService.create(createDto);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.membershipsService.update(id, updateDto);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.membershipsService.toggleActive(id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membershipsService.remove(id);
  }
}
