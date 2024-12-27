import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BasketService {
  constructor(private readonly prisma: PrismaService) {}

  // Добавление продукта в корзину или обновление количества
  async addProductToBasket(userId: number, productId: any, quantity: any) {
    const validProductId = Number(productId);
    const validQuantity = Number(quantity);

    if (!validProductId || isNaN(validProductId)) {
      throw new Error('Invalid product ID');
    }
    if (!validQuantity || isNaN(validQuantity) || validQuantity <= 0) {
      throw new Error('Invalid quantity');
    }

    const basket = await this.prisma.basket.findUnique({
      where: { user_id: userId },
    });

    if (!basket) {
      throw new Error('Корзина не найдена');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: validProductId },
    });

    if (!product) {
      throw new Error('Продукт не найден');
    }

    // Проверяем, существует ли продукт в корзине
    const existingProduct = await this.prisma.basketProduct.findUnique({
      where: {
        basket_id_product_id: {
          basket_id: basket.id,
          product_id: validProductId,
        },
      },
    });

    if (existingProduct) {
      // Если продукт уже есть в корзине, обновляем количество
      return this.prisma.basketProduct.update({
        where: {
          basket_id_product_id: {
            basket_id: basket.id,
            product_id: validProductId,
          },
        },
        data: {
          quantity: existingProduct.quantity + validQuantity,
        },
      });
    } else {
      // Если продукта нет, добавляем его в корзину
      return this.prisma.basketProduct.create({
        data: {
          basket_id: basket.id,
          product_id: validProductId,
          quantity: validQuantity,
        },
      });
    }
  }

  // Удаление продукта из корзины
  async removeProductFromBasket(userId: number, productId: any) {
    const validProductId = Number(productId);

    if (!validProductId || isNaN(validProductId)) {
      throw new Error('Invalid product ID');
    }

    const basket = await this.prisma.basket.findUnique({
      where: { user_id: userId },
    });

    if (!basket) {
      throw new Error('Корзина не найдена');
    }

    // Удаляем продукт из корзины
    return this.prisma.basketProduct.delete({
      where: {
        basket_id_product_id: {
          basket_id: basket.id,
          product_id: validProductId,
        },
      },
    });
  }

  // Получить все продукты в корзине пользователя
  async getBasketProducts(userId: number) {
    return this.prisma.basketProduct.findMany({
      where: {
        basket: {
          user_id: userId,
        },
      },
      include: {
        product: true,
      },
    });
  }

  // Обновление количества продукта в корзине
  async updateProductQuantity(userId: number, productId: any, quantity: any) {
    const validProductId = Number(productId);
    const validQuantity = Number(quantity);

    if (!validProductId || isNaN(validProductId)) {
      throw new Error('Invalid product ID');
    }
    if (!validQuantity || isNaN(validQuantity) || validQuantity <= 0) {
      throw new Error('Invalid quantity');
    }

    const basket = await this.prisma.basket.findUnique({
      where: { user_id: userId },
    });

    if (!basket) {
      throw new Error('Корзина не найдена');
    }

    const productInBasket = await this.prisma.basketProduct.findUnique({
      where: {
        basket_id_product_id: {
          basket_id: basket.id,
          product_id: validProductId,
        },
      },
    });

    if (!productInBasket) {
      throw new Error('Продукт не найден в корзине');
    }

    // Обновляем количество
    return this.prisma.basketProduct.update({
      where: {
        basket_id_product_id: {
          basket_id: basket.id,
          product_id: validProductId,
        },
      },
      data: {
        quantity: validQuantity,
      },
    });
  }

  async clearBasket(userId: number) {
    const basket = await this.prisma.basket.findUnique({
      where: { user_id: userId },
    });

    if (!basket) {
      throw new Error('Корзина не найдена');
    }

    // Удаляем все продукты из корзины
    return this.prisma.basketProduct.deleteMany({
      where: {
        basket_id: basket.id,
      },
    });
  }
}
