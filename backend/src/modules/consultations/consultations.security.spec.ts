import { Test, TestingModule } from '@nestjs/testing';
import { ConsultationsService } from './consultations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PatientsService } from '../patients/patients.service';
import { encryptSensitiveText } from '../../common/utils/crypto.util';

describe('ConsultationsService - Clinical Privacy & Encryption', () => {
  let service: ConsultationsService;
  let prisma: any;

  const mockConsultation = {
    id: 'consultation-1',
    patientId: 'patient-1',
    nutritionistId: 'nutri-1',
    date: new Date(),
    title: 'Control Mensual',
    description: encryptSensitiveText('Paciente reporta adherencia a la pauta y disminución de fatiga.'),
    metrics: [],
    plansDelivered: true,
    patient: { fullName: 'Juan Pérez' },
  };

  beforeEach(async () => {
    prisma = {
      patient: {
        findFirst: jest.fn().mockResolvedValue({ id: 'patient-1' }),
      },
      consultation: {
        count: jest.fn().mockResolvedValue(5),
        create: jest.fn().mockImplementation(({ data, select }) => {
          return Promise.resolve({
            ...mockConsultation,
            ...data,
          });
        }),
        findUnique: jest.fn().mockResolvedValue({ ...mockConsultation }),
        findMany: jest.fn().mockResolvedValue([{ ...mockConsultation }]),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...mockConsultation,
            ...data,
          }),
        ),
      },
      $transaction: jest.fn().mockImplementation((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: CacheService,
          useValue: {
            invalidateNutritionistPrefix: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            ensureWithinLimit: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: PatientsService, useValue: {} },
      ],
    }).compile();

    service = module.get<ConsultationsService>(ConsultationsService);
  });

  it('encrypts clinical description on create and saves cipher text in database', async () => {
    const rawNote = 'Observación clínica altamente sensible: paciente en tratamiento de anemia.';
    await service.create('account-1', 'nutri-1', {
      patientId: 'patient-1',
      title: 'Control Nutricional',
      date: new Date().toISOString(),
      description: rawNote,
      metrics: [],
    });

    expect(prisma.consultation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: expect.stringMatching(/^enc:v1:/),
        }),
      }),
    );
  });

  it('decrypts encrypted clinical description transparently on findOne', async () => {
    const result = await service.findOne('nutri-1', 'consultation-1');

    expect(result.description).toBe('Paciente reporta adherencia a la pauta y disminución de fatiga.');
    expect(result.patientName).toBe('Juan Pérez');
  });

  it('decrypts encrypted clinical description transparently on findAll', async () => {
    const result = await service.findAll('nutri-1', 1, 10);

    expect(result.data[0].description).toBe('Paciente reporta adherencia a la pauta y disminución de fatiga.');
  });
});
