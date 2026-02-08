import { Module } from '@nestjs/common';
import { IngredientGroupsService } from './ingredient-groups.service';
import { IngredientGroupsController } from './ingredient-groups.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [IngredientGroupsController],
    providers: [IngredientGroupsService],
})
export class IngredientGroupsModule { }
