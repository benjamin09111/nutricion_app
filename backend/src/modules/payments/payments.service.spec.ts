import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { PermissionsService } from '../permissions/permissions.service';
import { PlanUsageService } from '../permissions/plan-usage.service';
import { DiscountCodesService } from '../discount-codes/discount-codes.service';
import { WhatsAppService } from '../notifications/whatsapp.service';
import { MailService } from '../mail/mail.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: PermissionsService, useValue: {} },
        { provide: PlanUsageService, useValue: {} },
        { provide: DiscountCodesService, useValue: {} },
        { provide: WhatsAppService, useValue: {} },
        { provide: MailService, useValue: {} },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
