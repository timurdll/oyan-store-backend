import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { Characteristic, ProductCharacteristic } from '@prisma/client';

@Injectable()
export class ProductCharacteristicsService {
  constructor(private readonly prisma: PrismaService) {}

  async addCharacteristics(
    productId: number,
    characteristics: { name: string; description: string; typeId?: number }[],
  ): Promise<void> {
    // Get typeId from product if not provided
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { typeId: true },
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    for (const char of characteristics) {
      const typeId = char.typeId ?? product.typeId;

      // Find or create characteristic
      const characteristic = await this.prisma.characteristic.upsert({
        where: { name: char.name },
        update: {},
        create: {
          name: char.name,
          typeId,
        },
      });

      // Add record in ProductCharacteristic
      await this.prisma.productCharacteristic.create({
        data: {
          productId,
          characteristicId: characteristic.id,
          description: char.description,
        },
      });
    }
  }

  async getFilteredProducts(typeId?: number, limit?: number) {
    return this.prisma.product.findMany({
      where: typeId ? { typeId } : {},
      take: limit ?? undefined,
      include: {
        translations: true,
        type: { include: { translations: true } },
      },
    });
  }

  async updateProductCharacteristics(
    productId: number,
    characteristics: { name: string; description: string }[],
    typeId?: number,
  ): Promise<void> {
    if (!characteristics || characteristics.length === 0) return;

    await this.prisma.productCharacteristic.deleteMany({
      where: { productId },
    });

    // Get product typeId if not provided
    if (!typeId) {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { typeId: true },
      });

      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      typeId = product.typeId;
    }

    for (const char of characteristics) {
      if (!char.name || !char.description) {
        throw new Error('Characteristic name and description are required');
      }

      const existingChar = await this.prisma.characteristic.findUnique({
        where: { name: char.name },
      });

      const characteristic =
        existingChar ||
        (await this.prisma.characteristic.create({
          data: {
            name: char.name,
            typeId,
          },
        }));

      await this.prisma.productCharacteristic.create({
        data: {
          productId,
          characteristicId: characteristic.id,
          description: char.description,
        },
      });
    }
  }
}
