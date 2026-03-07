import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('resources')
@UseGuards(AuthGuard)
export class ResourcesController {
    constructor(private readonly resourcesService: ResourcesService) { }

    @Get()
    findAll(@Request() req: any) {
        const nutritionistId = req.user.nutritionistId;
        const isAdmin = ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role);
        return this.resourcesService.findAll(nutritionistId, isAdmin);
    }

    @Get('sections')
    getSections(@Request() req: any) {
        return this.resourcesService.getSections(req.user.nutritionistId);
    }

    @Post('sections')
    createSection(@Request() req: any, @Body() data: any) {
        const isAdmin = ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role);
        const nutritionistId = isAdmin ? (data.isGlobal ? null : req.user.nutritionistId) : req.user.nutritionistId;
        return this.resourcesService.createSection(nutritionistId, data);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.resourcesService.findOne(id);
    }

    @Post()
    create(@Request() req: any, @Body() data: any) {
        const isAdmin = ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role);
        const nutritionistId = isAdmin ? (data.isGlobal ? null : req.user.nutritionistId) : req.user.nutritionistId;
        const { isGlobal, ...restData } = data;
        return this.resourcesService.create(nutritionistId, restData);
    }

    @Post('resolve-variables')
    resolveVariables(@Body() data: { content: string; inputs: Record<string, string> }) {
        return {
            resolvedContent: this.resourcesService.resolveVariables(data.content || '', data.inputs || {}),
        };
    }

    @Patch(':id')
    update(@Param('id') id: string, @Request() req: any, @Body() data: any) {
        const nutritionistId = req.user.nutritionistId;
        const isAdmin = ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role);
        const { isGlobal, ...restData } = data;
        return this.resourcesService.update(id, nutritionistId, isAdmin, restData);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        const nutritionistId = req.user.nutritionistId;
        const isAdmin = ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role);
        return this.resourcesService.remove(id, nutritionistId, isAdmin);
    }
}
