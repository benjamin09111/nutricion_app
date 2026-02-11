import { Module } from '@nestjs/common';
import { CreationsService } from './creations.service';
import { CreationsController } from './creations.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [CreationsService],
    controllers: [CreationsController],
    exports: [CreationsService],
})
export class CreationsModule { }
