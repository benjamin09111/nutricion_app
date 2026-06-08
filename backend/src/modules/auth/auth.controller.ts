import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(AuthGuard)
  @Post('create-account')
  @HttpCode(HttpStatus.CREATED)
  createAccount(
    @Body() createAccountDto: CreateAccountDto,
    @Request() req: any,
  ) {
    const requesterRole = req.user.role;
    const targetRole = createAccountDto.role || 'NUTRITIONIST';

    // 1. Basic check: must be at least an Admin to create accounts here
    if (!['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(requesterRole)) {
      throw new UnauthorizedException('No tienes permisos para crear cuentas');
    }

    // 2. SECURE RULE: Only ADMIN_MASTER can create other Admins (Master or General)
    const isTargetAdmin = ['ADMIN', 'ADMIN_MASTER', 'ADMIN_GENERAL'].includes(
      targetRole,
    );
    if (isTargetAdmin && requesterRole !== 'ADMIN_MASTER') {
      throw new UnauthorizedException(
        'Solo un Admin Master puede crear otras cuentas administrativas',
      );
    }

    return this.authService.createAccount(
      createAccountDto.email,
      targetRole as any,
      createAccountDto.fullName,
      undefined,
      createAccountDto.planId,
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: any) {
    try {
      if (!body.email) {
        throw new BadRequestException('El correo es requerido');
      }
      return await this.authService.resetAccountPassword(body.email);
    } catch (error) {
      console.error('Error in reset-password controller:', error);
      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @Post('update-password')
  @HttpCode(HttpStatus.OK)
  updatePassword(
    @Request() req: any,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.authService.updatePassword(req.user.id, updatePasswordDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('request-access')
  @HttpCode(HttpStatus.OK)
  async requestAccess(@Body() body: { name: string; email: string; message?: string }) {
    if (!body.name || !body.email) {
      throw new BadRequestException('Nombre y correo son requeridos');
    }
    await this.mailService.sendRegistrationAlert(body.name, body.email, body.message);
    return { success: true };
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token de verificación es requerido');
    }
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('El correo es requerido');
    }
    return this.authService.resendVerificationEmail(body.email);
  }
}

