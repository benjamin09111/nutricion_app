import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getMine(accountId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = notifications.filter(
      (notification) => !notification.readAt,
    ).length;

    return {
      notifications: notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        date: notification.createdAt,
        read: Boolean(notification.readAt),
      })),
      unreadCount,
    };
  }

  async createForAccount(data: {
    accountId: string;
    title: string;
    message: string;
    type?: string;
    link?: string | null;
    metadata?: Record<string, any>;
  }) {
    return this.prisma.notification.create({
      data: {
        accountId: data.accountId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        link: data.link || null,
        metadata: data.metadata || {},
      },
    });
  }

  async markAsRead(accountId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        accountId,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(accountId: string) {
    return this.prisma.notification.updateMany({
      where: {
        accountId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async delete(accountId: string, notificationId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        accountId,
      },
    });
  }
}
