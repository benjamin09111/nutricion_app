import {
  Controller,
  Post,
  Get,
  Patch,
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
import { CompleteRutDto } from './dto/complete-rut.dto';
import { isAdminRole } from '../permissions/permissions.constants';
import { GoogleIntegrationService } from '../integrations/google-integration.service';
import type { Response } from 'express';
import { resolveRequiredUrl } from '../../common/utils/runtime-url.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleIntegrationService: GoogleIntegrationService,
  ) {}

  @Get('google/start')
  googleStart(@Query('next') next: string | undefined, @Res() res: Response) {
    const authUrl = this.googleIntegrationService.buildGoogleLoginUrl(
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
    const ticket = this.authService.createOAuthSessionTicket(result);
    const frontendUrl = resolveRequiredUrl(
      process.env.FRONTEND_URL,
      process.env.NEXT_PUBLIC_FRONTEND_URL,
    );
    const targetUrl = `${frontendUrl}/auth/callback?ticket=${encodeURIComponent(ticket)}&next=${encodeURIComponent(callback.next || '/dashboard')}`;
    return res.redirect(targetUrl);
  }

  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  exchangeOAuthTicket(
    @Body() body: { ticket?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.ticket) {
      throw new BadRequestException('Ticket de autenticación requerido');
    }

    const session = this.authService.consumeOAuthSessionTicket(body.ticket);

    if (!session) {
      throw new UnauthorizedException('Ticket inválido o expirado');
    }

    res.cookie('auth_token', 'session', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.cookie('auth_token_http', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { user: session.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token', { path: '/' });
    res.clearCookie('auth_token_http', { path: '/' });
    res.clearCookie('auth_session', { path: '/' });
    return { success: true };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Patch('me/rut')
  @HttpCode(HttpStatus.OK)
  completeRut(@Request() req: any, @Body() body: CompleteRutDto) {
    return this.authService.completeRut(req.user.id, body.rut);
  }

  @UseGuards(AuthGuard)
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
      createAccountDto.forceRoleChange === true,
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
