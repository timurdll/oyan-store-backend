import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaClient, OrderStatus } from '@prisma/client';
import * as twilio from 'twilio';

@Injectable()
export class OrdersService {
  private prisma = new PrismaClient();

  private twilioClient = twilio(
    process.env.TWILIO_SID, // SID из переменных окружения
    process.env.TWILIO_AUTH_TOKEN, // Auth Token из переменных окружения
  );

  private companyWhatsAppNumber = process.env.COMPANY_WHATSAPP_NUMBER;

  // 3 процента

  // Создание нового заказа
  async createOrder(userId: number, orderData: any) {
    const { product, phoneNumber, address, paymentData, totalAmount } =
      orderData;

    // Создаем заказ в базе данных
    if (!Array.isArray(product) || product.length === 0) {
      throw new Error('Product list is empty or undefined');
    }

    const order = await this.prisma.order.create({
      data: {
        user: { connect: { id: userId } },
        totalPrice: totalAmount,
        phoneNumber: phoneNumber,
        products: {
          create: product.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        products: {
          include: {
            product: true, // Включаем информацию о продукте
          },
        },
      },
    });

    // Формируем сообщение для отправки
    const message = this.createWhatsAppMessage(
      orderData,
      order.products,
      totalAmount,
    );

    // Отправляем сообщение на WhatsApp
    await this.sendWhatsAppMessage(message);

    return order;
  }

  // Генерация сообщения для WhatsApp
  private createWhatsAppMessage(
    orderData: {
      phoneNumber: string;
      fullName: string;
      email: string;
      address: any;
      paymentData: any;
    },
    products: {
      productId: number;
      quantity: number;
      product: { name: string };
    }[], // Add 'product' with 'name'
    totalAmount: number,
  ): string {
    let message = `Новый заказ!\n\n`;
    message += `Имя: ${orderData.fullName}\n`;
    message += `Телефон: ${orderData.phoneNumber}\n`;
    message += `Email: ${orderData.email}\n`;
    message += `Город: ${orderData.address.city}\n`;
    message += `Улица: ${orderData.address.street}\n`;
    message += `Дом: ${orderData.address.houseNumber}\n`;
    message += `Подъезд: ${orderData.address.entrance || 'Не указан'}\n`;
    message += `Квартира: ${orderData.address.apartment}\n`;
    message += `Способ оплаты: ${orderData.paymentData.paymentMethod.join(', ')}\n`;
    message += `Общая стоимость: ${totalAmount}₸\n\n`;
    message += `Продукты в заказе:\n`;

    products.forEach((item) => {
      message += `Продукт: ${item.product.name}, Количество: ${item.quantity}\n`; // Access the product name here
    });

    return message;
  }

  // Отправка сообщения на WhatsApp
  private async sendWhatsAppMessage(message: string) {
    try {
      await this.twilioClient.messages.create({
        from: 'whatsapp:+14155238886', // Ваш Twilio номер WhatsApp
        to: this.companyWhatsAppNumber, // Номер компании, на который отправляется сообщение
        body: message,
      });
      console.log('Сообщение отправлено на WhatsApp');
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
    }
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

    if (!order) throw new Error('Order not found');

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // Начисление бонусов при завершении заказа
    if (status === OrderStatus.COMPLETED) {
      const bonuses = order.totalPrice * 0.03; // 3% от общей суммы заказа
      await this.prisma.user.update({
        where: { id: order.userId },
        data: {
          holdingBonuses: { increment: bonuses },
        },
      });
    }

    return updatedOrder;
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
