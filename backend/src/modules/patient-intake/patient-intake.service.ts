import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from '../patients/dto/create-patient.dto';
import { PatientsService } from '../patients/patients.service';
import { UpdateClinicalRecordDto } from '../patients/dto/update-clinical-record.dto';
import * as crypto from 'crypto';
import { SubmitIntakeFormDto } from './dto/submit-intake-form.dto';

@Injectable()
export class PatientIntakeService {
  constructor(
    private prisma: PrismaService,
    private patientsService: PatientsService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private getTokenSecret(): string {
    return (
      process.env.PATIENT_INTAKE_LINK_SECRET ||
      process.env.JWT_SECRET ||
      'patient-intake-link-secret'
    );
  }

  private generateToken(nutritionistId: string, tokenVersion: number): string {
    return crypto
      .createHmac('sha256', this.getTokenSecret())
      .update(`${nutritionistId}:${tokenVersion}`)
      .digest('base64url');
  }

  private buildLinkPayload(link: {
    id: string;
    nutritionistId: string;
    tokenVersion: number;
    tokenHash: string;
    status: string;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...link,
      token: this.generateToken(link.nutritionistId, link.tokenVersion),
    };
  }

  async getIntakeLink(nutritionistId: string) {
    const existing = await this.prisma.patientIntakeLink.findUnique({
      where: { nutritionistId },
    });

    if (!existing) {
      return null;
    }

    return this.buildLinkPayload(existing);
  }

  async getOrCreateIntakeLink(nutritionistId: string) {
    let link = await this.prisma.patientIntakeLink.findUnique({
      where: { nutritionistId },
    });

    if (!link) {
      const tokenVersion = 1;
      const token = this.generateToken(nutritionistId, tokenVersion);
      link = await this.prisma.patientIntakeLink.create({
        data: {
          nutritionistId,
          tokenVersion,
          tokenHash: this.hashToken(token),
          status: 'ACTIVE',
        },
      });
    }

    return this.buildLinkPayload(link);
  }

  async regenerateIntakeLink(nutritionistId: string) {
    const existing = await this.prisma.patientIntakeLink.findUnique({
      where: { nutritionistId },
    });

    if (!existing) {
      const tokenVersion = 1;
      const token = this.generateToken(nutritionistId, tokenVersion);
      const link = await this.prisma.patientIntakeLink.create({
        data: {
          nutritionistId,
          tokenVersion,
          tokenHash: this.hashToken(token),
          status: 'ACTIVE',
        },
      });
      return this.buildLinkPayload(link);
    }

    const tokenVersion = existing.tokenVersion + 1;
    const token = this.generateToken(nutritionistId, tokenVersion);
    const link = await this.prisma.patientIntakeLink.update({
      where: { nutritionistId },
      data: {
        tokenVersion,
        tokenHash: this.hashToken(token),
        status: 'ACTIVE',
      },
    });

    return this.buildLinkPayload(link);
  }

  async setIntakeLinkStatus(
    nutritionistId: string,
    status: 'ACTIVE' | 'DISABLED',
  ) {
    const link = await this.prisma.patientIntakeLink.findUnique({
      where: { nutritionistId },
    });

    if (!link) {
      throw new NotFoundException(
        'No existe un link de captura para este nutricionista',
      );
    }

    return this.prisma.patientIntakeLink.update({
      where: { nutritionistId },
      data: { status },
    });
  }

  async validateToken(token: string) {
    const tokenHash = this.hashToken(token);

    const link = await this.prisma.patientIntakeLink.findUnique({
      where: { tokenHash },
      include: {
        nutritionist: {
          select: {
            id: true,
            fullName: true,
            specialty: true,
          },
        },
      },
    });

    if (!link) {
      return { valid: false, reason: 'NOT_FOUND' };
    }

    if (link.status === 'DISABLED') {
      return { valid: false, reason: 'DISABLED' };
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return { valid: false, reason: 'EXPIRED' };
    }

    return {
      valid: true,
      link,
      nutritionist: link.nutritionist,
    };
  }

  async submitIntakeForm(token: string, dto: SubmitIntakeFormDto) {
    const validation = await this.validateToken(token);

    if (!validation.valid) {
      if (validation.reason === 'NOT_FOUND') {
        throw new NotFoundException('Link de formulario no válido');
      }
      if (validation.reason === 'DISABLED') {
        throw new BadRequestException('Este formulario no está activo');
      }
      if (validation.reason === 'EXPIRED') {
        throw new BadRequestException('Este formulario ha expirado');
      }
    }

    if (dto.honeypot && dto.honeypot.length > 0) {
      throw new BadRequestException('Formulario inválido');
    }

    const link = validation.link!;

    const existingSubmission =
      await this.prisma.patientIntakeSubmission.findFirst({
        where: {
          linkId: link.id,
          status: 'PENDING',
          payload: {
            path: ['email'],
            equals: dto.email || '',
          },
        },
      });

    if (existingSubmission && dto.email) {
      throw new BadRequestException(
        'Ya tienes un envío pendiente con este correo. Tu nutricionista lo revisará pronto.',
      );
    }

    const safePayload: Record<string, unknown> = { ...dto };
    delete safePayload.honeypot;
    delete safePayload.status;

    const submission = await this.prisma.patientIntakeSubmission.create({
      data: {
        linkId: link.id,
        nutritionistId: link.nutritionistId,
        payload: safePayload as any,
        status: 'PENDING',
      },
    });

    return {
      id: submission.id,
      message: 'Formulario recibido. Tu nutricionista lo revisará pronto.',
    };
  }

  async getSubmissions(
    nutritionistId: string,
    status?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const where: any = { nutritionistId };
    if (status && status !== 'TODOS') {
      where.status = status;
    }

    const [total, pendingCount, data] = await Promise.all([
      this.prisma.patientIntakeSubmission.count({ where }),
      this.prisma.patientIntakeSubmission.count({
        where: { nutritionistId, status: 'PENDING' },
      }),
      this.prisma.patientIntakeSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        pendingCount,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async getSubmission(nutritionistId: string, submissionId: string) {
    const submission = await this.prisma.patientIntakeSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (submission.nutritionistId !== nutritionistId) {
      throw new ForbiddenException('No tienes acceso a esta solicitud');
    }

    return submission;
  }

  async reviewSubmission(
    nutritionistId: string,
    submissionId: string,
    action: 'APPROVED' | 'REJECTED',
    rejectReason?: string,
  ) {
    const submission = await this.prisma.patientIntakeSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (submission.nutritionistId !== nutritionistId) {
      throw new ForbiddenException('No tienes acceso a esta solicitud');
    }

    if (submission.status !== 'PENDING') {
      throw new BadRequestException('Esta solicitud ya fue revisada');
    }

    if (action === 'REJECTED') {
      return this.prisma.patientIntakeSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: nutritionistId,
          rejectReason,
        },
      });
    }

    const payload = submission.payload as any;

    const nutritionist = await this.prisma.nutritionist.findUnique({
      where: { id: nutritionistId },
      select: { accountId: true },
    });

    if (!nutritionist) {
      throw new NotFoundException('Nutricionista no encontrado');
    }

    const clinicalRecordDto: UpdateClinicalRecordDto = {
      vitalHistory: {
        occupation: payload.occupation || undefined,
        workSchedule: payload.workSchedule || undefined,
        medications: payload.medications || undefined,
        supplementsOrDrugs: payload.drugsSupplements || undefined,
        diagnosedPathologies: payload.diagnosedPathologies || undefined,
      },
      gynecoObstetric: {
        isPregnant: payload.pregnant ?? undefined,
        pregnancyWeeks: payload.pregnancyWeeks ?? undefined,
        pregestationalWeight: payload.pregestationalWeight ?? undefined,
      },
      nutritionalAnamnesis: {
        foodFrequency: payload.foodFrequency || undefined,
        recall24h: payload.recall24h || undefined,
        eatingPreferences: payload.eatingPreferences || payload.likes || undefined,
        clinicalObservations: payload.clinicalObservations || undefined,
      },
      anthropometry: {
        skinfolds: {
          tricipital: payload.pliegueTricipital ?? undefined,
          bicipital: payload.pliegueBicipital ?? undefined,
          subescapular: payload.pliegueSubescapular ?? undefined,
          suprailiac: payload.pliegueSuprailiaco ?? undefined,
        },
        circumferences: {
          kneeHeight: payload.kneeHeight ?? undefined,
          calfCircumference: payload.calfCircumference ?? undefined,
          armCircumference: payload.armCircumference ?? undefined,
          waistCircumference: payload.waistCircumference ?? undefined,
          hipCircumference: payload.hipCircumference ?? undefined,
        },
      },
      dataSources: {
        vitalHistory: 'patient',
        gynecoObstetric: 'patient',
        nutritionalAnamnesis: 'patient',
        anthropometry: 'patient',
      },
    };

    const createPatientDto: CreatePatientDto = {
      fullName: payload.fullName,
      email: payload.email || undefined,
      phone: payload.phone || undefined,
      documentId: payload.documentId || undefined,
      birthDate: payload.birthDate || undefined,
      gender: payload.gender || undefined,
      height: payload.height || undefined,
      weight: payload.weight || undefined,
      activityLevel: payload.activityLevel || undefined,
      nutritionalFocus: payload.nutritionalFocus || undefined,
      fitnessGoals: payload.fitnessGoals || undefined,
      dietRestrictions: payload.dietRestrictions || [],
      likes: payload.likes || undefined,
      clinicalRecord: clinicalRecordDto,
      recalculateNutrition: true,
    } as any;

    const patient = await this.patientsService.create(
      nutritionist.accountId,
      nutritionistId,
      createPatientDto,
    );

    return this.prisma.patientIntakeSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: nutritionistId,
        patientId: patient.id,
      },
    });
  }

  async getSubmissionStats(nutritionistId: string) {
    const [pending, approved, rejected] = await Promise.all([
      this.prisma.patientIntakeSubmission.count({
        where: { nutritionistId, status: 'PENDING' },
      }),
      this.prisma.patientIntakeSubmission.count({
        where: { nutritionistId, status: 'APPROVED' },
      }),
      this.prisma.patientIntakeSubmission.count({
        where: { nutritionistId, status: 'REJECTED' },
      }),
    ]);

    return { pending, approved, rejected };
  }
}
