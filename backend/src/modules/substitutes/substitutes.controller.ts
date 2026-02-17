import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { SubstitutesService } from './substitutes.service';

@Controller('substitutes')
@UseGuards(AuthGuard)
export class SubstitutesController {
    constructor(private readonly substitutesService: SubstitutesService) { }

    @Get()
    async findOne(@Request() req: any) {
        const nutritionistId = req.user.nutritionistId;
        return this.substitutesService.findByNutritionist(nutritionistId);
    }

    @Post()
    async upsert(@Request() req: any, @Body() body: { content: any }) {
        const nutritionistId = req.user.nutritionistId;
        return this.substitutesService.upsert(nutritionistId, body.content);
    }
}
