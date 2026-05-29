import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('public/nutritionists')
export class PublicNutritionistsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async listPublicNutritionists(
    @Query('search') search?: string,
    @Query('specialty') specialty?: string,
    @Query('mode') mode?: string,
    @Query('location') location?: string,
  ) {
    return this.usersService.listPublicNutritionists({
      search,
      specialty,
      mode,
      location,
    });
  }

  @Get(':slug')
  async getPublicNutritionist(@Param('slug') slug: string) {
    const nutritionist =
      await this.usersService.getPublicNutritionistBySlug(slug);
    if (!nutritionist) {
      throw new NotFoundException('Nutricionista no encontrado');
    }
    return nutritionist;
  }

  @Get(':slug/availability')
  async getNutritionistAvailability(@Param('slug') slug: string) {
    const nutritionist =
      await this.usersService.getPublicNutritionistBySlug(slug);
    if (!nutritionist) {
      throw new NotFoundException('Nutricionista no encontrado');
    }
    return this.usersService.getNutritionistAvailability(nutritionist.id);
  }
}
