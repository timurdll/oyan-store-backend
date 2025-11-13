import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrderStatus } from '@prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';
import { OrdersGateway } from './gateways/orders.gateways';
import { PrismaService } from 'src/prisma/prisma.service';
import { TelegramBotsService } from 'src/telegram-bots/telegram-bots.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly ordersGateway: OrdersGateway,
    private readonly telegramBotsService: TelegramBotsService,
  ) {}

  // 3 процента

  async createOrder(userId: number, orderData: any) {
    const { product, totalAmount, legalEntityInfo } = orderData;

    if (!Array.isArray(product) || product.length === 0) {
      throw new Error('Product list is empty or undefined');
    }

    for (const item of product) {
      const productData = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!productData) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      if (productData.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for product ID ${item.productId}. Available: ${productData.stock}, Requested: ${item.quantity}`,
        );
      }
    }

    const order = await this.prisma.$transaction(async (transactionalPrisma) => {
      const createdOrder = await transactionalPrisma.order.create({
        data: {
          user: { connect: { id: userId } },
          totalPrice: totalAmount,
          phoneNumber: orderData.phoneNumber,
          products: {
            create: product.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
          // Add legal entity info if provided
          ...(legalEntityInfo && {
            legalEntityInfo: JSON.stringify(legalEntityInfo),
          }),
        },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      });

      for (const item of product) {
        await transactionalPrisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      return createdOrder;
    });

    const message = this.createOrderNotificationMessage(
      orderData,
      order.products,
      totalAmount,
    );

    await this.telegramBotsService.sendMessageToActiveBots(message);

    return order;
  }

  private createOrderNotificationMessage(
    orderData: {
      phoneNumber: string;
      fullName: string;
      email: string;
      address: any;
      paymentData: any;
      legalEntityInfo?: {
        companyName: string;
        bin: string;
        companyAddress: string;
        companyPhone: string;
        postalCode: string;
        iik: string;
        bik: string;
        bankName: string;
      };
    },
    products: {
      productId: number;
      quantity: number;
      product: { name: string };
    }[],
    totalAmount: number,
  ): string {
    let message = `Новый заказ!\n\n`;

    // Добавляем информацию о юридическом лице, если она есть
    if (orderData.legalEntityInfo) {
      message += `=== ЮРИДИЧЕСКОЕ ЛИЦО ===\n`;
      message += `Компания: ${orderData.legalEntityInfo.companyName}\n`;
      message += `БИН: ${orderData.legalEntityInfo.bin}\n`;
      message += `Юр. адрес: ${orderData.legalEntityInfo.companyAddress}\n`;
      message += `Почтовый индекс: ${orderData.legalEntityInfo.postalCode}\n`;
      message += `Телефон компании: ${orderData.legalEntityInfo.companyPhone}\n`;
      message += `ИИК: ${orderData.legalEntityInfo.iik}\n`;
      message += `БИК: ${orderData.legalEntityInfo.bik}\n`;
      message += `Банк: ${orderData.legalEntityInfo.bankName}\n\n`;
    }

    // Информация о контактном лице
    message += `=== КОНТАКТНАЯ ИНФОРМАЦИЯ ===\n`;
    message += `Имя: ${orderData.fullName}\n`;
    message += `Телефон: ${orderData.phoneNumber}\n`;
    message += `Email: ${orderData.email}\n\n`;

    // Адрес доставки
    message += `=== АДРЕС ДОСТАВКИ ===\n`;
    message += `Город: ${orderData.address.city}\n`;
    message += `Улица: ${orderData.address.street}\n`;
    message += `Дом: ${orderData.address.houseNumber}\n`;
    message += `Подъезд: ${orderData.address.entrance || 'Не указан'}\n`;
    message += `Квартира: ${orderData.address.apartment || 'Не указана'}\n\n`;

    // Информация об оплате и заказе
    const paymentMethods =
      orderData.paymentData?.paymentMethod?.length > 0
        ? orderData.paymentData.paymentMethod.join(', ')
        : 'Не указано';
    message += `=== ИНФОРМАЦИЯ О ЗАКАЗЕ ===\n`;
    message += `Способ оплаты: ${paymentMethods}\n`;
    message += `Общая стоимость: ${totalAmount}₸\n\n`;

    // Список продуктов
    message += `=== ТОВАРЫ ===\n`;
    products.forEach((item) => {
      message += `- ${item.product.name}, Количество: ${item.quantity}\n`;
    });

    return message;
  }

  // Получение всех заказов пользователя
  async getUserOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async quickPurchase(
    fullName: string,
    phoneNumber: string,
    productId: number,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    const message = `Запрос на быструю покупку:\nПользователь: ${fullName}\nТелефон: ${phoneNumber}\nТовар: ${product.name}`;

    await this.telegramBotsService.sendMessageToActiveBots(message);

    return { success: true, message: 'Запрос на быструю покупку отправлен' };
  }

  // Получение одного заказа
  async getOrderById(orderId: number) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        products: true,
      },
    });
  }

  // Обновление состояния заказа
  async updateOrderStatus(orderId: number, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    const notificationMessage = this.getNotificationMessageForStatus(
      status,
      order,
    );
    await this.notificationsService.createNotification(
      order.user.id,
      notificationMessage,
    );

    this.ordersGateway.sendOrderUpdate(orderId, status);

    return updatedOrder;
  }
  // Генерация текста уведомления для разных статусов заказа
  private getNotificationMessageForStatus(
    status: OrderStatus,
    order: any,
  ): string {
    switch (status) {
      case OrderStatus.PENDING:
        return `Ваш заказ №${order.id} находится в обработке.`;
      case OrderStatus.CONFIRMED:
        return `Ваш заказ №${order.id} подтвержден и ожидает оплаты.`;
      case OrderStatus.PAID:
        return `Ваш заказ №${order.id} был отправлен. Скоро вы получите его!`;
      case OrderStatus.COMPLETED:
        return `Ваш заказ №${order.id} был успешно завершен. Спасибо за покупку!`;
      case OrderStatus.CANCELED:
        return `Ваш заказ №${order.id} был отменен. Если у вас есть вопросы, свяжитесь с поддержкой.`;
    }
  }

  @Cron('0 0 * * *') // Выполняется ежедневно в полночь
  async processHoldingBonuses() {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const users = await this.prisma.user.findMany({
      where: {
        holdingBonuses: { gt: 0 },
        orders: {
          some: {
            status: OrderStatus.COMPLETED,
            updatedAt: { lte: fourteenDaysAgo },
          },
        },
      },
    });

    for (const user of users) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          bonuses: { increment: user.holdingBonuses },
          holdingBonuses: 0,
        },
      });
    }
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        products: {
          include: {
            product: true, // Включаем информацию о продукте
          },
        },
      },
    });
  }
}
