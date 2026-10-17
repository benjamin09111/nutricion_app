import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { PermissionsService } from '../permissions/permissions.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import {
  generateTotpSecret,
  generateTotpToken,
} from '../../common/utils/totp.util';

describe('AuthService - 2FA / TOTP Security', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;

  const mockSecret = generateTotpSecret();
  const mockPasswordHash = bcrypt.hashSync('securePassword123', 8);

  const mockAccount = {
    id: 'account-uuid-1',
    email: 'nutri@nutrinet.cl',
    password: mockPasswordHash,
    role: 'NUTRITIONIST',
    status: 'ACTIVE',
    totpEnabled: true,
    totpSecret: mockSecret,
    totpRecoveryCodes: ['ABCD-1234', 'EFGH-5678'],
    tokenVersion: 1,
    plan: 'PRO',
    createdAt: new Date(),
    nutritionist: { id: 'nutri-1', fullName: 'Dra. Nutri' },
    subscription: null,
  };

  beforeEach(async () => {
    prisma = {
      account: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.email === 'nutri@nutrinet.cl' || where.id === 'account-uuid-1') {
            return Promise.resolve({ ...mockAccount });
          }
          return Promise.resolve(null);
        }),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...mockAccount,
            ...data,
            tokenVersion: (mockAccount.tokenVersion || 1) + 1,
          }),
        ),
      },
      $transaction: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
      verify: jest.fn().mockImplementation((token) => {
        if (token === 'valid-temp-token') {
          return { sub: 'account-uuid-1', email: 'nutri@nutrinet.cl', is2faTemp: true };
        }
        throw new Error('Invalid token');
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: MailService, useValue: { sendMail: jest.fn() } },
        {
          provide: PermissionsService,
          useValue: {
            getAccessSnapshot: jest.fn().mockResolvedValue({
              accountPlan: 'PRO',
              requiresPlanSelection: false,
              entitlements: {},
            }),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(null),
            del: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('login challenges with requiresTotp and tempToken when 2FA is active and no code provided', async () => {
    const result = await service.login({
      email: 'nutri@nutrinet.cl',
      password: 'securePassword123',
    });

    expect((result as any).requiresTotp).toBe(true);
    expect((result as any).tempToken).toBeDefined();
    expect((result as any).access_token).toBeUndefined();
  });

  it('login succeeds directly when valid totpCode is included in loginDto', async () => {
    const currentCode = generateTotpToken(mockSecret);
    const result = await service.login({
      email: 'nutri@nutrinet.cl',
      password: 'securePassword123',
      totpCode: currentCode,
    });

    expect((result as any).access_token).toBe('mocked-jwt-token');
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('nutri@nutrinet.cl');
  });

  it('login rejects with UnauthorizedException when totpCode is invalid', async () => {
    await expect(
      service.login({
        email: 'nutri@nutrinet.cl',
        password: 'securePassword123',
        totpCode: '000000',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('verifyTotpLogin completes session with valid tempToken and code', async () => {
    const currentCode = generateTotpToken(mockSecret);
    const result = await service.verifyTotpLogin('valid-temp-token', currentCode);

    expect(result.access_token).toBe('mocked-jwt-token');
    expect(result.user.id).toBe('account-uuid-1');
  });

  it('verifyTotpLogin accepts a single-use recovery code and consumes it', async () => {
    const result = await service.verifyTotpLogin('valid-temp-token', 'ABCD-1234');

    expect(result.access_token).toBe('mocked-jwt-token');
    expect(prisma.account.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'account-uuid-1' },
        data: expect.objectContaining({
          totpRecoveryCodes: ['EFGH-5678'],
        }),
      }),
    );
  });

  it('setup2fa generates a secret and otpAuthUrl', async () => {
    const setup = await service.setup2fa('account-uuid-1');

    expect(setup.secret).toBeDefined();
    expect(setup.otpAuthUrl).toContain('otpauth://totp/NutriNet');
    expect(prisma.account.update).toHaveBeenCalled();
  });

  it('confirm2fa activates 2FA and generates recovery codes when code is valid', async () => {
    const validCode = generateTotpToken(mockSecret);
    const confirm = await service.confirm2fa('account-uuid-1', validCode);

    expect(confirm.success).toBe(true);
    expect(confirm.recoveryCodes).toHaveLength(8);
    expect(prisma.account.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'account-uuid-1' },
        data: expect.objectContaining({
          totpEnabled: true,
        }),
      }),
    );
  });

  it('confirm2fa rejects invalid code', async () => {
    await expect(
      service.confirm2fa('account-uuid-1', '000000'),
    ).rejects.toThrow(BadRequestException);
  });

  it('disable2fa deactivates 2FA with correct password', async () => {
    const res = await service.disable2fa('account-uuid-1', 'securePassword123');

    expect(res.success).toBe(true);
    expect(prisma.account.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'account-uuid-1' },
        data: expect.objectContaining({
          totpEnabled: false,
          totpSecret: null,
          totpRecoveryCodes: [],
        }),
      }),
    );
  });

  it('disable2fa rejects wrong password', async () => {
    await expect(
      service.disable2fa('account-uuid-1', 'wrongPassword'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
