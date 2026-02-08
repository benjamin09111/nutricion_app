import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { IngredientGroupsService } from './ingredient-groups.service';
import { CreateIngredientGroupDto } from './dto/create-ingredient-group.dto';
import { UpdateGroupIngredientsDto } from './dto/update-group-ingredients.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('ingredient-groups')
@UseGuards(AuthGuard)
export class IngredientGroupsController {
    constructor(private readonly ingredientGroupsService: IngredientGroupsService) { }

    @Post()
    create(@Request() req: any, @Body() createDto: CreateIngredientGroupDto) {
        return this.ingredientGroupsService.create(req.user.id, createDto);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.ingredientGroupsService.findAll(req.user.id);
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.ingredientGroupsService.findOne(id, req.user.id);
    }

    @Patch(':id')
    update(@Request() req: any, @Param('id') id: string, @Body() updateDto: CreateIngredientGroupDto) {
        return this.ingredientGroupsService.update(id, req.user.id, updateDto);
    }

    @Delete(':id')
    remove(@Request() req: any, @Param('id') id: string) {
        return this.ingredientGroupsService.remove(id, req.user.id);
    }

    @Post(':id/ingredients')
    addIngredients(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateGroupIngredientsDto) {
        return this.ingredientGroupsService.addIngredients(id, req.user.id, dto);
    }

    @Delete(':id/ingredients')
    removeIngredients(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateGroupIngredientsDto) {
        return this.ingredientGroupsService.removeIngredients(id, req.user.id, dto);
    }
}
