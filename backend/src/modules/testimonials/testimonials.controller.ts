import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { SPECIAL_FEATURES, isStaffRole } from '../permissions/permissions.constants';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  // Public: List published testimonials for landing page
  @Get('public')
  findPublic() {
    return this.testimonialsService.findPublic();
  }

  // Admin: Unreviewed count for sidebar badge
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Get('admin/unreviewed-count')
  getUnreviewedCount(@Request() req: any) {
    if (!isStaffRole(req.user?.role)) {
      throw new UnauthorizedException('No tienes permisos de administrador.');
    }
    return this.testimonialsService.getUnreviewedCount();
  }

  // Admin: List all testimonials
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Get('admin')
  findAllAdmin(@Request() req: any) {
    if (!isStaffRole(req.user?.role)) {
      throw new UnauthorizedException('No tienes permisos de administrador.');
    }
    return this.testimonialsService.findAllAdmin();
  }

  // Admin: Create manual testimonial
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Post('admin')
  create(@Body() dto: CreateTestimonialDto, @Request() req: any) {
    if (!isStaffRole(req.user?.role)) {
      throw new UnauthorizedException('No tienes permisos de administrador.');
    }
    return this.testimonialsService.create(dto);
  }

  // Admin: Update testimonial
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Patch('admin/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTestimonialDto,
    @Request() req: any,
  ) {
    if (!isStaffRole(req.user?.role)) {
      throw new UnauthorizedException('No tienes permisos de administrador.');
    }
    return this.testimonialsService.update(id, dto);
  }

  // Admin: Toggle publish
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Patch('admin/:id/toggle-publish')
  togglePublish(@Param('id') id: string, @Request() req: any) {
    if (!isStaffRole(req.user?.role)) {
      throw new UnauthorizedException('No tienes permisos de administrador.');
    }
    return this.testimonialsService.togglePublish(id);
  }

  // Admin: Mark as reviewed
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Patch('admin/:id/review')
  markAsReviewed(@Param('id') id: string, @Request() req: any) {
    if (!isStaffRole(req.user?.role)) {
      throw new UnauthorizedException('No tienes permisos de administrador.');
    }
    return this.testimonialsService.markAsReviewed(id);
  }

  // Admin: Delete testimonial
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequireFeatures(SPECIAL_FEATURES.MEMBERSHIP_SELECTED)
  @Delete('admin/:id')
  remove(@Param('id') id: string, @Request() req: any) {
    if (!isStaffRole(req.user?.role)) {
      throw new UnauthorizedException('No tienes permisos de administrador.');
    }
    return this.testimonialsService.remove(id);
  }
}
