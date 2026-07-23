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
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { AuthGuard } from './guards/auth.guard';
import { CompleteRutDto } from './dto/complete-rut.dto';
import { isAdminRole } from '../permissions/permissions.constants';
import { GoogleIntegrationService } from '../integrations/google-integration.service';
import type { Request as ExpressRequest, Response } from 'express';
import { createHash, randomBytes } from 'crypto';
import { resolveRequiredUrl } from '../../common/utils/runtime-url.util';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { resolveSafePostAuthPath } from '../../common/utils/safe-redirect.util';
import {
  AUTH_SESSION_COOKIE,
  AUTH_PRESENCE_COOKIE,
  LEGACY_AUTH_SESSION_COOKIE,
  LEGACY_SENTINEL_COOKIE,
  LEGACY_NUTRINET_SESSION_COOKIE,
  authSessionCookieOptions,
  authPresenceCookieOptions,
} from './auth-cookie.constants';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './guards/roles.decorator';
import { UserRole } from '@prisma/client';

const GOOGLE_OAUTH_COOKIE = 'nutrinet_google_oauth';
const GOOGLE_OAUTH_COOKIE_PATH = '/auth/google';

const readCookie = (request: ExpressRequest, name: string) => {
  const cookieHeader = request.headers.cookie || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleIntegrationService: GoogleIntegrationService,
  ) {}

  @Get('google/start')
  googleStart(@Query('next') next: string | undefined, @Res() res: Response) {
    const browserBinding = randomBytes(32).toString('base64url');
    const codeVerifier = randomBytes(48).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    const authUrl = this.googleIntegrationService.buildGoogleLoginUrl({
      next: resolveSafePostAuthPath(next),
      browserBinding,
      codeChallenge,
    });

    res.cookie(GOOGLE_OAUTH_COOKIE, `${browserBinding}.${codeVerifier}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: GOOGLE_OAUTH_COOKIE_PATH,
      maxAge: 10 * 60 * 1000,
    });
    return res.redirect(authUrl);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: ExpressRequest,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new BadRequestException('Callback de Google incompleto');
    }

    const transaction = readCookie(req, GOOGLE_OAUTH_COOKIE);
    res.clearCookie(GOOGLE_OAUTH_COOKIE, { path: GOOGLE_OAUTH_COOKIE_PATH });
    const [browserBinding, codeVerifier] = (transaction || '').split('.');
    if (!browserBinding || !codeVerifier) {
      throw new BadRequestException(
        'La sesión de Google expiró. Intenta nuevamente.',
      );
    }

    const callback =
      await this.googleIntegrationService.handleGoogleLoginCallback(
        code,
        state,
        browserBinding,
        codeVerifier,
      );
    const result = await this.authService.loginWithGoogle(callback.profile);
    const ticket = await this.authService.createOAuthSessionTicket(result);
    const railwayUrl = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : undefined;
    const frontendUrl = resolveRequiredUrl(
      process.env.FRONTEND_URL,
      process.env.NEXT_PUBLIC_FRONTEND_URL,
      process.env.API_URL,
      railwayUrl,
    );
    const targetUrl = `${frontendUrl}/auth/callback?ticket=${encodeURIComponent(ticket)}&next=${encodeURIComponent(resolveSafePostAuthPath(callback.next))}`;
    return res.redirect(targetUrl);
  }

  @Post('oauth/exchange')
  @HttpCode(HttpStatus.OK)
  async exchangeOAuthTicket(
    @Body() body: { ticket?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.ticket) {
      throw new BadRequestException('Ticket de autenticación requerido');
    }

    const session = await this.authService.consumeOAuthSessionTicket(
      body.ticket,
    );

    if (!session) {
      throw new UnauthorizedException('Ticket inválido o expirado');
    }

    // httpOnly JWT – never readable by JS (XSS-safe)
    res.cookie(
      AUTH_SESSION_COOKIE,
      session.access_token,
      authSessionCookieOptions(30 * 24 * 60 * 60 * 1000),
    );

    // Non-httpOnly presence indicator – only signals that a session exists
    res.cookie(
      AUTH_PRESENCE_COOKIE,
      '1',
      authPresenceCookieOptions(30 * 24 * 60 * 60 * 1000),
    );

    // Return user data only – JWT stays in httpOnly cookie, never in JS
    return { user: session.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    // Current session cookies
    res.clearCookie(AUTH_SESSION_COOKIE, { path: '/' });
    res.clearCookie(AUTH_PRESENCE_COOKIE, { path: '/' });
    // Legacy cookie names (clean-up for existing sessions)
    res.clearCookie(LEGACY_AUTH_SESSION_COOKIE, { path: '/' });
    res.clearCookie(LEGACY_SENTINEL_COOKIE, { path: '/' });
    res.clearCookie(LEGACY_NUTRINET_SESSION_COOKIE, { path: '/' });
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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    const maxAge = loginDto.rememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

    // httpOnly JWT – never readable by JS (XSS-safe)
    res.cookie(
      AUTH_SESSION_COOKIE,
      result.access_token,
      authSessionCookieOptions(maxAge),
    );

    // Non-httpOnly presence indicator
    res.cookie(AUTH_PRESENCE_COOKIE, '1', authPresenceCookieOptions(maxAge));

    return result;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMIN_MASTER, UserRole.ADMIN_GENERAL)
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
  resetPassword() {
    throw new BadRequestException(
      'La recuperación de acceso se gestiona en contacto@nutrinet.cl',
    );
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
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
  async resendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(body.email);
  }
}
