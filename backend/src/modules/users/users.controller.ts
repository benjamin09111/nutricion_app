import { Controller, Get, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    findAll() {
        // TODO: Add Admin check here
        return this.usersService.findAll();
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        // TODO: Add Admin check here
        return this.usersService.update(id, body);
    }
}
