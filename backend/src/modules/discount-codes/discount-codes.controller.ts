import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { DiscountCodesService } from './discount-codes.service';
import { GenerateDiscountCodesDto } from './dto/generate-discount-codes.dto';
import { isStaffRole } from '../permissions/permissions.constants';
import { DiscountCodeType } from '@prisma/client';

@Controller('discount-codes')
@UseGuards(AuthGuard)
export class DiscountCodesController {
  constructor(private readonly discountCodesService: DiscountCodesService) {}

  private ensureStaff(req: any) {
    if (!isStaffRole(req.user?.role)) {
      throw new UnauthorizedException(
        'Solo administradores pueden gestionar codigos',
      );
    }
  }

  @Post('generate')
  async generate(@Body() dto: GenerateDiscountCodesDto, @Request() req: any) {
    this.ensureStaff(req);
    return this.discountCodesService.generateCodes(
      dto.type,
      dto.count,
      req.user.id,
    );
  }

  @Get()
  async findAll(
    @Query('type') type?: DiscountCodeType,
    @Query('isUsed') isUsed?: string,
    @Query('status') status?: string,
    @Query('adminId') adminId?: string,
    @Query('start') start?: string,
    @Query('limit') limit?: string,
    @Query('includeArchived') includeArchived?: string,
    @Request() req?: any,
  ) {
    this.ensureStaff(req);
    return this.discountCodesService.findAll({
      type: type || undefined,
      isUsed: isUsed !== undefined ? isUsed === 'true' : undefined,
      status:
        status === 'ACTIVE' || status === 'SHARED' || status === 'EXPIRED'
          ? status
          : undefined,
      adminId: adminId || undefined,
      start: start ? parseInt(start) : 0,
      limit: limit ? parseInt(limit) : 100,
      includeArchived: includeArchived === 'true',
    });
  }

  @Post('archive-used')
  async archiveUsed(@Request() req: any) {
    this.ensureStaff(req);
    return this.discountCodesService.archiveUsedCodes(req.user.id);
  }

  @Post(':id/status')
  async setStatus(
    @Param('id') id: string,
    @Body() body: { status?: 'SHARED' | 'EXPIRED' },
    @Request() req: any,
  ) {
    this.ensureStaff(req);
    if (body.status !== 'SHARED' && body.status !== 'EXPIRED') {
      throw new UnauthorizedException('Estado invalido');
    }

    return this.discountCodesService.setCodeStatus(id, body.status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    this.ensureStaff(req);
    return this.discountCodesService.getCodeById(id);
  }
}
