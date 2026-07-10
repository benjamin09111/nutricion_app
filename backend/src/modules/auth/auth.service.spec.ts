import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { PermissionsService } from '../permissions/permissions.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('AuthService', () => {
  let service: AuthService;
  let mailService: {
    sendWelcomeEmail: jest.Mock;
    sendVerificationEmail: jest.Mock;
  };
  let prisma: { $transaction: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let permissionsService: { getAccessSnapshot: jest.Mock };
  let cacheManager: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    mailService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };
    jwtService = { sign: jest.fn().mockReturnValue('token') };
    permissionsService = {
      getAccessSnapshot: jest.fn().mockResolvedValue({
        accountPlan: 'FREE',
        currentPlan: { name: 'Plan Gratuito' },
        requiresPlanSelection: true,
        entitlements: {},
      }),
    };
    cacheManager = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };
    prisma = {
      $transaction: jest.fn(async (callback: any) =>
        callback({
          account: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockImplementation(async () => ({
              id: 'account-id',
              email: 'nuevo@nutrinet.cl',
              role: 'NUTRITIONIST',
              rut: null,
              plan: 'FREE',
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
              googleAvatarUrl: null,
              nutritionist: { id: 'nutri-id', fullName: 'Nueva Nutri' },
              subscription: null,
            })),
            update: jest.fn(),
            findUniqueOrThrow: jest.fn().mockResolvedValue({
              id: 'account-id',
              email: 'nuevo@nutrinet.cl',
              role: 'NUTRITIONIST',
              rut: null,
              plan: 'FREE',
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
              googleAvatarUrl: null,
              nutritionist: { id: 'nutri-id', fullName: 'Nueva Nutri' },
              subscription: null,
            }),
          },
          nutritionist: {
            create: jest.fn().mockResolvedValue({ id: 'nutri-id' }),
            update: jest.fn().mockResolvedValue(undefined),
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: MailService, useValue: mailService },
        { provide: PermissionsService, useValue: permissionsService },
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sends a welcome email on first Google login', async () => {
    await service.loginWithGoogle({
      sub: 'google-sub-1',
      email: 'nuevo@nutrinet.cl',
      email_verified: true,
      name: 'Nueva Nutri',
      picture: 'https://example.com/avatar.png',
    });

    expect(mailService.sendWelcomeEmail).toHaveBeenCalledWith(
      'nuevo@nutrinet.cl',
      'Nueva Nutri',
      expect.stringContaining('/login'),
    );
  });

  it('keeps an existing password when the same account uses Google', async () => {
    const existingAccount = {
      id: 'account-id',
      email: 'nutri@nutrinet.cl',
      password: 'existing-password-hash',
      role: 'NUTRITIONIST',
      rut: null,
      plan: 'FREE',
      authProvider: 'credentials',
      status: 'ACTIVE',
      googleSub: 'google-sub-existing',
      googleAvatarUrl: null,
      emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      nutritionist: { id: 'nutri-id', fullName: 'Nutri Existente' },
      subscription: null,
    };
    const update = jest.fn().mockResolvedValue(existingAccount);

    prisma.$transaction.mockImplementationOnce(async (callback: any) =>
      callback({
        account: {
          findUnique: jest.fn().mockResolvedValueOnce(existingAccount),
          update,
        },
      }),
    );

    await service.loginWithGoogle({
      sub: 'google-sub-existing',
      email: 'nutri@nutrinet.cl',
      email_verified: true,
      name: 'Nutri Existente',
    });

    const updateInput = update.mock.calls[0][0];
    expect(updateInput.data.authProvider).toBe('credentials_google');
    expect(updateInput.data).not.toHaveProperty('password');
    expect(updateInput.data).not.toHaveProperty('role');
    expect(updateInput.data).not.toHaveProperty('plan');
    expect(updateInput.data).not.toHaveProperty('rut');
  });

  it.each(['SUSPENDED', 'DELETED']) (
    'does not reactivate a %s account through Google',
    async (status) => {
      const update = jest.fn();
      const blockedAccount = {
        id: 'blocked-account',
        email: 'blocked@nutrinet.cl',
        password: 'hash',
        role: 'NUTRITIONIST',
        plan: 'FREE',
        status,
        googleSub: 'blocked-google-sub',
        nutritionist: null,
        subscription: null,
      };

      prisma.$transaction.mockImplementationOnce(async (callback: any) =>
        callback({
          account: {
            findUnique: jest.fn().mockResolvedValueOnce(blockedAccount),
            update,
          },
        }),
      );

      await expect(
        service.loginWithGoogle({
          sub: 'blocked-google-sub',
          email: 'blocked@nutrinet.cl',
          email_verified: true,
        }),
      ).rejects.toThrow();
      expect(update).not.toHaveBeenCalled();
    },
  );

  it('rejects an expired email verification token', async () => {
    const update = jest.fn();
    (prisma as any).account = {
      findFirst: jest.fn().mockResolvedValue({
        id: 'pending-account',
        status: 'PENDING',
        emailVerificationSentAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      }),
      update,
    };

    await expect(service.verifyEmail('expired-token')).rejects.toThrow(
      'El enlace de confirmación expiró',
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('stores and consumes OAuth tickets through the shared cache', async () => {
    cacheManager.get.mockResolvedValue({
      access_token: 'oauth-token',
      user: { id: 'account-id' },
    });

    const ticket = await service.createOAuthSessionTicket({
      access_token: 'oauth-token',
      user: { id: 'account-id' },
    });
    const consumed = await service.consumeOAuthSessionTicket(ticket);

    expect(cacheManager.set).toHaveBeenCalledWith(
      `auth:oauth-ticket:${ticket}`,
      expect.objectContaining({ access_token: 'oauth-token' }),
      120_000,
    );
    expect(cacheManager.del).toHaveBeenCalledWith(
      `auth:oauth-ticket:${ticket}`,
    );
    expect(consumed?.access_token).toBe('oauth-token');
  });

  it('issues a new token when resending verification', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    (prisma as any).account = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'pending-account',
        email: 'pendiente@nutrinet.cl',
        status: 'PENDING',
        emailVerificationToken: 'old-token',
        nutritionist: { fullName: 'Nutri Pendiente' },
      }),
      update,
    };

    await service.resendVerificationEmail('PENDIENTE@NUTRINET.CL');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'pending-account' },
      data: {
        emailVerificationToken: expect.not.stringMatching(/^old-token$/),
        emailVerificationSentAt: expect.any(Date),
      },
    });
    expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
      'pendiente@nutrinet.cl',
      'Nutri Pendiente',
      expect.stringContaining('/verify-email?token='),
    );
  });
});
