import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from '@prisma/client';
import slugify from 'slugify';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

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
    },
  ): Promise<Product> {
    const { productInfo, characteristics, ...productData } = data;

    return this.prisma.$transaction(async (prisma) => {
      // Step 1: Update the product
      const product = await prisma.product.update({
        where: { id },
        data: {
          ...productData,
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
        // Delete existing characteristics for the product
        await prisma.productCharacteristic.deleteMany({
          where: { productId: id },
        });

        // Add new characteristics
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
                typeId: product.typeId,
              },
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
}
