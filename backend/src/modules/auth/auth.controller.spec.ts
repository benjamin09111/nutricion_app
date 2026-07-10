import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';
import { GoogleIntegrationService } from '../integrations/google-integration.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { login: jest.Mock; register: jest.Mock };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      register: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: MailService, useValue: {} },
        { provide: GoogleIntegrationService, useValue: {} },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates credential login and creates the HTTP-only session', async () => {
    const credentials = {
      email: 'nutri@nutrinet.cl',
      password: 'Clave.123',
      rememberMe: true,
    };

    authService.login.mockResolvedValue({
      access_token: 'signed-token',
      user: { role: 'NUTRITIONIST' },
    });
    const response = { cookie: jest.fn() } as any;

    await controller.login(credentials, response);

    expect(authService.login).toHaveBeenCalledWith(credentials);
    expect(response.cookie).toHaveBeenCalledWith(
      'auth_token_http',
      'signed-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
  });

  it('delegates registration to the auth service', () => {
    const registration = {
      email: 'nutri@nutrinet.cl',
      password: 'Clave.123',
      fullName: 'Nutri Ejemplo',
    };

    controller.register(registration);

    expect(authService.register).toHaveBeenCalledWith(registration);
  });
});
