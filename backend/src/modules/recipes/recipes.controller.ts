import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { EstimateMacrosDto } from './dto/estimate-macros.dto';
import { CompatibleRecipesDto } from './dto/compatible-recipes.dto';
import { AiFillRecipesDto } from './dto/ai-fill-recipes.dto';
import { QuickAiFillRecipesDto } from './dto/quick-ai-fill-recipes.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';
import { RecipeMatchingService } from './recipe-matching.service';

@Controller('recipes')
@UseGuards(AuthGuard)
@UseInterceptors(HttpCacheInterceptor)
@CacheTTL(300000) // 5 minutes
export class RecipesController {
    constructor(
        private readonly recipesService: RecipesService,
        private readonly recipeMatchingService: RecipeMatchingService
    ) { }

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

    @Post('compatible')
    findCompatible(@Request() req: any, @Body() dto: CompatibleRecipesDto) {
        // The endpoint is compatible with users, so we use their ID
        const nutritionistId = req.user.nutritionistId || req.user.id;
        return this.recipeMatchingService.findCompatibleRecipes(nutritionistId, dto.ingredientNames, dto.restrictions);
    }

    @Post('ai-fill')
    fillWithAi(@Request() req: any, @Body() dto: AiFillRecipesDto) {
        return this.recipesService.fillWithAi(req.user.id, dto);
    }

    @Post('quick-ai-fill')
    fillQuickWithAi(@Request() req: any, @Body() dto: QuickAiFillRecipesDto) {
        return this.recipesService.quickFillWithAi(req.user.id, dto);
    }

    @Post(':id/library')
    addToLibrary(@Request() req: any, @Param('id') id: string) {
        return this.recipesService.addToLibrary(id, req.user.id);
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
        return this.recipesService.update(id, req.user.id, req.user.role, updateRecipeDto);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.recipesService.remove(id, req.user.id, req.user.role);
    }
}
