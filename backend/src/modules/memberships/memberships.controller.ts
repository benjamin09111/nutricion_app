import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('memberships')
export class MembershipsController {
    constructor(private readonly membershipsService: MembershipsService) { }

    /**
     * Public endpoint for landing page
     * Returns only active plans
     */
    @Get('active')
    findActive() {
        return this.membershipsService.findActive();
    }

    /**
     * Admin endpoints (protected)
     */
    @UseGuards(AuthGuard('jwt'))
    @Get()
    findAll() {
        return this.membershipsService.findAll();
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.membershipsService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    create(@Body() createDto: any) {
        return this.membershipsService.create(createDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.membershipsService.update(id, updateDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/toggle-active')
    toggleActive(@Param('id') id: string) {
        return this.membershipsService.toggleActive(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.membershipsService.remove(id);
    }
}
