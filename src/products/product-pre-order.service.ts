import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PreOrder } from '@prisma/client';
import { ProductNotificationService } from './product-notification.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class ProductPreOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: ProductNotificationService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createPreOrder(
    userId: number,
    productId: number,
    phoneNumber: string,
  ): Promise<PreOrder> {
    // Find product by ID to get its name
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Create pre-order
    const preOrder = await this.prisma.preOrder.create({
      data: { userId, productId },
    });

    // Send WhatsApp notification
    const message = `Client with number ${phoneNumber} has pre-ordered the product "${product.name}"`;
    await this.notificationService.sendWhatsAppMessage(message);

    return preOrder;
  }

  async notifyPreOrderUsers(productId: number): Promise<void> {
    // Find all pre-orders for this product
    const preOrders = await this.prisma.preOrder.findMany({
      where: { productId },
      include: {
        user: true,
        product: true,
      },
    });

    // Send notifications and delete pre-orders
    for (const preOrder of preOrders) {
      await this.notificationsService.createNotification(
        preOrder.userId,
        `Product "${preOrder.product.name}" is now available!`,
      );

      // Delete pre-order after notification
      await this.prisma.preOrder.delete({
        where: { id: preOrder.id },
      });
    }
  }

  async getUserPreOrders(userId: number) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.prisma.preOrder.findMany({
      where: {
        userId: userId,
      },
      include: {
        product: {
          include: {
            productInfo: true,
            productCharacteristics: {
              include: {
                characteristic: true,
              },
            },
          },
        },
      },
    });
  }
}
