import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveRequiredUrl } from '../../common/utils/runtime-url.util';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { MailService } from '../mail/mail.service';
import { PermissionsService } from '../permissions/permissions.service';
import { CreatePatientPortalInvitationDto } from './dto/create-patient-portal-invitation.dto';
import { CreatePatientPortalEntryDto } from './dto/create-patient-portal-entry.dto';
import { CreatePatientPortalQuestionDto } from './dto/create-patient-portal-question.dto';
import { CreatePatientPortalReplyDto } from './dto/create-patient-portal-reply.dto';
import { CreatePatientPortalNotificationDto } from './dto/create-patient-portal-notification.dto';
import { RequestAppointmentDto } from './dto/request-appointment.dto';

type PortalSessionPayload = {
  kind: 'patient-portal';
  patientId: string;
  nutritionistId: string;
  invitationId: string;
};

type PortalEntryKind =
  | 'QUESTION'
  | 'TRACKING'
  | 'REPLY'
  | 'NOTIFICATION'
  | 'MESSAGE';

type NormalizedPortalEntry = {
  id: string;
  kind: PortalEntryKind;
  body?: string | null;
  payload: PortalEntryPayload;
  replyToId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  replyTo: {
    id: string;
    kind: PortalEntryKind;
    body?: string | null;
    payload: PortalEntryPayload;
    replyToId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  replies: Array<{
    id: string;
    kind: PortalEntryKind;
    body?: string | null;
    payload: PortalEntryPayload;
    replyToId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

type PortalEntryPayload = {
  entryDate?: string;
  sections?: TrackingSections;
  source?: 'patient' | 'nutritionist';
  notificationTitle?: string;
  notificationType?: 'INFO' | 'REMINDER' | 'ALERT';
};

type PortalEntryRecord = {
  id: string;
  kind: string;
  body: string | null;
  payload: unknown;
  replyToId: string | null;
  createdAt: Date;
  updatedAt: Date;
  replyTo?: PortalEntryRecord | null;
  replies?: PortalEntryRecord[];
};

type InvitationSummary = {
  id: string;
  email: string | null;
  expiresAt: Date;
  status: string;
  lastSentAt: Date | null;
  verifiedAt: Date | null;
  revokedAt: Date | null;
  blockedAt: Date | null;
  resourceIds: string[];
  deliverableCreationIds: string[];
  createdAt: Date;
  accessCode: string;
};

type PortalResource = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  format: string;
  fileUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PortalDeliverable = {
  id: string;
  name: string;
  type: string;
  format: string;
  content: unknown;
  metadata: unknown;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

type PortalFollowUpPatient = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  documentId: string | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PortalFollowUpEntry = {
  id: string;
  patientId: string;
  kind: PortalEntryKind;
  body: string | null;
  replyToId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TrackingSections = {
  alimentacion?: string;
  suplementos?: string;
  actividadFisica?: string;
};

const ENTRY_SELECT = {
  id: true,
  kind: true,
  body: true,
  payload: true,
  replyToId: true,
  createdAt: true,
  updatedAt: true,
  replyTo: {
    select: {
      id: true,
      kind: true,
      body: true,
      payload: true,
      replyToId: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  replies: {
    orderBy: {
      createdAt: 'asc' as const,
    },
    select: {
      id: true,
      kind: true,
      body: true,
      payload: true,
      replyToId: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} as const;

@Injectable()
export class PatientPortalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly appointmentsService: AppointmentsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  private async getNutritionistAccountId(nutritionistId: string) {
    const nutritionist = await this.prisma.nutritionist.findUnique({
      where: { id: nutritionistId },
      select: { accountId: true },
    });

    return nutritionist?.accountId || null;
  }

  private async assertFollowUpLimit(params: {
    nutritionistId: string;
    accountId: string | null;
    excludedPatientId?: string;
    excludedInvitationId?: string;
  }) {
    const {
      nutritionistId,
      accountId,
      excludedPatientId,
      excludedInvitationId,
    } = params;

    if (!accountId) return;

    const limit = await this.permissionsService.getFeatureLimit(
      accountId,
      'followups.private.active.limit',
    );

    if (limit === Infinity) return;

    const activeCount = await this.prisma.patientPortalInvitation.count({
      where: {
        nutritionistId,
        status: 'ACTIVE',
        revokedAt: null,
        blockedAt: null,
        expiresAt: { gte: new Date() },
        ...(excludedPatientId ? { patientId: { not: excludedPatientId } } : {}),
        ...(excludedInvitationId ? { id: { not: excludedInvitationId } } : {}),
      },
    });

    if (activeCount >= limit) {
      throw new ForbiddenException(
        'Tu plan actual alcanzó el límite de seguimientos privados activos',
      );
    }
  }

  async createInvitation(
    nutritionistId: string,
    patientId: string,
    dto: CreatePatientPortalInvitationDto,
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, nutritionistId },
      select: {
        id: true,
        fullName: true,
        email: true,
        nutritionist: {
          select: {
            id: true,
            accountId: true,
            fullName: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('No encontramos ese paciente');
    }

    const expiresInDays =
      dto.expiresInDays && dto.expiresInDays > 0 ? dto.expiresInDays : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const accessCode = this.formatAccessCodeForDisplay(
      this.getPortalAccessCode(patientId, nutritionistId),
    );
    const nutritionistAccountId = patient.nutritionist.accountId;

    await this.assertFollowUpLimit({
      nutritionistId,
      accountId: nutritionistAccountId,
      excludedPatientId: patientId,
    });

    const invitation = await this.prisma.$transaction(async (tx) => {
      await tx.patientPortalInvitation.updateMany({
        where: {
          patientId,
          nutritionistId,
          status: { in: ['ACTIVE', 'BLOCKED'] },
        },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
          blockedAt: null,
        },
      });

      return tx.patientPortalInvitation.create({
        data: {
          patientId,
          nutritionistId,
          email: dto.email?.trim() || patient.email || null,
          tokenHash,
          expiresAt,
          status: 'ACTIVE',
          lastSentAt: new Date(),
          resourceIds: Array.isArray(dto.resourceIds) ? dto.resourceIds : [],
          deliverableCreationIds: Array.isArray(dto.deliverableCreationIds)
            ? dto.deliverableCreationIds
            : [],
        },
        select: {
          id: true,
          email: true,
          expiresAt: true,
          createdAt: true,
          status: true,
        },
      });
    });

    const shareUrl = this.buildPortalUrl(token);
    const recipientEmail = dto.email?.trim() || patient.email || '';

    if (recipientEmail) {
      this.mailService
        .sendPatientPortalInvitationEmail({
          email: recipientEmail,
          patientName: patient.fullName,
          nutritionistName: patient.nutritionist.fullName,
          shareUrl,
          expiresAt,
          accessCode,
        })
        .catch((err) => console.error('Error sending portal invitation:', err));
    }

    return {
      invitation,
      shareUrl,
      expiresAt,
      accessCode,
    };
  }

  async previewInvitation(token: string) {
    const invitation = await this.findInvitationByToken(token);

    return {
      patientName: invitation.patient.fullName,
      patientEmail: invitation.email || invitation.patient.email || null,
      nutritionistName: invitation.nutritionist.fullName,
      expiresAt: invitation.expiresAt,
    };
  }

  async verifyInvitation(token: string, email: string, accessCode: string) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      throw new BadRequestException('Debes ingresar un correo');
    }

    const normalizedCode = this.normalizeAccessCode(accessCode);
    if (!normalizedCode) {
      throw new BadRequestException('Debes ingresar tu código de acceso');
    }

    const invitation = await this.findInvitationByToken(token);
    const invitationEmail = invitation.email
      ? this.normalizeEmail(invitation.email)
      : null;
    const expectedCode = this.getPortalAccessCode(
      invitation.patientId,
      invitation.nutritionistId,
    );

    if (invitationEmail && invitationEmail !== normalizedEmail) {
      throw new ForbiddenException('Ese correo no coincide con la invitación');
    }

    if (normalizedCode !== expectedCode) {
      throw new ForbiddenException('El código de acceso es incorrecto');
    }

    if (
      invitation.status !== 'ACTIVE' ||
      invitation.revokedAt ||
      invitation.blockedAt ||
      invitation.expiresAt.getTime() < Date.now()
    ) {
      throw new ForbiddenException('La invitación expiró o ya no está activa');
    }

    if (!invitation.email) {
      await this.prisma.patientPortalInvitation.update({
        where: { id: invitation.id },
        data: {
          email: normalizedEmail,
        },
      });
    }

    await this.prisma.patientPortalInvitation.update({
      where: { id: invitation.id },
      data: {
        verifiedAt: new Date(),
      },
    });

    const accessToken = await this.jwtService.signAsync(
      {
        kind: 'patient-portal',
        patientId: invitation.patientId,
        nutritionistId: invitation.nutritionistId,
        invitationId: invitation.id,
      } satisfies PortalSessionPayload,
      {
        secret:
          this.configService.get<string>('PORTAL_JWT_SECRET') ||
          this.configService.get<string>('JWT_SECRET') ||
          'secret',
        expiresIn: '30d',
      },
    );

    const overview = await this.buildOverview(
      invitation.nutritionistId,
      invitation.patientId,
    );

    return {
      accessToken,
      ...overview,
    };
  }

  async login(email: string, accessCode: string) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      throw new BadRequestException('Debes ingresar un correo');
    }

    const normalizedCode = this.normalizeAccessCode(accessCode);
    if (!normalizedCode) {
      throw new BadRequestException('Debes ingresar tu código de acceso');
    }

    // Buscar invitaciones activas por email
    const invitations = await this.prisma.patientPortalInvitation.findMany({
      where: {
        email: normalizedEmail,
        status: { in: ['ACTIVE', 'PENDING'] },
        revokedAt: null,
        blockedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (invitations.length === 0) {
      throw new ForbiddenException('No hay portales activos para ese correo');
    }

    // Verificar el código para cada invitación
    let validInvitation = null;
    for (const inv of invitations) {
      const expectedCode = this.getPortalAccessCode(
        inv.patientId,
        inv.nutritionistId,
      );
      if (normalizedCode === expectedCode) {
        validInvitation = inv;
        break;
      }
    }

    if (!validInvitation) {
      throw new ForbiddenException('Código de acceso incorrecto');
    }

    // Si encontramos una válida, generamos el token JWT
    const accessToken = await this.jwtService.signAsync(
      {
        kind: 'patient-portal',
        patientId: validInvitation.patientId,
        nutritionistId: validInvitation.nutritionistId,
        invitationId: validInvitation.id,
      } satisfies PortalSessionPayload,
      {
        secret:
          this.configService.get<string>('PORTAL_JWT_SECRET') ||
          this.configService.get<string>('JWT_SECRET') ||
          'secret',
        expiresIn: '30d',
      },
    );

    // Actualizar fecha de verificación
    await this.prisma.patientPortalInvitation.update({
      where: { id: validInvitation.id },
      data: {
        verifiedAt: new Date(),
        status: 'ACTIVE', // Aseguramos que pase a ACTIVE si estaba PENDING
      },
    });

    const overview = await this.buildOverview(
      validInvitation.nutritionistId,
      validInvitation.patientId,
    );

    return {
      accessToken,
      invitationId: validInvitation.id,
      ...overview,
    };
  }

  async getPortalSessionOverview(session: PortalSessionPayload) {
    return this.buildOverview(session.nutritionistId, session.patientId);
  }

  async getPortalOverview(nutritionistId: string, patientId: string) {
    return this.buildOverview(nutritionistId, patientId);
  }

  async getFollowUps(
    nutritionistId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      documentId?: string;
      tags?: string;
      pendingOnly?: boolean;
    },
  ) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.max(1, Math.min(50, Number(params.limit || 10)));

    const where: any = {
      nutritionistId,
    };

    if (params.status && params.status !== 'Todos') {
      where.status = params.status === 'Activos' ? 'Active' : 'Inactive';
    }

    if (params.search?.trim()) {
      const search = params.search.trim();
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { documentId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (params.documentId?.trim()) {
      where.documentId = {
        contains: params.documentId.trim(),
        mode: 'insensitive',
      };
    }

    const parsedTags = params.tags
      ?.split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (parsedTags && parsedTags.length > 0) {
      where.tags = { hasSome: parsedTags };
    }

    const patients = (await this.prisma.patient.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        documentId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })) as PortalFollowUpPatient[];

    const patientIds = patients.map((patient) => patient.id);
    const entries = patientIds.length
      ? ((await this.prisma.patientPortalEntry.findMany({
          where: {
            nutritionistId,
            patientId: { in: patientIds },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            patientId: true,
            kind: true,
            body: true,
            replyToId: true,
            createdAt: true,
            updatedAt: true,
          },
        })) as PortalFollowUpEntry[])
      : [];

    const entriesByPatient = new Map<string, PortalFollowUpEntry[]>();
    const repliedQuestionIds = new Set<string>();

    entries.forEach((entry) => {
      const currentEntries = entriesByPatient.get(entry.patientId) || [];
      currentEntries.push(entry);
      entriesByPatient.set(entry.patientId, currentEntries);

      if (entry.kind === 'REPLY' && entry.replyToId) {
        repliedQuestionIds.add(entry.replyToId);
      }
    });

    const followUps = patients.map((patient) => {
      const patientEntries = entriesByPatient.get(patient.id) || [];
      const questionEntries = patientEntries.filter(
        (entry) => entry.kind === 'QUESTION',
      );
      const pendingQuestions = questionEntries.filter(
        (entry) => !repliedQuestionIds.has(entry.id),
      ).length;
      const latestEntry = patientEntries[0] || null;
      const latestQuestion = questionEntries[0] || null;

      return {
        patient,
        pendingQuestions,
        latestEntryAt: latestEntry?.createdAt || null,
        latestEntryKind: (latestEntry?.kind || null) as PortalEntryKind | null,
        latestEntryBody: latestEntry?.body || null,
        latestQuestionAt: latestQuestion?.createdAt || null,
        latestQuestionBody: latestQuestion?.body || null,
        latestQuestionId: latestQuestion?.id || null,
        hasAttention: pendingQuestions > 0,
        attentionAt:
          (pendingQuestions > 0
            ? latestQuestion?.createdAt ||
              latestEntry?.createdAt ||
              patient.updatedAt
            : latestEntry?.createdAt || patient.updatedAt) || patient.updatedAt,
      };
    });

    const pendingCount = followUps.filter((item) => item.hasAttention).length;
    const filtered = followUps.filter((item) =>
      params.pendingOnly ? item.hasAttention : true,
    );
    const sorted = filtered.sort((a, b) => {
      if (b.pendingQuestions !== a.pendingQuestions) {
        return b.pendingQuestions - a.pendingQuestions;
      }

      const attentionDiff =
        new Date(b.attentionAt).getTime() - new Date(a.attentionAt).getTime();
      if (attentionDiff !== 0) return attentionDiff;

      return b.patient.updatedAt.getTime() - a.patient.updatedAt.getTime();
    });

    const filteredTotal = sorted.length;
    const lastPage = Math.max(1, Math.ceil(filteredTotal / limit));
    const safePage = Math.min(page, lastPage);
    const start = (safePage - 1) * limit;

    return {
      data: sorted.slice(start, start + limit),
      meta: {
        total: followUps.length,
        filteredTotal,
        pendingCount,
        page: safePage,
        lastPage,
      },
    };
  }

  async setAccessStatus(
    nutritionistId: string,
    patientId: string,
    status: 'ACTIVE' | 'BLOCKED',
  ) {
    const invitation = await this.prisma.patientPortalInvitation.findFirst({
      where: {
        patientId,
        nutritionistId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!invitation) {
      throw new NotFoundException(
        'No encontramos un acceso para este paciente',
      );
    }

    if (status === 'ACTIVE' && invitation.status !== 'ACTIVE') {
      const nutritionistAccountId =
        await this.getNutritionistAccountId(nutritionistId);
      await this.assertFollowUpLimit({
        nutritionistId,
        accountId: nutritionistAccountId,
        excludedInvitationId: invitation.id,
      });
    }

    const updated = await this.prisma.patientPortalInvitation.update({
      where: { id: invitation.id },
      data: {
        status,
        blockedAt: status === 'BLOCKED' ? new Date() : null,
        revokedAt: status === 'ACTIVE' ? null : invitation.revokedAt,
      },
      select: {
        id: true,
        status: true,
        blockedAt: true,
        revokedAt: true,
        updatedAt: true,
      },
    });

    return {
      invitation: updated,
      overview: await this.buildOverview(nutritionistId, patientId),
    };
  }

  async createQuestion(
    session: PortalSessionPayload,
    dto: CreatePatientPortalQuestionDto,
  ) {
    const body = dto.message.trim();
    if (!body) {
      throw new BadRequestException('Escribe tu pregunta o consulta');
    }

    const entry = await this.prisma.patientPortalEntry.create({
      data: {
        patientId: session.patientId,
        nutritionistId: session.nutritionistId,
        invitationId: session.invitationId,
        kind: 'QUESTION',
        body,
        payload: {
          source: 'patient',
        },
      },
      select: ENTRY_SELECT,
    });

    return {
      entry,
      overview: await this.buildOverview(
        session.nutritionistId,
        session.patientId,
      ),
    };
  }

  async createTrackingEntry(
    session: PortalSessionPayload,
    dto: CreatePatientPortalEntryDto,
  ) {
    const body = dto.alimentacion?.trim() || '';
    if (!body) {
      throw new BadRequestException(
        'Escribe algo en tu diario antes de publicar',
      );
    }

    const entryDate = this.normalizeDiaryDate(dto.entryDate);

    const entry = await this.prisma.patientPortalEntry.create({
      data: {
        patientId: session.patientId,
        nutritionistId: session.nutritionistId,
        invitationId: session.invitationId,
        kind: 'TRACKING',
        body: body,
        payload: {
          source: 'patient',
          entryDate,
        },
      },
      select: ENTRY_SELECT,
    });

    return {
      entry,
      overview: await this.buildOverview(
        session.nutritionistId,
        session.patientId,
      ),
    };
  }

  async createReply(
    nutritionistId: string,
    patientId: string,
    dto: CreatePatientPortalReplyDto,
  ) {
    const [question, patient] = await Promise.all([
      this.prisma.patientPortalEntry.findFirst({
        where: {
          id: dto.questionId,
          patientId,
          nutritionistId,
          kind: 'QUESTION',
        },
        select: ENTRY_SELECT,
      }),
      this.prisma.patient.findFirst({
        where: { id: patientId, nutritionistId },
        select: {
          id: true,
          fullName: true,
          email: true,
          nutritionist: {
            select: {
              fullName: true,
            },
          },
        },
      }),
    ]);

    if (!question) {
      throw new NotFoundException('No encontramos esa pregunta');
    }

    if (!patient) {
      throw new NotFoundException('No encontramos ese paciente');
    }

    const body = dto.message.trim();
    if (!body) {
      throw new BadRequestException('Escribe un mensaje de respuesta');
    }

    const entry = await this.prisma.patientPortalEntry.create({
      data: {
        patientId,
        nutritionistId,
        kind: 'REPLY',
        body,
        replyToId: question.id,
        payload: {
          source: 'nutritionist',
        },
      },
      select: ENTRY_SELECT,
    });

    const invitation = await this.prisma.patientPortalInvitation.findFirst({
      where: {
        patientId,
        nutritionistId,
        status: 'ACTIVE',
        revokedAt: null,
        blockedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        email: true,
      },
    });

    const recipientEmail = invitation?.email || patient.email || null;
    if (recipientEmail) {
      this.mailService
        .sendPatientPortalReplyEmail({
          email: recipientEmail,
          patientName: patient.fullName,
          nutritionistName: patient.nutritionist.fullName,
          question: question.body,
          reply: body,
        })
        .catch((err) =>
          console.error('Error sending portal reply email:', err),
        );
    }

    return {
      entry,
      overview: await this.buildOverview(nutritionistId, patientId),
    };
  }

  async createNotification(
    nutritionistId: string,
    patientId: string,
    dto: CreatePatientPortalNotificationDto,
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, nutritionistId },
      select: {
        id: true,
        fullName: true,
        email: true,
        nutritionist: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('No encontramos ese paciente');
    }

    const title = dto.title?.trim() || 'Notificación del nutricionista';
    const message = dto.message.trim();
    if (!message) {
      throw new BadRequestException('Escribe un mensaje para la notificación');
    }

    const notificationType = message.length > 220 ? 'ALERT' : 'INFO';

    const entry = await this.prisma.patientPortalEntry.create({
      data: {
        patientId,
        nutritionistId,
        kind: 'NOTIFICATION',
        body: message,
        payload: {
          source: 'nutritionist',
          notificationTitle: title,
          notificationType,
        },
      },
      select: ENTRY_SELECT,
    });

    const invitation = await this.prisma.patientPortalInvitation.findFirst({
      where: {
        patientId,
        nutritionistId,
        status: 'ACTIVE',
        revokedAt: null,
        blockedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        email: true,
      },
    });

    const recipientEmail = invitation?.email || patient.email || null;
    if (dto.sendEmail !== false && recipientEmail) {
      this.mailService
        .sendPatientPortalNotificationEmail({
          email: recipientEmail,
          patientName: patient.fullName,
          nutritionistName: patient.nutritionist.fullName,
          title,
          message,
        })
        .catch((err) =>
          console.error('Error sending portal notification email:', err),
        );
    }

    return {
      entry,
      overview: await this.buildOverview(nutritionistId, patientId),
    };
  }

  async createPortalMessage(
    nutritionistId: string,
    patientId: string,
    body: string,
  ) {
    if (!body?.trim()) {
      throw new BadRequestException('El mensaje no puede estar vacío');
    }

    const entry = await this.prisma.patientPortalEntry.create({
      data: {
        patientId,
        nutritionistId,
        kind: 'MESSAGE',
        body: body.trim(),
        payload: {
          source: 'nutritionist',
        },
      },
      select: ENTRY_SELECT,
    });

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, nutritionistId },
      select: {
        id: true,
        fullName: true,
        email: true,
        nutritionist: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (patient) {
      const invitation = await this.prisma.patientPortalInvitation.findFirst({
        where: {
          patientId,
          nutritionistId,
          status: 'ACTIVE',
          revokedAt: null,
          blockedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          email: true,
        },
      });

      const recipientEmail = invitation?.email || patient.email || null;
      if (recipientEmail) {
        this.mailService
          .sendPatientPortalMessageEmail({
            email: recipientEmail,
            patientName: patient.fullName,
            nutritionistName: patient.nutritionist.fullName,
            message: body.trim(),
          })
          .catch((err) =>
            console.error('Error sending portal message email:', err),
          );
      }
    }

    return {
      entry,
      overview: await this.buildOverview(nutritionistId, patientId),
    };
  }

  async requestAppointment(
    session: PortalSessionPayload,
    dto: RequestAppointmentDto,
  ) {
    const { patientId, nutritionistId } = session;

    const calendar = await this.prisma.appointmentCalendar.findFirst({
      where: { nutritionistId },
    });

    if (!calendar) {
      throw new BadRequestException(
        'El nutricionista no tiene agenda configurada',
      );
    }

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, nutritionistId },
      select: { fullName: true, email: true, phone: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    if (!dto.startAt || !dto.endAt) {
      throw new BadRequestException('Debes seleccionar un horario disponible');
    }

    const appointment = await this.appointmentsService.requestAppointment(
      nutritionistId,
      {
        calendarId: calendar.id,
        nutritionistId,
        patientId,
        guestName: patient.fullName,
        guestEmail: patient.email || undefined,
        guestPhone: patient.phone || undefined,
        start: dto.startAt,
        end: dto.endAt,
        message: dto.message,
        source: 'patient-portal',
      },
    );

    return {
      appointment,
      overview: await this.buildOverview(nutritionistId, patientId),
    };
  }

  private async buildOverview(nutritionistId: string, patientId: string) {
    const [patient, invitations, entries] = await Promise.all([
      this.prisma.patient.findFirst({
        where: { id: patientId, nutritionistId },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          documentId: true,
          status: true,
          weight: true,
          height: true,
          createdAt: true,
          nutritionist: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              settings: true,
            },
          },
          projects: {
            orderBy: { updatedAt: 'desc' },
            select: {
              id: true,
              name: true,
              description: true,
              mode: true,
              status: true,
              updatedAt: true,
              activeDietCreation: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
              activeRecipeCreation: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
              activeDeliverableCreation: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.patientPortalInvitation.findMany({
        where: {
          patientId,
          nutritionistId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 2,
        select: {
          id: true,
          email: true,
          expiresAt: true,
          status: true,
          lastSentAt: true,
          verifiedAt: true,
          revokedAt: true,
          blockedAt: true,
          createdAt: true,
          resourceIds: true,
          deliverableCreationIds: true,
        },
      }),
      this.prisma.patientPortalEntry.findMany({
        where: {
          patientId,
          nutritionistId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: ENTRY_SELECT,
      }),
    ]);

    if (!patient) {
      throw new NotFoundException('No encontramos ese paciente');
    }

    const activeInvitation =
      invitations.find(
        (invitation) =>
          invitation.status === 'ACTIVE' &&
          !invitation.revokedAt &&
          !invitation.blockedAt &&
          invitation.expiresAt.getTime() >= Date.now(),
      ) || null;
    const latestInvitation = invitations[0] || null;
    const sharingInvitation = activeInvitation || latestInvitation;

    const [sharedResources, sharedDeliverables, appointments] =
      await Promise.all([
        sharingInvitation?.resourceIds?.length
          ? this.prisma.resource.findMany({
              where: {
                id: { in: sharingInvitation.resourceIds },
                OR: [
                  { nutritionistId },
                  { isPublic: true },
                  { nutritionistId: null },
                ],
              },
              orderBy: { updatedAt: 'desc' },
              select: {
                id: true,
                title: true,
                content: true,
                category: true,
                tags: true,
                isPublic: true,
                format: true,
                fileUrl: true,
                createdAt: true,
                updatedAt: true,
              },
            })
          : Promise.resolve([] as PortalResource[]),
        sharingInvitation?.deliverableCreationIds?.length
          ? this.prisma.creation.findMany({
              where: {
                id: { in: sharingInvitation.deliverableCreationIds },
                nutritionistId,
                type: {
                  in: ['DIET', 'SHOPPING_LIST', 'RECIPE', 'FAST_DELIVERABLE'],
                },
              },
              orderBy: { updatedAt: 'desc' },
              select: {
                id: true,
                name: true,
                type: true,
                format: true,
                content: true,
                metadata: true,
                tags: true,
                createdAt: true,
                updatedAt: true,
              },
            })
          : Promise.resolve([] as PortalDeliverable[]),
        this.prisma.appointment.findMany({
          where: {
            patientId,
            status: {
              in: [
                'REQUESTED' as const,
                'SCHEDULED' as const,
                'CONFIRMED' as const,
              ],
            },
            OR: [
              { status: 'REQUESTED' as const },
              { startTime: { gte: new Date() } },
            ],
          },
          orderBy: { startTime: 'asc' },
          take: 10,
          select: {
            id: true,
            title: true,
            description: true,
            startTime: true,
            endTime: true,
            status: true,
            notes: true,
          },
        }),
      ]);

    const normalizedEntries = entries.map((entry) =>
      this.normalizeEntry(entry),
    );
    const questions = normalizedEntries.filter(
      (entry) => entry.kind === 'QUESTION',
    );
    const tracking = normalizedEntries.filter(
      (entry) => entry.kind === 'TRACKING',
    );
    const messages = normalizedEntries.filter(
      (entry) => entry.kind === 'MESSAGE',
    );

    const summary = this.buildSummary(normalizedEntries);

    return {
      patient,
      portal: {
        activeInvitation: activeInvitation
          ? this.formatInvitationSummary(
              activeInvitation,
              patientId,
              nutritionistId,
            )
          : null,
        latestInvitation: latestInvitation
          ? this.formatInvitationSummary(
              latestInvitation,
              patientId,
              nutritionistId,
            )
          : null,
      },
      summary,
      entries: normalizedEntries,
      questions,
      tracking,
      messages,
      notifications: normalizedEntries.filter(
        (entry) => entry.kind === 'NOTIFICATION',
      ),
      sharedResources,
      sharedDeliverables,
      appointments: appointments.map((apt) => ({
        ...apt,
        meetingUrl: null,
      })),
      status: activeInvitation?.status || 'NONE',
    };
  }

  private buildSummary(entries: NormalizedPortalEntry[]) {
    const questionEntries = entries.filter(
      (entry) => entry.kind === 'QUESTION',
    );
    const trackingEntries = entries.filter(
      (entry) => entry.kind === 'TRACKING',
    );
    const replyEntries = entries.filter((entry) => entry.kind === 'REPLY');
    const latestEntry = entries[0] || null;
    const latestEntryAt = latestEntry?.createdAt || null;
    const pendingQuestions = questionEntries.filter(
      (entry) => (entry.replies?.length || 0) === 0,
    ).length;
    const notificationsCount = entries.filter(
      (entry) => entry.kind === 'NOTIFICATION',
    ).length;

    const sectionCounts = trackingEntries.reduce(
      (acc, entry) => {
        const sections = entry.payload?.sections || {};
        if (sections.alimentacion) acc.alimentacion += 1;
        if (sections.suplementos) acc.suplementos += 1;
        if (sections.actividadFisica) acc.actividadFisica += 1;
        return acc;
      },
      {
        alimentacion: 0,
        suplementos: 0,
        actividadFisica: 0,
      },
    );

    let daysSinceLastEntry = 0;
    const alerts: string[] = [];
    if (!latestEntryAt) {
      alerts.push('Todavía no hay registros en el portal.');
    } else {
      const lastEntry = entries[0];
      daysSinceLastEntry = Math.floor(
        (Date.now() - new Date(lastEntry.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysSinceLastEntry > 3) {
        alerts.push(
          `Hace ${daysSinceLastEntry} días que no se actualiza el seguimiento.`,
        );
      }
    }

    if (pendingQuestions > 0) {
      alerts.push(
        `${pendingQuestions} consulta${pendingQuestions === 1 ? '' : 's'} sin responder.`,
      );
    }

    if (notificationsCount > 0) {
      alerts.push(
        `${notificationsCount} notificación${notificationsCount === 1 ? '' : 'es'} del nutri.`,
      );
    }

    if (trackingEntries.length > 0 && sectionCounts.actividadFisica === 0) {
      alerts.push('Todavía no hay actividad física registrada.');
    }

    return {
      totalEntries: entries.length,
      questionsCount: questionEntries.length,
      trackingCount: trackingEntries.length,
      repliesCount: replyEntries.length,
      pendingQuestions,
      notificationsCount,
      latestEntryAt,
      daysSinceLastEntry,
      sectionCounts,
      alerts,
    };
  }

  private buildTrackingSections(
    dto: CreatePatientPortalEntryDto,
  ): TrackingSections | null {
    const alimentacion = dto.alimentacion?.trim();
    const suplementos = dto.suplementos?.trim();
    const actividadFisica = dto.actividadFisica?.trim();

    if (!alimentacion && !suplementos && !actividadFisica) {
      return null;
    }

    return {
      ...(alimentacion ? { alimentacion } : {}),
      ...(suplementos ? { suplementos } : {}),
      ...(actividadFisica ? { actividadFisica } : {}),
    };
  }

  private buildTrackingSummary(sections: TrackingSections, entryDate?: string) {
    const dateLabel = this.normalizeDiaryDate(entryDate);
    const pieces = [
      dateLabel ? `Día ${dateLabel}` : null,
      sections.alimentacion ? `Alimentación: ${sections.alimentacion}` : null,
      sections.suplementos ? `Suplementos: ${sections.suplementos}` : null,
      sections.actividadFisica
        ? `Actividad física: ${sections.actividadFisica}`
        : null,
    ].filter(Boolean) as string[];

    return pieces.join(' ? ');
  }

  private normalizeDiaryDate(value?: string) {
    if (!value) return null;

    const normalized = value.trim();
    if (!normalized) return null;

    const parsed = new Date(`${normalized}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return normalized;
    }

    return parsed.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private normalizeEntry(entry: PortalEntryRecord): NormalizedPortalEntry {
    return {
      ...entry,
      kind: entry.kind as PortalEntryKind,
      payload: (entry.payload || {}) as PortalEntryPayload,
      replyTo: entry.replyTo
        ? {
            ...entry.replyTo,
            kind: entry.replyTo.kind as PortalEntryKind,
            payload: (entry.replyTo.payload || {}) as PortalEntryPayload,
          }
        : null,
      replies: (entry.replies || []).map((reply) => ({
        ...reply,
        kind: reply.kind as PortalEntryKind,
        payload: (reply.payload || {}) as PortalEntryPayload,
      })),
    };
  }

  private formatInvitationSummary(
    invitation: {
      id: string;
      email: string | null;
      expiresAt: Date;
      status: string;
      lastSentAt: Date | null;
      verifiedAt: Date | null;
      revokedAt: Date | null;
      blockedAt?: Date | null;
      resourceIds?: string[];
      deliverableCreationIds?: string[];
      createdAt: Date;
    },
    patientId: string,
    nutritionistId: string,
  ): InvitationSummary {
    return {
      ...invitation,
      blockedAt: invitation.blockedAt || null,
      resourceIds: invitation.resourceIds || [],
      deliverableCreationIds: invitation.deliverableCreationIds || [],
      accessCode: this.formatAccessCodeForDisplay(
        this.getPortalAccessCode(patientId, nutritionistId),
      ),
    };
  }

  private async findInvitationByToken(token: string) {
    const tokenHash = this.hashToken(token);
    const invitation = await this.prisma.patientPortalInvitation.findUnique({
      where: { tokenHash },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        nutritionist: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('La invitación no existe');
    }

    return invitation;
  }

  private getPortalAccessCode(patientId: string, nutritionistId: string) {
    const secret =
      this.configService.get<string>('PORTAL_ACCESS_CODE_SECRET') ||
      this.configService.get<string>('PORTAL_JWT_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'secret';

    const digest = createHash('sha256')
      .update(`${secret}:${nutritionistId}:${patientId}:patient-portal-code`)
      .digest();
    const code = digest.readUInt32BE(0) % 1000000;
    return code.toString().padStart(6, '0');
  }

  private formatAccessCodeForDisplay(code: string) {
    const digits = this.normalizeAccessCode(code).padStart(6, '0');
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}`;
  }

  private buildPortalUrl(token: string) {
    const baseUrl = resolveRequiredUrl(
      this.configService.get<string>('PORTAL_BASE_URL'),
      this.configService.get<string>('FRONTEND_URL'),
      this.configService.get<string>('APP_URL'),
    );

    return `${baseUrl}/portal/${token}`;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeAccessCode(code: string) {
    return code.replace(/\D/g, '').slice(0, 6);
  }
}
