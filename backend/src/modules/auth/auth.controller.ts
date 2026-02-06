import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('create-account')
    @HttpCode(HttpStatus.CREATED)
    createAccount(@Body() createAccountDto: CreateAccountDto) {
        // Default role to NUTRITIONIST if not provided
        const role = createAccountDto.role || 'NUTRITIONIST';
        return this.authService.createAccount(createAccountDto.email, role, createAccountDto.fullName);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    resetPassword(@Body() createAccountDto: CreateAccountDto) {
        return this.authService.resetAccountPassword(createAccountDto.email);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('update-password')
    @HttpCode(HttpStatus.OK)
    updatePassword(@Request() req: any, @Body() updatePasswordDto: UpdatePasswordDto) {
        return this.authService.updatePassword(req.user.id, updatePasswordDto);
    }
}
