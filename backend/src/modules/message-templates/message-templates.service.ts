import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { UpdateMessageTemplateDto } from './dto/update-message-template.dto';

type MessageTemplatePayload = {
  subject: string;
  content: string;
  fromEmail?: string;
};

@Injectable()
export class MessageTemplatesService {
  constructor(private prisma: PrismaService) {}

  private toResponse(template: {
    id: string;
    title: string;
    payload: unknown;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const payload = template.payload as MessageTemplatePayload;

    return {
      id: template.id,
      title: template.title,
      subject: payload?.subject || '',
      content: payload?.content || '',
      fromEmail: payload?.fromEmail || 'notificaciones@nutrinet.cl',
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  async findAll() {
    const templates = await this.prisma.messageTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return templates.map((template) => this.toResponse(template));
  }

  async create(data: CreateMessageTemplateDto) {
    const template = await this.prisma.messageTemplate.create({
      data: {
        title: data.title,
        payload: {
          subject: data.subject,
          content: data.content,
          fromEmail: data.fromEmail || 'notificaciones@nutrinet.cl',
        },
      },
    });

    return this.toResponse(template);
  }

  async update(id: string, data: UpdateMessageTemplateDto) {
    const existing = await this.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    const current = existing.payload as MessageTemplatePayload;

    const template = await this.prisma.messageTemplate.update({
      where: { id },
      data: {
        title: data.title ?? existing.title,
        payload: {
          subject: data.subject ?? current?.subject ?? '',
          content: data.content ?? current?.content ?? '',
          fromEmail:
            data.fromEmail ?? current?.fromEmail ?? 'notificaciones@nutrinet.cl',
        },
      },
    });

    return this.toResponse(template);
  }

  async remove(id: string) {
    const existing = await this.prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    return this.prisma.messageTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
