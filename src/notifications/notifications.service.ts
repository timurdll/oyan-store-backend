import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotificationsGateway } from './gateways/notifications.gateways';

@Injectable()
export class NotificationsService {
  private prisma = new PrismaClient();

  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  async createNotification(userId: number, message: string) {
    // Сохраняем уведомление в базе данных
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        message,
      },
    });

    // Отправляем уведомление через WebSocket
    this.notificationsGateway.sendNotification(userId, message);

    return notification;
  }

  async getUserNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAllNotificationsAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
