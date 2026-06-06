import { Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { MailService } from '../mail/mail.service';

const NUTRITIONIST_ROLES: UserRole[] = [
  UserRole.NUTRITIONIST,
  UserRole.NUTRITIONIST_DEVELOPER,
];

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);
  private readonly resendBatchSize = 5;
  private readonly resendBatchPauseMs = 1100;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private normalizeEmails(emailList?: string) {
    return Array.from(
      new Set(
        (emailList || '')
          .split(/\r?\n/)
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
    );
  }

  async create(data: CreateAnnouncementDto) {
    const targetRoles = data.targetRoles?.length ? data.targetRoles : ['ALL'];
    const isAll = targetRoles.includes('ALL');
    const commType = data.commType || 'announcement';
    const targetMode = data.targetMode || 'all';

    const recipientRoles: UserRole[] = isAll
      ? []
      : targetRoles.flatMap((role) => {
          if (role === 'ADMIN') return [UserRole.ADMIN, UserRole.ADMIN_MASTER, UserRole.ADMIN_GENERAL];
          if (role === 'NUTRITIONIST') return NUTRITIONIST_ROLES;
          return [];
        });

    const recipients =
      targetMode === 'all'
        ? await this.prisma.account.findMany({
            where: {
              status: 'ACTIVE',
              ...(isAll ? {} : { role: { in: recipientRoles } }),
            },
            select: { id: true, email: true },
          })
        : targetMode === 'specific'
          ? await this.prisma.account.findMany({
              where: {
                status: 'ACTIVE',
                id: data.specificUserId,
                ...(isAll ? {} : { role: { in: recipientRoles } }),
              },
              select: { id: true, email: true },
            })
          : await this.prisma.account.findMany({
              where: {
                status: 'ACTIVE',
                email: { in: this.normalizeEmails(data.emailList) },
                ...(isAll ? {} : { role: { in: recipientRoles } }),
              },
              select: { id: true, email: true },
            });

    const directEmails =
      targetMode === 'list' ? this.normalizeEmails(data.emailList) : [];
    const mailRecipients =
      targetMode === 'list'
        ? Array.from(new Set([...directEmails, ...recipients.map((r) => r.email)]))
        : recipients.map((r) => r.email);

    if (targetMode !== 'all' && recipients.length === 0 && mailRecipients.length === 0) {
      throw new Error('No se encontraron destinatarios válidos');
    }

    const announcement = await this.prisma.$transaction(async (tx) => {
      const announcement = await tx.announcement.create({
        data: {
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          link: data.link,
          targetRoles,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (commType === 'announcement' && recipients.length > 0) {
        await tx.notification.createMany({
          data: recipients.map((account) => ({
            accountId: account.id,
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            link: data.link || null,
            metadata: {
              source: 'announcement',
              announcementId: announcement.id,
              targetRoles,
            },
          })),
        });
      }

      return announcement;
    });

    if (commType === 'email' && mailRecipients.length > 0) {
      const failures: Array<{ email: string; reason: unknown }> = [];

      for (let i = 0; i < mailRecipients.length; i += this.resendBatchSize) {
        const batch = mailRecipients.slice(i, i + this.resendBatchSize);
        const results = await Promise.allSettled(
          batch.map((email) =>
            this.mailService.sendAnnouncementEmail({
              email,
              title: data.title,
              message: data.message,
              link: data.link,
            }),
          ),
        );

        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            failures.push({
              email: batch[index],
              reason: result.reason,
            });
          }
        });

        if (i + this.resendBatchSize < mailRecipients.length) {
          await this.sleep(this.resendBatchPauseMs);
        }
      }

      if (failures.length > 0) {
        this.logger.error(
          `Fallaron ${failures.length} correos de anuncio`,
          String(failures[0].reason),
        );
        throw new Error('No se pudieron enviar todos los correos');
      }
    }

    return announcement;
  }

  async findAll() {
    return this.prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
