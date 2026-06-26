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
  constructor(
    private readonly discountCodesService: DiscountCodesService,
  ) {}

  private ensureStaff(req: any) {
    if (!isStaffRole(req.user?.role)) {
      throw new UnauthorizedException('Solo administradores pueden gestionar codigos');
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
    @Query('adminId') adminId?: string,
    @Query('start') start?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    this.ensureStaff(req);
    return this.discountCodesService.findAll({
      type: type || undefined,
      isUsed: isUsed !== undefined ? isUsed === 'true' : undefined,
      adminId: adminId || undefined,
      start: start ? parseInt(start) : 0,
      limit: limit ? parseInt(limit) : 100,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    this.ensureStaff(req);
    return this.discountCodesService.getCodeById(id);
  }
}
