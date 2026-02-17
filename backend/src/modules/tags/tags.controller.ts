import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('tags')
@UseGuards(AuthGuard)
export class TagsController {
    constructor(private readonly tagsService: TagsService) { }

    @Get()
    async findAll(@Query('search') search?: string) {
        if (search) {
            return this.tagsService.search(search);
        }
        return this.tagsService.findAll();
    }

    @Post()
    async create(@Body('name') name: string) {
        return this.tagsService.findOrCreate(name);
    }
}
