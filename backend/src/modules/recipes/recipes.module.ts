import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { RecipeMatchingService } from './recipe-matching.service';

@Module({
    controllers: [RecipesController],
    providers: [RecipesService, PrismaService, RecipeMatchingService],
    exports: [RecipesService, RecipeMatchingService],
})
export class RecipesModule { }
