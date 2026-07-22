import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SupportRequestType, SupportRequestStatus } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(data: {
    email: string;
    message?: string;
    type: string;
    subject?: string;
  }) {
    let dbType: SupportRequestType = SupportRequestType.OTHER;
    if (data.type === 'PASSWORD_RESET')
      dbType = SupportRequestType.PASSWORD_RESET;
    if (data.type === 'CONTACT') dbType = SupportRequestType.CONTACT;
    if (data.type === 'FEEDBACK') dbType = SupportRequestType.FEEDBACK;
    if (data.type === 'TESTIMONIO') dbType = SupportRequestType.TESTIMONIO;
    if (data.type === 'COMPLAINT') dbType = SupportRequestType.COMPLAINT;
    if (data.type === 'IDEA') dbType = SupportRequestType.IDEA;
    if (data.type === 'REUNION') dbType = SupportRequestType.REUNION;

    // 1. Save request to DB
    const fullMessage = data.subject
      ? `[${data.subject}] ${data.message}`
      : data.message;

    const request = await this.prisma.supportRequest.create({
      data: {
        email: data.email,
        message: fullMessage,
        type: dbType,
        status: SupportRequestStatus.PENDING,
      },
    });

    if (data.type === 'REUNION' || dbType === SupportRequestType.REUNION) {
      this.mailService
        .sendMeetingRequestEmail({
          userEmail: data.email,
          subject: data.subject || 'Solicitud de reunión',
          message: data.message || 'Sin detalle',
        })
        .catch((err) =>
          console.error('Error enviando email de solicitud de reunión:', err),
        );
    }

    return request;
  }

  async findAll() {
    return this.prisma.supportRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolve(id: string, adminMessage?: string) {
    return this.reply(
      id,
      adminMessage?.trim() ||
        'Hemos revisado tu mensaje y te responderemos pronto.',
    );
  }

  async reply(id: string, replyMessage: string) {
    const normalizedReply = replyMessage.trim();

    if (!normalizedReply) {
      throw new BadRequestException('La respuesta no puede estar vacía');
    }

    const request = await this.prisma.supportRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new BadRequestException('Solicitud no encontrada');
    }

    if (request.status === SupportRequestStatus.RESOLVED) {
      return request;
    }

    const updatedRequest = await this.prisma.supportRequest.update({
      where: { id },
      data: { status: SupportRequestStatus.RESOLVED },
    });

    this.mailService
      .sendSupportReplyEmail({
        email: request.email,
        originalMessage: request.message || undefined,
        type: request.type,
        replyMessage: normalizedReply,
      })
      .catch((err) => console.error('Error sending support reply email:', err));

    return updatedRequest;
  }

  async remove(id: string) {
    return this.prisma.supportRequest.delete({
      where: { id },
    });
  }

  async removeResolved() {
    return this.prisma.supportRequest.deleteMany({
      where: { status: SupportRequestStatus.RESOLVED },
    });
  }
}
