import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  // Сервис
  async addFavorite(userId: number, productId: number) {
    // Проверка на существование товара
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Добавление товара в избранное
    return this.prisma.favorite.create({
      data: {
        user_id: userId,
        product_id: productId,
      },
    });
  }

  async removeFavorite(userId: number, productId: number) {
    // Удаление товара из избранного
    return this.prisma.favorite.deleteMany({
      where: {
        user_id: Number(userId),
        product_id: productId,
      },
    });
  }

  async getUserFavorites(userId: number) {
    // Получение всех избранных товаров пользователя
    return this.prisma.favorite.findMany({
      where: { user_id: Number(userId) },
      include: { product: true }, // Включение информации о товаре
    });
  }
}
