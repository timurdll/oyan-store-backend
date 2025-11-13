import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from '@prisma/client';
import slugify from 'slugify';
import { NotificationsService } from 'src/notifications/notifications.service';
import { TelegramBotsService } from 'src/telegram-bots/telegram-bots.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly telegramBotsService: TelegramBotsService,
  ) {}

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
    stock: number;
    characteristics?: { name: string; description: string }[];
    // Новые поля для маркетплейс ссылок
    halyqLink?: string;
    kaspiLink?: string;
    satuLink?: string;
  }): Promise<Product> {
    const {
      productInfo,
      characteristics,
      halyqLink,
      kaspiLink,
      satuLink,
      ...productData
    } = data;

    return this.prisma.$transaction(async (prisma) => {
      // Шаг 1: Создание товара с добавлением ссылок на маркетплейсы
      const product = await prisma.product.create({
        data: {
          ...productData,
          price: parseFloat(data.price as string),
          typeId: parseInt(data.typeId as string, 10),
          stock: data.stock,
          halyqLink, // Ссылка на маркетплейс "Халык"
          kaspiLink, // Ссылка на маркетплейс "Каспи"
          satuLink, // Ссылка на маркетплейс "Сату"
          productInfo: productInfo ? { create: productInfo } : undefined,
        },
      });

      // Шаг 2: Обработка характеристик
      if (characteristics && characteristics.length > 0) {
        for (const char of characteristics) {
          if (!char.name || !char.description) continue;

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
  async filterProducts(params: {
    limit?: number;
    offset?: number;
    typeId?: number;
    q?: string;
    inStock?: boolean;
    language?: string; // accepted but currently unused
  }): Promise<{ products: Product[]; total: number }> {
    const { limit, offset, typeId, q, inStock } = params;
    const where: any = {};
    if (typeof typeId === 'number') {
      where.typeId = typeId;
    }
    if (typeof inStock === 'boolean') {
      where.stock = inStock ? { gt: 0 } : { lte: 0 };
    }
    if (q && q.trim().length > 0) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        {
          productInfo: {
            is: {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }
    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        take: typeof limit === 'number' ? limit : undefined,
        skip: typeof offset === 'number' ? offset : undefined,
        include: {
          productInfo: true,
          ratings: true,
          productCharacteristics: {
            include: { characteristic: true },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { products, total };
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
  async getProductById(id: number): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        productInfo: true,
        ratings: true,
        productCharacteristics: {
          include: { characteristic: true },
        },
      },
    });
  }

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
      // Новые поля для маркетплейс ссылок
      halyqLink?: string;
      kaspiLink?: string;
      satuLink?: string;
    },
  ): Promise<Product> {
    const {
      productInfo,
      characteristics,
      cover_image,
      images,
      halyqLink,
      kaspiLink,
      satuLink,
      ...productData
    } = data;

    return this.prisma.$transaction(async (prisma) => {
      // Шаг 1: Обновление товара с учетом новых полей
      const product = await prisma.product.update({
        where: { id },
        data: {
          ...productData,
          cover_image: cover_image || undefined,
          images: images && images.length > 0 ? images : undefined,
          price: data.price ? parseFloat(data.price as any) : undefined,
          typeId: data.typeId ? parseInt(data.typeId as any, 10) : undefined,
          halyqLink, // Обновляем ссылку "Халык"
          kaspiLink, // Обновляем ссылку "Каспи"
          satuLink, // Обновляем ссылку "Сату"
        },
      });

      // Шаг 2: Обновление или создание productInfo
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

      // Шаг 3: Обработка характеристик
      if (characteristics && characteristics.length > 0) {
        await prisma.productCharacteristic.deleteMany({
          where: { productId: id },
        });

        for (const char of characteristics) {
          if (!char.name || !char.description) continue;

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

  private async notifyAdminsAboutPreOrder(message: string) {
    await this.telegramBotsService.sendMessageToActiveBots(message);
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

    // Отправить сообщение через Telegram
    const message = `Клиент с номером ${phoneNumber} сделал предзаказ на товар "${product.name}"`;
    await this.notifyAdminsAboutPreOrder(message);

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
