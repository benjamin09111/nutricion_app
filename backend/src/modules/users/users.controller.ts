import { Controller, Get, Body, Patch, Param, UseGuards, Query, UnauthorizedException, Request, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
// @UseGuards(AuthGuard('jwt')) -> Moved to individual methods to allow public access to count

export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('count/nutritionists')
    async countNutritionists() {
        const count = await this.usersService.countNutritionists();
        return { count };
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    findAll(@Query('role') role?: any, @Query('search') search?: string) {
        return this.usersService.findAll(role, search);
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'))
    async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        // 1. Basic check: must be at least some kind of admin
        const requesterRole = req.user.role;
        if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(requesterRole)) {
            throw new UnauthorizedException('Solo personal autorizado puede realizar esta acción');
        }

        // 2. Fetch the target user's current data
        const targetUser = await this.usersService.findOne(id);
        if (!targetUser) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        const isTargetAdmin = ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(targetUser.role);
        const isRequestingMaster = body.role === 'ADMIN_MASTER';
        const isChangingStatusOfAdmin = isTargetAdmin && body.status !== undefined;

        // 3. SECURE RULE: Only ADMIN_MASTER can:
        // - Change role of an existing Admin
        // - Set a role to ADMIN_MASTER
        // - Change status (deactivate) of an existing Admin
        if (isTargetAdmin || isRequestingMaster || isChangingStatusOfAdmin) {
            if (requesterRole !== 'ADMIN_MASTER') {
                throw new UnauthorizedException('Solo un Admin Master puede realizar cambios de jerarquía o estado sobre otros administradores');
            }
        }

        return this.usersService.update(id, body);
    }

    @Patch(':id/plan')
    @UseGuards(AuthGuard('jwt'))
    updatePlan(
        @Param('id') id: string,
        @Body() body: { plan: string; days?: number },
        @Request() req: any
    ) {
        if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role)) {
            throw new UnauthorizedException('Solo el administrador puede cambiar planes');
        }
        return this.usersService.updatePlan(id, body.plan as any, body.days);
    }

    @Post('reset-unpaid-plans')
    @UseGuards(AuthGuard('jwt'))
    resetUnpaidPlans(@Request() req: any) {
        if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(req.user.role)) {
            throw new UnauthorizedException('Solo el administrador puede resetear planes');
        }
        return this.usersService.resetUnpaidPlans();
    }
}
