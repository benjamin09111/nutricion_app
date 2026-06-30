import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { PermissionsService } from '../permissions/permissions.service';

import {
  Prisma,
  UserRole,
  SubscriptionPlan,
  AccountStatus,
} from '@prisma/client';

const resolvePlanForRole = (role: UserRole): SubscriptionPlan =>
  role === 'NUTRITIONIST' || role === 'NUTRITIONIST_DEVELOPER'
    ? SubscriptionPlan.FREE
    : SubscriptionPlan.ENTERPRISE;

const resolveGreetingName = (account: {
  role: UserRole;
  email: string;
  nutritionist?: { fullName: string } | null;
}) => {
  if (account.nutritionist?.fullName) {
    return account.nutritionist.fullName;
  }

  if (account.role === 'ADMIN_MASTER') {
    return 'Admin Master';
  }

  if (account.role === 'ADMIN' || account.role === 'ADMIN_GENERAL') {
    return 'Admin General';
  }

  if (account.role === 'NUTRITIONIST_DEVELOPER') {
    return 'Nutricionista';
  }

  return account.email.split('@')[0] || 'Usuario';
};

const buildPublicSlug = (fullName: string, id: string) => {
  const namePart = fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);
  const idPart = id.substring(0, 8);
  return `${namePart}-${idPart}`;
};

const buildVerificationToken = () => crypto.randomBytes(32).toString('hex');

const getFrontendUrl = () =>
  (process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://nutrinet.cl'
    : 'http://localhost:3000'
  ).replace(/\/$/, '');

@Injectable()
export class AuthService {
  private readonly oauthSessionTickets = new Map<
    string,
    { payload: { access_token: string; user: any }; expiresAt: number }
  >();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private permissionsService: PermissionsService,
  ) {}

  createOAuthSessionTicket(session: { access_token: string; user: any }) {
    const ticket = crypto.randomBytes(24).toString('base64url');
    this.oauthSessionTickets.set(ticket, {
      payload: session,
      expiresAt: Date.now() + 2 * 60 * 1000,
    });

    return ticket;
  }

  consumeOAuthSessionTicket(ticket: string) {
    const entry = this.oauthSessionTickets.get(ticket);

    if (!entry) {
      return null;
    }

    this.oauthSessionTickets.delete(ticket);

    if (entry.expiresAt < Date.now()) {
      return null;
    }

    return entry.payload;
  }

  private async buildSessionPayload(account: {
    id: string;
    email: string;
    role: UserRole;
    plan: SubscriptionPlan;
    createdAt: Date;
    googleAvatarUrl?: string | null;
    nutritionist?: { id: string; fullName: string } | null;
    subscription?: {
      status: string;
      startDate: Date;
      endDate: Date;
      cancelAtPeriodEnd: boolean;
      canceledAt: Date | null;
      planId: string;
      plan?: {
        name: string | null;
        slug: string | null;
        price: Prisma.Decimal | number | string;
      } | null;
    } | null;
  }) {
    const accessSnapshot = await this.permissionsService.getAccessSnapshot(
      account.id,
    );
    const effectivePlan =
      (accessSnapshot as any)?.accountPlan ||
      account.plan ||
      SubscriptionPlan.FREE;
    const planName =
      accessSnapshot?.currentPlan?.name ||
      (effectivePlan === SubscriptionPlan.FREE
        ? 'Plan Gratuito'
        : effectivePlan === SubscriptionPlan.ENTERPRISE
          ? 'Plan Enterprise'
          : 'Plan Pro');

    const subscriptionInfo = account.subscription
      ? {
          status: account.subscription.status,
          startDate: account.subscription.startDate,
          endDate: account.subscription.endDate,
          cancelAtPeriodEnd: account.subscription.cancelAtPeriodEnd,
          canceledAt: account.subscription.canceledAt,
          planId: account.subscription.planId,
          planName: account.subscription.plan?.name || null,
          planSlug: account.subscription.plan?.slug || null,
          planPrice: account.subscription.plan
            ? Number(account.subscription.plan.price)
            : null,
        }
      : null;

    return {
      planName,
      accessSnapshot,
      subscriptionInfo,
      user: {
        id: account.id,
        email: account.email,
        role: account.role,
        plan: effectivePlan,
        planName,
        createdAt: account.createdAt?.toISOString() ?? null,
        googleAvatarUrl: account.googleAvatarUrl || null,
        requiresPlanSelection: accessSnapshot?.requiresPlanSelection ?? true,
        entitlements: accessSnapshot?.entitlements ?? {},
        subscription: subscriptionInfo,
        nutritionist: account.nutritionist,
      },
    };
  }

  private mapMembershipPlanToAccountPlan(
    slug?: string | null,
  ): SubscriptionPlan {
    const normalized = (slug || '').toLowerCase();

    if (normalized.includes('free')) {
      return SubscriptionPlan.FREE;
    }

    if (normalized.includes('enterprise')) {
      return SubscriptionPlan.ENTERPRISE;
    }

    return SubscriptionPlan.PRO;
  }

  async createAccount(
    email: string,
    role: UserRole,
    fullName: string = 'Usuario',
    adminMessage?: string,
    planId?: string,
    forceRoleChange = false,
  ) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingAccount = await this.prisma.account.findUnique({
      where: { email: normalizedEmail },
      include: { nutritionist: true },
    });

    if (existingAccount && existingAccount.role !== role && !forceRoleChange) {
      throw new ConflictException(
        'La cuenta ya existe. Confirma para forzar el cambio de rol.',
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const targetPlanId = planId;
        let subscriptionPlan: SubscriptionPlan = SubscriptionPlan.FREE;

        const isNutritionist = [
          'NUTRITIONIST',
          'NUTRITIONIST_DEVELOPER',
          'ORGANIZATION',
          'SUPPLEMENT_STORE',
          'SUPERMARKET',
        ].includes(role);

        if (isNutritionist) {
          let membershipPlan;

          if (targetPlanId) {
            membershipPlan = await tx.membershipPlan.findUnique({
              where: { id: targetPlanId },
            });
          }

          if (targetPlanId && !membershipPlan) {
            throw new BadRequestException('Plan no encontrado o inactivo');
          }

          if (membershipPlan) {
            subscriptionPlan = this.mapMembershipPlanToAccountPlan(
              membershipPlan.slug,
            );
          }
        }

        const accountData = {
          email: normalizedEmail,
          password: null,
          googleSub: existingAccount?.googleSub || null,
          googleEmail: normalizedEmail,
          googleAvatarUrl: existingAccount?.googleAvatarUrl || null,
          authProvider: 'google',
          role,
          plan:
            role === 'NUTRITIONIST' || isNutritionist
              ? subscriptionPlan
              : SubscriptionPlan.ENTERPRISE,
          status: 'ACTIVE' as AccountStatus,
          emailVerifiedAt: new Date(),
          emailVerificationToken: null,
          emailVerificationSentAt: null,
        };

        const savedAccount = existingAccount
          ? await tx.account.update({
              where: { id: existingAccount.id },
              data: accountData,
            })
          : await tx.account.create({ data: accountData });

        if (
          (role === 'NUTRITIONIST' || role === 'NUTRITIONIST_DEVELOPER') &&
          !existingAccount?.nutritionist
        ) {
          const nutritionist = await tx.nutritionist.create({
            data: {
              accountId: savedAccount.id,
              fullName: fullName,
            },
          });

          await tx.nutritionist.update({
            where: { id: nutritionist.id },
            data: { publicSlug: buildPublicSlug(fullName, nutritionist.id) },
          });
        }

        // Only create a subscription when an explicit plan was provided.
        if (!existingAccount && isNutritionist && targetPlanId) {
          await tx.subscription.create({
            data: {
              accountId: savedAccount.id,
              planId: targetPlanId,
              status: 'ACTIVE', // Or TRIALING depending on business rules
              startDate: new Date(),
              endDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days default
            },
          });
        }
      });

      try {
        await this.mailService.sendWelcomeEmail(
          normalizedEmail,
          fullName,
          `${getFrontendUrl()}/login`,
          adminMessage,
        );
      } catch (mailError) {
        console.error('Error sending access email:', mailError);
      }

      return {
        success: true,
        message: existingAccount
          ? 'Acceso actualizado correctamente.'
          : 'Cuenta creada correctamente.',
      };
    } catch (error) {
      console.error('CRITICAL ERROR creating account:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Error interno al crear cuenta: ${error.message}`,
      );
    }
  }

  async register(data: RegisterDto) {
    const { email, password, fullName } = data;
    const normalizedEmail = email.toLowerCase().trim();
    const frontendUrl = getFrontendUrl();

    const existingAccount = await this.prisma.account.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingAccount) {
      throw new BadRequestException('Este correo ya está registrado.');
    }

    const finalPassword = password || crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(finalPassword, 10);
    const verificationToken = buildVerificationToken();

    try {
      await this.prisma.$transaction(async (tx) => {
        const newAccount = await tx.account.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            role: 'NUTRITIONIST',
            plan: 'FREE',
            status: 'PENDING',
            emailVerificationToken: verificationToken,
            emailVerificationSentAt: new Date(),
            emailVerifiedAt: null,
          },
        });

        const nutritionist = await tx.nutritionist.create({
          data: {
            accountId: newAccount.id,
            fullName: fullName,
          },
        });

        await tx.nutritionist.update({
          where: { id: nutritionist.id },
          data: { publicSlug: buildPublicSlug(fullName, nutritionist.id) },
        });

        console.log(
          `✅ [AuthService] Usuario registrado con éxito: ${normalizedEmail}`,
        );
      });

      await Promise.allSettled([
        this.mailService.sendVerificationEmail(
          normalizedEmail,
          fullName,
          `${frontendUrl}/verify-email?token=${verificationToken}`,
        ),
        this.mailService.sendRegistrationAlert(fullName, normalizedEmail),
      ]);

      return {
        success: true,
        message:
          'Registro completado. Revisa tu correo para confirmar tu cuenta.',
      };
    } catch (error: any) {
      console.error('Error en register:', error);
      throw new BadRequestException(
        'No se pudo completar el registro: ' + error.message,
      );
    }
  }

  async verifyEmail(token: string) {
    const normalizedToken = token.trim();

    const account = await this.prisma.account.findUnique({
      where: { emailVerificationToken: normalizedToken },
      include: { nutritionist: true },
    });

    if (!account) {
      throw new BadRequestException(
        'Token de verificación inválido o expirado',
      );
    }

    if (account.status === 'ACTIVE') {
      return {
        success: true,
        message: 'Tu correo ya está verificado.',
      };
    }

    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationSentAt: null,
      },
    });

    return {
      success: true,
      message: 'Correo confirmado correctamente. Ya puedes iniciar sesión.',
    };
  }

  async resendVerificationEmail(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const account = await this.prisma.account.findUnique({
      where: { email: normalizedEmail },
      include: { nutritionist: true },
    });

    if (!account) {
      throw new BadRequestException('No encontramos una cuenta con ese correo');
    }

    if (account.status === 'ACTIVE') {
      return {
        success: true,
        message: 'Tu correo ya fue confirmado.',
      };
    }

    const verificationToken =
      account.emailVerificationToken || buildVerificationToken();
    const frontendUrl = getFrontendUrl();

    await this.prisma.account.update({
      where: { id: account.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationSentAt: new Date(),
      },
    });

    await this.mailService.sendVerificationEmail(
      normalizedEmail,
      account.nutritionist?.fullName || 'Usuario',
      `${frontendUrl}/verify-email?token=${verificationToken}`,
    );

    return {
      success: true,
      message: 'Te enviamos un nuevo correo de confirmación.',
    };
  }

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;
      const normalizedEmail = email.toLowerCase().trim();
      const account = await this.prisma.account.findUnique({
        where: { email: normalizedEmail },
        include: {
          nutritionist: true,
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      });

      if (!account || !account.password) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const isPasswordValid = await bcrypt.compare(password, account.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      if (account.status === 'PENDING') {
        throw new UnauthorizedException(
          'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
        );
      }

      // Block suspended or deleted accounts from logging in
      if (account.status === 'SUSPENDED') {
        throw new UnauthorizedException(
          'Tu cuenta ha sido suspendida. Contacta al administrador.',
        );
      }
      if (account.status === 'DELETED') {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const updateData: any = { lastLoginAt: new Date() };
      await this.prisma.account.update({
        where: { id: account.id },
        data: updateData,
      });

      if (
        (account.role === 'NUTRITIONIST' ||
          account.role === 'NUTRITIONIST_DEVELOPER') &&
        !account.nutritionist
      ) {
        console.warn(
          `[AuthService] Warning: Account ${account.email} has no Nutritionist record. Role: ${account.role}`,
        );
      }

      const payload = {
        email: account.email,
        sub: account.id,
        role: account.role,
        nutritionistId: account.nutritionist?.id,
      };

      const signOptions: any = {
        expiresIn: loginDto.rememberMe ? '30d' : '24h',
      };

      const accessSnapshot = await this.permissionsService.getAccessSnapshot(
        account.id,
      );
      const effectivePlan =
        (accessSnapshot as any)?.accountPlan ||
        account.plan ||
        SubscriptionPlan.FREE;
      const planName =
        accessSnapshot?.currentPlan?.name ||
        (effectivePlan === SubscriptionPlan.FREE
          ? 'Plan Gratuito'
          : effectivePlan === SubscriptionPlan.ENTERPRISE
            ? 'Plan Enterprise'
            : 'Plan Pro');

      const subscriptionInfo = account.subscription
        ? {
            status: account.subscription.status,
            startDate: account.subscription.startDate,
            endDate: account.subscription.endDate,
            cancelAtPeriodEnd: account.subscription.cancelAtPeriodEnd,
            canceledAt: account.subscription.canceledAt,
            planId: account.subscription.planId,
            planName: account.subscription.plan?.name || null,
            planSlug: account.subscription.plan?.slug || null,
            planPrice: account.subscription.plan
              ? Number(account.subscription.plan.price)
              : null,
          }
        : null;
      return {
        access_token: this.jwtService.sign(payload, signOptions),
        user: {
          id: account.id,
          email: account.email,
          role: account.role,
          plan: effectivePlan,
          planName,
          requiresPlanSelection: accessSnapshot?.requiresPlanSelection ?? true,
          entitlements: accessSnapshot?.entitlements ?? {},
          subscription: subscriptionInfo,
          nutritionist: account.nutritionist,
        },
      };
    } catch (error: any) {
      if (error?.code === 'P2022') {
        console.error('[AuthService] Prisma schema mismatch on login:', error);
        throw new ServiceUnavailableException(
          'Tenemos un problema temporal con la base de datos. El equipo ya fue notificado.',
        );
      }

      throw error;
    }
  }

  async loginWithGoogle(profile: {
    sub: string;
    email: string;
    email_verified: boolean;
    name?: string;
    picture?: string;
  }) {
    const normalizedEmail = profile.email.toLowerCase().trim();

    if (!profile.email_verified) {
      throw new BadRequestException(
        'Tu cuenta de Google debe tener el correo verificado',
      );
    }

    const account = await this.prisma.$transaction(async (tx) => {
      const existingByGoogle = await tx.account.findUnique({
        where: { googleSub: profile.sub },
        include: {
          nutritionist: true,
          subscription: { include: { plan: true } },
        },
      });

      if (existingByGoogle) {
        return tx.account.update({
          where: { id: existingByGoogle.id },
          data: {
            password: null,
            role: existingByGoogle.role,
            plan: resolvePlanForRole(existingByGoogle.role),
            googleEmail: normalizedEmail,
            googleAvatarUrl:
              profile.picture || existingByGoogle.googleAvatarUrl,
            emailVerifiedAt: existingByGoogle.emailVerifiedAt || new Date(),
            status: 'ACTIVE',
            authProvider: 'google',
          },
          include: {
            nutritionist: true,
            subscription: { include: { plan: true } },
          },
        });
      }

      const existingByEmail = await tx.account.findUnique({
        where: { email: normalizedEmail },
        include: {
          nutritionist: true,
          subscription: { include: { plan: true } },
        },
      });

      if (existingByEmail) {
        const updated = await tx.account.update({
          where: { id: existingByEmail.id },
          data: {
            password: null,
            role: existingByEmail.role,
            plan: resolvePlanForRole(existingByEmail.role),
            googleSub: profile.sub,
            googleEmail: normalizedEmail,
            googleAvatarUrl: profile.picture || existingByEmail.googleAvatarUrl,
            emailVerifiedAt: existingByEmail.emailVerifiedAt || new Date(),
            status: 'ACTIVE',
            authProvider: 'google',
          },
          include: {
            nutritionist: true,
            subscription: { include: { plan: true } },
          },
        });

        if (
          (updated.role === 'NUTRITIONIST' ||
            updated.role === 'NUTRITIONIST_DEVELOPER') &&
          !updated.nutritionist
        ) {
          const nutritionist = await tx.nutritionist.create({
            data: {
              accountId: updated.id,
              fullName: profile.name || 'Usuario',
            },
          });

          await tx.nutritionist.update({
            where: { id: nutritionist.id },
            data: {
              publicSlug: buildPublicSlug(
                profile.name || 'Usuario',
                nutritionist.id,
              ),
            },
          });

          return tx.account.findUniqueOrThrow({
            where: { id: updated.id },
            include: {
              nutritionist: true,
              subscription: { include: { plan: true } },
            },
          });
        }

        return updated;
      }

      const newAccount = await tx.account.create({
        data: {
          email: normalizedEmail,
          password: null,
          googleSub: profile.sub,
          googleEmail: normalizedEmail,
          googleAvatarUrl: profile.picture || null,
          authProvider: 'google',
          role: 'NUTRITIONIST',
          plan: SubscriptionPlan.FREE,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
          emailVerificationToken: null,
          emailVerificationSentAt: null,
        },
        include: {
          nutritionist: true,
          subscription: { include: { plan: true } },
        },
      });

      const nutritionist = await tx.nutritionist.create({
        data: {
          accountId: newAccount.id,
          fullName: profile.name || 'Usuario',
        },
      });

      await tx.nutritionist.update({
        where: { id: nutritionist.id },
        data: {
          publicSlug: buildPublicSlug(
            profile.name || 'Usuario',
            nutritionist.id,
          ),
        },
      });

      return tx.account.findUniqueOrThrow({
        where: { id: newAccount.id },
        include: {
          nutritionist: true,
          subscription: { include: { plan: true } },
        },
      });
    });

    const { user } = await this.buildSessionPayload(account as any);
    const payload = {
      email: account.email,
      sub: account.id,
      role: account.role,
      nutritionistId: account.nutritionist?.id,
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '30d' }),
      user,
    };
  }

  async getMe(userId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: userId },
      include: {
        nutritionist: true,
        subscription: { include: { plan: true } },
      },
    });

    if (!account) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return this.buildSessionPayload(account as any);
  }

  async validateUser(payload: any) {
    return this.prisma.account.findUnique({
      where: { id: payload.sub },
      include: { nutritionist: true },
    });
  }

  async resetAccountPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    console.log(
      `[AuthService] Attempting to resend access for email: "${normalizedEmail}"`,
    );
    const account = await this.prisma.account.findUnique({
      where: { email: normalizedEmail },
      include: { nutritionist: true },
    });

    if (!account) {
      console.error(
        `[AuthService] Access resend failed: User not found for email "${email}"`,
      );
      throw new BadRequestException('Usuario no encontrado');
    }

    try {
      await this.prisma.account.update({
        where: { email: normalizedEmail },
        data: {
          password: null,
          authProvider: 'google',
          googleEmail: normalizedEmail,
          emailVerifiedAt: new Date(),
          status: 'ACTIVE',
          emailVerificationToken: null,
          emailVerificationSentAt: null,
        },
      });

      const greetingName = resolveGreetingName(account as any);

      console.log(`[AuthService] Access updated in DB for ${normalizedEmail}`);

      try {
        await this.mailService.sendPasswordResetEmail(
          normalizedEmail,
          greetingName,
          `${getFrontendUrl()}/login`,
        );
      } catch (mailError) {
        console.error('Error sending access reminder email:', mailError);
      }

      return {
        success: true,
        message: 'Acceso reenviado correctamente.',
      };
    } catch (error) {
      console.error('Error resetting access:', error);
      throw new BadRequestException('Error al reenviar el acceso.');
    }
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    const { currentPassword, newPassword } = updatePasswordDto;

    const account = await this.prisma.account.findUnique({
      where: { id: userId },
    });

    if (!account || !account.password) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      account.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.account.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return {
      success: true,
      message: 'Contraseña actualizada correctamente',
    };
  }
}
