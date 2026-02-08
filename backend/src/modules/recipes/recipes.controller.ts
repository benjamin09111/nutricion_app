import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('recipes')
@UseGuards(AuthGuard)
export class RecipesController {
    constructor(private readonly recipesService: RecipesService) { }

    @Post()
    create(@Request() req: any, @Body() createRecipeDto: CreateRecipeDto) {
        return this.recipesService.create(req.user.id, createRecipeDto);
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
