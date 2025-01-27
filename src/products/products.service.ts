import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from '@prisma/client';
import slugify from 'slugify';
import { NotificationsService } from 'src/notifications/notifications.service';
import * as twilio from 'twilio';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private twilioClient = twilio(
    process.env.TWILIO_SID, // SID из переменных окружения
    process.env.TWILIO_AUTH_TOKEN, // Auth Token из переменных окружения
  );

  private companyWhatsAppNumber = process.env.COMPANY_WHATSAPP_NUMBER;

  async createProduct(data: {
    name: string;
    price: number | string;
    cover_image: string;
    images: string[];
    typeId: number | string;
    productInfo?: {
      title: string;
      description: string;
    };
    stock: number; // Новое поле
    characteristics?: { name: string; description: string }[];
  }): Promise<Product> {
    const { productInfo, characteristics, ...productData } = data;

    return this.prisma.$transaction(async (prisma) => {
      // Step 1: Create the product
      const product = await prisma.product.create({
        data: {
          ...productData,
          price: parseFloat(data.price as string),
          typeId: parseInt(data.typeId as string, 10),
          stock: data.stock, // Установить начальное количество
          productInfo: productInfo ? { create: productInfo } : undefined,
        },
      });

      // Step 2: Handle characteristics
      if (characteristics && characteristics.length > 0) {
        for (const char of characteristics) {
          if (!char.name || !char.description) continue; // Skip invalid entries

          // Find or create characteristic
          const existingChar = await prisma.characteristic.findUnique({
            where: { name: char.name },
          });

          const characteristic =
            existingChar ||
            (await prisma.characteristic.create({
              data: {
                name: char.name,
                typeId: parseInt(data.typeId as string, 10),
              },
            }));

          // Link characteristic to product
          await prisma.productCharacteristic.create({
            data: {
              productId: product.id,
              characteristicId: characteristic.id,
              description: char.description,
            },
          });
        }
      }
      return product;
    });
  }

  async getAllProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({
      include: {
        productInfo: true,
        ratings: true,
        productCharacteristics: {
          include: { characteristic: true },
        },
      },
    });
  }
  // async getProductById(id: number): Promise<Product | null> {
  //   return this.prisma.product.findUnique({
  //     where: {
  //       id, // Ensure `id` is correctly passed
  //     },
  //     include: {
  //       productInfo: true,
  //       ratings: true,
  //       productCharacteristics: {
  //         include: {
  //           characteristic: true,
  //         },
  //       },
  //     },
  //   });
  // }

  // В ProductsService
  async updateProduct(
    id: number,
    data: {
      name?: string;
      price?: number;
      cover_image?: string;
      images?: string[];
      typeId?: number;
      productInfo?: { title: string; description: string };
      characteristics?: { name: string; description: string }[];
    },
  ): Promise<Product> {
    const {
      productInfo,
      characteristics,
      cover_image,
      images,
      ...productData
    } = data;

    return this.prisma.$transaction(async (prisma) => {
      // Step 1: Update the product
      const product = await prisma.product.update({
        where: { id },
        data: {
          ...productData,
          cover_image: cover_image || undefined, // Обновление обложки
          images: images && images.length > 0 ? images : undefined, // Обновление изображений
          price: data.price ? parseFloat(data.price as any) : undefined,
          typeId: data.typeId ? parseInt(data.typeId as any, 10) : undefined,
        },
      });

      // Step 2: Update or create `productInfo`
      if (productInfo) {
        await prisma.productInfo.upsert({
          where: { product_id: id },
          update: productInfo,
          create: {
            ...productInfo,
            product_id: id,
          },
        });
      }

      // Step 3: Handle characteristics
      if (characteristics && characteristics.length > 0) {
        // Delete existing characteristics
        await prisma.productCharacteristic.deleteMany({
          where: { productId: id },
        });

        // Add new characteristics
        for (const char of characteristics) {
          if (!char.name || !char.description) continue;

          // Find or create characteristic
          const existingChar = await prisma.characteristic.findUnique({
            where: { name: char.name },
          });

          const characteristic =
            existingChar ||
            (await prisma.characteristic.create({
              data: { name: char.name, typeId: data.typeId || product.typeId },
            }));

          await prisma.productCharacteristic.create({
            data: {
              productId: id,
              characteristicId: characteristic.id,
              description: char.description,
            },
          });
        }
      }

      return product;
    });
  }

  async getProductByName(name: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { name },
      include: {
        productInfo: true,
        ratings: true,
        productCharacteristics: {
          include: { characteristic: true },
        },
      },
    });
  }

  async deleteProduct(id: number): Promise<Product> {
    return this.prisma.$transaction(async (prisma) => {
      // Delete related ProductInfo, if it exists
      await prisma.productInfo.deleteMany({
        where: { product_id: id },
      });

      // Delete related BasketProduct entries
      await prisma.basketProduct.deleteMany({
        where: { product_id: id },
      });

      // Delete related ProductCharacteristics entries
      await prisma.productCharacteristic.deleteMany({
        where: { productId: id },
      });

      // Delete related Rating entries
      await prisma.rating.deleteMany({
        where: { product_id: id },
      });

      // Delete related Favorite entries
      await prisma.favorite.deleteMany({
        where: { product_id: id },
      });

      // Finally, delete the Product itself
      return prisma.product.delete({
        where: { id },
      });
    });
  }
  async updateProductStock(productId: number, stock: number): Promise<Product> {
    return this.prisma.product.update({
      where: { id: productId },
      data: { stock },
    });
  }

  async addCharacteristics(
    productId: number,
    characteristics: { name: string; description: string; typeId?: number }[],
  ) {
    // Retrieve `typeId` from the product if not provided
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { typeId: true },
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    for (const char of characteristics) {
      const typeId = char.typeId ?? product.typeId; // Use provided `typeId` or fallback to product's `typeId`

      // Find or create the characteristic by `name` and `typeId`
      const characteristic = await this.prisma.characteristic.upsert({
        where: { name: char.name },
        update: {},
        create: {
          name: char.name,
          typeId,
        },
      });

      // Add a record in `ProductCharacteristic`
      await this.prisma.productCharacteristic.create({
        data: {
          productId,
          characteristicId: characteristic.id,
          description: char.description,
        },
      });
    }
  }
  async updateStock(productId: number, newStock: number): Promise<Product> {
    if (newStock < 0) {
      throw new Error('Stock cannot be negative');
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    // Если количество товара увеличилось, уведомить пользователей
    if (newStock > 0) {
      await this.notifyPreOrderUsers(productId);
    }

    return product;
  }

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

  async getProductBySlug(slug: string): Promise<Product | null> {
    // Преобразуем `slug` обратно в имя для поиска в базе данных
    const allProducts = await this.prisma.product.findMany({
      include: {
        productInfo: true,
        ratings: true,
        productCharacteristics: {
          include: { characteristic: true },
        },
      },
    });

    // Ищем продукт, где `slugify(product.name)` соответствует `slug`
    return (
      allProducts.find(
        (product) => slugify(product.name, { lower: true }) === slug,
      ) || null
    );
  }
  async createPreOrder(userId: number, productId: number, phoneNumber: string) {
    // Найти товар по ID, чтобы получить его название
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { name: true }, // Запрашиваем только поле name
    });

    if (!product) {
      throw new Error(`Товар с ID ${productId} не найден`);
    }

    // Создать предзаказ
    const preOrder = await this.prisma.preOrder.create({
      data: { userId, productId },
    });

    // Отправить сообщение через WhatsApp
    const message = `Клиент с номером ${phoneNumber} сделал предзаказ на товар "${product.name}"`;
    await this.sendWhatsAppMessage(message);

    return preOrder;
  }

  async notifyPreOrderUsers(productId: number) {
    // Find all pre-orders for this product
    const preOrders = await this.prisma.preOrder.findMany({
      where: { productId },
      include: {
        user: true,
        product: true, // Add this to include product details
      },
    });

    // Send notifications and delete pre-orders
    for (const preOrder of preOrders) {
      await this.notificationsService.createNotification(
        preOrder.userId,
        `Товар "${preOrder.product.name}" теперь доступен!`,
      );

      // Optional: Delete pre-order after notification
      await this.prisma.preOrder.delete({
        where: { id: preOrder.id },
      });
    }
  }

  // In ProductsService
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
