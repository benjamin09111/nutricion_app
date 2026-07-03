import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { PermissionsService } from '../permissions/permissions.service';

describe('AuthService', () => {
  let service: AuthService;
  let mailService: { sendWelcomeEmail: jest.Mock };
  let prisma: { $transaction: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let permissionsService: { getAccessSnapshot: jest.Mock };

  beforeEach(async () => {
    mailService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
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
});
