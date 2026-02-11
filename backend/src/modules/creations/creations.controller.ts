import { Controller, Post, Body, Get, UseGuards, Request, Param, Delete, Query } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreationsService } from './creations.service';

@Controller('creations')
@UseGuards(AuthGuard)
export class CreationsController {
    constructor(private readonly creationsService: CreationsService) { }

    @Post()
    async create(@Request() req: any, @Body() data: any) {
        const nutritionistId = req.user.nutritionistId;
        return this.creationsService.create(nutritionistId, data);
    }

    @Get()
    async findAll(@Request() req: any, @Query('type') type?: string) {
        const nutritionistId = req.user.nutritionistId;
        return this.creationsService.findAll(nutritionistId, type);
    }

    @Get('tags')
    async getTags(@Request() req: any) {
        const nutritionistId = req.user.nutritionistId;
        return this.creationsService.getAvailableTags(nutritionistId);
    }

    @Get(':id')
    async findOne(@Request() req: any, @Param('id') id: string) {
        const nutritionistId = req.user.nutritionistId;
        return this.creationsService.findOne(id, nutritionistId);
    }

    @Delete(':id')
    async delete(@Request() req: any, @Param('id') id: string) {
        const nutritionistId = req.user.nutritionistId;
        return this.creationsService.delete(id, nutritionistId);
    }
}
