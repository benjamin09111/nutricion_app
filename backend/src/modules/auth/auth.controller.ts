import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UnauthorizedException,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { AuthGuard } from './guards/auth.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { isAdminRole } from '../permissions/permissions.constants';
import { GoogleIntegrationService } from '../integrations/google-integration.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleIntegrationService: GoogleIntegrationService,
  ) {}

  @Get('google/start')
  async googleStart(
    @Query('next') next: string | undefined,
    @Res() res: Response,
  ) {
    const authUrl = await this.googleIntegrationService.buildGoogleLoginUrl(
      next || '/dashboard',
    );
    return res.redirect(authUrl);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new BadRequestException('Callback de Google incompleto');
    }

    const callback =
      await this.googleIntegrationService.handleGoogleLoginCallback(
        code,
        state,
      );
    const result = await this.authService.loginWithGoogle(callback.profile);
    const frontendUrl = (
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ).replace(/\/$/, '');
    const targetUrl = `${frontendUrl}/auth/callback?token=${encodeURIComponent(result.access_token)}&next=${encodeURIComponent(callback.next || '/dashboard')}`;
    return res.redirect(targetUrl);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login() {
    throw new BadRequestException('El acceso solo está disponible con Google');
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
    if (!isAdminRole(requesterRole)) {
      throw new UnauthorizedException('No tienes permisos para crear cuentas');
    }

    // 2. SECURE RULE: Only ADMIN_MASTER can create other Admins (Master or General)
    const isTargetAdmin = isAdminRole(targetRole);
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
  register() {
    throw new BadRequestException(
      'El registro solo está disponible con Google',
    );
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
