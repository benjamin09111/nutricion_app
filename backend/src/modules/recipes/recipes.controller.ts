import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { EstimateMacrosDto } from './dto/estimate-macros.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';

@Controller('recipes')
@UseGuards(AuthGuard)
@UseInterceptors(HttpCacheInterceptor)
@CacheTTL(300000) // 5 minutes
export class RecipesController {
    constructor(private readonly recipesService: RecipesService) { }

    @Post()
    async create(@Request() req: any, @Body() createRecipeDto: CreateRecipeDto) {
        console.log('[RecipesController.create] req.user.id:', req?.user?.id);
        try {
            return await this.recipesService.create(req.user.id, createRecipeDto);
        } catch (err) {
            console.error('[RecipesController.create] Error:', err?.message || err);
            throw err;
        }
    }

    @Post('estimate-macros')
    estimateMacros(@Body() dto: EstimateMacrosDto) {
        return this.recipesService.estimateMacros(dto);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.recipesService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.recipesService.findOne(id, req.user.id);
    }

    @Patch(':id')
    update(@Request() req: any, @Param('id') id: string, @Body() updateRecipeDto: CreateRecipeDto) {
        return this.recipesService.update(id, req.user.id, updateRecipeDto);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.recipesService.remove(id, req.user.id);
    }
}
